import { IFileSystem } from '@/types/filesystem';

/**
 * Creates an isomorphic-git compatible fs object from an IFileSystem instance.
 */
export function createIsomorphicGitFs(fs: IFileSystem) {
  const promises = {
    readFile: async (path: string, options?: any) => {
      const encoding = typeof options === 'string' ? options : options?.encoding;
      return fs.readFile(path, { encoding });
    },
    writeFile: async (path: string, data: any, _options?: any) => {
      return fs.writeFile(path, data);
    },
    unlink: async (path: string) => {
      return fs.unlink(path);
    },
    readdir: async (path: string) => {
      return fs.readdir(path);
    },
    mkdir: async (path: string) => {
      return fs.mkdir(path);
    },
    rmdir: async (path: string) => {
      return fs.rmdir(path);
    },
    stat: async (path: string) => {
      return fs.stat(path);
    },
    lstat: async (path: string) => {
      return fs.lstat(path);
    },
    readlink: async (path: string) => {
      if (fs.readlink) return fs.readlink(path);
      const err: any = new Error(`ENOSYS: readlink not supported`);
      err.code = 'ENOSYS';
      throw err;
    },
    symlink: async (target: string, path: string) => {
      if (fs.symlink) return fs.symlink(target, path);
      const err: any = new Error(`ENOSYS: symlink not supported`);
      err.code = 'ENOSYS';
      throw err;
    },
  };

  return {
    promises,
  };
}
