# Protokoll 2026-06-25

## Gemacht
- Recherche: Stack & Libraries für die Implementierung evaluiert.
  - **fflate** statt JSZip zum ZIP-Entpacken (kleiner, schneller, reines Lesen genügt).
  - **chordsheetjs** nur für Akkord-Transposition (korrekte enharmonische Schreibweise).
  - Eigener Line-Parser für `{c: …}` + Inline-`[Chord]` (volle Kontrolle über `(x2)` & Whitespace).
  - UI: Vanilla TS (wie Spec) — kein Framework nötig.
- Sample-Datei analysiert (`CW _ Lobpreis`): 3 Format-Stolpersteine dokumentiert.
- Projekt-Grundgerüst aufgesetzt: package.json, tsconfig, vite.config (vitest), index.html, src-Skelett, styles.
- Dependencies installiert. Typecheck ✓, Build ✓, Vitest-Runner lauffähig (noch keine Tests).

## Entscheidungen
- **Hybrid-Architektur**: eigener Struktur-Parser + chordsheetjs nur für Transposition.
- Feature-Logik bewusst als Stubs (`throw 'not implemented'`) — Implementierung spec-getrieben.

## Format-Erkenntnisse (Sample)
1. `dataFile.txt` beginnt mit Versionszeile `1.0\n` VOR dem JSON → erste Zeile abschneiden.
2. `songs[]` und `sets[].contents[]` haben `Deleted`-Flag → herausfiltern.
3. Content enthält `(x2)`-Marker und Akkorde mit signifikanten Trailing-Spaces.

- Git-Repo initialisiert (`main`).
- `docs/specs/sbp-parser/spec.md` geschrieben — 9 ACs gegen die Sample-Datei.
  - Akkord-Positionen & Transposition (C→A, D/F#→B/D# bei keyOfset 9) gegen echte Daten verifiziert.

- Rote Tests committet auf `feat/sbp-parser` (`src/parser.test.ts`, 9 ACs).
- Exec Plan `docs/exec-plans/active/sbp-parser/` angelegt: README + 3 Tickets
  (001 ZIP/JSON, 002 ChordPro-Parser, 003 Transposition), sequenziell, Modell **Sonnet**.

## Nächste Schritte
- Parser implementieren entlang TICKET-001 → 002 → 003 auf `feat/sbp-parser` bis alle Tests grün.
- Danach Branch nach `main` mergen, Plan nach `completed/` verschieben.
- Später: eigene Specs für SlideView / EagleView / SongRenderer (vor deren Exec Plänen).
