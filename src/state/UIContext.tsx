import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ActiveView =
  | 'workspace'
  | 'changes'
  | 'branches'
  | 'commits'
  | 'conflicts'
  | 'remotes'
  | 'tags'
  | 'files'
  | 'settings';

export type AppTheme = 'dark' | 'light' | 'system';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  isDanger?: boolean;
  confirmText?: string;
  onConfirm: () => void;
}

export interface ErrorModalState {
  isOpen: boolean;
  title: string;
  whatHappened: string;
  whyItHappened: string;
  recommendedAction: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface UIContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  isConsoleOpen: boolean;
  setConsoleOpen: (open: boolean) => void;
  selectedDiffFile: string | null;
  setSelectedDiffFile: (path: string | null) => void;
  diffMode: 'side-by-side' | 'inline';
  setDiffMode: (mode: 'side-by-side' | 'inline') => void;
  confirmModal: ConfirmModalState | null;
  requestConfirm: (options: Omit<ConfirmModalState, 'isOpen'>) => void;
  closeConfirm: () => void;
  errorModal: ErrorModalState | null;
  showError: (
    title: string,
    whatHappened: string,
    whyItHappened: string,
    recommendedAction: string,
    actionLabel?: string,
    onAction?: () => void
  ) => void;
  closeError: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('workspace');
  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('gitdrop_theme') as AppTheme) || 'dark';
  });

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [isConsoleOpen, setConsoleOpen] = useState(false);
  const [selectedDiffFile, setSelectedDiffFile] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side');

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);

  // Apply theme to document element
  useEffect(() => {
    localStorage.setItem('gitdrop_theme', theme);
    const resolvedTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const requestConfirm = useCallback((options: Omit<ConfirmModalState, 'isOpen'>) => {
    setConfirmModal({ ...options, isOpen: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal(null);
  }, []);

  const showError = useCallback(
    (
      title: string,
      whatHappened: string,
      whyItHappened: string,
      recommendedAction: string,
      actionLabel?: string,
      onAction?: () => void
    ) => {
      setErrorModal({
        isOpen: true,
        title,
        whatHappened,
        whyItHappened,
        recommendedAction,
        actionLabel,
        onAction,
      });
    },
    []
  );

  const closeError = useCallback(() => {
    setErrorModal(null);
  }, []);

  return (
    <UIContext.Provider
      value={{
        activeView,
        setActiveView,
        theme,
        setTheme,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isGlobalSearchOpen,
        setGlobalSearchOpen,
        isConsoleOpen,
        setConsoleOpen,
        selectedDiffFile,
        setSelectedDiffFile,
        diffMode,
        setDiffMode,
        confirmModal,
        requestConfirm,
        closeConfirm,
        errorModal,
        showError,
        closeError,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
