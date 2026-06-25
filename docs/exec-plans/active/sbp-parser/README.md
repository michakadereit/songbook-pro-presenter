# Exec Plan: SBP-Parser

> Spec: [`docs/specs/sbp-parser/spec.md`](../../../specs/sbp-parser/spec.md)
> Branch: `feat/sbp-parser` · Erstellt 2026-06-25

## Ziel

`parseSbp(file: Blob) => Promise<SongSet>` implementieren, bis alle 9 ACs der Spec
(rote Tests in `src/parser.test.ts`) grün sind.

## Empfohlenes Modell

**Sonnet.** Die Spec ist präzise, die Tests existieren bereits (Red), die Library-Wahl
steht fest. Klar abgegrenzte Logik ohne Architektur-Entscheidungen → Sonnet genügt.
(Opus nur, falls die enharmonische Transposition unerwartet zickt.)

## Architektur

Hybrid (siehe Spec): eigener Struktur-Parser + `chordsheetjs` nur für Transposition,
`fflate` zum Entpacken. Alles in `src/parser.ts` (ggf. private Helfer im selben Modul).

## Tickets

| Ticket | Titel | ACs | Abhängig von | Status |
|--------|-------|-----|--------------|--------|
| TICKET-001 | ZIP entpacken & JSON/Set laden | AC1–AC4, AC9 | — | TODO |
| TICKET-002 | ChordPro-Zeilen-Parser | AC5, AC6, AC8 | 001 | TODO |
| TICKET-003 | Akkord-Transposition | AC7 | 002 | TODO |

Tickets sind **sequenziell** (001 → 002 → 003): 002 baut auf der Song-Struktur aus 001
auf, 003 transponiert die in 002 geparsten Akkorde. Keine Parallelisierung sinnvoll.

## Definition of Done (Plan)

- Alle 9 Tests in `src/parser.test.ts` grün (`npm test`).
- `npx tsc --noEmit` sauber.
- Manuell im Browser: Sample-`.sbp` laden zeigt „Geladen: CW | Lobpreis (5 Songs)".
- Branch `feat/sbp-parser` → `main` gemergt, Branch gelöscht (lokal + remote).
