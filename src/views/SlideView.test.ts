import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountSlideView } from './SlideView';
import type { SlideViewHandle } from './SlideView';
import type { Song, SongSet } from '../types';

// ---------------------------------------------------------------------------
// Fixture helpers
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

// 3-song set with chords (used by navigation / rendering tests)
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

// 4-song set with distinct lyric words (used by search tests)
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

// ---------------------------------------------------------------------------
// AC1 — Eine Slide, Titel oben
// ---------------------------------------------------------------------------

describe('mountSlideView — AC1: one song visible, first song title on top', () => {
  let root: HTMLElement;
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, set);
  });

  afterEach(() => {
    handle.dispose();
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
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, set);
  });

  afterEach(() => {
    handle.dispose();
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
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, set);
  });

  afterEach(() => {
    handle.dispose();
  });

  it('ArrowLeft at index 0 stays on first song', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    const title = root.querySelector('.song__title');
    expect(title!.textContent).toBe('First Song');
  });

  it('ArrowRight at last song stays on last song', () => {
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
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, set);
  });

  afterEach(() => {
    handle.dispose();
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
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, set);
  });

  afterEach(() => {
    handle.dispose();
  });

  it('slide contains .seg__chord elements', () => {
    const chords = root.querySelectorAll('.seg__chord');
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
    const handle = mountSlideView(root, set);

    // Navigate to second song
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Second Song');

    // Dispose — listener removed
    handle.dispose();

    // ArrowRight should NOT change slide any more (no handler updates it)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(root.querySelector('.song__title')!.textContent).toBe('Second Song');
  });
});

// ---------------------------------------------------------------------------
// AC6 — Schriftgrößen-Regler (font size slider)
// ---------------------------------------------------------------------------

describe('mountSlideView — AC6: font size slider', () => {
  let root: HTMLElement;
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, set);
  });

  afterEach(() => {
    handle.dispose();
  });

  it('renders a range slider inside .slide-controls', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]');
    expect(slider).not.toBeNull();
  });

  it('slider has attributes min=30, max=200, step=10, value=100', () => {
    const slider = root.querySelector('.slide-controls input[type="range"]') as HTMLInputElement;
    expect(slider.min).toBe('30');
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
// AC7 — Lyric search via handle.setQuery: filters songs, updates position
// ---------------------------------------------------------------------------

describe('mountSlideView — AC7: setQuery filters to matching songs', () => {
  let root: HTMLElement;
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, searchSet);
  });

  afterEach(() => {
    handle.dispose();
  });

  it('setQuery("hallelujah") jumps to Song Alpha (first match)', () => {
    handle.setQuery('hallelujah');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Alpha');
  });

  it('position shows "1 / 2" when 2 songs match "hallelujah"', () => {
    handle.setQuery('hallelujah');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');
  });

  it('setQuery("glory") shows Song Gamma first; position "1 / 2"', () => {
    handle.setQuery('glory');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Gamma');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');
  });

  it('setQuery("grace") shows only Song Beta; position "1 / 1"', () => {
    handle.setQuery('grace');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 1');
  });

  it('search is case-insensitive: setQuery("HALLELUJAH") matches Song Alpha', () => {
    handle.setQuery('HALLELUJAH');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Alpha');
  });
});

// ---------------------------------------------------------------------------
// AC8 — Navigation clamps within the filtered matches, not the full set
// ---------------------------------------------------------------------------

describe('mountSlideView — AC8: navigation clamps within filtered matches', () => {
  let root: HTMLElement;
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, searchSet);
    handle.setQuery('hallelujah'); // matches Alpha (index 0) and Delta (index 3)
  });

  afterEach(() => {
    handle.dispose();
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
// AC9 — Clearing the query restores all songs
// ---------------------------------------------------------------------------

describe('mountSlideView — AC9: clearing query restores all songs', () => {
  let root: HTMLElement;
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, searchSet);
  });

  afterEach(() => {
    handle.dispose();
  });

  it('after filtering then clearing, all 4 songs navigable; position "1 / 4"', () => {
    handle.setQuery('hallelujah');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');

    handle.setQuery('');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 4');
  });
});

