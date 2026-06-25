import type { Song } from '../types';

export interface RenderOptions {
  showChords: boolean;
  showLyrics: boolean;
  /** Font-size ratio of chords relative to lyrics (e.g. 0.8). */
  chordRatio: number;
}

/** Render a single song to a DOM element. Implementation deferred (spec-driven). */
export function renderSong(_song: Song, _options: RenderOptions): HTMLElement {
  throw new Error('renderSong not implemented yet');
}
