import { describe, it, expect } from 'vitest';
import { extractChroma, smoothChroma } from './chroma';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const SAMPLE_RATE = 44100;
const FFT_SIZE = 2048;

/** Place a dB value at the bin nearest to the given frequency. */
function setFreqBin(buf: Float32Array, hz: number, dbVal: number): void {
  const binIndex = Math.round((hz * FFT_SIZE) / SAMPLE_RATE);
  if (binIndex < buf.length) buf[binIndex] = dbVal;
}

function makeFakeAnalyser(fillFn?: (buf: Float32Array) => void) {
  return {
    fftSize: FFT_SIZE,
    frequencyBinCount: FFT_SIZE / 2, // 1024
    getFloatFrequencyData: (buf: Float32Array) => {
      buf.fill(-Infinity); // silence by default
      fillFn?.(buf);
    },
  } as unknown as AnalyserNode;
}

// ─── AC1: extractChroma — C-major triad ──────────────────────────────────────

describe('extractChroma', () => {
  it('returns elevated bins for C(0), E(4), G(7) given a C-major triad spectrum', () => {
    const analyser = makeFakeAnalyser((buf) => {
      setFreqBin(buf, 261.6, -20); // C4 → pitch class 0
      setFreqBin(buf, 329.6, -20); // E4 → pitch class 4
      setFreqBin(buf, 392.0, -20); // G4 → pitch class 7
    });

    const chroma = extractChroma(analyser, SAMPLE_RATE);
    expect(chroma).toHaveLength(12);

    const c = chroma[0];
    const e = chroma[4];
    const g = chroma[7];

    // All three triad tones must be elevated
    expect(c).toBeGreaterThan(0);
    expect(e).toBeGreaterThan(0);
    expect(g).toBeGreaterThan(0);

    // Non-triad bins must not exceed the triad bins' maximum
    const triadMax = Math.max(c, e, g);
    for (let i = 0; i < 12; i++) {
      if (i !== 0 && i !== 4 && i !== 7) {
        expect(chroma[i]).toBeLessThanOrEqual(triadMax);
      }
    }
  });

  // ─── AC2: silence → zero vector ────────────────────────────────────────────

  it('returns a zero vector when all frequency bins are -Infinity (silence)', () => {
    const analyser = makeFakeAnalyser(); // default: all -Infinity

    const chroma = extractChroma(analyser, SAMPLE_RATE);
    expect(chroma).toHaveLength(12);
    for (const v of chroma) {
      expect(v).toBe(0);
    }
  });
});

// ─── AC3: smoothChroma — EMA ─────────────────────────────────────────────────

describe('smoothChroma', () => {
  it('applies EMA: alpha * next + (1-alpha) * prev, default alpha=0.1', () => {
    const prev = new Array<number>(12).fill(0);
    const next = new Array<number>(12).fill(1);
    const result = smoothChroma(prev, next, 0.1);

    expect(result).toHaveLength(12);
    for (const v of result) {
      expect(v).toBeCloseTo(0.1, 10);
    }
  });

  it('uses default alpha of 0.1 when omitted', () => {
    const prev = new Array<number>(12).fill(0);
    const next = new Array<number>(12).fill(1);
    const result = smoothChroma(prev, next);

    for (const v of result) {
      expect(v).toBeCloseTo(0.1, 10);
    }
  });

  it('returns next unchanged when alpha=1', () => {
    const prev = new Array<number>(12).fill(0);
    const next = new Array<number>(12).fill(0.8);
    const result = smoothChroma(prev, next, 1);

    for (const v of result) {
      expect(v).toBeCloseTo(0.8, 10);
    }
  });
});
