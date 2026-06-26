/**
 * ListenerPanel.ts — Sidecar UI for live audio detection
 *
 * createListenerPanel() returns a small, self-contained panel:
 *   - a microphone activation toggle (aria-pressed reflects state)
 *   - an animated level bar (driven by the CSS var --level)
 *   - three readout fields: Note / Tonart / Akkord (placeholders until
 *     TICKET-004/005 feed real values via setNote/setKey/setChord)
 *
 * The panel is format- and view-agnostic and mounts additively in the shell;
 * it never touches the song views. dispose() stops the mic and the rAF loop,
 * mirroring the View dispose() convention used elsewhere in the project.
 */

import { startMic, type MicHandle } from '../audio/micCapture';
import { readLevel, rmsToBarRatio } from '../audio/levelMeter';
import { createPitchTracker } from '../audio/pitchDetector';
import { hzToNote, estimateKey, NOTE_NAMES } from '../audio/noteMath';

export interface ListenerPanel {
  /** Root element to mount into the shell. */
  el: HTMLElement;
  /** Set the detected note readout (e.g. "A4"). */
  setNote(value: string): void;
  /** Set the detected key readout (e.g. "G-Dur"). */
  setKey(value: string): void;
  /** Set the detected chord readout (e.g. "Em"). */
  setChord(value: string): void;
  /** Stop the mic + rAF loop and detach all listeners. */
  dispose(): void;
}

const EMPTY = '—';

const TOGGLE_LABEL_IDLE = 'Mikro aktivieren';
const TOGGLE_LABEL_ACTIVE = 'Mikro aktiv ●';

/** Build a single labelled readout field; returns its value element. */
function buildReadout(parent: HTMLElement, label: string, field: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'listener-readout';

  const labelEl = document.createElement('span');
  labelEl.className = 'listener-readout__label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'listener-readout__value';
  valueEl.dataset.field = field;
  valueEl.textContent = EMPTY;

  wrap.append(labelEl, valueEl);
  parent.append(wrap);
  return valueEl;
}

export function createListenerPanel(): ListenerPanel {
  // --- DOM scaffold ---------------------------------------------------------
  const el = document.createElement('section');
  el.className = 'listener-panel';
  el.setAttribute('aria-label', 'Live-Audio-Erkennung');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'listener-panel__toggle';
  toggle.dataset.role = 'toggle';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = TOGGLE_LABEL_IDLE;

  const bar = document.createElement('div');
  bar.className = 'listener-bar';
  bar.setAttribute('role', 'meter');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.setProperty('--level', '0');

  const fill = document.createElement('div');
  fill.className = 'listener-bar__fill';
  bar.append(fill);

  const readouts = document.createElement('div');
  readouts.className = 'listener-readouts';
  const noteEl = buildReadout(readouts, 'Note', 'note');
  const keyEl = buildReadout(readouts, 'Tonart', 'key');
  const chordEl = buildReadout(readouts, 'Akkord', 'chord');

  el.append(toggle, bar, readouts);

  // --- State ----------------------------------------------------------------
  let active = false;
  let handle: MicHandle | null = null;
  let rafId = 0;

  // Pitch / key tracking
  const pitchTracker = createPitchTracker();
  const chroma = new Array<number>(12).fill(0);
  let lastKeyLabel = '';
  let lastKeyUpdateMs = 0;
  const KEY_UPDATE_INTERVAL_MS = 500;

  function reflectState(): void {
    toggle.setAttribute('aria-pressed', active ? 'true' : 'false');
    toggle.textContent = active ? TOGGLE_LABEL_ACTIVE : TOGGLE_LABEL_IDLE;
    toggle.classList.toggle('is-active', active);
  }

  function setLevel(ratio: number): void {
    bar.style.setProperty('--level', String(ratio));
  }

  function clearReadouts(): void {
    noteEl.textContent = EMPTY;
    keyEl.textContent = EMPTY;
    chordEl.textContent = EMPTY;
  }

  function loop(): void {
    if (!active || !handle) return;

    const level = readLevel(handle.analyser);
    setLevel(rmsToBarRatio(level));

    // Pitch detection — guarded; analyser may lack getFloatTimeDomainData in tests
    try {
      const pitch = pitchTracker.process(handle.analyser, handle.context.sampleRate);
      if (pitch !== null) {
        const noteResult = hzToNote(pitch.hz);
        if (noteResult) {
          // Format note string: "A4" or "A4 +5¢"
          const centsStr = noteResult.cents !== 0
            ? ` ${noteResult.cents > 0 ? '+' : ''}${noteResult.cents}¢`
            : '';
          noteEl.textContent = `${noteResult.name}${noteResult.octave}${centsStr}`;

          // Accumulate chroma for key estimation (pitch-class histogram)
          const pcIndex = NOTE_NAMES.indexOf(noteResult.name as typeof NOTE_NAMES[number]);
          if (pcIndex >= 0) chroma[pcIndex] += 1;

          // Estimate key every KEY_UPDATE_INTERVAL_MS
          const now = performance.now();
          if (now - lastKeyUpdateMs >= KEY_UPDATE_INTERVAL_MS) {
            lastKeyUpdateMs = now;
            const total = chroma.reduce((s, v) => s + v, 0);
            if (total > 0) {
              const normalized = chroma.map((v) => v / total);
              const keyResult = estimateKey(normalized);
              const label = keyResult
                ? `${keyResult.tonic}-${keyResult.mode === 'major' ? 'Dur' : 'Moll'}`
                : '—';
              if (label !== lastKeyLabel) {
                lastKeyLabel = label;
                keyEl.textContent = label;
              }
            }
          }
        }
      } else {
        noteEl.textContent = EMPTY;
      }
    } catch {
      // Pitch detection unavailable (e.g. stub analyser in tests) — keep readout as-is
    }

    rafId = requestAnimationFrame(loop);
  }

  async function activate(): Promise<void> {
    active = true;
    reflectState();
    try {
      const h = await startMic();
      if (!active) {
        // Deactivated again while permission/handshake was pending.
        h.stop();
        return;
      }
      handle = h;
      loop();
    } catch {
      active = false;
      reflectState();
      setLevel(0);
    }
  }

  function deactivate(): void {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    handle?.stop();
    handle = null;
    setLevel(0);
    clearReadouts();
    // Reset chroma accumulator and key state
    chroma.fill(0);
    lastKeyLabel = '';
    lastKeyUpdateMs = 0;
    reflectState();
  }

  function onToggle(): void {
    if (active) deactivate();
    else void activate();
  }

  toggle.addEventListener('click', onToggle);

  // --- Public API -----------------------------------------------------------
  return {
    el,
    setNote(value: string) {
      noteEl.textContent = value || EMPTY;
    },
    setKey(value: string) {
      keyEl.textContent = value || EMPTY;
    },
    setChord(value: string) {
      chordEl.textContent = value || EMPTY;
    },
    dispose() {
      toggle.removeEventListener('click', onToggle);
      deactivate();
    },
  };
}