// ---------------------------------------------------------------------------
// AC10 — No matches: shows "0 / 0", no .song in body, no crash
// ---------------------------------------------------------------------------

describe('mountSlideView — AC10: no matches shows "0 / 0" and no song body', () => {
  let root: HTMLElement;
  let handle: SlideViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountSlideView(root, searchSet);
    handle.setQuery('xyznotfound');
  });

  afterEach(() => {
    handle.dispose();
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
// TICKET-003 ACs — SlideViewHandle API + opts.query/transpose
// ---------------------------------------------------------------------------

describe('mountSlideView — TICKET-003: SlideViewHandle shape', () => {
  it('returns an object with dispose, setQuery and setTranspose', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, set);
    expect(typeof handle.dispose).toBe('function');
    expect(typeof handle.setQuery).toBe('function');
    expect(typeof handle.setTranspose).toBe('function');
    handle.dispose();
  });

  it('no input[type="search"] in .slide-controls', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, set);
    expect(root.querySelector('.slide-controls input[type="search"]')).toBeNull();
    handle.dispose();
  });
});

describe('mountSlideView — TICKET-003: opts.query initial filter', () => {
  it('opts.query="grace" → position indicator shows only matching songs', () => {
    const root = document.createElement('div');
    // searchSet has 1 song with "grace" (Song Beta)
    const handle = mountSlideView(root, searchSet, { query: 'grace' });
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 1');
    expect(root.querySelector('.song__title')!.textContent).toBe('Song Beta');
    handle.dispose();
  });

  it('opts.query="hallelujah" → position shows "1 / 2"', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, searchSet, { query: 'hallelujah' });
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');
    handle.dispose();
  });
});

describe('mountSlideView — TICKET-003: handle.setQuery updates indicator', () => {
  it('handle.setQuery("bless") with no match shows "0 / 0"', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, searchSet);
    handle.setQuery('bless');
    expect(root.querySelector('.slide-position')!.textContent).toBe('0 / 0');
    handle.dispose();
  });

  it('handle.setQuery updates position to match count', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, searchSet);
    handle.setQuery('glory');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 2');
    handle.dispose();
  });
});

describe('mountSlideView — TICKET-003: opts.transpose renders transposed chords', () => {
  // set has songs with chords G and D; G+2=A, D+2=E
  it('opts.transpose=2 → chord elements show A and E', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, set, { transpose: 2 });
    const chordTexts = [...root.querySelectorAll('.seg__chord')]
      .map((el) => el.textContent)
      .filter((t) => t !== '');
    expect(chordTexts).toContain('A');
    expect(chordTexts).toContain('E');
    handle.dispose();
  });

  it('opts.transpose=0 → original chords G and D still shown', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, set, { transpose: 0 });
    const chordTexts = [...root.querySelectorAll('.seg__chord')]
      .map((el) => el.textContent)
      .filter((t) => t !== '');
    expect(chordTexts).toContain('G');
    expect(chordTexts).toContain('D');
    handle.dispose();
  });
});

describe('mountSlideView — TICKET-003: handle.setTranspose re-renders with new offset', () => {
  it('setTranspose(2) → chord elements show A and E', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, set);

    // Verify original chords first
    const originalChords = [...root.querySelectorAll('.seg__chord')]
      .map((el) => el.textContent)
      .filter((t) => t !== '');
    expect(originalChords).toContain('G');

    handle.setTranspose(2);

    const transposedChords = [...root.querySelectorAll('.seg__chord')]
      .map((el) => el.textContent)
      .filter((t) => t !== '');
    expect(transposedChords).toContain('A');
    expect(transposedChords).toContain('E');
    handle.dispose();
  });

  it('setTranspose(0) after setTranspose(2) reverts to original chords', () => {
    const root = document.createElement('div');
    const handle = mountSlideView(root, set);
    handle.setTranspose(2);
    handle.setTranspose(0);
    const chordTexts = [...root.querySelectorAll('.seg__chord')]
      .map((el) => el.textContent)
      .filter((t) => t !== '');
    expect(chordTexts).toContain('G');
    expect(chordTexts).toContain('D');
    handle.dispose();
  });
});
