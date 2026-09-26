import { describe, it, expect } from 'vitest';
import * as git from 'isomorphic-git';
import { MemoryFS } from './MemoryFS';
import { createIsomorphicGitFs } from './isomorphicGitFsBridge';

describe('MemoryFS & isomorphic-git integration', () => {
  it('initializes a git repository and creates initial commit', async () => {
    const fs = new MemoryFS();
    const gitFs = createIsomorphicGitFs(fs);
    const dir = '/';

    // 1. Initialize git repository
    await git.init({
      fs: gitFs,
      dir,
      defaultBranch: 'main',
    });

    const isGit = await fs.exists('.git');
    expect(isGit).toBe(true);

    // 2. Write a file
    await fs.writeFile('README.md', '# GitDrop Test Project\nDeterministic visual git client.');
    expect(await fs.exists('README.md')).toBe(true);

    // 3. Status matrix
    const matrix = await git.statusMatrix({
      fs: gitFs,
      dir,
    });
    // [ [ 'README.md', 0, 2, 0 ] ] (head: 0, workdir: 2, stage: 0) -> untracked
    expect(matrix.length).toBe(1);
    expect(matrix[0][0]).toBe('README.md');

    // 4. Stage the file
    await git.add({
      fs: gitFs,
      dir,
      filepath: 'README.md',
    });

    // 5. Commit
    const commitSha = await git.commit({
      fs: gitFs,
      dir,
      message: 'Initial commit',
      author: {
        name: 'GitDrop Developer',
        email: 'dev@gitdrop.local',
      },
    });

    expect(commitSha).toBeDefined();
    expect(typeof commitSha).toBe('string');
    expect(commitSha.length).toBe(40);

    // 6. Read log
    const log = await git.log({
      fs: gitFs,
      dir,
      depth: 5,
    });

    expect(log.length).toBe(1);
    expect(log[0].commit.message.trim()).toBe('Initial commit');
    expect(log[0].commit.author.name).toBe('GitDrop Developer');
  });

  it('creates branches and switches branches', async () => {
    const fs = new MemoryFS();
    const gitFs = createIsomorphicGitFs(fs);
    const dir = '/';

    await git.init({ fs: gitFs, dir, defaultBranch: 'main' });
    await fs.writeFile('app.js', 'console.log("main");');
    await git.add({ fs: gitFs, dir, filepath: 'app.js' });
    await git.commit({
      fs: gitFs,
      dir,
      message: 'main commit',
      author: { name: 'Dev', email: 'dev@test.com' },
    });

    // Create branch
    await git.branch({
      fs: gitFs,
      dir,
      ref: 'feature/auth',
    });

    const branches = await git.listBranches({ fs: gitFs, dir });
    expect(branches).toContain('main');
    expect(branches).toContain('feature/auth');

    // Checkout feature/auth
    await git.checkout({
      fs: gitFs,
      dir,
      ref: 'feature/auth',
    });

    const currentBranch = await git.currentBranch({ fs: gitFs, dir });
    expect(currentBranch).toBe('feature/auth');
  });
});
