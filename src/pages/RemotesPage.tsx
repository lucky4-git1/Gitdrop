import React, { useState } from 'react';
import { useGit } from '@/state/GitContext';
import { useAuth } from '@/state/AuthContext';
import { useUI } from '@/state/UIContext';
import {
  Globe,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';
import { AddRemoteModal, PushModal } from '@/components/Modals/BranchModals';

export const RemotesPage: React.FC = () => {
  const { remotes, fetch, pull, removeRemote } = useGit();
  const { isAuthenticated, userRepos } = useAuth();
  const { requestConfirm } = useUI();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isPushModalOpen, setPushModalOpen] = useState(false);
  const [isOperating, setIsOperating] = useState<string | null>(null);

  const handleFetch = async (remoteName: string) => {
    setIsOperating(`fetch-${remoteName}`);
    try {
      await fetch(remoteName);
    } finally {
      setIsOperating(null);
    }
  };

  const handlePull = async (remoteName: string) => {
    setIsOperating(`pull-${remoteName}`);
    try {
      await pull({ remote: remoteName });
    } finally {
      setIsOperating(null);
    }
  };

  const handleRemove = (remoteName: string) => {
    requestConfirm({
      title: `Remove Remote "${remoteName}"?`,
      message: `Are you sure you want to remove remote "${remoteName}"? Local branches pointing to this remote will lose their upstream.`,
      isDanger: true,
      confirmText: 'Remove Remote',
      onConfirm: () => removeRemote(remoteName),
    });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Remotes
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Manage remote upstream repositories, push branches, and sync updates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gitdrop btn-gitdrop-primary" onClick={() => setAddModalOpen(true)}>
              <Plus size={14} />
              <span>Add Remote</span>
            </button>
            <button className="btn-gitdrop" onClick={() => setPushModalOpen(true)}>
              <ArrowUpRight size={14} />
              <span>Push Changes</span>
            </button>
          </div>
        </div>

        {/* Configured Remotes */}
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
            Configured Remotes ({remotes.length})
          </div>

          {remotes.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No remotes configured yet. Click &quot;Add Remote&quot; or publish to GitHub to link a remote repository.
            </div>
          ) : (
            <div>
              {remotes.map((remote) => (
                <div
                  key={remote.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Globe size={18} color="var(--accent-text)" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {remote.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {remote.url}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="btn-gitdrop btn-gitdrop-sm"
                      onClick={() => handleFetch(remote.name)}
                      disabled={isOperating === `fetch-${remote.name}`}
                      title="Fetch changes from remote"
                    >
                      <RefreshCw size={12} className={isOperating === `fetch-${remote.name}` ? 'spin' : ''} />
                      <span>Fetch</span>
                    </button>

                    <button
                      className="btn-gitdrop btn-gitdrop-sm"
                      onClick={() => handlePull(remote.name)}
                      disabled={isOperating === `pull-${remote.name}`}
                      title="Pull and merge latest remote commits"
                    >
                      <ArrowDownLeft size={12} className={isOperating === `pull-${remote.name}` ? 'spin' : ''} />
                      <span>Pull</span>
                    </button>

                    <button
                      className="btn-gitdrop btn-gitdrop-sm btn-gitdrop-primary"
                      onClick={() => setPushModalOpen(true)}
                      title="Push commits to remote"
                    >
                      <ArrowUpRight size={12} />
                      <span>Push</span>
                    </button>

                    <button
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      onClick={() => handleRemove(remote.name)}
                      title="Remove remote"
                    >
                      <Trash2 size={13} color="var(--danger-text)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GitHub Linked Repositories (If authenticated) */}
        {isAuthenticated && userRepos.length > 0 && (
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Github size={14} />
              <span>Your GitHub Repositories ({userRepos.length})</span>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {userRepos.slice(0, 10).map((repo) => (
                <div
                  key={repo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-muted)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {repo.fullName}
                    </div>
                    {repo.description && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {repo.description}
                      </div>
                    )}
                  </div>

                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                  >
                    <ExternalLink size={12} />
                    <span>View on GitHub</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddRemoteModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
      <PushModal isOpen={isPushModalOpen} onClose={() => setPushModalOpen(false)} />
    </div>
  );
};
