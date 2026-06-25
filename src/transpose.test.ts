import { describe, it, expect } from 'vitest';
import { transposeSong } from './transpose';
import type { Song } from './types';

// Minimal Song fixture with two known chords: A and D/F#
function makeSong(): Song {
  return {
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
              { symbol: 'A', position: 0 },
              { symbol: 'D/F#', position: 5 },
            ],
          },
        ],
      },
    ],
  };
}

describe('transposeSong', () => {
  it('AC3: transposes A → B and D/F# → E/G# when semitones = 2', () => {
    const original = makeSong();
    const result = transposeSong(original, 2);

    const resultChords = result.sections[0].lines[0].chords;
    expect(resultChords[0].symbol).toBe('B');
    expect(resultChords[1].symbol).toBe('E/G#');
  });

  it('AC3: does not mutate the original song', () => {
    const original = makeSong();
    transposeSong(original, 2);

    const originalChords = original.sections[0].lines[0].chords;
    expect(originalChords[0].symbol).toBe('A');
    expect(originalChords[1].symbol).toBe('D/F#');
  });

  it('AC3: semitones = 0 → identical chord symbols', () => {
    const original = makeSong();
    const result = transposeSong(original, 0);

    const resultChords = result.sections[0].lines[0].chords;
    expect(resultChords[0].symbol).toBe('A');
    expect(resultChords[1].symbol).toBe('D/F#');
  });

  it('returns a new Song object (not the same reference)', () => {
    const original = makeSong();
    const result = transposeSong(original, 2);

    expect(result).not.toBe(original);
    expect(result.sections[0]).not.toBe(original.sections[0]);
    expect(result.sections[0].lines[0]).not.toBe(original.sections[0].lines[0]);
    expect(result.sections[0].lines[0].chords[0]).not.toBe(
      original.sections[0].lines[0].chords[0],
    );
  });

  it('leaves unparseable chord symbols unchanged (no crash)', () => {
    const songWithBadChord: Song = {
      id: 2,
      name: 'Edge Song',
      author: '',
      keyShift: 0,
      sections: [
        {
          title: 'Intro',
          lines: [
            {
              lyrics: '',
              chords: [{ symbol: 'NOTACHORD!!!', position: 0 }],
            },
          ],
        },
      ],
    };

    expect(() => transposeSong(songWithBadChord, 3)).not.toThrow();
    const result = transposeSong(songWithBadChord, 3);
    expect(result.sections[0].lines[0].chords[0].symbol).toBe('NOTACHORD!!!');
  });
});
