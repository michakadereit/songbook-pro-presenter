# Exec Plan: Presentation-UX

> Spec: [`docs/specs/presentation-ux/spec.md`](../../../specs/presentation-ux/spec.md)
> Branch: `feat/presentation-ux` · Erstellt 2026-06-26

## Ziel

UX-Bündel: Upload-UI vor dem Laden zentriert & danach versteckt, Theme-Umschalter
(Hell/Dunkel/Auto, persistent), Vollbild-Button, sowie in der SlideView ein
Schriftgrößen-Regler und ein Lyric-Suchfeld. Alle 12 ACs der Spec grün/verifiziert.

## Einordnung

- Shell-Themen (Upload-UX, Theme, Vollbild) leben in `src/main.ts` + kleinen Modulen
  (`theme.ts`, ggf. `fullscreen.ts`) + `styles/main.css`.
- SlideView-Themen (Schriftgröße, Suche) erweitern `src/views/SlideView.ts`.
- EagleView, viewSwitcher, Renderer, Parser bleiben unverändert (Suche/Schrift nur Slide).

## Empfohlene Modelle

Alle **Sonnet** (klar spezifiziert, gut testbar). Optional Opus für finalen CSS-Feinschliff
der Steuerleisten — bei Bedarf, nicht zwingend.

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | Upload-UX (zentriert → versteckt) | AC1, AC2 | — | Sonnet | TODO |
| TICKET-002 | Theme-Umschalter + Vollbild-Button | AC3, AC4, AC5 | 001 | Sonnet | TODO |
| TICKET-003 | SlideView Schriftgrößen-Regler | AC6 | — | Sonnet | TODO |
| TICKET-004 | SlideView Lyric-Suche + Tastatur-Guard | AC7–AC11 | 003 | Sonnet | TODO |

**Reihenfolge:** Sequenziell 001 → 002 → 003 → 004. 001/002 teilen `main.ts`, 003/004 teilen
`SlideView.ts`; alle teilen `styles/main.css` → sequenziell vermeidet Merge-Konflikte. Alle
als **Vordergrund-Agenten** (TDD-Verifikation braucht Bash). AC12 (Regression) wird über die
bestehenden Tests + Browser abgedeckt.

## Definition of Done (Plan)

- Logik-ACs als grüne Vitest-Tests (jsdom; Fullscreen/Theme via Spies/Property-Checks).
- `npx tsc --noEmit` sauber, `npm run build` ok, bestehende Tests grün.
- Browser-Verifikation: Upload zentriert→versteckt, Theme hell/dunkel/auto + persistent,
  Vollbild toggelt, Slide-Schriftregler skaliert Text+Akkorde, Slide-Suche filtert & tippen
  blättert nicht.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
