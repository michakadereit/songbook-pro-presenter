import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseSbp } from './parser';
import { parseChordProFolder } from './chordproFolder';
import { songSetToSbpBlob } from './exporter';
import type { SongSet } from './types';

const SBP_FIXTURE = resolve(process.cwd(), 'samples/CW _ Lobpreis (21.6.2026).sbp');
const ONSONG_DIR = resolve(process.cwd(), 'samples/onsong');

// ---------------------------------------------------------------------------
// Test 1 — parseSbp Roundtrip
// ---------------------------------------------------------------------------
describe('songSetToSbpBlob — parseSbp Roundtrip', () => {
  let originalSet: SongSet;
  let reimportedSet: SongSet;

  beforeAll(async () => {
    const buf = await readFile(SBP_FIXTURE);
    originalSet = await parseSbp(new Blob([buf]));
    const exportedBlob = songSetToSbpBlob(originalSet);
    reimportedSet = await parseSbp(exportedBlob);
  });

  it('AC1 — songSetToSbpBlob returns a Blob that parseSbp accepts without throwing', () => {
    expect(reimportedSet).toBeDefined();
    expect(Array.isArray(reimportedSet.songs)).toBe(true);
  });

  it('AC2 — same number of songs after roundtrip', () => {
    expect(reimportedSet.songs.length).toBe(originalSet.songs.length);
  });

  it('AC2 — song names are preserved', () => {
    for (let i = 0; i < originalSet.songs.length; i++) {
      expect(reimportedSet.songs[i].name).toBe(originalSet.songs[i].name);
    }
  });

  it('AC2 — section titles and line count are preserved', () => {
    for (let i = 0; i < originalSet.songs.length; i++) {
      const origSong = originalSet.songs[i];
      const reimpSong = reimportedSet.songs[i];

      expect(reimpSong.sections.length).toBe(origSong.sections.length);

      for (let j = 0; j < origSong.sections.length; j++) {
        expect(reimpSong.sections[j].title).toBe(origSong.sections[j].title);
        expect(reimpSong.sections[j].lines.length).toBe(origSong.sections[j].lines.length);
      }
    }
  });

  it('AC2 — lyric text is preserved on every line', () => {
    for (let i = 0; i < originalSet.songs.length; i++) {
      for (let j = 0; j < originalSet.songs[i].sections.length; j++) {
        const origLines = originalSet.songs[i].sections[j].lines;
        const reimpLines = reimportedSet.songs[i].sections[j].lines;

        for (let k = 0; k < origLines.length; k++) {
          expect(reimpLines[k].lyrics).toBe(origLines[k].lyrics);
        }
      }
    }
  });

  it('AC3 — chord symbols and positions are preserved on every line', () => {
    for (let i = 0; i < originalSet.songs.length; i++) {
      for (let j = 0; j < originalSet.songs[i].sections.length; j++) {
        const origLines = originalSet.songs[i].sections[j].lines;
        const reimpLines = reimportedSet.songs[i].sections[j].lines;

        for (let k = 0; k < origLines.length; k++) {
          const origChords = origLines[k].chords;
          const reimpChords = reimpLines[k].chords;

          expect(reimpChords.length).toBe(origChords.length);

          for (let c = 0; c < origChords.length; c++) {
            expect(reimpChords[c].symbol).toBe(origChords[c].symbol);
            expect(reimpChords[c].position).toBe(origChords[c].position);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Test 2 — .chopro Roundtrip
// ---------------------------------------------------------------------------
describe('songSetToSbpBlob — .chopro Roundtrip', () => {
  let choProSet: SongSet;
  let reimportedSet: SongSet;

  beforeAll(async () => {
    const files = readdirSync(ONSONG_DIR)
      .filter((name) => name.toLowerCase().endsWith('.chopro'))
      .map((name) => {
        const bytes = readFileSync(resolve(ONSONG_DIR, name));
        return new File([bytes], name);
      });

    choProSet = await parseChordProFolder(files, 'OnSong Test');
    const exportedBlob = songSetToSbpBlob(choProSet);
    reimportedSet = await parseSbp(exportedBlob);
  });

  it('AC4 — same number of songs after .chopro → sbp → parseSbp roundtrip', () => {
    expect(reimportedSet.songs.length).toBe(choProSet.songs.length);
  });

  it('AC4 — song names are preserved', () => {
    for (let i = 0; i < choProSet.songs.length; i++) {
      expect(reimportedSet.songs[i].name).toBe(choProSet.songs[i].name);
    }
  });
});

// ---------------------------------------------------------------------------
// Test 3 — sectionsToChordPro unit (via roundtrip)
// ---------------------------------------------------------------------------
describe('songSetToSbpBlob — sectionsToChordPro unit', () => {
  const syntheticSet: SongSet = {
    id: 1,
    name: 'Synthetic Test Set',
    date: '',
    songs: [
      {
        id: 1,
        name: 'Test Song',
        author: 'Test Author',
        keyShift: 0,
        sections: [
          {
            title: 'Verse 1',
            lines: [
              {
                lyrics: 'Amazing grace',
                chords: [
                  { symbol: 'G', position: 0 },
                  { symbol: 'D', position: 8 },
                ],
              },
              {
                lyrics: 'how sweet the sound',
                chords: [{ symbol: 'Em', position: 4 }],
              },
            ],
          },
          {
            title: 'Chorus',
            lines: [
              {
                lyrics: 'Praise the Lord',
                chords: [{ symbol: 'C/E', position: 6 }],
              },
              {
                // chords-only line (empty lyrics)
                lyrics: '',
                chords: [{ symbol: 'G', position: 0 }],
              },
            ],
          },
        ],
      },
    ],
  };

  let song: SongSet['songs'][0];

  beforeAll(async () => {
    const blob = songSetToSbpBlob(syntheticSet);
    const set = await parseSbp(blob);
    song = set.songs[0];
  });

  it('section titles round-trip correctly', () => {
    expect(song.sections[0].title).toBe('Verse 1');
    expect(song.sections[1].title).toBe('Chorus');
  });

  it('lyric text round-trips correctly', () => {
    expect(song.sections[0].lines[0].lyrics).toBe('Amazing grace');
    expect(song.sections[0].lines[1].lyrics).toBe('how sweet the sound');
    expect(song.sections[1].lines[0].lyrics).toBe('Praise the Lord');
  });

  it('chord symbols and positions round-trip correctly — Verse 1 line 0', () => {
    const chords = song.sections[0].lines[0].chords;
    expect(chords).toHaveLength(2);
    expect(chords[0].symbol).toBe('G');
    expect(chords[0].position).toBe(0);
    expect(chords[1].symbol).toBe('D');
    expect(chords[1].position).toBe(8);
  });

  it('chord symbols and positions round-trip correctly — Verse 1 line 1', () => {
    const chords = song.sections[0].lines[1].chords;
    expect(chords).toHaveLength(1);
    expect(chords[0].symbol).toBe('Em');
    expect(chords[0].position).toBe(4);
  });

  it('chord symbols and positions round-trip correctly — Chorus line 0 (slash chord)', () => {
    const chords = song.sections[1].lines[0].chords;
    expect(chords).toHaveLength(1);
    expect(chords[0].symbol).toBe('C/E');
    expect(chords[0].position).toBe(6);
  });

  it('chords-only line (empty lyrics) round-trips correctly', () => {
    const line = song.sections[1].lines[1];
    expect(line.lyrics).toBe('');
    expect(line.chords).toHaveLength(1);
    expect(line.chords[0].symbol).toBe('G');
    expect(line.chords[0].position).toBe(0);
  });
});
