import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { RemoteAuthSession, RemoteRepository, CreateRepositoryOptions } from '@/types/remote';
import { GitHubProvider } from '@/services/remote/GitHubProvider';
import { logger } from '@/services/logger/logger';

interface AuthContextType {
  session: RemoteAuthSession | null;
  isAuthenticated: boolean;
  githubProvider: GitHubProvider;
  userRepos: RemoteRepository[];
  isLoading: boolean;
  connectGitHub: (token: string) => Promise<void>;
  disconnectGitHub: () => void;
  refreshUserRepos: () => Promise<void>;
  createRemoteRepo: (options: CreateRepositoryOptions) => Promise<RemoteRepository>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const githubProvider = useMemo(() => new GitHubProvider(), []);
  const [session, setSession] = useState<RemoteAuthSession | null>(() => {
    try {
      const stored = sessionStorage.getItem('gitdrop_github_session');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [userRepos, setUserRepos] = useState<RemoteRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUserRepos = useCallback(async () => {
    if (!session?.token) return;
    setIsLoading(true);
    try {
      const repos = await githubProvider.listRepositories(session.token);
      setUserRepos(repos);
    } catch (err: any) {
      logger.error('remote', 'Failed to fetch user repositories', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.token, githubProvider]);

  useEffect(() => {
    if (session?.token) {
      try {
        sessionStorage.setItem('gitdrop_github_session', JSON.stringify(session));
      } catch {
        // ignore
      }
      refreshUserRepos();
    } else {
      sessionStorage.removeItem('gitdrop_github_session');
      setUserRepos([]);
    }
  }, [session, refreshUserRepos]);

  const connectGitHub = useCallback(async (token: string) => {
    if (!token || token.trim() === '') {
      throw new Error('Please provide a valid GitHub Personal Access Token.');
    }
    setIsLoading(true);
    try {
      const newSession = await githubProvider.authenticate(token.trim());
      setSession(newSession);
      logger.info('remote', `Connected to GitHub as @${newSession.user.login}`);
    } catch (err: any) {
      logger.error('remote', 'Authentication failed', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [githubProvider]);

  const disconnectGitHub = useCallback(() => {
    logger.info('remote', 'Disconnected from GitHub');
    setSession(null);
  }, []);

  const createRemoteRepo = useCallback(async (options: CreateRepositoryOptions): Promise<RemoteRepository> => {
    if (!session?.token) {
      throw new Error('Not authenticated with GitHub.');
    }
    const repo = await githubProvider.createRepository(session.token, options);
    await refreshUserRepos();
    return repo;
  }, [session?.token, githubProvider, refreshUserRepos]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        githubProvider,
        userRepos,
        isLoading,
        connectGitHub,
        disconnectGitHub,
        refreshUserRepos,
        createRemoteRepo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
