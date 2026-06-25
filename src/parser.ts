import { unzipSync } from 'fflate';
import { Chord as ChordSheetChord } from 'chordsheetjs';
import type { Song, SongSection, SongSet } from './types';
import { parseChordProLine } from './chordLine';

// Raw shapes from dataFile.txt JSON (internal, not exported)
interface RawSong {
  Id: number;
  name: string;
  author: string;
  content: string;
  key: number;
  KeyShift: number;
  Deleted?: number;
}

interface RawSetContent {
  Order: number;
  SongId: number;
  keyOfset: number;
  Deleted?: number;
}

interface RawSet {
  details: { Id: number; name: string; date: string };
  contents: RawSetContent[];
}

interface RawData {
  songs: RawSong[];
  sets: RawSet[];
  folders: unknown[];
}

/** Regex that matches a ChordPro section header: {c: Verse 1} */
const SECTION_HEADER_RE = /^\{c:\s*(.+?)\s*\}$/i;

/** Regex that matches any other ChordPro directive: {key: value} */
const DIRECTIVE_RE = /^\{[^}]+\}$/;

/**
 * Parse a ChordPro `content` string into an array of SongSections.
 *
 * Rules:
 * - `{c: Title}` starts a new section with the given title.
 * - Other `{...}` directives are silently ignored (no section, no line).
 * - Inline `[Chord]` markers are extracted: chord symbol + position in cleaned lyrics.
 * - Lines with no `[...]` tokens (e.g. `(x2)`) stay as lyrics with chords: [].
 * - Empty lines are included as blank SongLines (preserves structure).
 */
function parseContent(content: string): SongSection[] {
  const sections: SongSection[] = [];
  let currentSection: SongSection | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trimEnd(); // preserve leading whitespace, strip trailing

    // Check for section header {c: ...}
    const sectionMatch = SECTION_HEADER_RE.exec(line);
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1], lines: [] };
      sections.push(currentSection);
      continue;
    }

    // Check for any other directive and skip it entirely
    if (DIRECTIVE_RE.test(line)) {
      continue;
    }

    // Regular content line — parse inline chords
    const songLine = parseChordProLine(line);

    // Ensure there is a section to attach to (intro lines before the first header)
    if (!currentSection) {
      // Only create an implicit section when there is actual content
      if (songLine.lyrics.trim().length > 0 || songLine.chords.length > 0) {
        currentSection = { title: '', lines: [] };
        sections.push(currentSection);
      } else {
        continue; // skip leading blank lines before any section header
      }
    }

    currentSection.lines.push(songLine);
  }

  return sections;
}

/**
 * Transpose all chord symbols in a set of sections by `semitones` half-steps.
 *
 * Uses chordsheetjs for accurate enharmonic transposition.
 * If `semitones === 0`, the sections are returned untouched.
 * If a chord symbol cannot be parsed by chordsheetjs, it is left unchanged.
 */
function transposeSections(sections: SongSection[], semitones: number): SongSection[] {
  if (semitones === 0) return sections;
  return sections.map((section) => ({
    ...section,
    lines: section.lines.map((line) => ({
      ...line,
      chords: line.chords.map((chord) => {
        const parsed = ChordSheetChord.parse(chord.symbol);
        if (!parsed) return chord;
        const transposed = parsed.transpose(semitones);
        return { ...chord, symbol: transposed.toString() };
      }),
    })),
  }));
}

/**
 * Parse a Songbook Pro `.sbp` file (a ZIP containing `dataFile.txt`) into a SongSet.
 *
 * TICKET-001 scope: ZIP extraction, JSON parsing, set/song resolution.
 * ChordPro section parsing: TICKET-002.
 * Transposition: TICKET-003.
 */
export async function parseSbp(file: Blob): Promise<SongSet> {
  // 1. Read the raw bytes from the Blob.
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 2. Unzip — fflate throws if the data is not a valid ZIP.
  let unzipped: ReturnType<typeof unzipSync>;
  try {
    unzipped = unzipSync(bytes);
  } catch {
    throw new Error('Kein gültiges ZIP / .sbp-Format. Bitte eine .sbp-Datei laden.');
  }

  // 3. Locate dataFile.txt.
  const dataFileBytes = unzipped['dataFile.txt'];
  if (!dataFileBytes) {
    throw new Error('dataFile.txt nicht in der .sbp-Datei gefunden.');
  }

  // 4. Decode UTF-8, strip the version line ("1.0\n"), parse JSON.
  const raw = new TextDecoder('utf-8').decode(dataFileBytes);
  const newlineIndex = raw.indexOf('\n');
  const jsonText = newlineIndex !== -1 ? raw.slice(newlineIndex + 1) : raw;
  const data: RawData = JSON.parse(jsonText);

  // 5. Pick the first set.
  const rawSet = data.sets[0];
  if (!rawSet) {
    throw new Error('Keine Sets in der .sbp-Datei gefunden.');
  }

  // 6. Build a lookup map for songs by Id, excluding deleted songs.
  const songById = new Map<number, RawSong>();
  for (const s of data.songs) {
    if (!s.Deleted) {
      songById.set(s.Id, s);
    }
  }

  // 7. Filter and sort set contents: remove deleted entries, sort by Order.
  const activeContents = rawSet.contents
    .filter((c) => !c.Deleted)
    .sort((a, b) => a.Order - b.Order);

  // 8. Resolve each content entry to a Song (skip unresolvable IDs).
  const songs: Song[] = activeContents.flatMap((content) => {
    const rawSong = songById.get(content.SongId);
    if (!rawSong) return [];
    const song: Song = {
      id: rawSong.Id,
      name: rawSong.name,
      author: rawSong.author ?? '',
      keyShift: content.keyOfset,
      sections: transposeSections(
        parseContent(rawSong.content), // ChordPro parsing — TICKET-002
        content.keyOfset,              // Transposition — TICKET-003
      ),
    };
    return [song];
  });

  // 9. Assemble and return the SongSet.
  return {
    id: rawSet.details.Id,
    name: rawSet.details.name,
    date: rawSet.details.date,
    songs,
  };
}
