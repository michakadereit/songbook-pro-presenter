# TICKET-002: `micCapture.ts` + `levelMeter.ts` — Aktivierungs-Gate + Lautstärke

**Plan:** live-audio-detection
**Depends on:** —
**Model:** Sonnet

## Ziel

Mikrofon-Adapter mit klarem Ein/Aus-**Gate** (nimmt nur bei Aktivierung auf) und die
Lautstärke-Berechnung für die Bar. Deckt Spec-ACs **AC4, AC5** ab.

## Dateien (NUR diese anfassen)

- `src/audio/micCapture.ts` — neu
- `src/audio/levelMeter.ts` — neu
- `src/audio/levelMeter.test.ts` — neu (pure RMS-Mathematik, zuerst rot)
- `src/audio/micCapture.test.ts` — neu (Gate-Logik mit Spies/Mocks)

## API

```ts
// micCapture.ts
export interface MicHandle {
  analyser: AnalyserNode;
  context: AudioContext;
  stop(): void;            // stoppt alle Tracks → track.readyState === 'ended', Mic-Indikator aus
  isActive(): boolean;
}
export async function startMic(): Promise<MicHandle>;  // getUserMedia + AudioContext + AnalyserNode

// levelMeter.ts
export function rms(samples: Float32Array | number[]): number;       // 0 bei Stille
export function rmsToBarRatio(rms: number, floorDb?: number): number; // [0,1], monoton
export function readLevel(analyser: AnalyserNode): number;            // RMS aus getFloatTimeDomainData
```

## Implementierungs-Hinweise

- **getUserMedia-Constraints:** `{ audio: { echoCancellation:false, noiseSuppression:false, autoGainControl:false } }`
  — sonst verfälschen Browser-DSP-Stufen Pegel und Tonhöhe.
- **Gate = echtes Aus:** `stop()` ruft `track.stop()` auf **allen** Tracks (Mic-Indikator
  erlischt) und schließt/suspendet den `AudioContext`. `enabled=false` allein reicht **nicht**
  (Indikator bliebe an) — die Spec verlangt sichtbares Aus.
- **AnalyserNode:** `fftSize` z. B. 2048; für RMS `getFloatTimeDomainData`.
- **rmsToBarRatio:** RMS→dB (`20*log10(rms)`), auf `[floorDb, 0]` (Default `floorDb=-60`)
  klemmen und linear auf `[0,1]` mappen. `rms<=0` → `0`.
- **Testbarkeit:** `micCapture.test.ts` mockt `navigator.mediaDevices.getUserMedia` und
  `AudioContext` (Spies) — kein echtes Mic. Prüft: vor Start kein Track; nach `startMic`
  Track aktiv/`isActive()===true`; nach `stop()` wurde `track.stop()` gerufen und
  `isActive()===false`. (Vgl. Fullscreen-Spy-Vorgehen im Projekt.)

## Akzeptanzkriterien

- AC4: `rms([0,0,0]) === 0`; RMS eines Vollausschlag-Sinus ≈ `0.707`; `rmsToBarRatio` in
  `[0,1]` und monoton steigend mit dem Pegel.
- AC5: Vor Aktivierung kein aktiver Track; nach `startMic()` läuft ein Track; nach `stop()`
  ist `track.stop()` aufgerufen und `isActive()===false`. (Per Spy-Test belegt.)
- `npx vitest run` grün, `npx tsc --noEmit` sauber.

## Out of Scope

- UI / Lautstärke-Bar-Darstellung (TICKET-003).
- Tonhöhen-/Chroma-Erkennung (TICKET-004/005).
- Geräteauswahl-Dropdown (immer Default-Mic).

## Vorgehen

TDD (pure `levelMeter` zuerst), Gate-Logik mit Mocks. Nichts committen, Branch nicht wechseln.
