import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseChordPro } from './chordproParser';
import { transposeSong } from './transpose';
import type { Song } from './types';

function samplePath(name: string): string {
  return resolve(process.cwd(), 'samples/onsong', name);
}

async function loadSample(name: string): Promise<string> {
  return readFile(samplePath(name), 'utf-8');
}

/** True if any visible lyric text in the song contains a raw bracket/brace char. */
function hasRawMarkup(song: Song): boolean {
  return song.sections.some((s) =>
    s.lines.some((l) => /[[\]{]/.test(l.lyrics)),
  );
}

function sectionTitles(song: Song): string[] {
  return song.sections.map((s) => s.title);
}

function allChordSymbols(song: Song): string[] {
  return song.sections.flatMap((s) => s.lines.flatMap((l) => l.chords.map((c) => c.symbol)));
}

describe('parseChordPro', () => {
  // AC1 — .chopro → Song (Metadaten + Sections + Akkorde)
  describe('AC1 — Build My Life (metadata + sections + chords)', () => {
    let song: Song;
    beforeAll(async () => {
      song = parseChordPro(await loadSample('Build My Life.chopro'));
    });

    it('reads the title from {title:}', () => {
      expect(song.name).toBe('Build My Life');
    });

    it('reads the author from {artist:}', () => {
      expect(song.author.length).toBeGreaterThan(0);
      expect(song.author).toContain('Matt Redman');
    });

    it('produces sections including Verse 1, Chorus and Bridge', () => {
      const titles = sectionTitles(song);
      expect(titles).toContain('Verse 1');
      expect(titles).toContain('Chorus');
      expect(titles).toContain('Bridge');
    });

    it('has at least one inline chord with a numeric position', () => {
      const chords = song.sections.flatMap((s) => s.lines.flatMap((l) => l.chords));
      expect(chords.length).toBeGreaterThan(0);
      const g = chords.find((c) => c.symbol === 'G');
      expect(g).toBeDefined();
      expect(typeof g!.position).toBe('number');
    });

    it('leaves no [ ] { markup in the visible lyric text', () => {
      expect(hasRawMarkup(song)).toBe(false);
    });
  });

  // AC2 — Header ohne Doppelpunkt
  describe('AC2 — SCHÖNHEIT (headers without colon)', () => {
    let song: Song;
    beforeAll(async () => {
      song = parseChordPro(await loadSample('SCHÖNHEIT.chopro'));
    });

    it('detects colon-less headers Verse 1, Chorus, Verse 2', () => {
      const titles = sectionTitles(song);
      expect(titles).toContain('Verse 1');
      expect(titles).toContain('Chorus');
      expect(titles).toContain('Verse 2');
    });
  });

  // AC3 — Direktiven sind Metadaten, keine Lyrics
  describe('AC3 — directives are metadata, not lyrics', () => {
    it('never emits a lyric line starting with {', async () => {
      const song = parseChordPro(await loadSample('Build My Life.chopro'));
      const startsWithBrace = song.sections.some((s) =>
        s.lines.some((l) => l.lyrics.trimStart().startsWith('{')),
      );
      expect(startsWithBrace).toBe(false);
    });
  });

  // AC4 — Akkordlose Songs
  describe('AC4 — King Of Glory (lyrics only)', () => {
    let song: Song;
    beforeAll(async () => {
      song = parseChordPro(await loadSample('King Of Glory.chopro'));
    });

    it('parses without throwing and has sections with lyric lines', () => {
      expect(song.sections.length).toBeGreaterThan(0);
      const lyricLines = song.sections.flatMap((s) => s.lines);
      expect(lyricLines.length).toBeGreaterThan(0);
    });

    it('has empty chords arrays on every line', () => {
      const chords = allChordSymbols(song);
      expect(chords).toHaveLength(0);
    });
  });

  // AC5 — Nashville-/Sondertokens
  describe('AC5 — SCHÖNHEIT Nashville/special tokens', () => {
    let song: Song;
    beforeAll(async () => {
      song = parseChordPro(await loadSample('SCHÖNHEIT.chopro'));
    });

    it('keeps Nashville symbols 6m, 4 and 1/5 verbatim', () => {
      const symbols = allChordSymbols(song);
      expect(symbols).toContain('6m');
      expect(symbols).toContain('4');
      expect(symbols).toContain('1/5');
    });

    // Nashville-aware transposition is explicitly out of scope (spec "Out of
    // Scope"). The real contract here is only that transposeSong does not crash
    // on a song full of Nashville numbers and bar tokens. (Note: this version of
    // chordsheetjs actually does parse numerals like 6m and shifts them, e.g.
    // 6m -> 7m; that behaviour is acceptable and not asserted on either way.)
    it('transposeSong does not throw on a Nashville-numbered song', () => {
      expect(() => transposeSong(song, 2)).not.toThrow();
      expect(() => transposeSong(song, -5)).not.toThrow();
    });
  });

  // Special tokens from Build My Life: [|] and [(C)]
  describe('special tokens [|] and [(C)]', () => {
    let song: Song;
    beforeAll(async () => {
      song = parseChordPro(await loadSample('Build My Life.chopro'));
    });

    it('keeps the bar token | and optional-chord token (C) as symbols', () => {
      const symbols = allChordSymbols(song);
      expect(symbols).toContain('|');
      expect(symbols).toContain('(C)');
    });
  });

  // fallbackName behaviour
  describe('fallbackName', () => {
    it('uses fallbackName when there is no {title:}', () => {
      const song = parseChordPro('Verse 1\nHello world', 'My Fallback');
      expect(song.name).toBe('My Fallback');
    });

    it('defaults name to empty string when neither title nor fallback present', () => {
      const song = parseChordPro('Verse 1\nHello world');
      expect(song.name).toBe('');
    });
  });

  // Section labels with an alphanumeric suffix (e.g. OnSong "Verse 1a:")
  describe('alphanumeric section labels', () => {
    it('recognises "Verse 1a:" / "Verse 1b:" as section headers, not lyrics', () => {
      const song = parseChordPro('Verse 1a:\nYou are Alpha\nVerse 1b:\nYou are Omega');
      const titles = song.sections.map((s) => s.title);
      expect(titles).toContain('Verse 1a');
      expect(titles).toContain('Verse 1b');
      // The header line must not leak into the lyrics.
      const lyrics = song.sections.flatMap((s) => s.lines.map((l) => l.lyrics));
      expect(lyrics).not.toContain('Verse 1a:');
    });
  });
});
