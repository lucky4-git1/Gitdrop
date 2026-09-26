import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { Buffer } from 'buffer';

// Browser global polyfills for tests
(globalThis as any).Buffer = Buffer;

// Mock window.showDirectoryPicker if missing in jsdom
if (typeof window !== 'undefined' && !('showDirectoryPicker' in window)) {
  (window as any).showDirectoryPicker = vi.fn();
}
