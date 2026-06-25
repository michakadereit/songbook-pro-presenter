import type { Song, SongSection } from './types';
import { parseChordProLine } from './chordLine';

/** Matches a `{key: value}` directive line, capturing key and value. */
const DIRECTIVE_RE = /^\{\s*([^:}]+?)\s*:\s*([\s\S]*?)\s*\}$/;

/**
 * Matches a section header in either OnSong style — with or without a trailing
 * colon — e.g. "Verse 1:", "Chorus", "Pre-Chorus 2:", "Strophe 3".
 *
 * Known keywords (EN + DE), optionally followed by a number, optionally a colon.
 * The whole line must consist only of the header (no further lyric text), which
 * keeps lyric lines that merely start with such a word from being misread.
 */
const SECTION_HEADER_RE =
  /^(verse|chorus|bridge|intro|outro|pre[-\s]?chorus|prechorus|tag|ending|interlude|instrumental|misc|refrain|vers|strophe|pre|teil)(?:\s+([0-9]+))?\s*:?\s*$/i;

/** Canonical display titles for the recognised keywords. */
const CANONICAL_TITLE: Record<string, string> = {
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  intro: 'Intro',
  outro: 'Outro',
  prechorus: 'Pre-Chorus',
  tag: 'Tag',
  ending: 'Ending',
  interlude: 'Interlude',
  instrumental: 'Instrumental',
  misc: 'Misc',
  refrain: 'Refrain',
  vers: 'Vers',
  strophe: 'Strophe',
  pre: 'Pre',
  teil: 'Teil',
};

/** Normalise a matched keyword to its canonical-title lookup key. */
function keywordKey(raw: string): string {
  const lower = raw.toLowerCase();
  if (/^pre[-\s]?chorus$/.test(lower) || lower === 'prechorus') return 'prechorus';
  return lower;
}

/** Build the cleaned section title, e.g. "Verse 1" or "Chorus". */
function sectionTitle(keyword: string, number: string | undefined): string {
  const base = CANONICAL_TITLE[keywordKey(keyword)] ?? keyword;
  return number ? `${base} ${number}` : base;
}

/** Pick the author: {artist:} wins, else {subtitle:}, else "". */
function resolveAuthor(meta: Map<string, string>): string {
  return meta.get('artist') ?? meta.get('subtitle') ?? '';
}

/**
 * Parse a single OnSong/ChordPro text file into a `Song`.
 *
 * - `{key: value}` directives become metadata and never emit a lyric line.
 * - Section headers (both `Verse 1:` and `Verse 1` styles) start a new section.
 * - Every other non-empty line is a lyric line of the current section; inline
 *   `[...]` tokens are lifted out as chords (Nashville numbers, `[|]`, `[(C)]`
 *   are kept verbatim). Lyric text never contains `[`/`]`/`{`.
 * - Lyrics appearing before the first header live in an implicit `title: ''`
 *   section.
 *
 * `id` and `keyShift` are 0 here; the folder loader assigns the real id.
 */
export function parseChordPro(text: string, fallbackName?: string): Song {
  const meta = new Map<string, string>();
  const sections: SongSection[] = [];
  let current: SongSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (line.trim().length === 0) continue; // blank line — separator, ignore

    const directive = DIRECTIVE_RE.exec(line.trim());
    if (directive) {
      meta.set(directive[1].toLowerCase(), directive[2]);
      continue;
    }

    const header = SECTION_HEADER_RE.exec(line.trim());
    if (header) {
      current = { title: sectionTitle(header[1], header[2]), lines: [] };
      sections.push(current);
      continue;
    }

    // Regular lyric line — split out inline chords.
    const songLine = parseChordProLine(line);
    if (!current) {
      current = { title: '', lines: [] };
      sections.push(current);
    }
    current.lines.push(songLine);
  }

  return {
    id: 0,
    name: meta.get('title') ?? fallbackName ?? '',
    author: resolveAuthor(meta),
    keyShift: 0,
    sections,
  };
}
