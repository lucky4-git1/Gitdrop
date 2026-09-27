import { CredentialStore, GitHubCredential } from '@/types/remote';
import { logger } from '../logger/logger';

const DB_NAME = 'gitdrop_security_db';
const DB_VERSION = 1;
const STORE_NAME = 'credentials';
const PRIMARY_KEY = 'github_primary';

/**
 * Generates a safe, masked token identifier for display in the UI.
 * e.g., ghp_••••••••••••••••••••9x4f
 * Never exposes the raw token.
 */
export function maskToken(token?: string | null): string {
  if (!token) return '••••••••••••••••••••';
  const clean = token.trim();
  if (clean.length <= 8) {
    return '••••••••••••••••••••';
  }
  let prefix = 'ghp_';
  if (clean.startsWith('github_pat_')) {
    prefix = 'github_pat_';
  } else if (clean.startsWith('ghp_')) {
    prefix = 'ghp_';
  } else if (clean.startsWith('gho_')) {
    prefix = 'gho_';
  } else {
    prefix = clean.substring(0, Math.min(4, clean.length - 4)) + '_';
  }
  const suffix = clean.substring(clean.length - 4);
  return `${prefix}••••••••••••••••••••${suffix}`;
}

export class IndexedDBCredentialStore implements CredentialStore {
  private memFallback: Map<string, GitHubCredential> = new Map();

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveGitHubCredential(credential: GitHubCredential): Promise<void> {
    const record: GitHubCredential = {
      ...credential,
      id: PRIMARY_KEY,
      updatedAt: new Date().toISOString(),
    };

    if (!this.isIndexedDBAvailable()) {
      this.memFallback.set(PRIMARY_KEY, record);
      return;
    }

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      logger.debug('remote', 'GitHub credential safely persisted');
    } catch (err: any) {
      logger.warn('remote', 'Falling back to memory storage for credential', err?.message);
      this.memFallback.set(PRIMARY_KEY, record);
    }
  }

  public async getGitHubCredential(): Promise<GitHubCredential | null> {
    if (!this.isIndexedDBAvailable()) {
      return this.memFallback.get(PRIMARY_KEY) || null;
    }

    try {
      const db = await this.openDB();
      return await new Promise<GitHubCredential | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(PRIMARY_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memFallback.get(PRIMARY_KEY) || null;
    }
  }

  public async removeGitHubCredential(): Promise<void> {
    this.memFallback.delete(PRIMARY_KEY);

    if (!this.isIndexedDBAvailable()) {
      return;
    }

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(PRIMARY_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      logger.debug('remote', 'GitHub credential safely removed');
    } catch (err: any) {
      logger.warn('remote', 'Failed to remove credential from store', err?.message);
    }
  }

  public async hasGitHubCredential(): Promise<boolean> {
    const cred = await this.getGitHubCredential();
    return !!cred && !!cred.token;
  }

  /**
   * Safe migration from legacy sessionStorage
   */
  public async checkAndMigrateLegacySession(): Promise<string | null> {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    try {
      const raw = window.sessionStorage.getItem('gitdrop_github_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token) {
          logger.info('remote', 'Migrating legacy session storage credential to secure credential store');
          await this.saveGitHubCredential({
            id: PRIMARY_KEY,
            token: parsed.token,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          // Scrub legacy plaintext session
          window.sessionStorage.removeItem('gitdrop_github_session');
          return parsed.token;
        }
      }
    } catch {
      // ignore parse error
    }
    return null;
  }
}

export const credentialStore = new IndexedDBCredentialStore();
