import { Chord } from 'chordsheetjs';
import type { Song } from './types';

/**
 * Return a new Song copy with every chord symbol transposed by `semitones`.
 *
 * Pure: the input `song` (and its nested sections/lines/chords) is never mutated.
 * Unparseable chord symbols are kept as-is. Reusable across views (Eagle, Slide).
 */
export function transposeSong(song: Song, semitones: number): Song {
  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => ({
        ...line,
        chords: line.chords.map((chord) => ({
          ...chord,
          symbol: transposeSymbol(chord.symbol, semitones),
        })),
      })),
    })),
  };
}

function transposeSymbol(symbol: string, semitones: number): string {
  if (semitones === 0) return symbol;
  return Chord.parse(symbol)?.transpose(semitones)?.toString() ?? symbol;
}
