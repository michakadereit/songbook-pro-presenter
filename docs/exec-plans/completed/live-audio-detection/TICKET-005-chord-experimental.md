# TICKET-005: `chroma.ts` + experimenteller Akkord-Modus

**Plan:** live-audio-detection
**Depends on:** TICKET-001, TICKET-003, TICKET-004
**Model:** Sonnet

## Ziel

Experimentelle, best-effort Akkorderkennung: 12-Bin-Chroma aus dem Analyser → `estimateChord`
(TICKET-001) → Akkord-Readout. Klar als **experimentell** gekennzeichnet; gefährdet das
Fundament (001–004) nicht.

## Dateien (NUR diese anfassen)

- `src/audio/chroma.ts` — neu (Chroma aus `analyser.getFloatFrequencyData`)
- `src/audio/chroma.test.ts` — neu (synthetisches Spektrum → erwartetes Chroma-Profil)
- `src/views/ListenerPanel.ts` — Akkord-Readout + „experimentell"-Hinweis/Toggle
- `styles/main.css` — kleiner Stil für den Experimentell-Badge (falls nötig)
- `package.json` — `meyda` **nur falls** eigener Chroma nicht ausreicht

## Implementierungs-Hinweise

- **Eigener Chroma zuerst** (eine Dependency weniger): `getFloatFrequencyData` (dB-Spektrum)
  → lineare Magnitude → je Bin Frequenz `binHz = i*sampleRate/fftSize` → Pitch-Class
  `round(12*log2(binHz/C0)) % 12` aufsummieren → 12-Bin-Vektor, normalisieren.
  Nur Bins in sinnvollem Band (z. B. 80–2000 Hz) berücksichtigen.
- Reicht das nicht, `meyda` mit `chroma`-Feature einsetzen (gleicher 12-Bin-Output).
- **Glättung:** Chroma über mehrere Frames mitteln, bevor `estimateChord` greift → weniger
  Sprünge. `null` von `estimateChord` → „—" anzeigen (keine Falschanzeige).
- **UI:** Akkord-Readout mit sichtbarem „experimentell"-Badge; optional ein Toggle, der den
  Akkord-Modus an/aus schaltet (Default aus oder klar gekennzeichnet an).

## Akzeptanzkriterien

- AC3 bleibt erfüllt (über `estimateChord` aus TICKET-001).
- Synthetisches C-Dur-Spektrum (C-E-G-Partials) → Chroma betont Bins {C,E,G} → Readout „C".
- Flaches/rauschiges Signal → Akkord „—" (kein Flackern).
- Akkord-Anzeige ist sichtbar als **experimentell** markiert.
- AC7 bleibt erfüllt; `npm test` grün, `npx tsc --noEmit` sauber.

## Out of Scope

- 7er-/sus-/Slash-Akkorde, Inversions-Erkennung.
- Quellentrennung (Vocal vs. Instrument) im Bandmix.
- Essentia.js-Integration (dokumentierter Upgrade-Pfad, nicht in diesem Ticket).

## Vorgehen

Erst `chroma.test.ts` (rot) mit synthetischem Spektrum, dann implementieren. Erwartung
gegenüber dem User klar managen: best effort, am besten bei isoliertem Instrument. Nichts
committen, Branch nicht wechseln.
