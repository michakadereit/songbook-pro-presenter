import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startMic } from './micCapture';

// ─── AC5: Gate-Logik — Spy/Mock-based, kein echtes Mic ───────────────────────

describe('startMic / MicHandle', () => {
  // Reusable mock building blocks
  let mockTrackStop: ReturnType<typeof vi.fn>;
  let mockStream: MediaStream;
  let mockAnalyser: { fftSize: number };
  let mockSource: { connect: ReturnType<typeof vi.fn> };
  let mockContextClose: ReturnType<typeof vi.fn>;
  let mockContext: AudioContext;
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrackStop = vi.fn();

    // Minimal MediaStreamTrack mock (only stop() is needed)
    const mockTrack = { stop: mockTrackStop, readyState: 'live' } as unknown as MediaStreamTrack;

    // getTracks() returns our mock track
    mockStream = { getTracks: vi.fn().mockReturnValue([mockTrack]) } as unknown as MediaStream;

    mockAnalyser = { fftSize: 2048 };
    mockSource = { connect: vi.fn() };
    mockContextClose = vi.fn().mockResolvedValue(undefined);

    mockContext = {
      createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
      createMediaStreamSource: vi.fn().mockReturnValue(mockSource),
      close: mockContextClose,
      state: 'running',
    } as unknown as AudioContext;

    // AudioContext constructor mock — must be a regular function (not an arrow)
    // so that `new AudioContext()` works. A regular function returning an object
    // causes JS to use that object as the `new` result.
    vi.stubGlobal('AudioContext', function AudioContextMock() { return mockContext; });

    // getUserMedia mock — stored separately to allow assertion
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: mockGetUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── AC5-a: correct getUserMedia constraints ──────────────────────────────

  it('calls getUserMedia with DSP-off constraints (AC5)', async () => {
    await startMic();

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  });

  // ── AC5-b: active after startMic ─────────────────────────────────────────

  it('isActive() returns true immediately after startMic() (AC5)', async () => {
    const handle = await startMic();
    expect(handle.isActive()).toBe(true);
  });

  // ── AC5-c: stop() calls track.stop() ────────────────────────────────────

  it('stop() calls track.stop() on all tracks (AC5)', async () => {
    const handle = await startMic();
    handle.stop();
    expect(mockTrackStop).toHaveBeenCalledOnce();
  });

  // ── AC5-d: isActive() false after stop() ─────────────────────────────────

  it('isActive() returns false after stop() (AC5)', async () => {
    const handle = await startMic();
    handle.stop();
    expect(handle.isActive()).toBe(false);
  });

  // ── AC5-e: stop() closes AudioContext ────────────────────────────────────

  it('stop() calls context.close() to release the AudioContext', async () => {
    const handle = await startMic();
    handle.stop();
    expect(mockContextClose).toHaveBeenCalledOnce();
  });

  // ── Returned handle shape ─────────────────────────────────────────────────

  it('handle.analyser is the AnalyserNode returned by createAnalyser()', async () => {
    const handle = await startMic();
    expect(handle.analyser).toBe(mockAnalyser);
  });

  it('handle.context is the AudioContext instance', async () => {
    const handle = await startMic();
    expect(handle.context).toBe(mockContext);
  });

  it('connects the media stream source to the analyser', async () => {
    await startMic();
    expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser);
  });
});
