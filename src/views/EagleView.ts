import type { Song, SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';
import { transposeSong } from '../transpose';

/**
 * Render every song of the set as a chord-only tile in a responsive grid —
 * a quick structural overview before/during a set.
 *
 * DOM contract:
 *   .eagle-view            — root wrapper
 *     .eagle-controls      — toolbar: transpose slider + lyric search
 *       input[type=range]  — transpose range −6…+6
 *       .transpose-value   — visible offset label ("0", "+2", "-3")
 *       input[type=search] — lyric filter field
 *     .eagle-grid          — responsive CSS grid
 *       .eagle-tile*       — one card per song, each holding a chords-only .song
 *
 * Each tile's song is rendered with `showLyrics: false`, so the .song element
 * carries the `song--no-lyrics` modifier and only chords are visible.
 *
 * State is held in the closure:
 *   - `offset`  — current semitone shift (from slider)
 *   - `query`   — current search term (from search field)
 *
 * `applyView()` rebuilds all tiles with the current offset, then re-applies the
 * current filter, so transpose and search are always combined correctly.
 */
export function mountEagleView(root: HTMLElement, set: SongSet): void {
  // -------------------------------------------------------------------------
  // Closure state
  // -------------------------------------------------------------------------
  let offset = 0;
  let query = '';

  // -------------------------------------------------------------------------
  // Build DOM skeleton
  // -------------------------------------------------------------------------
  const view = document.createElement('div');
  view.className = 'eagle-view';

  // --- Controls toolbar -----------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'eagle-controls';

  // Transpose slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '-6';
  slider.max = '6';
  slider.step = '1';
  slider.value = '0';
  slider.className = 'transpose-slider';
  slider.setAttribute('aria-label', 'Transpose');

  // Visible offset label
  const offsetLabel = document.createElement('span');
  offsetLabel.className = 'transpose-value';
  offsetLabel.textContent = '0';

  // Search field
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Lyrics suchen…';
  searchInput.className = 'eagle-search';
  searchInput.setAttribute('aria-label', 'Lyrics suchen');

  controls.appendChild(slider);
  controls.appendChild(offsetLabel);
  controls.appendChild(searchInput);

  // --- Grid -----------------------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'eagle-grid';

  view.appendChild(controls);
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
  // Event listeners
  // -------------------------------------------------------------------------

  slider.addEventListener('input', () => {
    offset = parseInt(slider.value, 10);

    // Update visible label: prefix '+' for positive values
    offsetLabel.textContent = offset > 0 ? `+${offset}` : String(offset);

    applyView();
  });

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    applyFilter();
  });

  // -------------------------------------------------------------------------
  // Initial render
  // -------------------------------------------------------------------------
  applyView();
}
