import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  GitStatusSummary,
  Branch,
  Commit,
  Remote,
  Tag,
  StashItem,
  GitOperationState,
  MergeResult,
  RebaseResult,
} from '@/types/git';
import { useRepository } from './RepositoryContext';
import { useConfig } from './ConfigContext';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { logger } from '@/services/logger/logger';

interface GitContextType {
  status: GitStatusSummary | null;
  branches: Branch[];
  currentBranch: string;
  commits: Commit[];
  remotes: Remote[];
  tags: Tag[];
  stashes: StashItem[];
  isLoading: boolean;
  operationState: GitOperationState;
  refresh: () => Promise<void>;
  stageFiles: (paths: string[]) => Promise<void>;
  unstageFiles: (paths: string[]) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  discardFiles: (paths: string[]) => Promise<void>;
  commit: (message: string, amend?: boolean) => Promise<Commit>;
  createBranch: (name: string, startPoint?: string) => Promise<void>;
  checkoutBranch: (name: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  renameBranch: (oldName: string, newName: string) => Promise<void>;
  mergeBranch: (branch: string) => Promise<MergeResult>;
  rebaseBranch: (onto: string) => Promise<RebaseResult>;
  stashSave: (message?: string) => Promise<void>;
  stashPop: (index: number) => Promise<void>;
  stashApply: (index: number) => Promise<void>;
  stashDrop: (index: number) => Promise<void>;
  resetBranch: (mode: 'soft' | 'mixed' | 'hard', ref?: string) => Promise<void>;
  revertCommit: (oid: string) => Promise<void>;
  createTag: (name: string, ref?: string, message?: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  removeRemote: (name: string) => Promise<void>;
  push: (options?: { remote?: string; branch?: string; force?: boolean }) => Promise<void>;
  pull: (options?: { remote?: string; branch?: string }) => Promise<void>;
  fetch: (remote?: string) => Promise<void>;
}

const GitContext = createContext<GitContextType | null>(null);

export const GitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gitService, projectInfo } = useRepository();
  const { config } = useConfig();
  const { session } = useAuth();
  const { showError } = useUI();

  const [status, setStatus] = useState<GitStatusSummary | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [remotes, setRemotes] = useState<Remote[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stashes, setStashes] = useState<StashItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [operationState, setOperationState] = useState<GitOperationState>({
    type: 'idle',
    status: 'idle',
  });

