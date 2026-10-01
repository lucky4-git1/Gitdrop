import React, { useState } from 'react';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import { GitBranch, GitMerge, GitPullRequest, Bookmark, Tag, Globe, ArrowUpRight, X } from 'lucide-react';

/* ---------------- CREATE BRANCH MODAL ---------------- */
export const CreateBranchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentBranch, branches, createBranch, checkoutBranch } = useGit();
  const [name, setName] = useState('');
  const [startPoint, setStartPoint] = useState(currentBranch);
  const [checkoutImmediately, setCheckoutImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createBranch(name.trim(), startPoint);
      if (checkoutImmediately) {
        await checkoutBranch(name.trim());
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <GitBranch size={16} />
            Create Branch
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-gitdrop-body">
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Branch Name
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="feature/dashboard"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Create from
              </label>
              <select
                className="form-select-gitdrop"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} {b.current ? '(current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checkoutImmediately}
                  onChange={(e) => setCheckoutImmediately(e.target.checked)}
                />
                <span>Checkout branch immediately</span>
              </label>
            </div>
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- MERGE MODAL ---------------- */
export const MergeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentBranch, branches, mergeBranch } = useGit();
  const { setActiveView } = useUI();
  const [sourceBranch, setSourceBranch] = useState(
    branches.find((b) => !b.current)?.name || ''
  );
  const [isMerging, setIsMerging] = useState(false);

  if (!isOpen) return null;

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceBranch) return;
    setIsMerging(true);
    try {
      const res = await mergeBranch(sourceBranch);
      if (!res.success && res.conflicts && res.conflicts.length > 0) {
        // Direct user to visual conflict resolver!
        setActiveView('conflicts');
      }
      onClose();
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <GitMerge size={16} />
            Merge Branch
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleMerge}>
          <div className="modal-gitdrop-body">
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Merge changes from another branch into current branch (<strong>{currentBranch}</strong>).
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Select branch to merge:
              </label>
              <select
                className="form-select-gitdrop"
                value={sourceBranch}
                onChange={(e) => setSourceBranch(e.target.value)}
              >
                {branches
                  .filter((b) => !b.current)
                  .map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isMerging}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isMerging || !sourceBranch}>
              {isMerging ? 'Merging...' : 'Merge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- REBASE MODAL ---------------- */
export const RebaseModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentBranch, branches, rebaseBranch } = useGit();
  const [ontoBranch, setOntoBranch] = useState(
    branches.find((b) => !b.current)?.name || ''
  );
  const [isRebasing, setIsRebasing] = useState(false);

  if (!isOpen) return null;

  const handleRebase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ontoBranch) return;
    setIsRebasing(true);
    try {
      await rebaseBranch(ontoBranch);
      onClose();
    } finally {
      setIsRebasing(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <GitPullRequest size={16} />
            Rebase Branch
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleRebase}>
          <div className="modal-gitdrop-body">
            <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Reapply commits from <strong>{currentBranch}</strong> onto target branch.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Rebase onto:
              </label>
              <select
                className="form-select-gitdrop"
                value={ontoBranch}
                onChange={(e) => setOntoBranch(e.target.value)}
              >
                {branches
                  .filter((b) => !b.current)
                  .map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isRebasing}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isRebasing || !ontoBranch}>
              {isRebasing ? 'Rebasing...' : 'Start Rebase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- STASH MODAL ---------------- */
export const StashModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { stashSave } = useGit();
  const [message, setMessage] = useState('');
  const [isStashing, setIsStashing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStashing(true);
    try {
      await stashSave(message);
      onClose();
    } finally {
      setIsStashing(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <Bookmark size={16} />
            Stash Changes
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-gitdrop-body">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              Stash Message (optional)
            </label>
            <input
              type="text"
              className="form-control-gitdrop"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="WIP on navbar changes"
              autoFocus
            />
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isStashing}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isStashing}>
              {isStashing ? 'Stashing...' : 'Stash Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- CREATE TAG MODAL ---------------- */
export const CreateTagModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createTag } = useGit();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createTag(name.trim(), undefined, message);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <Tag size={16} />
            Create Tag
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-gitdrop-body">
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Tag Name
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="v1.0.0"
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Message (optional)
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Release notes / message"
              />
            </div>
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isCreating || !name.trim()}>
              {isCreating ? 'Creating...' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- ADD REMOTE MODAL ---------------- */
export const AddRemoteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addRemote, refresh } = useGit();
  const [name, setName] = useState('origin');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setError(null);
    setIsAdding(true);
    try {
      await addRemote(name.trim(), url.trim());
      await refresh();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add remote repository');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <Globe size={16} />
            Add Remote Repository
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-gitdrop-body">
            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-subtle)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger-text)',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Remote Name
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="origin"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Remote URL
              </label>
              <input
                type="text"
                className="form-control-gitdrop"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git or git@github.com:user/repo.git"
                required
              />
            </div>
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isAdding}>
              Cancel
            </button>
            <button type="submit" className="btn-gitdrop btn-gitdrop-primary" disabled={isAdding || !name.trim() || !url.trim()}>
              {isAdding ? 'Adding...' : 'Add Remote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- PUSH MODAL ---------------- */
export const PushModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentBranch, remotes, push } = useGit();
  const { requestConfirm } = useUI();
  const [remote, setRemote] = useState(remotes[0]?.name || 'origin');
  const [force, setForce] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  if (!isOpen) return null;

  const executePush = async () => {
    setIsPushing(true);
    try {
      await push({ remote, branch: currentBranch, force });
      onClose();
    } finally {
      setIsPushing(false);
    }
  };

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (force) {
      requestConfirm({
        title: 'Force Push Warning',
        message: `Are you sure you want to force push branch "${currentBranch}" to "${remote}"? This may overwrite remote history!`,
        isDanger: true,
        confirmText: 'Force Push',
        onConfirm: executePush,
      });
    } else {
      await executePush();
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <ArrowUpRight size={16} />
            Push Changes
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handlePush}>
          <div className="modal-gitdrop-body">
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Local Branch
              </label>
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '12px' }}>
                {currentBranch}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Target Remote
              </label>
              <select
                className="form-select-gitdrop"
                value={remote}
                onChange={(e) => setRemote(e.target.value)}
              >
                {remotes.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.url})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: force ? 'var(--danger-text)' : 'inherit' }}>
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                />
                <span>Force push (overwrite remote history)</span>
              </label>
            </div>
          </div>

          <div className="modal-gitdrop-footer">
            <button type="button" className="btn-gitdrop" onClick={onClose} disabled={isPushing}>
              Cancel
            </button>
            <button type="submit" className={`btn-gitdrop ${force ? 'btn-gitdrop-danger' : 'btn-gitdrop-primary'}`} disabled={isPushing}>
              {isPushing ? 'Pushing...' : force ? 'Force Push' : 'Push'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
