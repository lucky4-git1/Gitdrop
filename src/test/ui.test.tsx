import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConfigProvider } from '@/state/ConfigContext';
import { RepositoryProvider } from '@/state/RepositoryContext';
import { AuthProvider } from '@/state/AuthContext';
import { UIProvider } from '@/state/UIContext';
import { GitProvider } from '@/state/GitContext';
import { LandingPage } from '@/pages/LandingPage';
import { Topbar } from '@/components/Shell/Topbar';

// Mock Monaco DiffEditor / Editor for JSDOM
vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="monaco-editor-mock">Monaco Editor</div>,
  DiffEditor: () => <div data-testid="monaco-diff-editor-mock">Monaco Diff Editor</div>,
}));

describe('UI Component Rendering', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ConfigProvider>
        <RepositoryProvider>
          <AuthProvider>
            <UIProvider>
              <GitProvider>{ui}</GitProvider>
            </UIProvider>
          </AuthProvider>
        </RepositoryProvider>
      </ConfigProvider>
    );
  };

  it('renders LandingPage with drop zone and action buttons', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('DROP YOUR PROJECT HERE')).toBeInTheDocument();
    expect(screen.getByText('Open Local Folder')).toBeInTheDocument();
    expect(screen.getByText(/Try with an In-Memory Virtual Starter Repo/i)).toBeInTheDocument();
  });

  it('renders Topbar with GitDrop branding and search trigger', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByText('GitDrop')).toBeInTheDocument();
    expect(screen.getByText('Select Repository')).toBeInTheDocument();
  });
});
