import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// No real DOM mic / AudioContext under jsdom → mock the audio layer.

const stopSpy = vi.fn();

const fakeHandle = {
  analyser: {} as AnalyserNode,
  context: {} as AudioContext,
  stop: stopSpy,
  isActive: () => true,
};

const startMicMock = vi.fn(async () => fakeHandle);

vi.mock('../audio/micCapture', () => ({
  startMic: () => startMicMock(),
}));

vi.mock('../audio/levelMeter', () => ({
  readLevel: vi.fn(() => 0),
  rmsToBarRatio: vi.fn(() => 0),
}));

import { createListenerPanel } from './ListenerPanel';

/** Flush pending microtasks so the async startMic() resolves. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('createListenerPanel', () => {
  beforeEach(() => {
    startMicMock.mockClear();
    stopSpy.mockClear();
  });

  // ─── AC6: Initial state ──────────────────────────────────────────────────
  it('starts inactive: aria-pressed="false" and empty readouts', () => {
    const panel = createListenerPanel();
    const toggle = panel.el.querySelector<HTMLButtonElement>('[data-role="toggle"]')!;

    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    const readouts = panel.el.querySelectorAll('.listener-readout__value');
    expect(readouts.length).toBe(3);
    readouts.forEach((r) => expect(r.textContent).toBe('—'));

    panel.dispose();
  });

  // ─── Activation ──────────────────────────────────────────────────────────
  it('activates on toggle click: aria-pressed="true" and startMic called', async () => {
    const panel = createListenerPanel();
    const toggle = panel.el.querySelector<HTMLButtonElement>('[data-role="toggle"]')!;

    toggle.click();
    await flush();

    expect(startMicMock).toHaveBeenCalledOnce();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    panel.dispose();
  });

  // ─── Deactivation ────────────────────────────────────────────────────────
  it('deactivates on second click: aria-pressed="false" and stop called', async () => {
    const panel = createListenerPanel();
    const toggle = panel.el.querySelector<HTMLButtonElement>('[data-role="toggle"]')!;

    toggle.click();
    await flush();
    toggle.click();
    await flush();

    expect(stopSpy).toHaveBeenCalledOnce();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    panel.dispose();
  });

  // ─── Public setters ──────────────────────────────────────────────────────
  it('exposes setNote/setKey/setChord that update the readouts', () => {
    const panel = createListenerPanel();

    panel.setNote('A4');
    panel.setKey('G-Dur');
    panel.setChord('Em');

    expect(panel.el.querySelector('[data-field="note"]')!.textContent).toBe('A4');
    expect(panel.el.querySelector('[data-field="key"]')!.textContent).toBe('G-Dur');
    expect(panel.el.querySelector('[data-field="chord"]')!.textContent).toBe('Em');

    panel.dispose();
  });
});
