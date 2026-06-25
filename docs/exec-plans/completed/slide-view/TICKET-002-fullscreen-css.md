# TICKET-002 — Vollbild-CSS-Design

> Plan: [SlideView](./README.md) · Spec: Präsentationslook

## Ziel

Die Slide-Ansicht als ruhiger, gut lesbarer Vollbild-Präsentationslook (Beamer/Bühne),
auf Basis der bestehenden Design-Tokens.

## Abhängigkeiten

TICKET-001 (Klassen `.slide-view`, `.slide-position`, der gerenderte `.song`).

## Deliverables (in `styles/main.css`)

- `.slide-view`: füllt den Viewport (z.B. `min-height: 100dvh`), zentrierter Inhalt,
  großzügige Ränder; Inhalt vertikal angenehm platziert.
- Großer, gut lesbarer Lyric/Akkord-Satz (Präsentationsgröße via `clamp()`, ggf. eigener
  `--font-lyric`-Override im Slide-Kontext oder ein größerer Ratio).
- `.slide-position` dezent (oben, gedämpft) plus prominenter Song-Titel.
- Light/Dark über die vorhandenen Tokens; auf Bühne lesbare Kontraste.
- Kein „Springen" beim Wechsel; Akkorde bleiben exakt über den Silben (SongRenderer-Layout
  nicht brechen).

## Acceptance Criteria

- Browser-Verifikation: ein Song füllt angenehm den Bildschirm, Titel + Position oben,
  Akkorde über Silben, große Lesbarkeit aus Distanz.
- `prefers-color-scheme` hell/dunkel beide lesbar.
- `npm run build` ok; keine Konsolenfehler (außer ggf. favicon 404).

## Out of Scope

- Navigationslogik (TICKET-001), Umschalter (TICKET-003).
