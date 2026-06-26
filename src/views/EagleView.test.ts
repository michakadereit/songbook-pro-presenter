import { describe, it, expect, beforeEach } from 'vitest';
import { mountEagleView } from './EagleView';
import type { EagleViewHandle } from './EagleView';
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
// Fixtures for handle API tests: two songs with distinct chords and lyrics.
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

// ---------------------------------------------------------------------------
// TICKET-002 ACs — handle API and no internal controls DOM
// ---------------------------------------------------------------------------

describe('mountEagleView — TICKET-002: handle API', () => {
  let root: HTMLElement;
  let handle: EagleViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountEagleView(root, controlsSet);
  });

  // AC1: mountEagleView returns a handle with setQuery and setTranspose
  it('returns a handle object with setQuery and setTranspose', () => {
    expect(typeof handle.setQuery).toBe('function');
    expect(typeof handle.setTranspose).toBe('function');
  });

  // AC5: no .eagle-controls element in the DOM after mount
  it('does not render an .eagle-controls element', () => {
    expect(root.querySelector('.eagle-controls')).toBeNull();
  });

  // AC2: opts.query applied on initial render
  it('opts.query filters tiles immediately on mount (no-match tiles display:none)', () => {
    const filteredRoot = document.createElement('div');
    mountEagleView(filteredRoot, controlsSet, { query: 'hallelujah' });

    const tiles = filteredRoot.querySelectorAll<HTMLElement>('.eagle-tile');
    // songA has 'hallelujah' → visible
    expect(tiles[0].style.display).not.toBe('none');
    // songB has 'glory forever' → hidden
    expect(tiles[1].style.display).toBe('none');
  });

  // AC2 edge case: no tiles hidden when query matches none of the songs (all hidden)
  it('opts.query="bless" hides all tiles when no song contains "bless"', () => {
    const filteredRoot = document.createElement('div');
    mountEagleView(filteredRoot, controlsSet, { query: 'bless' });

    const tiles = filteredRoot.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles[0].style.display).toBe('none');
    expect(tiles[1].style.display).toBe('none');
  });

  // AC3: handle.setQuery re-applies filter
  it('handle.setQuery("glory") hides songA and shows songB', () => {
    handle.setQuery('glory');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    // songA has 'hallelujah praise' → hidden
    expect(tiles[0].style.display).toBe('none');
    // songB has 'glory forever' → visible
    expect(tiles[1].style.display).not.toBe('none');
  });

  it('handle.setQuery("") after filtering shows all tiles again', () => {
    handle.setQuery('hallelujah');
    handle.setQuery('');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    for (const tile of tiles) {
      expect(tile.style.display).not.toBe('none');
    }
  });

  // AC4: handle.setTranspose changes chord text in DOM
  it('handle.setTranspose(2) changes chord A to B in songA tile', () => {
    handle.setTranspose(2);

    const chordsInAlpha = [...root.querySelectorAll('.eagle-tile')[0].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInAlpha).toContain('B');
    expect(chordsInAlpha).not.toContain('A');
  });

  it('handle.setTranspose(0) preserves original chord symbols', () => {
    handle.setTranspose(2);
    handle.setTranspose(0);

    const chordsInAlpha = [...root.querySelectorAll('.eagle-tile')[0].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInAlpha).toContain('A');
    expect(chordsInAlpha).not.toContain('B');
  });
});

// ---------------------------------------------------------------------------
// AC4 — Transpose shifts all tiles globally (via handle)
// ---------------------------------------------------------------------------

describe('mountEagleView — AC4: transpose shifts all tiles globally', () => {
  let root: HTMLElement;
  let handle: EagleViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountEagleView(root, controlsSet);
  });

  it('after setTranspose(2), songA tile shows B instead of A', () => {
    handle.setTranspose(2);

    const chordsInAlpha = [...root.querySelectorAll('.eagle-tile')[0].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInAlpha).toContain('B');
    expect(chordsInAlpha).not.toContain('A');
  });
});

// ---------------------------------------------------------------------------
// AC5 — Offset 0 = original chord symbols (via handle)
// ---------------------------------------------------------------------------

