/**
 * Vitest setup file — runs before each test file.
 *
 * Problem: Node.js 22+ defines `localStorage` as an experimental global but
 * marks it undefined (needs `--localstorage-file`). jsdom 29+ also requires
 * a non-opaque origin (a URL) before it will expose `window.localStorage`.
 * Together these mean `localStorage` / `window.localStorage` are both
 * undefined in the test environment.
 *
 * Fix: inject a simple in-memory Storage implementation onto `window` so
 * any module that uses `window.localStorage` gets a working object in tests.
 */

const _store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null;
  },
  setItem(key: string, value: string): void {
    _store[key] = String(value);
  },
  removeItem(key: string): void {
    delete _store[key];
  },
  clear(): void {
    Object.keys(_store).forEach((k) => delete _store[k]);
  },
  get length(): number {
    return Object.keys(_store).length;
  },
  key(index: number): string | null {
    return Object.keys(_store)[index] ?? null;
  },
};

// Patch localStorage onto the global window object that jsdom provides.
// `configurable: true` so individual tests can override it if needed.
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
