export type Theme = 'auto' | 'light' | 'dark';

const THEME_KEY = 'theme';

const CYCLE: Theme[] = ['auto', 'light', 'dark'];

/** Returns the next theme in the cycle: auto → light → dark → auto. */
export function nextTheme(current: Theme): Theme {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

/**
 * Applies the given theme to the document root and persists it in localStorage.
 * Sets `document.documentElement.style.colorScheme` so that CSS `light-dark()`
 * tokens respond immediately without a page reload.
 */
export function applyTheme(theme: Theme): void {
  const colorScheme = theme === 'auto' ? 'light dark' : theme;
  document.documentElement.style.colorScheme = colorScheme;
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
