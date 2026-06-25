import type { SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';

/**
 * Render every song of the set as a chord-only tile in a responsive grid —
 * a quick structural overview before/during a set.
 *
 * DOM contract:
 *   .eagle-view            — root wrapper
 *     .eagle-controls      — placeholder toolbar (transpose/search land in TICKET-003)
 *     .eagle-grid          — responsive CSS grid
 *       .eagle-tile*       — one card per song, each holding a chords-only .song
 *
 * Each tile's song is rendered with `showLyrics: false`, so the .song element
 * carries the `song--no-lyrics` modifier and only chords are visible.
 */
export function mountEagleView(root: HTMLElement, set: SongSet): void {
  const view = document.createElement('div');
  view.className = 'eagle-view';

  // Empty controls placeholder — logic (transpose slider, search) is TICKET-003.
  const controls = document.createElement('div');
  controls.className = 'eagle-controls';

  const grid = document.createElement('div');
  grid.className = 'eagle-grid';

  for (const song of set.songs) {
    const tile = document.createElement('div');
    tile.className = 'eagle-tile';
    tile.appendChild(
      renderSong(song, { showChords: true, showLyrics: false, chordRatio: 0.8 }),
    );
    grid.appendChild(tile);
  }

  view.appendChild(controls);
  view.appendChild(grid);
  root.replaceChildren(view);
}
