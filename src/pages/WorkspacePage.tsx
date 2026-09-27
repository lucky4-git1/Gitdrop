import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useGit } from '@/state/GitContext';
import { useAuth } from '@/state/AuthContext';
import { useUI } from '@/state/UIContext';
import {
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Clock,
  RefreshCw,
  FolderTree,
  Send,
  ArrowUpRight,
  FileCode,
} from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';
import { PublishModal } from '@/components/Modals/PublishModal';
import { GitignoreModal } from '@/components/Modals/GitignoreModal';
import { InitRepoModal } from '@/components/Modals/InitRepoModal';

export const WorkspacePage: React.FC = () => {
  const { projectInfo } = useRepository();
  const { status, currentBranch, commits, remotes, refresh, push, operationState } = useGit();
  const { isAuthenticated, session } = useAuth();
  const { setActiveView } = useUI();

  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isGitignoreModalOpen, setGitignoreModalOpen] = useState(false);
  const [isInitModalOpen, setInitModalOpen] = useState(false);

  const lastCommit = commits[0];
  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0);

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Workspace Title & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>
              {projectInfo?.name}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {projectInfo?.framework} • {projectInfo?.filesCount} files detected
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gitdrop" onClick={refresh} title="Refresh Git Status">
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>

            {remotes.length > 0 ? (
              <button
                className="btn-gitdrop btn-gitdrop-primary"
                onClick={() => push()}
                disabled={operationState.status === 'running'}
                title={`Push commits to ${remotes[0]?.name || 'origin'}`}
              >
                <ArrowUpRight size={14} />
                <span>
                  {operationState.type === 'push' && operationState.status === 'running'
                    ? 'Pushing...'
                    : commits.length === 0
                    ? 'Commit & Push to Remote'
                    : 'Push to Remote'}
                </span>
              </button>
            ) : (
              <button
                className="btn-gitdrop btn-gitdrop-primary"
                onClick={() => setPublishModalOpen(true)}
                title="Publish and push repository to GitHub"
              >
                <Github size={14} />
                <span>Push to GitHub</span>
              </button>
            )}

            {!projectInfo?.isGit && (
              <button
                className="btn-gitdrop"
                onClick={() => setInitModalOpen(true)}
                title="Initialize local Git repository without publishing"
              >
                <GitBranch size={14} />
                <span>Initialize Git</span>
              </button>
            )}

            {projectInfo?.isGit && remotes.length > 0 && isAuthenticated && (
              <button
                className="btn-gitdrop"
                onClick={() => setPublishModalOpen(true)}
                title="Publish Settings or Re-link"
              >
                <Github size={14} />
                <span>Publish Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Uninitialized Git Repository Banner */}
        {!projectInfo?.isGit && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Github size={24} color="var(--accent-text)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Folder is ready to be pushed to GitHub
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Push this folder directly to GitHub to create a repository, stage your files, and create the initial commit automatically.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm" onClick={() => setPublishModalOpen(true)}>
                <Github size={13} />
                <span>Push to GitHub</span>
              </button>
              <button className="btn-gitdrop btn-gitdrop-sm" onClick={() => setInitModalOpen(true)}>
                <GitBranch size={13} />
                <span>Initialize Local Only</span>
              </button>
              <button className="btn-gitdrop btn-gitdrop-sm" onClick={() => setGitignoreModalOpen(true)}>
                <FileCode size={13} />
                <span>Add .gitignore</span>
              </button>
            </div>
          </div>
        )}

        {/* Local Only Repository Banner (No Remote) */}
        {projectInfo?.isGit && remotes.length === 0 && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Github size={24} color="var(--accent-text)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Repository has no remote origin configured
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  This repository is local only. Push it to GitHub to create a remote repository and sync your commits.
                </div>
              </div>
            </div>
            <button className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm" onClick={() => setPublishModalOpen(true)}>
              <Github size={13} />
              <span>Push to GitHub</span>
            </button>
          </div>
        )}

        {/* Repository Health Section */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Repository Health</h2>
            <span
              className="badge-gitdrop"
              style={{
                backgroundColor: totalChanges === 0 ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                color: totalChanges === 0 ? 'var(--success-text)' : 'var(--warning-text)',
                padding: '3px 8px',
              }}
            >
              {totalChanges === 0 ? 'All Systems Healthy' : `${totalChanges} Uncommitted Changes`}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Git Init */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {projectInfo?.isGit ? (
                <CheckCircle2 size={18} color="var(--success-text)" />
              ) : (
                <AlertTriangle size={18} color="var(--warning-text)" />
              )}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Git Initialization</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {projectInfo?.isGit ? 'Initialized and active' : 'Not initialized'}
                </div>
              </div>
            </div>

            {/* Working Tree */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {totalChanges === 0 ? (
                <CheckCircle2 size={18} color="var(--success-text)" />
              ) : (
                <AlertTriangle size={18} color="var(--warning-text)" />
              )}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Working Tree</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {totalChanges === 0 ? 'Clean (no unstaged changes)' : `${totalChanges} files pending review`}
                </div>
              </div>
            </div>

            {/* Remote Config */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {remotes.length > 0 ? (
                <CheckCircle2 size={18} color="var(--success-text)" />
              ) : (
                <AlertTriangle size={18} color="var(--warning-text)" />
              )}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Remote Repository</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {remotes.length > 0 ? `Configured (${remotes[0].name})` : 'No remote configured'}
                </div>
              </div>
            </div>

            {/* GitHub Account */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {isAuthenticated ? (
                <CheckCircle2 size={18} color="var(--success-text)" />
              ) : (
                <AlertTriangle size={18} color="var(--text-muted)" />
              )}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>GitHub Connection</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {isAuthenticated ? `@${session?.user.login}` : 'Not connected'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remote Origin Banner */}
        {projectInfo?.isGit && remotes.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Github size={18} color="var(--accent-text)" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  Remote origin: <span style={{ fontFamily: 'monospace', color: 'var(--accent-text)' }}>{remotes[0]?.url}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Branch <strong>{currentBranch}</strong>
                  {commits.length === 0
                    ? ' • No commits yet — click to commit and push'
                    : (status?.ahead || 0) > 0
                    ? ` • ${status?.ahead} unpushed commit${(status?.ahead || 0) > 1 ? 's' : ''}`
                    : ' • Ready to push / sync'}
                </div>
              </div>
            </div>
            <button
              className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
              onClick={() => push()}
              disabled={operationState.status === 'running'}
            >
              <ArrowUpRight size={13} />
              <span>
                {operationState.type === 'push' && operationState.status === 'running'
                  ? 'Pushing...'
                  : commits.length === 0
                  ? 'Commit & Push'
                  : 'Push Commits'}
              </span>
            </button>
          </div>
        )}

        {/* Quick Action Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Review Changes */}
          <div
            onClick={() => setActiveView('changes')}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px' }}>
                <Send size={16} color="var(--accent-text)" />
                <span>Review & Commit Changes</span>
              </div>
              {totalChanges > 0 && (
                <span className="badge-gitdrop badge-gitdrop-modified">{totalChanges} pending</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Stage files, view visual Monaco diffs, and create commits.
            </p>
          </div>

          {/* Branch Manager */}
          <div
            onClick={() => setActiveView('branches')}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px' }}>
                <GitBranch size={16} color="var(--accent-text)" />
                <span>Branches & Merging</span>
              </div>
              <span className="badge-gitdrop" style={{ backgroundColor: 'var(--bg-hover)' }}>{currentBranch}</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Switch branches, create feature branches, merge, and rebase.
            </p>
          </div>

          {/* File Explorer & Monaco */}
          <div
            onClick={() => setActiveView('files')}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px' }}>
                <FolderTree size={16} color="var(--accent-text)" />
                <span>File Explorer & Monaco Editor</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Explore files, write code in Monaco, and preview Markdown READMEs.
            </p>
          </div>
        </div>

        {/* Latest Commit Info */}
        {lastCommit && (
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {lastCommit.message.split('\n')[0]}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Commit <code>{lastCommit.oid.slice(0, 7)}</code> by {lastCommit.author.name} • {formatTimeAgo(lastCommit.author.timestamp)}
                </div>
              </div>
            </div>

            <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={() => setActiveView('commits')}>
              View History
            </button>
          </div>
        )}
      </div>

      <PublishModal isOpen={isPublishModalOpen} onClose={() => setPublishModalOpen(false)} />
      <GitignoreModal isOpen={isGitignoreModalOpen} onClose={() => setGitignoreModalOpen(false)} />
      <InitRepoModal isOpen={isInitModalOpen} onClose={() => setInitModalOpen(false)} />
    </div>
  );
};
