# TICKET-002 — Render-Optionen (Toggles + Ratio)

> Plan: [SongRenderer](./README.md) · Spec ACs: AC3, AC4, AC5

## Ziel

Die `RenderOptions` wirksam machen: Akkorde/Lyrics unabhängig aus-/einblenden und das
Größenverhältnis Akkord/Lyric über eine CSS-Custom-Property steuern.

## Abhängigkeiten

TICKET-001 (DOM-Struktur mit `.seg__chord` / `.seg__lyric` muss stehen).

## Deliverables

- In `renderSong`:
  - `showChords === false` → Container-Klasse `song--no-chords` setzen (CSS blendet
    `.seg__chord` aus). Lyrics bleiben unverändert.
  - `showLyrics === false` → Container-Klasse `song--no-lyrics` setzen (CSS blendet
    `.seg__lyric` aus). Akkorde bleiben.
  - `chordRatio` → `element.style.setProperty('--chord-ratio', String(chordRatio))` am
    Wurzelelement.
- Begleitende CSS-Regeln (minimal, Feinschliff in TICKET-003):
  `.song--no-chords .seg__chord { display: none; }`,
  `.song--no-lyrics .seg__lyric { display: none; }`,
  `.seg__chord { font-size: calc(1em * var(--chord-ratio, 0.8)); }`.

## Acceptance Criteria

- AC3: Nach `renderSong(song, { showChords: false, … })` ist kein Akkord sichtbar
  (Container hat `song--no-chords`; `.seg__chord` computed `display:none`), Lyric-Text vollständig.
- AC4: Nach `renderSong(song, { showLyrics: false, showChords: true, … })` kein Lyric-Text
  sichtbar, Akkorde vorhanden (Container `song--no-lyrics`).
- AC5: `chordRatio: 0.7` → Wurzelelement trägt `--chord-ratio: 0.7` (via inline style).
- Tests in `src/components/SongRenderer.test.ts` für AC3/AC4/AC5 grün; AC1/AC2/AC6/AC7
  bleiben grün.

## Out of Scope

- Visuelles Design, Farben, Typo-Skala, Responsiveness → TICKET-003.
