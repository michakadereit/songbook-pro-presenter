# Spec: EagleView

> Status: Draft · Erstellt 2026-06-25 · View: `src/views/EagleView.ts`

## Ziel

Eine Übersichts-Ansicht: **alle Songs des Sets** als Kacheln in einem responsiven Grid,
**nur Akkorde** (keine Lyrics) — für den schnellen strukturellen Überblick vor/während
eines Sets. Dazu zwei globale Bedienelemente:

1. **Transpose-Regler** — verschiebt *alle* Songs gemeinsam um einen Halbton-Offset.
2. **Suchfeld** — filtert die Kacheln nach Lyric-Inhalt.

EagleView **komponiert** `renderSong` (aus dem SongRenderer) mit `showLyrics: false`.

## API

```ts
function mountEagleView(root: HTMLElement, set: SongSet): void;
```

Rendert in `root`: eine Steuerleiste (Regler + Suchfeld) und ein Grid `.eagle-grid` mit
je einer Kachel `.eagle-tile` pro Song.

Neuer reiner Helfer (eigenes Modul, wiederverwendbar für SlideView):
```ts
// src/transpose.ts
function transposeSong(song: Song, semitones: number): Song;
```
Liefert eine **neue** `Song`-Kopie mit um `semitones` transponierten Akkord-Symbolen
(via chordsheetjs). `semitones === 0` → unveränderte Symbole.

## Verhalten

- **Grid**: pro Song eine Kachel mit Titel + Akkorden (chords-only). Responsiv: mehrere
  Spalten auf breiten Screens, eine Spalte auf schmalen.
- **Transpose**: Slider-Bereich −6…+6, Default 0; der aktuelle Wert ist sichtbar. Änderung
  → alle Kacheln werden mit `transposeSong(song, offset)` neu gerendert. Der Offset addiert
  sich auf die bereits vom Parser angewandte `keyOfset`-Transposition.
- **Suche**: Eingabe filtert Kacheln. Sichtbar bleiben nur Songs, deren **Lyric-Text**
  (case-insensitiv) den Suchbegriff als Teilstring enthält. Leeres Feld → alle sichtbar.
  Suche und Transpose sind unabhängig kombinierbar.

## User Flow

1. `.sbp` geladen → `main.ts` ruft `mountEagleView(root, set)`.
2. Nutzer sieht alle Songs als Akkord-Kacheln im Grid.
3. Nutzer zieht den Transpose-Regler → alle Kacheln zeigen die neuen Akkorde.
4. Nutzer tippt ins Suchfeld → nur passende Kacheln bleiben sichtbar.

## Akzeptanzkriterien

### AC1 — Grid mit Akkord-Kacheln
Nach `mountEagleView(root, set)` enthält `root` ein `.eagle-grid` mit genau einer
`.eagle-tile` pro Song des Sets (Sample: 5 Kacheln). Jede Kachel zeigt den Song-Titel
und Akkorde; **kein Lyric-Text** ist sichtbar (Lyric-Spans ausgeblendet, `showLyrics:false`).

### AC2 — Responsives Grid
`.eagle-grid` nutzt ein CSS-Grid mit mehreren Spalten bei breiter Darstellung und einer
Spalte bei schmaler (z.B. `grid-template-columns: repeat(auto-fill, minmax(…, 1fr))`).

### AC3 — `transposeSong` ist rein & korrekt
`transposeSong(song, 2)` liefert eine neue Song-Kopie, in der ein Akkord-Symbol `A` zu
`B` wird (und z.B. `D/F#` zu `E/G#`); das Original-`song`-Objekt bleibt unverändert.
`transposeSong(song, 0)` liefert identische Symbole.

### AC4 — Transpose-Regler wirkt global
Setzt man den Regler auf `+2`, zeigen alle Kacheln die um 2 Halbtöne höheren Akkorde
(eine Kachel, die vorher `A` zeigte, zeigt jetzt `B`). Der aktuelle Offset-Wert ist im UI
sichtbar (z.B. „+2").

### AC5 — Offset 0 = Ausgangszustand
Bei Regler-Wert 0 entsprechen die gezeigten Akkorde exakt den vom Parser gelieferten
(keyOfset-transponierten) Symbolen — keine zusätzliche Verschiebung.

### AC6 — Suche filtert nach Lyrics
Tippt man einen Begriff, der nur in den Lyrics von Song X vorkommt, bleibt Song X' Kachel
sichtbar und Kacheln ohne diesen Begriff in ihren Lyrics werden ausgeblendet
(`display:none` / aus dem DOM-Fluss). Match ist case-insensitiv.

### AC7 — Suche zurücksetzen
Leert man das Suchfeld, sind wieder alle Kacheln sichtbar.

### AC8 — Suche trifft verdeckte Lyrics
Die Suche matcht den Lyric-Inhalt, obwohl in den Kacheln nur Akkorde angezeigt werden:
ein Begriff, der in den Lyrics, aber nicht im Titel steht, zeigt die passende Kachel.

## Out of Scope

- SlideView (eigene Spec) — `transposeSong` wird dort aber wiederverwendet.
- Per-Song-Transpose (nur global hier).
- Suche über Titel/Autor (zunächst nur Lyrics; spätere Erweiterung möglich).
- Sortierung/Gruppierung der Kacheln, Tempo/Audio.
