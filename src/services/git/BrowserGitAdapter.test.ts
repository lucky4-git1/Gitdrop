import { describe, it, expect } from 'vitest';
import { MemoryFS } from '../filesystem/MemoryFS';
import { BrowserGitAdapter } from './BrowserGitAdapter';

describe('BrowserGitAdapter', () => {
  it('performs full local git lifecycle: init -> add -> commit -> branch -> checkout -> diff', async () => {
    const fs = new MemoryFS();
    const adapter = new BrowserGitAdapter(fs, '/');

    // 1. Initialize
    await adapter.init({
      defaultBranch: 'main',
      user: { name: 'Alice Developer', email: 'alice@example.com' },
    });

    let status = await adapter.status();
    expect(status.branch).toBe('main');
    expect(status.clean).toBe(true);

    // 2. Create file and check status
    await fs.writeFile('index.js', 'console.log("Hello GitDrop");\n');
    status = await adapter.status();
    expect(status.clean).toBe(false);
    expect(status.unstaged.length).toBe(1);
    expect(status.unstaged[0].path).toBe('index.js');
    expect(status.unstaged[0].status).toBe('untracked');

    // 3. Stage file
    await adapter.add(['index.js']);
    status = await adapter.status();
    expect(status.staged.length).toBe(1);
    expect(status.staged[0].path).toBe('index.js');

    // 4. Commit
    const commit = await adapter.commit('feat: initial release');
    expect(commit.oid).toBeDefined();
    expect(commit.message.trim()).toBe('feat: initial release');

    status = await adapter.status();
    expect(status.clean).toBe(true);

    // 5. Check log
    const commits = await adapter.log();
    expect(commits.length).toBe(1);
    expect(commits[0].oid).toBe(commit.oid);

    // 6. Branch operations
    await adapter.createBranch('feature/ui');
    const branches = await adapter.branch();
    const branchNames = branches.map((b) => b.name);
    expect(branchNames).toContain('main');
    expect(branchNames).toContain('feature/ui');

    await adapter.checkout('feature/ui');
    const current = await adapter.currentBranch();
    expect(current).toBe('feature/ui');

    // 7. Make modification and diff
    await fs.writeFile('index.js', 'console.log("Hello GitDrop Updated");\n');
    const diffs = await adapter.diff({ filepath: 'index.js' });
    expect(diffs.length).toBe(1);
    expect(diffs[0].oldContent).toContain('Hello GitDrop');
    expect(diffs[0].newContent).toContain('Hello GitDrop Updated');

    // 8. Stash changes
    await adapter.stash('WIP on UI');
    const stashes = await adapter.stashList();
    expect(stashes.length).toBe(1);
    expect(stashes[0].message).toBe('WIP on UI');

    // 9. Tags
    await adapter.createTag('v1.0.0');
    const tags = await adapter.tags();
    expect(tags.some((t) => t.name === 'v1.0.0')).toBe(true);
  });

  it('auto-commits unstaged files when push is initiated on a fresh repository without commits', async () => {
    const fs = new MemoryFS();
    const adapter = new BrowserGitAdapter(fs, '/');

    await adapter.init({
      defaultBranch: 'main',
      user: { name: 'Alice Developer', email: 'alice@example.com' },
    });

    // Create unstaged file
    await fs.writeFile('README.md', '# GitDrop Auto Commit Test\n');

    // Attempt push without manual commit. Since remote is not real, push fails at network,
    // but the initial commit must have been created in the local repository.
    await expect(adapter.push({ remote: 'origin', branch: 'main' })).rejects.toThrow();

    const commits = await adapter.log();
    expect(commits.length).toBe(1);
    expect(commits[0].message.trim()).toBe('Initial commit via GitDrop');
  });

  it('self-heals missing .git/HEAD and missing directories when status is read on a damaged or pre-configured repository', async () => {
    const fs = new MemoryFS();
    const adapter = new BrowserGitAdapter(fs, '/');

    // Simulate directory where .git/config exists (e.g. from adding remote) but .git/HEAD is missing
    await fs.mkdir('.git');
    await fs.writeFile(
      '.git/config',
      '[remote "origin"]\n\turl = https://github.com/example/test.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n'
    );
    await fs.writeFile('app.js', 'console.log("hello");\n');

    // status() should not throw NotFoundError: Could not find HEAD
    const status = await adapter.status();
    expect(status.branch).toBe('main');
    expect(status.clean).toBe(false);
    expect(status.unstaged.length).toBe(1);
    expect(status.unstaged[0].path).toBe('app.js');

    // Check that .git/HEAD was created
    expect(await fs.exists('.git/HEAD')).toBe(true);
  });

  it('detects remotes from pre-existing .git/config correctly', async () => {
    const fs = new MemoryFS();
    const adapter = new BrowserGitAdapter(fs, '/');

    await fs.mkdir('.git');
    await fs.writeFile(
      '.git/config',
      '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = https://github.com/my-org/my-project.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n[remote "upstream"]\n\turl = git@github.com:upstream-org/upstream-project.git\n\tfetch = +refs/heads/*:refs/remotes/upstream/*\n'
    );

    const remotes = await adapter.remotes();
    expect(remotes.length).toBe(2);
    expect(remotes[0].name).toBe('origin');
    expect(remotes[0].url).toBe('https://github.com/my-org/my-project.git');
    expect(remotes[1].name).toBe('upstream');
    expect(remotes[1].url).toBe('git@github.com:upstream-org/upstream-project.git');
  });

  it('allows adding and updating remotes without throwing AlreadyExistsError', async () => {
    const fs = new MemoryFS();
    const adapter = new BrowserGitAdapter(fs, '/');

    await adapter.init({
      defaultBranch: 'main',
      user: { name: 'Alice Developer', email: 'alice@example.com' },
    });

    // Add initial remote
    await adapter.addRemote('origin', 'https://github.com/test/repo.git');
    let remotes = await adapter.remotes();
    expect(remotes.find((r) => r.name === 'origin')?.url).toBe('https://github.com/test/repo.git');

    // Update same remote without error
    await adapter.addRemote('origin', 'https://github.com/test/updated-repo.git');
    remotes = await adapter.remotes();
    expect(remotes.find((r) => r.name === 'origin')?.url).toBe('https://github.com/test/updated-repo.git');
  });
});


