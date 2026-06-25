# TICKET-003 — Akkord-Transposition

> Plan: [SBP-Parser](./README.md) · Spec ACs: AC7

## Ziel

Den `keyOfset` des Set-Contents auf jeden geparsten Akkord anwenden, mit korrekter
enharmonischer Schreibweise via `chordsheetjs`.

## Abhängigkeiten

TICKET-002 (Akkorde müssen geparst vorliegen).

## Deliverables

- In `src/parser.ts`: pro Akkord `Chord.parse(symbol)?.transpose(keyShift).toString()`
  anwenden; das Ergebnis-Symbol ersetzt das Quell-Symbol im `Chord`.
- Robustheit: wenn `Chord.parse` `null`/undefined liefert (kein parsebarer Akkord),
  Quell-Symbol unverändert behalten (kein Crash).
- `song.keyShift` bleibt der angewandte Offset (aus TICKET-001).

## Acceptance Criteria

- AC7: `set.songs[0].keyShift === 9`; über alle Akkorde des Songs enthält die Menge der
  Symbole `"A"` (aus `[C]`) und `"B/D#"` (aus `[D/F#]`).
- Alle 9 Tests in `src/parser.test.ts` grün.
- `npx tsc --noEmit` sauber.

## Out of Scope

- Capo-Verrechnung (separates Feld, nicht Teil der Set-Transposition).
- UI-Anzeige der Tonart.
