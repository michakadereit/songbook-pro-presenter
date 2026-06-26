import type { Song, SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';
import { transposeSong } from '../transpose';

/**
 * Handle returned by `mountEagleView` that allows the caller to drive
 * search and transpose state externally (e.g. from a global controls bar).
 */
export interface EagleViewHandle {
  setQuery(q: string): void;
  setTranspose(n: number): void;
}

/**
 * Render every song of the set as a chord-only tile in a responsive grid —
 * a quick structural overview before/during a set.
 *
 * DOM contract:
 *   .eagle-view            — root wrapper
 *     .eagle-grid          — responsive CSS grid
 *       .eagle-tile*       — one card per song, each holding a chords-only .song
 *
 * Each tile's song is rendered with `showLyrics: false`, so the .song element
 * carries the `song--no-lyrics` modifier and only chords are visible.
 *
 * State is held in the closure:
 *   - `offset`  — current semitone shift
 *   - `query`   — current search term
 *
 * Both can be driven externally via the returned `EagleViewHandle`.
 * `applyView()` rebuilds all tiles with the current offset, then re-applies the
 * current filter, so transpose and search are always combined correctly.
 *
 * @param root      Element to render into (replaces its children).
 * @param set       SongSet to display.
 * @param opts      Optional initial state: `query` (default '') and `transpose` (default 0).
 * @returns         Handle with `setQuery` and `setTranspose` for external control.
 */
export function mountEagleView(
  root: HTMLElement,
  set: SongSet,
  opts?: { query?: string; transpose?: number },
): EagleViewHandle {
  // -------------------------------------------------------------------------
  // Closure state — initialised from opts
  // -------------------------------------------------------------------------
  let offset = opts?.transpose ?? 0;
  let query = opts?.query ?? '';

  // -------------------------------------------------------------------------
  // Build DOM skeleton
  // -------------------------------------------------------------------------
  const view = document.createElement('div');
  view.className = 'eagle-view';

  const grid = document.createElement('div');
  grid.className = 'eagle-grid';

  view.appendChild(grid);
  root.replaceChildren(view);

  // -------------------------------------------------------------------------
  // Tile rendering helpers
  // -------------------------------------------------------------------------

  /**
   * Collect all lyric text from a song into a single lowercase string for
   * fast substring search (the search filter runs against this, not the DOM).
   */
  function lyricsText(song: Song): string {
    return song.sections
      .flatMap((s) => s.lines.map((l) => l.lyrics))
      .join(' ')
      .toLowerCase();
  }

  /**
   * Rebuild every tile with the current `offset`, then apply the current
   * `query` filter.  Keeping these two steps together ensures the grid never
   * shows stale chord symbols AND correctly respects an active search filter.
   */
  function applyView(): void {
    // Rebuild grid contents
    grid.replaceChildren();

    for (const song of set.songs) {
      const transposed = transposeSong(song, offset);

      const tile = document.createElement('div');
      tile.className = 'eagle-tile';

      // Store lyrics for filtering without relying on hidden DOM text
      tile.dataset['lyrics'] = lyricsText(song);

      tile.appendChild(
        renderSong(transposed, { showChords: true, showLyrics: false, chordRatio: 0.8 }),
      );

      grid.appendChild(tile);
    }

    // Re-apply search filter
    applyFilter();
  }

  /**
   * Show/hide each tile based on the current `query`.
   * Uses `data-lyrics` set at build time so it always reflects the
   * parser-supplied lyrics (not the transposed/rendered text in the DOM).
   */
  function applyFilter(): void {
    const tiles = grid.querySelectorAll<HTMLElement>('.eagle-tile');
    for (const tile of tiles) {
      if (query === '') {
        tile.style.display = '';
      } else {
        const lyrics = tile.dataset['lyrics'] ?? '';
        tile.style.display = lyrics.includes(query.toLowerCase()) ? '' : 'none';
      }
    }
  }

  // -------------------------------------------------------------------------
  // Initial render
  // -------------------------------------------------------------------------
  applyView();

  // -------------------------------------------------------------------------
  // External handle
  // -------------------------------------------------------------------------
  return {
    setQuery(q: string): void {
      query = q;
      applyFilter();
    },
    setTranspose(n: number): void {
      offset = n;
      applyView();
    },
  };
}
