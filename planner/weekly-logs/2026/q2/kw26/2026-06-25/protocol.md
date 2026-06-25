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

## Nächste Schritte
- Tests aus den 9 ACs ableiten (rot) auf Feature-Branch `feat/sbp-parser`.
- Parser implementieren bis grün (fflate + eigener Line-Parser + chordsheetjs für Transposition).
- Danach Specs für SlideView / EagleView / SongRenderer (je eigene Spec bei Implementierung).
