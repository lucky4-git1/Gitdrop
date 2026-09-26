import React, { useState } from 'react';
import { useConfig } from '@/state/ConfigContext';
import { useAuth } from '@/state/AuthContext';
import { useUI } from '@/state/UIContext';
import {
  User,
  Sun,
  Moon,
  Laptop,
  Key,
  LogOut,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

export const SettingsPage: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const { isAuthenticated, session, connectGitHub, disconnectGitHub, isLoading } = useAuth();
  const { theme, setTheme } = useUI();

  const [userName, setUserName] = useState(config.userName);
  const [userEmail, setUserEmail] = useState(config.userEmail);
  const [defaultBranch, setDefaultBranch] = useState(config.defaultBranch);
  const [corsProxy, setCorsProxy] = useState(config.corsProxy);
  const [tokenInput, setTokenInput] = useState('');
  const [savedIdentity, setSavedIdentity] = useState(false);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      userName,
      userEmail,
      defaultBranch,
      corsProxy,
    });
    setSavedIdentity(true);
    setTimeout(() => setSavedIdentity(false), 2000);
  };

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    await connectGitHub(tokenInput.trim());
    setTokenInput('');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
          Configure Git identity, theme, CORS proxy, and GitHub integration.
        </p>

        {/* GitHub Authentication Card */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Github size={20} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>GitHub Connection</h3>
            </div>
            {isAuthenticated && (
              <span className="badge-gitdrop" style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success-text)' }}>
                <Check size={12} /> Connected
              </span>
            )}
          </div>

          {isAuthenticated && session ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.login}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border)' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{session.user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{session.user.login}</div>
                  {session.user.email && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{session.user.email}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} color="var(--success-text)" />
                  Token stored safely in session storage
                </div>
                <button className="btn-gitdrop btn-gitdrop-danger btn-gitdrop-sm" onClick={disconnectGitHub}>
                  <LogOut size={12} />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectGitHub}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                Connect GitDrop to your GitHub account using a <strong>Personal Access Token (classic or fine-grained)</strong> with <code>repo</code> permissions.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Personal Access Token
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    className="form-control-gitdrop"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn-gitdrop btn-gitdrop-primary"
                    disabled={isLoading || !tokenInput.trim()}
                  >
                    <Key size={14} />
                    <span>{isLoading ? 'Connecting...' : 'Connect'}</span>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Tokens are stored locally in your browser session and never sent to any intermediate server.
              </div>
            </form>
          )}
        </div>

        {/* Git Author Identity */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={18} color="var(--accent-text)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Git Identity</h3>
          </div>

          <form onSubmit={handleSaveIdentity}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  User Name
                </label>
                <input
                  type="text"
                  className="form-control-gitdrop"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Lucky Developer"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  User Email
                </label>
                <input
                  type="email"
                  className="form-control-gitdrop"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="developer@example.com"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Default Branch Name
                </label>
                <input
                  type="text"
                  className="form-control-gitdrop"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="main"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  CORS Proxy URL
                </label>
                <input
                  type="url"
                  className="form-control-gitdrop"
                  value={corsProxy}
                  onChange={(e) => setCorsProxy(e.target.value)}
                  placeholder="https://cors.isomorphic-git.org"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-gitdrop btn-gitdrop-primary">
                {savedIdentity ? <Check size={14} /> : null}
                <span>{savedIdentity ? 'Saved!' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Theme Settings */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 600 }}>Appearance</h3>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn-gitdrop ${theme === 'dark' ? 'btn-gitdrop-primary' : ''}`}
              style={{ padding: '8px 16px' }}
              onClick={() => setTheme('dark')}
            >
              <Moon size={14} />
              <span>Dark (Default)</span>
            </button>
            <button
              className={`btn-gitdrop ${theme === 'light' ? 'btn-gitdrop-primary' : ''}`}
              style={{ padding: '8px 16px' }}
              onClick={() => setTheme('light')}
            >
              <Sun size={14} />
              <span>Light</span>
            </button>
            <button
              className={`btn-gitdrop ${theme === 'system' ? 'btn-gitdrop-primary' : ''}`}
              style={{ padding: '8px 16px' }}
              onClick={() => setTheme('system')}
            >
              <Laptop size={14} />
              <span>System</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
