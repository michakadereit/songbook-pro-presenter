# TICKET-001: Global Controls DOM + CSS im ViewSwitcher

**Plan:** global-controls
**Depends on:** —
**Model:** Sonnet

## Ziel

Den ViewSwitcher um eine globale Kontrollleiste erweitern: Suchfeld und Transpose-Regler
werden als DOM-Elemente in `viewSwitcher.ts` angelegt. In diesem Ticket noch **keine**
funktionale Verdrahtung mit den Views — nur DOM, CSS und sauberes API.

## Dateien

- `src/views/viewSwitcher.ts` — DOM erweitern
- `styles/main.css` — CSS für `.global-controls`
- `src/views/viewSwitcher.test.ts` — Tests für neue DOM-Elemente

## Anforderungen

### API-Änderung in `mountViewSwitcher`

`mountViewSwitcher` gibt bisher `{ dispose() }` zurück. Das Rückgabe-Objekt wird um
Lese-Accessoren erweitert, die in TICKET-004 von der Verdrahtungslogik genutzt werden:

```ts
// Rückgabe nach diesem Ticket (noch kein setQuery/setTranspose — kommt in TICKET-004)
{
  dispose(): void;
}
```

Intern hält der ViewSwitcher bereits den Zustand:
```ts
let globalQuery = '';
let globalTranspose = 0;
```

### DOM-Ergänzung

Die globale Kontrollleiste (`.global-controls`) wird **innerhalb von `.view-tabs`** eingefügt,
rechts der Tab-Buttons (flex-layout):

```
.view-tabs
  button[data-view="slide"]   ← Tab: Slide
  button[data-view="eagle"]   ← Tab: Eagle
  .global-controls            ← NEU: Suchfeld + Transpose
    input[type="search"]      ← .global-search
    input[type="range"]       ← .global-transpose-slider (min=-6, max=6, step=1)
    span.global-transpose-value ← zeigt "0" / "+2" / "-3"
```

### CSS (`.global-controls`)

- Nimmt den restlichen Platz in `.view-tabs` (`flex: 1`)
- Flex-Row mit `gap`, Elemente rechts ausgerichtet (`justify-content: flex-end`)
- Suchfeld: `min-width: 10rem; max-width: 20rem; flex: 1` — wächst, schrumpft
- Transpose-Slider: `width: clamp(6rem, 15vw, 10rem)` (wie `.transpose-slider`)
- Transpose-Value: wie `.transpose-value` (bestehende CSS-Klassen wiederverwenden)
- Responsive: unter ~480 px in eine zweite Zeile umbrechen (`.view-tabs { flex-wrap: wrap }`)

### Innere Event-Listener (State halten, noch nicht weiterleiten)

```ts
searchInput.addEventListener('input', () => {
  globalQuery = searchInput.value;
  // TICKET-004 wird hier activeHandle.setQuery(globalQuery) aufrufen
});

transposeSlider.addEventListener('input', () => {
  globalTranspose = parseInt(transposeSlider.value, 10);
  transposeLabel.textContent = globalTranspose > 0 ? `+${globalTranspose}` : String(globalTranspose);
  // TICKET-004 wird hier activeHandle.setTranspose(globalTranspose) aufrufen
});
```

## Akzeptanzkriterien (testbar)

- [ ] `viewSwitcher.test.ts`: `.global-controls` ist im DOM des Switchers vorhanden.
- [ ] `viewSwitcher.test.ts`: `input[type="search"]` mit Klasse `global-search` vorhanden.
- [ ] `viewSwitcher.test.ts`: `input[type="range"]` mit Klasse `global-transpose-slider` vorhanden, `min="-6"`, `max="6"`.
- [ ] `viewSwitcher.test.ts`: `span.global-transpose-value` zeigt initial `"0"`.
- [ ] Tippen im `global-search`-Input aktualisiert den internen `globalQuery`-State (Blackbox: noch kein Observable nach außen — Unit-Test prüft DOM-Interaktion).
- [ ] Slider-Interaktion aktualisiert `span.global-transpose-value` (prüfbar via DOM).

## Out of Scope

- Verdrahtung mit SlideView / EagleView (TICKET-004)
- Entfernen der view-internen Controls (TICKET-002, TICKET-003)
- Transpose-Support in SlideView (TICKET-003)
