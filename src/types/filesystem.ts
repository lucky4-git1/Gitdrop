export interface FileStat {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  mode?: number;
  ino?: number;
  uid?: number;
  gid?: number;
  dev?: number;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileEntry[];
}

export interface IFileSystem {
  readFile(filepath: string, options?: { encoding?: string }): Promise<Uint8Array | string>;
  writeFile(filepath: string, data: Uint8Array | string): Promise<void>;
  unlink(filepath: string): Promise<void>;
  readdir(dirpath: string): Promise<string[]>;
  mkdir(dirpath: string): Promise<void>;
  rmdir(dirpath: string, options?: { recursive?: boolean }): Promise<void>;
  stat(filepath: string): Promise<FileStat>;
  lstat(filepath: string): Promise<FileStat>;
  exists(filepath: string): Promise<boolean>;
  readlink?(filepath: string): Promise<string>;
  symlink?(target: string, filepath: string): Promise<void>;
}
