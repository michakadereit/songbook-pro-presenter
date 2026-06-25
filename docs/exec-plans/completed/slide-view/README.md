# Exec Plan: SlideView + View-Umschalter

> Spec: [`docs/specs/slide-view/spec.md`](../../../specs/slide-view/spec.md)
> Branch: `feat/slide-view` · Erstellt 2026-06-25

## Ziel

Slide-Down-Ansicht (Vollbild, ein Song, Tastatur-Navigation) plus View-Umschalter
zwischen Slide und Eagle in der App-Shell. Alle 7 ACs der Spec grün/verifiziert.

## Einordnung

SlideView komponiert `renderSong(song, { showChords:true, showLyrics:true, … })`
(SongRenderer steht). Der Umschalter lebt in `main.ts` und mountet die gewählte View
mit demselben geladenen `SongSet`. EagleView existiert bereits.

## Empfohlene Modelle

- TICKET-001 SlideView-Kern (Logik + Keyboard + Dispose): **Sonnet**.
- TICKET-002 Vollbild-CSS-Design (Präsentationslook): **Opus**.
- TICKET-003 View-Umschalter + Shell-Rewire: **Sonnet**.

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | SlideView-Kern (Render + Navigation + Keyboard) | AC1–AC5 | — | Sonnet | ✅ DONE |
| TICKET-002 | Vollbild-CSS-Design | visuell (stützt AC1/AC5) | 001 | Opus | ✅ DONE |
| TICKET-003 | View-Umschalter (Shell) | AC6, AC7 | 001 | Sonnet | ✅ DONE |

**Abgeschlossen 2026-06-25:** 89 Tests grün, `tsc`/Build sauber, im Browser verifiziert
(1/5→…→5/5, Klemmen, `Home`/`End`; Umschalter Slide↔Eagle ohne Reload; Dispose entfernt den
Keyboard-Listener). Gemergt nach `main`.

**Parallelisierung:** TICKET-002 und TICKET-003 sind unabhängig voneinander, beide setzen
TICKET-001 voraus → nach 001 können 002 und 003 parallel laufen (002 als Vordergrund-
Agent wegen Browser-Verifikation; TDD-Tickets generell im Vordergrund — Hintergrund-Agenten
haben hier kein Bash).

## Definition of Done (Plan)

- DOM/Logik-ACs als grüne Vitest-Tests (`src/views/SlideView.test.ts`); jsdom dispatcht
  KeyboardEvents.
- `npx tsc --noEmit` sauber, `npm run build` ok.
- Browser-Verifikation: Vollbild-Slide, `→`/`←`/`Space`/`Home`/`End` navigieren,
  Positionsanzeige stimmt; Umschalter wechselt Slide↔Eagle ohne Reload.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
