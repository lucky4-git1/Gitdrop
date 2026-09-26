import {
  IRemoteProvider,
  RemoteAuthSession,
  RemoteUser,
  RemoteRepository,
  CreateRepositoryOptions,
} from '@/types/remote';
import { logger } from '../logger/logger';

export class GitHubProvider implements IRemoteProvider {
  public readonly name = 'GitHub';
  private readonly baseUrl = 'https://api.github.com';

  private async request<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    logger.debug('remote', `GitHub API request: ${options?.method || 'GET'} ${endpoint}`);

    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `GitHub API error: ${res.status} ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.message) {
          errMsg = errorJson.message;
        }
      } catch {
        // ignore
      }
      logger.error('remote', `GitHub API failure: ${errMsg}`);
      throw new Error(errMsg);
    }

    return (await res.json()) as T;
  }

  public async authenticate(token: string): Promise<RemoteAuthSession> {
    const user = await this.getCurrentUser(token);
    logger.info('remote', `Authenticated as GitHub user @${user.login}`);
    return {
      token,
      user,
      createdAt: Date.now(),
    };
  }

  public async getCurrentUser(token: string): Promise<RemoteUser> {
    const data: any = await this.request('/user', token);
    return {
      id: data.id,
      login: data.login,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      htmlUrl: data.html_url,
      email: data.email,
    };
  }

  public async listRepositories(token: string): Promise<RemoteRepository[]> {
    const repos: any[] = await this.request('/user/repos?sort=updated&per_page=100', token);
    return repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      private: r.private,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url,
      defaultBranch: r.default_branch,
      owner: {
        login: r.owner.login,
        avatarUrl: r.owner.avatar_url,
      },
    }));
  }

  public async createRepository(token: string, options: CreateRepositoryOptions): Promise<RemoteRepository> {
    logger.info('remote', `Creating GitHub repository "${options.name}" (private: ${options.private})`);
    const data: any = await this.request('/user/repos', token, {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        description: options.description || '',
        private: options.private,
        auto_init: options.autoInit || false,
      }),
    });

    logger.info('remote', `Successfully created GitHub repository: ${data.html_url}`);
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      private: data.private,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
      defaultBranch: data.default_branch || 'main',
      owner: {
        login: data.owner.login,
        avatarUrl: data.owner.avatar_url,
      },
    };
  }

  public async getRepository(token: string, owner: string, name: string): Promise<RemoteRepository> {
    const data: any = await this.request(`/repos/${owner}/${name}`, token);
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      private: data.private,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
      defaultBranch: data.default_branch,
      owner: {
        login: data.owner.login,
        avatarUrl: data.owner.avatar_url,
      },
    };
  }
}
