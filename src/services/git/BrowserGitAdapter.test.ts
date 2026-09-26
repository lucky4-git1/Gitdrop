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
});
