import React, { useState } from 'react';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import {
  GitBranch,
  Plus,
  GitMerge,
  GitPullRequest,
  Trash2,
  Edit2,
  Check,
  Globe,
} from 'lucide-react';
import { CreateBranchModal, MergeModal, RebaseModal } from '@/components/Modals/BranchModals';

export const BranchesPage: React.FC = () => {
  const {
    branches,
    currentBranch,
    checkoutBranch,
    deleteBranch,
    renameBranch,
  } = useGit();
  const { requestConfirm } = useUI();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isMergeModalOpen, setMergeModalOpen] = useState(false);
  const [isRebaseModalOpen, setRebaseModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');

  const localBranches = branches.filter((b) => !b.remote);
  const remoteBranches = branches.filter((b) => !!b.remote);

  const handleDelete = (branchName: string) => {
    requestConfirm({
      title: `Delete Branch "${branchName}"?`,
      message: `Are you sure you want to delete branch "${branchName}"? Commits on this branch may become unreachable if not merged.`,
      isDanger: true,
      confirmText: 'Delete Branch',
      onConfirm: () => deleteBranch(branchName),
    });
  };

  const startRename = (oldName: string) => {
    setEditingBranch(oldName);
    setNewBranchName(oldName);
  };

  const submitRename = async (oldName: string) => {
    if (!newBranchName.trim() || newBranchName === oldName) {
      setEditingBranch(null);
      return;
    }
    await renameBranch(oldName, newBranchName.trim());
    setEditingBranch(null);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Branches
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Current active branch: <strong style={{ color: 'var(--accent-text)' }}>{currentBranch}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gitdrop btn-gitdrop-primary" onClick={() => setCreateModalOpen(true)}>
              <Plus size={14} />
              <span>New Branch</span>
            </button>
            <button className="btn-gitdrop" onClick={() => setMergeModalOpen(true)}>
              <GitMerge size={14} />
              <span>Merge</span>
            </button>
            <button className="btn-gitdrop" onClick={() => setRebaseModalOpen(true)}>
              <GitPullRequest size={14} />
              <span>Rebase</span>
            </button>
          </div>
        </div>

        {/* Local Branches List */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
            }}
          >
            Local Branches ({localBranches.length})
          </div>

          <div>
            {localBranches.map((branch) => {
              const isCurrent = branch.name === currentBranch;
              const isEditing = editingBranch === branch.name;

              return (
                <div
                  key={branch.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: isCurrent ? 'var(--bg-selected)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GitBranch
                      size={16}
                      color={isCurrent ? 'var(--accent-text)' : 'var(--text-muted)'}
                    />

                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control-gitdrop"
                          style={{ padding: '2px 8px', width: '200px' }}
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(branch.name);
                            if (e.key === 'Escape') setEditingBranch(null);
                          }}
                        />
                        <button
                          className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
                          onClick={() => submitRename(branch.name)}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isCurrent ? 600 : 500,
                            color: isCurrent ? 'var(--accent-text)' : 'var(--text-primary)',
                          }}
                        >
                          {branch.name}
                        </span>
                        {isCurrent && (
                          <span
                            className="badge-gitdrop"
                            style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '10px' }}
                          >
                            HEAD
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!isCurrent && (
                      <button
                        className="btn-gitdrop btn-gitdrop-sm"
                        onClick={() => checkoutBranch(branch.name)}
                      >
                        Checkout
                      </button>
                    )}

                    <button
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      onClick={() => startRename(branch.name)}
                      title="Rename Branch"
                    >
                      <Edit2 size={13} />
                    </button>

                    {!isCurrent && (
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        onClick={() => handleDelete(branch.name)}
                        title="Delete Branch"
                      >
                        <Trash2 size={13} color="var(--danger-text)" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remote Branches List */}
        {remoteBranches.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                letterSpacing: '0.5px',
              }}
            >
              Remote Branches ({remoteBranches.length})
            </div>

            <div>
              {remoteBranches.map((branch) => (
                <div
                  key={branch.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {branch.name}
                    </span>
                  </div>

                  <button
                    className="btn-gitdrop btn-gitdrop-sm"
                    onClick={() => {
                      const localName = branch.name.replace(/^origin\//, '');
                      checkoutBranch(localName);
                    }}
                  >
                    Checkout as Local
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateBranchModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
      <MergeModal isOpen={isMergeModalOpen} onClose={() => setMergeModalOpen(false)} />
      <RebaseModal isOpen={isRebaseModalOpen} onClose={() => setRebaseModalOpen(false)} />
    </div>
  );
};
