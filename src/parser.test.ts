import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseSbp } from './parser';
import type { SongSet } from './types';

const SAMPLE = resolve(process.cwd(), 'samples/CW _ Lobpreis (21.6.2026).sbp');

async function loadSample(): Promise<Blob> {
  const buf = await readFile(SAMPLE);
  return new Blob([buf]);
}

describe('parseSbp', () => {
  let set: SongSet;

  beforeAll(async () => {
    set = await parseSbp(await loadSample());
  });

  // AC1 — ZIP entpacken & JSON lesen (Versionszeile übersprungen)
  it('parses the .sbp into a SongSet without throwing', () => {
    expect(set).toBeDefined();
    expect(Array.isArray(set.songs)).toBe(true);
  });

  // AC2 — Set-Metadaten
  it('reads set metadata (name + date)', () => {
    expect(set.name).toBe('CW | Lobpreis');
    expect(set.date).toContain('2026-06-21');
  });

  // AC3 — Song-Anzahl & Reihenfolge (nach Order)
  it('resolves 5 songs ordered by Order', () => {
    expect(set.songs).toHaveLength(5);
    expect(set.songs[0].name).toMatch(/^10000 Reasons/);
  });

  // AC4 — Gelöschte Einträge gefiltert
  it('excludes deleted songs and set contents', () => {
    // No resolved song may originate from a Deleted entry — proxy check:
    // every song has a real name and a numeric id.
    for (const song of set.songs) {
      expect(song.id).toBeTypeOf('number');
      expect(song.name.length).toBeGreaterThan(0);
    }
  });

  // AC5 — Sections geparst, Direktiven erzeugen keine Section
  it('parses section headers, ignoring non-{c} directives', () => {
    const titles = set.songs[0].sections.map((s) => s.title);
    expect(titles).toContain('Chorus');
    expect(titles).toContain('Verse 1');
    expect(titles).not.toContain('');
    // ccli_license / other directives must not become a section title
    expect(titles.some((t) => t.includes('ccli'))).toBe(false);
  });

  // AC6 — Inline-Akkorde getrennt von Lyrics
  it('separates inline chords from lyric text with correct positions', () => {
    const chorus = set.songs[0].sections.find((s) => s.title === 'Chorus')!;
    const line = chorus.lines.find((l) => l.lyrics.startsWith('Bless the'))!;
    expect(line.lyrics).not.toMatch(/[[\]]/);

    // Chords are transposed (+9), so symbols are A/E here; positions stay anchored.
    const positions = line.chords.map((c) => c.position);
    expect(positions).toContain(10);
    expect(positions).toContain(21);
    for (const c of line.chords) {
      expect(c.position).toBeLessThanOrEqual(line.lyrics.length);
    }
  });

  // AC7 — Transposition angewandt (keyOfset 9)
  it('applies set keyOfset transposition to chords', () => {
    expect(set.songs[0].keyShift).toBe(9);
    const allChords = set.songs[0].sections
      .flatMap((s) => s.lines)
      .flatMap((l) => l.chords.map((c) => c.symbol));
    // Source [C] -> A and [D/F#] -> B/D# at +9 semitones
    expect(allChords).toContain('A');
    expect(allChords).toContain('B/D#');
  });

  // AC8 — (x2) bleibt Lyric, kein Akkord
  it('keeps (x2) repetition markers as plain lyrics', () => {
    const allLines = set.songs[0].sections.flatMap((s) => s.lines);
    const repeat = allLines.find((l) => l.lyrics.trim() === '(x2)');
    expect(repeat).toBeDefined();
    expect(repeat!.chords).toHaveLength(0);
  });
});

// AC9 — Fehlerfälle
describe('parseSbp errors', () => {
  it('throws on a blob that is not a valid ZIP', async () => {
    await expect(parseSbp(new Blob(['not a zip']))).rejects.toThrow(/zip|sbp/i);
  });

  it('throws when dataFile.txt is missing from the ZIP', async () => {
    const { zipSync, strToU8 } = await import('fflate');
    const zipped = zipSync({ 'other.txt': strToU8('hello') });
    await expect(parseSbp(new Blob([zipped as Uint8Array<ArrayBuffer>]))).rejects.toThrow(
      /dataFile\.txt/i,
    );
  });
});
