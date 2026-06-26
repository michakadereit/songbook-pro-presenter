/**
 * chroma.ts — Frequency-domain chroma extraction from an AnalyserNode.
 *
 * extractChroma(): maps FFT frequency bins to 12-semitone pitch classes,
 *   accumulates magnitudes per pitch class, and normalises the result.
 * smoothChroma():  exponential moving-average smoothing over successive frames.
 *
 * These are intentionally pure functions (except for the side-effect-free read
 * on AnalyserNode) so they are easy to unit-test with a mock analyser.
 */

const C0_HZ = 16.35; // frequency of C0 in Hz
const MIN_HZ = 80; // ignore sub-bass bins
const MAX_HZ = 2000; // ignore high-frequency bins (mostly noise)

/**
 * Extract a normalised 12-bin chroma vector from the analyser's frequency data.
 *
 * Algorithm:
 *  1. Read dB spectrum via getFloatFrequencyData.
 *  2. Convert each bin to linear magnitude: 10^(dB/20).
 *  3. Ignore bins outside [MIN_HZ, MAX_HZ].
 *  4. Map each bin's centre frequency to a pitch class via
 *     pc = round(12 * log2(hz / C0)) mod 12.
 *  5. Accumulate magnitudes per pitch class.
 *  6. Normalise by the maximum bin value (returns all-zero on silence).
 */
export function extractChroma(analyser: AnalyserNode, sampleRate: number): number[] {
  const binCount = analyser.frequencyBinCount;
  const buf = new Float32Array(binCount);
  analyser.getFloatFrequencyData(buf);

  const chroma = new Array<number>(12).fill(0);

  for (let i = 1; i < binCount; i++) {
    const hz = (i * sampleRate) / analyser.fftSize;
    if (hz < MIN_HZ || hz > MAX_HZ) continue;

    const db = buf[i];
    if (!isFinite(db)) continue; // -Infinity → silence, skip

    const magnitude = Math.pow(10, db / 20);
    const pc = ((Math.round(12 * Math.log2(hz / C0_HZ)) % 12) + 12) % 12;
    chroma[pc] += magnitude;
  }

  // Normalise by the maximum bin value; return zero vector on silence.
  const max = Math.max(...chroma);
  if (max === 0) return chroma;
  return chroma.map((v) => v / max);
}

/**
 * Exponential moving-average smoothing of a chroma vector.
 *
 * result[i] = alpha * next[i] + (1 - alpha) * prev[i]
 *
 * @param alpha - weight of the incoming frame (0–1, default 0.1 = slow smooth)
 */
export function smoothChroma(prev: number[], next: number[], alpha = 0.1): number[] {
  return prev.map((p, i) => alpha * next[i] + (1 - alpha) * p);
}
