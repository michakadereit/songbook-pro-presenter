import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountSlideView } from './SlideView';
import type { Song, SongSet } from '../types';

// ---------------------------------------------------------------------------
// Fixture: 3 songs, each with one section and one chorded line.
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
// AC1 — Eine Slide, Titel oben
// ---------------------------------------------------------------------------

describe('mountSlideView — AC1: one song visible, first song title on top', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, set);
  });

  afterEach(() => {
    dispose();
  });

  it('renders exactly one .song element in root', () => {
    expect(root.querySelectorAll('.song')).toHaveLength(1);
  });

  it('renders a .slide-view wrapper', () => {
    expect(root.querySelectorAll('.slide-view')).toHaveLength(1);
  });

  it('shows the first song title', () => {
    const title = root.querySelector('.song__title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe('First Song');
  });

  it('does NOT show all songs simultaneously', () => {
    const titles = [...root.querySelectorAll('.song__title')].map((el) => el.textContent);
    expect(titles).not.toContain('Second Song');
    expect(titles).not.toContain('Third Song');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Vorwärts-Navigation
// ---------------------------------------------------------------------------

describe('mountSlideView — AC2: forward navigation with ArrowRight and Space', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, set);
  });

  afterEach(() => {
    dispose();
  });

  it('ArrowRight shows the second song and removes the first', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('Second Song');
    expect(root.querySelectorAll('.song')).toHaveLength(1);
  });

  it('Space shows the second song like ArrowRight', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('Second Song');
  });

  it('ArrowLeft after ArrowRight goes back to first song', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('First Song');
  });
});

// ---------------------------------------------------------------------------
// AC3 — Klemmen an den Enden
// ---------------------------------------------------------------------------

describe('mountSlideView — AC3: clamping at both ends', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, set);
  });

  afterEach(() => {
    dispose();
  });

  it('ArrowLeft at index 0 stays on first song', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('First Song');
  });

  it('ArrowRight at last song stays on last song', () => {
    // Navigate to last song (3 songs, need 2 presses)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('Third Song');
  });

  it('Home navigates to first song', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('First Song');
  });

  it('End navigates to last song', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('Third Song');
  });
});

// ---------------------------------------------------------------------------
// AC4 — Positionsanzeige
// ---------------------------------------------------------------------------

describe('mountSlideView — AC4: position indicator shows n / total', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, set);
  });

  afterEach(() => {
    dispose();
  });

  it('shows "1 / 3" initially', () => {
    const pos = root.querySelector('.slide-position');
    expect(pos).not.toBeNull();
    expect(pos!.textContent).toBe('1 / 3');
  });

  it('shows "2 / 3" after ArrowRight', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const pos = root.querySelector('.slide-position');
    expect(pos!.textContent).toBe('2 / 3');
  });

  it('shows "3 / 3" after End', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    const pos = root.querySelector('.slide-position');
    expect(pos!.textContent).toBe('3 / 3');
  });
});

// ---------------------------------------------------------------------------
// AC5 — Voller Song gerendert
// ---------------------------------------------------------------------------

describe('mountSlideView — AC5: rendered slide contains chords and lyrics, no raw markup', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, set);
  });

  afterEach(() => {
    dispose();
  });

  it('slide contains .seg__chord elements', () => {
    const chords = root.querySelectorAll('.seg__chord');
    // Filter non-empty chords
    const nonEmpty = [...chords].filter((el) => el.textContent !== '');
    expect(nonEmpty.length).toBeGreaterThan(0);
  });

  it('slide contains lyric text', () => {
    const lyrics = [...root.querySelectorAll('.seg__lyric')].map((el) => el.textContent).join('');
    expect(lyrics.trim()).not.toBe('');
  });

  it('textContent contains no raw chord brackets [ or ]', () => {
    expect(root.textContent).not.toContain('[');
    expect(root.textContent).not.toContain(']');
  });

  it('textContent contains no ChordPro section directive {c:', () => {
    expect(root.textContent).not.toContain('{c:');
  });
});

// ---------------------------------------------------------------------------
// Dispose — keyboard listener is removed after dispose()
// ---------------------------------------------------------------------------

describe('mountSlideView — dispose removes keyboard listener', () => {
  it('after dispose(), ArrowRight no longer changes the slide', () => {
    const root = document.createElement('div');
    const dispose = mountSlideView(root, set);

    // Navigate to second song
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Second Song');

    // Dispose — listener removed
    dispose();

    // ArrowRight should NOT change slide any more (a new instance isn't mounted)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    // root is stale but the title in the DOM (last render) stays Second Song
    // because no handler updates it
    expect(root.querySelector('.song__title')!.textContent).toBe('Second Song');
  });
});

// ---------------------------------------------------------------------------
// AC6 — Schriftgrößen-Regler (font size slider)
// ---------------------------------------------------------------------------

describe('mountSlideView — AC6: font size slider', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, set);
  });

  afterEach(() => {
    dispose();
  });

  it('renders a range slider inside .slide-controls', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]');
    expect(slider).not.toBeNull();
  });

  it('slider has attributes min=60, max=200, step=10, value=100', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]') as HTMLInputElement;
    expect(slider.min).toBe('60');
    expect(slider.max).toBe('200');
    expect(slider.step).toBe('10');
    expect(slider.value).toBe('100');
  });

  it('shows default scale display "100 %"', () => {
    const display = root.querySelector('.slide-font-scale-value');
    expect(display).not.toBeNull();
    expect(display!.textContent).toBe('100 %');
  });

  it('setting slider to 150 and dispatching input sets --slide-font-scale to "1.5" on .slide-view', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]') as HTMLInputElement;
    slider.value = '150';
    slider.dispatchEvent(new Event('input'));
    const wrapper = root.querySelector('.slide-view') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--slide-font-scale')).toBe('1.5');
  });

  it('display updates to "150 %" after slider change', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]') as HTMLInputElement;
    slider.value = '150';
    slider.dispatchEvent(new Event('input'));
    const display = root.querySelector('.slide-font-scale-value');
    expect(display!.textContent).toBe('150 %');
  });

  it('font scale persists on .slide-view after ArrowRight navigation', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]') as HTMLInputElement;
    slider.value = '150';
    slider.dispatchEvent(new Event('input'));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const wrapper = root.querySelector('.slide-view') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--slide-font-scale')).toBe('1.5');
  });
});
