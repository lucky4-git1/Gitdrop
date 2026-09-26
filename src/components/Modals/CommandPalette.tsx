import React, { useState, useEffect } from 'react';
import { useUI } from '@/state/UIContext';
import { useGit } from '@/state/GitContext';
import { useRepository } from '@/state/RepositoryContext';
import {
  FolderOpen,
  GitBranch,
  GitCommit,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  GitMerge,
  GitPullRequest,
  Bookmark,
  History,
  Tag,
  Settings,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';

interface PaletteCommand {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setActiveView } = useUI();
  const { openDirectoryPicker } = useRepository();
  const { stageAll, push, pull, fetch } = useGit();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: PaletteCommand[] = [
    {
      id: 'open-repo',
      title: 'Open Repository / Folder',
      category: 'Repository',
      icon: <FolderOpen size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        openDirectoryPicker();
      },
    },
    {
      id: 'changes',
      title: 'View Changes & Staging',
      category: 'Navigation',
      icon: <CheckCircle2 size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('changes');
      },
    },
    {
      id: 'stage-all',
      title: 'Stage All Changes',
      category: 'Git',
      icon: <CheckCircle2 size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        stageAll();
      },
    },
    {
      id: 'commits',
      title: 'View Commit History & Graph',
      category: 'Navigation',
      icon: <History size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('commits');
      },
    },
    {
      id: 'branches',
      title: 'Manage Branches',
      category: 'Navigation',
      icon: <GitBranch size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('branches');
      },
    },
    {
      id: 'push',
      title: 'Push to Remote',
      category: 'Remote',
      icon: <ArrowUpRight size={16} />,
      shortcut: 'Ctrl+Shift+P',
      action: () => {
        setCommandPaletteOpen(false);
        push();
      },
    },
    {
      id: 'pull',
      title: 'Pull from Remote',
      category: 'Remote',
      icon: <ArrowDownLeft size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        pull();
      },
    },
    {
      id: 'fetch',
      title: 'Fetch All Remotes',
      category: 'Remote',
      icon: <RefreshCw size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        fetch();
      },
    },
    {
      id: 'merge',
      title: 'Merge Branch',
      category: 'Git',
      icon: <GitMerge size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('branches');
      },
    },
    {
      id: 'rebase',
      title: 'Rebase Branch',
      category: 'Git',
      icon: <GitPullRequest size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('branches');
      },
    },
    {
      id: 'stash',
      title: 'Stash Changes',
      category: 'Git',
      icon: <Bookmark size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('changes');
      },
    },
    {
      id: 'tags',
      title: 'Manage Tags',
      category: 'Navigation',
      icon: <Tag size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('tags');
      },
    },
    {
      id: 'files',
      title: 'File Explorer & Editor',
      category: 'Navigation',
      icon: <GitCommit size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('files');
      },
    },
    {
      id: 'settings',
      title: 'Settings & Identity',
      category: 'Preferences',
      icon: <Settings size={16} />,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('settings');
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="modal-gitdrop-backdrop"
      onClick={() => setCommandPaletteOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-gitdrop"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', marginTop: '-15vh' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Search size={18} color="var(--text-secondary)" style={{ marginRight: '10px' }} />
          <input
            type="text"
            className="form-control-gitdrop"
            style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '14px', boxShadow: 'none' }}
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setCommandPaletteOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    cursor: 'pointer',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: isSelected ? 'var(--accent-text)' : 'inherit' }}>{cmd.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 500 : 400 }}>{cmd.title}</span>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: '4px' }}>
                      {cmd.category}
                    </span>
                  </div>
                  {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
