import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useAuth } from '@/state/AuthContext';
import { useConfig } from '@/state/ConfigContext';
import { useUI } from '@/state/UIContext';
import { FileSystemAccessFS } from '@/services/filesystem/FileSystemAccessFS';
import { BrowserGitAdapter } from '@/services/git/BrowserGitAdapter';
import { PlusCircle, X, Loader2 } from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { session, createRemoteRepo, isAuthenticated } = useAuth();
  const { config } = useConfig();
  const { setActiveView } = useUI();
  const { openVirtualProject, openDirectoryHandle } = useRepository();

  const [projectName, setProjectName] = useState('my-new-project');
  const [template, setTemplate] = useState<'empty' | 'react-vite'>('react-vite');
  const [storageType, setStorageType] = useState<'virtual' | 'local'>('virtual');
  const [createOnGitHub, setCreateOnGitHub] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [statusText, setStatusText] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsCreating(true);
    setStatusText('Creating project files...');

    try {
      if (storageType === 'local' && 'showDirectoryPicker' in window) {
        setStatusText('Please select or create a folder on your computer...');
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        const fs = new FileSystemAccessFS(handle);
        const git = new BrowserGitAdapter(fs, '/');

        // Write starter files
        await fs.writeFile('README.md', `# ${projectName}\n\nManaged with GitDrop visual client.`);
        await fs.writeFile('.gitignore', 'node_modules/\ndist/\n*.local\n');

        if (template === 'react-vite') {
          await fs.writeFile('package.json', JSON.stringify({
            name: projectName,
            private: true,
            version: '0.0.0',
            type: 'module',
            dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
          }, null, 2));
        }

        // Initialize git
        setStatusText('Initializing Git repository...');
        await git.init({
          defaultBranch: config.defaultBranch || 'main',
          user: { name: config.userName, email: config.userEmail },
        });

        // Stage & initial commit
        await git.add(['README.md', '.gitignore', ...(template === 'react-vite' ? ['package.json'] : [])]);
        await git.commit('Initial commit via GitDrop');

        // Create on GitHub if selected
        if (createOnGitHub && session?.token) {
          setStatusText(`Creating repository "${projectName}" on GitHub...`);
          const ghRepo = await createRemoteRepo({
            name: projectName,
            private: isPrivate,
          });
          await git.addRemote('origin', ghRepo.cloneUrl);
          setStatusText('Pushing initial commit to GitHub...');
          await git.push({ remote: 'origin', branch: config.defaultBranch || 'main' });
        }

        await openDirectoryHandle(handle);
      } else {
        // Virtual In-Memory Workspace
        await openVirtualProject(projectName);

        // If GitHub selected
        if (createOnGitHub && session?.token) {
          setStatusText(`Creating repository "${projectName}" on GitHub...`);
          await createRemoteRepo({
            name: projectName,
            private: isPrivate,
          });
        }
      }

      setActiveView('workspace');
      onClose();
    } catch (err: any) {
      alert(`Project creation failed: ${err.message}`);
    } finally {
      setIsCreating(false);
      setStatusText('');
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <PlusCircle size={16} />
            Create New Repository
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="modal-gitdrop-body">
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Repository / Project Name
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-project"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Template
              </label>
              <select
                className="form-select-gitdrop"
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
              >
                <option value="react-vite">React + Vite Starter (Recommended)</option>
                <option value="empty">Empty Repository (README & .gitignore only)</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Storage Destination
              </label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="storage"
                    checked={storageType === 'virtual'}
                    onChange={() => setStorageType('virtual')}
                  />
                  <span>In-Memory Workspace (Instant)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="storage"
                    checked={storageType === 'local'}
                    onChange={() => setStorageType('local')}
                  />
                  <span>Select Local Folder (Disk)</span>
                </label>
              </div>
            </div>

            {/* Create on GitHub Option */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={createOnGitHub}
                  onChange={(e) => setCreateOnGitHub(e.target.checked)}
                  disabled={!isAuthenticated}
                />
                <Github size={14} />
                <span>Also create this repository on GitHub automatically</span>
              </label>

              {!isAuthenticated && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '22px' }}>
                  Connect your GitHub account in Settings to enable 1-click GitHub repository creation.
                </div>
              )}

              {createOnGitHub && isAuthenticated && (
                <div style={{ marginTop: '10px', marginLeft: '22px', display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="repo-vis"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                    />
                    <span>Private repository</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="repo-vis"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                    />
                    <span>Public repository</span>
                  </label>
                </div>
              )}
            </div>

            {isCreating && (
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent-text)' }}>
                <Loader2 size={16} className="spin" />
                <span>{statusText}</span>
              </div>
            )}
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isCreating || !projectName.trim()}>
              {isCreating ? 'Creating...' : 'Create Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
