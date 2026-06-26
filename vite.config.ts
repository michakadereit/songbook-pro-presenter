import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Inject a working localStorage mock before every test file runs.
    // Required because Node.js 22+ defines localStorage as undefined
    // (experimental, needs --localstorage-file) and jsdom 29+ requires a
    // non-opaque origin before exposing window.localStorage.
    setupFiles: ['./src/test-setup.ts'],
  },
});
