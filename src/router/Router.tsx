import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface RouterContextType {
  currentPath: string;
  navigate: (to: string) => void;
  hash: string;
}

const RouterContext = createContext<RouterContextType | null>(null);

function getNormalizedPath(): string {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname;
  if (!pathname || pathname === '') return '/';
  // Remove trailing slash unless it's just '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(getNormalizedPath());
  const [hash, setHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getNormalizedPath());
      setHash(window.location.hash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (typeof window === 'undefined') return;

    // Handle external links
    if (to.startsWith('http://') || to.startsWith('https://')) {
      window.open(to, '_blank', 'noopener,noreferrer');
      return;
    }

    // Handle hash on current page
    if (to.startsWith('#')) {
      window.history.pushState(null, '', to);
      setHash(to);
      const element = document.querySelector(to);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Parse target path and hash
    const [targetPath, targetHash] = to.split('#');
    const normalized = targetPath.length > 1 && targetPath.endsWith('/')
      ? targetPath.slice(0, -1)
      : targetPath || '/';

    window.history.pushState(null, '', to);
    setCurrentPath(normalized);
    setHash(targetHash ? `#${targetHash}` : '');

    if (targetHash) {
      setTimeout(() => {
        const el = document.querySelector(`#${targetHash}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo(0, 0);
        } catch {
          // ignore jsdom not implemented
        }
      }
    }
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate, hash }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a Router provider');
  }
  return ctx;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export const Link: React.FC<LinkProps> = ({ to, children, onClick, ...rest }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    // Don't intercept if user held Cmd/Ctrl/Shift or right-clicked
    if (
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.shiftKey
    ) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
