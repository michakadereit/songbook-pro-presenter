/**
 * levelMeter.ts — RMS-based audio level utilities
 *
 * rms          : compute root-mean-square of a sample buffer
 * rmsToBarRatio: map RMS value to a [0,1] bar ratio via dB scaling
 * readLevel    : pull a time-domain snapshot from an AnalyserNode and return its RMS
 */

/**
 * Compute the root-mean-square of a sample buffer.
 * Returns 0 for an empty buffer or an all-zero signal.
 */
export function rms(samples: Float32Array | number[]): number {
  if (samples.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i];
  }
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Map an RMS amplitude to a display bar ratio in [0, 1].
 *
 * Conversion: RMS → dB → clamp to [floorDb, 0] → linear [0, 1].
 * - rms <= 0       → 0 (silence)
 * - rms >= 1       → 1 (0 dBFS, full scale)
 * - rms at floorDb → 0
 *
 * @param rmsValue  RMS amplitude (0–1 range typical, >1 clips to 1)
 * @param floorDb   Lower dB bound (default -60 dB)
 */
export function rmsToBarRatio(rmsValue: number, floorDb = -60): number {
  if (rmsValue <= 0) return 0;
  const db = 20 * Math.log10(rmsValue);
  if (db >= 0) return 1;
  if (db <= floorDb) return 0;
  return (db - floorDb) / (0 - floorDb);
}

/**
 * Read a time-domain snapshot from an AnalyserNode and return its RMS level.
 * Uses `getFloatTimeDomainData` for full-precision samples.
 */
export function readLevel(analyser: AnalyserNode): number {
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  return rms(buf);
}
