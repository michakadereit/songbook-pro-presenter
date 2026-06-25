# TICKET-001 — Render-Logik & DOM-Struktur

> Plan: [SongRenderer](./README.md) · Spec ACs: AC1, AC2, AC6, AC7

## Ziel

`renderSong(song, options)` baut die DOM-Grundstruktur: Titel, Sections, Zeilen, und —
der Kern — die **Segment-Zerlegung** jeder Zeile mit Akkord über Silbe.

## Abhängigkeiten

Keine (nutzt `Song`/`SongLine`/`Chord` aus `src/types.ts`, befüllt vom Parser).

## Deliverables

- `src/components/SongRenderer.ts`: `renderSong` implementiert.
  - Wurzel `<article class="song">` mit `<h2 class="song__title">{song.name}</h2>`.
  - Pro `SongSection`: `<section class="section">` mit `<h3 class="section__title">{title}</h3>`
    (leere Titel erzeugen keine Überschrift).
  - Pro `SongLine`: `<div class="line">` mit Segmenten.
- Privater Helfer `splitLine(line: SongLine): Segment[]`:
  - `Segment = { chord: string | null; text: string }`.
  - Text vor dem ersten Akkord (position > 0) → Segment mit `chord: null`.
  - Jeder Akkord startet ein Segment bis zur nächsten Akkord-Position bzw. Zeilenende.
  - Reihenfolge nach `position` (defensiv sortieren).
- Pro Segment: `<span class="seg"><span class="seg__chord">{chord}</span><span class="seg__lyric">{text}</span></span>`.
  - Bei `chord: null`: `.seg__chord` bleibt leer (Platzhalter für Baseline), Inhalt = "".

## Acceptance Criteria

- AC1: Rückgabe ist `HTMLElement`; enthält `song.name` sichtbar; pro Section eine
  `.section__title` mit dem Titel.
- AC2: Für `lyrics: "Bless the Lord, O my soul,"` mit Akkorden `A`@10, `E`@21 entstehen
  Segmente, in denen `.seg__chord` `A` bzw. `E` im selben `.seg` wie die Silbe steht;
  `textContent` aller `.seg__lyric` zusammengesetzt === `"Bless the Lord, O my soul,"`.
- AC6: Eine Zeile mit `lyrics: "(x2)"` ohne Akkorde rendert nur den Text; kein `.seg__chord`
  mit nicht-leerem Inhalt.
- AC7: Kein `[`, `]` oder `{c:` im `textContent` der Komponente.
- Tests in `src/components/SongRenderer.test.ts` (neu) für AC1/AC2/AC6/AC7 grün.

## Out of Scope

- Toggles & `chordRatio` → TICKET-002.
- CSS/Styling → TICKET-003 (nur Klassennamen vergeben, kein visuelles Design).
