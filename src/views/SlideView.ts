import type { Song, SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';

/**
 * Full-screen, one-song-at-a-time presentation view.
 *
 * DOM contract:
 *   .slide-view          — root wrapper; carries --slide-font-scale CSS property
 *     .slide-controls    — persistent toolbar (search field + font size slider)
 *       input[type=search] — lyric filter: reduces navigable songs to matches
 *       input[type=range]  — font size slider (60–200 %)
 *       .slide-font-scale-value — visible percentage label
 *     .slide-header      — top bar with position indicator and song title
 *       .slide-position  — "n / total" indicator (or "0 / 0" when no matches)
 *       .slide-title     — current song name
 *     .slide-body        — holds the rendered song (.song article), or a
 *                          .slide-no-results hint when the search has no matches
 *
 * Closure state:
 *   - `matches`   — indices into `set.songs` whose lyric text contains the
 *                   current search term (case-insensitive); all indices when
 *                   the search field is empty.
 *   - `cursor`    — 0-based position within `matches`; navigation clamps here.
 *   - `fontScale` — CSS scale factor driven by the font-size slider.
 *
 * Static structure (wrapper, controls, header) is built ONCE on mount.
 * Only the body children and header text are updated on navigation, so
 * controls retain their state (slider position, search text, focus) across
 * song changes.
 *
 * Keyboard guard: if the keydown event originates from an <input> or
 * <textarea>, the handler returns early so typing in the search field does
 * not accidentally navigate songs.
 *
 * @returns dispose — removes the window keydown listener (call when unmounting).
 */
export function mountSlideView(root: HTMLElement, set: SongSet): () => void {
  // ---------------------------------------------------------------------------
  // Closure state
  // ---------------------------------------------------------------------------
  let matches: number[] = set.songs.map((_, i) => i); // all indices initially
  let cursor = 0;
  let fontScale = 1; // Default 100 %

  // ---------------------------------------------------------------------------
  // Lyric-text helper — same approach as EagleView
  // ---------------------------------------------------------------------------
  function lyricsText(song: Song): string {
    return song.sections
      .flatMap((s) => s.lines.map((l) => l.lyrics))
      .join(' ')
      .toLowerCase();
  }

  // ---------------------------------------------------------------------------
  // Rebuild matches from a search query
  // ---------------------------------------------------------------------------
  function rebuildMatches(query: string): number[] {
    if (query === '') return set.songs.map((_, i) => i);
    const term = query.toLowerCase();
    return set.songs.reduce<number[]>((acc, song, i) => {
      if (lyricsText(song).includes(term)) acc.push(i);
      return acc;
    }, []);
  }

  // ---------------------------------------------------------------------------
  // Navigation helpers (all clamp within matches, no wrap)
  // ---------------------------------------------------------------------------
  function next(): void {
    if (cursor < matches.length - 1) {
      cursor += 1;
      render();
    }
  }

  function prev(): void {
    if (cursor > 0) {
      cursor -= 1;
      render();
    }
  }

  function first(): void {
    if (matches.length > 0 && cursor !== 0) {
      cursor = 0;
      render();
    }
  }

  function last(): void {
    if (matches.length > 0 && cursor !== matches.length - 1) {
      cursor = matches.length - 1;
      render();
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------
  function onKeyDown(event: KeyboardEvent): void {
    // Guard: do not navigate when the user is typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
        next();
        break;
      case ' ':
        event.preventDefault();
        next();
        break;
      case 'ArrowLeft':
        prev();
        break;
      case 'Home':
        first();
        break;
      case 'End':
        last();
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // ---------------------------------------------------------------------------
  // Static structure — built once, survives navigation
  // ---------------------------------------------------------------------------

  const wrapper = document.createElement('div');
  wrapper.className = 'slide-view';

  // --- Controls bar (search field + font size slider) -----------------------
  const controls = document.createElement('div');
  controls.className = 'slide-controls';

  // Search field
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Lyrics suchen…';
  searchInput.className = 'slide-search';
  searchInput.setAttribute('aria-label', 'Lyrics suchen');

  searchInput.addEventListener('input', () => {
    matches = rebuildMatches(searchInput.value);
    cursor = 0;
    render();
  });

  // Font size slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '60';
  slider.max = '200';
  slider.step = '10';
  slider.value = '100';

  const scaleDisplay = document.createElement('span');
  scaleDisplay.className = 'slide-font-scale-value';
  scaleDisplay.textContent = '100 %';

  slider.addEventListener('input', () => {
    fontScale = Number(slider.value) / 100;
    scaleDisplay.textContent = `${slider.value} %`;
    wrapper.style.setProperty('--slide-font-scale', String(fontScale));
  });

  controls.appendChild(searchInput);
  controls.appendChild(slider);
  controls.appendChild(scaleDisplay);
  wrapper.appendChild(controls);

  // --- Header: position indicator + song title ------------------------------
  const header = document.createElement('div');
  header.className = 'slide-header';

  const positionEl = document.createElement('span');
  positionEl.className = 'slide-position';

  const titleEl = document.createElement('span');
  titleEl.className = 'slide-title';

  header.appendChild(positionEl);
  header.appendChild(titleEl);
  wrapper.appendChild(header);

  // --- Body: rendered song (children replaced on each render) ---------------
  const body = document.createElement('div');
  body.className = 'slide-body';
  wrapper.appendChild(body);

  root.replaceChildren(wrapper);

  // ---------------------------------------------------------------------------
  // Render — updates only the mutable parts (position, title, body children)
  // ---------------------------------------------------------------------------
  function render(): void {
    // Re-apply font scale so the CSS property is set even on the initial render
    // and is not lost when the wrapper reference changes.
    wrapper.style.setProperty('--slide-font-scale', String(fontScale));

    if (matches.length === 0) {
      positionEl.textContent = '0 / 0';
      titleEl.textContent = '';
      const hint = document.createElement('p');
      hint.className = 'slide-no-results';
      hint.textContent = 'Keine Treffer';
      body.replaceChildren(hint);
      return;
    }

    const song = set.songs[matches[cursor]];
    positionEl.textContent = `${cursor + 1} / ${matches.length}`;
    titleEl.textContent = song.name;
    body.replaceChildren(
      renderSong(song, { showChords: true, showLyrics: true, chordRatio: 0.8 }),
    );
  }

  // Initial render
  render();

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------
  return function dispose(): void {
    window.removeEventListener('keydown', onKeyDown);
  };
}
