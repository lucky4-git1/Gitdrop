import { describe, it, expect } from 'vitest';
import { parseConflicts, resolveAcceptCurrent, resolveAcceptIncoming } from './conflictParser';
import { computeCommitGraph } from './graphLayout';
import { Commit } from '@/types/git';

describe('conflictParser', () => {
  const sampleConflict = `
function getTheme() {
<<<<<<< HEAD
  return 'dark-mode';
=======
  return 'light-mode';
>>>>>>> feature/theme
}
`;

  it('detects and parses git conflict markers', () => {
    const result = parseConflicts(sampleConflict);
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].currentBranch).toBe('HEAD');
    expect(result.conflicts[0].incomingBranch).toBe('feature/theme');
    expect(result.conflicts[0].currentText).toContain("return 'dark-mode';");
    expect(result.conflicts[0].incomingText).toContain("return 'light-mode';");
  });

  it('resolves accepting current branch', () => {
    const resolved = resolveAcceptCurrent(sampleConflict);
    expect(resolved).toContain("return 'dark-mode';");
    expect(resolved).not.toContain('<<<<<<<');
    expect(resolved).not.toContain('>>>>>>>');
  });

  it('resolves accepting incoming branch', () => {
    const resolved = resolveAcceptIncoming(sampleConflict);
    expect(resolved).toContain("return 'light-mode';");
    expect(resolved).not.toContain('<<<<<<<');
    expect(resolved).not.toContain('>>>>>>>');
  });
});

describe('graphLayout', () => {
  it('computes DAG layout for linear and branching commits', () => {
    const commits: Commit[] = [
      {
        oid: 'c3',
        message: 'commit 3',
        tree: 't3',
        parent: ['c2', 'b1'], // merge commit
        author: { name: 'User', email: 'u@test.com', timestamp: 3 },
        committer: { name: 'User', email: 'u@test.com', timestamp: 3 },
      },
      {
        oid: 'b1',
        message: 'feature commit',
        tree: 'tb1',
        parent: ['c1'],
        author: { name: 'User', email: 'u@test.com', timestamp: 2 },
        committer: { name: 'User', email: 'u@test.com', timestamp: 2 },
      },
      {
        oid: 'c2',
        message: 'commit 2',
        tree: 't2',
        parent: ['c1'],
        author: { name: 'User', email: 'u@test.com', timestamp: 2 },
        committer: { name: 'User', email: 'u@test.com', timestamp: 2 },
      },
      {
        oid: 'c1',
        message: 'initial commit',
        tree: 't1',
        parent: [],
        author: { name: 'User', email: 'u@test.com', timestamp: 1 },
        committer: { name: 'User', email: 'u@test.com', timestamp: 1 },
      },
    ];

    const graph = computeCommitGraph(commits, 'c3');
    expect(graph.nodes.length).toBe(4);
    expect(graph.links.length).toBeGreaterThan(0);
    expect(graph.nodes[0].isHead).toBe(true);
  });
});
