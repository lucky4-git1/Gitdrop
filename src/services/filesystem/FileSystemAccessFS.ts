import { FileStat, IFileSystem } from '@/types/filesystem';
import { normalizePath, dirname, basename } from './pathUtils';

export class FileSystemAccessFS implements IFileSystem {
  private rootHandle: FileSystemDirectoryHandle;
  private dirCache = new Map<string, FileSystemDirectoryHandle>();

  constructor(rootHandle: FileSystemDirectoryHandle) {
    this.rootHandle = rootHandle;
    this.dirCache.set('', rootHandle);
  }

  public getRootHandle(): FileSystemDirectoryHandle {
    return this.rootHandle;
  }

  public clearCache(): void {
    this.dirCache.clear();
    this.dirCache.set('', this.rootHandle);
  }

  private async getDirectory(dirpath: string, create = false): Promise<FileSystemDirectoryHandle> {
    const norm = normalizePath(dirpath);
    if (!norm) return this.rootHandle;

    if (this.dirCache.has(norm)) {
      return this.dirCache.get(norm)!;
    }

    const parts = norm.split('/');
    let currentHandle = this.rootHandle;
    let accumulated = '';

    for (const part of parts) {
      accumulated = accumulated ? `${accumulated}/${part}` : part;
      if (this.dirCache.has(accumulated)) {
        currentHandle = this.dirCache.get(accumulated)!;
      } else {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(part, { create });
          this.dirCache.set(accumulated, currentHandle);
        } catch (_err: any) {
          const e: any = new Error(`ENOENT: no such file or directory, open directory '${dirpath}'`);
          e.code = 'ENOENT';
          throw e;
        }
      }
    }

    return currentHandle;
  }

  public async readFile(filepath: string, options?: { encoding?: string }): Promise<Uint8Array | string> {
    const norm = normalizePath(filepath);
    const dir = dirname(norm);
    const file = basename(norm);

    const dirHandle = await this.getDirectory(dir, false);
    try {
      const fileHandle = await dirHandle.getFileHandle(file);
      const webFile = await fileHandle.getFile();
      const arrayBuffer = await webFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      if (options?.encoding === 'utf8') {
        return new TextDecoder().decode(uint8);
      }
      return uint8;
    } catch (_err: any) {
      const e: any = new Error(`ENOENT: no such file or directory, open '${filepath}'`);
      e.code = 'ENOENT';
      throw e;
    }
  }

  public async writeFile(filepath: string, data: Uint8Array | string): Promise<void> {
    const norm = normalizePath(filepath);
    const dir = dirname(norm);
    const file = basename(norm);

    const dirHandle = await this.getDirectory(dir, true);
    const fileHandle = await dirHandle.getFileHandle(file, { create: true });
    
    // In Chromium, createWritable writes directly to disk
    const writable = await (fileHandle as any).createWritable();
    try {
      if (typeof data === 'string') {
        await writable.write(data);
      } else {
        await writable.write(data);
      }
    } finally {
      await writable.close();
    }
  }

  public async unlink(filepath: string): Promise<void> {
    const norm = normalizePath(filepath);
    const dir = dirname(norm);
    const file = basename(norm);

    const dirHandle = await this.getDirectory(dir, false);
    try {
      await dirHandle.removeEntry(file);
    } catch (_err: any) {
      const e: any = new Error(`ENOENT: no such file or directory, unlink '${filepath}'`);
      e.code = 'ENOENT';
      throw e;
    }
  }

  public async readdir(dirpath: string): Promise<string[]> {
    const dirHandle = await this.getDirectory(dirpath, false);
    const entries: string[] = [];

    // Native async iterator for DirectoryHandle
    for await (const name of (dirHandle as any).keys()) {
      entries.push(name);
    }

    return entries.sort();
  }

  public async mkdir(dirpath: string): Promise<void> {
    await this.getDirectory(dirpath, true);
  }

  public async rmdir(dirpath: string, options?: { recursive?: boolean }): Promise<void> {
    const norm = normalizePath(dirpath);
    if (!norm) {
      throw new Error('Cannot remove root directory');
    }
    const dir = dirname(norm);
    const target = basename(norm);

    const parentHandle = await this.getDirectory(dir, false);
    try {
      await parentHandle.removeEntry(target, { recursive: options?.recursive ?? false });
      // Invalidate cache for this dir and its subdirectories
      for (const key of this.dirCache.keys()) {
        if (key === norm || key.startsWith(`${norm}/`)) {
          this.dirCache.delete(key);
        }
      }
    } catch (_err: any) {
      const e: any = new Error(`ENOENT: no such file or directory, rmdir '${dirpath}'`);
      e.code = 'ENOENT';
      throw e;
    }
  }

  public async stat(filepath: string): Promise<FileStat> {
    const norm = normalizePath(filepath);
    if (!norm) {
      // Root is directory
      return {
        isFile: () => false,
        isDirectory: () => true,
        isSymbolicLink: () => false,
        size: 0,
        mtimeMs: Date.now(),
        ctimeMs: Date.now(),
        mode: 0o040755,
      };
    }

    const dir = dirname(norm);
    const name = basename(norm);
    const dirHandle = await this.getDirectory(dir, false);

    // Try as file first
    try {
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      return {
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        size: file.size,
        mtimeMs: file.lastModified,
        ctimeMs: file.lastModified,
        mode: 0o100644,
      };
    } catch {
      // Try as directory
      try {
        await dirHandle.getDirectoryHandle(name);
        return {
          isFile: () => false,
          isDirectory: () => true,
          isSymbolicLink: () => false,
          size: 0,
          mtimeMs: Date.now(),
          ctimeMs: Date.now(),
          mode: 0o040755,
        };
      } catch {
        const e: any = new Error(`ENOENT: no such file or directory, stat '${filepath}'`);
        e.code = 'ENOENT';
        throw e;
      }
    }
  }

  public async lstat(filepath: string): Promise<FileStat> {
    return this.stat(filepath);
  }

  public async exists(filepath: string): Promise<boolean> {
    try {
      await this.stat(filepath);
      return true;
    } catch {
      return false;
    }
  }
}
