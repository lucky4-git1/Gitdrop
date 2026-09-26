import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useAuth } from '@/state/AuthContext';
import { useGit } from '@/state/GitContext';
import { useConfig } from '@/state/ConfigContext';
import { X, Check, Loader2 } from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const { projectInfo } = useRepository();
  const { session, createRemoteRepo } = useAuth();
  const { stageAll, commit, addRemote, push } = useGit();
  const { config } = useConfig();

  const [name, setName] = useState(projectInfo?.name || 'my-project');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [steps, setSteps] = useState<{ id: string; label: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;

    setIsPublishing(true);
    const initialSteps = [
      { id: 'create', label: 'Create GitHub repository', status: 'running' as const },
      { id: 'remote', label: 'Configure origin remote', status: 'pending' as const },
      { id: 'stage', label: 'Stage all files', status: 'pending' as const },
      { id: 'commit', label: 'Create initial commit', status: 'pending' as const },
      { id: 'push', label: 'Push to GitHub', status: 'pending' as const },
    ];
    setSteps(initialSteps);

    const updateStep = (id: string, status: 'running' | 'done' | 'error') => {
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    };

    try {
      // 1. Create GitHub repository
      const remoteRepo = await createRemoteRepo({
        name,
        description,
        private: isPrivate,
      });
      updateStep('create', 'done');

      // 2. Add remote
      updateStep('remote', 'running');
      await addRemote('origin', remoteRepo.cloneUrl);
      updateStep('remote', 'done');

      // 3. Stage files
      updateStep('stage', 'running');
      await stageAll();
      updateStep('stage', 'done');

      // 4. Commit
      updateStep('commit', 'running');
      try {
        await commit('Initial commit via GitDrop');
      } catch {
        // If there's already a commit, continue
      }
      updateStep('commit', 'done');

      // 5. Push
      updateStep('push', 'running');
      await push({ remote: 'origin', branch: config.defaultBranch || 'main' });
      updateStep('push', 'done');

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsPublishing(false);
        onClose();
      }, 1500);
    } catch {
      // Step failed
      setSteps((prev) => prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s)));
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

        {isPublishing || isSuccess ? (
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
                  <span style={{ color: s.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish}>
            <div className="modal-gitdrop-body">
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
                Create & Publish
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
