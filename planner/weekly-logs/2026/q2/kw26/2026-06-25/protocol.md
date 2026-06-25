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

- Parser via 3 Sonnet-Sub-Agenten orchestriert implementiert (TICKET-001 → 002 → 003),
  nach jeder Phase verifiziert. Endstand: **10/10 Tests grün**, `tsc` sauber, Build OK.
- Browser-Test (Playwright) bestanden: golden path „Geladen: CW | Lobpreis (5 Songs)",
  Randfall (ungültige Datei) → saubere Fehlermeldung. Stub-Copy in `main.ts` korrigiert.
- `feat/sbp-parser` nach `main` gemergt (`0c881dc`), Branch gelöscht.
- Exec Plan `sbp-parser` → `docs/exec-plans/completed/` verschoben, Tickets DONE.

- CSS-Recherche: modernes Design — Akkord-über-Silbe via **Segment-Stacking** (Flexbox,
  `flex-direction: column` je Segment) statt Monospace; Tokens via `clamp()`, `light-dark()`,
  Custom Property `--chord-ratio`.
- Geklärt: **SongRenderer ist weder Slide- noch Eagle-View**, sondern die geteilte
  Komponente, die beide Views nutzen (Eagle: `showLyrics:false`).
- `docs/specs/song-renderer/spec.md` geschrieben (7 ACs) + Exec Plan `song-renderer`
  (3 Tickets: Render-Logik, Optionen/Toggles, modernes CSS-Design).

- SongRenderer via Orchestrator + Sub-Agenten implementiert (001/002 Sonnet, 003 Opus),
  nach jeder Phase verifiziert. Endstand: **32 Tests grün**, `tsc`/Build sauber.
- Browser-Verifikation (Playwright): Akkorde sitzen exakt über den Silben, Transposition
  sichtbar (A aus [C], B/D# aus [D/F#]); modernes light-dark-Design mit Tokens.
- `main.ts` rendert geladene Songs als Harness (bis Views existieren).
- `feat/song-renderer` nach `main` gemergt, Branch gelöscht; Plan → `completed/`, Tickets DONE.
- Aufräumen: `.playwright-mcp/` und `.claude/agent-memory/` gitignored + untracked.

- EagleView gewählt (User-Wunsch): Grid + globaler Transpose-Regler + Lyric-Suchfeld.
- `docs/specs/eagle-view/spec.md` geschrieben (8 ACs) + Exec Plan `eagle-view` (3 Tickets:
  `transposeSong`-Helfer / Grid & Kacheln / Controls). Design-Entscheidungen festgehalten:
  Transpose relativ −6…+6 auf keyOfset addiert; Suche case-insensitiv auf Lyrics.

- EagleView umgesetzt: 001 ∥ 002 parallel (Sonnet/Opus, im Hintergrund), dann 003 (Sonnet,
  Vordergrund). Hintergrund-Agenten haben hier KEIN Bash → konnten nicht selbst testen;
  001-Agent ließ `transpose.ts` unfertig → vom Hauptagenten ergänzt. Lehre: Tickets mit
  TDD-Verifikation als Vordergrund-Agenten starten.
- Endstand: **57 Tests grün**, `tsc`/Build sauber. Browser-verifiziert: 4-Spalten-Grid,
  Transpose +2 (A→B etc.), Lyric-Suche (soul→2, hosanna→0, leeren→5).
- Zwei CSS-Fixes vom Hauptagenten: (1) Akkorde in Akkord-only-Kacheln per `gap` + Ausblenden
  leerer Segmente lesbar trennen; (2) `#songs:has(.eagle-view)` voll breit → Grid mehrspaltig.
- `feat/eagle-view` nach `main` gemergt, Branch gelöscht; Plan → `completed/`, Tickets DONE.

- `docs/specs/slide-view/spec.md` geschrieben (7 ACs, inkl. View-Umschalter) + Exec Plan
  `slide-view` (3 Tickets: Kern+Keyboard / Vollbild-CSS / View-Umschalter). Umschalter
  ist Pflichtbestandteil (User-Wunsch).
- OnSong-Recherche (Sample `samples/onsong/`): jeder Song als `.chopro` UND `.xml`. `.chopro`
  ist nah am .sbp-Content (niedrig–mittel), `.xml` positionsbasiert (hoch). Empfehlung:
  `.chopro`-Ordner via Import-Schicht, `.xml` weglassen. Als Backlog-Ticket erfasst:
  `planner/tickets/2026-06-25-onsong-import.md`.

- SlideView umgesetzt: 001 (Sonnet) → 002 (Opus) → 003 (Sonnet), alle Vordergrund-Agenten,
  nach jeder Phase verifiziert. Endstand: **89 Tests grün**, `tsc`/Build sauber.
- Browser-verifiziert: Navigation 1/5↔5/5 mit Klemmen + Home/End; Umschalter Slide↔Eagle
  ohne Reload; AC7 Dispose (ArrowRight wirkt in Eagle nicht mehr). Standard-View: Slide.
- Neue Module: `src/views/SlideView.ts`, `src/views/viewSwitcher.ts` (testbare Shell-Funktion);
  `main.ts` nutzt jetzt `mountViewSwitcher`. Vollbild-CSS + Tab-Leiste.
- `feat/slide-view` nach `main` gemergt, Branch gelöscht; Plan → `completed/`, Tickets DONE.

## Nächste Schritte
- Optional: OnSong-`.chopro`-Ordner-Import (Spec gegen `samples/onsong/`, Import-Schicht).
- Optional: globalen Transpose/Suche aus Eagle in die Shell heben (für beide Views nutzbar).
