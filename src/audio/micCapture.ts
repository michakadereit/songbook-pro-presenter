/**
 * micCapture.ts — Microphone activation gate
 *
 * startMic()  : request mic access, create AudioContext + AnalyserNode,
 *               and return a MicHandle with a hard stop() gate.
 *
 * Design notes:
 * - DSP browser processing (echo cancellation, noise suppression, AGC) is
 *   disabled so that raw levels and pitch reach the analyser unmodified.
 * - stop() calls track.stop() on every MediaStreamTrack — this extinguishes
 *   the browser mic indicator. Setting track.enabled = false alone is not
 *   sufficient (the recording indicator stays on).
 */

export interface MicHandle {
  /** The AnalyserNode wired to the microphone source. */
  analyser: AnalyserNode;
  /** The underlying AudioContext. */
  context: AudioContext;
  /**
   * Stop all media tracks and close the AudioContext.
   * After this call isActive() returns false and the browser mic indicator
   * turns off.
   */
  stop(): void;
  /** Returns true while the microphone is active, false after stop(). */
  isActive(): boolean;
}

/**
 * Request microphone access and set up the Web Audio processing graph.
 *
 * Graph: MediaStreamSourceNode → AnalyserNode
 *
 * @throws If the user denies mic permission or the browser lacks support.
 */
export async function startMic(): Promise<MicHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;

  const source = context.createMediaStreamSource(stream);
  source.connect(analyser);

  let active = true;

  return {
    analyser,
    context,
    stop() {
      stream.getTracks().forEach((track) => track.stop());
      active = false;
      void context.close();
    },
    isActive() {
      return active;
    },
  };
}
