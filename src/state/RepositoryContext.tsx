import React, { createContext, useContext, useState, useCallback } from 'react';
import { IFileSystem } from '@/types/filesystem';
import { ProjectInfo } from '@/types/project';
import { GitService } from '@/services/git/IGitService';
import { BrowserGitAdapter } from '@/services/git/BrowserGitAdapter';
import { FileSystemAccessFS } from '@/services/filesystem/FileSystemAccessFS';
import { MemoryFS } from '@/services/filesystem/MemoryFS';
import { detectProject } from '@/services/project/projectDetector';
import { logger } from '@/services/logger/logger';
import { useConfig } from './ConfigContext';

interface RepositoryContextType {
  fileSystem: IFileSystem | null;
  gitService: GitService | null;
  projectInfo: ProjectInfo | null;
  isOpen: boolean;
  openDirectoryPicker: () => Promise<void>;
  openDirectoryHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  openVirtualProject: (sampleName?: string) => Promise<void>;
  initializeGit: (options: { defaultBranch: string; user: { name: string; email: string } }) => Promise<void>;
  closeRepository: () => void;
  refreshProjectInfo: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextType | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  const [fileSystem, setFileSystem] = useState<IFileSystem | null>(null);
  const [gitService, setGitService] = useState<GitService | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  const refreshProjectInfo = useCallback(async () => {
    if (!fileSystem) return;
    try {
      const info = await detectProject(fileSystem, projectInfo?.name || 'project');
      setProjectInfo(info);
    } catch (err: any) {
      logger.error('app', 'Failed to refresh project info', err.message);
    }
  }, [fileSystem, projectInfo?.name]);

  const openDirectoryHandle = useCallback(async (handle: FileSystemDirectoryHandle) => {
    logger.info('app', `Opening directory handle: ${handle.name}`);
    const fs = new FileSystemAccessFS(handle);
    const git = new BrowserGitAdapter(fs, '/');
    const info = await detectProject(fs, handle.name);

    setFileSystem(fs);
    setGitService(git);
    setProjectInfo(info);
  }, []);

  const openDirectoryPicker = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Brave, or try a virtual repository.');
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      await openDirectoryHandle(handle);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.debug('app', 'User cancelled folder selection');
        return;
      }
      logger.error('app', 'Error selecting directory', err.message);
      throw err;
    }
  }, [openDirectoryHandle]);

  const openVirtualProject = useCallback(async (sampleName: string = 'react-vite-starter') => {
    logger.info('app', `Opening in-memory virtual repository: ${sampleName}`);
    const fs = new MemoryFS();

    // Populate a sample React + Vite starter project
    await fs.writeFile('package.json', JSON.stringify({
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
    }, null, 2));

    await fs.writeFile('vite.config.ts', `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`);
    await fs.writeFile('README.md', `# ${sampleName}\n\nBuilt and managed with **GitDrop** — Visual Git Workspace.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);
    await fs.writeFile('src/App.tsx', `import React from 'react';\n\nexport function App() {\n  return (\n    <div className="container">\n      <h1>Welcome to ${sampleName}</h1>\n      <p>Manage your repository visually with GitDrop.</p>\n    </div>\n  );\n}\n`);
    await fs.writeFile('src/main.tsx', `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n`);
    await fs.writeFile('.gitignore', `node_modules/\ndist/\n.env\n*.local\n`);

    const git = new BrowserGitAdapter(fs, '/');
    await git.init({
      defaultBranch: config.defaultBranch || 'main',
      user: { name: config.userName, email: config.userEmail },
    });
    await git.add(['package.json', 'vite.config.ts', 'README.md', 'src/App.tsx', 'src/main.tsx', '.gitignore']);
    await git.commit('Initial commit via GitDrop');

    const info = await detectProject(fs, sampleName);

    setFileSystem(fs);
    setGitService(git);
    setProjectInfo(info);
  }, [config]);

  const initializeGit = useCallback(async (options: { defaultBranch: string; user: { name: string; email: string } }) => {
    if (!gitService || !fileSystem) throw new Error('No project opened');

    logger.info('git', `Initializing Git repository with default branch: ${options.defaultBranch}`);
    await gitService.init({
      defaultBranch: options.defaultBranch || config.defaultBranch,
      user: options.user,
    });

    await refreshProjectInfo();
  }, [gitService, fileSystem, config.defaultBranch, refreshProjectInfo]);

  const closeRepository = useCallback(() => {
    logger.info('app', 'Closing active repository');
    setFileSystem(null);
    setGitService(null);
    setProjectInfo(null);
  }, []);

  return (
    <RepositoryContext.Provider
      value={{
        fileSystem,
        gitService,
        projectInfo,
        isOpen: !!fileSystem && !!projectInfo,
        openDirectoryPicker,
        openDirectoryHandle,
        openVirtualProject,
        initializeGit,
        closeRepository,
        refreshProjectInfo,
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
