# TICKET-003 — Modernes CSS-Design & Layout

> Plan: [SongRenderer](./README.md) · Spec: Design-Tokens + Rendering-Technik

## Ziel

Das visuelle Design: sauberes, modernes CSS, das die Akkord-über-Silbe-Darstellung
korrekt und responsiv umsetzt und projektweite Design-Tokens etabliert.

## Abhängigkeiten

TICKET-002 (alle Klassennamen + `--chord-ratio` vorhanden).

## Deliverables (in `styles/main.css`)

- **Design-Tokens** in `:root`:
  - `color-scheme: light dark;` + Farb-Tokens via `light-dark(<hell>, <dunkel>)`
    (Hintergrund, Text, gedämpfter Text, Akzent, Akkord-Farbe).
  - Fluide Typo via `clamp()` in `rem` (z.B. `--font-lyric: clamp(1rem, 0.9rem + 1.2vw, 1.5rem)`).
  - Spacing-Skala, `--chord-ratio` Default (z.B. 0.8), System-Font-Stack.
- **Segment-Stacking-Layout**:
  - `.line { display: flex; flex-wrap: wrap; align-items: flex-end; }`
  - `.seg { display: inline-flex; flex-direction: column; }`
  - `.seg__chord { font-size: calc(1em * var(--chord-ratio)); color: var(--accent); min-height: 1em; line-height: 1.1; }`
    (min-height reserviert die Akkord-Zeile auch ohne Akkord → Baseline-Ausrichtung, AC6).
  - `.seg__lyric { white-space: pre; }` (signifikante Leerzeichen aus dem Parser erhalten).
- **Song/Section-Styling**: lesbare Abstände, Titel-Hierarchie, angenehme Zeilenhöhe.
- Toggles aus TICKET-002 visuell sauber (kein „Springen" beim Ausblenden).

## Acceptance Criteria

- Browser-Verifikation (Playwright/manuell): ein Beispiel-Song rendert mit Akkorden exakt
  über den richtigen Silben; bei schmaler Breite bricht die Zeile um, ohne dass Akkorde
  von ihren Silben „abreißen".
- `prefers-color-scheme: dark` und `light` liefern beide lesbare Kontraste.
- `--chord-ratio` per DevTools/Slider verändert sichtbar nur die Akkord-Größe.
- Akkordlose Zeilen (`(x2)`) sind vertikal sauber zu Akkordzeilen ausgerichtet.
- `npm run build` ok; keine Konsolen-Fehler (außer ggf. favicon 404).

## Out of Scope

- Slider-UI / Controls (gehört zu den Views bzw. App-Shell).
- View-spezifisches Layout (Vollbild-Slide, Eagle-Grid).
