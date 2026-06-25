# Exec Plan: OnSong-Import (.chopro-Ordner)

> Spec: [`docs/specs/onsong-import/spec.md`](../../../specs/onsong-import/spec.md)
> Branch: `feat/onsong-import` · Erstellt 2026-06-25

## Ziel

OnSong-Ordner mit `.chopro`-Dateien laden und in denselben `SongSet`-Typ überführen.
`.xml` wird ignoriert. Views/Transpose/Umschalter bleiben unverändert. Alle 8 ACs grün/
verifiziert.

## Architektur

Import-Schicht: `parseChordPro(text)` → `Song`, `parseChordProFolder(files)` → `SongSet`.
Die App-Shell wählt den Loader anhand der Eingabe (Datei `.sbp` vs. Ordner). Renderer,
EagleView, SlideView, viewSwitcher, transposeSong: **unangetastet**.

Wiederverwendung: Die Inline-`[chord]`-Zerlegung gibt es bereits in `src/parser.ts`
(privat). Wo sinnvoll, eine kleine geteilte Hilfsfunktion extrahieren statt duplizieren —
ohne die bestehende `.sbp`-Logik/Tests zu brechen.

## Empfohlene Modelle

- TICKET-001 ChordPro-Parser (Header-Heuristik, Nashville/Sondertokens): **Opus**
  (mehrere Sonderfälle/Heuristik).
- TICKET-002 Ordner-Loader (`SongSet` aus File[]): **Sonnet**.
- TICKET-003 UI Folder-Picker + Shell-Integration: **Sonnet**.

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | `parseChordPro(text)` → Song | AC1–AC5 | — | Opus | TODO |
| TICKET-002 | `parseChordProFolder(files)` → SongSet | AC6, AC7 | 001 | Sonnet | TODO |
| TICKET-003 | UI Folder-Picker + Shell | AC8 | 002 | Sonnet | TODO |

Sequenziell 001 → 002 → 003. Alle als **Vordergrund-Agenten** (TDD-Verifikation braucht
Bash; Hintergrund-Agenten haben hier keinen Bash-Zugriff).

## Definition of Done (Plan)

- Logik-ACs als grüne Vitest-Tests (`src/chordproParser.test.ts` o.ä.), Fixtures aus
  `samples/onsong/` gelesen.
- `npx tsc --noEmit` sauber, `npm run build` ok, bestehende Tests bleiben grün.
- Browser-Verifikation: Ordner via Picker laden → Slide/Eagle zeigen die OnSong-Songs;
  `.sbp`-Flow funktioniert weiterhin.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
