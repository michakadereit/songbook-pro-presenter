# Spec: SlideView + View-Umschalter

> Status: Draft · Erstellt 2026-06-25 · View: `src/views/SlideView.ts` + App-Shell

## Ziel

Die **Slide-Down-Ansicht**: Vollbild, ein Song pro Slide, sequenziell per Tastatur
navigiert (Präsentationsmodus für Beamer/Zweitschirm). Dazu ein **View-Umschalter**, mit
dem zwischen Slide- und Eagle-Ansicht gewechselt wird, ohne die Datei neu zu laden.

SlideView **komponiert** `renderSong(song, { showChords: true, showLyrics: true, … })`.

## API

```ts
// Rendert die Slide-Ansicht; gibt eine Aufräumfunktion zurück (entfernt Keyboard-Listener).
function mountSlideView(root: HTMLElement, set: SongSet): () => void;
```

Der View-Umschalter lebt in der App-Shell (`main.ts`): sie hält den geladenen `SongSet`
und mountet die gewählte View; beim Wechsel wird die alte View via Dispose-Funktion
aufgeräumt.

## Verhalten

- **Eine Slide**: zeigt genau einen Song, Titel oben, darunter der gerenderte Song
  (Akkorde über Silben, volle Lyrics).
- **Navigation**: `→`/`Leertaste` = nächster Song, `←` = vorheriger. `Home`/`End` = erster/
  letzter. An den Enden wird **geklemmt** (kein Wrap): am letzten Song passiert bei `→`
  nichts.
- **Positionsanzeige**: aktueller Index/Anzahl, z.B. „2 / 5".
- **Umschalter**: ein Control (Buttons/Tabs „Slide" | „Eagle"); Klick mountet die jeweils
  andere View mit demselben `set`. Aufräumen der vorherigen View (Listener entfernen).

## User Flow

1. `.sbp` geladen → App-Shell zeigt den Umschalter und mountet die Standard-View (Slide).
2. Nutzer drückt `→` → Song 1 verschwindet, Song 2 füllt den Bildschirm.
3. Nutzer klickt „Eagle" → Grid-Übersicht; Klick „Slide" → zurück zur Präsentation.

## Akzeptanzkriterien

### AC1 — Eine Slide, Titel oben
Nach `mountSlideView(root, set)` ist genau **ein** Song sichtbar (der erste); sein Titel
steht oben. Es sind nicht alle Songs gleichzeitig im sichtbaren Slide.

### AC2 — Vorwärts-Navigation
Nach `keydown` `ArrowRight` (und ebenso `' '`/Space) zeigt der Slide den **nächsten** Song
(Song 1 nicht mehr sichtbar, Song 2 sichtbar). `ArrowLeft` geht einen zurück.

### AC3 — Klemmen an den Enden
Beim ersten Song bewirkt `ArrowLeft` keinen Wechsel (bleibt Song 1). Beim letzten Song
bewirkt `ArrowRight` keinen Wechsel (bleibt letzter). `Home`→erster, `End`→letzter.

### AC4 — Positionsanzeige
Ein Element zeigt die aktuelle Position als „<n> / <gesamt>" (z.B. nach einmal `→`: „2 / 5").

### AC5 — Voller Song gerendert
Der sichtbare Slide enthält Akkorde **und** Lyrics (reuse `renderSong`); kein Roh-Markup
(`[`/`]`/`{c:}`) im sichtbaren Text.

### AC6 — View-Umschalter wechselt ohne Reload
Mit geladenem Set wechselt ein Klick auf „Eagle" zur Eagle-Ansicht (`.eagle-grid` sichtbar)
und „Slide" zurück zur Slide-Ansicht (eine Slide sichtbar) — mit denselben Songdaten, ohne
die Datei neu zu laden.

### AC7 — Sauberes Aufräumen
Nach dem Wechsel von Slide zu Eagle reagiert die Slide-Tastaturnavigation nicht mehr
(der Keyboard-Listener wurde via Dispose entfernt) — `ArrowRight` verändert die Eagle-
Ansicht nicht.

## Out of Scope

- Globaler Transpose/Suche in der Slide-Ansicht (Eagle hat sie; spätere Vereinheitlichung
  in der Shell möglich). `transposeSong` ist verfügbar, aber hier nicht Pflicht.
- Touch-/Swipe-Gesten, Beamer-Zweitfenster, Fortschritts-Timer.
- Import anderer Formate (eigene Spec: OnSong `.chopro`-Ordner).
