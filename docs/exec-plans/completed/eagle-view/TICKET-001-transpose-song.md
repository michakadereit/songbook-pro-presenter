# TICKET-001 — `transposeSong`-Helfer

> Plan: [EagleView](./README.md) · Spec ACs: AC3

## Ziel

Eine reine Funktion, die alle Akkorde eines Songs um N Halbtöne transponiert — die
Grundlage für den globalen Transpose-Regler. Wiederverwendbar (auch SlideView).

## Abhängigkeiten

Keine.

## Deliverables

- Neues Modul `src/transpose.ts`:
  ```ts
  export function transposeSong(song: Song, semitones: number): Song;
  ```
  - Liefert eine **neue** `Song`-Kopie (kein Mutieren des Inputs — Sections/Lines/Chords
    tief genug kopieren, dass Original-Symbole unangetastet bleiben).
  - Jedes `Chord.symbol` via chordsheetjs transponieren:
    `Chord.parse(symbol)?.transpose(semitones)?.toString() ?? symbol`.
  - `semitones === 0` → Symbole identisch (idealerweise früh zurückkehren, aber dennoch
    eine Kopie liefern, damit Aufrufer gefahrlos rendern können).
  - Nicht parsebare Symbole bleiben unverändert (kein Crash).

## Acceptance Criteria

- AC3: `transposeSong(song, 2)` ergibt neue Kopie mit `A`→`B`, `D/F#`→`E/G#`; das
  übergebene `song`-Objekt bleibt unverändert (Original-Symbole gleich).
  `transposeSong(song, 0)` liefert identische Symbole.
- Tests in `src/transpose.test.ts` (neu) grün; bestehende Tests bleiben grün.
- `npx tsc --noEmit` sauber.

## Out of Scope

- UI/Slider → TICKET-003.
- Rendering → nutzt den bestehenden SongRenderer (TICKET-002/003).
