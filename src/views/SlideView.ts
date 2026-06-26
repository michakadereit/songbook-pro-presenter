import type { SongSet } from '../types';
import { renderSong } from '../components/SongRenderer';

/**
 * Full-screen, one-song-at-a-time presentation view.
 *
 * DOM contract:
 *   .slide-view          — root wrapper; carries --slide-font-scale CSS property
 *     .slide-controls    — persistent toolbar (font size slider, future controls)
 *     .slide-header      — top bar with position indicator and song title
 *       .slide-position  — "n / total" indicator
 *       .slide-title     — current song name
 *     .slide-body        — holds the rendered song (.song article)
 *
 * Static structure (wrapper, controls, header) is built ONCE on mount.
 * Only the body children and header text are updated on navigation, so
 * controls retain their state (slider position, focus) across song changes.
 *
 * @returns dispose — removes the window keydown listener (call when unmounting).
 */
export function mountSlideView(root: HTMLElement, set: SongSet): () => void {
  // ---------------------------------------------------------------------------
  // Closure state
  // ---------------------------------------------------------------------------
  let index = 0;
  const total = set.songs.length;
  let fontScale = 1; // Default 100 %

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
  // Static structure — built once, survives navigation
  // ---------------------------------------------------------------------------

  const wrapper = document.createElement('div');
  wrapper.className = 'slide-view';

  // --- Controls bar (font size slider) --------------------------------------
  const controls = document.createElement('div');
  controls.className = 'slide-controls';

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
    const song = set.songs[index];

    positionEl.textContent = `${index + 1} / ${total}`;
    titleEl.textContent = song.name;
    body.replaceChildren(
      renderSong(song, { showChords: true, showLyrics: true, chordRatio: 0.8 }),
    );

    // Re-apply font scale so the CSS property is set even on the initial render
    // and is not lost when the wrapper reference changes.
    wrapper.style.setProperty('--slide-font-scale', String(fontScale));
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
