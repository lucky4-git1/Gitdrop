import { FileStat, IFileSystem } from '@/types/filesystem';
import { normalizePath, dirname } from './pathUtils';

interface MemoryNode {
  type: 'file' | 'dir';
  content?: Uint8Array;
  mtime: number;
}

export class MemoryFS implements IFileSystem {
  private tree = new Map<string, MemoryNode>();

  constructor() {
    // Root directory
    this.tree.set('', { type: 'dir', mtime: Date.now() });
  }

  public async readFile(filepath: string, options?: { encoding?: string }): Promise<Uint8Array | string> {
    const norm = normalizePath(filepath);
    const node = this.tree.get(norm);
    if (!node) {
      const err: any = new Error(`ENOENT: no such file or directory, open '${filepath}'`);
      err.code = 'ENOENT';
      throw err;
    }
    if (node.type === 'dir') {
      const err: any = new Error(`EISDIR: illegal operation on a directory, read '${filepath}'`);
      err.code = 'EISDIR';
      throw err;
    }
    const data = node.content ?? new Uint8Array(0);
    if (options?.encoding === 'utf8') {
      return new TextDecoder().decode(data);
    }
    return data;
  }

  public async writeFile(filepath: string, data: Uint8Array | string): Promise<void> {
    const norm = normalizePath(filepath);
    const dir = dirname(norm);
    if (dir && !this.tree.has(dir)) {
      await this.mkdir(dir);
    }

    let bytes: Uint8Array;
    if (typeof data === 'string') {
      bytes = new TextEncoder().encode(data);
    } else {
      bytes = data;
    }

    this.tree.set(norm, {
      type: 'file',
      content: bytes,
      mtime: Date.now(),
    });
  }

  public async unlink(filepath: string): Promise<void> {
    const norm = normalizePath(filepath);
    if (!this.tree.has(norm)) {
      const err: any = new Error(`ENOENT: no such file or directory, unlink '${filepath}'`);
      err.code = 'ENOENT';
      throw err;
    }
    this.tree.delete(norm);
  }

  public async readdir(dirpath: string): Promise<string[]> {
    const norm = normalizePath(dirpath);
    const dir = this.tree.get(norm);
    if (!dir && norm !== '') {
      const err: any = new Error(`ENOENT: no such file or directory, scandir '${dirpath}'`);
      err.code = 'ENOENT';
      throw err;
    }
    if (dir && dir.type !== 'dir') {
      const err: any = new Error(`ENOTDIR: not a directory, scandir '${dirpath}'`);
      err.code = 'ENOTDIR';
      throw err;
    }

    const prefix = norm ? `${norm}/` : '';
    const entries = new Set<string>();

    for (const key of this.tree.keys()) {
      if (!key) continue;
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const slashIdx = rest.indexOf('/');
        const entryName = slashIdx === -1 ? rest : rest.substring(0, slashIdx);
        if (entryName) {
          entries.add(entryName);
        }
      }
    }

    return Array.from(entries).sort();
  }

  public async mkdir(dirpath: string): Promise<void> {
    const norm = normalizePath(dirpath);
    if (!norm) return;

    const parts = norm.split('/');
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.tree.has(current)) {
        this.tree.set(current, {
          type: 'dir',
          mtime: Date.now(),
        });
      }
    }
  }

  public async rmdir(dirpath: string, options?: { recursive?: boolean }): Promise<void> {
    const norm = normalizePath(dirpath);
    if (!this.tree.has(norm)) {
      const err: any = new Error(`ENOENT: no such file or directory, rmdir '${dirpath}'`);
      err.code = 'ENOENT';
      throw err;
    }

    const prefix = norm ? `${norm}/` : '';
    const toDelete: string[] = [norm];

    for (const key of this.tree.keys()) {
      if (key.startsWith(prefix)) {
        if (!options?.recursive) {
          const err: any = new Error(`ENOTEMPTY: directory not empty, rmdir '${dirpath}'`);
          err.code = 'ENOTEMPTY';
          throw err;
        }
        toDelete.push(key);
      }
    }

    for (const k of toDelete) {
      this.tree.delete(k);
    }
  }

  public async stat(filepath: string): Promise<FileStat> {
    const norm = normalizePath(filepath);
    const node = this.tree.get(norm);
    if (!node) {
      const err: any = new Error(`ENOENT: no such file or directory, stat '${filepath}'`);
      err.code = 'ENOENT';
      throw err;
    }

    const isFile = node.type === 'file';
    const isDir = node.type === 'dir';
    const size = node.content ? node.content.byteLength : 0;
    const mtime = node.mtime;

    return {
      isFile: () => isFile,
      isDirectory: () => isDir,
      isSymbolicLink: () => false,
      size,
      mtimeMs: mtime,
      ctimeMs: mtime,
      mode: isDir ? 0o040755 : 0o100644,
      ino: 1,
      uid: 1,
      gid: 1,
      dev: 1,
    };
  }

  public async lstat(filepath: string): Promise<FileStat> {
    return this.stat(filepath);
  }

  public async exists(filepath: string): Promise<boolean> {
    try {
      const norm = normalizePath(filepath);
      return this.tree.has(norm);
    } catch {
      return false;
    }
  }
}
