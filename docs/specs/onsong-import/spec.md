# Spec: OnSong-Import (Ordner mit .chopro)

> Status: Draft · Erstellt 2026-06-25 · Sample: `samples/onsong/`

## Ziel

Zusätzlich zu `.sbp` (SongBookPro) auch **OnSong-Exporte** laden: ein **Ordner** mit
`<Song>.chopro`-Dateien (ChordPro). Ergebnis ist derselbe `SongSet`-Typ wie beim
`.sbp`-Parser, sodass `SongRenderer`, `EagleView`, `SlideView`, `transposeSong` und der
View-Umschalter **unverändert** weiterfunktionieren.

`.xml`-Dateien im Ordner werden **ignoriert** (jeder Song liegt auch als `.chopro` vor;
der positionsbasierte XML-Parser ist bewusst out of scope).

## Architektur — Import-Schicht

Mehrere Loader liefern denselben `SongSet`:

```ts
// bestehend:
parseSbp(file: Blob): Promise<SongSet>;

// neu:
parseChordPro(text: string, fallbackName?: string): Song;        // eine .chopro-Datei
parseChordProFolder(files: File[]): SongSet;                      // ganzer Ordner
```

Die App-Shell wählt anhand der Eingabe (Einzeldatei `.sbp` vs. Ordner) den Loader; die
Views bleiben gleich.

## .chopro-Format (aus Sample verifiziert)

- **Direktiven** (Zeilen `{key:value}`): `{title:}`, `{subtitle:}`, `{artist:}`, `{key:}`,
  `{tempo:}`, `{time:}`, `{copyright:}`, `{footer:}`. → Metadaten; erscheinen NICHT als Lyrics.
- **Section-Header** in zwei Stilen:
  - mit Doppelpunkt: `Verse 1:`, `Chorus:`, `Chorus 1:`, `Misc 1:`
  - ohne Doppelpunkt: `Verse 1`, `Chorus`, `Verse 2`
  Erkennung über bekannte Schlüsselwörter (DE + EN), optional Nummer, optional `:`:
  `Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Interlude|Instrumental|Misc|Refrain|`
  `Vers|Strophe|Refrain|Pre|Teil` … (case-insensitiv). Nicht-passende Zeilen sind Lyrics.
- **Inline-Akkorde** `[G]`, `[C2]`, `[G/B]` — wie im .sbp-Content.
- **Nashville-Zahlen-Akkorde** `[6m]`, `[4]`, `[1/5]`: als Akkord-Symbole übernehmen
  (Anzeige); nicht transponierbar (bleiben bei `transposeSong` unverändert).
- **Sondertokens**: `[|]` (Taktstrich) und `[(C)]` (optionaler Akkord) werden als
  Akkord-Symbol übernommen (sichtbar als `|` bzw. `(C)`), nicht als Lyric.
- Mehrfache Leerzeilen / leere Section-Bodies sind möglich.

## SongSet aus Ordner

- Nur `.chopro`-Dateien werden zu Songs (`.xml` ignoriert).
- Reihenfolge: alphabetisch nach Dateiname (keine explizite Set-Reihenfolge im Export).
- `SongSet.name` = Ordnername; `date` = "" (kein Datum im Export); `Song.id` = Laufindex;
  `Song.keyShift` = 0 (Akkorde wie notiert).
- `Song.name` aus `{title:}` (Fallback: Dateiname ohne Endung); `Song.author` aus
  `{artist:}` oder `{subtitle:}` (sonst "").

## User Flow

1. Nutzer wählt einen **Ordner** (Folder-Picker, `<input webkitdirectory>`), der `.chopro`
   enthält — alternativ Drag&Drop eines Ordners.
2. `parseChordProFolder(files)` baut ein `SongSet`.
3. Die App mountet den View-Umschalter wie beim `.sbp`-Flow (Standard: Slide).

## Akzeptanzkriterien

### AC1 — .chopro → Song (Metadaten + Sections + Akkorde)
`parseChordPro(textOf("Build My Life.chopro"))` liefert einen `Song` mit `name`
„Build My Life", `author` aus `{artist:}`, Sections u.a. mit Titeln „Verse 1", „Chorus",
„Bridge"; mindestens ein Inline-Akkord (z.B. `G`, `C2`) mit korrekter `position`;
kein `[`/`]`/`{` im sichtbaren Lyric-Text.

### AC2 — Header ohne Doppelpunkt
Für „SCHÖNHEIT.chopro" werden auch Header **ohne** Doppelpunkt erkannt: es entstehen
Sections mit Titeln „Verse 1", „Chorus", „Verse 2".

### AC3 — Direktiven sind Metadaten, keine Lyrics
`{title:}`, `{key:}`, `{copyright:}` etc. landen NICHT im Lyric-Text einer Section
(keine Section-Zeile, deren `lyrics` mit `{` beginnt).

### AC4 — Akkordlose Songs
`parseChordPro(textOf("King Of Glory.chopro"))` (reine Lyrics) liefert Sections mit
Lyric-Zeilen und leeren `chords`-Arrays — ohne Fehler.

### AC5 — Nashville-/Sondertokens
`[6m]`, `[4]`, `[1/5]` aus „SCHÖNHEIT.chopro" erscheinen als Akkord-Symbole (`6m`, `4`,
`1/5`); kein Crash. `transposeSong(song, n)` lässt sie unverändert (chordsheetjs parst
sie nicht) — wirft nicht.

### AC6 — Ordner → SongSet
`parseChordProFolder(files)` mit den 46 Dateien aus `samples/onsong/` (23 `.chopro` +
23 `.xml`) liefert ein `SongSet` mit genau **23** Songs (nur `.chopro`), alphabetisch nach
Dateiname sortiert; `set.name` = Ordnername.

### AC7 — `.xml` ignoriert
Keine `.xml`-Datei wird zu einem Song; reicht man nur `.xml`-Dateien ein, ist
`set.songs.length === 0` (bzw. ein klarer Hinweis „keine .chopro gefunden").

### AC8 — UI lädt Ordner
Über den Folder-Picker geladen, zeigt die App den View-Umschalter mit den Songs des
Ordners (Browser-Verifikation: Slide zeigt Song 1, Eagle zeigt das Grid).

## Out of Scope

- `.xml`-Parsing (positionsbasiert) — eigene Spec, falls je nötig.
- Nashville-bewusste Transposition (Zahlen relativ zur `{key:}`).
- ChordPro-Erweiterungen wie `{start_of_tab}`, Mehrspaltigkeit, `{define:}`.
- Persistenz / Mischen mehrerer Ordner.
