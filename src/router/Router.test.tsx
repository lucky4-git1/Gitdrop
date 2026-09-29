import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Router, useRouter, Link } from './Router';

const TestComponent = () => {
  const { currentPath, navigate } = useRouter();
  return (
    <div>
      <div data-testid="path">{currentPath}</div>
      <button onClick={() => navigate('/app')}>Go to App</button>
      <Link to="/download">Download Link</Link>
    </div>
  );
};

describe('HTML5 History Router', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.scrollTo = vi.fn();
  });

  it('provides current initial path', () => {
    render(
      <Router>
        <TestComponent />
      </Router>
    );

    expect(screen.getByTestId('path').textContent).toBe('/');
  });

  it('updates path when navigate is called', () => {
    render(
      <Router>
        <TestComponent />
      </Router>
    );

    act(() => {
      screen.getByText('Go to App').click();
    });

    expect(screen.getByTestId('path').textContent).toBe('/app');
    expect(window.location.pathname).toBe('/app');
  });

  it('navigates when Link is clicked without full page reload', () => {
    render(
      <Router>
        <TestComponent />
      </Router>
    );

    act(() => {
      fireEvent.click(screen.getByText('Download Link'));
    });

    expect(screen.getByTestId('path').textContent).toBe('/download');
    expect(window.location.pathname).toBe('/download');
  });
});
