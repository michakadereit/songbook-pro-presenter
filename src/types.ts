// Pure data types for the Songbook Pro Presenter.
// No DOM, no parsing logic here — just the shapes the app passes around.

/** A single chord placed immediately before a syllable in a lyric line. */
export interface Chord {
  /** Chord symbol as it should be displayed, e.g. "G", "D/F#", "Csus4". */
  symbol: string;
  /** Character offset within the lyric line where the chord sits. */
  position: number;
}

/** One rendered line: lyric text plus the chords anchored within it. */
export interface SongLine {
  /** Plain lyric text with chord markers removed. May be empty (chords-only). */
  lyrics: string;
  /** Chords anchored by position into `lyrics`. */
  chords: Chord[];
}

/** A titled section of a song, e.g. "Verse 1", "Chorus". */
export interface SongSection {
  /** Section label from `{c: ...}`, e.g. "Chorus". Empty for an intro block. */
  title: string;
  lines: SongLine[];
}

/** A resolved, transposed song ready to render. */
export interface Song {
  id: number;
  name: string;
  author: string;
  /** Net semitone transposition applied (from the set's keyOfset). */
  keyShift: number;
  sections: SongSection[];
}

/** A full set: ordered list of songs as defined by an .sbp set. */
export interface SongSet {
  id: number;
  name: string;
  /** ISO date string from the set details. */
  date: string;
  songs: Song[];
}
