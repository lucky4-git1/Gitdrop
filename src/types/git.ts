export type FileStatusCode = 'modified' | 'added' | 'deleted' | 'untracked' | 'staged' | 'conflict';

export interface GitFileStatus {
  path: string;
  status: FileStatusCode;
  staged: boolean;
  unstaged: boolean;
  headOid?: string;
  workdirOid?: string;
  stageOid?: string;
}

export interface GitStatusSummary {
  branch: string;
  clean: boolean;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  conflicted: GitFileStatus[];
  ahead: number;
  behind: number;
  upstream?: string;
}

export interface CommitAuthor {
  name: string;
  email: string;
  timestamp: number;
  timezoneOffset?: number;
}

export interface Commit {
  oid: string;
  message: string;
  tree: string;
  parent: string[];
  author: CommitAuthor;
  committer: CommitAuthor;
  refs?: string[];
  filesChanged?: number;
}

export interface Branch {
  name: string;
  current: boolean;
  remote?: string;
  upstream?: string;
  commitOid?: string;
}

export interface Tag {
  name: string;
  oid: string;
  message?: string;
  tagger?: CommitAuthor;
}

export interface Remote {
  name: string;
  url: string;
}

export interface DiffFile {
  path: string;
  oldPath?: string;
  newPath?: string;
  status: 'modified' | 'added' | 'deleted';
  oldContent?: string;
  newContent?: string;
  diffHunks?: string;
}

export interface MergeResult {
  success: boolean;
  oid?: string;
  tree?: string;
  alreadyMerged?: boolean;
  fastForward?: boolean;
  conflicts?: string[];
  message?: string;
}

export interface RebaseResult {
  success: boolean;
  conflicts?: string[];
  message?: string;
}

export interface StashItem {
  index: number;
  message: string;
  oid: string;
  date: string;
  branch: string;
}

export type OperationStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export interface GitOperationState {
  type: string;
  status: OperationStatus;
  progress?: string;
  output?: string[];
  error?: string;
}

export interface GitConfig {
  userName: string;
  userEmail: string;
  defaultBranch: string;
  corsProxy: string;
}