  const refresh = useCallback(async () => {
    if (!gitService || !projectInfo?.isGit) {
      setStatus(null);
      setBranches([]);
      setCommits([]);
      setRemotes([]);
      setTags([]);
      setStashes([]);
      return;
    }

    try {
      setIsLoading(true);
      const [curBranch, stat, branchList, commitList, remoteList, tagList, stashList] = await Promise.all([
        gitService.currentBranch(),
        gitService.status(),
        gitService.branch(),
        gitService.log({ depth: 50 }),
        gitService.remotes(),
        gitService.tags(),
        gitService.stashList(),
      ]);

      setCurrentBranch(curBranch);
      setStatus(stat);
      setBranches(branchList);
      setCommits(commitList);
      setRemotes(remoteList);
      setTags(tagList);
      setStashes(stashList);
    } catch (err: any) {
      logger.error('git', 'Error refreshing git state', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [gitService, projectInfo?.isGit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runOperation = async <T,>(
    type: string,
    op: () => Promise<T>,
    errorMessageTitle: string
  ): Promise<T> => {
    setOperationState({ type, status: 'running' });
    try {
      const res = await op();
      setOperationState({ type, status: 'success' });
      await refresh();
      return res;
    } catch (err: any) {
      setOperationState({ type, status: 'error', error: err.message });
      showError(
        errorMessageTitle,
        err.message || 'The Git operation could not be completed.',
        'The repository state, file lock, or remote authentication may have caused this error.',
        'Review the Git output console at the bottom for detailed diagnostics.'
      );
      throw err;
    }
  };

  const stageFiles = useCallback(
    async (paths: string[]) => {
      if (!gitService) return;
      await runOperation('stage', () => gitService.add(paths), 'Failed to stage files');
    },
    [gitService]
  );

  const unstageFiles = useCallback(
    async (paths: string[]) => {
      if (!gitService) return;
      await runOperation('unstage', () => gitService.reset(paths), 'Failed to unstage files');
    },
    [gitService]
  );

  const stageAll = useCallback(async () => {
    if (!status || !gitService) return;
    const allPaths = status.unstaged.map((f) => f.path);
    if (allPaths.length === 0) return;
    await stageFiles(allPaths);
  }, [status, gitService, stageFiles]);

  const unstageAll = useCallback(async () => {
    if (!status || !gitService) return;
    const allPaths = status.staged.map((f) => f.path);
    if (allPaths.length === 0) return;
    await unstageFiles(allPaths);
  }, [status, gitService, unstageFiles]);

  const discardFiles = useCallback(
    async (paths: string[]) => {
      if (!gitService) return;
      await runOperation('discard', () => gitService.discard(paths), 'Failed to discard changes');
    },
    [gitService]
  );

  const commit = useCallback(
    async (message: string, amend?: boolean) => {
      if (!gitService) throw new Error('No Git repository');
      return await runOperation(
        'commit',
        () =>
          gitService.commit(message, {
            amend,
            author: { name: config.userName, email: config.userEmail },
          }),
        'Commit Failed'
      );
    },
    [gitService, config]
  );

  const createBranch = useCallback(
    async (name: string, startPoint?: string) => {
      if (!gitService) return;
      await runOperation('createBranch', () => gitService.createBranch(name, startPoint), 'Create Branch Failed');
    },
    [gitService]
  );

  const checkoutBranch = useCallback(
    async (name: string) => {
      if (!gitService) return;
      await runOperation('checkout', () => gitService.checkout(name), 'Checkout Failed');
    },
    [gitService]
  );

  const deleteBranch = useCallback(
    async (name: string) => {
      if (!gitService) return;
      await runOperation('deleteBranch', () => gitService.deleteBranch(name), 'Delete Branch Failed');
    },
    [gitService]
  );

  const renameBranch = useCallback(
    async (oldName: string, newName: string) => {
      if (!gitService) return;
      await runOperation('renameBranch', () => gitService.renameBranch(oldName, newName), 'Rename Branch Failed');
    },
    [gitService]
  );

  const mergeBranch = useCallback(
    async (branch: string) => {
      if (!gitService) throw new Error('No Git repository');
      return await runOperation('merge', () => gitService.merge(branch), 'Merge Failed');
    },
    [gitService]
  );

  const rebaseBranch = useCallback(
    async (onto: string) => {
      if (!gitService) throw new Error('No Git repository');
      return await runOperation('rebase', () => gitService.rebase(currentBranch, onto), 'Rebase Failed');
    },
    [gitService, currentBranch]
  );

  const stashSave = useCallback(
    async (message?: string) => {
      if (!gitService) return;
      await runOperation('stash', () => gitService.stash(message), 'Stash Failed');
    },
    [gitService]
  );

  const stashPop = useCallback(
    async (index: number) => {
      if (!gitService) return;
      await runOperation('stashPop', () => gitService.stashPop(index), 'Stash Pop Failed');
    },
    [gitService]
  );

  const stashApply = useCallback(
    async (index: number) => {
      if (!gitService) return;
      await runOperation('stashApply', () => gitService.stashApply(index), 'Stash Apply Failed');
    },
    [gitService]
  );

  const stashDrop = useCallback(
    async (index: number) => {
      if (!gitService) return;
      await runOperation('stashDrop', () => gitService.stashDrop(index), 'Stash Drop Failed');
    },
    [gitService]
  );

  const resetBranch = useCallback(
    async (mode: 'soft' | 'mixed' | 'hard', ref?: string) => {
      if (!gitService) return;
      await runOperation('resetBranch', () => gitService.resetBranch(mode, ref), 'Reset Failed');
    },
    [gitService]
  );

  const revertCommit = useCallback(
    async (oid: string) => {
      if (!gitService) return;
      await runOperation('revert', () => gitService.revert(oid), 'Revert Failed');
    },
    [gitService]
  );

  const createTag = useCallback(
    async (name: string, ref?: string, message?: string) => {
      if (!gitService) return;
      await runOperation('createTag', () => gitService.createTag(name, ref, message), 'Create Tag Failed');
    },
    [gitService]
  );

  const deleteTag = useCallback(
    async (name: string) => {
      if (!gitService) return;
      await runOperation('deleteTag', () => gitService.deleteTag(name), 'Delete Tag Failed');
    },
    [gitService]
  );

  const addRemote = useCallback(
    async (name: string, url: string) => {
      if (!gitService) return;
      await runOperation('addRemote', () => gitService.addRemote(name, url), 'Add Remote Failed');
    },
    [gitService]
  );

  const removeRemote = useCallback(
    async (name: string) => {
      if (!gitService) return;
      await runOperation('removeRemote', () => gitService.removeRemote(name), 'Remove Remote Failed');
    },
    [gitService]
  );

  const push = useCallback(
    async (options?: { remote?: string; branch?: string; force?: boolean }) => {
      if (!gitService) return;
      await runOperation(
        'push',
        () =>
          gitService.push({
            remote: options?.remote,
            branch: options?.branch,
            force: options?.force,
            corsProxy: config.corsProxy,
            token: session?.token,
          }),
        'Push Rejected'
      );
    },
    [gitService, config.corsProxy, session?.token]
  );

  const pull = useCallback(
    async (options?: { remote?: string; branch?: string }) => {
      if (!gitService) return;
      await runOperation(
        'pull',
        () =>
          gitService.pull({
            remote: options?.remote,
            branch: options?.branch,
            corsProxy: config.corsProxy,
            token: session?.token,
          }),
        'Pull Failed'
      );
    },
    [gitService, config.corsProxy, session?.token]
  );

  const fetch = useCallback(
    async (remote?: string) => {
      if (!gitService) return;
      await runOperation(
        'fetch',
        () =>
          gitService.fetch({
            remote,
            corsProxy: config.corsProxy,
            token: session?.token,
          }),
        'Fetch Failed'
      );
    },
    [gitService, config.corsProxy, session?.token]
  );

  return (
    <GitContext.Provider
      value={{
        status,
        branches,
        currentBranch,
        commits,
        remotes,
        tags,
        stashes,
        isLoading,
        operationState,
        refresh,
        stageFiles,
        unstageFiles,
        stageAll,
        unstageAll,
        discardFiles,
        commit,
        createBranch,
        checkoutBranch,
        deleteBranch,
        renameBranch,
        mergeBranch,
        rebaseBranch,
        stashSave,
        stashPop,
        stashApply,
        stashDrop,
        resetBranch,
        revertCommit,
        createTag,
        deleteTag,
        addRemote,
        removeRemote,
        push,
        pull,
        fetch,
      }}
    >
      {children}
    </GitContext.Provider>
  );
};

export function useGit() {
  const ctx = useContext(GitContext);
  if (!ctx) throw new Error('useGit must be used within GitProvider');
  return ctx;
}
