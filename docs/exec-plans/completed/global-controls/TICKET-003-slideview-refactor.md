# TICKET-003: SlideView — Suche entfernen, Transpose-Support, externes State-API

**Plan:** global-controls
**Depends on:** TICKET-001
**Model:** Sonnet

## Ziel

`mountSlideView` erhält ein optionales Init-State-Objekt und gibt einen erweiterten Handle
zurück. Das interne Suchfeld wird aus der Controls-Leiste entfernt (die Leiste bleibt für
den Schriftgrößen-Regler). Neu: Transpose-Support via `transposeSong`.

## Dateien

- `src/views/SlideView.ts` — API-Änderung + Suche entfernen + Transpose
- `src/views/SlideView.test.ts` — Tests anpassen + neue Tests
- `styles/main.css` — `.slide-search`-CSS kann bleiben (schadet nicht)

## API-Änderung

### Vorher

```ts
export function mountSlideView(root: HTMLElement, set: SongSet): () => void
// Rückgabe: dispose-Funktion
```

### Nachher

```ts
export interface SlideViewHandle {
  dispose(): void;
  setQuery(q: string): void;
  setTranspose(n: number): void;
}

export function mountSlideView(
  root: HTMLElement,
  set: SongSet,
  opts?: { query?: string; transpose?: number },
): SlideViewHandle
```

- Rückgabe ist jetzt ein Objekt statt einer reinen Funktion — `dispose()` bleibt vorhanden.
- `opts.query` — Initialer Suchbegriff; `rebuildMatches()` wird mit diesem Wert aufgerufen.
- `opts.transpose` — Initialer Transpose-Offset (default `0`).

## DOM-Änderungen

- `searchInput` und seine Event-Listener werden aus `.slide-controls` entfernt.
- `.slide-controls` enthält danach **nur noch** den Schriftgrößen-Regler + Label.
- Falls `.slide-controls` damit ganz leer wird, kann das `controls`-Element ausgeblendet
  oder entfernt werden — Schriftgrößen-Regler bleibt.

## Transpose-Implementierung

```ts
import { transposeSong } from '../transpose';

let transpose = opts?.transpose ?? 0;

function render(): void {
  // ...
  const song = set.songs[matches[cursor]];
  const transposed = transpose !== 0 ? transposeSong(song, transpose) : song;
  body.replaceChildren(
    renderSong(transposed, { showChords: true, showLyrics: true, chordRatio: 0.8 }),
  );
}
```

`setTranspose(n)`:
```ts
function setTranspose(n: number): void {
  transpose = n;
  render();
}
```

## Rückgabe-Kompatibilität

`viewSwitcher.ts` ruft bisher `slideDispose = mountSlideView(...)` auf und speichert die
Funktion direkt. Nach dieser Änderung muss `viewSwitcher.ts` angepasst werden:

```ts
// Alt:
let slideDispose: (() => void) | null = null;
slideDispose = mountSlideView(viewContainer, set);
// Dispose:
slideDispose();

// Neu (nach TICKET-003):
let slideHandle: SlideViewHandle | null = null;
slideHandle = mountSlideView(viewContainer, set, { query: globalQuery, transpose: globalTranspose });
// Dispose:
slideHandle.dispose();
```

Diese Anpassung in `viewSwitcher.ts` ist Teil von **TICKET-004** — in diesem Ticket darf
`viewSwitcher.ts` minimal angepasst werden, damit der Build grün bleibt (Typ-Kompatibilität),
aber die vollständige Verdrahtung erfolgt in TICKET-004.

## Akzeptanzkriterien (testbar)

- [ ] `SlideView.test.ts`: `mountSlideView` gibt ein Objekt mit `dispose`, `setQuery`, `setTranspose` zurück.
- [ ] `SlideView.test.ts`: `opts.query = 'grace'` → `matches` reduziert sich auf Songs mit „grace" im Lyric-Text.
- [ ] `SlideView.test.ts`: `handle.setQuery('bless')` → Position-Indikator zeigt korrekte Trefferzahl.
- [ ] `SlideView.test.ts`: `opts.transpose = 2` → gerendertes Song-DOM zeigt transponierte Akkorde.
- [ ] `SlideView.test.ts`: `handle.setTranspose(2)` → erneuter Render mit transponiertem Song.
- [ ] `SlideView.test.ts`: Kein `input[type="search"]` in `.slide-controls` vorhanden.
- [ ] `npm test` bleibt grün.

## Out of Scope

- `.slide-search`-CSS aus `main.css` entfernen.
- ViewSwitcher-Verdrahtung (TICKET-004).
- Font-Scale-Slider anpassen (bleibt unverändert).
