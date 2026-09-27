import { ProjectEntry } from '@/types/project';
import { logger } from '../logger/logger';

const DB_NAME = 'gitdrop_projects_db';
const DB_VERSION = 1;
const METADATA_STORE = 'project_entries';
const HANDLES_STORE = 'project_handles';
const LOCAL_STORAGE_KEY = 'gitdrop_projects_meta_v2';

export class ProjectRegistry {
  private memEntries: Map<string, ProjectEntry> = new Map();
  private memHandles: Map<string, FileSystemDirectoryHandle> = new Map();

  private isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && !!window.indexedDB;
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.isIndexedDBAvailable()) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(HANDLES_STORE)) {
          db.createObjectStore(HANDLES_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveProject(entry: ProjectEntry, handle?: FileSystemDirectoryHandle): Promise<void> {
    this.memEntries.set(entry.id, entry);
    if (handle) {
      this.memHandles.set(entry.id, handle);
    }

    // Also persist metadata to localStorage for instant startup display
    this.syncToLocalStorage();

    if (!this.isIndexedDBAvailable()) return;

    try {
      const db = await this.openDB();
      const tx = db.transaction([METADATA_STORE, HANDLES_STORE], 'readwrite');

      const metaStore = tx.objectStore(METADATA_STORE);
      metaStore.put(entry);

      if (handle) {
        const handleStore = tx.objectStore(HANDLES_STORE);
        handleStore.put({ id: entry.id, handle });
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      logger.debug('app', `Persisted project "${entry.name}" (${entry.id})`);
    } catch (err: any) {
      logger.warn('app', `Failed to persist project in IndexedDB: ${err?.message}`);
    }
  }

  public async getProject(id: string): Promise<ProjectEntry | null> {
    if (this.memEntries.has(id)) {
      return this.memEntries.get(id) || null;
    }

    if (!this.isIndexedDBAvailable()) return null;

    try {
      const db = await this.openDB();
      return await new Promise<ProjectEntry | null>((resolve, reject) => {
        const tx = db.transaction(METADATA_STORE, 'readonly');
        const store = tx.objectStore(METADATA_STORE);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            this.memEntries.set(id, req.result);
          }
          resolve(req.result || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  public async getHandle(id: string): Promise<FileSystemDirectoryHandle | null> {
    if (this.memHandles.has(id)) {
      return this.memHandles.get(id) || null;
    }

    if (!this.isIndexedDBAvailable()) return null;

    try {
      const db = await this.openDB();
      return await new Promise<FileSystemDirectoryHandle | null>((resolve) => {
        const tx = db.transaction(HANDLES_STORE, 'readonly');
        const store = tx.objectStore(HANDLES_STORE);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.handle) {
            this.memHandles.set(id, req.result.handle);
            resolve(req.result.handle);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async listProjects(): Promise<ProjectEntry[]> {
    // 1. Try to load from IndexedDB
    if (this.isIndexedDBAvailable()) {
      try {
        const db = await this.openDB();
        const entries: ProjectEntry[] = await new Promise((resolve, reject) => {
          const tx = db.transaction(METADATA_STORE, 'readonly');
          const store = tx.objectStore(METADATA_STORE);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });

        if (entries && entries.length > 0) {
          entries.forEach((e) => this.memEntries.set(e.id, e));
          this.syncToLocalStorage();
          return this.sortProjects(entries);
        }
      } catch (err: any) {
        logger.warn('app', 'Failed to read projects from IndexedDB, checking localStorage', err?.message);
      }
    }

    // 2. Fallback to localStorage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((e) => this.memEntries.set(e.id, e));
          return this.sortProjects(parsed);
        }
      }
    } catch {
      // ignore
    }

    return this.sortProjects(Array.from(this.memEntries.values()));
  }

  public async updateProject(id: string, updates: Partial<ProjectEntry>): Promise<void> {
    const existing = await this.getProject(id);
    if (!existing) return;

    const updated: ProjectEntry = {
      ...existing,
      ...updates,
      id, // protect id
    };

    await this.saveProject(updated);
  }

  public async removeProject(id: string): Promise<void> {
    this.memEntries.delete(id);
    this.memHandles.delete(id);
    this.syncToLocalStorage();

    if (!this.isIndexedDBAvailable()) return;

    try {
      const db = await this.openDB();
      const tx = db.transaction([METADATA_STORE, HANDLES_STORE], 'readwrite');
      tx.objectStore(METADATA_STORE).delete(id);
      tx.objectStore(HANDLES_STORE).delete(id);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      logger.info('app', `Removed project ${id} from registry`);
    } catch (err: any) {
      logger.warn('app', `Error removing project ${id}`, err?.message);
    }
  }

  public async findDuplicate(name: string, path?: string): Promise<ProjectEntry | null> {
    const all = await this.listProjects();
    return (
      all.find((p) => {
        if (path && p.path && p.path.toLowerCase() === path.toLowerCase()) {
          return true;
        }
        return p.name.toLowerCase() === name.toLowerCase();
      }) || null
    );
  }

  public async findDuplicateHandle(handle: FileSystemDirectoryHandle): Promise<ProjectEntry | null> {
    const all = await this.listProjects();
    for (const p of all) {
      const existingHandle = await this.getHandle(p.id);
      if (existingHandle && 'isSameEntry' in (handle as any)) {
        try {
          if (await (handle as any).isSameEntry(existingHandle)) {
            return p;
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  public async clearAll(): Promise<void> {
    this.memEntries.clear();
    this.memHandles.clear();
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }

    if (!this.isIndexedDBAvailable()) return;

    try {
      const db = await this.openDB();
      const tx = db.transaction([METADATA_STORE, HANDLES_STORE], 'readwrite');
      tx.objectStore(METADATA_STORE).clear();
      tx.objectStore(HANDLES_STORE).clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
  }

  private sortProjects(projects: ProjectEntry[]): ProjectEntry[] {
    return [...projects].sort((a, b) => {
      // Default project first, then sorted by lastOpenedAt descending
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime();
    });
  }

  private syncToLocalStorage(): void {
    try {
      const list = Array.from(this.memEntries.values());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

export const projectRegistry = new ProjectRegistry();
