import React, { useEffect } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useUI } from '@/state/UIContext';
import { useGit } from '@/state/GitContext';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { GitConsole } from './GitConsole';
import { ConfirmModal } from '../Modals/ConfirmModal';
import { ErrorModal } from '../Modals/ErrorModal';
import { CommandPalette } from '../Modals/CommandPalette';
import { GlobalSearch } from '../Modals/GlobalSearch';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { ChangesPage } from '@/pages/ChangesPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { CommitsPage } from '@/pages/CommitsPage';
import { ConflictsPage } from '@/pages/ConflictsPage';
import { RemotesPage } from '@/pages/RemotesPage';
import { TagsPage } from '@/pages/TagsPage';
import { FilesPage } from '@/pages/FilesPage';
import { SettingsPage } from '@/pages/SettingsPage';

export const AppShell: React.FC = () => {
  const { isOpen } = useRepository();
  const { activeView, setCommandPaletteOpen, setGlobalSearchOpen } = useUI();
  const { push } = useGit();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl+P / Cmd+P: Global Search
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      // Ctrl+Shift+P / Cmd+Shift+P: Push
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        push();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen, setGlobalSearchOpen, push]);

  const renderActiveView = () => {
    if (!isOpen) {
      return <LandingPage />;
    }

    switch (activeView) {
      case 'workspace':
        return <WorkspacePage />;
      case 'changes':
        return <ChangesPage />;
      case 'conflicts':
        return <ConflictsPage />;
      case 'branches':
        return <BranchesPage />;
      case 'commits':
        return <CommitsPage />;
      case 'remotes':
        return <RemotesPage />;
      case 'tags':
        return <TagsPage />;
      case 'files':
        return <FilesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <WorkspacePage />;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {isOpen && <Sidebar />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
          {renderActiveView()}
        </main>
      </div>

      <GitConsole />
      <StatusBar />

      {/* Global Modals */}
      <ConfirmModal />
      <ErrorModal />
      <CommandPalette />
      <GlobalSearch />
    </div>
  );
};
