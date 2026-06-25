import type { SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';

/**
 * Full-screen, one-song-at-a-time presentation view.
 *
 * DOM contract:
 *   .slide-view          — root wrapper
 *     .slide-header      — top bar with position indicator and song title
 *       .slide-position  — "n / total" indicator
 *       .slide-title     — current song name
 *     .slide-body        — holds the rendered song (.song article)
 *
 * @returns dispose — removes the window keydown listener (call when unmounting).
 */
export function mountSlideView(root: HTMLElement, set: SongSet): () => void {
  // ---------------------------------------------------------------------------
  // Closure state
  // ---------------------------------------------------------------------------
  let index = 0;
  const total = set.songs.length;

  // ---------------------------------------------------------------------------
  // Navigation helpers (all clamp, no wrap)
  // ---------------------------------------------------------------------------
  function next(): void {
    if (index < total - 1) {
      index += 1;
      render();
    }
  }

  function prev(): void {
    if (index > 0) {
      index -= 1;
      render();
    }
  }

  function first(): void {
    if (index !== 0) {
      index = 0;
      render();
    }
  }

  function last(): void {
    if (index !== total - 1) {
      index = total - 1;
      render();
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------
  function onKeyDown(event: KeyboardEvent): void {
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
  // Render
  // ---------------------------------------------------------------------------
  function render(): void {
    const song = set.songs[index];

    const wrapper = document.createElement('div');
    wrapper.className = 'slide-view';

    // Header: position indicator + song title
    const header = document.createElement('div');
    header.className = 'slide-header';

    const positionEl = document.createElement('span');
    positionEl.className = 'slide-position';
    positionEl.textContent = `${index + 1} / ${total}`;

    const titleEl = document.createElement('span');
    titleEl.className = 'slide-title';
    titleEl.textContent = song.name;

    header.appendChild(positionEl);
    header.appendChild(titleEl);

    // Body: rendered song
    const body = document.createElement('div');
    body.className = 'slide-body';
    body.appendChild(renderSong(song, { showChords: true, showLyrics: true, chordRatio: 0.8 }));

    wrapper.appendChild(header);
    wrapper.appendChild(body);

    root.replaceChildren(wrapper);
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
