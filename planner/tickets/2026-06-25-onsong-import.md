# Backlog: OnSong-Import (Ordner mit .chopro / .xml)

> Idee, noch kein Exec Plan. Erfasst 2026-06-25. Sample: `samples/onsong/`.

## Kontext

Alternativ zu SongBookPro (`.sbp`) exportiert OnSong (https://onsongapp.com/) **Ordner**
mit pro Song zwei Dateien: `<Song>.chopro` und `<Song>.xml` (identischer Inhalt).

## Format-Befund

- **`.chopro` (ChordPro)** — nah am bereits geparsten `.sbp`-Content:
  - Metadaten als Direktiven: `{title:}`, `{artist:}`, `{key:}`, `{time:}`, `{tempo:}`,
    `{copyright:}`, `{footer:}`.
  - Section-Header als `Verse 1:` / `Chorus:` (mit Doppelpunkt) statt `{c: ...}`.
  - Inline-Akkorde `[G]`, `[C2]`, `[G/B]` — wie in `.sbp`.
  - Eigenheiten: `[|]`-Taktstriche, `[(C)]`-optionale Akkorde, kein `keyOfset`.
- **`.xml` (OnSong)** — Akkorde **positionsbasiert** über den Lyrics (`.`-Präfix-Zeilen,
  spaltengenau), Section-Header `[V1]`/`[C]`/`[B]`. Spalten-Alignment-Parser nötig (fummelig).

## Einschätzung

- **`.chopro`-Ordner: niedriger–mittlerer Aufwand.** `parseContent` zu ~80 % wiederverwendbar;
  Views/`transposeSong` unverändert. Neu: Ordner-Input (`<input webkitdirectory>` / DnD),
  ChordPro-Datei→`Song`, `Label:`-Header, `{...}`-Direktiven, SongSet aus Ordner bauen.
- **`.xml`: hoher Aufwand** (Positions-Parser). **Da jeder Song ein `.chopro` hat: erstmal
  weglassen** — `.chopro` bevorzugen.

## Empfohlene Architektur

Import-Schicht mit mehreren Loadern (`.sbp`-ZIP, `.chopro`-Ordner) → gleicher `SongSet`-Typ.
`SongRenderer`, `EagleView`, `SlideView`, `transposeSong` bleiben unangetastet.

## Nächster Schritt (wenn priorisiert)

`docs/specs/onsong-import/spec.md` schreiben (ACs gegen `samples/onsong/`), dann Exec Plan.
