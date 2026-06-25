# Exec Plan: SongRenderer

> Spec: [`docs/specs/song-renderer/spec.md`](../../../specs/song-renderer/spec.md)
> Branch: `feat/song-renderer` · Erstellt 2026-06-25

## Ziel

`renderSong(song, options): HTMLElement` implementieren — die **geteilte** Komponente,
die ein einzelnes Lied mit Akkorden über den Silben rendert. Grundlage für SlideView
(volle Anzeige) und EagleView (nur Akkorde). Alle 7 ACs der Spec grün.

## Einordnung

SongRenderer ist **keine View**. Er ist der gemeinsame Baustein beider Views:
- SlideView: `{ showChords: true, showLyrics: true }`
- EagleView: `{ showChords: true, showLyrics: false }`

## Empfohlenes Modell

- TICKET-001 / TICKET-002 (Render-Logik): **Sonnet** — klar spezifiziert, unit-testbar.
- TICKET-003 (modernes CSS-Design): **Opus** empfohlen für visuelle Qualität/Feinschliff;
  Sonnet möglich, da die Technik (Segment-Stacking, Tokens) in der Spec festgelegt ist.

## Rendering-Technik (aus Spec)

Segment-Stacking statt Monospace: Zeile an Akkord-Positionen in `.seg`-Segmente teilen,
je Segment Akkord per `flex-direction: column` über der Silbe; Zeile `flex-wrap` für
responsiven Umbruch. Tokens via `clamp()`, `light-dark()`, `--chord-ratio`.

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | Render-Logik & DOM-Struktur | AC1, AC2, AC6, AC7 | — | Sonnet | ✅ DONE |
| TICKET-002 | Render-Optionen (Toggles + Ratio) | AC3, AC4, AC5 | 001 | Sonnet | ✅ DONE |
| TICKET-003 | Modernes CSS-Design & Layout | visuell (stützt AC2/AC6) | 002 | Opus | ✅ DONE |

**Abgeschlossen 2026-06-25:** 32 Tests grün, `tsc`/Build sauber, im Browser verifiziert
(Akkorde exakt über Silben, Transposition A/B/D# sichtbar). Gemergt nach `main`.

Sequenziell (001 → 002 → 003): 002 setzt die DOM-Struktur aus 001 voraus; 003 stylt die
in 001/002 vergebenen Klassennamen.

## Vorgehen je Ticket (TDD)

Pro Ticket: Red-Tests aus den ACs ableiten (Vitest + jsdom für DOM; Browser-Verifikation
für TICKET-003), dann implementieren bis grün. Branch `feat/song-renderer`.

## Definition of Done (Plan)

- Alle DOM-bezogenen ACs als grüne Vitest-Tests (`src/components/SongRenderer.test.ts`).
- `npx tsc --noEmit` sauber, `npm run build` ok.
- Browser-Verifikation: ein Beispiel-Song rendert sichtbar mit Akkorden über den Silben;
  Toggles und `--chord-ratio` wirken; Light/Dark via `prefers-color-scheme` ok.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
