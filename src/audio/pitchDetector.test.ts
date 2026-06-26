import { describe, it, expect } from 'vitest';
import { detectPitch, createPitchTracker } from './pitchDetector';

const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 2048;

// ─── Helper: generate a pure sine wave at the given frequency ────────────────

function sineBuffer(hz: number, size = BUFFER_SIZE): Float32Array {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE);
  }
  return buf;
}

// ─── Test 1: 440 Hz sine → valid result ──────────────────────────────────────

describe('detectPitch', () => {
  it('returns ~440 Hz with high clarity for a pure A4 sine wave', () => {
    const buf = sineBuffer(440);
    const result = detectPitch(buf, SAMPLE_RATE);
    expect(result).not.toBeNull();
    expect(result!.hz).toBeCloseTo(440, 0); // within ±0.5 Hz from rounding
    expect(Math.abs(result!.hz - 440)).toBeLessThan(5);
    expect(result!.clarity).toBeGreaterThan(0.85);
  });

  // ─── Test 2: Silence buffer → null ─────────────────────────────────────────

  it('returns null for an all-zero (silent) buffer', () => {
    const buf = new Float32Array(BUFFER_SIZE); // all zeros
    const result = detectPitch(buf, SAMPLE_RATE);
    expect(result).toBeNull();
  });

  // ─── Test 3: White noise → null (low clarity) ──────────────────────────────

  it('returns null for white noise (clarity below threshold)', () => {
    const buf = new Float32Array(BUFFER_SIZE);
    // Seeded pseudo-random to avoid flakiness
    let seed = 42;
    for (let i = 0; i < BUFFER_SIZE; i++) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      buf[i] = ((seed / 0x80000000) - 1) * 0.9; // [-0.9, 0.9]
    }
    const result = detectPitch(buf, SAMPLE_RATE);
    // Noise should either return null (low clarity) or be filtered out
    // by the clarity threshold. If pitchy happens to find something with
    // high clarity in noise, that would be surprising, but we assert null.
    expect(result).toBeNull();
  });
});

// ─── createPitchTracker().process() — mock-based test ────────────────────────

describe('createPitchTracker', () => {
  it('calls detectPitch with the analyser buffer and returns the result', () => {
    // Mock detectPitch at module level via vi.mock is complex; instead we test
    // the tracker by providing a fake AnalyserNode whose getFloatTimeDomainData
    // fills the buffer with a 440 Hz sine wave.
    const tracker = createPitchTracker();

    const buf = sineBuffer(440, BUFFER_SIZE);

    // Minimal fake AnalyserNode
    const fakeAnalyser = {
      fftSize: BUFFER_SIZE,
      getFloatTimeDomainData(out: Float32Array) {
        out.set(buf);
      },
    } as unknown as AnalyserNode;

    const result = tracker.process(fakeAnalyser, SAMPLE_RATE);
    expect(result).not.toBeNull();
    expect(result!.hz).toBeCloseTo(440, 0);
    expect(Math.abs(result!.hz - 440)).toBeLessThan(5);
    expect(result!.clarity).toBeGreaterThan(0.85);
  });

  it('returns null when the analyser provides silence', () => {
    const tracker = createPitchTracker();

    const fakeAnalyser = {
      fftSize: BUFFER_SIZE,
      getFloatTimeDomainData(out: Float32Array) {
        out.fill(0);
      },
    } as unknown as AnalyserNode;

    expect(tracker.process(fakeAnalyser, SAMPLE_RATE)).toBeNull();
  });
});
