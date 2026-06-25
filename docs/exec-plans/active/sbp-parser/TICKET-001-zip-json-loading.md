# TICKET-001 — ZIP entpacken & JSON/Set laden

> Plan: [SBP-Parser](./README.md) · Spec ACs: AC1–AC4, AC9

## Ziel

`parseSbp` entpackt die `.sbp` (ZIP), liest `dataFile.txt`, parst das JSON und baut
ein `SongSet`-Skelett: korrekte Metadaten + geordnete, gefilterte Songs (noch ohne
Sections/Akkorde — `sections: []` ist in diesem Ticket erlaubt).

## Abhängigkeiten

Keine. Erstes Ticket.

## Deliverables

- `src/parser.ts`: `parseSbp` implementiert für:
  - `fflate.unzipSync` auf den Blob-Bytes; `dataFile.txt` extrahieren.
  - Versionszeile (erste Zeile bis `\n`) abschneiden, Rest als JSON parsen.
  - Erstes nicht-gelöschtes Set wählen (`sets[0]`), `details.name` + `details.date` übernehmen.
  - `contents[]` nach `Order` sortieren, `Deleted !== 0` filtern.
  - Pro Content den Song via `SongId → songs[].Id` auflösen, gelöschte Songs filtern.
  - `Song` mit `id`, `name`, `author`, `keyShift = content.keyOfset`, `sections: []` bauen.
- Fehlerbehandlung: kein gültiges ZIP → Throw `/zip|sbp/i`; fehlende `dataFile.txt` → Throw `/dataFile\.txt/i`.

## Acceptance Criteria

- AC1: `parseSbp(sample)` liefert ein `SongSet` ohne Throw; `set.songs` ist Array.
- AC2: `set.name === "CW | Lobpreis"`, `set.date` enthält `"2026-06-21"`.
- AC3: `set.songs.length === 5`, `set.songs[0].name` matcht `/^10000 Reasons/`.
- AC4: kein Song/Content mit `Deleted !== 0` im Ergebnis.
- AC9: ungültiges ZIP und fehlende `dataFile.txt` werfen mit passender Meldung.
- Die zugehörigen Tests in `src/parser.test.ts` sind grün (AC5–AC8 dürfen noch rot sein).

## Out of Scope

- ChordPro-Parsing (Sections, Inline-Akkorde) → TICKET-002.
- Transposition → TICKET-003.
- Auswahl unter mehreren Sets / `folders`.
