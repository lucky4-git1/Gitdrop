import React, { Suspense } from 'react';
import { Router, useRouter } from './router/Router';
import { ProductLandingPage } from './pages/ProductLandingPage/ProductLandingPage';
import { DownloadPage } from './pages/DownloadPage/DownloadPage';

// Lazy-load the full GitDrop browser workspace and providers so the landing page stays ultra-fast
const LazyBrowserApp = React.lazy(() => import('./BrowserApp'));

const LoadingFallback: React.FC = () => (
  <div
    style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8b949e',
      gap: '16px',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <img src="/gitdrop-icon.svg" alt="GitDrop" style={{ width: '40px', height: '40px', animation: 'spin 2s linear infinite' }} />
    <div style={{ fontSize: '14px', fontWeight: 500, color: '#c9d1d9' }}>Loading GitDrop Workspace...</div>
  </div>
);

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();

  if (currentPath === '/app' || currentPath.startsWith('/app/')) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyBrowserApp />
      </Suspense>
    );
  }

  if (currentPath === '/download' || currentPath.startsWith('/download/')) {
    return <DownloadPage />;
  }

  // Root route "/" or fallback
  return <ProductLandingPage />;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
