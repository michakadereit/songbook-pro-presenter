# TICKET-004: ViewSwitcher — globale Controls mit Views verdrahten

**Plan:** global-controls
**Depends on:** TICKET-002, TICKET-003
**Model:** Sonnet

## Ziel

Der ViewSwitcher hält den globalen Zustand (`globalQuery`, `globalTranspose`), verdrahtet
die Controls-Events mit den aktiven View-Handles und stellt sicher, dass beim View-Wechsel
der aktuelle Zustand an die neue View übergeben wird.

## Dateien

- `src/views/viewSwitcher.ts` — State-Verwaltung + Event-Verdrahtung + Mount-Aufrufe anpassen
- `src/views/viewSwitcher.test.ts` — neue Integrationstests

## Änderungen in `viewSwitcher.ts`

### 1. Handle-Typ erweitern

```ts
import type { SlideViewHandle } from './SlideView';
import type { EagleViewHandle } from './EagleView';

type ViewHandle = SlideViewHandle | EagleViewHandle | null;
```

### 2. State & Handle

```ts
let globalQuery = '';
let globalTranspose = 0;
let activeHandle: ViewHandle = null;
```

### 3. Mount-Aufrufe anpassen

```ts
function showView(mode: ViewMode): void {
  if (mode === currentMode) return;
  teardownCurrent(); // dispose + clear handle
  currentMode = mode;
  updateTabState(mode);

  if (mode === 'slide') {
    const handle = mountSlideView(viewContainer, set, {
      query: globalQuery,
      transpose: globalTranspose,
    });
    activeHandle = handle;
    slideDispose = () => handle.dispose(); // für teardownCurrent()
  } else {
    const handle = mountEagleView(viewContainer, set, {
      query: globalQuery,
      transpose: globalTranspose,
    });
    activeHandle = handle;
  }
}
```

### 4. Controls-Events verdrahten

In den Event-Listenern aus TICKET-001 (die bisher nur State halten):

```ts
searchInput.addEventListener('input', () => {
  globalQuery = searchInput.value;
  activeHandle?.setQuery(globalQuery);
});

transposeSlider.addEventListener('input', () => {
  globalTranspose = parseInt(transposeSlider.value, 10);
  transposeLabel.textContent = globalTranspose > 0 ? `+${globalTranspose}` : String(globalTranspose);
  activeHandle?.setTranspose(globalTranspose);
});
```

### 5. `teardownCurrent` anpassen

```ts
function teardownCurrent(): void {
  if (slideDispose !== null) {
    slideDispose();
    slideDispose = null;
  }
  activeHandle = null;
  viewContainer.replaceChildren();
}
```

## Akzeptanzkriterien (testbar)

- [ ] `viewSwitcher.test.ts`: Nach Tippen in `global-search` ruft der ViewSwitcher `setQuery()` auf der aktiven View auf (Spy / Mock).
- [ ] `viewSwitcher.test.ts`: Nach Bewegen des Transpose-Sliders ruft der ViewSwitcher `setTranspose()` auf der aktiven View auf.
- [ ] `viewSwitcher.test.ts`: Wechsel Slide → Eagle → globaler Query bleibt erhalten; Eagle wird mit `opts.query = <aktueller Term>` gemountet.
- [ ] `viewSwitcher.test.ts`: Wechsel Eagle → Slide → globaler Transpose bleibt erhalten; Slide wird mit `opts.transpose = <aktueller Offset>` gemountet.
- [ ] Browser-Verifikation (Playwright):
  - Suchfeld tippen in Slide → Position-Indikator filtert.
  - View-Wechsel → Filter bleibt aktiv in Eagle.
  - Transpose-Regler → Akkorde in Slide und Eagle transponiert.
  - View zurückwechseln → Transpose-Offset erhalten.

## Out of Scope

- Persistenz von `globalQuery` / `globalTranspose` in localStorage.
- Separate Offsets pro View.
