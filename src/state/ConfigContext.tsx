import React, { createContext, useContext, useState, useEffect } from 'react';
import { GitConfig } from '@/types/git';

interface ConfigContextType {
  config: GitConfig;
  updateConfig: (newConfig: Partial<GitConfig>) => void;
}

const DEFAULT_CONFIG: GitConfig = {
  userName: 'GitDrop Developer',
  userEmail: 'dev@gitdrop.local',
  defaultBranch: 'main',
  corsProxy: 'https://cors.isomorphic-git.org',
  startupBehavior: 'lastProject',
  confirmDestructive: true,
  detectExternalChanges: true,
  autoRefreshStatus: true,
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GitConfig>(() => {
    try {
      const saved = localStorage.getItem('gitdrop_config');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('gitdrop_config', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<GitConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
