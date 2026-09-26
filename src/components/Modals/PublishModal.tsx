import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useAuth } from '@/state/AuthContext';
import { useGit } from '@/state/GitContext';
import { X, Check, Loader2 } from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const { projectInfo, gitService } = useRepository();
  const { session, createRemoteRepo } = useAuth();
  const { stageAll, commit, addRemote, push, remotes, currentBranch } = useGit();

  const [name, setName] = useState(projectInfo?.name || 'my-project');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [steps, setSteps] = useState<{ id: string; label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingOrigin = remotes.find((r) => r.name === 'origin');

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session?.token) return;

    setIsPublishing(true);
    setErrorMessage(null);
    const initialSteps = [
      { id: 'create', label: 'Create or connect GitHub repository', status: 'running' as const },
      { id: 'remote', label: 'Configure origin remote', status: 'pending' as const },
      { id: 'stage', label: 'Stage all files', status: 'pending' as const },
      { id: 'commit', label: 'Create initial commit', status: 'pending' as const },
      { id: 'push', label: 'Push to GitHub', status: 'pending' as const },
    ];
    setSteps(initialSteps);

    const updateStep = (id: string, status: 'running' | 'done' | 'error', newLabel?: string) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status, ...(newLabel ? { label: newLabel } : {}) } : s))
      );
    };

    try {
      // 1. Create or resolve GitHub repository
      let remoteUrl = existingOrigin?.url;
      if (!remoteUrl) {
        const remoteRepo = await createRemoteRepo({
          name,
          description,
          private: isPrivate,
        });
        remoteUrl = remoteRepo.cloneUrl;
        updateStep('create', 'done', `Connected repository: ${remoteRepo.fullName}`);
      } else {
        updateStep('create', 'done', `Using existing remote repository: ${name}`);
      }

      // 2. Add or update remote
      updateStep('remote', 'running');
      await addRemote('origin', remoteUrl);
      updateStep('remote', 'done');

      // 3. Stage files
      updateStep('stage', 'running');
      await stageAll();
      updateStep('stage', 'done');

      // 4. Commit
      updateStep('commit', 'running');
      const commitsList = (await gitService?.log({ depth: 1 }).catch(() => [])) || [];
      const freshStatus = await gitService?.status().catch(() => null);
      const hasStaged = (freshStatus?.staged.length || 0) > 0;

      if (commitsList.length === 0 || hasStaged) {
        await commit(commitsList.length === 0 ? 'Initial commit via GitDrop' : 'Update files via GitDrop');
        updateStep('commit', 'done', commitsList.length === 0 ? 'Created initial commit' : 'Committed updates');
      } else {
        updateStep('commit', 'done', 'Local commits ready');
      }

      // 5. Push
      const activeBranch = (await gitService?.currentBranch().catch(() => null)) || currentBranch || 'main';
      updateStep('push', 'running', `Pushing branch "${activeBranch}" to GitHub...`);
      await push({ remote: 'origin', branch: activeBranch });
      updateStep('push', 'done', `Pushed "${activeBranch}" to GitHub successfully!`);

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsPublishing(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setSteps((prev) => prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s)));
      setErrorMessage(err.message || 'Publishing operation failed.');
      setIsPublishing(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <Github size={16} />
            Publish to GitHub
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {isPublishing || isSuccess || errorMessage ? (
          <div className="modal-gitdrop-body">
            <div style={{ marginBottom: '16px', fontWeight: 500, fontSize: '13px' }}>
              Publishing {name} to GitHub...
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {steps.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  {s.status === 'done' && <Check size={16} color="var(--success-text)" />}
                  {s.status === 'running' && <Loader2 size={16} className="spin" color="var(--accent-text)" />}
                  {s.status === 'pending' && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)' }} />}
                  {s.status === 'error' && <X size={16} color="var(--danger-text)" />}
                  <span style={{ color: s.status === 'pending' ? 'var(--text-muted)' : s.status === 'error' ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--danger-text)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Publish Failed</div>
                <div>{errorMessage}</div>
                <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.9 }}>
                  Tip: Ensure your GitHub Personal Access Token in Settings has `repo` write permissions, and that the CORS proxy is accessible.
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-gitdrop" onClick={onClose}>
                  Close
                </button>
                <button type="button" className="btn-gitdrop btn-gitdrop-primary" onClick={() => handlePublish()}>
                  Retry Publish
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handlePublish}>
            <div className="modal-gitdrop-body">
              {existingOrigin && (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontWeight: 500, color: 'var(--accent-text)' }}>Origin remote already configured:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                    {existingOrigin.url}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Publishing will push your current commits directly to this remote.
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Repository Name
                </label>
                <input
                  type="text"
                  className="form-control-gitdrop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-project"
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  className="form-control-gitdrop"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short project description"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                  Branch to Publish
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Active branch: <strong style={{ color: 'var(--accent-text)' }}>{currentBranch}</strong> (will be pushed to GitHub)
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Visibility
                </label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                    />
                    <span>Private</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                    />
                    <span>Public</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-gitdrop-footer">
              <button type="button" className="btn-gitdrop" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-gitdrop btn-gitdrop-primary">
                {existingOrigin ? 'Push to GitHub' : 'Create & Publish'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
