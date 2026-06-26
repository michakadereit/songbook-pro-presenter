# TICKET-002 — Theme-Umschalter + Vollbild-Button

> Plan: [Presentation-UX](./README.md) · Spec ACs: AC3, AC4, AC5

## Ziel

Einen Theme-Umschalter (Hell/Dunkel/Auto, persistent) und einen Vollbild-Button in die
App-Shell einbauen.

## Abhängigkeiten

TICKET-001 (Shell-Struktur in `main.ts`).

## Deliverables

- `src/theme.ts` (neu), reine/testbare Funktionen:
  - `type Theme = 'auto' | 'light' | 'dark'`.
  - `nextTheme(current: Theme): Theme` → Auto → Hell → Dunkel → Auto.
  - `applyTheme(theme: Theme): void` → setzt `document.documentElement.style.colorScheme`
    auf `'light dark'` (auto) / `'light'` / `'dark'` und speichert in
    `localStorage['theme']`.
  - `loadTheme(): Theme` → liest `localStorage['theme']`, Default `'auto'`.
- `src/fullscreen.ts` (neu) ODER inline in main.ts:
  - `toggleFullscreen(el: Element): void` → wenn `document.fullscreenElement` null ist
    `el.requestFullscreen()`, sonst `document.exitFullscreen()`.
- `src/main.ts`: kleine Shell-Header-Leiste (z.B. oben rechts) mit Theme-Button und
  Vollbild-Button. Theme-Button-Label spiegelt den Zustand (z.B. „Auto/Hell/Dunkel"). Beim
  Start `applyTheme(loadTheme())`. Vollbild-Button-Label per `fullscreenchange` aktualisieren.
- `styles/main.css`: schlichtes Button-Styling (bestehende Tokens).

## Acceptance Criteria

- AC3: `nextTheme` zyklt korrekt; `applyTheme('dark')` setzt
  `documentElement.style.colorScheme === 'dark'` (analog 'light' und 'light dark' für auto);
  Klick auf den Button im DOM wechselt den Zustand und das Label.
- AC4: `applyTheme` persistiert in `localStorage`; `loadTheme()` liefert den Wert; beim
  Start wird er angewandt (Test: localStorage setzen → loadTheme/applyTheme → colorScheme).
- AC5: `toggleFullscreen(el)` ruft `el.requestFullscreen` auf, wenn kein
  `document.fullscreenElement`, sonst `document.exitFullscreen` (Test mit Spies/Mocks, da
  jsdom die API nicht hat — Funktionen ggf. auf `document`/`el` mocken).
- Tests in `src/theme.test.ts` (+ ggf. `src/fullscreen.test.ts`) grün; bestehende grün; `tsc` sauber.

## Out of Scope

- Tastatur-Shortcuts. Theme-Auswahl in der Slide-Steuerleiste (gehört in die Shell).
