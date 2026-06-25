# TICKET-001 — SlideView-Kern (Render + Navigation + Keyboard)

> Plan: [SlideView](./README.md) · Spec ACs: AC1–AC5

## Ziel

`mountSlideView(root, set)` zeigt einen Song pro Slide, navigierbar per Tastatur, mit
Positionsanzeige; gibt eine Dispose-Funktion zurück (Keyboard-Listener entfernen).

## Abhängigkeiten

Keine harte (nutzt `renderSong`). Erstes Ticket des Plans.

## Deliverables

- `src/views/SlideView.ts`: `mountSlideView(root: HTMLElement, set: SongSet): () => void`.
  - Interner Index-State (Start 0).
  - `render()` baut: Wrapper `.slide-view`, Kopf mit Positionsanzeige `.slide-position`
    („<n> / <gesamt>") und Titel, darunter `renderSong(currentSong, { showChords:true,
    showLyrics:true, chordRatio:0.8 })`. Bei jedem Wechsel nur den aktuellen Song zeigen
    (`root.replaceChildren(...)` neu rendern).
  - Navigation: `next()`/`prev()`/`first()`/`last()` mit **Klemmen** (kein Wrap).
  - Keyboard-Listener (auf `window`): `ArrowRight`/`' '` → next, `ArrowLeft` → prev,
    `Home` → first, `End` → last. `preventDefault` für Space, damit nicht gescrollt wird.
  - Rückgabe: `dispose()` entfernt den Keyboard-Listener.

## Acceptance Criteria

- AC1: Nach `mountSlideView(root, set)` ist genau ein Song (der erste) im DOM des Slides;
  sein Titel steht oben.
- AC2: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))` zeigt den
  nächsten Song; `' '` (Space) ebenso; `ArrowLeft` einen zurück.
- AC3: Bei Index 0 ändert `ArrowLeft` nichts; beim letzten Song ändert `ArrowRight` nichts.
  `Home` → erster, `End` → letzter.
- AC4: `.slide-position` zeigt „<aktuell> / <gesamt>" (nach einem `→`: „2 / 5" im Sample-
  Größenbereich; im Test mit eigenem Fixture entsprechend).
- AC5: Der sichtbare Slide enthält `.seg__chord` (Akkorde) UND Lyric-Text; kein `[`/`]`/`{c:`
  im `textContent`.
- Tests in `src/views/SlideView.test.ts` (neu) für AC1–AC5 grün; bestehende Tests grün.

## Out of Scope

- Vollbild-Styling/Design → TICKET-002.
- View-Umschalter → TICKET-003.
- Transpose/Suche in der Slide-Ansicht.
