import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountSlideView } from './SlideView';
import type { Song, SongSet } from '../types';

// ---------------------------------------------------------------------------
// Search fixture — 4 songs with distinct and overlapping lyric words
// ---------------------------------------------------------------------------

function makeSongWithLyrics(id: number, name: string, lyrics: string): Song {
  return {
    id,
    name,
    author: `Author ${id}`,
    keyShift: 0,
    sections: [
      {
        title: 'Verse',
        lines: [{ lyrics, chords: [] }],
      },
    ],
  };
}

const searchSet: SongSet = {
  id: 2,
  name: 'Search Set',
  date: '2026-06-26T00:00:00.000',
  songs: [
    makeSongWithLyrics(10, 'Song Alpha', 'hallelujah praise'),
    makeSongWithLyrics(11, 'Song Beta', 'amazing grace'),
    makeSongWithLyrics(12, 'Song Gamma', 'glory forever'),
    makeSongWithLyrics(13, 'Song Delta', 'hallelujah glory'),
  ],
};

/** Set the search field value and fire the 'input' event. */
function setSearch(root: HTMLElement, value: string): void {
  const input = root.querySelector(
    '.slide-controls input[type="search"]',
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

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

// ---------------------------------------------------------------------------
// AC7 — Lyric search: filters songs, shows first match, updates position
// ---------------------------------------------------------------------------

describe('mountSlideView — AC7: lyric search filters to matching songs', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, searchSet);
  });

  afterEach(() => {
    dispose();
  });

  it('renders a search input inside .slide-controls', () => {
    const input = root.querySelector('.slide-controls input[type="search"]');
    expect(input).not.toBeNull();
  });

  it('searching "hallelujah" jumps to Song Alpha (first match)', () => {
    setSearch(root, 'hallelujah');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Alpha');
  });

  it('position shows "1 / 2" when 2 songs match "hallelujah"', () => {
    setSearch(root, 'hallelujah');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');
  });

  it('searching "glory" shows Song Gamma first; position "1 / 2"', () => {
    setSearch(root, 'glory');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Gamma');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');
  });

  it('searching "grace" shows only Song Beta; position "1 / 1"', () => {
    setSearch(root, 'grace');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 1');
  });

  it('search is case-insensitive: "HALLELUJAH" matches Song Alpha', () => {
    setSearch(root, 'HALLELUJAH');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Alpha');
  });
});

// ---------------------------------------------------------------------------
// AC8 — Navigation clamps within the filtered matches, not the full set
// ---------------------------------------------------------------------------

describe('mountSlideView — AC8: navigation clamps within filtered matches', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, searchSet);
    setSearch(root, 'hallelujah'); // matches Alpha (index 0) and Delta (index 3)
  });

  afterEach(() => {
    dispose();
  });

  it('ArrowRight from Alpha moves to Delta (second match)', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Delta');
    expect(root.querySelector('.slide-position')!.textContent).toBe('2 / 2');
  });

  it('ArrowRight at last match stays on Delta', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Delta');
  });

  it('End jumps to last match (Delta)', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Delta');
  });

  it('ArrowLeft at first match stays on Alpha', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Alpha');
  });
});

// ---------------------------------------------------------------------------
// AC9 — Clearing the search field restores all songs
// ---------------------------------------------------------------------------

describe('mountSlideView — AC9: clearing search restores all songs', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, searchSet);
  });

  afterEach(() => {
    dispose();
  });

  it('after filtering then clearing, all 4 songs navigable; position "1 / 4"', () => {
    setSearch(root, 'hallelujah');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');

    setSearch(root, '');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 4');
  });
});

// ---------------------------------------------------------------------------
// AC10 — No matches: shows "0 / 0", no .song in body, no crash
// ---------------------------------------------------------------------------

describe('mountSlideView — AC10: no matches shows "0 / 0" and no song body', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, searchSet);
    setSearch(root, 'xyznotfound');
  });

  afterEach(() => {
    dispose();
  });

  it('position shows "0 / 0"', () => {
    expect(root.querySelector('.slide-position')!.textContent).toBe('0 / 0');
  });

  it('no .song element inside .slide-body', () => {
    expect(root.querySelector('.slide-body .song')).toBeNull();
  });

  it('navigating with no matches does not crash', () => {
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AC11 — Keyboard guard: keydown on the search input does not navigate
// ---------------------------------------------------------------------------

describe('mountSlideView — AC11: keyboard guard blocks navigation when focus is in search', () => {
  let root: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    root = document.createElement('div');
    dispose = mountSlideView(root, searchSet);
    // Move to second song first (Song Beta)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  });

  afterEach(() => {
    dispose();
  });

  it('ArrowRight dispatched on search input does not advance the song', () => {
    const searchInput = root.querySelector(
      '.slide-controls input[type="search"]',
    ) as HTMLInputElement;
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');

    searchInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');
  });

  it('Space dispatched on search input does not advance the song', () => {
    const searchInput = root.querySelector(
      '.slide-controls input[type="search"]',
    ) as HTMLInputElement;
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');

    searchInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');
  });
});
