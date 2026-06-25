# TICKET-002 — ChordPro-Zeilen-Parser

> Plan: [SBP-Parser](./README.md) · Spec ACs: AC5, AC6, AC8

## Ziel

Den `content`-String jedes Songs in `SongSection[]` mit `SongLine[]` zerlegen:
Section-Header erkennen, Inline-Akkorde von den Lyrics trennen, Positionen anchoren.

## Abhängigkeiten

TICKET-001 (Song-Struktur + `parseSbp`-Grundgerüst muss stehen).

## Deliverables

- Privater Helfer (z. B. `parseContent(content: string): SongSection[]`) in `src/parser.ts`,
  in TICKET-001 verdrahtet, sodass `song.sections` befüllt wird.
- Logik:
  - `{c: <Titel>}` → neue Section mit `title`. Andere `{…}`-Direktiven werden ignoriert
    (erzeugen weder Section noch Line).
  - Inline-`[Chord]`: aus dem Text entfernen, `Chord { symbol, position }` an der
    Zeichen-Position im bereinigten `lyrics`-Text ablegen.
  - Zeilen ohne Section-Header gehören zur aktuellen Section (erste Section ggf. `title: ""`
    falls Content nicht mit `{c:}` startet — im Sample startet jeder Song mit `{c:}`).
  - `(x2)` u. Ä.: bleibt als `lyrics`, wird NICHT als Akkord interpretiert (kein `[`/`]`).

## Acceptance Criteria

- AC5: `set.songs[0]` hat Sections mit `title` `"Chorus"` und `"Verse 1"`; keine leeren
  Titel, kein `ccli`-Titel.
- AC6: Für die Zeile „Bless the …" gilt `lyrics === "Bless the Lord, O my soul,"`
  (keine `[`/`]`), Akkord-Positionen enthalten 10 und 21, alle `position <= lyrics.length`.
- AC8: Eine Zeile mit `lyrics.trim() === "(x2)"` existiert und hat `chords.length === 0`.
- Zugehörige Tests in `src/parser.test.ts` grün (AC7 darf noch rot sein).

## Out of Scope

- Transposition der Akkord-Symbole → TICKET-003 (hier bleiben Symbole unverändert,
  also Quell-Schreibweise wie `C`, `D/F#`).
- `SectionOrder`-Umsortierung.
