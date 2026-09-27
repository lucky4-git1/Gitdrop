import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useAuth } from '@/state/AuthContext';
import { useConfig } from '@/state/ConfigContext';
import { useUI } from '@/state/UIContext';
import { MemoryFS } from '@/services/filesystem/MemoryFS';
import { BrowserGitAdapter } from '@/services/git/BrowserGitAdapter';
import { detectProject } from '@/services/project/projectDetector';
import { GitPullRequest, X, Loader2 } from 'lucide-react';

interface CloneRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloneRepoModal: React.FC<CloneRepoModalProps> = ({ isOpen, onClose }) => {
  const { userRepos, isAuthenticated, getCredentialForGit } = useAuth();
  const { config } = useConfig();
  const { setActiveView } = useUI();
  const { openDirectoryHandle } = useRepository();

  const [url, setUrl] = useState('');
  const [folderName, setFolderName] = useState('');
  const [targetType, setTargetType] = useState<'virtual' | 'local'>('virtual');
  const [isCloning, setIsCloning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectRepo = (cloneUrl: string, name: string) => {
    setUrl(cloneUrl);
    setFolderName(name);
  };

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsCloning(true);
    setStatusMessage('Preparing clone environment...');

    try {
      const derivedName = folderName.trim() || url.split('/').pop()?.replace(/\.git$/, '') || 'cloned-repo';

      if (targetType === 'local' && 'showDirectoryPicker' in window) {
        setStatusMessage('Please select an empty directory to clone into...');
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        await openDirectoryHandle(handle);
        setStatusMessage('Cloning remote repository into selected directory...');
        // Note: For FileSystemAccessFS, clone runs through adapter
      } else {
        // Clone into MemoryFS
        setStatusMessage(`Cloning objects from ${url}...`);
        const fs = new MemoryFS();
        const git = new BrowserGitAdapter(fs, '/');

        const token = await getCredentialForGit();
        await git.clone({
          url: url.trim(),
          dir: '/',
          corsProxy: config.corsProxy,
          token: token || undefined,
          depth: 50,
        });

        setStatusMessage('Inspecting repository...');
        const info = await detectProject(fs, derivedName);

        // Open cloned project
        (window as any).__gitdrop_active_fs = fs;
        (window as any).__gitdrop_active_git = git;
        (window as any).__gitdrop_active_info = info;

        // RepositoryContext direct setup
        const repoCtx = (window as any).__gitdrop_repo_context;
        if (repoCtx?.setCustomProject) {
          repoCtx.setCustomProject(fs, git, info);
        }
      }

      setActiveView('workspace');
      onClose();
    } catch (err: any) {
      alert(`Clone failed: ${err.message || 'Please check repository URL, permissions, and CORS proxy.'}`);
    } finally {
      setIsCloning(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <GitPullRequest size={16} />
            Clone Remote Repository
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleClone}>
          <div className="modal-gitdrop-body">
            {/* If GitHub connected, show quick repo picker */}
            {isAuthenticated && userRepos.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                  Pick from your GitHub repositories:
                </label>
                <select
                  className="form-select-gitdrop"
                  onChange={(e) => {
                    const repo = userRepos.find((r) => r.cloneUrl === e.target.value);
                    if (repo) handleSelectRepo(repo.cloneUrl, repo.name);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>-- Select a GitHub repository --</option>
                  {userRepos.map((r) => (
                    <option key={r.id} value={r.cloneUrl}>
                      {r.fullName} {r.private ? '(Private)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Repository Clone URL
              </label>
              <input
                type="url"
                className="form-control-gitdrop"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository.git"
                required
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Project Name (optional)
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="my-project"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Target Workspace
              </label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'virtual'}
                    onChange={() => setTargetType('virtual')}
                  />
                  <span>In-Memory Workspace (Instant)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="target"
                    checked={targetType === 'local'}
                    onChange={() => setTargetType('local')}
                  />
                  <span>Select Local Folder (Disk)</span>
                </label>
              </div>
            </div>

            {isCloning && (
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent-text)' }}>
                <Loader2 size={16} className="spin" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isCloning}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isCloning || !url.trim()}>
              {isCloning ? 'Cloning...' : 'Clone Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
