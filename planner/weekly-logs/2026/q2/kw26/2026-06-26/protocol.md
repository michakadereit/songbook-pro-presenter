# Protokoll 2026-06-26

## Gemacht
- Neue User-Wünsche für die Präsentation gebündelt: Slide-Suche, Slide-Schriftgrößen-Regler,
  Vollbildmodus, Upload-UI vor dem Laden zentriert & danach versteckt, Theme-Umschalter
  (Hell/Dunkel/Auto).
- `docs/specs/presentation-ux/spec.md` geschrieben (12 ACs) + Exec Plan `presentation-ux`
  (4 Tickets: Upload-UX / Theme+Vollbild / Slide-Schriftgröße / Slide-Suche+Tastatur-Guard).
- Design-Entscheidung: Slide-Suche filtert die **Navigation** (Sprung zum 1. Treffer, `←/→`
  nur durch Treffer, Position „x / Trefferzahl"); Tastatur-Guard, damit Tippen nicht blättert.

## Entscheidungen
- Eine kombinierte „Presentation-UX"-Spec statt fünf Mini-Pläne (kohärentes UX-Bündel).
- Shell-Themen (Upload/Theme/Vollbild) in `main.ts` + `theme.ts`/`fullscreen.ts`; Slide-Themen
  in `SlideView.ts`. Renderer/Parser/Eagle/Switcher bleiben unangetastet.
- Theme via `color-scheme` an `:root` (nutzt bestehendes `light-dark()`), persistent in localStorage.

- Presentation-UX umgesetzt: 001 → 002 → 003 → 004 (Sonnet, Vordergrund), je verifiziert.
  Endstand: **163 Tests grün**, `tsc`/Build sauber.
- Browser-verifiziert: Upload zentriert (vorher) → ausgeblendet (nachher, `body.has-set`);
  Theme Auto→Hell→Dunkel→Auto inkl. `colorScheme` + localStorage; Schrift-Slider 150 % setzt
  `--slide-font-scale: 1.5` (Akkorde skalieren mit); Slide-Suche „great"→„1/2", `→` klemmt
  „2/2", kein Treffer→„0/0"+„Keine Treffer", Tastatur-Guard ok; View-Umschalter intakt.
- Neue Module: `theme.ts`, `fullscreen.ts`; jsdom-`localStorage`-Mock via `src/test-setup.ts`
  (+ `vite.config.ts` setupFiles). SlideView in Controls (einmal) + Body (re-render) getrennt.
- `feat/presentation-ux` nach `main` gemergt, Branch gelöscht; Plan → `completed/`, Tickets DONE.

- Session-Erkenntnisse in `CLAUDE.md` festgehalten: aktualisierte Projektstruktur/Modulkarte +
  Architektur-Regel (Import-Schicht), Sub-Agent-Orchestrierung (Vordergrund wg. Bash, Modellwahl,
  Selbst-Verifikation), Browser-Verifikation (Playwright MCP), Test-Gotchas (process.cwd-Fixtures,
  jsdom-localStorage-Mock, vitest/config, kein `git add -A`), CSS-/Rendering-Konventionen,
  Format-Notizen (Header-Stile, Versionszeile, Nashville, OnSong .chopro vs .xml).

## Nächste Schritte
- Optional: echtes Fullscreen am Gerät prüfen (headless blockiert); Tastatur-Shortcut dafür.
- Optional: globalen Transpose/Suche in die Shell heben; Schrift-Slider auch für Eagle.

---

## Session 2 — Planung global-controls + slide-multicolumn

### Gemacht
- Zwei neue Feature-Requests aufgenommen:
  1. **Global Controls**: Suchfeld + Transpose-Regler global im ViewSwitcher (view-unabhängig)
  2. **Slide Multi-Column**: Zwei-Spalten-Layout in der Slide-View (Inhalt fließt rechts weiter)
- Specs geschrieben:
  - `docs/specs/global-controls/spec.md` (10 ACs)
  - `docs/specs/slide-multicolumn/spec.md` (6 ACs)
- Exec Plans angelegt:
  - `docs/exec-plans/active/global-controls/` (4 Tickets: DOM → Eagle-Refactor → Slide-Refactor → Wire)
  - `docs/exec-plans/active/slide-multicolumn/` (2 Tickets: CSS-Toggle → localStorage)

### Entscheidungen
- **global-controls**: ViewSwitcher wird State-Owner für Query + Transpose; Views bekommen
  ein optionales `opts`-Objekt beim Mount + geben Handle zurück (setQuery/setTranspose).
  Schriftgrößen-Regler bleibt Slide-spezifisch.
- **slide-multicolumn**: CSS Multi-Column (`columns: 2; column-fill: auto; height: 100%`) +
  CSS-Modifier `.slide-view--two-col`; kein Auto-Detection, Toggle-Button als explizite UX.
  Persistenz in localStorage (TICKET-002).
- **Reihenfolge**: `global-controls` zuerst (ändert SlideView-API), dann `slide-multicolumn`
  branchen — kein Merge-Konflikt-Risiko.

### Nächste Schritte
- `feat/global-controls` branchen → TICKET-001 → 002 → 003 → 004 (alle Sonnet, Vordergrund)
- Danach `feat/slide-multicolumn` → TICKET-001 → 002 (Sonnet / Haiku)

---

## Session 3 — Implementierung global-controls + slide-multicolumn

### Gemacht
- **global-controls** (4 Tickets, sequenziell, je Sonnet-Agent im Vordergrund):
  - T-001: `.global-controls` DOM+CSS in ViewSwitcher (Suchfeld + Transpose-Slider in Tab-Leiste)
  - T-002: EagleView ohne eigene Controls — gibt `EagleViewHandle` mit `setQuery`/`setTranspose` zurück
  - T-003: SlideView ohne eigene Suche, mit Transpose-Support — gibt `SlideViewHandle` zurück
  - T-004: ViewSwitcher verdrahtet Controls mit aktivem View-Handle; View-Wechsel übergibt State
  - Browser-Verifikation: Suche filtert Slide (1/1) + Eagle (4 versteckt/1 sichtbar); Transpose +2 → A→B, E→F#; View-Wechsel behält beides
  - Merge auf main, Branch gelöscht, Plan → completed/
- **slide-multicolumn** (2 Tickets, sequenziell):
  - T-001: CSS `.slide-view--two-col` mit `height:100dvh`-Pinning, `columns:2`, `break-inside:avoid`; Toggle-Button „2 Sp."
  - T-002: localStorage-Persistenz (`slide-two-col`-Key)
  - Browser-Verifikation: `.slide-view` schrumpft 5555 px → 989 px; `column-count:2`; Inhalt fließt rechts weiter
  - Merge auf main, Branch gelöscht, Plan → completed/

### Entscheidungen
- **Viewport-Pinning** war der kritische CSS-Bug im Plan: ohne `height:100dvh` auf `.slide-view--two-col` hätte `height:100%` auf `.song` zur content-driven Höhe aufgelöst → kein Clip. Durch Playwright-Messung (5555 px vs. 933 px Viewport) im Vorfeld erkannt und korrigiert.
- **Sequentielle Agenten im Vordergrund**: alle 6 Tickets liefen sauber durch. Kein Merge-Konflikt, da global-controls erst vollständig in main war, bevor slide-multicolumn gebranchtet wurde.

### Endstand
- **198 Tests grün**, `tsc` sauber, Build sauber
- Beide Feature-Branches gelöscht, beide Pläne in completed/
- Schriftgrößen-Slider-Minimum auf 30 % erweitert (kleinere Commit am selben Tag)
