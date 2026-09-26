import { describe, it, expect } from 'vitest';
import { MemoryFS } from '@/services/filesystem/MemoryFS';
import { BrowserGitAdapter } from '@/services/git/BrowserGitAdapter';

describe('Integration: Complete Git Workflow Journey', () => {
  it('executes full workflow: init -> stage -> commit -> branch -> modify -> commit -> merge', async () => {
    const fs = new MemoryFS();
    const git = new BrowserGitAdapter(fs, '/');

    // 1. Initialize
    await git.init({
      defaultBranch: 'main',
      user: { name: 'Staff Engineer', email: 'staff@example.com' },
    });

    let status = await git.status();
    expect(status.branch).toBe('main');
    expect(status.clean).toBe(true);

    // 2. Create initial project files
    await fs.writeFile('package.json', JSON.stringify({ name: 'test-app', version: '1.0.0' }));
    await fs.writeFile('src/index.js', 'console.log("v1");\n');

    status = await git.status();
    expect(status.unstaged.length).toBe(2);

    // 3. Stage all files
    await git.add(['package.json', 'src/index.js']);
    status = await git.status();
    expect(status.staged.length).toBe(2);
    expect(status.unstaged.length).toBe(0);

    // 4. Initial commit
    const initialCommit = await git.commit('feat: initial commit');
    expect(initialCommit.oid).toBeDefined();

    status = await git.status();
    expect(status.clean).toBe(true);

    // 5. Create feature branch
    await git.createBranch('feature/auth');
    await git.checkout('feature/auth');
    expect(await git.currentBranch()).toBe('feature/auth');

    // 6. Modify on feature branch
    await fs.writeFile('src/auth.js', 'export const login = () => true;\n');
    await git.add(['src/auth.js']);
    const authCommit = await git.commit('feat(auth): add login method');
    expect(authCommit.oid).toBeDefined();

    // 7. Checkout main
    await git.checkout('main');
    expect(await git.currentBranch()).toBe('main');

    // 8. Merge feature branch into main
    const mergeResult = await git.merge('feature/auth');
    expect(mergeResult.success).toBe(true);

    // 9. Verify commits in log
    const log = await git.log({ depth: 10 });
    expect(log.length).toBeGreaterThanOrEqual(2);
    expect(log.some((c) => c.message.includes('add login method'))).toBe(true);

    // 10. Tag release
    await git.createTag('v1.0.0');
    const tags = await git.tags();
    expect(tags.some((t) => t.name === 'v1.0.0')).toBe(true);
  });
});
