import { describe, it, expect, beforeEach } from 'vitest';
import { mountEagleView } from './EagleView';
import type { SongSet, Song } from '../types';

// ---------------------------------------------------------------------------
// Fixture: a small set with a few songs, each one section + one chorded line.
// ---------------------------------------------------------------------------

function makeSong(id: number, name: string): Song {
  return {
    id,
    name,
    author: `Author ${id}`,
    keyShift: 0,
    sections: [
      {
        title: 'Verse 1',
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

describe('mountEagleView — AC1: grid with chord-only tiles', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    mountEagleView(root, set);
  });

  it('renders exactly one .eagle-grid container', () => {
    expect(root.querySelectorAll('.eagle-grid')).toHaveLength(1);
  });

  it('renders exactly one .eagle-tile per song', () => {
    const tiles = root.querySelectorAll('.eagle-grid .eagle-tile');
    expect(tiles).toHaveLength(set.songs.length);
  });

  it('shows each song title in its tile', () => {
    const titles = [...root.querySelectorAll('.eagle-tile .song__title')].map(
      (el) => el.textContent,
    );
    expect(titles).toEqual(['First Song', 'Second Song', 'Third Song']);
  });

  it('renders each tile with a chords-only song container (song--no-lyrics)', () => {
    const tiles = root.querySelectorAll('.eagle-tile');
    for (const tile of tiles) {
      const song = tile.querySelector('.song');
      expect(song).not.toBeNull();
      expect(song!.classList.contains('song--no-lyrics')).toBe(true);
      expect(song!.classList.contains('song--no-chords')).toBe(false);
    }
  });

  it('renders chord symbols inside the tiles', () => {
    const chords = [...root.querySelectorAll('.eagle-tile .seg__chord')].map(
      (el) => el.textContent,
    );
    expect(chords).toContain('G');
    expect(chords).toContain('D');
  });
});

// ---------------------------------------------------------------------------
// Fixtures for AC4–AC8: two songs with distinct chords and distinct lyrics.
//
//   songA: chord 'A', lyrics "hallelujah praise"  → unique word "hallelujah"
//   songB: chord 'E', lyrics "glory forever"      → unique word "glory"
// ---------------------------------------------------------------------------

const songA: Song = {
  id: 10,
  name: 'Song Alpha',
  author: 'Author A',
  keyShift: 0,
  sections: [
    {
      title: 'Chorus',
      lines: [
        {
          lyrics: 'hallelujah praise',
          chords: [{ symbol: 'A', position: 0 }],
        },
      ],
    },
  ],
};

const songB: Song = {
  id: 20,
  name: 'Song Beta',
  author: 'Author B',
  keyShift: 0,
  sections: [
    {
      title: 'Verse 1',
      lines: [
        {
          lyrics: 'glory forever',
          chords: [{ symbol: 'E', position: 0 }],
        },
      ],
    },
  ],
};

const controlsSet: SongSet = {
  id: 2,
  name: 'Controls Set',
  date: '2026-06-25T00:00:00.000',
  songs: [songA, songB],
};

// Helper: dispatch an 'input' event on an element (simulates user interaction).
function triggerInput(el: HTMLElement | null): void {
  if (!el) throw new Error('Element is null');
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

// ---------------------------------------------------------------------------
// AC4 — Transpose-Regler wirkt global
// ---------------------------------------------------------------------------

describe('mountEagleView — AC4: transpose slider shifts all tiles globally', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    mountEagleView(root, controlsSet);
  });

  it('renders a range input inside .eagle-controls', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]');
    expect(slider).not.toBeNull();
  });

  it('slider has min=-6, max=6, step=1, value=0 by default', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    expect(slider.min).toBe('-6');
    expect(slider.max).toBe('6');
    expect(slider.step).toBe('1');
    expect(slider.value).toBe('0');
  });

  it('shows a visible offset label with text "0" initially', () => {
    // The offset display element should exist and start at "0"
    const display = root.querySelector<HTMLElement>('.eagle-controls .transpose-value');
    expect(display).not.toBeNull();
    expect(display!.textContent).toBe('0');
  });

  it('after setting slider to +2 and dispatching input, tiles show B instead of A', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    slider.value = '2';
    triggerInput(slider);

    // songA had chord 'A' → after +2 semitones should be 'B'
    const chordsInAlpha = [...root.querySelectorAll('.eagle-tile')[0].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInAlpha).toContain('B');
    expect(chordsInAlpha).not.toContain('A');
  });

  it('after +2 transpose, offset display shows "+2"', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    slider.value = '2';
    triggerInput(slider);

    const display = root.querySelector<HTMLElement>('.eagle-controls .transpose-value')!;
    expect(display.textContent).toBe('+2');
  });

  it('after -3 transpose, offset display shows "-3"', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    slider.value = '-3';
    triggerInput(slider);

    const display = root.querySelector<HTMLElement>('.eagle-controls .transpose-value')!;
    expect(display.textContent).toBe('-3');
  });
});

