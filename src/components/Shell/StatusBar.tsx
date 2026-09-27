import React from 'react';
import { useGit } from '@/state/GitContext';
import { useRepository } from '@/state/RepositoryContext';
import { useAuth } from '@/state/AuthContext';
import { useUI } from '@/state/UIContext';
import { GitBranch, Check, AlertCircle, ArrowUp, ArrowDown, Globe } from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

export const StatusBar: React.FC = () => {
  const { currentBranch, status } = useGit();
  const { isOpen } = useRepository();
  const { isAuthenticated, profile, authStatus } = useAuth();
  const { setActiveView } = useUI();

  if (!isOpen) {
    return (
      <div
        style={{
          height: 'var(--statusbar-height)',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          userSelect: 'none',
        }}
      >
        <div>No repository open</div>
        <div>GitDrop Visual Client • Local-first</div>
      </div>
    );
  }

  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0);

  return (
    <div
      style={{
        height: 'var(--statusbar-height)',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Branch */}
        <div
          onClick={() => setActiveView('branches')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--text-primary)' }}
          title="Switch or manage branches"
        >
          <GitBranch size={12} color="var(--accent-text)" />
          <span style={{ fontWeight: 600 }}>{currentBranch}</span>
        </div>

        {/* Clean / Changes status */}
        <div
          onClick={() => setActiveView('changes')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
          title="View uncommitted changes"
        >
          {totalChanges === 0 ? (
            <>
              <Check size={12} color="var(--success-text)" />
              <span style={{ color: 'var(--success-text)' }}>Clean</span>
            </>
          ) : (
            <>
              <AlertCircle size={12} color="var(--warning-text)" />
              <span style={{ color: 'var(--warning-text)', fontWeight: 500 }}>
                {totalChanges} {totalChanges === 1 ? 'change' : 'changes'}
              </span>
            </>
          )}
        </div>

        {/* Ahead / Behind */}
        {((status?.ahead || 0) > 0 || (status?.behind || 0) > 0) && (
          <div
            onClick={() => setActiveView('remotes')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            {(status?.ahead || 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-text)' }}>
                <ArrowUp size={11} /> {status?.ahead}
              </span>
            )}
            {(status?.behind || 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--warning-text)' }}>
                <ArrowDown size={11} /> {status?.behind}
              </span>
            )}
          </div>
        )}

        {/* Upstream */}
        {status?.upstream && (
          <div
            onClick={() => setActiveView('remotes')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <Globe size={11} />
            <span>{status.upstream}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* GitHub Connection */}
        <div
          onClick={() => setActiveView('settings')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
          title={
            isAuthenticated
              ? `Connected as @${profile?.username}`
              : authStatus === 'expired'
              ? 'GitHub credential expired - click to reconnect'
              : 'Connect GitHub'
          }
        >
          <Github
            size={12}
            color={
              isAuthenticated
                ? 'var(--success-text)'
                : authStatus === 'expired'
                ? 'var(--warning-text)'
                : 'var(--text-muted)'
            }
          />
          <span
            style={{
              color:
                isAuthenticated
                  ? 'var(--text-primary)'
                  : authStatus === 'expired'
                  ? 'var(--warning-text)'
                  : 'var(--text-muted)',
            }}
          >
            {isAuthenticated
              ? `@${profile?.username}`
              : authStatus === 'expired'
              ? 'Auth expired'
              : 'GitHub not connected'}
          </span>
        </div>

        {/* Encoding */}
        <div style={{ color: 'var(--text-muted)' }}>UTF-8</div>
      </div>
    </div>
  );
};
