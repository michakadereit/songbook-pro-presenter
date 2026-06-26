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

## Nächste Schritte
- Implementieren: 001 → 002 → 003 → 004 (Vordergrund-Agenten, Sonnet), je verifiziert.
- Browser-Verifikation am Ende, dann Merge + Plan → completed.
