import * as git from 'isomorphic-git';
import { IFileSystem } from '@/types/filesystem';
import { DiffFile } from '@/types/git';
import { createIsomorphicGitFs } from '../filesystem/isomorphicGitFsBridge';

export class DiffService {
  private fs: IFileSystem;
  private dir: string;
  private gitFs: any;

  constructor(fs: IFileSystem, dir: string = '/') {
    this.fs = fs;
    this.dir = dir;
    this.gitFs = createIsomorphicGitFs(fs);
  }

  /**
   * Retrieves oldContent and newContent for a file diff.
   */
  public async getFileDiff(
    filepath: string,
    options?: { staged?: boolean; commitOid?: string }
  ): Promise<DiffFile> {
    let oldContent = '';
    let newContent = '';
    let status: 'modified' | 'added' | 'deleted' = 'modified';

    try {
      if (options?.commitOid) {
        // Diff between this commit and its parent
        const commit = await git.readCommit({
          fs: this.gitFs,
          dir: this.dir,
          oid: options.commitOid,
        });

        // Read modified content from commit
        try {
          const { blob } = await git.readBlob({
            fs: this.gitFs,
            dir: this.dir,
            oid: options.commitOid,
            filepath,
          });
          newContent = new TextDecoder().decode(blob);
        } catch {
          newContent = '';
        }

        // Read old content from parent commit
        if (commit.commit.parent && commit.commit.parent.length > 0) {
          try {
            const { blob } = await git.readBlob({
              fs: this.gitFs,
              dir: this.dir,
              oid: commit.commit.parent[0],
              filepath,
            });
            oldContent = new TextDecoder().decode(blob);
          } catch {
            oldContent = '';
          }
        }
      } else if (options?.staged) {
        // Staged diff: HEAD vs Index/Stage
        // Read HEAD blob
        try {
          const headOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: 'HEAD' });
          const { blob } = await git.readBlob({
            fs: this.gitFs,
            dir: this.dir,
            oid: headOid,
            filepath,
          });
          oldContent = new TextDecoder().decode(blob);
        } catch {
          oldContent = ''; // New file added to index
          status = 'added';
        }

        // For staged content, we can read from workdir or index
        try {
          const content = await this.fs.readFile(filepath, { encoding: 'utf8' });
          newContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
        } catch {
          newContent = '';
          status = 'deleted';
        }
      } else {
        // Unstaged diff: Index/HEAD vs Workdir
        try {
          const headOid = await git.resolveRef({ fs: this.gitFs, dir: this.dir, ref: 'HEAD' });
          const { blob } = await git.readBlob({
            fs: this.gitFs,
            dir: this.dir,
            oid: headOid,
            filepath,
          });
          oldContent = new TextDecoder().decode(blob);
        } catch {
          oldContent = '';
          status = 'added';
        }

        try {
          const content = await this.fs.readFile(filepath, { encoding: 'utf8' });
          newContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
        } catch {
          newContent = '';
          status = 'deleted';
        }
      }

      if (!oldContent && newContent) {
        status = 'added';
      } else if (oldContent && !newContent) {
        status = 'deleted';
      } else {
        status = 'modified';
      }

      return {
        path: filepath,
        oldPath: filepath,
        newPath: filepath,
        status,
        oldContent,
        newContent,
      };
    } catch {
      return {
        path: filepath,
        status: 'modified',
        oldContent: '',
        newContent: '',
      };
    }
  }
}
