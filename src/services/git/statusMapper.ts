import { GitFileStatus, FileStatusCode } from '@/types/git';

export interface MappedStatus {
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  conflicted: GitFileStatus[];
}

/**
 * Maps isomorphic-git statusMatrix row [filepath, head, workdir, stage]
 * into staged and unstaged file lists with clean status badges.
 */
export function mapStatusMatrix(matrix: [string, number, number, number][]): MappedStatus {
  const staged: GitFileStatus[] = [];
  const unstaged: GitFileStatus[] = [];
  const conflicted: GitFileStatus[] = [];

  for (const [path, head, workdir, stage] of matrix) {
    // [0, 0, 0] or [1, 1, 1] means completely clean/unmodified
    if (head === 1 && workdir === 1 && stage === 1) {
      continue;
    }
    if (head === 0 && workdir === 0 && stage === 0) {
      continue;
    }

    // 1. Check Staged Status (difference between HEAD and STAGE)
    if (stage !== head) {
      let status: FileStatusCode = 'modified';
      if (head === 0 && stage >= 2) {
        status = 'added';
      } else if (head === 1 && stage === 0) {
        status = 'deleted';
      } else if (stage >= 2) {
        status = 'modified';
      }

      staged.push({
        path,
        status,
        staged: true,
        unstaged: false,
      });
    }

    // 2. Check Unstaged Status (difference between STAGE and WORKDIR)
    if (workdir !== stage) {
      let status: FileStatusCode = 'modified';
      if (head === 0 && stage === 0 && workdir === 2) {
        status = 'untracked';
      } else if (workdir === 0 && (stage >= 1 || head >= 1)) {
        status = 'deleted';
      } else if (workdir === 2) {
        status = 'modified';
      }

      unstaged.push({
        path,
        status,
        staged: false,
        unstaged: true,
      });
    }
  }

  return {
    staged: staged.sort((a, b) => a.path.localeCompare(b.path)),
    unstaged: unstaged.sort((a, b) => a.path.localeCompare(b.path)),
    conflicted: conflicted.sort((a, b) => a.path.localeCompare(b.path)),
  };
}
