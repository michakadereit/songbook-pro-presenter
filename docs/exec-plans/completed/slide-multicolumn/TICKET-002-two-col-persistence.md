# TICKET-002: localStorage-Persistenz des Column-Toggle-Zustands

**Plan:** slide-multicolumn
**Depends on:** TICKET-001
**Model:** Haiku

## Ziel

Der Zwei-Spalten-Toggle-Zustand wird in `localStorage` gespeichert und beim nächsten
Öffnen der App wiederhergestellt. Minimaländerung in `SlideView.ts`.

## Dateien

- `src/views/SlideView.ts` — laden + speichern
- `src/views/SlideView.test.ts` — localStorage-Test (Mock über `test-setup.ts`)

## Konstante

```ts
const TWO_COL_KEY = 'slide-two-col';
```

## Änderungen

### Initial-Wert laden (beim Mount)

```ts
let twoCol = localStorage.getItem(TWO_COL_KEY) === 'true';

// Sofort anwenden, falls gespeicherter Zustand "true" ist:
if (twoCol) {
  wrapper.classList.add('slide-view--two-col');
  twoColBtn.setAttribute('aria-pressed', 'true');
}
```

### Zustand speichern (im Click-Listener)

```ts
twoColBtn.addEventListener('click', () => {
  twoCol = !twoCol;
  twoColBtn.setAttribute('aria-pressed', String(twoCol));
  wrapper.classList.toggle('slide-view--two-col', twoCol);
  localStorage.setItem(TWO_COL_KEY, String(twoCol));   // NEU
});
```

## Akzeptanzkriterien (testbar)

- [ ] `SlideView.test.ts`: Wenn `localStorage.getItem('slide-two-col') === 'true'` gesetzt ist, hat `.slide-view` nach dem Mount die Klasse `.slide-view--two-col`.
- [ ] `SlideView.test.ts`: Nach Klick auf den Toggle-Button schreibt `localStorage.getItem('slide-two-col')` den aktuellen Zustand (`'true'` oder `'false'`).
- [ ] `npm test` bleibt grün (localStorage-Mock aus `test-setup.ts` wird genutzt).

## Hinweis

`test-setup.ts` stellt bereits einen In-Memory-`localStorage`-Mock bereit — kein weiterer
Setup-Aufwand nötig. Vor dem Test-Run `localStorage.clear()` aufrufen, um Isolation zu
gewährleisten.

## Out of Scope

- Persistenz von globalQuery / globalTranspose (Out of scope für beide Pläne).
- Migration von alten localStorage-Schlüsseln.
