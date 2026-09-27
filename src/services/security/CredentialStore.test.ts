import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDBCredentialStore, maskToken } from './CredentialStore';
import { AuthService } from '../remote/AuthService';

describe('CredentialStore & Token Masking', () => {
  it('correctly masks GitHub Personal Access Tokens', () => {
    expect(maskToken('ghp_1234567890abcdef1234567890abcdef1234')).toBe('ghp_••••••••••••••••••••1234');
    expect(maskToken('github_pat_11A2B3C4D5E6F7G8H9I0JKLMNOPQRSTUVWXYZ_1234567890abcdef9x4f')).toBe('github_pat_••••••••••••••••••••9x4f');
    expect(maskToken('gho_9876543210zyxwvutsrqponmlkjihgfedcba')).toBe('gho_••••••••••••••••••••dcba');
    expect(maskToken('')).toBe('••••••••••••••••••••');
    expect(maskToken(null)).toBe('••••••••••••••••••••');
  });

  it('persists and retrieves credentials in CredentialStore', async () => {
    const store = new IndexedDBCredentialStore();
    await store.saveGitHubCredential({
      id: 'github_primary',
      token: 'ghp_testtokentesttokentesttoken9x4f',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const has = await store.hasGitHubCredential();
    expect(has).toBe(true);

    const cred = await store.getGitHubCredential();
    expect(cred).not.toBeNull();
    expect(cred?.token).toBe('ghp_testtokentesttokentesttoken9x4f');

    await store.removeGitHubCredential();
    const hasAfter = await store.hasGitHubCredential();
    expect(hasAfter).toBe(false);
  });
});

describe('AuthService Lifecycle', () => {
  let mockStore: IndexedDBCredentialStore;
  let mockProvider: any;
  let service: AuthService;

  beforeEach(() => {
    mockStore = new IndexedDBCredentialStore();
    mockProvider = {
      name: 'GitHub',
      getCurrentUser: async (token: string) => {
        if (token === 'ghp_valid_token_1234567890_9x4f') {
          return {
            id: 1,
            login: 'lucky4-git1',
            name: 'Lucky',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1',
            htmlUrl: 'https://github.com/lucky4-git1',
          };
        }
        throw new Error('401 Bad credentials');
      },
      listRepositories: async () => [],
      createRepository: async () => ({} as any),
      getRepository: async () => ({} as any),
      authenticate: async (token: string) => ({
        token,
        user: { id: 1, login: 'lucky4-git1', name: 'Lucky', avatarUrl: '', htmlUrl: '' },
        createdAt: Date.now(),
      }),
    };
    service = new AuthService(mockStore, mockProvider);
  });

  it('connects, stores credential, and returns safe profile', async () => {
    const profile = await service.connect('ghp_valid_token_1234567890_9x4f');
    expect(profile.username).toBe('lucky4-git1');
    expect(service.getStatus()).toBe('authenticated');

    const masked = await service.getMaskedToken();
    expect(masked).toBe('ghp_••••••••••••••••••••9x4f');

    // On-demand token for Git is available
    const gitToken = await service.getCredentialForGit();
    expect(gitToken).toBe('ghp_valid_token_1234567890_9x4f');
  });

  it('detects revoked or invalid token during restoration', async () => {
    await mockStore.saveGitHubCredential({
      id: 'github_primary',
      token: 'ghp_invalid_token',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await service.restoreAuthentication();
    expect(result.status).toBe('expired');
  });

  it('disconnects and clears credentials without deleting local state', async () => {
    await service.connect('ghp_valid_token_1234567890_9x4f');
    expect(service.getStatus()).toBe('authenticated');

    await service.disconnect();
    expect(service.getStatus()).toBe('unauthenticated');
    expect(service.getProfile()).toBeNull();
    const token = await service.getCredentialForGit();
    expect(token).toBeNull();
  });
});
