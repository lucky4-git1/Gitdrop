import { GitHubAuthProfile, AuthStatus, CredentialStore } from '@/types/remote';
import { credentialStore, maskToken } from '../security/CredentialStore';
import { GitHubProvider } from './GitHubProvider';
import { logger } from '../logger/logger';

const PROFILE_STORAGE_KEY = 'gitdrop_github_profile_v2';

export class AuthService {
  private store: CredentialStore;
  private provider: GitHubProvider;
  private cachedProfile: GitHubAuthProfile | null = null;
  private authStatus: AuthStatus = 'unknown';

  constructor(store: CredentialStore = credentialStore, provider: GitHubProvider = new GitHubProvider()) {
    this.store = store;
    this.provider = provider;
  }

  public getStatus(): AuthStatus {
    return this.authStatus;
  }

  public getProfile(): GitHubAuthProfile | null {
    return this.cachedProfile;
  }

  /**
   * Safe masked token for UI display
   */
  public async getMaskedToken(): Promise<string> {
    const cred = await this.store.getGitHubCredential();
    return maskToken(cred?.token);
  }

  /**
   * Called on startup to restore authentication profile and state
   */
  public async restoreAuthentication(): Promise<{ profile: GitHubAuthProfile | null; status: AuthStatus }> {
    logger.debug('remote', 'Restoring GitHub authentication state');

    // 1. Check if legacy session needs migration
    const migratedToken = await (this.store as any).checkAndMigrateLegacySession?.();

    // 2. Load stored profile from localStorage (instant UI display)
    let storedProfile: GitHubAuthProfile | null = null;
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        storedProfile = JSON.parse(raw);
      }
    } catch {
      // ignore parse error
    }

    const hasCred = (await this.store.hasGitHubCredential()) || !!migratedToken;

    if (!hasCred) {
      this.cachedProfile = null;
      this.authStatus = 'unauthenticated';
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      return { profile: null, status: 'unauthenticated' };
    }

    if (storedProfile) {
      this.cachedProfile = storedProfile;
      this.authStatus = 'authenticated';
    }

    // 3. Verify in background or if profile wasn't cached
    try {
      const cred = await this.store.getGitHubCredential();
      if (cred && cred.token) {
        // Validate with lightweight API call
        const user = await this.provider.getCurrentUser(cred.token);
        const profile: GitHubAuthProfile = {
          username: user.login,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          authenticatedAt: storedProfile?.authenticatedAt || new Date().toISOString(),
          credentialReference: cred.id,
        };
        this.cachedProfile = profile;
        this.authStatus = 'authenticated';
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        return { profile, status: 'authenticated' };
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('Bad credentials') || msg.includes('403')) {
        logger.warn('remote', 'Stored GitHub credential is invalid or has expired');
        this.authStatus = 'expired';
        return { profile: this.cachedProfile, status: 'expired' };
      } else {
        // Network/offline error: don't revoke local authentication!
        logger.info('remote', 'GitHub network check failed (offline mode)');
        if (storedProfile) {
          this.authStatus = 'authenticated';
          return { profile: storedProfile, status: 'authenticated' };
        }
      }
    }

    if (!this.cachedProfile) {
      this.authStatus = 'unauthenticated';
    }
    return { profile: this.cachedProfile, status: this.authStatus };
  }

  /**
   * Connect with a new Personal Access Token
   */
  public async connect(token: string): Promise<GitHubAuthProfile> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('Please provide a valid GitHub Personal Access Token.');
    }

    logger.info('remote', 'Connecting to GitHub with provided credential');

    // 1. Validate by requesting current user
    const user = await this.provider.getCurrentUser(cleanToken);

    // 2. Persist credential into secure store
    await this.store.saveGitHubCredential({
      id: 'github_primary',
      token: cleanToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Build & persist non-sensitive profile
    const profile: GitHubAuthProfile = {
      username: user.login,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      authenticatedAt: new Date().toISOString(),
      credentialReference: 'github_primary',
    };

    this.cachedProfile = profile;
    this.authStatus = 'authenticated';
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }

    logger.info('remote', `GitHub connected successfully as @${user.login}`);
    return profile;
  }

  /**
   * Disconnects GitHub and removes credential
   * Does NOT touch local repos or Git history
   */
  public async disconnect(): Promise<void> {
    logger.info('remote', 'Disconnecting GitHub account');
    await this.store.removeGitHubCredential();
    this.cachedProfile = null;
    this.authStatus = 'unauthenticated';
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      sessionStorage.removeItem('gitdrop_github_session');
    } catch {
      // ignore
    }
  }

  /**
   * Retrieves the raw token strictly for GitService execution
   * Never exposed to React state or UI logs
   */
  public async getCredentialForGit(): Promise<string | null> {
    const cred = await this.store.getGitHubCredential();
    return cred?.token || null;
  }
}

export const authService = new AuthService();
