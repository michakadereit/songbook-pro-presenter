import { describe, it, expect, vi } from 'vitest';
import { rms, rmsToBarRatio, readLevel } from './levelMeter';

// ─── AC4: rms ────────────────────────────────────────────────────────────────

describe('rms', () => {
  it('returns 0 for silence (all zeros — number[])', () => {
    expect(rms([0, 0, 0])).toBe(0);
  });

  it('returns 0 for silence (all zeros — Float32Array)', () => {
    expect(rms(new Float32Array([0, 0, 0]))).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(rms([])).toBe(0);
  });

  it('returns ~0.707 for a full-swing sine wave (AC4)', () => {
    // sin(x) with amplitude 1: RMS = 1/√2 ≈ 0.7071
    const N = 1024;
    const samples = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      samples[i] = Math.sin((2 * Math.PI * i) / N);
    }
    expect(rms(samples)).toBeCloseTo(1 / Math.SQRT2, 3);
  });

  it('returns 1 for an all-ones signal', () => {
    expect(rms([1, 1, 1])).toBeCloseTo(1, 5);
  });

  it('works symmetrically with negative values', () => {
    // RMS of [-1, -1, -1] should also be 1
    expect(rms([-1, -1, -1])).toBeCloseTo(1, 5);
  });
});

// ─── AC4: rmsToBarRatio ──────────────────────────────────────────────────────

describe('rmsToBarRatio', () => {
  it('returns 0 for rms === 0', () => {
    expect(rmsToBarRatio(0)).toBe(0);
  });

  it('returns 0 for negative rms', () => {
    expect(rmsToBarRatio(-1)).toBe(0);
  });

  it('returns 1 for rms === 1 (0 dBFS)', () => {
    expect(rmsToBarRatio(1)).toBe(1);
  });

  it('clamps to 1 for rms > 1 (above 0 dBFS)', () => {
    expect(rmsToBarRatio(2)).toBe(1);
  });

  it('returns a value in [0,1] for a typical mid-level signal', () => {
    const ratio = rmsToBarRatio(0.1);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });

  it('is monotonically increasing with the signal level (AC4)', () => {
    const levels = [0.001, 0.01, 0.1, 0.5, 1.0];
    const ratios = levels.map((v) => rmsToBarRatio(v));
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
    }
  });

  it('uses default floorDb of -60 dB', () => {
    // rms = 0.001 → 20*log10(0.001) = -60 dB → at floor → ratio = 0
    expect(rmsToBarRatio(0.001)).toBeCloseTo(0, 5);
  });

  it('accepts a custom floorDb', () => {
    // rms = 0.1 → -20 dB; with floorDb=-20 that is exactly at floor → ratio ≈ 0
    const ratio = rmsToBarRatio(0.1, -20);
    expect(ratio).toBeCloseTo(0, 5);
  });
});

// ─── readLevel ───────────────────────────────────────────────────────────────

describe('readLevel', () => {
  it('calls getFloatTimeDomainData and returns the RMS of the buffer', () => {
    const fftSize = 2048;
    const mockAnalyser = {
      fftSize,
      getFloatTimeDomainData: vi.fn((buf: Float32Array) => {
        buf.fill(0.5);
      }),
    } as unknown as AnalyserNode;

    const level = readLevel(mockAnalyser);

    expect(mockAnalyser.getFloatTimeDomainData).toHaveBeenCalledOnce();
    // RMS of all-0.5 = 0.5
    expect(level).toBeCloseTo(0.5, 5);
  });

  it('returns 0 when getFloatTimeDomainData fills buffer with zeros', () => {
    const mockAnalyser = {
      fftSize: 512,
      getFloatTimeDomainData: vi.fn((buf: Float32Array) => {
        buf.fill(0);
      }),
    } as unknown as AnalyserNode;

    expect(readLevel(mockAnalyser)).toBe(0);
  });
});
