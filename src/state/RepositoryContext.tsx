import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { IFileSystem } from '@/types/filesystem';
import { ProjectInfo, ProjectEntry } from '@/types/project';
import { GitService } from '@/services/git/IGitService';
import { BrowserGitAdapter } from '@/services/git/BrowserGitAdapter';
import { MemoryFS } from '@/services/filesystem/MemoryFS';
import { projectManager, ProjectManager } from '@/services/project/ProjectManager';
import { projectRegistry } from '@/services/project/ProjectRegistry';
import { logger } from '@/services/logger/logger';
import { useConfig } from './ConfigContext';

interface RepositoryContextType {
  fileSystem: IFileSystem | null;
  gitService: GitService | null;
  projectInfo: ProjectInfo | null;
  activeProject: ProjectEntry | null;
  projects: ProjectEntry[];
  isOpen: boolean;
  needsPermission: boolean;
  projectManager: ProjectManager;
  requestActivePermission: () => Promise<boolean>;
  openDirectoryPicker: () => Promise<void>;
  openDirectoryHandle: (handle: FileSystemDirectoryHandle, autoOpen?: boolean) => Promise<ProjectEntry>;
  openVirtualProject: (sampleName?: string) => Promise<void>;
  switchProject: (id: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  setDefaultProject: (id: string) => Promise<void>;
  renameProject: (id: string, newDisplayName: string) => Promise<void>;
  reconnectProject: (id: string, handle?: FileSystemDirectoryHandle) => Promise<void>;
  initializeGit: (options: { defaultBranch: string; user: { name: string; email: string } }) => Promise<void>;
  closeRepository: () => void;
  refreshProjectInfo: () => Promise<void>;
  refreshProjectsList: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextType | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  const [fileSystem, setFileSystem] = useState<IFileSystem | null>(null);
  const [gitService, setGitService] = useState<GitService | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectEntry | null>(null);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);

  const refreshProjectsList = useCallback(async () => {
    const list = await projectManager.getProjects();
    setProjects(list);
  }, []);

  // Subscribe to ProjectManager state updates
  useEffect(() => {
    const unsubscribe = projectManager.subscribe((state) => {
      setFileSystem(state.fileSystem);
      setGitService(state.gitService);
      setProjectInfo(state.projectInfo);
      setActiveProject(state.project);
      setNeedsPermission(state.needsPermission);
      refreshProjectsList();
    });
    return unsubscribe;
  }, [refreshProjectsList]);

  const hasRestoredRef = useRef(false);

  // Startup restoration: load projects and open initial project according to settings (only once)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        const list = await projectManager.getProjects();
        if (!mounted) return;
        setProjects(list);

        if (list.length === 0) return;

        // If a project is already active or in process of opening, do not overwrite it
        if (projectManager.getActiveProject()) return;

        // Startup behavior setting
        const startup = (config as any).startupBehavior || 'lastProject';
        if (startup === 'projectManager') {
          // Do not auto-open project; show projects workspace
          return;
        }

        let targetId = list[0].id;
        if (startup === 'defaultProject') {
          const def = list.find((p) => p.isDefault);
          if (def) targetId = def.id;
        }