describe('mountEagleView — AC5: offset 0 preserves original chord symbols', () => {
  let root: HTMLElement;
  let handle: EagleViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountEagleView(root, controlsSet);
  });

  it('at transpose 0 songA tile still shows "A"', () => {
    handle.setTranspose(0);

    const chordsInAlpha = [...root.querySelectorAll('.eagle-tile')[0].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInAlpha).toContain('A');
  });

  it('at transpose 0 songB tile still shows "E"', () => {
    handle.setTranspose(0);

    const chordsInBeta = [...root.querySelectorAll('.eagle-tile')[1].querySelectorAll('.seg__chord')]
      .map((el) => el.textContent);
    expect(chordsInBeta).toContain('E');
  });
});

// ---------------------------------------------------------------------------
// AC6 — Search filters tiles by lyric content (via handle)
// ---------------------------------------------------------------------------

describe('mountEagleView — AC6: search filters tiles by lyric content', () => {
  let root: HTMLElement;
  let handle: EagleViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountEagleView(root, controlsSet);
  });

  it('setQuery("hallelujah") keeps songA tile visible and hides songB tile', () => {
    handle.setQuery('hallelujah');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles[0].style.display).not.toBe('none');
    expect(tiles[1].style.display).toBe('none');
  });

  it('search is case-insensitive: setQuery("HALLELUJAH") still matches songA', () => {
    handle.setQuery('HALLELUJAH');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles[0].style.display).not.toBe('none');
    expect(tiles[1].style.display).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// AC7 — Clearing search shows all tiles again (via handle)
// ---------------------------------------------------------------------------

describe('mountEagleView — AC7: clearing search shows all tiles again', () => {
  let root: HTMLElement;
  let handle: EagleViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountEagleView(root, controlsSet);
  });

  it('after filtering then clearing, all tiles are visible', () => {
    handle.setQuery('hallelujah');
    handle.setQuery('');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    for (const tile of tiles) {
      expect(tile.style.display).not.toBe('none');
    }
  });
});

// ---------------------------------------------------------------------------
// AC8 — Search matches hidden lyric content, not title (via handle)
// ---------------------------------------------------------------------------

describe('mountEagleView — AC8: search matches hidden lyric content, not title', () => {
  let root: HTMLElement;
  let handle: EagleViewHandle;

  beforeEach(() => {
    root = document.createElement('div');
    handle = mountEagleView(root, controlsSet);
  });

  it('"glory" is not in "Song Beta" title but IS in its lyrics → tile stays visible', () => {
    expect(songB.name.toLowerCase()).not.toContain('glory');
    expect(songB.sections[0].lines[0].lyrics.toLowerCase()).toContain('glory');

    handle.setQuery('glory');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    // tile[0] = songA ("hallelujah praise" — no "glory") → hidden
    expect(tiles[0].style.display).toBe('none');
    // tile[1] = songB ("glory forever" lyrics) → visible
    expect(tiles[1].style.display).not.toBe('none');
  });

  it('combined: after setTranspose(2) then setQuery("hallelujah"), only songA visible with transposed chords', () => {
    handle.setTranspose(2);
    handle.setQuery('hallelujah');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    // songA: has "hallelujah" → visible, shows transposed chord B
    expect(tiles[0].style.display).not.toBe('none');
    const chordsInAlpha = [...tiles[0].querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chordsInAlpha).toContain('B');
    // songB: no "hallelujah" → hidden
    expect(tiles[1].style.display).toBe('none');
  });

  it('after search + transpose, clearing search restores both tiles without losing transpose', () => {
    handle.setTranspose(2);
    handle.setQuery('hallelujah');

    // Clear search — both tiles back
    handle.setQuery('');

    const tiles = root.querySelectorAll<HTMLElement>('.eagle-tile');
    expect(tiles[0].style.display).not.toBe('none');
    expect(tiles[1].style.display).not.toBe('none');

    // Transpose still in effect: songB tile should show F#/Gb (E+2)
    const chordsInBeta = [...tiles[1].querySelectorAll('.seg__chord')].map((el) => el.textContent);
    expect(chordsInBeta).toContain('F#');
  });
});
