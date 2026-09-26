import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubProvider } from './GitHubProvider';

describe('GitHubProvider', () => {
  let provider: GitHubProvider;

  beforeEach(() => {
    provider = new GitHubProvider();
    vi.restoreAllMocks();
  });

  it('authenticates and retrieves current user', async () => {
    const mockUser = {
      id: 12345,
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      html_url: 'https://github.com/octocat',
      email: 'octocat@github.com',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    } as Response);

    const session = await provider.authenticate('ghp_testtoken123456789012345678901234');
    expect(session.user.login).toBe('octocat');
    expect(session.user.name).toBe('The Octocat');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token ghp_testtoken123456789012345678901234',
        }),
      })
    );
  });

  it('creates a new repository', async () => {
    const mockRepo = {
      id: 98765,
      name: 'gitdrop-test',
      full_name: 'octocat/gitdrop-test',
      description: 'A test repository',
      private: true,
      html_url: 'https://github.com/octocat/gitdrop-test',
      clone_url: 'https://github.com/octocat/gitdrop-test.git',
      default_branch: 'main',
      owner: { login: 'octocat', avatar_url: 'https://avatar.url' },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRepo,
    } as Response);

    const repo = await provider.createRepository('ghp_token', {
      name: 'gitdrop-test',
      description: 'A test repository',
      private: true,
    });

    expect(repo.name).toBe('gitdrop-test');
    expect(repo.private).toBe(true);
    expect(repo.cloneUrl).toBe('https://github.com/octocat/gitdrop-test.git');
  });

  it('handles and formats API error messages properly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Bad credentials' }),
    } as Response);

    await expect(provider.authenticate('invalid_token')).rejects.toThrow('Bad credentials');
  });
});
