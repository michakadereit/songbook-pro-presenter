import { zipSync } from 'fflate';
import type { SongSection, SongSet } from './types';

/**
 * Convert an array of SongSections back to a ChordPro-format string.
 *
 * Rules:
 * - Non-empty section titles emit a `{c: Title}` header line.
 * - Empty titles (intro content before any header) emit no header.
 * - For each SongLine, chord markers `[Symbol]` are inserted from back to front
 *   so earlier position offsets remain stable during insertion.
 * - Sections are separated by a blank line.
 */
function sectionsToChordPro(sections: SongSection[]): string {
  const sectionStrings = sections.map((section) => {
    const lines: string[] = [];

    if (section.title) {
      lines.push(`{c: ${section.title}}`);
    }

    for (const line of section.lines) {
      // Sort chords from back to front to keep earlier position offsets stable.
      // For chords at the same position, sort by descending original index so
      // that the last chord in the original is inserted first — this ensures
      // the first chord in the original ends up first in the output string.
      const sortedChords = line.chords
        .map((chord, origIdx) => ({ chord, origIdx }))
        .sort((a, b) =>
          b.chord.position !== a.chord.position
            ? b.chord.position - a.chord.position
            : b.origIdx - a.origIdx,
        )
        .map(({ chord }) => chord);

      let lineText = line.lyrics;
      for (const chord of sortedChords) {
        const pos = chord.position;
        lineText = lineText.slice(0, pos) + `[${chord.symbol}]` + lineText.slice(pos);
      }

      lines.push(lineText);
    }

    return lines.join('\n');
  });

  // Join with a single newline: the blank SongLines that separate sections in
  // the original content are already part of the serialised section strings, so
  // no extra separator is needed between sections.
  return sectionStrings.join('\n');
}

/**
 * Serialize a `SongSet` into a `.sbp`-compatible `Blob` (ZIP archive).
 *
 * The chords stored in `set.songs[*].sections` are already at the target key
 * (transposition was applied when the SongSet was originally parsed). Therefore
 * `keyOfset` is stored as 0 in the set contents to avoid double transposition
 * when the resulting file is re-imported via `parseSbp`.
 *
 * Song IDs are assigned as 1-based sequential integers to guarantee uniqueness,
 * regardless of the original `song.id` values.
 */
export function songSetToSbpBlob(set: SongSet): Blob {
  const rawData = {
    songs: set.songs.map((song, i) => ({
      Id: i + 1,
      name: song.name,
      author: song.author,
      content: sectionsToChordPro(song.sections),
      key: 1,
      KeyShift: song.keyShift,
      Capo: 0,
      timeSig: '4/4',
      TempoInt: 120,
    })),
    sets: [
      {
        details: {
          Id: set.id || 1,
          name: set.name,
          date: set.date || '',
        },
        contents: set.songs.map((_song, i) => ({
          Order: i,
          SongId: i + 1,
          // keyOfset is 0 because the chord content is already transposed.
          keyOfset: 0,
        })),
      },
    ],
    folders: [],
  };

  const jsonText = '1.0\n' + JSON.stringify(rawData);
  const utf8Bytes = new TextEncoder().encode(jsonText);
  const emptyBytes = new Uint8Array(0);

  const zipped = zipSync({
    'dataFile.txt': utf8Bytes,
    'dataFile.hash': emptyBytes,
  });

  return new Blob([zipped], { type: 'application/zip' });
}
