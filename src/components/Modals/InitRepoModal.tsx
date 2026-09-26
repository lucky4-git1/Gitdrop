import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useConfig } from '@/state/ConfigContext';
import { GitBranch, X, Check } from 'lucide-react';

interface InitRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InitRepoModal: React.FC<InitRepoModalProps> = ({ isOpen, onClose }) => {
  const { initializeGit } = useRepository();
  const { config, updateConfig } = useConfig();

  const [branch, setBranch] = useState(config.defaultBranch || 'main');
  const [name, setName] = useState(config.userName);
  const [email, setEmail] = useState(config.userEmail);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    try {
      updateConfig({ userName: name, userEmail: email, defaultBranch: branch });
      await initializeGit({
        defaultBranch: branch,
        user: { name, email },
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch {
      // error handled in context
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <GitBranch size={16} />
            Initialize Git Repository
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {isSuccess ? (
          <div className="modal-gitdrop-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-subtle)',
                color: 'var(--success-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <Check size={24} />
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Repository Initialized!</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
              Your local Git workspace is now active on branch <strong>{branch}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleInit}>
            <div className="modal-gitdrop-body">
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Default Branch Name
                </label>
                <input
                  type="text"
                  className="form-control-gitdrop"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Author Name
                </label>
                <input
                  type="text"
                  className="form-control-gitdrop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Author Email
                </label>
                <input
                  type="email"
                  className="form-control-gitdrop"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="modal-gitdrop-footer">
              <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isInitializing}>
                Cancel
              </button>
              <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isInitializing}>
                {isInitializing ? 'Initializing...' : 'Initialize Repository'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
