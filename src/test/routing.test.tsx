import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '@/App';

// Mock Monaco Editor for JSDOM
vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="monaco-editor-mock">Monaco Editor</div>,
  DiffEditor: () => <div data-testid="monaco-diff-editor-mock">Monaco Diff Editor</div>,
}));

describe('Web Routing and Product Surfaces', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.scrollTo = vi.fn();
  });

  it('renders ProductLandingPage on root path /', () => {
    render(<App />);

    expect(screen.getByText('Git, without the terminal.')).toBeInTheDocument();
    expect(screen.getAllByText('Open in Browser')[0]).toBeInTheDocument();
    expect(screen.getByText('Download Desktop')).toBeInTheDocument();
    expect(screen.getByText('How GitDrop Works')).toBeInTheDocument();
    expect(screen.getByText('Your Git workflow. Your choice.')).toBeInTheDocument();
  });

  it('renders DownloadPage on path /download', () => {
    window.history.pushState({}, '', '/download');
    render(<App />);

    expect(screen.getByText('Download GitDrop Desktop')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('macOS')).toBeInTheDocument();
    expect(screen.getByText('Linux')).toBeInTheDocument();
    expect(screen.getByText('Open Browser Edition')).toBeInTheDocument();
  });

  it('navigates from landing page to /app when Open in Browser is clicked', async () => {
    render(<App />);

    const openButtons = screen.getAllByText('Open in Browser');
    act(() => {
      fireEvent.click(openButtons[0]);
    });

    expect(window.location.pathname).toBe('/app');
    // Lazy-loaded workspace shows loading state then mounts
    expect(await screen.findByText(/Loading GitDrop Workspace|GitDrop|DROP YOUR PROJECT/i)).toBeInTheDocument();
  });
});
