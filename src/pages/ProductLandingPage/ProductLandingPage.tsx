import React, { useState } from 'react';
import { Link, useRouter } from '@/router/Router';
import {
  GitBranch,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  HardDrive,
  Globe,
  Monitor,
  Shield,
  ArrowRight,
  ExternalLink,
  Layers,
  FileCode2,
  Menu,
  X,
  Download,
} from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

export const ProductLandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ backgroundColor: '#090d13', color: '#e6edf3', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(9, 13, 19, 0.85)',
          borderBottom: '1px solid #21262d',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#f0f6fc' }}>
            <img src="/gitdrop-icon.svg" alt="GitDrop" style={{ width: '28px', height: '28px' }} />
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>GitDrop</span>
          </Link>

          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#features" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.15s' }}>
              Features
            </a>
            <a href="#workflow" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.15s' }}>
              Workflow
            </a>
            <a href="#comparison" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.15s' }}>
              Browser vs Desktop
            </a>
            <Link to="/download" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.15s' }}>
              Download
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a
            href="https://github.com/lucky4-git1/Gitdrop"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#8b949e',
              textDecoration: 'none',
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #30363d',
              backgroundColor: '#161b22',
              transition: 'border-color 0.15s',
            }}
          >
            <Github size={16} />
            <span className="desktop-only">GitHub</span>
          </a>

          <button
            onClick={() => navigate('/app')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#238636',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            <span>Open GitDrop</span>
            <ArrowRight size={15} />
          </button>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c9d1d9',
              cursor: 'pointer',
              display: 'none',
              padding: '4px',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#161b22',
            borderBottom: '1px solid #30363d',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '15px' }}
          >
            Features
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '15px' }}
          >
            Workflow
          </a>
          <a
            href="#comparison"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '15px' }}
          >
            Browser vs Desktop
          </a>
          <Link
            to="/download"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#c9d1d9', textDecoration: 'none', fontSize: '15px' }}
          >
            Desktop Download
          </Link>
          <Link
            to="/app"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              backgroundColor: '#238636',
              color: '#fff',
              textAlign: 'center',
              padding: '10px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Open in Browser
          </Link>
        </div>
      )}

      {/* HERO SECTION */}
      <section
        style={{
          padding: '72px 24px 48px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid #30363d',
            backgroundColor: '#161b22',
            fontSize: '12px',
            color: '#58a6ff',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#238636' }} />
          Local-first Visual Git Client
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            color: '#f0f6fc',
            margin: '0 0 20px',
          }}
        >
          Git, without the terminal.
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#8b949e',
            maxWidth: '680px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          A visual Git workspace for developers who want a cleaner, faster way to work with repositories,
          branches, commits, and GitHub. No terminal clutter. 100% private.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '48px',
          }}
        >
          <button
            onClick={() => navigate('/app')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#238636',
              color: '#ffffff',
              padding: '12px 26px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(35, 134, 54, 0.4)',
              transition: 'transform 0.15s, background-color 0.15s',
            }}
          >
            <span>Open in Browser</span>
            <ArrowRight size={18} />
          </button>

          <Link
            to="/download"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              padding: '12px 22px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              border: '1px solid #30363d',
              textDecoration: 'none',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            <Download size={18} />
            <span>Download Desktop</span>
          </Link>
        </div>

        {/* REAL PRODUCT UI PREVIEW */}
        <div
          style={{
            maxWidth: '1060px',
            margin: '0 auto',
            borderRadius: '12px',
            border: '1px solid #30363d',
            backgroundColor: '#0d1117',
            overflow: 'hidden',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px #21262d',
            textAlign: 'left',
          }}
        >
          {/* Mock Window Titlebar */}
          <div
            style={{
              backgroundColor: '#161b22',
              borderBottom: '1px solid #21262d',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#8b949e',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
              <span style={{ marginLeft: '12px', color: '#c9d1d9', fontWeight: 600 }}>GitDrop — Visual Git Workspace</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#58a6ff' }}>
                <GitBranch size={12} /> main
              </span>
              <span style={{ color: '#3fb950' }}>Clean</span>
            </div>
          </div>

          {/* Product UI Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '380px' }} className="product-preview-grid">
            {/* Left Sidebar */}
            <div style={{ backgroundColor: '#13171f', borderRight: '1px solid #21262d', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6e7681', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Repository
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', backgroundColor: '#1f242c', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#f0f6fc' }}>
                  <FolderGit2 size={15} color="#58a6ff" />
                  <span>gitdrop-source</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6e7681', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Branches
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: '#238636', borderRadius: '4px', fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GitBranch size={13} /> main
                    </span>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '4px' }}>HEAD</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', fontSize: '12px', color: '#8b949e' }}>
                    <GitBranch size={13} /> feature/offline-sync
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', fontSize: '12px', color: '#8b949e' }}>
                    <GitBranch size={13} /> release/v1.0.0
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6e7681', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Changes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', color: '#3fb950', backgroundColor: 'rgba(63, 185, 80, 0.08)', borderRadius: '4px' }}>
                    <span>src/App.tsx</span>
                    <span style={{ fontWeight: 600 }}>M</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', color: '#3fb950', backgroundColor: 'rgba(63, 185, 80, 0.08)', borderRadius: '4px' }}>
                    <span>package.json</span>
                    <span style={{ fontWeight: 600 }}>M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Panel */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', backgroundColor: '#0d1117' }}>
              {/* DAG Commit Graph Preview */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GitCommit size={15} color="#58a6ff" /> Commit History Graph
                  </span>
                  <span style={{ fontSize: '11px', color: '#8b949e' }}>3 commits ahead of origin</span>
                </div>

                <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#58a6ff' }} />
                      <span style={{ fontFamily: 'monospace', color: '#79c0ff' }}>fadd48a</span>
                      <span style={{ color: '#f0f6fc', fontWeight: 500 }}>feat: add persistent safeStorage authentication</span>
                    </div>
                    <span style={{ color: '#8b949e', fontSize: '11px' }}>just now</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3fb950' }} />
                      <span style={{ fontFamily: 'monospace', color: '#79c0ff' }}>c218015</span>
                      <span style={{ color: '#c9d1d9' }}>merge branch 'feature/desktop-ipc' into main</span>
                    </div>
                    <span style={{ color: '#8b949e', fontSize: '11px' }}>2 hrs ago</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d29922' }} />
                      <span style={{ fontFamily: 'monospace', color: '#79c0ff' }}>91cc1d7</span>
                      <span style={{ color: '#8b949e' }}>refactor: isolate Git service from landing page root</span>
                    </div>
                    <span style={{ color: '#8b949e', fontSize: '11px' }}>yesterday</span>
                  </div>
                </div>
              </div>

              {/* Monaco Diff Viewer Mock */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '8px' }}>
                  Diff — src/App.tsx
                </div>
                <div style={{ backgroundColor: '#090d13', border: '1px solid #21262d', borderRadius: '6px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6 }}>
                  <div style={{ color: '#f85149', backgroundColor: 'rgba(248, 81, 73, 0.15)', padding: '1px 6px', margin: '0 -14px' }}>
                    - &lt;Route path="/" element=&#123;&lt;AppShell /&gt;&#125; /&gt;
                  </div>
                  <div style={{ color: '#3fb950', backgroundColor: 'rgba(63, 185, 80, 0.15)', padding: '1px 6px', margin: '0 -14px' }}>
                    + &lt;Route path="/" element=&#123;&lt;ProductLandingPage /&gt;&#125; /&gt;
                  </div>
                  <div style={{ color: '#3fb950', backgroundColor: 'rgba(63, 185, 80, 0.15)', padding: '1px 6px', margin: '0 -14px' }}>
                    + &lt;Route path="/app" element=&#123;&lt;BrowserApp /&gt;&#125; /&gt;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 Simple Steps) */}
      <section id="workflow" style={{ padding: '64px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 12px' }}>
            How GitDrop Works
          </h2>
          <p style={{ color: '#8b949e', fontSize: '16px', margin: 0 }}>
            Three straightforward steps from your folder to GitHub.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#238636', marginBottom: '14px', fontFamily: 'monospace' }}>01</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 10px' }}>Open a Repository</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Drop any local directory into GitDrop or click Open Folder. Works directly with your local files without transferring code to any server.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#58a6ff', marginBottom: '14px', fontFamily: 'monospace' }}>02</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 10px' }}>Work Visually</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Review file changes with side-by-side Monaco diffs, stage files individually or in bulk, switch branches, and resolve conflicts visually.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#d29922', marginBottom: '14px', fontFamily: 'monospace' }}>03</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 10px' }}>Commit and Push</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Write clear commit messages, create tags, publish new repositories, and push cleanly to GitHub with safe authentication tokens.
            </p>
          </div>
        </div>
      </section>

      {/* BROWSER VS DESKTOP SECTION */}
      <section id="comparison" style={{ padding: '64px 24px', backgroundColor: '#0d1117', borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 12px' }}>
              Your Git workflow. Your choice.
            </h2>
            <p style={{ color: '#8b949e', fontSize: '16px', margin: 0 }}>
              Choose between the instant browser client and the native desktop powerhouse.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {/* Browser Card */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={24} color="#58a6ff" />
                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>Browser</h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#3fb950', backgroundColor: 'rgba(63,185,80,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                    Instant Access
                  </span>
                </div>

                <p style={{ color: '#8b949e', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                  No installation required. Opens directly in Chromium browsers using standard File System Access APIs.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#3fb950" /> Zero installation or setup
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#3fb950" /> 100% private in-memory execution
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#3fb950" /> GitHub Personal Access Token sync
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#3fb950" /> Full visual staging, diffs & commits
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/app')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#238636',
                  color: '#fff',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Open in Browser</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Desktop Card */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Monitor size={24} color="#79c0ff" />
                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>Desktop</h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                    Native Performance
                  </span>
                </div>

                <p style={{ color: '#8b949e', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Dedicated native client for Windows, macOS, and Linux powered by your system's native Git binary.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#58a6ff" /> Native Git binary execution
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#58a6ff" /> Unlimited repository scale (zero browser limits)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#58a6ff" /> OS safeStorage token encryption (DPAPI / Keychain)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                    <CheckCircle2 size={16} color="#58a6ff" /> Native OS shortcuts & folder drag-and-drop
                  </div>
                </div>
              </div>

              <Link
                to="/download"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#21262d',
                  color: '#f0f6fc',
                  border: '1px solid #30363d',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxSizing: 'border-box',
                }}
              >
                <Download size={16} />
                <span>Get Desktop Edition</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" style={{ padding: '72px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 12px' }}>
            Built for everyday developer workflows
          </h2>
          <p style={{ color: '#8b949e', fontSize: '16px', margin: 0 }}>
            Every feature verified against real Git repositories.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '24px' }}>
            <FileCode2 size={24} color="#58a6ff" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 8px' }}>Visual Staging & Diffs</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Stage files individually or in bulk. Review inline and split diffs with syntax highlighting powered by Monaco Editor.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '24px' }}>
            <Layers size={24} color="#79c0ff" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 8px' }}>DAG Commit Graph</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Visual commit topology with branching curves, merge parent references, author timestamps, and revert/reset capabilities.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '24px' }}>
            <GitPullRequest size={24} color="#3fb950" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 8px' }}>3-Way Conflict Resolver</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Resolve merge conflicts visually. Choose Current, Incoming, or Both with single-click staging upon resolution.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '24px' }}>
            <GitBranch size={24} color="#d29922" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 8px' }}>Branch & Stash Management</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Create, checkout, rename, merge, and delete branches. Stash work-in-progress state and restore it cleanly later.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '24px' }}>
            <HardDrive size={24} color="#f0883e" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 8px' }}>100% Local-First Privacy</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Your repositories live locally on your drive. Source code is never sent to third-party clouds or AI models.
            </p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '24px' }}>
            <Shield size={24} color="#a371f7" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f6fc', margin: '0 0 8px' }}>GitHub Integration</h3>
            <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Connect with Personal Access Tokens. Publish brand-new repositories, fetch remote branches, and push with one click.
            </p>
          </div>
        </div>
      </section>

      {/* WHY GITDROP (Positioning Statement) */}
      <section style={{ padding: '64px 24px', backgroundColor: '#0d1117', borderTop: '1px solid #21262d' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 16px' }}>
            Git is powerful. Git interfaces don't have to be complicated.
          </h2>
          <p style={{ color: '#8b949e', fontSize: '16px', lineHeight: 1.7, margin: '0 0 32px' }}>
            GitDrop gives you an elegant, visual workspace for everyday Git operations while keeping your repositories
            local. Whether you are staging specific lines, inspecting commit branches, or resolving conflicts, GitDrop keeps you in control.
          </p>
          <button
            onClick={() => navigate('/app')}
            style={{
              backgroundColor: '#238636',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Launch GitDrop in Browser</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid #21262d',
          padding: '40px 24px',
          backgroundColor: '#090d13',
          fontSize: '13px',
          color: '#8b949e',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/gitdrop-icon.svg" alt="GitDrop" style={{ width: '20px', height: '20px' }} />
            <span style={{ fontWeight: 600, color: '#c9d1d9' }}>GitDrop</span>
            <span>— Visual Git Workspace for Developers.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/app" style={{ color: '#8b949e', textDecoration: 'none' }}>
              Open App
            </Link>
            <Link to="/download" style={{ color: '#8b949e', textDecoration: 'none' }}>
              Desktop
            </Link>
            <a
              href="https://github.com/lucky4-git1/Gitdrop"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#8b949e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              GitHub <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div style={{ maxWidth: '1100px', margin: '20px auto 0', textAlign: 'center', fontSize: '12px', color: '#484f58' }}>
          &copy; {new Date().getFullYear()} GitDrop. Open-source visual Git client.
        </div>
      </footer>
    </div>
  );
};

export default ProductLandingPage;
