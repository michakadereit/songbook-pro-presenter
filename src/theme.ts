export type Theme = 'auto' | 'light' | 'dark';

const THEME_KEY = 'theme';

const CYCLE: Theme[] = ['auto', 'light', 'dark'];

/** Returns the next theme in the cycle: auto → light → dark → auto. */
export function nextTheme(current: Theme): Theme {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

/**
 * Applies the given theme by setting (or removing) a `data-theme` attribute
 * on the document root. CSS picks up the attribute via attribute selectors and
 * media queries — no `light-dark()` or inline `colorScheme` needed, so the
 * approach works identically in dev and with static file serving.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  // Use window.localStorage explicitly to avoid Node.js experimental global
  // shadowing jsdom's implementation in the test environment.
  window.localStorage.setItem(THEME_KEY, theme);
}

/**
 * Reads the persisted theme from localStorage.
 * Returns 'auto' when nothing is stored or the stored value is invalid.
 */
export function loadTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto';
}
