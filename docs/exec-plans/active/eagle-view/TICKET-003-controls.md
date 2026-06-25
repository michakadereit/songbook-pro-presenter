# TICKET-003 — Transpose-Regler & Lyric-Suche

> Plan: [EagleView](./README.md) · Spec ACs: AC4, AC5, AC6, AC7, AC8

## Ziel

Die globalen Bedienelemente: ein Transpose-Regler, der alle Kacheln verschiebt, und ein
Suchfeld, das nach Lyric-Inhalt filtert.

## Abhängigkeiten

TICKET-001 (`transposeSong`) und TICKET-002 (Grid/Kacheln).

## Deliverables

- In `src/views/EagleView.ts` eine Steuerleiste `.eagle-controls`:
  - **Transpose-Slider** `<input type="range" min="-6" max="6" step="1" value="0">` plus
    sichtbare Wertanzeige (z.B. „+2" / „0" / „−3").
    - `input`-Event → alle Kacheln neu rendern mit
      `renderSong(transposeSong(song, offset), { showChords:true, showLyrics:false, chordRatio:0.8 })`.
  - **Suchfeld** `<input type="search">`:
    - `input`-Event → Kacheln filtern: sichtbar nur Songs, deren zusammengesetzter
      Lyric-Text (aus `song.sections[].lines[].lyrics`) den Begriff case-insensitiv als
      Teilstring enthält. Leeres Feld → alle sichtbar.
    - Filtern über `display:none` an der jeweiligen `.eagle-tile` (DOM bleibt erhalten),
      damit Transpose & Suche unabhängig kombinierbar sind.
- State im View-Closure halten (aktueller Offset + Suchbegriff), damit Transpose ein
  bereits gefiltertes Grid nicht „aufdeckt" und umgekehrt.
- `styles/main.css`: schlichtes, modernes Styling der Steuerleiste (Slider + Suche),
  sticky/oben gut erreichbar.

## Acceptance Criteria

- AC4: Regler auf `+2` → alle Kacheln zeigen die um 2 Halbtöne höheren Akkorde (Kachel mit
  vorher `A` zeigt `B`); aktueller Offset sichtbar im UI.
- AC5: Regler `0` → Akkorde exakt wie vom Parser geliefert (keine Zusatzverschiebung).
- AC6: Suchbegriff, der nur in den Lyrics eines Songs vorkommt → dessen Kachel bleibt
  sichtbar, Kacheln ohne den Begriff werden ausgeblendet (case-insensitiv).
- AC7: Suchfeld leeren → alle Kacheln wieder sichtbar.
- AC8: Begriff, der in den Lyrics, aber nicht im Titel steht, zeigt die passende Kachel
  (Suche trifft die verdeckten Lyrics).
- Tests in `src/views/EagleView.test.ts` für AC4–AC8 grün (DOM-Events simulieren:
  Slider-Wert setzen + `input`-Event dispatchen; Suchfeld-Wert + `input`-Event).
- Browser-Verifikation: Regler verschiebt sichtbar alle Akkorde, Suche filtert live.

## Out of Scope

- Suche über Titel/Autor, Fuzzy-Search, Highlighting der Treffer.
- Persistenz von Offset/Suche über Reloads.
