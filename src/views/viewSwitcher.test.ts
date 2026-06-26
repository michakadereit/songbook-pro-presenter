import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
// TICKET-004 fixture — distinct lyrics + known chord per song
// ---------------------------------------------------------------------------

function makeSongT004(id: number, name: string, lyrics: string, chord: string): Song {
  return {
    id,
    name,
    author: `Author ${id}`,
    keyShift: 0,
    sections: [
      {
        title: 'Chorus',
        lines: [{ lyrics, chords: [{ symbol: chord, position: 0 }] }],
      },
    ],
  };
}

/** Three songs with unique lyrics: only "Song Alpha" contains "hallelujah". */
const t004Set: SongSet = {
  id: 2,
  name: 'TICKET-004 Set',
  date: '2026-06-26T00:00:00.000',
  songs: [
    makeSongT004(10, 'Song Alpha', 'hallelujah amazing', 'G'),
    makeSongT004(11, 'Song Beta', 'grace forever', 'D'),
    makeSongT004(12, 'Song Gamma', 'mercy love', 'G'),
  ],
};

/** Fire an `input` event on the global-search field. */
function typeInSearch(root: HTMLElement, value: string): void {
  const input = root.querySelector<HTMLInputElement>('input.global-search')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

/** Move the transpose slider and fire its `input` event. */
function moveTransposeSlider(root: HTMLElement, value: number): void {
  const slider = root.querySelector<HTMLInputElement>('input.global-transpose-slider')!;
  slider.value = String(value);
  slider.dispatchEvent(new Event('input'));
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
// TICKET-001 — Global Controls DOM
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — global controls DOM', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
  });

  it('AC1: .global-controls is present in the DOM', () => {
    expect(root.querySelector('.global-controls')).not.toBeNull();
  });

  it('AC2: input[type="search"].global-search is present', () => {
    const el = root.querySelector('input.global-search');
    expect(el).not.toBeNull();
    expect(el!.getAttribute('type')).toBe('search');
  });

  it('AC3: input[type="range"].global-transpose-slider has min=-6, max=6', () => {
    const el = root.querySelector('input.global-transpose-slider');
    expect(el).not.toBeNull();
    expect(el!.getAttribute('type')).toBe('range');
    expect(el!.getAttribute('min')).toBe('-6');
    expect(el!.getAttribute('max')).toBe('6');
  });

  it('AC4: span.global-transpose-value shows "0" initially', () => {
    const el = root.querySelector('span.global-transpose-value');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('0');
  });

  it('AC5: moving transpose slider updates the label', () => {
    const slider = root.querySelector<HTMLInputElement>('input.global-transpose-slider')!;
    const label = root.querySelector('span.global-transpose-value')!;

    slider.value = '3';
    slider.dispatchEvent(new Event('input'));
    expect(label.textContent).toBe('+3');

    slider.value = '-2';
    slider.dispatchEvent(new Event('input'));
    expect(label.textContent).toBe('-2');

    slider.value = '0';
    slider.dispatchEvent(new Event('input'));
    expect(label.textContent).toBe('0');
  });

  it('AC5b: .global-controls sits inside .view-tabs', () => {
    const tabBar = root.querySelector('.view-tabs')!;
    expect(tabBar.querySelector('.global-controls')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TICKET-004 — AC1: global-search forwards setQuery to the active slide view
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — TICKET-004 AC1: global-search updates slide view', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, t004Set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
    vi.restoreAllMocks();
  });

  it('typing "hallelujah" filters slide to the one matching song (position "1 / 1")', () => {
    typeInSearch(root, 'hallelujah');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 1');
  });

  it('typing "hallelujah" sets slide title to "Song Alpha"', () => {
    typeInSearch(root, 'hallelujah');
    expect(root.querySelector('.slide-title')!.textContent).toBe('Song Alpha');
  });

  it('clearing the search shows all 3 songs again (position "1 / 3")', () => {
    typeInSearch(root, 'hallelujah');
    typeInSearch(root, '');
    expect(root.querySelector('.slide-position')!.textContent).toBe('1 / 3');
  });

  it('no-match query shows "0 / 0"', () => {
    typeInSearch(root, 'xyznotfound');
    expect(root.querySelector('.slide-position')!.textContent).toBe('0 / 0');
  });
});

// ---------------------------------------------------------------------------
// TICKET-004 — AC2: transpose slider forwards setTranspose to the active view
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — TICKET-004 AC2: transpose slider updates slide view', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, t004Set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
    vi.restoreAllMocks();
  });

  it('slider=2 → chord G becomes A in slide view', () => {
    moveTransposeSlider(root, 2);
    const chords = [...root.querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chords).toContain('A');
    expect(chords).not.toContain('G');
  });

  it('slider=0 → original chord G is shown', () => {
    moveTransposeSlider(root, 2);
    moveTransposeSlider(root, 0);
    const chords = [...root.querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chords).toContain('G');
  });
});

// ---------------------------------------------------------------------------
// TICKET-004 — AC3: Slide → Eagle preserves globalQuery
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — TICKET-004 AC3: Slide→Eagle carries globalQuery', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    switcher = mountViewSwitcher(root, t004Set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
    vi.restoreAllMocks();
  });

  it('after typing "hallelujah" and switching to eagle, only Song Alpha tile is visible', () => {
    typeInSearch(root, 'hallelujah');
    clickTab(root, 'eagle');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles).toHaveLength(3);
    // Song Alpha (hallelujah) — visible
    expect(tiles[0].style.display).not.toBe('none');
    // Song Beta (grace) — hidden
    expect(tiles[1].style.display).toBe('none');
    // Song Gamma (mercy) — hidden
    expect(tiles[2].style.display).toBe('none');
  });

  it('after typing "" (empty) and switching to eagle, all tiles are visible', () => {
    typeInSearch(root, 'hallelujah');
    typeInSearch(root, '');
    clickTab(root, 'eagle');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    for (const tile of tiles) {
      expect(tile.style.display).not.toBe('none');
    }
  });
});

// ---------------------------------------------------------------------------
// TICKET-004 — AC4: Eagle → Slide preserves globalTranspose
// ---------------------------------------------------------------------------

describe('mountViewSwitcher — TICKET-004 AC4: Eagle→Slide carries globalTranspose', () => {
  let root: HTMLElement;
  let switcher: { dispose(): void };

  beforeEach(() => {
    root = document.createElement('div');
    // Start in slide so we can set the transpose, then switch to eagle, then back
    switcher = mountViewSwitcher(root, t004Set, 'slide');
  });

  afterEach(() => {
    switcher.dispose();
    vi.restoreAllMocks();
  });

  it('moving slider=2 in eagle then switching to slide shows transposed chord A', () => {
    clickTab(root, 'eagle');
    moveTransposeSlider(root, 2);
    clickTab(root, 'slide');

    const chords = [...root.querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chords).toContain('A');
    expect(chords).not.toContain('G');
  });

  it('slider=0 after transpose → switching to slide restores original G', () => {
    clickTab(root, 'eagle');
    moveTransposeSlider(root, 2);
    moveTransposeSlider(root, 0);
    clickTab(root, 'slide');

    const chords = [...root.querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chords).toContain('G');
    expect(chords).not.toContain('A');
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
