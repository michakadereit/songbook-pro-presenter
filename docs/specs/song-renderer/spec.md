# Spec: SongRenderer

> Status: Draft · Erstellt 2026-06-25 · Komponente: `src/components/SongRenderer.ts`

## Ziel

Eine **geteilte Komponente**, die einen einzelnen `Song` (aus dem Parser) in DOM rendert —
mit Akkorden korrekt über den Silben, unabhängig von der Bildschirmbreite. Wird von
**beiden** Views genutzt:

- **SlideView**: `showChords: true, showLyrics: true`
- **EagleView**: `showChords: true, showLyrics: false` (nur Akkorde)

`SongRenderer` ist KEINE View — er kennt weder Navigation noch Grid/Vollbild. Er liefert
ein `HTMLElement` für genau einen Song.

## API

```ts
interface RenderOptions {
  showChords: boolean;
  showLyrics: boolean;
  chordRatio: number; // Font-Größe Akkord relativ zu Lyric, z.B. 0.8
}
function renderSong(song: Song, options: RenderOptions): HTMLElement;
```

## Rendering-Technik (Akkord über Silbe)

Nicht Monospace/Whitespace, sondern **Segment-Stacking** per Flexbox:

- Jede `SongLine` wird an den `Chord.position`-Werten in Segmente zerlegt.
  - Text vor dem ersten Akkord (position > 0) → führendes Segment ohne Akkord.
  - Jeder Akkord beginnt ein Segment, das bis zum nächsten Akkord (oder Zeilenende) läuft.
- Jedes Segment: `<span class="seg"><span class="seg__chord">C</span><span class="seg__lyric">Lord, </span></span>`
- `.seg { display: inline-flex; flex-direction: column; }` → Akkord sitzt direkt über der Silbe.
- `.line { display: flex; flex-wrap: wrap; }` → responsiver Umbruch, Akkord bleibt geankert.
- Segmente ohne Akkord reservieren trotzdem die Akkord-Zeilenhöhe (Baseline-Ausrichtung).

## Design-Tokens (moderne CSS-Basis)

In `styles/main.css` als `:root`-Custom-Properties (von dieser Spec eingeführt):

- Farben via `light-dark()` + `color-scheme: light dark`.
- Fluide Typografie via `clamp()` (in `rem`, nie `px` — Zoom-Zugänglichkeit).
- `--chord-ratio` steuert die Akkord-Größe: `.seg__chord { font-size: calc(1em * var(--chord-ratio)); }`.
- System-Font-Stack.

## User Flow

1. Parser liefert `Song` (Sections mit Lines, Akkorde mit Positionen).
2. View ruft `renderSong(song, options)` auf.
3. Komponente liefert ein `<article class="song">`-Element mit Titel, Sections und Zeilen.
4. View hängt das Element in ihr Layout.

## Akzeptanzkriterien

### AC1 — Grundstruktur
`renderSong(song, opts)` gibt ein `HTMLElement` zurück, das den Song-Titel (`song.name`)
sichtbar enthält und pro `SongSection` ein Element mit dem Section-Titel (z.B. „Chorus").

### AC2 — Segmente mit Akkord über Silbe
Für die Zeile mit `lyrics: "Bless the Lord, O my soul,"` und Akkorden `A`@10, `E`@21
(transponiert) erzeugt der Renderer Segmente, in denen je ein `.seg__chord` mit Text `A`
bzw. `E` direkt vor (= im selben `.seg` wie) der zugehörigen Silbe steht. Der zusammen-
gesetzte sichtbare Lyric-Text der Zeile ergibt wieder exakt `"Bless the Lord, O my soul,"`.

### AC3 — Akkorde ausblendbar
Nach `renderSong(song, { showChords: false, … })` sind keine Akkorde sichtbar:
entweder kein `.seg__chord` im DOM oder alle haben `display:none` (computed) /
der Container trägt eine Klasse, die sie ausblendet. Der Lyric-Text bleibt vollständig.

### AC4 — Lyrics ausblendbar (Eagle-Fall)
Nach `renderSong(song, { showLyrics: false, showChords: true, … })` ist kein Lyric-Text
sichtbar, aber die Akkorde sind vorhanden — die Grundlage der Eagle-Ansicht.

### AC5 — Akkord/Lyric-Größenverhältnis
Der Wert `chordRatio` landet als CSS-Custom-Property (`--chord-ratio`) am gerenderten
Element, sodass `.seg__chord` mit `calc(1em * var(--chord-ratio))` skaliert.
Beispiel: `chordRatio: 0.7` → `--chord-ratio: 0.7` am Wurzelelement der Komponente.

### AC6 — Leere/akkordlose Zeilen
Eine Zeile ohne Akkorde (z.B. `(x2)`) rendert nur ihren Lyric-Text, ohne leere
Akkord-Spans mit Inhalt; die Zeile bleibt vertikal sauber ausgerichtet (Akkord-Zeilen-
höhe reserviert).

### AC7 — Kein ChordPro-Markup im Output
Im sichtbaren Text der Komponente kommen keine `[`/`]`/`{c:}`-Roh-Marker vor.

## Out of Scope

- Navigation, Vollbild, Grid → SlideView / EagleView (eigene Specs).
- Laden/Parsen der Datei → bereits im SBP-Parser erledigt.
- Editierbarkeit, Drucklayout, MIDI.
