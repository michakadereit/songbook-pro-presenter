import { describe, it, expect } from 'vitest';
import { hzToNote, estimateKey, estimateChord } from './noteMath';

// ─── AC1: hzToNote ──────────────────────────────────────────────────────────

describe('hzToNote', () => {
  it('returns A4 for 440 Hz', () => {
    expect(hzToNote(440)).toEqual({ name: 'A', octave: 4, cents: 0 });
  });

  it('returns A5 for 880 Hz', () => {
    expect(hzToNote(880)).toEqual({ name: 'A', octave: 5, cents: 0 });
  });

  it('returns C4 for 261.63 Hz (middle C)', () => {
    const result = hzToNote(261.63);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('C');
    expect(result!.octave).toBe(4);
    // cents should be close to 0 (within a couple of cents)
    expect(Math.abs(result!.cents)).toBeLessThanOrEqual(2);
  });

  it('returns null for hz = 0', () => {
    expect(hzToNote(0)).toBeNull();
  });

  it('returns null for negative hz', () => {
    expect(hzToNote(-1)).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(hzToNote(NaN)).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(hzToNote(Infinity)).toBeNull();
  });

  it('returns correct note for E4 (329.63 Hz)', () => {
    const result = hzToNote(329.63);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('E');
    expect(result!.octave).toBe(4);
  });
});

// ─── AC2: estimateKey ────────────────────────────────────────────────────────

describe('estimateKey', () => {
  // C-major chroma: emphasize notes of C-major scale (C D E F G A B)
  // indices:         0 2 4 5 7 9 11
  const cMajorChroma = [
    6.35, 0.5, 2.0, 0.5, 4.38, 3.5, 0.5, 5.0, 0.5, 3.0, 0.5, 2.0,
  ];

  // A-minor chroma: emphasize notes of A-minor scale (A B C D E F G)
  // indices:         9 11 0 2 4 5 7
  const aMinorChroma = [
    3.5, 0.5, 2.0, 0.5, 3.0, 2.5, 0.5, 3.5, 0.5, 6.0, 0.5, 1.5,
  ];

  it('detects C major from C-major-weighted chroma', () => {
    const result = estimateKey(cMajorChroma);
    expect(result).not.toBeNull();
    expect(result!.tonic).toBe('C');
    expect(result!.mode).toBe('major');
  });

  it('detects A minor from A-minor-weighted chroma', () => {
    const result = estimateKey(aMinorChroma);
    expect(result).not.toBeNull();
    expect(result!.tonic).toBe('A');
    expect(result!.mode).toBe('minor');
  });

  it('returns null for a flat (all-equal) chroma', () => {
    const flat = new Array(12).fill(1);
    expect(estimateKey(flat)).toBeNull();
  });

  it('returns null for all-zero chroma', () => {
    const silent = new Array(12).fill(0);
    expect(estimateKey(silent)).toBeNull();
  });
});

// ─── AC3: estimateChord ──────────────────────────────────────────────────────

describe('estimateChord', () => {
  // C major triad: C(0) E(4) G(7)
  const cMajorChroma = new Array(12).fill(0);
  cMajorChroma[0] = 1; // C
  cMajorChroma[4] = 1; // E
  cMajorChroma[7] = 1; // G

  // A minor triad: A(9) C(0) E(4)
  const aMinorChroma = new Array(12).fill(0);
  aMinorChroma[9] = 1; // A
  aMinorChroma[0] = 1; // C
  aMinorChroma[4] = 1; // E

  it('detects C major chord from C-E-G chroma', () => {
    const result = estimateChord(cMajorChroma);
    expect(result).not.toBeNull();
    expect(result!.root).toBe('C');
    expect(result!.quality).toBe('major');
  });

  it('detects A minor chord from A-C-E chroma', () => {
    const result = estimateChord(aMinorChroma);
    expect(result).not.toBeNull();
    expect(result!.root).toBe('A');
    expect(result!.quality).toBe('minor');
  });

  it('returns null for a flat (all-equal) chroma', () => {
    const flat = new Array(12).fill(1);
    expect(estimateChord(flat)).toBeNull();
  });

  it('returns null for all-zero chroma', () => {
    const silent = new Array(12).fill(0);
    expect(estimateChord(silent)).toBeNull();
  });
});