// ---------------------------------------------------------------------------
// AC5 — Offset 0 = Ausgangszustand
// ---------------------------------------------------------------------------

describe('mountEagleView — AC5: offset 0 preserves original chord symbols', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    mountEagleView(root, controlsSet);
  });

  it('at slider value 0 songA tile still shows "A"', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    // Explicitly set to 0 and dispatch to confirm no drift
    slider.value = '0';
    triggerInput(slider);

    const chordsInAlpha = [...root.querySelectorAll('.eagle-tile')[0].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInAlpha).toContain('A');
  });

  it('at slider value 0 songB tile still shows "E"', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    slider.value = '0';
    triggerInput(slider);

    const chordsInBeta = [...root.querySelectorAll('.eagle-tile')[1].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInBeta).toContain('E');
  });
});

// ---------------------------------------------------------------------------
// AC6 — Suche filtert nach Lyrics
// ---------------------------------------------------------------------------

describe('mountEagleView — AC6: search filters tiles by lyric content', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    mountEagleView(root, controlsSet);
  });

  it('renders a search input inside .eagle-controls', () => {
    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]');
    expect(search).not.toBeNull();
  });

  it('searching "hallelujah" keeps songA tile visible and hides songB tile', () => {
    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]')!;
    search.value = 'hallelujah';
    triggerInput(search);

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    // tile[0] = songA (has "hallelujah") → visible
    expect(tiles[0].style.display).not.toBe('none');
    // tile[1] = songB (has "glory") → hidden
    expect(tiles[1].style.display).toBe('none');
  });

  it('search is case-insensitive: "HALLELUJAH" still matches songA', () => {
    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]')!;
    search.value = 'HALLELUJAH';
    triggerInput(search);

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles[0].style.display).not.toBe('none');
    expect(tiles[1].style.display).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// AC7 — Suche zurücksetzen
// ---------------------------------------------------------------------------

describe('mountEagleView — AC7: clearing search shows all tiles again', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    mountEagleView(root, controlsSet);
  });

  it('after filtering then clearing, all tiles are visible', () => {
    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]')!;

    // First filter
    search.value = 'hallelujah';
    triggerInput(search);

    // Then clear
    search.value = '';
    triggerInput(search);

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    for (const tile of tiles) {
      expect(tile.style.display).not.toBe('none');
    }
  });
});

// ---------------------------------------------------------------------------
// AC8 — Suche trifft verdeckte Lyrics (lyrics not in title)
// ---------------------------------------------------------------------------

describe('mountEagleView — AC8: search matches hidden lyric content, not title', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    mountEagleView(root, controlsSet);
  });

  it('"glory" is not in "Song Beta" title but IS in its lyrics → tile stays visible', () => {
    // Confirm "glory" is not in the title of songB
    expect(songB.name.toLowerCase()).not.toContain('glory');
    // Confirm "glory" IS in its lyrics
    expect(songB.sections[0].lines[0].lyrics.toLowerCase()).toContain('glory');

    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]')!;
    search.value = 'glory';
    triggerInput(search);

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    // tile[0] = songA ("hallelujah praise" — no "glory") → hidden
    expect(tiles[0].style.display).toBe('none');
    // tile[1] = songB ("glory forever" lyrics) → visible
    expect(tiles[1].style.display).not.toBe('none');
  });

  it('combined: after transpose +2 then search "hallelujah", only songA visible (state combined)', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]')!;

    // Transpose first
    slider.value = '2';
    triggerInput(slider);

    // Then search
    search.value = 'hallelujah';
    triggerInput(search);

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    // songA: has "hallelujah" → visible, shows transposed chord B
    expect(tiles[0].style.display).not.toBe('none');
    const chordsInAlpha = [...tiles[0].querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chordsInAlpha).toContain('B');
    // songB: no "hallelujah" → hidden
    expect(tiles[1].style.display).toBe('none');
  });

  it('after search + transpose, clearing search restores both tiles without losing transpose', () => {
    const slider = root.querySelector<HTMLInputElement>('.eagle-controls input[type="range"]')!;
    const search = root.querySelector<HTMLInputElement>('.eagle-controls input[type="search"]')!;

    slider.value = '2';
    triggerInput(slider);
    search.value = 'hallelujah';
    triggerInput(search);

    // Clear search — both tiles back
    search.value = '';
    triggerInput(search);

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles[0].style.display).not.toBe('none');
    expect(tiles[1].style.display).not.toBe('none');

    // Transpose still in effect: songB tile should show F#/Gb (E+2)
    const chordsInBeta = [...tiles[1].querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chordsInBeta).toContain('F#');
  });
});
