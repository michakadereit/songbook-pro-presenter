/**
 * pitchDetector.ts — Pitch detection wrapper around pitchy
 *
 * detectPitch()       : one-shot pitch detection from a Float32Array buffer.
 *                       Returns null when clarity < 0.85 or hz <= 0.
 *
 * createPitchTracker(): stateful wrapper that owns a PitchDetector instance
 *                       sized to the analyser's fftSize and calls detectPitch
 *                       on each process() call.
 */

import { PitchDetector } from 'pitchy';

export interface PitchResult {
  hz: number;
  clarity: number;
}

const CLARITY_THRESHOLD = 0.85;

/**
 * Detect the fundamental pitch in a Float32Array audio buffer.
 *
 * @param buffer     - Time-domain samples (e.g. from AnalyserNode.getFloatTimeDomainData)
 * @param sampleRate - Audio context sample rate in Hz
 * @returns PitchResult with hz and clarity, or null when the signal is too noisy / silent.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): PitchResult | null {
  const detector = PitchDetector.forFloat32Array(buffer.length);
  const [hz, clarity] = detector.findPitch(buffer, sampleRate);
  if (clarity < CLARITY_THRESHOLD || hz <= 0) return null;
  return { hz, clarity };
}

/**
 * Create a stateful pitch tracker that re-uses a single PitchDetector instance
 * across process() calls. The detector is (re-)created on the first call or
 * when the analyser's fftSize changes.
 */
export function createPitchTracker(): {
  process(analyser: AnalyserNode, sampleRate: number): PitchResult | null;
} {
  let detector: PitchDetector<Float32Array<ArrayBuffer>> | null = null;
  let detectorSize = 0;
  let buffer: Float32Array<ArrayBuffer> | null = null;

  return {
    process(analyser: AnalyserNode, sampleRate: number): PitchResult | null {
      const size = analyser.fftSize;

      // (Re-)create detector and buffer if fftSize changed
      if (detector === null || size !== detectorSize) {
        detector = PitchDetector.forFloat32Array(size);
        buffer = new Float32Array(size) as Float32Array<ArrayBuffer>;
        detectorSize = size;
      }

      analyser.getFloatTimeDomainData(buffer!);

      const [hz, clarity] = detector.findPitch(buffer!, sampleRate);
      if (clarity < CLARITY_THRESHOLD || hz <= 0) return null;
      return { hz, clarity };
    },
  };
}
