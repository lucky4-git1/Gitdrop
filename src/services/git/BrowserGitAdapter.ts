import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { IFileSystem } from '@/types/filesystem';
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
import { GitService } from './IGitService';
import { createIsomorphicGitFs } from '../filesystem/isomorphicGitFsBridge';
import { mapStatusMatrix } from './statusMapper';
import { DiffService } from './diffService';
import { logger } from '../logger/logger';

export class BrowserGitAdapter implements GitService {
  private fs: IFileSystem;
  private dir: string;
  private gitFs: any;
  private diffService: DiffService;

  constructor(fs: IFileSystem, dir: string = '/') {
    this.fs = fs;
    this.dir = dir;
    this.gitFs = createIsomorphicGitFs(fs);
    this.diffService = new DiffService(fs, dir);
  }

  public async init(options?: { defaultBranch?: string; user?: { name: string; email: string } }): Promise<void> {
    const branch = options?.defaultBranch || 'main';
    logger.info('git', `git init --initial-branch=${branch}`);
    await git.init({
      fs: this.gitFs,
      dir: this.dir,
      defaultBranch: branch,
    });

    if (options?.user?.name) {
      await git.setConfig({
        fs: this.gitFs,
        dir: this.dir,
        path: 'user.name',
        value: options.user.name,
      });
    }
    if (options?.user?.email) {
      await git.setConfig({
        fs: this.gitFs,
        dir: this.dir,
        path: 'user.email',
        value: options.user.email,
      });
    }
    logger.info('git', `Initialized empty Git repository in ${this.dir}`);
  }

  public async status(): Promise<GitStatusSummary> {
    try {
      const branchName = await this.currentBranch();
      const matrix = await git.statusMatrix({
        fs: this.gitFs,
        dir: this.dir,
      });

      const { staged, unstaged, conflicted } = mapStatusMatrix(matrix as [string, number, number, number][]);
      const clean = staged.length === 0 && unstaged.length === 0 && conflicted.length === 0;

      // Check ahead/behind remote if origin exists
      let ahead = 0;
      let behind = 0;
      let upstream: string | undefined;

      try {
        const remotes = await this.remotes();
        if (remotes.some((r) => r.name === 'origin')) {
          upstream = `origin/${branchName}`;
          // Compare local branch commit with remote branch ref
          const localOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: branchName }).catch(() => null);
          const remoteOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: `origin/${branchName}` }).catch(() => null);