        await projectManager.openProject(targetId);
      } catch (err: any) {
        logger.debug('app', 'Startup project auto-open skipped', err?.message);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshProjectInfo = useCallback(async () => {
    if (!fileSystem || !activeProject) return;
    try {
      await projectManager.refreshProject(activeProject.id);
    } catch (err: any) {
      logger.error('app', 'Failed to refresh project info', err?.message);
    }
  }, [fileSystem, activeProject]);

  const switchProject = useCallback(async (id: string) => {
    await projectManager.switchProject(id);
  }, []);

  const removeProject = useCallback(async (id: string) => {
    await projectManager.removeProject(id);
    await refreshProjectsList();
  }, [refreshProjectsList]);

  const setDefaultProject = useCallback(async (id: string) => {
    await projectManager.setDefaultProject(id);
    await refreshProjectsList();
  }, [refreshProjectsList]);

  const renameProject = useCallback(async (id: string, newDisplayName: string) => {
    await projectManager.renameProject(id, newDisplayName);
    await refreshProjectsList();
  }, [refreshProjectsList]);

  const reconnectProject = useCallback(async (id: string, handle?: FileSystemDirectoryHandle) => {
    await projectManager.reconnectProject(id, handle);
    await refreshProjectsList();
  }, [refreshProjectsList]);

  const requestActivePermission = useCallback(async (): Promise<boolean> => {
    return await projectManager.requestPermissionForActiveProject();
  }, []);

  const openDirectoryHandle = useCallback(
    async (handle: FileSystemDirectoryHandle, autoOpen: boolean = true): Promise<ProjectEntry> => {
      logger.info('app', `Registering directory handle: ${handle.name}`);

      // Check if project is already registered by native handle identity
      const duplicate = await projectRegistry.findDuplicateHandle(handle);
      let entry: ProjectEntry;

      if (duplicate) {
        entry = duplicate;
        await projectRegistry.saveProject(entry, handle);
      } else {
        const all = await projectRegistry.listProjects();
        let displayName = handle.name;
        let counter = 1;
        while (all.some((p) => (p.displayName || p.name).toLowerCase() === displayName.toLowerCase())) {
          counter++;
          displayName = `${handle.name} (${counter})`;
        }

        entry = await projectManager.addProject(
          {
            name: handle.name,
            displayName,
            path: handle.name,
            provider: 'unknown',
          },
          handle
        );
      }

      await refreshProjectsList();

      if (autoOpen) {
        await projectManager.openProject(entry.id, handle);
      }
      return entry;
    },
    [refreshProjectsList]
  );

  const openDirectoryPicker = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or Brave, or try a virtual repository.'
      );
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      await openDirectoryHandle(handle, true);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.debug('app', 'User cancelled folder selection');
        return;
      }
      logger.error('app', 'Error selecting directory', err.message);
      throw err;
    }
  }, [openDirectoryHandle]);

  const openVirtualProject = useCallback(
    async (sampleName: string = 'react-vite-starter') => {
      logger.info('app', `Opening in-memory virtual repository: ${sampleName}`);
      const fs = new MemoryFS();

      // Populate a sample React + Vite starter project
      await fs.writeFile(
        'package.json',
        JSON.stringify(
          {
            name: sampleName,
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc -b && vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^19.0.0',
              'react-dom': '^19.0.0',
            },
            devDependencies: {
              vite: '^6.2.0',
              typescript: '^5.7.0',
            },
          },
          null,
          2
        )
      );

      await fs.writeFile(
        'vite.config.ts',
        `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`
      );
      await fs.writeFile(
        'README.md',
        `# ${sampleName}\n\nBuilt and managed with **GitDrop** — Visual Git Workspace.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
      );
      await fs.writeFile(
        'src/App.tsx',
        `import React from 'react';\n\nexport function App() {\n  return (\n    <div className="container">\n      <h1>Welcome to ${sampleName}</h1>\n      <p>Manage your repository visually with GitDrop.</p>\n    </div>\n  );\n}\n`
      );
      await fs.writeFile(
        'src/main.tsx',
        `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n`
      );
      await fs.writeFile('.gitignore', `node_modules/\ndist/\n.env\n*.local\n`);

      const git = new BrowserGitAdapter(fs, '/');
      await git.init({
        defaultBranch: config.defaultBranch || 'main',
        user: { name: config.userName, email: config.userEmail },
      });
      await git.add(['package.json', 'vite.config.ts', 'README.md', 'src/App.tsx', 'src/main.tsx', '.gitignore']);
      await git.commit('Initial commit via GitDrop');

      const entry = await projectManager.addProject({
        name: sampleName,
        displayName: sampleName,
        path: `Virtual / ${sampleName}`,
        isVirtual: true,
      });

      await refreshProjectsList();
      await projectManager.openProject(entry.id);
    },
    [config, refreshProjectsList]
  );

  const initializeGit = useCallback(
    async (options: { defaultBranch: string; user: { name: string; email: string } }) => {
      if (!gitService || !fileSystem) throw new Error('No project opened');

      logger.info('git', `Initializing Git repository with default branch: ${options.defaultBranch}`);
      await gitService.init({
        defaultBranch: options.defaultBranch || config.defaultBranch,
        user: options.user,
      });

      await refreshProjectInfo();
    },
    [gitService, fileSystem, config.defaultBranch, refreshProjectInfo]
  );

  const closeRepository = useCallback(() => {
    projectManager.closeProject();
  }, []);

  return (
    <RepositoryContext.Provider
      value={{
        fileSystem,
        gitService,
        projectInfo,
        activeProject,
        projects,
        isOpen: !!fileSystem && !!projectInfo && !needsPermission,
        needsPermission,
        projectManager,
        requestActivePermission,
        openDirectoryPicker,
        openDirectoryHandle,
        openVirtualProject,
        switchProject,
        removeProject,
        setDefaultProject,
        renameProject,
        reconnectProject,
        initializeGit,
        closeRepository,
        refreshProjectInfo,
        refreshProjectsList,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};

export function useRepository() {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepository must be used within RepositoryProvider');
  return ctx;
}
