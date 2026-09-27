import { ProjectEntry, IProjectManager, ProjectInfo } from '@/types/project';
import { IFileSystem } from '@/types/filesystem';
import { GitService } from '../git/IGitService';
import { BrowserGitAdapter } from '../git/BrowserGitAdapter';
import { FileSystemAccessFS } from '../filesystem/FileSystemAccessFS';
import { MemoryFS } from '../filesystem/MemoryFS';
import { detectProject } from './projectDetector';
import { ProjectRegistry, projectRegistry } from './ProjectRegistry';
import { logger } from '../logger/logger';

export interface ActiveProjectState {
  project: ProjectEntry | null;
  fileSystem: IFileSystem | null;
  gitService: GitService | null;
  projectInfo: ProjectInfo | null;
  needsPermission: boolean;
}

type ProjectChangeListener = (state: ActiveProjectState) => void;

export class ProjectManager implements IProjectManager {
  private registry: ProjectRegistry;
  private activeState: ActiveProjectState = {
    project: null,
    fileSystem: null,
    gitService: null,
    projectInfo: null,
    needsPermission: false,
  };
  private listeners: Set<ProjectChangeListener> = new Set();
  private switchCounter = 0;

  constructor(registry: ProjectRegistry = projectRegistry) {
    this.registry = registry;
  }