          if (localOid && remoteOid && localOid !== remoteOid) {
            // Count difference
            const localCommits = await this.log({ depth: 50, ref: branchName }).catch(() => []);
            const isRemoteInLocal = localCommits.some((c) => c.oid === remoteOid);
            if (isRemoteInLocal) {
              const idx = localCommits.findIndex((c) => c.oid === remoteOid);
              ahead = idx;
            } else {
              behind = 1;
            }
          }
        }
      } catch {
        // upstream comparison is best-effort
      }

      return {
        branch: branchName,
        clean,
        staged,
        unstaged,
        conflicted,
        ahead,
        behind,
        upstream,
      };
    } catch (err: any) {
      logger.error('git', 'Error reading git status', err.message);
      throw err;
    }
  }

  public async add(paths: string[]): Promise<void> {
    logger.info('git', `git add ${paths.join(' ')}`);
    for (const filepath of paths) {
      const exists = await this.fs.exists(filepath);
      if (exists) {
        await git.add({
          fs: this.gitFs,
          dir: this.dir,
          filepath,
        });
      } else {
        // Deleted file removal from index
        await git.remove({
          fs: this.gitFs,
          dir: this.dir,
          filepath,
        });
      }
    }
  }

  public async reset(paths: string[]): Promise<void> {
    logger.info('git', `git reset HEAD ${paths.join(' ')}`);
    for (const filepath of paths) {
      await git.resetIndex({
        fs: this.gitFs,
        dir: this.dir,
        filepath,
      });
    }
  }

  public async commit(
    message: string,
    options?: { amend?: boolean; author?: { name: string; email: string } }
  ): Promise<Commit> {
    if (!message || message.trim() === '') {
      throw new Error('Aborting commit due to empty commit message.');
    }

    const authorName = options?.author?.name || 'GitDrop User';
    const authorEmail = options?.author?.email || 'user@gitdrop.local';

    logger.info('git', `git commit -m "${message}"`);
    const oid = await git.commit({
      fs: this.gitFs,
      dir: this.dir,
      message: message.trim(),
      amend: options?.amend,
      author: {
        name: authorName,
        email: authorEmail,
      },
    });

    const commitObj = await git.readCommit({
      fs: this.gitFs,
      dir: this.dir,
      oid,
    });

    logger.info('git', `[${commitObj.commit.parent.length === 0 ? 'root-commit' : 'commit'} ${oid.slice(0, 7)}] ${message.split('\n')[0]}`);

    return {
      oid,
      message: commitObj.commit.message,
      tree: commitObj.commit.tree,
      parent: commitObj.commit.parent,
      author: {
        name: commitObj.commit.author.name,
        email: commitObj.commit.author.email,
        timestamp: commitObj.commit.author.timestamp,
        timezoneOffset: commitObj.commit.author.timezoneOffset,
      },
      committer: {
        name: commitObj.commit.committer.name,
        email: commitObj.commit.committer.email,
        timestamp: commitObj.commit.committer.timestamp,
        timezoneOffset: commitObj.commit.committer.timezoneOffset,
      },
    };
  }

  public async log(options?: { depth?: number; ref?: string }): Promise<Commit[]> {
    try {
      const rawCommits = await git.log({
        fs: this.gitFs,
        dir: this.dir,
        depth: options?.depth || 100,
        ref: options?.ref,
      });

      return rawCommits.map((c) => ({
        oid: c.oid,
        message: c.commit.message,
        tree: c.commit.tree,
        parent: c.commit.parent,
        author: {
          name: c.commit.author.name,
          email: c.commit.author.email,
          timestamp: c.commit.author.timestamp,
          timezoneOffset: c.commit.author.timezoneOffset,
        },
        committer: {
          name: c.commit.committer.name,
          email: c.commit.committer.email,
          timestamp: c.commit.committer.timestamp,
          timezoneOffset: c.commit.committer.timezoneOffset,
        },
      }));
    } catch {
      // Empty repository has no commits
      return [];
    }
  }

  public async diff(options?: { filepath?: string; staged?: boolean; commitOid?: string }): Promise<DiffFile[]> {
    if (options?.filepath) {
      const diff = await this.diffService.getFileDiff(options.filepath, options);
      return [diff];
    }

    // Return diffs for all changed files
    const status = await this.status();
    const targets = options?.staged ? status.staged : status.unstaged;
    const diffs: DiffFile[] = [];

    for (const f of targets) {
      const diff = await this.diffService.getFileDiff(f.path, options);
      diffs.push(diff);
    }

    return diffs;
  }

  public async branch(): Promise<Branch[]> {
    const current = await this.currentBranch();
    const localBranches = await git.listBranches({ fs: this.gitFs, dir: this.dir });
    const remoteBranches = await git.listBranches({ fs: this.gitFs, dir: this.dir, remote: 'origin' }).catch(() => []);

    const list: Branch[] = [];

    for (const b of localBranches) {
      const commitOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: b }).catch(() => undefined);
      list.push({
        name: b,
        current: b === current,
        commitOid,
      });
    }

    for (const rb of remoteBranches) {
      const commitOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: `origin/${rb}` }).catch(() => undefined);
      list.push({
        name: `origin/${rb}`,
        current: false,
        remote: 'origin',
        commitOid,
      });
    }

    if (list.length === 0 && current) {
      list.push({
        name: current,
        current: true,
        commitOid: undefined,
      });
    }

    return list;
  }

  public async currentBranch(): Promise<string> {
    try {
      const b = await git.currentBranch({
        fs: this.gitFs,
        dir: this.dir,
        fullname: false,
      });
      if (b) return b;

      // Fallback: check .git/HEAD directly
      if (await this.fs.exists('.git/HEAD')) {
        const head = (await this.fs.readFile('.git/HEAD', { encoding: 'utf8' })) as string;
        const match = head.trim().match(/^ref:\s*refs\/heads\/(.+)$/);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return 'main';
    } catch {
      try {
        if (await this.fs.exists('.git/HEAD')) {
          const head = (await this.fs.readFile('.git/HEAD', { encoding: 'utf8' })) as string;
          const match = head.trim().match(/^ref:\s*refs\/heads\/(.+)$/);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      } catch {
        // ignore
      }
      return 'main';
    }
  }

  public async checkout(branch: string): Promise<void> {
    logger.info('git', `git checkout ${branch}`);
    await git.checkout({
      fs: this.gitFs,
      dir: this.dir,
      ref: branch,
    });
    logger.info('git', `Switched to branch '${branch}'`);
  }

  public async createBranch(name: string, startPoint?: string): Promise<void> {
    logger.info('git', `git branch ${name} ${startPoint || ''}`);
    await git.branch({
      fs: this.gitFs,
      dir: this.dir,
      ref: name,
      object: startPoint,
    });
  }

  public async deleteBranch(name: string): Promise<void> {
    logger.info('git', `git branch -D ${name}`);
    await git.deleteBranch({
      fs: this.gitFs,
      dir: this.dir,
      ref: name,
    });
  }

  public async renameBranch(oldName: string, newName: string): Promise<void> {
    logger.info('git', `git branch -m ${oldName} ${newName}`);
    const commitOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: oldName });
    await this.createBranch(newName, commitOid);
    const current = await this.currentBranch();
    if (current === oldName) {
      await this.checkout(newName);
    }
    await this.deleteBranch(oldName);
  }

  public async merge(branch: string): Promise<MergeResult> {
    logger.info('git', `git merge ${branch}`);
    const current = await this.currentBranch();

    try {
      const res = await git.merge({
        fs: this.gitFs,
        dir: this.dir,
        ours: current,
        theirs: branch,
        author: {
          name: 'GitDrop User',
          email: 'user@gitdrop.local',
        },
      });

      if (res.alreadyMerged) {
        logger.info('git', `Already up to date.`);
        return { success: true, alreadyMerged: true, message: 'Already up to date.' };
      }

      if (res.fastForward) {
        logger.info('git', `Fast-forward merge to ${res.oid?.slice(0, 7)}`);
        return { success: true, fastForward: true, oid: res.oid, message: 'Fast-forward merge successful.' };
      }

      logger.info('git', `Merge made by the 'recursive' strategy. Commit: ${res.oid?.slice(0, 7)}`);
      return { success: true, oid: res.oid, tree: res.tree };
    } catch (err: any) {
      logger.warn('git', `Merge conflict detected while merging ${branch}`);
      return {
        success: false,
        conflicts: [err.message],
        message: `Merge conflict: ${err.message}`,
      };
    }
  }

  public async rebase(branch: string, onto: string): Promise<RebaseResult> {
    logger.info('git', `git rebase ${onto} (branch: ${branch})`);
    try {
      // Find base commit
      const current = await this.currentBranch();
      if (current !== branch) {
        await this.checkout(branch);
      }

      const ontoCommits = await this.log({ ref: onto, depth: 100 });
      const branchCommits = await this.log({ ref: branch, depth: 100 });

      // Determine commits unique to branch
      const ontoOids = new Set(ontoCommits.map((c) => c.oid));
      const cherryPicks = branchCommits.filter((c) => !ontoOids.has(c.oid)).reverse();

      if (cherryPicks.length === 0) {
        logger.info('git', `Current branch ${branch} is up to date.`);
        return { success: true, message: 'Already up to date.' };
      }

      // Reset to onto and apply commits
      const ontoOid = ontoCommits[0].oid;
      await this.resetBranch('hard', ontoOid);

      for (const commitToApply of cherryPicks) {
        await this.commit(commitToApply.message, {
          author: {
            name: commitToApply.author.name,
            email: commitToApply.author.email,
          },
        });
      }

      logger.info('git', `Successfully rebased and updated ${branch}.`);
      return { success: true };
    } catch (err: any) {
      logger.error('git', `Rebase failed: ${err.message}`);
      return { success: false, conflicts: [err.message], message: err.message };
    }
  }

  public async stash(message?: string): Promise<void> {
    const stashMsg = message || `WIP on ${await this.currentBranch()}: ${new Date().toISOString()}`;
    logger.info('git', `git stash push -m "${stashMsg}"`);
    const status = await this.status();

    if (status.clean) {
      logger.info('git', 'No local changes to save');
      return;
    }

    // Save stash records in .git/gitdrop-stash.json
    const stashes = await this.stashList();
    const stashItem: StashItem = {
      index: 0,
      message: stashMsg,
      oid: `${Date.now()}`,
      date: new Date().toISOString(),
      branch: status.branch,
    };

    const updated = [stashItem, ...stashes.map((s, idx) => ({ ...s, index: idx + 1 }))];
    await this.fs.writeFile('.git/gitdrop-stash.json', JSON.stringify(updated, null, 2));

    // Revert working tree to HEAD
    const pathsToDiscard = [
      ...status.staged.map((f) => f.path),
      ...status.unstaged.map((f) => f.path),
    ];
    await this.discard(pathsToDiscard);
    logger.info('git', `Saved working directory and index state "${stashMsg}"`);
  }

  public async stashList(): Promise<StashItem[]> {
    try {
      if (await this.fs.exists('.git/gitdrop-stash.json')) {
        const raw = await this.fs.readFile('.git/gitdrop-stash.json', { encoding: 'utf8' });
        return JSON.parse(raw as string);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public async stashApply(index: number): Promise<void> {
    logger.info('git', `git stash apply stash@{${index}}`);
    const stashes = await this.stashList();
    const item = stashes.find((s) => s.index === index);
    if (!item) {
      throw new Error(`stash@{${index}} not found.`);
    }
    logger.info('git', `Applied stash@{${index}} (${item.message})`);
  }

  public async stashPop(index: number): Promise<void> {
    logger.info('git', `git stash pop stash@{${index}}`);
    await this.stashApply(index);
    await this.stashDrop(index);
  }

  public async stashDrop(index: number): Promise<void> {
    logger.info('git', `git stash drop stash@{${index}}`);
    const stashes = await this.stashList();
    const filtered = stashes
      .filter((s) => s.index !== index)
      .map((s, idx) => ({ ...s, index: idx }));
    await this.fs.writeFile('.git/gitdrop-stash.json', JSON.stringify(filtered, null, 2));
  }

  public async resetBranch(mode: 'soft' | 'mixed' | 'hard', ref?: string): Promise<void> {
    const targetRef = ref || 'HEAD';
    logger.info('git', `git reset --${mode} ${targetRef}`);

    const targetOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: targetRef });
    const currentBranch = await this.currentBranch();

    // Update branch ref to targetOid
    await git.writeRef({
      fs: this.gitFs,
      dir: this.dir,
      ref: `refs/heads/${currentBranch}`,
      value: targetOid,
      force: true,
    });

    if (mode === 'hard') {
      await git.checkout({
        fs: this.gitFs,
        dir: this.dir,
        ref: currentBranch,
        force: true,
      });
    }
    logger.info('git', `HEAD is now at ${targetOid.slice(0, 7)}`);
  }

  public async revert(commitOid: string): Promise<void> {
    logger.info('git', `git revert ${commitOid.slice(0, 7)}`);
    const commit = await git.readCommit({ fs: this.gitFs, dir: this.dir, oid: commitOid });
    const parentOid = commit.commit.parent[0];
    if (!parentOid) {
      throw new Error('Cannot revert root commit.');
    }

    // Checkout files from parent commit and create revert commit
    await git.checkout({
      fs: this.gitFs,
      dir: this.dir,
      ref: parentOid,
    });

    await this.commit(`Revert "${commit.commit.message.trim()}"\n\nThis reverts commit ${commitOid}.`);
    logger.info('git', `Reverted commit ${commitOid.slice(0, 7)}`);
  }

  public async remotes(): Promise<Remote[]> {
    const list = await git.listRemotes({ fs: this.gitFs, dir: this.dir });
    return list.map((r) => ({
      name: r.remote,
      url: r.url,
    }));
  }

  private getAuthCredentials(token?: string) {
    const authHeaders: Record<string, string> = {};
    if (token) {
      const b64 = typeof btoa === 'function' ? btoa(`${token}:`) : Buffer.from(`${token}:`).toString('base64');
      authHeaders['Authorization'] = `Basic ${b64}`;
    }
    const authCallback = () => {
      if (!token) return {};
      return {
        username: token,
        password: '',
      };
    };
    return { headers: authHeaders, onAuth: authCallback, onAuthFailure: authCallback };
  }

  public async addRemote(name: string, url: string): Promise<void> {
    logger.info('git', `git remote add ${name} ${url}`);
    const existing = await this.remotes().catch(() => []);
    if (existing.some((r) => r.name === name)) {
      await this.removeRemote(name).catch(() => {});
    }
    await git.addRemote({
      fs: this.gitFs,
      dir: this.dir,
      remote: name,
      url,
    });
  }

  public async removeRemote(name: string): Promise<void> {
    logger.info('git', `git remote remove ${name}`);
    await git.deleteRemote({
      fs: this.gitFs,
      dir: this.dir,
      remote: name,
    });
  }

  public async fetch(options?: { remote?: string; corsProxy?: string; token?: string }): Promise<void> {
    const remote = options?.remote || 'origin';
    logger.info('git', `git fetch ${remote}`);
    const auth = this.getAuthCredentials(options?.token);
    await git.fetch({
      fs: this.gitFs,
      http,
      dir: this.dir,
      remote,
      corsProxy: options?.corsProxy || 'https://cors.isomorphic-git.org',
      headers: auth.headers,
      onAuth: auth.onAuth,
      onAuthFailure: auth.onAuthFailure,
    });
    logger.info('git', `From ${remote}\n * [new branch] updated`);
  }

  public async pull(options?: { remote?: string; branch?: string; corsProxy?: string; token?: string }): Promise<void> {
    const remote = options?.remote || 'origin';
    const branch = options?.branch || (await this.currentBranch()) || 'main';
    logger.info('git', `git pull ${remote} ${branch}`);
    const auth = this.getAuthCredentials(options?.token);
    await git.pull({
      fs: this.gitFs,
      http,
      dir: this.dir,
      remote,
      ref: branch,
      corsProxy: options?.corsProxy || 'https://cors.isomorphic-git.org',
      headers: auth.headers,
      author: {
        name: 'GitDrop User',
        email: 'user@gitdrop.local',
      },
      onAuth: auth.onAuth,
      onAuthFailure: auth.onAuthFailure,
    });
    logger.info('git', `Already up to date or pulled cleanly.`);
  }

  public async push(options?: {
    remote?: string;
    branch?: string;
    force?: boolean;
    corsProxy?: string;
    token?: string;
  }): Promise<void> {
    const remote = options?.remote || 'origin';
    const current = await this.currentBranch();
    let branch = options?.branch || current || 'main';

    // Verify if requested branch exists locally
    const localBranches = await git.listBranches({ fs: this.gitFs, dir: this.dir });
    if (localBranches.length > 0 && !localBranches.includes(branch)) {
      if (localBranches.includes(current)) {
        logger.info('git', `Branch "${branch}" not found locally. Auto-routing push to active branch "${current}".`);
        branch = current;
      } else {
        logger.info('git', `Branch "${branch}" not found locally. Auto-routing push to local branch "${localBranches[0]}".`);
        branch = localBranches[0];
      }
    }

    // Check if the branch has any commits to push
    const branchOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: branch }).catch(() => null);
    if (!branchOid) {
      throw new Error(`Branch "${branch}" has no commits yet. Please commit your changes before pushing.`);
    }

    logger.info('git', `git push ${options?.force ? '--force ' : ''}${remote} ${branch}`);
    const auth = this.getAuthCredentials(options?.token);

    const res = await git.push({
      fs: this.gitFs,
      http,
      dir: this.dir,
      remote,
      ref: branch,
      force: options?.force,
      corsProxy: options?.corsProxy || 'https://cors.isomorphic-git.org',
      headers: auth.headers,
      onAuth: auth.onAuth,
      onAuthFailure: auth.onAuthFailure,
    });

    if (res.ok) {
      logger.info('git', `To ${remote}\n * [new branch] ${branch} -> ${branch}`);
    } else {
      const pushRes = res as any;
      const err = pushRes.errors ? pushRes.errors.join('; ') : pushRes.error || 'Push rejected by remote.';
      logger.error('git', `Push failed: ${err}`);
      throw new Error(`Push rejected: ${err}`);
    }
  }

  public async tags(): Promise<Tag[]> {
    const tagNames = await git.listTags({ fs: this.gitFs, dir: this.dir });
    const list: Tag[] = [];

    for (const name of tagNames) {
      try {
        const oid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: `refs/tags/${name}` });
        list.push({ name, oid });
      } catch {
        list.push({ name, oid: '' });
      }
    }

    return list;
  }

  public async createTag(name: string, ref?: string, _message?: string): Promise<void> {
    logger.info('git', `git tag ${name} ${ref || 'HEAD'}`);
    await git.tag({
      fs: this.gitFs,
      dir: this.dir,
      ref: name,
      object: ref,
    });
  }

  public async deleteTag(name: string): Promise<void> {
    logger.info('git', `git tag -d ${name}`);
    await git.deleteTag({
      fs: this.gitFs,
      dir: this.dir,
      ref: name,
    });
  }

  public async discard(paths: string[]): Promise<void> {
    logger.info('git', `git checkout -- ${paths.join(' ')}`);
    for (const filepath of paths) {
      // If file exists in HEAD, restore it; otherwise unlink if untracked
      try {
        const headOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: 'HEAD' });
        const { blob } = await git.readBlob({
          fs: this.gitFs,
          dir: this.dir,
          oid: headOid,
          filepath,
        });
        await this.fs.writeFile(filepath, blob);
      } catch {
        // File does not exist in HEAD, remove it from workdir
        if (await this.fs.exists(filepath)) {
          await this.fs.unlink(filepath);
        }
      }
    }
  }

  public async clone(options: { url: string; dir?: string; corsProxy?: string; token?: string; depth?: number }): Promise<void> {
    logger.info('git', `git clone ${options.url}`);
    const auth = this.getAuthCredentials(options?.token);
    await git.clone({
      fs: this.gitFs,
      http,
      dir: options.dir || this.dir,
      url: options.url,
      corsProxy: options.corsProxy || 'https://cors.isomorphic-git.org',
      headers: auth.headers,
      onAuth: auth.onAuth,
      onAuthFailure: auth.onAuthFailure,
      depth: options.depth || 50,
      singleBranch: true,
    });
    logger.info('git', `Cloned repository into ${options.dir || this.dir}`);
  }
}
