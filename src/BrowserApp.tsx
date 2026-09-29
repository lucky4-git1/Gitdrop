import React from 'react';
import { ConfigProvider } from './state/ConfigContext';
import { RepositoryProvider } from './state/RepositoryContext';
import { AuthProvider } from './state/AuthContext';
import { UIProvider } from './state/UIContext';
import { GitProvider } from './state/GitContext';
import { AppShell } from './components/Shell/AppShell';

export const BrowserApp: React.FC = () => {
  return (
    <ConfigProvider>
      <RepositoryProvider>
        <AuthProvider>
          <UIProvider>
            <GitProvider>
              <AppShell />
            </GitProvider>
          </UIProvider>
        </AuthProvider>
      </RepositoryProvider>
    </ConfigProvider>
  );
};

export default BrowserApp;
