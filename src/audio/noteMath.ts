export interface NoteResult { name: string; octave: number; cents: number }
export type Mode = 'major' | 'minor';
export interface KeyResult { tonic: string; mode: Mode }
export interface ChordResult { root: string; quality: Mode }

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// ─── Krumhansl-Schmuckler key profiles ───────────────────────────────────────

const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Chord tones relative to root (semitone offsets)
const MAJOR_INTERVALS = [0, 4, 7]; // root, major third, perfect fifth
const MINOR_INTERVALS = [0, 3, 7]; // root, minor third, perfect fifth

const KEY_THRESHOLD = 0.1;
const CHORD_THRESHOLD = 0.1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Pearson product-moment correlation between two equal-length arrays. */
function pearson(x: number[], y: number[]): number {
  const n = x.length;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n;
  my /= n;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  const denom = Math.sqrt(varX) * Math.sqrt(varY);
  if (denom === 0) return 0;
  return cov / denom;
}

/** Build a binary 12-element chord template for the given root and intervals. */
function chordTemplate(root: number, intervals: number[]): number[] {
  const t = new Array<number>(12).fill(0);
  for (const iv of intervals) t[(root + iv) % 12] = 1;
  return t;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert a frequency in Hz to the nearest MIDI note.
 * Returns null for invalid (zero, negative, non-finite) input.
 */
export function hzToNote(hz: number): NoteResult | null {
  if (hz <= 0 || !isFinite(hz)) return null;
  const midi = 69 + 12 * Math.log2(hz / 440);
  const midiRound = Math.round(midi);
  const name = NOTE_NAMES[((midiRound % 12) + 12) % 12];
  const octave = Math.floor(midiRound / 12) - 1;
  const cents = Math.round((midi - midiRound) * 100);
  return { name, octave, cents };
}

/**
 * Estimate the musical key from a 12-element chroma vector using the
 * Krumhansl-Schmuckler algorithm (Pearson correlation with key profiles).
 * Returns null for flat or silent chroma.
 */
export function estimateKey(chroma: number[]): KeyResult | null {
  let bestCorr = -Infinity;
  let bestTonic = 0;
  let bestMode: Mode = 'major';

  for (let t = 0; t < 12; t++) {
    // Rotate the KS profile so that position t aligns with the profile's tonic (index 0).
    const majorProfile = Array.from({ length: 12 }, (_, i) => KS_MAJOR[(i - t + 12) % 12]);
    const minorProfile = Array.from({ length: 12 }, (_, i) => KS_MINOR[(i - t + 12) % 12]);

    const corrMajor = pearson(chroma, majorProfile);
    const corrMinor = pearson(chroma, minorProfile);

    if (corrMajor > bestCorr) { bestCorr = corrMajor; bestTonic = t; bestMode = 'major'; }
    if (corrMinor > bestCorr) { bestCorr = corrMinor; bestTonic = t; bestMode = 'minor'; }
  }

  if (bestCorr <= KEY_THRESHOLD) return null;
  return { tonic: NOTE_NAMES[bestTonic], mode: bestMode };
}

/**
 * Estimate the sounding chord from a 12-element chroma vector by matching
 * major/minor triad templates via Pearson correlation.
 * Returns null when no clear peak is found (flat/silent chroma).
 */
export function estimateChord(chroma: number[]): ChordResult | null {
  let bestScore = -Infinity;
  let bestRoot = 0;
  let bestQuality: Mode = 'major';

  for (let r = 0; r < 12; r++) {
    const scoreMajor = pearson(chroma, chordTemplate(r, MAJOR_INTERVALS));
    const scoreMinor = pearson(chroma, chordTemplate(r, MINOR_INTERVALS));

    if (scoreMajor > bestScore) { bestScore = scoreMajor; bestRoot = r; bestQuality = 'major'; }
    if (scoreMinor > bestScore) { bestScore = scoreMinor; bestRoot = r; bestQuality = 'minor'; }
  }

  if (bestScore <= CHORD_THRESHOLD) return null;
  return { root: NOTE_NAMES[bestRoot], quality: bestQuality };
}
