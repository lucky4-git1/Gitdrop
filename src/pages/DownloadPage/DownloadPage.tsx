import React from 'react';
import { Link, useRouter } from '@/router/Router';
import {
  Download,
  Monitor,
  Apple,
  Terminal,
  ArrowRight,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { Github } from '@/components/Icons/GithubIcon';

export const DownloadPage: React.FC = () => {
  const { navigate } = useRouter();
  const releasesUrl = 'https://github.com/lucky4-git1/Gitdrop/releases';

  return (
    <div style={{ backgroundColor: '#090d13', color: '#e6edf3', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#f0f6fc' }}>
            <img src="/gitdrop-icon.svg" alt="GitDrop" style={{ width: '28px', height: '28px' }} />
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>GitDrop</span>
          </Link>
          <span style={{ color: '#6e7681', fontSize: '14px' }}>/ Desktop</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/app"
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
            }}
          >
            <Globe size={15} />
            <span>Open Browser Edition</span>
          </Link>

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
            }}
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '60px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid #30363d',
              backgroundColor: '#161b22',
              fontSize: '12px',
              color: '#58a6ff',
              fontWeight: 600,
              marginBottom: '18px',
            }}
          >
            <Monitor size={14} /> Desktop Releases
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#f0f6fc', margin: '0 0 16px', letterSpacing: '-1px' }}>
            Download GitDrop Desktop
          </h1>

          <p style={{ color: '#8b949e', fontSize: '17px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Native filesystem access, zero-sandbox limits, and offline-first performance.
            Choose your operating system below to download from GitHub Releases.
          </p>
        </div>

        {/* Platform Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {/* Windows */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Monitor size={26} color="#58a6ff" />
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>Windows</h3>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#3fb950', backgroundColor: 'rgba(63,185,80,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Available
                </span>
              </div>

              <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                Windows 10 and 11 (64-bit). Includes auto-updater and DPAPI credential protection.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', fontSize: '13px', color: '#c9d1d9' }}>
                <div>• Setup Installer (<code>.exe</code>)</div>
                <div>• Standalone Portable (<code>.exe</code>)</div>
              </div>
            </div>

            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#238636',
                color: '#ffffff',
                padding: '11px 18px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Download size={16} />
              <span>Download for Windows</span>
            </a>
          </div>

          {/* macOS */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Apple size={26} color="#c9d1d9" />
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>macOS</h3>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#d29922', backgroundColor: 'rgba(210,153,34,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Universal
                </span>
              </div>

              <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                macOS 11 (Big Sur) and later. Apple Silicon (M1/M2/M3) and Intel 64-bit support.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', fontSize: '13px', color: '#c9d1d9' }}>
                <div>• Apple Disk Image (<code>.dmg</code>)</div>
                <div>• Compressed Archive (<code>.zip</code>)</div>
              </div>
            </div>

            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#21262d',
                color: '#f0f6fc',
                border: '1px solid #30363d',
                padding: '11px 18px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Download size={16} />
              <span>Download for macOS</span>
            </a>
          </div>

          {/* Linux */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Terminal size={26} color="#79c0ff" />
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>Linux</h3>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  x86_64
                </span>
              </div>

              <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                Compatible with Ubuntu, Debian, Fedora, Arch, and all major distributions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', fontSize: '13px', color: '#c9d1d9' }}>
                <div>• Standalone (<code>.AppImage</code>)</div>
                <div>• Debian / Ubuntu Package (<code>.deb</code>)</div>
              </div>
            </div>

            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#21262d',
                color: '#f0f6fc',
                border: '1px solid #30363d',
                padding: '11px 18px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Download size={16} />
              <span>Download for Linux</span>
            </a>
          </div>
        </div>

        {/* Browser Fallback Box */}
        <div
          style={{
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '12px',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 6px' }}>
              Prefer to use GitDrop without installing anything?
            </h4>
            <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
              The browser edition runs directly in Chrome, Edge, and Brave with standard File System Access.
            </p>
          </div>

          <button
            onClick={() => navigate('/app')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#238636',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>Launch Web App</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #21262d',
          padding: '28px 24px',
          backgroundColor: '#090d13',
          fontSize: '13px',
          color: '#8b949e',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>&copy; {new Date().getFullYear()} GitDrop. Binaries published on GitHub Releases.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" style={{ color: '#8b949e', textDecoration: 'none' }}>Home</Link>
            <Link to="/app" style={{ color: '#8b949e', textDecoration: 'none' }}>Browser Edition</Link>
            <a href={releasesUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              All Releases <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DownloadPage;
