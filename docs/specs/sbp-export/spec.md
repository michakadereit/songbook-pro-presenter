# Spec: SBP-Export

> Status: Draft · Erstellt 2026-06-26

## Ziel

Ein geladenes `SongSet` — egal ob ursprünglich aus einer `.sbp`-Datei oder einem
`.chopro`-Ordner importiert — als `.sbp`-Datei exportieren, sodass es erneut in der
App geladen werden kann.

## Architektur — Export-Schicht

Symmetrie zum Import: Genau wie `parseSbp(file) → SongSet` gibt es nun
`songSetToSbpBlob(set: SongSet): Blob`, das den Weg umkehrt.

```ts
// neu in src/exporter.ts:
export function songSetToSbpBlob(set: SongSet): Blob;
```

Die Export-Logik ist **reine Funktion** (kein DOM, kein Side-Effect). Der Download-Trigger
lebt in `main.ts`.

## Technische Umsetzung

### ChordPro-Rekonstruktion

`SongSection[]` → ChordPro-`content`-String:

- Jede Section: `{c: Titel}\n`
- Jede `SongLine`: Akkord-Marker `[Symbol]` werden an den `position`-Offsets wieder in
  den Lyric-String eingefügt (von hinten nach vorne, damit Offsets stabil bleiben).
- Ergebnis: `[G]Amazing [D]grace how [Em]sweet the sound`

### ZIP-Aufbau (fflate.zipSync)

```
dataFile.txt  ← "1.0\n" + JSON.stringify(rawData)
dataFile.hash ← leer (die App prüft diesen nicht)
```

`rawData`-Felder:
| App-Feld | SBP-JSON-Feld |
|---|---|
| `set.id` | `sets[0].details.Id` |
| `set.name` | `sets[0].details.name` |
| `set.date` | `sets[0].details.date` |
| `song.id` | `songs[n].Id` + `contents[n].SongId` |
| `song.name` | `songs[n].name` |
| `song.author` | `songs[n].author` |
| `song.keyShift` | `songs[n].KeyShift` + `contents[n].keyOfset` |
| Sections → ChordPro | `songs[n].content` |
| Defaults | `key: 1, Capo: 0, timeSig: "4/4", TempoInt: 120` |

### Download-Trigger

```ts
const blob = songSetToSbpBlob(currentSet);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = `${currentSet.name}.sbp`;
a.click();
URL.revokeObjectURL(url);
```

## User Flow

1. Nutzer lädt ein Set (`.sbp` oder `.chopro`-Ordner).
2. Nutzer klickt „Exportieren" in der Shell-Bar.
3. Browser lädt eine `.sbp`-Datei herunter (`<set-name>.sbp`).
4. Nutzer lädt die heruntergeladene Datei erneut in der App → selbe Songs erscheinen.

## Akzeptanzkriterien

### AC1 — Gültiges ZIP mit dataFile.txt
`songSetToSbpBlob(set)` liefert ein `Blob`, dessen Inhalt ein ZIP ist, das
`dataFile.txt` enthält — der erste Roundtrip `parseSbp(blob)` wirft keine Exception.

### AC2 — Roundtrip: Song-Namen + Sections erhalten
`parseSbp(songSetToSbpBlob(set)).songs` liefert dieselbe Anzahl Songs mit denselben
`name`- und `author`-Werten; jede Section hat denselben `title`; Lyrics bleiben korrekt.

### AC3 — ChordPro-Rekonstruktion: Akkorde an korrekten Positionen
Nach Roundtrip haben Akkorde dasselbe `symbol` und dieselbe `position` wie im
Original-`SongSet`.

### AC4 — .chopro-Roundtrip
Ein über `parseChordProFolder` geladenes Set kann exportiert und via `parseSbp`
reimportiert werden (AC2 + AC3 gelten auch dafür).

### AC5 — Export-Button im UI
Ein „Exportieren"-Button in der Shell-Bar ist **nur sichtbar/aktiv**, wenn ein Set
geladen ist. Klick löst Browser-Download der `.sbp`-Datei aus.

## Out of Scope

- Import der exportierten Datei in die echte SongBook Pro App (unbekanntes proprietäres
  Verhalten; App-interne IDs, Hash-Datei usw. werden nicht exakt nachgebildet).
- Auswahl einzelner Songs für den Export (immer das komplette Set).
- Versionierung / Merge mehrerer Sets.
