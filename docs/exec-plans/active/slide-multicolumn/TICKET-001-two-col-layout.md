# TICKET-001: CSS Zwei-Spalten-Layout + Toggle-Button

**Plan:** slide-multicolumn
**Depends on:** —
**Model:** Sonnet

## Ziel

Die Slide-View erhält einen Toggle-Button „2 Sp." in der Controls-Leiste. Bei Aktivierung
wechselt das Layout zu CSS Multi-Column: Song-Inhalt füllt zuerst die linke Spalte bis zum
unteren Rand, dann die rechte. Sections werden nicht über Spaltengrenzen getrennt.

## Dateien

- `src/views/SlideView.ts` — Toggle-Button + Klassen-Toggle
- `styles/main.css` — `.slide-view--two-col`-Modifier + Multi-Column-CSS
- `src/views/SlideView.test.ts` — neue Tests

## DOM-Änderung

Toggle-Button in `.slide-controls` (nach dem Schriftgrößen-Regler):

```ts
const twoColBtn = document.createElement('button');
twoColBtn.type = 'button';
twoColBtn.className = 'slide-two-col-btn';
twoColBtn.textContent = '2 Sp.';
twoColBtn.setAttribute('aria-pressed', 'false');

let twoCol = false;

twoColBtn.addEventListener('click', () => {
  twoCol = !twoCol;
  twoColBtn.setAttribute('aria-pressed', String(twoCol));
  wrapper.classList.toggle('slide-view--two-col', twoCol);
});

controls.appendChild(twoColBtn);
```

## CSS-Änderungen

### Warum `height: 100dvh` zwingend nötig ist

Gemessen: `.slide-view` ist content-driven (z. B. 5564 px für einen langen Song),
weil `min-height: 100dvh` nur einen Mindestwert setzt — der Inhalt treibt die Höhe.
`height: 100%` auf `.song` würde zu 100 % von 5564 px auflösen → kein Clip, kein Spalten-Effekt.

Lösung: Im Zwei-Spalten-Modus wird `.slide-view` auf exakt eine Viewport-Höhe gepinnt,
`.slide-body` darf schrumpfen (statt den Inhalt nach unten zu treiben),
und `.song` füllt die verbleibende Flex-Höhe.

### Zwei-Spalten-Modifier (vollständige CSS-Kaskade)

```css
/* 1. Slide-View auf exakt Viewport-Höhe pinnen (kein content-driven overflow) */
.slide-view--two-col {
  height: 100dvh;
  overflow: hidden;
}

/* 2. Body darf schrumpfen und clippt überlaufenden Inhalt */
.slide-view--two-col .slide-body {
  min-height: 0;              /* Flex-Item darf unter content-size schrumpfen */
  overflow: hidden;
  justify-content: flex-start; /* Kein center mehr — Inhalt beginnt oben */
}

/* 3. Song füllt die verbleibende Flex-Höhe und verteilt auf 2 Spalten */
.slide-view--two-col .slide-body .song {
  height: 100%;
  columns: 2;
  column-fill: auto;          /* Spalte 1 füllen, dann in Spalte 2 überlaufen */
  column-gap: clamp(2rem, 5vw, 4rem);
  column-rule: 1px solid var(--border);
}

.slide-view--two-col .slide-body .section {
  break-inside: avoid;        /* Section-Header + Zeilen bleiben zusammen */
}
```

### Toggle-Button-CSS

```css
.slide-two-col-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--fg-muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}

.slide-two-col-btn[aria-pressed="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--surface);
}
```

## Render-Verhalten

- `render()` in SlideView ändert sich **nicht** — der Toggle wirkt rein über CSS-Klassen.
- Der Toggle-Zustand (`twoCol`) überlebt Song-Navigation (der Button ist Teil des statischen
  DOM, das nur einmal gebaut wird).

## Akzeptanzkriterien (testbar)

- [ ] `SlideView.test.ts`: `.slide-controls` enthält einen Button mit Klasse `slide-two-col-btn`.
- [ ] `SlideView.test.ts`: Klick auf den Button setzt `aria-pressed="true"` und fügt `.slide-view--two-col` an `.slide-view` hinzu.
- [ ] `SlideView.test.ts`: Erneuter Klick entfernt `.slide-view--two-col` und setzt `aria-pressed="false"`.
- [ ] `SlideView.test.ts`: Navigation (next/prev) ändert den Toggle-Zustand nicht.
- [ ] Browser-Verifikation (Playwright): In einem Song mit vielen Sections füllt die zweite Spalte nach Aktivierung des Toggles.
- [ ] `npm test` bleibt grün.

## Out of Scope

- localStorage-Persistenz (TICKET-002).
- Auto-Detection, ob ein Song lang genug für zwei Spalten ist.
- Drei oder mehr Spalten.
