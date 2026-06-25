# TICKET-001 — `parseChordPro(text)` → Song

> Plan: [OnSong-Import](./README.md) · Spec ACs: AC1–AC5

## Ziel

Eine `.chopro`-Textdatei in einen `Song` (aus `src/types.ts`) parsen: Direktiven als
Metadaten, beide Section-Header-Stile, Inline-Akkorde inkl. Nashville-/Sondertokens.

## Abhängigkeiten

Keine harte. Reuse der Inline-Akkord-Logik aus `src/parser.ts` erwünscht (ggf. kleinen
geteilten Helfer extrahieren, ohne `.sbp`-Tests zu brechen).

## Deliverables

- `src/chordproParser.ts` (neu): `export function parseChordPro(text: string, fallbackName?: string): Song`.
  - Zeilenweise:
    - `{key:value}` → Metadaten sammeln (`title`, `subtitle`, `artist`, `key`, …); erzeugen
      KEINE Lyric-Zeile/Section.
    - Section-Header erkennen (case-insensitiv), beide Stile:
      Schlüsselwörter `Verse|Chorus|Bridge|Intro|Outro|Pre-?Chorus|Tag|Ending|Interlude|`
      `Instrumental|Misc|Refrain|Vers|Strophe|Pre|Teil`, optional Nummer, optional `:`
      → neue Section mit bereinigtem Titel (z.B. „Verse 1", „Chorus").
    - Sonstige nicht-leere Zeilen → Lyric-Zeile der aktuellen Section, Inline-`[chord]`
      herausgelöst (Symbol + position), Nashville/`[|]`/`[(C)]` als Symbol übernommen.
    - Leerzeilen: Section-Trenner/ignorierbar (keine leeren Lyric-Spans mit Müll).
  - `Song`: `name` aus `{title:}` (Fallback `fallbackName` ohne `.chopro`), `author` aus
    `{artist:}` sonst `{subtitle:}` sonst "", `keyShift: 0`, `id: 0` (Loader setzt id),
    `sections`.

## Acceptance Criteria

- AC1: „Build My Life.chopro" → `name` „Build My Life", `author` gesetzt, Sections mit
  „Verse 1"/„Chorus"/„Bridge"; ≥1 Inline-Akkord mit `position`; kein `[`/`]`/`{` im Lyric.
- AC2: „SCHÖNHEIT.chopro" → Header ohne Doppelpunkt erkannt (Sections „Verse 1", „Chorus",
  „Verse 2").
- AC3: Direktiven erscheinen nicht als Lyric-Zeile (keine `lyrics`, die mit `{` beginnt).
- AC4: „King Of Glory.chopro" (reine Lyrics) → Sections mit Lyric-Zeilen, leere `chords`,
  kein Fehler.
- AC5: „SCHÖNHEIT.chopro" → `[6m]`,`[4]`,`[1/5]` als Symbole `6m`,`4`,`1/5`; kein Crash.
- Tests in `src/chordproParser.test.ts` (neu) lesen die echten Sample-Dateien via
  `node:fs` (`samples/onsong/...`, analog `src/parser.test.ts`).
- Bestehende Tests grün, `tsc` sauber.

## Out of Scope

- Ordner/`File[]` → TICKET-002. UI → TICKET-003. `.xml`. Nashville-Transposition.