  public subscribe(listener: ProjectChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.activeState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.activeState);
    }
  }

  public getActiveProject(): ProjectEntry | null {
    return this.activeState.project;
  }

  public getActiveState(): ActiveProjectState {
    return this.activeState;
  }

  public async getProjects(): Promise<ProjectEntry[]> {
    return await this.registry.listProjects();
  }

  public async addProject(
    project: Omit<ProjectEntry, 'id' | 'addedAt' | 'lastOpenedAt'>,
    handle?: FileSystemDirectoryHandle
  ): Promise<ProjectEntry> {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const entry: ProjectEntry = {
      ...project,
      id,
      addedAt: now,
      lastOpenedAt: now,
      needsPermission: false,
    };

    await this.registry.saveProject(entry, handle);
    logger.info('app', `PROJECT_REGISTER: Added project "${entry.name}" (${id})`);
    return entry;
  }

  public async openProject(id: string, directHandle?: FileSystemDirectoryHandle): Promise<void> {
    return this.setActiveProject(id, directHandle);
  }

  public async switchProject(id: string, directHandle?: FileSystemDirectoryHandle): Promise<void> {
    return this.setActiveProject(id, directHandle);
  }

  public async setActiveProject(id: string, directHandle?: FileSystemDirectoryHandle): Promise<void> {
    const currentSeq = ++this.switchCounter;
    logger.info('app', `PROJECT_OPEN_START: Opening project ${id} (seq: ${currentSeq})`);

    const entry = await this.registry.getProject(id);
    if (!entry) {
      logger.error('app', `PROJECT_OPEN_FAILED: Project not found: ${id}`);
      throw new Error(`Project ${id} not found in registry.`);
    }

    try {
      // 1. If it's a virtual project
      if (entry.isVirtual) {
        let fs: IFileSystem;
        // Check if there is an in-memory instance or instantiate a new one
        fs = new MemoryFS();
        const git = new BrowserGitAdapter(fs, '/');
        const info = await detectProject(fs, entry.name);

        if (this.switchCounter !== currentSeq) {
          logger.debug('app', `Discarding stale project switch (seq: ${currentSeq} < ${this.switchCounter})`);
          return;
        }

        entry.lastOpenedAt = new Date().toISOString();
        await this.registry.updateProject(id, { lastOpenedAt: entry.lastOpenedAt });

        this.activeState = {
          project: entry,
          fileSystem: fs,
          gitService: git,
          projectInfo: info,
          needsPermission: false,
        };
        this.notify();
        logger.info('app', `PROJECT_OPEN_SUCCESS: Opened virtual project "${entry.name}"`);
        return;
      }

      // 2. Physical Directory via FileSystemAccess API
      let handle: FileSystemDirectoryHandle | null = directHandle || null;
      if (!handle) {
        handle = await this.registry.getHandle(id);
      } else {
        await this.registry.saveProject(entry, handle);
      }

      if (!handle) {
        // Handle not in IndexedDB or unsupported
        logger.warn('app', `Handle for project ${entry.name} not found in store`);
        this.activeState = {
          project: { ...entry, needsPermission: true },
          fileSystem: null,
          gitService: null,
          projectInfo: null,
          needsPermission: true,
        };
        this.notify();
        return;
      }

      // 3. Check permission on directory handle (skip if directHandle was freshly chosen)
      let hasPermission = !!directHandle;
      if (!hasPermission) {
        try {
          if ('queryPermission' in handle) {
            const status = await (handle as any).queryPermission({ mode: 'readwrite' });
            hasPermission = status === 'granted';
          } else {
            hasPermission = true;
          }
        } catch {
          hasPermission = false;
        }
      }

      if (!hasPermission) {
        logger.warn('app', `Permission required for folder "${entry.name}"`);
        this.activeState = {
          project: { ...entry, needsPermission: true },
          fileSystem: null,
          gitService: null,
          projectInfo: null,
          needsPermission: true,
        };
        this.notify();
        return;
      }

      // 4. Construct FileSystemAccessFS and GitService
      const fs = new FileSystemAccessFS(handle);
      const git = new BrowserGitAdapter(fs, '/');
      const info = await detectProject(fs, entry.name);

      if (this.switchCounter !== currentSeq) {
        logger.debug('app', `Discarding stale project switch (seq: ${currentSeq} < ${this.switchCounter})`);
        return;
      }

      // 5. Update last opened timestamp
      entry.lastOpenedAt = new Date().toISOString();
      entry.needsPermission = false;
      entry.framework = info.framework;
      await this.registry.updateProject(id, {
        lastOpenedAt: entry.lastOpenedAt,
        needsPermission: false,
        framework: info.framework,
      });

      this.activeState = {
        project: entry,
        fileSystem: fs,
        gitService: git,
        projectInfo: info,
        needsPermission: false,
      };

      this.notify();
      logger.info('app', `PROJECT_OPEN_SUCCESS: Successfully opened "${entry.name}"`);

      // Refresh Git status summary for the project in background
      this.refreshProjectGitStatus(id, git);
    } catch (err: any) {
      if (this.switchCounter !== currentSeq) return;
      logger.error('app', `PROJECT_OPEN_FAILED: Failed to open project "${entry.name}"`, err?.message);
      throw err;
    }
  }

  /**
   * Prompts user for native permission on stored directory handle
   */
  public async requestPermissionForActiveProject(): Promise<boolean> {
    const active = this.activeState.project;
    if (!active) return false;

    const handle = await this.registry.getHandle(active.id);
    if (!handle) return false;

    try {
      if ('requestPermission' in handle) {
        const res = await (handle as any).requestPermission({ mode: 'readwrite' });
        if (res === 'granted') {
          await this.setActiveProject(active.id);
          return true;
        }
      }
    } catch (err: any) {
      logger.error('app', 'Permission request failed', err?.message);
    }
    return false;
  }

  public async closeProject(id?: string): Promise<void> {
    logger.info('app', `Closing active project ${id || ''}`);
    this.activeState = {
      project: null,
      fileSystem: null,
      gitService: null,
      projectInfo: null,
      needsPermission: false,
    };
    this.notify();
  }

  public async removeProject(id: string): Promise<void> {
    if (this.activeState.project?.id === id) {
      await this.closeProject(id);
    }
    await this.registry.removeProject(id);
    logger.info('app', `Removed project ${id}`);
  }

  public async refreshProject(id: string): Promise<void> {
    if (this.activeState.project?.id === id && this.activeState.fileSystem) {
      const info = await detectProject(this.activeState.fileSystem, this.activeState.project.name);
      this.activeState.projectInfo = info;
      this.notify();
      if (this.activeState.gitService) {
        await this.refreshProjectGitStatus(id, this.activeState.gitService);
      }
    }
  }

  public async setDefaultProject(id: string): Promise<void> {
    const list = await this.registry.listProjects();
    for (const p of list) {
      await this.registry.updateProject(p.id, { isDefault: p.id === id });
    }
    if (this.activeState.project) {
      this.activeState.project.isDefault = this.activeState.project.id === id;
      this.notify();
    }
  }

  public async renameProject(id: string, newDisplayName: string): Promise<void> {
    await this.registry.updateProject(id, { displayName: newDisplayName.trim() });
    if (this.activeState.project?.id === id) {
      this.activeState.project.displayName = newDisplayName.trim();
      this.notify();
    }
  }

  public async reconnectProject(id: string, handle?: FileSystemDirectoryHandle): Promise<void> {
    const entry = await this.registry.getProject(id);
    if (!entry) throw new Error('Project not found');

    if (handle) {
      await this.registry.saveProject(entry, handle);
      await this.setActiveProject(id);
    } else if ('showDirectoryPicker' in window) {
      const newHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await this.registry.saveProject(entry, newHandle);
      await this.setActiveProject(id);
    }
  }

  private async refreshProjectGitStatus(id: string, git: GitService): Promise<void> {
    try {
      const [curBranch, status] = await Promise.all([
        git.currentBranch().catch(() => 'main'),
        git.status().catch(() => null),
      ]);

      const changesCount = (status?.staged.length || 0) + (status?.unstaged.length || 0);
      const hasConflicts = (status?.conflicted.length || 0) > 0;

      const summary = {
        clean: changesCount === 0 && !hasConflicts,
        changesCount,
        ahead: 0,
        behind: 0,
        hasConflicts,
      };

      await this.registry.updateProject(id, {
        branch: curBranch,
        statusSummary: summary,
      });

      if (this.activeState.project?.id === id) {
        this.activeState.project.branch = curBranch;
        this.activeState.project.statusSummary = summary;
        this.notify();
      }
    } catch {
      // ignore
    }
  }
}

export const projectManager = new ProjectManager();
