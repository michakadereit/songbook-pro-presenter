# Exec Plan: EagleView

> Spec: [`docs/specs/eagle-view/spec.md`](../../../specs/eagle-view/spec.md)
> Branch: `feat/eagle-view` · Erstellt 2026-06-25

## Ziel

Die EagleView umsetzen: responsives Grid aller Songs (nur Akkorde), globaler
Transpose-Regler und Lyric-Suchfeld. Alle 8 ACs der Spec grün/verifiziert.

## Einordnung

EagleView komponiert `renderSong(song, { showLyrics: false, … })` (SongRenderer steht).
Der neue reine Helfer `transposeSong` wird später auch von der SlideView genutzt.

## Empfohlene Modelle

- TICKET-001 `transposeSong` (reine Logik): **Sonnet**.
- TICKET-002 Grid & Kachel-Design (visuell, du bist am Ergebnis interessiert): **Opus**.
- TICKET-003 Controls (Slider + Suche, Event-Wiring): **Sonnet**.

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | `transposeSong`-Helfer | AC3 | — | Sonnet | ✅ DONE |
| TICKET-002 | Eagle-Grid & Kacheln | AC1, AC2 | — | Opus | ✅ DONE |
| TICKET-003 | Transpose-Regler & Lyric-Suche | AC4, AC5, AC6, AC7, AC8 | 001, 002 | Sonnet | ✅ DONE |

**Abgeschlossen 2026-06-25:** 57 Tests grün, `tsc`/Build sauber, im Browser verifiziert
(4-Spalten-Grid, Transpose +2 verschiebt alle Akkorde, Lyric-Suche filtert live). CSS-Politur:
Akkord-Abstände in Akkord-only-Kacheln + volle Grid-Breite. Gemergt nach `main`.

**Parallelisierung:** TICKET-001 und TICKET-002 sind unabhängig und können parallel laufen.
TICKET-003 setzt beide voraus (braucht `transposeSong` und das Grid zum Manipulieren).

## Vorgehen je Ticket (TDD)

Pro Ticket Red-Tests aus den ACs (Vitest + jsdom für Logik/DOM; Browser-Verifikation für
das visuelle Grid-Design), dann grün. Branch `feat/eagle-view`.

## Definition of Done (Plan)

- DOM/Logik-ACs als grüne Vitest-Tests.
- `npx tsc --noEmit` sauber, `npm run build` ok.
- Browser-Verifikation: 5 Kacheln nur mit Akkorden; Regler verschiebt alle Akkorde;
  Suche filtert nach Lyrics. `main.ts` mountet die EagleView.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
