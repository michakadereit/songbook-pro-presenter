import { describe, it, expect, beforeEach } from 'vitest';
import { nextTheme, applyTheme, loadTheme } from './theme';
import type { Theme } from './theme';

beforeEach(() => {
  // Reset localStorage and colorScheme before each test.
  // Use window.localStorage explicitly — in Node.js 22, `globalThis.localStorage`
  // may be undefined (experimental feature); jsdom exposes it on `window`.
  window.localStorage.clear();
  document.documentElement.style.colorScheme = '';
});

// ---------------------------------------------------------------------------
// AC3 — nextTheme cycles correctly
// ---------------------------------------------------------------------------
describe('nextTheme', () => {
  it('auto → light', () => {
    expect(nextTheme('auto')).toBe('light');
  });

  it('light → dark', () => {
    expect(nextTheme('light')).toBe('dark');
  });

  it('dark → auto', () => {
    expect(nextTheme('dark')).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// AC3 — applyTheme sets documentElement.style.colorScheme
// ---------------------------------------------------------------------------
describe('applyTheme — colorScheme', () => {
  it('applyTheme("dark") sets colorScheme to "dark"', () => {
    applyTheme('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('applyTheme("light") sets colorScheme to "light"', () => {
    applyTheme('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('applyTheme("auto") sets colorScheme to "light dark"', () => {
    applyTheme('auto');
    expect(document.documentElement.style.colorScheme).toBe('light dark');
  });
});

// ---------------------------------------------------------------------------
// AC4 — applyTheme persists in localStorage; loadTheme reads it back
// ---------------------------------------------------------------------------
describe('applyTheme — persistence', () => {
  it('stores "dark" in localStorage', () => {
    applyTheme('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('stores "light" in localStorage', () => {
    applyTheme('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('stores "auto" in localStorage', () => {
    applyTheme('auto');
    expect(window.localStorage.getItem('theme')).toBe('auto');
  });
});

describe('loadTheme', () => {
  it('returns "auto" when localStorage is empty', () => {
    expect(loadTheme()).toBe('auto');
  });

  it('returns stored "dark" value', () => {
    window.localStorage.setItem('theme', 'dark');
    expect(loadTheme()).toBe('dark');
  });

  it('returns stored "light" value', () => {
    window.localStorage.setItem('theme', 'light');
    expect(loadTheme()).toBe('light');
  });

  it('returns stored "auto" value', () => {
    window.localStorage.setItem('theme', 'auto');
    expect(loadTheme()).toBe('auto');
  });

  it('returns "auto" when stored value is invalid', () => {
    window.localStorage.setItem('theme', 'invalid-value');
    expect(loadTheme()).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// AC4 — round-trip: set via applyTheme, read back via loadTheme + applyTheme
// ---------------------------------------------------------------------------
describe('theme round-trip', () => {
  it('applyTheme("dark") → loadTheme() returns "dark" → applyTheme sets colorScheme', () => {
    applyTheme('dark');
    const stored: Theme = loadTheme();
    expect(stored).toBe('dark');
    // Simulate a reload: clear colorScheme, then re-apply the loaded theme.
    document.documentElement.style.colorScheme = '';
    applyTheme(stored);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
