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
