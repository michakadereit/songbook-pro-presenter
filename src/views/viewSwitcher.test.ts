import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountViewSwitcher } from './viewSwitcher';
import type { Song, SongSet } from '../types';

// ---------------------------------------------------------------------------
// Fixture: 3 songs with chords and lyrics
// ---------------------------------------------------------------------------

function makeSong(id: number, name: string): Song {
  return {
    id,
    name,
    author: `Author ${id}`,
    keyShift: 0,
    sections: [
      {
        title: 'Chorus',
        lines: [
          {
            lyrics: 'Amazing grace',
            chords: [
              { symbol: 'G', position: 0 },
              { symbol: 'D', position: 8 },
            ],
          },
        ],
      },
    ],
  };
}

const set: SongSet = {
  id: 1,
  name: 'Test Set',
  date: '2026-06-25T00:00:00.000',
  songs: [
    makeSong(1, 'First Song'),
    makeSong(2, 'Second Song'),
    makeSong(3, 'Third Song'),
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clickTab(root: HTMLElement, view: 'slide' | 'eagle'): void {
  const btn = root.querySelector<HTMLElement>(`[data-view="${view}"]`);
  if (!btn) throw new Error(`Tab [data-view="${view}"] not found`);
  btn.click();
}

// ---------------------------------------------------------------------------
// AC6 — View-Umschalter wechselt ohne Reload
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — AC6: initial slide view', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
  });

  it('renders a [data-view="slide"] tab button', () => {
    expect(root.querySelector('[data-view="slide"]')).not.toBeNull();
  });

  it('renders a [data-view="eagle"] tab button', () => {
    expect(root.querySelector('[data-view="eagle"]')).not.toBeNull();
  });

  it('shows .slide-view initially', () => {
    expect(root.querySelector('.slide-view')).not.toBeNull();
  });

  it('does NOT show .eagle-grid initially', () => {
    expect(root.querySelector('.eagle-grid')).toBeNull();
  });
});

describe('mountViewSwitcher — AC6: switching to Eagle', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
  });

  it('clicking Eagle tab shows .eagle-grid', () => {
    clickTab(root, 'eagle');
    expect(root.querySelector('.eagle-grid')).not.toBeNull();
  });

  it('clicking Eagle tab removes .slide-view', () => {
    clickTab(root, 'eagle');
    expect(root.querySelector('.slide-view')).toBeNull();
  });

  it('clicking Slide tab after Eagle restores .slide-view', () => {
    clickTab(root, 'eagle');
    clickTab(root, 'slide');
    expect(root.querySelector('.slide-view')).not.toBeNull();
  });

  it('clicking Slide tab after Eagle removes .eagle-grid', () => {
    clickTab(root, 'eagle');
    clickTab(root, 'slide');
    expect(root.querySelector('.eagle-grid')).toBeNull();
  });
});

describe('mountViewSwitcher — AC6: initial eagle view', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, set, 'eagle');
  });

  afterEach(() => {
    switcher.dispose();
  });

  it('shows .eagle-grid when initial mode is eagle', () => {
    expect(root.querySelector('.eagle-grid')).not.toBeNull();
  });

  it('does NOT show .slide-view when initial mode is eagle', () => {
    expect(root.querySelector('.slide-view')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC7 — Sauberes Aufräumen: Slide keyboard listener removed after switch
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — AC7: slide keyboard listener removed after switching to eagle', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
  });

  it('ArrowRight does NOT affect eagle view after slide→eagle switch', () => {
    // Verify we start in slide mode
    expect(root.querySelector('.slide-view')).not.toBeNull();

    // Switch to eagle
    clickTab(root, 'eagle');
    expect(root.querySelector('.eagle-grid')).not.toBeNull();

    // Fire ArrowRight — the slide listener must be gone
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    // Eagle grid must still be present (slide navigation didn't hijack the view)
    expect(root.querySelector('.eagle-grid')).not.toBeNull();
    // Slide view must NOT have appeared
    expect(root.querySelector('.slide-view')).toBeNull();
  });

  it('dispose() cleans up everything without throwing', () => {
    clickTab(root, 'eagle');
    expect(() => switcher.dispose()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// dispose — outer switcher cleanup
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — dispose: outer cleanup', () => {
  it('dispose() on slide mode removes slide keyboard listener', () => {
    const root = document.createElement('div');
    const switcher = mountViewSwitcher(root, set, 'slide');

    // Navigate to second song to confirm listener is active
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.slide-title')!.textContent).toBe('Second Song');

    // Dispose outer switcher — clears container and removes listener
    switcher.dispose();

    // Container is now empty (view was torn down)
    expect(root.querySelector('.slide-view')).toBeNull();

    // ArrowRight after dispose must not throw and must not re-populate the container
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.slide-view')).toBeNull();
  });
});
