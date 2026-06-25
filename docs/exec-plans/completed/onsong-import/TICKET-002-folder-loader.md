# TICKET-002 — `parseChordProFolder(files)` → SongSet

> Plan: [OnSong-Import](./README.md) · Spec ACs: AC6, AC7

## Ziel

Aus einer Dateiliste (Ordnerauswahl) ein `SongSet` bauen: nur `.chopro`, sortiert,
benannt nach dem Ordner.

## Abhängigkeiten

TICKET-001 (`parseChordPro`).

## Deliverables

- In `src/chordproParser.ts` (oder `src/onsongFolder.ts`):
  `export async function parseChordProFolder(files: File[]): Promise<SongSet>`.
  - Aus `files` nur die mit Endung `.chopro` (case-insensitiv) behalten; `.xml` u.a. ignorieren.
  - Alphabetisch nach Dateiname sortieren.
  - Pro Datei `text = await file.text()`, `song = parseChordPro(text, fileNameOhneEndung)`,
    `song.id = index`.
  - `SongSet`: `name` = Ordnername (aus `file.webkitRelativePath` erstes Segment, Fallback
    "OnSong"), `date` = "", `id` = 0, `songs`.

## Acceptance Criteria

- AC6: Mit allen 46 Dateien aus `samples/onsong/` → `set.songs.length === 23` (nur `.chopro`),
  alphabetisch nach Dateiname; `set.name` = Ordnername.
- AC7: Nur `.xml`-Dateien rein → `set.songs.length === 0`.
- Tests: Fixtures real aus `samples/onsong/` lesen und in `File`-Objekte verpacken
  (`new File([buf], name, ...)` mit gesetztem Namen; `webkitRelativePath` ggf. via Hilfsobjekt
  simulieren, da `File` es nicht direkt setzt — alternativ Ordnername als zweiten Parameter
  zulassen). Implementierung so gestalten, dass sie auch ohne `webkitRelativePath` einen
  sinnvollen Set-Namen liefert.
- Bestehende Tests grün, `tsc` sauber.

## Out of Scope

- UI/Folder-Picker → TICKET-003.
