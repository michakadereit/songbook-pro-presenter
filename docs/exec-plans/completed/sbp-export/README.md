# Exec Plan: SBP-Export

> Spec: [`docs/specs/sbp-export/spec.md`](../../../specs/sbp-export/spec.md)
> Branch: `feat/sbp-export` · Erstellt 2026-06-26

## Ziel

Geladenes `SongSet` als `.sbp`-Datei exportieren — unabhängig vom ursprünglichen
Import-Format (`.sbp` oder `.chopro`-Ordner). Alle 5 ACs grün + Browser-verifiziert.

## Architektur

- `src/exporter.ts` (neu): `songSetToSbpBlob(set: SongSet): Blob` — reine Funktion,
  kein DOM. Nutzt bestehendes `fflate` (`zipSync`) — kein neues Package nötig.
- Interner Helfer `sectionsToChordPro(sections: SongSection[]): string` rekonstruiert
  den ChordPro-Content aus `SongLine[]`.
- `main.ts` (minimal): Export-Button + Download-Trigger.

## Empfohlene Modelle

- TICKET-001 Serializer + ChordPro-Rekonstruktion: **Sonnet** (klare Logik, gut testbar)
- TICKET-002 Export-Button + UI-Wiring: **Haiku** (simples DOM-Glue)

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | `songSetToSbpBlob` — Serializer | AC1–AC4 | — | Sonnet | ✅ DONE |
| TICKET-002 | Export-Button + Download-Trigger | AC5 | 001 | Haiku | ✅ DONE |

**Abgeschlossen 2026-06-26:** 266 Tests grün, `tsc`/Build sauber, im Browser verifiziert
(Export-Button erscheint nach Set-Laden, Download-Trigger funktioniert; `.sbp`-Roundtrip
grün in 14 Vitest-Tests). Gemergt nach `main`.

Sequenziell 001 → 002. Beide als **Vordergrund-Agenten** (Bash für Vitest nötig).

## Definition of Done (Plan)

- `src/exporter.test.ts` grün (Roundtrip-Tests mit echten Sample-Dateien).
- `npx tsc --noEmit` sauber, `npm run build` ok, bestehende Tests grün.
- Browser-Verifikation: `.sbp` exportieren, wieder importieren → gleiche Songs.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
