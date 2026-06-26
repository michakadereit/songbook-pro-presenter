# TICKET-003 — SlideView Schriftgrößen-Regler

> Plan: [Presentation-UX](./README.md) · Spec ACs: AC6

## Ziel

In der SlideView einen Schriftgrößen-Regler, der Text **und** Akkorde gemeinsam skaliert.

## Abhängigkeiten

Keine harte (eigenständig in `SlideView.ts`); läuft nach 001/002 wegen geteilter `main.css`.

## Deliverables

- `src/views/SlideView.ts`: eine Steuerleiste `.slide-controls` (oberhalb des Slides)
  einführen — in diesem Ticket mit dem **Schriftgrößen-Slider**:
  - `<input type="range" min="60" max="200" step="10" value="100">` plus Wertanzeige
    („100 %").
  - `input`-Event → `wrapper.style.setProperty('--slide-font-scale', String(value/100))` am
    Slide-Wrapper (oder an `.slide-view`). Der Wert überlebt das Neu-Rendern bei Navigation
    (State im Closure halten und bei jedem `render()` erneut setzen).
- `styles/main.css`: `.slide-body { font-size: calc(var(--font-lyric) * var(--slide-font-scale, 1)); }`
  (bzw. den bestehenden `--font-lyric`-Override im Slide-Kontext mit dem Faktor multiplizieren).
  Akkorde skalieren automatisch mit (relativ zur Lyric-`em`). Steuerleiste schlicht stylen.

## Acceptance Criteria

- AC6: Slider-`input` mit Wert 150 setzt `--slide-font-scale` am Wrapper auf `1.5`; die
  Wertanzeige zeigt „150 %". Default 1 / „100 %". Nach Navigation (`render()`) bleibt der
  gesetzte Faktor erhalten.
- Tests in `src/views/SlideView.test.ts` ergänzen (Slider-Wert setzen + `input` dispatchen →
  Property + Label prüfen; nach `ArrowRight` Faktor noch gesetzt).
- Bestehende SlideView-Tests grün; `tsc` sauber.

## Out of Scope

- Lyric-Suche (TICKET-004). Schriftgröße in der EagleView.
