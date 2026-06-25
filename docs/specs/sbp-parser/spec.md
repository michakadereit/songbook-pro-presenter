# Spec: SBP-Parser

> Status: Draft · Erstellt 2026-06-25 · Referenz-Sample: `samples/CW _ Lobpreis (21.6.2026).sbp`

## Ziel

Eine `.sbp`-Datei (ZIP) in ein typisiertes `SongSet`-Objekt (`src/types.ts`) überführen,
das von den Views direkt gerendert werden kann — inklusive korrekt transponierter Akkorde.

Dies ist ein **reines Datenmodul** (kein DOM). Die ACs beschreiben das beobachtbare
Parse-Ergebnis gegen die Referenz-Sample-Datei.

## User Flow

1. Nutzer wählt/zieht eine `.sbp`-Datei in die App.
2. `parseSbp(file: Blob)` entpackt das ZIP, liest `dataFile.txt`.
3. Das Modul liefert ein `SongSet` mit geordneten, transponierten Songs zurück.
4. Bei Fehlern (kein ZIP, kein `dataFile.txt`, kaputtes JSON) wird ein aussagekräftiger
   Fehler geworfen, den die UI anzeigen kann.

## Format-Annahmen (aus Sample verifiziert)

- `dataFile.txt` beginnt mit einer **Versionszeile** (`1.0\n`) VOR dem JSON.
- JSON-Top-Level: `{ songs[], sets[], folders[] }`.
- `songs[]`: `Id`, `name`, `author`, `content` (ChordPro), `key`, `KeyShift`, `Deleted`.
- `sets[].details`: `Id`, `name`, `date`.
- `sets[].contents[]`: `Order`, `SongId`, `keyOfset`, `Deleted`.
- ChordPro-`content`:
  - Section-Header: `{c: Verse 1}`, `{c: Chorus}`, …
  - Inline-Akkorde: `[G]Amazing [D]grace`
  - Sonstige Direktiven (`{ccli_license: …}`) → ignorieren.
  - Nicht-Akkord-Marker wie `(x2)` → als Lyric-Text behalten, NICHT als Akkord.

## Akzeptanzkriterien

### AC1 — ZIP entpacken & JSON lesen
Gegeben die Referenz-`.sbp`, liefert `parseSbp` ein `SongSet`-Objekt zurück
(kein Throw). Die Versionszeile `1.0` wird korrekt übersprungen.

### AC2 — Set-Metadaten
Das zurückgegebene `SongSet` hat `name === "CW | Lobpreis"` und ein nicht-leeres
`date` (ISO-String mit `2026-06-21`).

### AC3 — Song-Anzahl & Reihenfolge
`set.songs` enthält genau die nicht-gelöschten Set-Contents, sortiert nach `Order`.
Für das Sample: `set.songs.length === 5`, `set.songs[0].name` beginnt mit
`"10000 Reasons"` (SongId 51, Order 0).

### AC4 — Gelöschte Einträge gefiltert
Songs oder Set-Contents mit `Deleted !== 0` erscheinen NICHT in `set.songs`.

### AC5 — Sections geparst
`set.songs[0].sections` enthält mindestens eine Section mit `title === "Chorus"`
und mindestens eine mit `title === "Verse 1"`. Direktiven wie `{ccli_license:…}`
erzeugen keine Section.

### AC6 — Inline-Akkorde getrennt von Lyrics
Für eine bekannte Zeile sind im `SongLine` die Akkorde aus dem Lyric-Text entfernt:
`lyrics` enthält keine `[`/`]`-Marker; jeder `Chord` hat eine `position`, die in
`lyrics` liegt. Beispiel-Quelle `"Bless the [C]Lord, O my [G]soul,"` →
`lyrics === "Bless the Lord, O my soul,"`, Akkorde `C` (pos 10) und `G` (pos 21).

### AC7 — Transposition angewandt
`keyOfset` aus dem Set-Content wird auf alle Akkorde des Songs angewandt
(via chordsheetjs). Für Song 0 (`keyOfset: 9`) wird der Quell-Akkord `[C]`
zu `A`, und `[D/F#]` zu `B/D#` (9 Halbtöne aufwärts, korrekte enharmonische
Schreibweise). `set.songs[0].keyShift === 9`.

### AC8 — `(x2)` bleibt Lyric
Eine Zeile, die nur `(x2)` enthält, erscheint als `SongLine` mit
`lyrics === "(x2)"` und `chords.length === 0` (kein Akkord-Parsing).

### AC9 — Fehlerfälle
- Blob ohne gültiges ZIP → Throw mit Hinweis „kein gültiges ZIP / .sbp".
- ZIP ohne `dataFile.txt` → Throw mit Hinweis auf fehlende `dataFile.txt`.

## Out of Scope

- Rendering / DOM (eigene Specs für SlideView, EagleView, SongRenderer).
- Capo-Handling, Tempo, Zeitsignatur (Felder vorhanden, aber nicht Teil dieses Parsers).
- Mehrere Sets pro Datei wählen — es wird `sets[0]` (erstes nicht-gelöschtes) genutzt.
- `SectionOrder`-Umsortierung innerhalb eines Songs.
