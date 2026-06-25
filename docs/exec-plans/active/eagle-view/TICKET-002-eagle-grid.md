# TICKET-002 — Eagle-Grid & Kacheln

> Plan: [EagleView](./README.md) · Spec ACs: AC1, AC2

## Ziel

`mountEagleView` rendert alle Songs als Akkord-Kacheln in einem responsiven Grid und wird
in `main.ts` eingebunden. Visuell ansprechend (du bist am Ergebnis interessiert).

## Abhängigkeiten

Keine harte (nutzt den bestehenden `renderSong`). Läuft parallel zu TICKET-001.

## Deliverables

- `src/views/EagleView.ts`: `mountEagleView(root, set)` implementiert.
  - Baut in `root` einen Container mit `.eagle-grid`.
  - Pro Song eine `.eagle-tile` mit:
    - Titel (kann der vom `renderSong` erzeugte `.song__title` sein),
    - Akkorde via `renderSong(song, { showChords: true, showLyrics: false, chordRatio: 0.8 })`.
  - `root.replaceChildren(...)` statt innerHTML mit Daten.
  - (Steuerleiste/Controls kommen in TICKET-003 — hier ggf. ein leerer `.eagle-controls`-
    Platzhalter, aber keine Logik.)
- `styles/main.css`: Grid + Kachel-Design auf Basis der bestehenden Design-Tokens
  (`light-dark()`, `clamp()`):
  - `.eagle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: …; }`
  - `.eagle-tile`: Karten-Look (Surface, Radius, Padding, dezenter Border/Shadow), kompakt
    für Akkord-Übersicht.
- `src/main.ts`: nach erfolgreichem `parseSbp` `mountEagleView(songsContainer, set)` aufrufen
  (ersetzt das bisherige Voll-Lyric-Harness).

## Acceptance Criteria

- AC1: Nach `mountEagleView(root, set)` enthält `root` ein `.eagle-grid` mit genau einer
  `.eagle-tile` pro Song (Sample: 5). Jede Kachel zeigt den Titel + Akkorde; Lyric-Spans
  sind ausgeblendet (Container trägt `song--no-lyrics`).
- AC2: `.eagle-grid` ist ein CSS-Grid mit `repeat(auto-fill, minmax(…, 1fr))` (mehrspaltig
  breit, einspaltig schmal).
- Tests in `src/views/EagleView.test.ts` (neu) für AC1 grün (Grid-/Kachel-/Tile-Count,
  `song--no-lyrics` vorhanden). Bestehende Tests bleiben grün.
- Browser: 5 Kacheln nur mit Akkorden, sauberes responsives Grid.

## Out of Scope

- Transpose-Regler & Suche → TICKET-003.
