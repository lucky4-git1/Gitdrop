export type ProjectFramework =
  | 'React / Vite'
  | 'Next.js'
  | 'Vue / Vite'
  | 'Svelte / SvelteKit'
  | 'Node.js'
  | 'TypeScript'
  | 'Rust / Cargo'
  | 'Go'
  | 'Python'
  | 'Java / Maven'
  | 'Java / Gradle'
  | 'PHP / Composer'
  | 'Static HTML/JS'
  | 'Generic';

export interface ProjectInfo {
  name: string;
  path: string;
  filesCount: number;
  totalSizeBytes: number;
  isGit: boolean;
  framework: ProjectFramework;
  description?: string;
  detectedFiles: string[];
}

export interface ProjectStatusSummary {
  clean: boolean;
  changesCount: number;
  ahead: number;
  behind: number;
  hasConflicts: boolean;
}

export interface ProjectEntry {
  id: string;
  name: string;
  displayName?: string;
  path?: string;
  repositoryRoot?: string;
  remoteUrl?: string;
  provider?: 'github' | 'gitlab' | 'bitbucket' | 'unknown';
  lastOpenedAt: string;
  addedAt: string;
  branch?: string;
  framework?: ProjectFramework;
  isVirtual?: boolean;
  isDefault?: boolean;
  needsPermission?: boolean;
  statusSummary?: ProjectStatusSummary;
}

export interface IProjectManager {
  getProjects(): Promise<ProjectEntry[]>;
  addProject(
    project: Omit<ProjectEntry, 'id' | 'addedAt' | 'lastOpenedAt'>,
    handle?: FileSystemDirectoryHandle
  ): Promise<ProjectEntry>;
  openProject(id: string, directHandle?: FileSystemDirectoryHandle): Promise<void>;
  closeProject(id: string): Promise<void>;
  removeProject(id: string): Promise<void>;
  setActiveProject(id: string, directHandle?: FileSystemDirectoryHandle): Promise<void>;
  getActiveProject(): ProjectEntry | null;
  refreshProject(id: string): Promise<void>;
  setDefaultProject(id: string): Promise<void>;
  renameProject(id: string, newDisplayName: string): Promise<void>;
  reconnectProject(id: string, handle?: FileSystemDirectoryHandle): Promise<void>;
}

