export interface RemoteUser {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
  email?: string;
}

export interface RemoteOrganization {
  id: number;
  login: string;
  avatarUrl: string;
  description?: string;
}

export interface RemoteRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

export interface CreateRepositoryOptions {
  name: string;
  description?: string;
  private: boolean;
  autoInit?: boolean;
}

export interface RemoteAuthSession {
  token: string;
  user: RemoteUser;
  createdAt: number;
}

export type AuthStatus =
  | 'unknown'
  | 'authenticated'
  | 'unauthenticated'
  | 'expired'
  | 'error';

export interface GitHubCredential {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubAuthProfile {
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  scopes?: string[];
  authenticatedAt: string;
  credentialReference: string;
}

export interface CredentialStore {
  saveGitHubCredential(credential: GitHubCredential): Promise<void>;
  getGitHubCredential(): Promise<GitHubCredential | null>;
  removeGitHubCredential(): Promise<void>;
  hasGitHubCredential(): Promise<boolean>;
}

export interface IRemoteProvider {
  name: string;
  authenticate(token: string): Promise<RemoteAuthSession>;
  getCurrentUser(token: string): Promise<RemoteUser>;
  listRepositories(token: string): Promise<RemoteRepository[]>;
  createRepository(token: string, options: CreateRepositoryOptions): Promise<RemoteRepository>;
  getRepository(token: string, owner: string, name: string): Promise<RemoteRepository>;
}

