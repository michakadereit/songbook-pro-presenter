# TICKET-004: `pitchDetector.ts` (pitchy) → Note + Tonart im Panel

**Plan:** live-audio-detection
**Depends on:** TICKET-001, TICKET-002, TICKET-003
**Model:** Sonnet

## Ziel

Echte musikalische Werte: monophone Tonhöhe via `pitchy` → Note-Anzeige; Chroma über ein
gleitendes Zeitfenster → Tonart-Anzeige. Schreibt in die Readouts aus TICKET-003.

## Dateien (NUR diese anfassen)

- `src/audio/pitchDetector.ts` — neu (wrappt `pitchy`)
- `src/audio/pitchDetector.test.ts` — neu (mit synthetischem Sinus-Buffer)
- `src/views/ListenerPanel.ts` — Readouts „Note"/„Tonart" befüllen
- `package.json` — `pitchy` als dependency
- ggf. `src/audio/chroma.ts` — falls Tonart-Chroma hier schon gebraucht wird (sonst TICKET-005)

## Implementierungs-Hinweise

- **pitchy:** `const det = PitchDetector.forFloat32Array(analyser.fftSize);`
  `const [hz, clarity] = det.findPitch(timeBuf, context.sampleRate);`
  Nur anzeigen, wenn `clarity` über Schwelle (z. B. `> 0.85`) und Pegel über Bar-Floor —
  sonst „—" (kein Flackern bei Stille/Rauschen).
- **Note-Anzeige:** `hzToNote(hz)` (TICKET-001) → z. B. `A4 +5¢`.
- **Tonart:** rollierendes Chroma-Histogramm über ~4–8 s aufsummieren, periodisch (z. B.
  alle 0.5–1 s) `estimateKey(chroma)` (TICKET-001) aufrufen → z. B. „A-Dur". Glätten, damit
  die Anzeige nicht zwischen Tönen springt.
- **Test:** synthetischen 440-Hz-Sinus in einen Float32-Buffer schreiben und prüfen, dass der
  Wrapper ~440 Hz / Note A4 liefert (Toleranz). Kein echtes Mic.

## Akzeptanzkriterien

- Bei klarem 440-Hz-Signal zeigt „Note" `A4` (±wenige Cents); bei Stille „—".
- Über ein C-Dur-lastiges Eingangssignal stabilisiert sich „Tonart" auf „C-Dur" (manuell/
  unit über Chroma-Histogramm).
- Tonhöhe nur bei `clarity`/Pegel über Schwelle, sonst „—".
- AC7 bleibt erfüllt (Views/Renderer/Transpose unverändert).
- `npm test` grün, `npx tsc --noEmit` sauber.

## Out of Scope

- Akkorderkennung (TICKET-005).
- Mehrstimmige Tonhöhen-Trennung.

## Vorgehen

Erst Wrapper-Test (rot) mit synthetischem Buffer, dann implementieren. Nichts committen,
Branch nicht wechseln.
