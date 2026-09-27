import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { RemoteRepository, CreateRepositoryOptions, GitHubAuthProfile, AuthStatus } from '@/types/remote';
import { GitHubProvider } from '@/services/remote/GitHubProvider';
import { authService, AuthService } from '@/services/remote/AuthService';
import { logger } from '@/services/logger/logger';

interface LegacyUserView {
  id?: number;
  login: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  htmlUrl?: string;
}

interface AuthContextType {
  profile: GitHubAuthProfile | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  maskedToken: string;
  githubProvider: GitHubProvider;
  userRepos: RemoteRepository[];
  isLoading: boolean;
  authService: AuthService;
  connectGitHub: (token: string) => Promise<void>;
  disconnectGitHub: () => Promise<void>;
  refreshUserRepos: () => Promise<void>;
  createRemoteRepo: (options: CreateRepositoryOptions) => Promise<RemoteRepository>;
  getCredentialForGit: () => Promise<string | null>;
  session: {
    token?: string;
    user: LegacyUserView;
  } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const githubProvider = useMemo(() => new GitHubProvider(), []);
  const [profile, setProfile] = useState<GitHubAuthProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('unknown');
  const [maskedToken, setMaskedToken] = useState<string>('••••••••••••••••••••');
  const [userRepos, setUserRepos] = useState<RemoteRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Restore authentication on startup
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { profile: restored, status } = await authService.restoreAuthentication();
        if (!mounted) return;
        setProfile(restored);
        setAuthStatus(status);
        if (restored) {
          const masked = await authService.getMaskedToken();
          if (mounted) setMaskedToken(masked);
        }
      } catch (err: any) {
        logger.error('remote', 'Error during auth restoration', err?.message);
        if (mounted) setAuthStatus('error');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getCredentialForGit = useCallback(async (): Promise<string | null> => {
    return await authService.getCredentialForGit();
  }, []);

  const refreshUserRepos = useCallback(async () => {
    const token = await authService.getCredentialForGit();
    if (!token) {
      setUserRepos([]);
      return;
    }
    setIsLoading(true);
    try {
      const repos = await githubProvider.listRepositories(token);
      setUserRepos(repos);
    } catch (err: any) {
      logger.error('remote', 'Failed to fetch user repositories', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, [githubProvider]);

  // When profile changes to authenticated, fetch repositories
  useEffect(() => {
    if (authStatus === 'authenticated' && profile) {
      refreshUserRepos();
    } else {
      setUserRepos([]);
    }
  }, [authStatus, profile, refreshUserRepos]);

  const connectGitHub = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const newProfile = await authService.connect(token);
      setProfile(newProfile);
      setAuthStatus('authenticated');
      const masked = await authService.getMaskedToken();
      setMaskedToken(masked);
      await refreshUserRepos();
    } catch (err: any) {
      logger.error('remote', 'Authentication failed', err?.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUserRepos]);

  const disconnectGitHub = useCallback(async () => {
    await authService.disconnect();
    setProfile(null);
    setAuthStatus('unauthenticated');
    setMaskedToken('••••••••••••••••••••');
    setUserRepos([]);
  }, []);

  const createRemoteRepo = useCallback(async (options: CreateRepositoryOptions): Promise<RemoteRepository> => {
    const token = await authService.getCredentialForGit();
    if (!token) {
      throw new Error('Not authenticated with GitHub.');
    }
    const repo = await githubProvider.createRepository(token, options);
    await refreshUserRepos();
    return repo;
  }, [githubProvider, refreshUserRepos]);

  // Backward compatibility object for legacy consumers
  const session = useMemo(() => {
    if (!profile) return null;
    return {
      user: {
        login: profile.username,
        name: profile.name || profile.username,
        avatarUrl: profile.avatarUrl || '',
        email: profile.email,
        htmlUrl: `https://github.com/${profile.username}`,
      },
    };
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        authStatus,
        isAuthenticated: authStatus === 'authenticated' && !!profile,
        maskedToken,
        githubProvider,
        userRepos,
        isLoading,
        authService,
        connectGitHub,
        disconnectGitHub,
        refreshUserRepos,
        createRemoteRepo,
        getCredentialForGit,
        session,
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
