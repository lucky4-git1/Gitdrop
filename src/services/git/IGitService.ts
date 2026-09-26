import {
  GitStatusSummary,
  Commit,
  Branch,
  Tag,
  Remote,
  DiffFile,
  MergeResult,
  RebaseResult,
  StashItem,
} from '@/types/git';

export interface GitService {
  init(options?: { defaultBranch?: string; user?: { name: string; email: string } }): Promise<void>;
  status(): Promise<GitStatusSummary>;
  add(paths: string[]): Promise<void>;
  reset(paths: string[]): Promise<void>;
  commit(message: string, options?: { amend?: boolean; author?: { name: string; email: string } }): Promise<Commit>;
  log(options?: { depth?: number; ref?: string }): Promise<Commit[]>;
  diff(options?: { filepath?: string; staged?: boolean; commitOid?: string }): Promise<DiffFile[]>;
  branch(): Promise<Branch[]>;
  currentBranch(): Promise<string>;
  checkout(branch: string): Promise<void>;
  createBranch(name: string, startPoint?: string): Promise<void>;
  deleteBranch(name: string): Promise<void>;
  renameBranch(oldName: string, newName: string): Promise<void>;
  merge(branch: string): Promise<MergeResult>;
  rebase(branch: string, onto: string): Promise<RebaseResult>;
  stash(message?: string): Promise<void>;
  stashList(): Promise<StashItem[]>;
  stashApply(index: number): Promise<void>;
  stashPop(index: number): Promise<void>;
  stashDrop(index: number): Promise<void>;
  resetBranch(mode: 'soft' | 'mixed' | 'hard', ref?: string): Promise<void>;
  revert(commitOid: string): Promise<void>;
  remotes(): Promise<Remote[]>;
  addRemote(name: string, url: string): Promise<void>;
  removeRemote(name: string): Promise<void>;
  fetch(options?: { remote?: string; corsProxy?: string; token?: string }): Promise<void>;
  pull(options?: { remote?: string; branch?: string; corsProxy?: string; token?: string }): Promise<void>;
  push(options?: { remote?: string; branch?: string; force?: boolean; corsProxy?: string; token?: string }): Promise<void>;
  tags(): Promise<Tag[]>;
  createTag(name: string, ref?: string, message?: string): Promise<void>;
  deleteTag(name: string): Promise<void>;
  discard(paths: string[]): Promise<void>;
}
