# TICKET-004 — SlideView Lyric-Suche + Tastatur-Guard

> Plan: [Presentation-UX](./README.md) · Spec ACs: AC7–AC11

## Ziel

In der SlideView ein Suchfeld, das die navigierbaren Songs nach Lyrics filtert; plus der
Guard, dass Tippen im Suchfeld nicht weiterblättert.

## Abhängigkeiten

TICKET-003 (`.slide-controls`-Leiste existiert; hier kommt das Suchfeld dazu).

## Deliverables

- `src/views/SlideView.ts`:
  - In `.slide-controls` ein `<input type="search">` ergänzen.
  - Closure-State um eine **gefilterte Indexliste** erweitern: `matches: number[]` =
    Indizes der Songs, deren zusammengesetzter Lyric-Text (`sections[].lines[].lyrics`) den
    Suchbegriff (case-insensitiv) enthält. Ohne Begriff = alle Indizes.
  - `cursor` zeigt in `matches`. Navigation (`next/prev/first/last`) bewegt `cursor` über
    `matches` und klemmt. `render()` zeigt `set.songs[matches[cursor]]`; Position
    „<cursor+1> / <matches.length>".
  - Sucheingabe (`input`): `matches` neu berechnen, `cursor = 0`, neu rendern. Leerer
    Begriff → alle. Keine Treffer → `matches = []` → Position „0 / 0" + Hinweis, KEIN
    Song-Body (kein `renderSong`-Aufruf).
  - **Tastatur-Guard:** in `onKeyDown` früh zurückkehren, wenn
    `event.target instanceof HTMLInputElement` (oder `.closest('input,textarea')`), damit
    Tippen im Suchfeld nicht navigiert.
- `styles/main.css`: Suchfeld in der `.slide-controls` schlicht stylen.

## Acceptance Criteria

- AC7: Begriff, der nur in bestimmten Songs vorkommt → Navigation auf diese reduziert,
  Slide zeigt ersten Treffer, Position „1 / <Trefferzahl>".
- AC8: Bei aktiver Suche klemmen `ArrowRight`/`ArrowLeft` innerhalb der Treffer.
- AC9: Suchfeld leeren → alle Songs; Position „<x> / <gesamt>".
- AC10: Begriff ohne Treffer → „0 / 0" (+ Hinweis), kein Song-Body, kein Crash.
- AC11: `keydown` (`' '`/`ArrowRight`) mit `target` = `<input>` verändert den Song nicht.
- Tests in `src/views/SlideView.test.ts` für AC7–AC11; bestehende SlideView-Tests bleiben
  grün (ohne Suche identisches Verhalten). `tsc` sauber.

## Out of Scope

- Suche über Titel/Autor; Treffer-Highlighting; Persistenz.
