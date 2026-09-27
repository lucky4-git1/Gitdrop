import React, { useState } from 'react';
import { useConfig } from '@/state/ConfigContext';
import { useAuth } from '@/state/AuthContext';
import { useRepository } from '@/state/RepositoryContext';
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
  HardDrive,
  Database,
  Trash2,
  GitBranch,
  ShieldAlert,
} from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';
import { projectRegistry } from '@/services/project/ProjectRegistry';

type SettingsTab = 'general' | 'appearance' | 'git' | 'github' | 'storage';

export const SettingsPage: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const {
    isAuthenticated,
    profile,
    authStatus,
    maskedToken,
    connectGitHub,
    disconnectGitHub,
    isLoading,
  } = useAuth();
  const { projects } = useRepository();
  const { theme, setTheme, requestConfirm } = useUI();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [userName, setUserName] = useState(config.userName);
  const [userEmail, setUserEmail] = useState(config.userEmail);
  const [defaultBranch, setDefaultBranch] = useState(config.defaultBranch);
  const [corsProxy, setCorsProxy] = useState(config.corsProxy);
  const [tokenInput, setTokenInput] = useState('');
  const [savedIdentity, setSavedIdentity] = useState(false);
  const [reconnectMode, setReconnectMode] = useState(false);

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
    setReconnectMode(false);
  };

  const handleRemoveCredential = () => {
    requestConfirm({
      title: 'Remove Stored Credential',
      message:
        'Are you sure you want to remove your stored GitHub Personal Access Token? You will need to reconnect GitHub to push or pull from private repositories.\n\nYour local repositories, branches, and commits will NOT be affected.',
      confirmText: 'Remove Credential',
      isDanger: true,
      onConfirm: async () => {
        await disconnectGitHub();
        setReconnectMode(false);
      },
    });
  };

  const handleClearProjectHistory = () => {
    requestConfirm({
      title: 'Clear Project History',
      message:
        'Are you sure you want to clear your registered project list in GitDrop?\n\nThis only clears GitDrop’s saved list of projects. Your actual files, folders, and git repositories on your computer will remain completely intact.',
      confirmText: 'Clear History',
      isDanger: true,
      onConfirm: async () => {
        try {
          await projectRegistry.clearAll();
          window.location.reload();
        } catch {
          // ignore
        }
      },
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      {/* Settings Sub-Sidebar */}
      <div
        style={{
          width: '220px',
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 8px 12px 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
          SETTINGS
        </div>

        <button
          className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'general' ? 'var(--bg-elevated)' : 'transparent',
            fontWeight: activeTab === 'general' ? 600 : 400,
            color: activeTab === 'general' ? 'var(--accent-text)' : 'var(--text-primary)',
          }}
          onClick={() => setActiveTab('general')}
        >
          <HardDrive size={14} />
          <span>General</span>
        </button>

        <button
          className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'appearance' ? 'var(--bg-elevated)' : 'transparent',
            fontWeight: activeTab === 'appearance' ? 600 : 400,
            color: activeTab === 'appearance' ? 'var(--accent-text)' : 'var(--text-primary)',
          }}
          onClick={() => setActiveTab('appearance')}
        >
          <Sun size={14} />
          <span>Appearance</span>
        </button>

        <button
          className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'git' ? 'var(--bg-elevated)' : 'transparent',
            fontWeight: activeTab === 'git' ? 600 : 400,
            color: activeTab === 'git' ? 'var(--accent-text)' : 'var(--text-primary)',
          }}
          onClick={() => setActiveTab('git')}
        >
          <GitBranch size={14} />
          <span>Git Identity</span>
        </button>

        <button
          className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'github' ? 'var(--bg-elevated)' : 'transparent',
            fontWeight: activeTab === 'github' ? 600 : 400,
            color: activeTab === 'github' ? 'var(--accent-text)' : 'var(--text-primary)',
          }}
          onClick={() => setActiveTab('github')}
        >
          <Github size={14} />
          <span>GitHub Account</span>
        </button>

        <button
          className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'storage' ? 'var(--bg-elevated)' : 'transparent',
            fontWeight: activeTab === 'storage' ? 600 : 400,
            color: activeTab === 'storage' ? 'var(--accent-text)' : 'var(--text-primary)',
          }}
          onClick={() => setActiveTab('storage')}
        >
          <Database size={14} />
          <span>Storage</span>
        </button>
      </div>

      {/* Main Settings Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: '680px' }}>
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>General Settings</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Control startup behavior and application interactions.
              </p>

              {/* Startup Behavior Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Startup Behavior</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="startupBehavior"
                      checked={(config.startupBehavior || 'lastProject') === 'lastProject'}
                      onChange={() => updateConfig({ startupBehavior: 'lastProject' })}
                    />
                    <span>Open last project automatically</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="startupBehavior"
                      checked={config.startupBehavior === 'defaultProject'}
                      onChange={() => updateConfig({ startupBehavior: 'defaultProject' })}
                    />
                    <span>Open default project</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="startupBehavior"
                      checked={config.startupBehavior === 'projectManager'}
                      onChange={() => updateConfig({ startupBehavior: 'projectManager' })}
                    />
                    <span>Show project manager / Files workspace</span>
                  </label>
                </div>
              </div>

              {/* Behavior Checkboxes Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Safety & Automation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.confirmDestructive !== false}
                      onChange={(e) => updateConfig({ confirmDestructive: e.target.checked })}
                    />
                    <span>Confirm destructive Git operations (discard changes, hard reset, branch delete)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.detectExternalChanges !== false}
                      onChange={(e) => updateConfig({ detectExternalChanges: e.target.checked })}
                    />
                    <span>Detect external file changes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.autoRefreshStatus !== false}
                      onChange={(e) => updateConfig({ autoRefreshStatus: e.target.checked })}
                    />
                    <span>Automatically refresh Git status</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>Appearance</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Select a visual theme for the editor and application shell.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <button
                    className={`btn-gitdrop ${theme === 'dark' ? 'btn-gitdrop-primary' : ''}`}
                    onClick={() => setTheme('dark')}
                    style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
                  >
                    <Moon size={20} />
                    <span>Dark Theme</span>
                  </button>
                  <button
                    className={`btn-gitdrop ${theme === 'light' ? 'btn-gitdrop-primary' : ''}`}
                    onClick={() => setTheme('light')}
                    style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
                  >
                    <Sun size={20} />
                    <span>Light Theme</span>
                  </button>
                  <button
                    className={`btn-gitdrop ${theme === 'system' ? 'btn-gitdrop-primary' : ''}`}
                    onClick={() => setTheme('system')}
                    style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
                  >
                    <Laptop size={20} />
                    <span>System Default</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GIT IDENTITY */}
          {activeTab === 'git' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>Git Identity</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Default author information used when creating commits and initializing repositories.
              </p>

              <form
                onSubmit={handleSaveIdentity}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    Author Name
                  </label>
                  <input
                    type="text"
                    className="form-control-gitdrop"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    Author Email
                  </label>
                  <input
                    type="email"
                    className="form-control-gitdrop"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    Default Branch Name
                  </label>
                  <input
                    type="text"
                    className="form-control-gitdrop"
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    CORS Proxy URL (Browser Git Remote Operations)
                  </label>
                  <input
                    type="text"
                    className="form-control-gitdrop"
                    value={corsProxy}
                    onChange={(e) => setCorsProxy(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-gitdrop btn-gitdrop-primary">
                  {savedIdentity ? <Check size={14} /> : <User size={14} />}
                  <span>{savedIdentity ? 'Identity Saved!' : 'Save Git Identity'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB: GITHUB ACCOUNT */}
          {activeTab === 'github' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>GitHub Account</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Manage persistent GitHub authentication for cloning, fetching, and pushing.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
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
                  {authStatus === 'expired' && (
                    <span className="badge-gitdrop" style={{ backgroundColor: 'var(--warning-subtle)', color: 'var(--warning-text)' }}>
                      <ShieldAlert size={12} /> Expired
                    </span>
                  )}
                </div>

                {isAuthenticated && profile && !reconnectMode ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.username}
                          style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Github size={24} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{profile.name || profile.username}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{profile.username}</div>
                        {profile.email && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profile.email}</div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          Stored Credential (Masked)
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {maskedToken}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Persistent Storage
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                      <button className="btn-gitdrop btn-gitdrop-sm" onClick={() => setReconnectMode(true)}>
                        <Key size={12} />
                        <span>Reconnect</span>
                      </button>
                      <button className="btn-gitdrop btn-gitdrop-danger btn-gitdrop-sm" onClick={handleRemoveCredential}>
                        <LogOut size={12} />
                        <span>Remove Stored Credential</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {authStatus === 'expired' && (
                      <div
                        style={{
                          padding: '12px 14px',
                          backgroundColor: 'var(--warning-subtle)',
                          border: '1px solid var(--warning-text)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '14px',
                          fontSize: '12px',
                          color: 'var(--warning-text)',
                        }}
                      >
                        GitHub authentication failed. Your stored credential may have expired or been revoked. Please reconnect.
                      </div>
                    )}

                    <form onSubmit={handleConnectGitHub}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                        Enter a GitHub <strong>Personal Access Token (classic or fine-grained)</strong> with <code>repo</code> permissions.
                        GitDrop securely remembers your token so you never have to re-enter it on reload.
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
                            <span>{isLoading ? 'Connecting...' : 'Connect GitHub'}</span>
                          </button>
                        </div>
                      </div>

                      {reconnectMode && (
                        <button
                          type="button"
                          className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                          onClick={() => setReconnectMode(false)}
                        >
                          Cancel Reconnect
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: STORAGE */}
          {activeTab === 'storage' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>Storage & Data</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Inspect and manage persistent application metadata, project handles, and credentials.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 14px 0' }}>Storage Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Managed Projects</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '2px' }}>{projects.length}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Stored GitHub Credential</div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        marginTop: '2px',
                        color: isAuthenticated ? 'var(--success-text)' : 'var(--text-muted)',
                      }}
                    >
                      {isAuthenticated ? '✓ Present in Secure Store' : 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div
                style={{
                  border: '1px solid var(--danger-border, var(--danger-text))',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  backgroundColor: 'var(--danger-subtle)',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger-text)', margin: '0 0 8px 0' }}>
                  Danger Zone
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                  Actions here reset GitDrop registry state. Physical repository folders and local files are never deleted.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-gitdrop btn-gitdrop-danger btn-gitdrop-sm" onClick={handleClearProjectHistory}>
                    <Trash2 size={12} />
                    <span>Clear Project History</span>
                  </button>
                  <button className="btn-gitdrop btn-gitdrop-danger btn-gitdrop-sm" onClick={handleRemoveCredential}>
                    <LogOut size={12} />
                    <span>Remove Stored Credential</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
