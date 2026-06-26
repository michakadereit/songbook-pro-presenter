# TICKET-001 — `songSetToSbpBlob` — Serializer

> Plan: [SBP-Export](./README.md) · Spec ACs: AC1–AC4

## Ziel

Eine reine TypeScript-Funktion, die ein `SongSet` in eine `.sbp`-kompatible `Blob`
(ZIP-Datei) serialisiert. Kein DOM, keine Side-Effects — vollständig unit-testbar.

## Abhängigkeiten

- `fflate` (bereits im Projekt): `zipSync` für ZIP-Erstellung.
- `src/types.ts`: `SongSet`, `SongSection`, `SongLine`.
- `src/parser.ts` + `src/chordproParser.ts`: als Referenz für den Roundtrip-Test.

## Deliverables

### `src/exporter.ts` (neu)

```ts
export function songSetToSbpBlob(set: SongSet): Blob
```

**Interner Ablauf:**

1. `sectionsToChordPro(sections: SongSection[]): string`
   - Je Section: `{c: Titel}\n`
   - Je `SongLine`: Akkord-Marker `[Symbol]` von hinten nach vorne in `lyrics` einfügen,
     damit `position`-Offsets stabil bleiben.
   - Sections mit Leerzeile getrennt.

2. `songSetToRawData(set: SongSet): RawData`
   - Baut die JSON-Struktur (`songs`, `sets`, `folders: []`) gemäß `.sbp`-Format.
   - `RawSong`: `Id`, `name`, `author`, `content` (aus `sectionsToChordPro`),
     `key: 1`, `KeyShift: song.keyShift`, `Capo: 0`, `timeSig: "4/4"`, `TempoInt: 120`.
   - `RawSet.contents[n]`: `Order: n`, `SongId: song.id`, `keyOfset: song.keyShift`.
   - `RawSet.details`: `Id: set.id`, `name: set.name`, `date: set.date`.

3. `songSetToSbpBlob(set: SongSet): Blob`
   - `dataFile.txt` = `"1.0\n" + JSON.stringify(rawData)` als UTF-8.
   - `dataFile.hash` = leeres `Uint8Array(0)`.
   - `zipSync({...})` → `Blob` mit `type: "application/zip"`.

### `src/exporter.test.ts` (neu)

Fixtures über `resolve(process.cwd(), 'samples/...')` laden (Vitest-Konvention).

- **Test 1 — parseSbp Roundtrip:**
  `samples/CW | Lobpreis.sbp` laden → `parseSbp` → `songSetToSbpBlob` → `parseSbp`
  → Song-Namen + Sections stimmen überein (AC1, AC2, AC3).

- **Test 2 — .chopro Roundtrip:**
  `samples/onsong/` laden → `parseChordProFolder` → `songSetToSbpBlob` → `parseSbp`
  → Song-Namen stimmen überein; kein Crash (AC4).

- **Test 3 — sectionsToChordPro Einheit:**
  Synthetische `SongSection[]` mit bekannten Akkorden → String enthält `{c: ...}` und
  `[Symbol]` an korrekten Positionen.

## Acceptance Criteria

- AC1: `songSetToSbpBlob(set)` liefert `Blob`; `parseSbp(blob)` wirft keine Exception.
- AC2: Roundtrip erhält Song-Namen, Author, Section-Titel, Lyric-Text.
- AC3: Akkord-Symbole und Positionen stimmen nach Roundtrip überein.
- AC4: `.chopro`-Roundtrip funktioniert ohne Crash.
- Bestehende Tests grün, `tsc` sauber.

## Out of Scope

- Download-Trigger / UI → TICKET-002.
- Exakte Kompatibilität mit der SongBook Pro Desktop-App (unbekanntes proprietäres Verhalten).
- `dataFile.hash` korrekt berechnen.
