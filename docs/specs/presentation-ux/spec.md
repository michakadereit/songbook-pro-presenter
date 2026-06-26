# Spec: Presentation-UX (Slide-Controls, Vollbild, Upload-UX, Theme)

> Status: Draft · Erstellt 2026-06-26

## Ziel

Ein Bündel von UX-Verbesserungen für den Live-Einsatz:

- **A. Upload-UX:** Vor dem Laden stehen die Upload-Buttons zentriert (horizontal +
  vertikal); nach dem Laden verschwinden sie und der View nimmt den Platz ein.
- **B. Theme-Umschalter:** Schnell zwischen Hell / Dunkel / Automatisch wechseln (nutzt das
  vorhandene `light-dark()`-Token-System), Auswahl bleibt erhalten.
- **C. Vollbildmodus:** Ein Button schaltet Vollbild (Fullscreen API) ein/aus.
- **D. Schriftgröße (SlideView):** Regler vergrößert/verkleinert Text **und** Akkorde.
- **E. Lyric-Suche (SlideView):** Suchfeld filtert die navigierbaren Songs nach Lyrics.

## Verhalten

### A — Upload-UX
- Solange **kein** Set geladen ist: die zwei Eingänge (`.sbp`-Datei + OnSong-Ordner) sind
  in einem Container, der sie horizontal und vertikal im Viewport zentriert.
- Sobald ein Set geladen ist: dieser Upload-Container wird ausgeblendet; View-Umschalter +
  View erscheinen. (Erneutes Laden eines Sets → Seite neu laden; out of scope: „Set
  wechseln"-Affordance.)

### B — Theme
- Ein Theme-Button zyklisch: **Auto → Hell → Dunkel → Auto** (Label/Icon spiegelt Zustand).
- Setzt `color-scheme` an `:root` (`light dark` = Auto, `light`, `dark`), wodurch alle
  `light-dark()`-Tokens sofort umschalten.
- Auswahl wird in `localStorage` gespeichert und beim Start wiederhergestellt.
- Default: Auto (folgt `prefers-color-scheme`).

### C — Vollbild
- Ein Button schaltet Vollbild für die App-Wurzel: `requestFullscreen()` /
  `exitFullscreen()`. Label/Icon spiegelt den Zustand (per `fullscreenchange`).

### D — Schriftgröße (SlideView)
- Slider 60 %–200 %, Default 100 %; Wert sichtbar („100 %"). Setzt `--slide-font-scale` am
  Slide-Wrapper; `.slide-body` skaliert die Lyric-Größe damit, Akkorde wachsen mit (relativ
  zur Lyric-`em` über `--chord-ratio`).

### E — Lyric-Suche (SlideView)
- Eingabe filtert die Songliste case-insensitiv nach Lyric-Text; nur Treffer navigierbar;
  Slide springt auf den ersten Treffer; Position „<x> / <Trefferzahl>".
- `←`/`→`/Leertaste/`Home`/`End` bewegen nur innerhalb der Treffer (klemmen).
- Leeres Feld → alle Songs; keine Treffer → „0 / 0" + Hinweis, kein Song-Body.
- **Tastatur-Guard:** Liegt der Fokus in einem `<input>` (Suchfeld), blättert der globale
  Keydown-Handler NICHT (man kann ungestört tippen).

## Akzeptanzkriterien

### Upload-UX
- **AC1** — Vor dem Laden: ein Upload-Container mit beiden Eingängen ist im Viewport
  horizontal + vertikal zentriert; kein View gemountet.
- **AC2** — Nach erfolgreichem Laden: der Upload-Container ist ausgeblendet (nicht im
  Layout sichtbar); View-Umschalter + View sind sichtbar.

### Theme
- **AC3** — Klick auf den Theme-Button zyklt Auto → Hell → Dunkel → Auto und setzt
  `document.documentElement.style.colorScheme` entsprechend (`light dark` / `light` / `dark`);
  der Button-Text/-Zustand spiegelt die Wahl.
- **AC4** — Nach Reload ist die zuletzt gewählte Theme-Einstellung wieder aktiv
  (`localStorage`).

### Vollbild
- **AC5** — Ein Vollbild-Button ruft beim Aktivieren `requestFullscreen()` auf der
  App-Wurzel auf und beim erneuten Klick `document.exitFullscreen()` (verifiziert über
  Spies, da jsdom die Fullscreen-API nicht implementiert).

### Schriftgröße
- **AC6** — Der Schriftgrößen-Slider setzt `--slide-font-scale` am Slide-Wrapper auf den
  gewählten Faktor (z.B. `1.5`); Wertanzeige spiegelt ihn („150 %"). Default 1 / „100 %".

### Lyric-Suche
- **AC7** — Ein Begriff, der nur in bestimmten Songs vorkommt, reduziert die Navigation auf
  diese; die Slide zeigt den ersten Treffer; Position „1 / <Trefferzahl>".
- **AC8** — Bei aktiver Suche klemmt `ArrowRight`/`ArrowLeft` innerhalb der Treffer.
- **AC9** — Suchfeld leeren → alle Songs navigierbar; Position „<x> / <gesamt>".
- **AC10** — Begriff ohne Treffer → Position „0 / 0" (+ Hinweis), kein Song-Body, kein Crash.
- **AC11** — Ein `keydown` (`' '` oder `ArrowRight`) mit `target` = `<input>` verändert den
  aktuellen Song NICHT.

### Regression
- **AC12** — Ohne Sucheingabe/Slider-Änderung verhält sich die SlideView wie zuvor (eine
  Slide, Titel oben, „1 / <gesamt>", Klemmen). EagleView + View-Umschalter unverändert.

## Out of Scope

- Suche/Schriftgröße in der EagleView (Schriftgröße hier nur Slide).
- „Set wechseln" ohne Reload; Persistenz von Suche/Schriftgröße.
- Tastatur-Shortcut für Vollbild/Theme (nur Buttons).
