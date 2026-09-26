import React, { useState, useEffect } from 'react';
import { useUI } from '@/state/UIContext';
import { useGit } from '@/state/GitContext';
import { useRepository } from '@/state/RepositoryContext';
import { Search, File, GitBranch, GitCommit, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'file' | 'branch' | 'commit';
  title: string;
  subtitle?: string;
  action: () => void;
}

export const GlobalSearch: React.FC = () => {
  const { isGlobalSearchOpen, setGlobalSearchOpen, setActiveView, setSelectedDiffFile } = useUI();
  const { branches, commits, checkoutBranch } = useGit();
  const { fileSystem } = useRepository();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fileList, setFileList] = useState<string[]>([]);

  // Collect files when search opens
  useEffect(() => {
    if (!isGlobalSearchOpen || !fileSystem) return;

    let isMounted = true;
    async function collectFiles() {
      const files: string[] = [];
      async function walk(dir: string, depth = 0) {
        if (depth > 4) return;
        try {
          const entries = await fileSystem!.readdir(dir);
          for (const entry of entries) {
            if (entry === '.git' || entry === 'node_modules' || entry === 'dist') continue;
            const full = dir ? `${dir}/${entry}` : entry;
            const stat = await fileSystem!.stat(full);
            if (stat.isDirectory()) {
              await walk(full, depth + 1);
            } else {
              files.push(full);
            }
          }
        } catch {
          // ignore
        }
      }
      await walk('');
      if (isMounted) setFileList(files);
    }

    collectFiles();
    return () => {
      isMounted = false;
    };
  }, [isGlobalSearchOpen, fileSystem]);

  const results: SearchResult[] = [];

  if (query.trim()) {
    const q = query.toLowerCase();

    // 1. Files
    for (const f of fileList) {
      if (f.toLowerCase().includes(q)) {
        results.push({
          id: `file-${f}`,
          type: 'file',
          title: f,
          subtitle: 'File',
          action: () => {
            setGlobalSearchOpen(false);
            setSelectedDiffFile(f);
            setActiveView('files');
          },
        });
      }
      if (results.length > 15) break;
    }

    // 2. Branches
    for (const b of branches) {
      if (b.name.toLowerCase().includes(q)) {
        results.push({
          id: `branch-${b.name}`,
          type: 'branch',
          title: b.name,
          subtitle: b.current ? 'Current Branch' : 'Branch',
          action: () => {
            setGlobalSearchOpen(false);
            checkoutBranch(b.name);
          },
        });
      }
    }

    // 3. Commits
    for (const c of commits) {
      if (c.message.toLowerCase().includes(q) || c.oid.toLowerCase().includes(q)) {
        results.push({
          id: `commit-${c.oid}`,
          type: 'commit',
          title: c.message.split('\n')[0],
          subtitle: `${c.oid.slice(0, 7)} • ${c.author.name}`,
          action: () => {
            setGlobalSearchOpen(false);
            setActiveView('commits');
          },
        });
      }
      if (results.length > 25) break;
    }
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      setGlobalSearchOpen(false);
    }
  };

  if (!isGlobalSearchOpen) return null;

  return (
    <div
      className="modal-gitdrop-backdrop"
      onClick={() => setGlobalSearchOpen(false)}
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
            placeholder="Search files, branches, commits... (Ctrl+P)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setGlobalSearchOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '6px' }}>
          {!query.trim() ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Type to search repository files, branches, and commits...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matches found for &quot;{query}&quot;
            </div>
          ) : (
            results.map((res, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={res.id}
                  onClick={res.action}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ color: isSelected ? 'var(--accent-text)' : 'inherit' }}>
                      {res.type === 'file' && <File size={16} />}
                      {res.type === 'branch' && <GitBranch size={16} />}
                      {res.type === 'commit' && <GitCommit size={16} />}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 500 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {res.title}
                    </span>
                  </div>
                  {res.subtitle && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {res.subtitle}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
