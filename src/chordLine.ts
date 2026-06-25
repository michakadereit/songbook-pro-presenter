import type { Chord, SongLine } from './types';

/** Regex that matches an inline chord token: [G], [D/F#], [Csus4], [6m], [|], [(C)] */
const CHORD_TOKEN_RE = /\[([^\]]+)\]/g;

/**
 * Parse a single ChordPro line into a SongLine.
 *
 * Extracts `[Chord]` tokens: records each chord's symbol and its position
 * in the cleaned lyrics string (i.e. the offset after all previous chord
 * markers have been removed). The symbol is taken verbatim, so Nashville
 * numbers (`6m`, `1/5`), bar markers (`|`) and optional chords (`(C)`) are
 * preserved as-is. The returned `lyrics` contains no `[`/`]` markup.
 */
export function parseChordProLine(line: string): SongLine {
  const chords: Chord[] = [];
  let lyrics = '';
  let lastIndex = 0;
  let offsetReduction = 0; // total characters removed by chord tokens so far

  CHORD_TOKEN_RE.lastIndex = 0; // reset stateful global regex
  let match: RegExpExecArray | null;

  while ((match = CHORD_TOKEN_RE.exec(line)) !== null) {
    // Append the text between the previous token and this one
    lyrics += line.slice(lastIndex, match.index);
    const symbol = match[1];
    // Position in the cleaned lyrics = where we are now minus chars already removed
    const position = match.index - offsetReduction;
    chords.push({ symbol, position });
    // Account for the token we're removing: "[symbol]" = symbol.length + 2
    offsetReduction += match[0].length;
    lastIndex = match.index + match[0].length;
  }

  // Append any trailing text after the last chord token
  lyrics += line.slice(lastIndex);

  return { lyrics, chords };
}
