# Exec Plan: Live Audio Detection (Mikro → Note / Tonart / Akkord)

**Spec:** `docs/specs/live-audio-detection/spec.md`
**Branch:** `feat/live-audio-detection` (Implementierungs-Tickets; TDD-Regeln beachten)
**Recommended model:** Sonnet für Logik/Wiring (TICKET-001/002/004/005), Opus für das visuelle Panel (TICKET-003)

## Ziel

Ein additives **Listener**-Sidecar: das eingebaute Mac-Mic wird nur bei Aktivierung
aufgenommen, eine Lautstärke-Bar zeigt das Signal, und aus dem Audio werden Note, Tonart
und – experimentell – Akkord bestimmt. Phasenweise, so dass das **zuverlässige Fundament
zuerst** steht und die riskante Akkorderkennung am Ende klar als experimentell ausgeliefert wird.

## Phasen-Strategie

1. **Fundament zuerst:** Pure Mathematik (001) und Mic-Gate + Lautstärke (002) sind robust
   und sofort verifizierbar.
2. **Sichtbares Ergebnis:** Panel-UI (003) macht die Funktion nutzbar; Note-Anzeige (004)
   liefert den ersten echten musikalischen Mehrwert.
3. **Experiment zuletzt:** Akkorderkennung (005) ist hinter einem Toggle, klar als „experimentell"
   markiert, und gefährdet das Fundament nicht.

## Ticket-Übersicht

| Ticket | Beschreibung | Abhängigkeit | Modell | Status |
|---|---|---|---|---|
| TICKET-001 | `noteMath.ts` — pure Hz→Note, Chroma→Tonart, Chroma→Akkord (TDD) | — | Sonnet | TODO |
| TICKET-002 | `micCapture.ts` + `levelMeter.ts` — Gate + RMS/Lautstärke | — | Sonnet | TODO |
| TICKET-003 | `ListenerPanel.ts` + Shell-Mount + CSS — Toggle + Bar + Anzeige | 001, 002 | Opus | TODO |
| TICKET-004 | `pitchDetector.ts` (pitchy) → Note + Tonart über Zeitfenster, im Panel | 001, 002, 003 | Sonnet | TODO |
| TICKET-005 | `chroma.ts` + experimenteller Akkord-Modus im Panel | 001, 003, 004 | Sonnet | TODO |

## Parallelisierung

- **TICKET-001 und TICKET-002 parallel** möglich — disjunkte Dateien (`noteMath.ts` vs.
  `micCapture.ts`/`levelMeter.ts`), keine geteilte Datei.
- Ab **TICKET-003 sequenziell**: 003 → 004 → 005 teilen sich `ListenerPanel.ts` und
  `styles/main.css` → sonst Merge-Konflikte (vgl. Projekt-Erfahrung mit `styles/main.css`).
- Sub-Agenten **im Vordergrund** starten (Hintergrund-Agenten haben hier keinen Bash-Zugriff
  → keine `vitest`/`tsc`-Verifikation). Pro Ticket genau ein Agent, exakte Scope-Grenzen,
  nichts committen / Branch nicht wechseln. Nach jeder Phase selbst `npx vitest run` +
  `npx tsc --noEmit`, dann committen.

## Neue Dependencies

- `pitchy` (TICKET-004) — monophone Tonhöhe.
- `meyda` **optional** (TICKET-005) — falls eigener Chroma aus `getFloatFrequencyData` nicht
  reicht. Erst eigenen Chroma versuchen (eine Dependency weniger).
- `essentia.js` **bewusst nicht** eingeplant (stale npm + WASM/Worklet-Reibung) — nur als
  dokumentierter Upgrade-Pfad in der Spec.

## Browser-Verifikation (Pflicht vor Merge)

- Dev-Server (`npm run dev`), `browser_navigate` auf `http://localhost:5173/`.
- Mic-Erlaubnis im headless Playwright ist eingeschränkt → Capture-Logik per Unit-Test mit
  Spies absichern (vgl. Fullscreen-Vorgehen); im Browser nur „Panel da, Toggle wirft nicht,
  Bar-Element vorhanden" prüfen. Echte Mic-/Erkennungs-Verifikation manuell durch den User.

## Definition of Done

- [ ] Alle Tickets DONE
- [ ] `npm test` grün, `npx tsc --noEmit` sauber
- [ ] Views/Renderer/Transpose unverändert (AC7)
- [ ] Manuelle Verifikation durch User: aktivieren → Bar reagiert auf Stimme/Instrument,
      Note erscheint, deaktivieren → Mic-Indikator aus, Bar 0
- [ ] Merge nach `main`, Plan → `completed/`, Branch-Cleanup
