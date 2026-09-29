import React, { useState, useEffect } from 'react';
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
  const { projectInfo, activeProject, gitService, refreshProjectInfo } = useRepository();
  const { isAuthenticated, createRemoteRepo, connectGitHub, profile } = useAuth();
  const { stageAll, commit, addRemote, push, remotes, currentBranch, refresh } = useGit();

  const [name, setName] = useState(activeProject?.displayName || activeProject?.name || projectInfo?.name || 'my-project');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [tokenInput, setTokenInput] = useState('');
  const [isConnectingToken, setIsConnectingToken] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [steps, setSteps] = useState<{ id: string; label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnectToken = async () => {
    if (!tokenInput.trim()) return;
    setIsConnectingToken(true);
    setConnectError(null);
    try {
      await connectGitHub(tokenInput.trim());
      setTokenInput('');
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to authenticate token with GitHub.');
    } finally {
      setIsConnectingToken(false);
    }
  };

  // Sync state with currently active project whenever modal opens or active project changes
  useEffect(() => {
    if (isOpen) {
      setName(activeProject?.displayName || activeProject?.name || projectInfo?.name || 'my-project');
      setDescription('');
      setIsPublishing(false);
      setIsSuccess(false);
      setErrorMessage(null);
      setSteps([]);
      setTokenInput('');
      setConnectError(null);
    }
  }, [isOpen, activeProject?.name, activeProject?.displayName, projectInfo?.name]);

  if (!isOpen) return null;

  const existingOrigin = remotes.find((r) => r.name === 'origin');

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAuthenticated && !tokenInput.trim()) {
      setErrorMessage('Please enter your GitHub Personal Access Token to push this repository.');
      return;
    }

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
      // 0. Auto-connect token if provided and not yet authenticated
      if (!isAuthenticated && tokenInput.trim()) {
        updateStep('create', 'running', 'Connecting to GitHub with token...');
        await connectGitHub(tokenInput.trim());
      }

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
      await gitService?.ensureGitInitialized();
      await refreshProjectInfo();
      await addRemote('origin', remoteUrl);
      updateStep('remote', 'done');

      // 3. Stage files
      updateStep('stage', 'running');
      const statToStage = await gitService?.status().catch(() => null);
      if (statToStage && statToStage.unstaged.length > 0) {
        await gitService?.add(statToStage.unstaged.map((f) => f.path));
      } else {
        await stageAll();
      }
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

      // 6. Ensure project info and git context are fully refreshed
      await refreshProjectInfo();
      await refresh();

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
            Push to GitHub
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
              {isAuthenticated && profile && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Github size={14} color="var(--accent-text)" />
                  <span>
                    Pushing to GitHub as <strong>@{profile.username}</strong>
                  </span>
                </div>
              )}

              {!isAuthenticated && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Github size={16} color="var(--accent-text)" />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      Connect GitHub Account
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Enter your GitHub Personal Access Token to push and create this repository on GitHub.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      className="form-control-gitdrop"
                      placeholder="Paste token (ghp_... or github_pat_...)"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      style={{ fontSize: '12px', flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
                      onClick={handleConnectToken}
                      disabled={isConnectingToken || !tokenInput.trim()}
                    >
                      {isConnectingToken ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                  {connectError && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--danger-text)' }}>
                      {connectError}
                    </div>
                  )}
                </div>
              )}

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
                    Pushing will sync your current branch and commits directly to this remote.
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
                  Branch to Push
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
              <button
                type="submit"
                className="btn-gitdrop btn-gitdrop-primary"
                disabled={!isAuthenticated && !tokenInput.trim()}
              >
                {!isAuthenticated && !tokenInput.trim()
                  ? 'Connect Token to Push'
                  : existingOrigin
                  ? 'Push to GitHub'
                  : 'Create & Push to GitHub'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
