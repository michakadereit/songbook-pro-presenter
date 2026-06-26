import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFullscreen } from './fullscreen';

// ---------------------------------------------------------------------------
// AC5 — toggleFullscreen calls requestFullscreen / exitFullscreen correctly
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset fullscreenElement to null before each test.
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => null,
  });
});

describe('toggleFullscreen — no active fullscreen element', () => {
  it('calls el.requestFullscreen() when fullscreenElement is null', () => {
    const el = document.createElement('div');
    const spy = vi.fn().mockResolvedValue(undefined);
    el.requestFullscreen = spy;

    toggleFullscreen(el);

    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('toggleFullscreen — active fullscreen element', () => {
  it('calls document.exitFullscreen() when fullscreenElement is set', () => {
    const el = document.createElement('div');

    // Simulate an active fullscreen element.
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => el,
    });

    const exitSpy = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = exitSpy;

    toggleFullscreen(el);

    expect(exitSpy).toHaveBeenCalledOnce();
  });

  it('does NOT call el.requestFullscreen() when fullscreenElement is set', () => {
    const el = document.createElement('div');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => el,
    });

    const requestSpy = vi.fn().mockResolvedValue(undefined);
    el.requestFullscreen = requestSpy;
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

    toggleFullscreen(el);

    expect(requestSpy).not.toHaveBeenCalled();
  });
});
