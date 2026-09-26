import React, { useState, useRef, useEffect } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import {
  FolderGit2,
  GitBranch,
  Search,
  Command,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  FolderOpen,
  Plus,
  PlusCircle,
  GitPullRequest,
} from 'lucide-react';
import { CreateBranchModal } from '../Modals/BranchModals';
import { CreateProjectModal } from '../Modals/CreateProjectModal';
import { CloneRepoModal } from '../Modals/CloneRepoModal';

export const Topbar: React.FC = () => {
  const { projectInfo, openDirectoryPicker, openVirtualProject, isOpen } = useRepository();
  const { currentBranch, branches, checkoutBranch } = useGit();
  const {
    theme,
    setTheme,
    setCommandPaletteOpen,
    setGlobalSearchOpen,
    setActiveView,
  } = useUI();

  const [isBranchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [isRepoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [isCreateBranchOpen, setCreateBranchOpen] = useState(false);
  const [isCreateProjectOpen, setCreateProjectOpen] = useState(false);
  const [isCloneRepoOpen, setCloneRepoOpen] = useState(false);

  const branchRef = useRef<HTMLDivElement>(null);
  const repoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setBranchDropdownOpen(false);
      }
      if (repoRef.current && !repoRef.current.contains(event.target as Node)) {
        setRepoDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else setTheme('dark');
  };

  return (
    <>
      <header
        style={{
          height: 'var(--topbar-height)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        {/* Left Section: Logo & Repository Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={() => setActiveView('workspace')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <img src="/gitdrop-icon.svg" alt="GitDrop" style={{ width: '22px', height: '22px' }} />
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              GitDrop
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />

          {/* Repo Selector */}
          <div style={{ position: 'relative' }} ref={repoRef}>
            <button
              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
              onClick={() => setRepoDropdownOpen(!isRepoDropdownOpen)}
              style={{ fontWeight: 500, color: 'var(--text-primary)' }}
            >
              <FolderGit2 size={14} color="var(--accent-text)" />
              <span>{isOpen ? projectInfo?.name : 'Select Repository'}</span>
              <ChevronDown size={12} color="var(--text-muted)" />
            </button>

            {isRepoDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  minWidth: '220px',
                  zIndex: 100,
                  padding: '4px',
                }}
              >
                <button
                  className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setRepoDropdownOpen(false);
                    openDirectoryPicker();
                  }}
                >
                  <FolderOpen size={14} />
                  <span>Open Folder...</span>
                </button>
                <button
                  className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setRepoDropdownOpen(false);
                    setCreateProjectOpen(true);
                  }}
                >
                  <PlusCircle size={14} />
                  <span>Create New Repository...</span>
                </button>
                <button
                  className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setRepoDropdownOpen(false);
                    setCloneRepoOpen(true);
                  }}
                >
                  <GitPullRequest size={14} />
                  <span>Clone Repository...</span>
                </button>
                <button
                  className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setRepoDropdownOpen(false);
                    openVirtualProject('react-vite-demo');
                  }}
                >
                  <PlusCircle size={14} />
                  <span>Open Virtual Starter Repo</span>
                </button>
              </div>
            )}
          </div>

          {/* Branch Selector (if open) */}
          {isOpen && (
            <div style={{ position: 'relative' }} ref={branchRef}>
              <button
                className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                onClick={() => setBranchDropdownOpen(!isBranchDropdownOpen)}
                style={{ fontWeight: 500, color: 'var(--text-primary)' }}
              >
                <GitBranch size={14} color="var(--accent-text)" />
                <span>{currentBranch}</span>
                <ChevronDown size={12} color="var(--text-muted)" />
              </button>

              {isBranchDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    minWidth: '220px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    zIndex: 100,
                    padding: '4px',
                  }}
                >
                  <button
                    className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-text)', marginBottom: '4px', borderBottom: '1px solid var(--border)', borderRadius: 0 }}
                    onClick={() => {
                      setBranchDropdownOpen(false);
                      setCreateBranchOpen(true);
                    }}
                  >
                    <Plus size={13} />
                    <span>New Branch...</span>
                  </button>

                  {branches.map((b) => (
                    <button
                      key={b.name}
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        fontWeight: b.current ? 600 : 400,
                        backgroundColor: b.current ? 'var(--bg-selected)' : 'transparent',
                        color: b.current ? 'var(--accent-text)' : 'inherit',
                      }}
                      onClick={() => {
                        setBranchDropdownOpen(false);
                        checkoutBranch(b.name);
                      }}
                    >
                      <GitBranch size={13} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Search, Command Palette, Theme, Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Search */}
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setGlobalSearchOpen(true)}
            title="Global Search (Ctrl+P)"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Search size={14} />
            <span style={{ fontSize: '11px', display: 'none', marginLeft: '2px' }}>Search</span>
            <kbd style={{ fontSize: '10px', marginLeft: '4px' }}>Ctrl P</kbd>
          </button>

          {/* Command Palette */}
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setCommandPaletteOpen(true)}
            title="Command Palette (Ctrl+K)"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Command size={14} />
            <kbd style={{ fontSize: '10px', marginLeft: '4px' }}>Ctrl K</kbd>
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />

          {/* Theme Toggle */}
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Settings */}
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setActiveView('settings')}
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      <CreateBranchModal isOpen={isCreateBranchOpen} onClose={() => setCreateBranchOpen(false)} />
      <CreateProjectModal isOpen={isCreateProjectOpen} onClose={() => setCreateProjectOpen(false)} />
      <CloneRepoModal isOpen={isCloneRepoOpen} onClose={() => setCloneRepoOpen(false)} />
    </>
  );
};
