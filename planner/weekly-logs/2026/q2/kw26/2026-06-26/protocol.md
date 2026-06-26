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
