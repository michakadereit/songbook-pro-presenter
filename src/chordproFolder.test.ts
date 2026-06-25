import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseChordProFolder } from './chordproFolder';
import type { SongSet } from './types';

const ONSONG_DIR = resolve(process.cwd(), 'samples/onsong');

/** Read a file from samples/onsong/ and wrap in a File object. */
async function loadFile(filename: string): Promise<File> {
  const buf = await readFile(resolve(ONSONG_DIR, filename));
  return new File([buf], filename);
}

/** Load ALL files from samples/onsong/ as File objects. */
async function loadAllFiles(): Promise<File[]> {
  const entries = await readdir(ONSONG_DIR);
  return Promise.all(entries.map(loadFile));
}

/** Load only .xml files from samples/onsong/ as File objects. */
async function loadXmlFiles(): Promise<File[]> {
  const entries = await readdir(ONSONG_DIR);
  const xmlEntries = entries.filter((e) => e.toLowerCase().endsWith('.xml'));
  return Promise.all(xmlEntries.map(loadFile));
}

// AC6 — Ordner → SongSet
describe('parseChordProFolder — AC6: folder with mixed files', () => {
  let set: SongSet;

  beforeAll(async () => {
    const files = await loadAllFiles();
    set = await parseChordProFolder(files, 'onsong');
  });

  it('returns exactly 23 songs (only .chopro files, .xml ignored)', () => {
    expect(set.songs).toHaveLength(23);
  });

  it('uses the provided folderName as set.name', () => {
    expect(set.name).toBe('onsong');
  });

  it('sorts songs alphabetically by filename', () => {
    const names = set.songs.map((s) => s.name);
    // "Alpha And Omega" (from "Alpha And Omega.chopro") should come first
    // "Wir lieben Deinen Namen" (from "Wir lieben Deinen Namen.chopro") should come last
    const alphaIndex = names.findIndex((n) => n.includes('Alpha'));
    const wirIndex = names.findIndex((n) => n.includes('Wir lieben'));
    expect(alphaIndex).toBe(0);
    expect(wirIndex).toBe(22);
  });

  it('assigns sequential ids to songs (0-based index)', () => {
    set.songs.forEach((song, i) => {
      expect(song.id).toBe(i);
    });
  });

  it('songs have meaningful name fields (from parseChordPro {title:} or filename)', () => {
    for (const song of set.songs) {
      expect(typeof song.name).toBe('string');
      expect(song.name.length).toBeGreaterThan(0);
    }
    // Spot-check: "Build My Life.chopro" → name "Build My Life" (from {title:})
    const buildMyLife = set.songs.find((s) => s.name === 'Build My Life');
    expect(buildMyLife).toBeDefined();
  });

  it('songs have keyShift 0 (no transposition applied)', () => {
    for (const song of set.songs) {
      expect(song.keyShift).toBe(0);
    }
  });

  it('set.date is empty string', () => {
    expect(set.date).toBe('');
  });

  it('set.id is 0', () => {
    expect(set.id).toBe(0);
  });
});

// AC7 — Only .xml files → empty songs array
describe('parseChordProFolder — AC7: only .xml files', () => {
  let set: SongSet;

  beforeAll(async () => {
    const files = await loadXmlFiles();
    set = await parseChordProFolder(files, 'onsong-xml');
  });

  it('returns 0 songs when only .xml files are provided', () => {
    expect(set.songs).toHaveLength(0);
  });

  it('still returns a valid SongSet with correct structure', () => {
    expect(set.name).toBe('onsong-xml');
    expect(set.date).toBe('');
    expect(set.id).toBe(0);
    expect(Array.isArray(set.songs)).toBe(true);
  });
});

// Fallback: no folderName provided → uses "OnSong"
describe('parseChordProFolder — folderName fallback', () => {
  it('falls back to "OnSong" when no folderName is provided and File has no webkitRelativePath', async () => {
    const files = await loadXmlFiles(); // empty result, but tests the name fallback
    const set = await parseChordProFolder(files);
    expect(set.name).toBe('OnSong');
  });
});
