import type { Song, SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';
import { transposeSong } from '../transpose';

/**
 * Handle returned by mountSlideView — allows the shell to drive the view
 * from external controls (global search, global transpose).
 */
export interface SlideViewHandle {
  dispose(): void;
  setQuery(q: string): void;
  setTranspose(n: number): void;
}

/**
 * Full-screen, one-song-at-a-time presentation view.
 *
 * DOM contract:
 *   .slide-view          — root wrapper; carries --slide-font-scale CSS property
 *     .slide-controls    — persistent toolbar (font size slider only)
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
 *                   no query is set.
 *   - `cursor`    — 0-based position within `matches`; navigation clamps here.
 *   - `fontScale` — CSS scale factor driven by the font-size slider.
 *   - `transpose` — semitone offset applied via transposeSong on each render.
 *
 * Static structure (wrapper, controls, header) is built ONCE on mount.
 * Only the body children and header text are updated on navigation, so
 * controls retain their state (slider position, focus) across song changes.
 *
 * Keyboard guard: if the keydown event originates from an <input> or
 * <textarea>, the handler returns early so typing does not accidentally
 * navigate songs.
 *
 * @param root  Element to render into (replaces its children).
 * @param set   SongSet to display.
 * @param opts  Optional initial state: `query` filters the song list;
 *              `transpose` shifts all chords by this many semitones.
 * @returns SlideViewHandle — `dispose`, `setQuery`, `setTranspose`.
 */
export function mountSlideView(
  root: HTMLElement,
  set: SongSet,
  opts?: { query?: string; transpose?: number },
): SlideViewHandle {
  // ---------------------------------------------------------------------------
  // Closure state
  // ---------------------------------------------------------------------------
  let matches: number[] = set.songs.map((_, i) => i); // all indices initially
  let cursor = 0;
  let fontScale = 1; // Default 100 %
  let transpose = opts?.transpose ?? 0;

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

  // --- Controls bar (font size slider only) ---------------------------------
  const controls = document.createElement('div');
  controls.className = 'slide-controls';

  // Font size slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '30';
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

  controls.appendChild(slider);
  controls.appendChild(scaleDisplay);

  // Two-column layout toggle button
  const TWO_COL_KEY = 'slide-two-col';

  const twoColBtn = document.createElement('button');
  twoColBtn.type = 'button';
  twoColBtn.className = 'slide-two-col-btn';
  twoColBtn.textContent = '2 Sp.';
  twoColBtn.setAttribute('aria-pressed', 'false');

  let twoCol = localStorage.getItem(TWO_COL_KEY) === 'true';

  if (twoCol) {
    wrapper.classList.add('slide-view--two-col');
    twoColBtn.setAttribute('aria-pressed', 'true');
  }

  twoColBtn.addEventListener('click', () => {
    twoCol = !twoCol;
    twoColBtn.setAttribute('aria-pressed', String(twoCol));
    wrapper.classList.toggle('slide-view--two-col', twoCol);
    localStorage.setItem(TWO_COL_KEY, String(twoCol));
  });

  controls.appendChild(twoColBtn);
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
    const transposed = transpose !== 0 ? transposeSong(song, transpose) : song;
    positionEl.textContent = `${cursor + 1} / ${matches.length}`;
    titleEl.textContent = song.name;
    body.replaceChildren(
      renderSong(transposed, { showChords: true, showLyrics: true, chordRatio: 0.8 }),
    );
  }

  // Apply optional initial query before first render
  if (opts?.query) {
    matches = rebuildMatches(opts.query);
    cursor = 0;
  }

  // Initial render
  render();

  // ---------------------------------------------------------------------------
  // Handle methods
  // ---------------------------------------------------------------------------
  function setQuery(q: string): void {
    matches = rebuildMatches(q);
    cursor = 0;
    render();
  }

  function setTranspose(n: number): void {
    transpose = n;
    render();
  }

  function dispose(): void {
    window.removeEventListener('keydown', onKeyDown);
  }

  return { dispose, setQuery, setTranspose };
}
