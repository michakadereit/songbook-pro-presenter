# TICKET-002: EagleView — interne Controls entfernen, externes State-API

**Plan:** global-controls
**Depends on:** TICKET-001
**Model:** Sonnet

## Ziel

`mountEagleView` bekommt ein optionales Init-State-Objekt und gibt einen Handle zurück,
mit dem der ViewSwitcher Suche und Transpose extern steuern kann. Die interne
`.eagle-controls`-Leiste (Suchfeld + Transpose-Regler) wird vollständig entfernt.

## Dateien

- `src/views/EagleView.ts` — API-Änderung + Controls entfernen
- `src/views/EagleView.test.ts` — Tests anpassen
- `styles/main.css` — `.eagle-controls`-CSS kann bleiben (wird in TICKET-004 ggf. bereinigt)

## API-Änderung

### Vorher

```ts
export function mountEagleView(root: HTMLElement, set: SongSet): void
```

### Nachher

```ts
export interface EagleViewHandle {
  setQuery(q: string): void;
  setTranspose(n: number): void;
}

export function mountEagleView(
  root: HTMLElement,
  set: SongSet,
  opts?: { query?: string; transpose?: number },
): EagleViewHandle
```

- `opts.query` (default `''`) — Initialer Suchbegriff; wird sofort auf die Tiles angewendet.
- `opts.transpose` (default `0`) — Initialer Transpose-Offset; Tiles werden mit diesem Offset
  gerendert.
- Rückgabe: `EagleViewHandle` mit `setQuery` und `setTranspose` — beide rufen intern
  `applyFilter()` bzw. `applyView()` auf, wie bisher über Event-Listener.

## DOM-Änderungen

- Die `controls`-Variable und alle `.eagle-controls`-DOM-Elemente werden entfernt.
- `applyFilter()` und `applyView()` bleiben als interne Hilfsfunktionen erhalten.
- `lyricsText()` bleibt unverändert.

## Akzeptanzkriterien (testbar)

- [ ] `EagleView.test.ts`: `mountEagleView` gibt ein Handle mit `setQuery` und `setTranspose` zurück.
- [ ] `EagleView.test.ts`: `opts.query = 'grace'` → Tiles ohne „grace" in Lyrics haben `display: none` nach dem initialen Render.
- [ ] `EagleView.test.ts`: `handle.setQuery('bless')` → Tiles filtern sich neu; nicht-passende Tiles werden ausgeblendet.
- [ ] `EagleView.test.ts`: `handle.setTranspose(2)` → `applyView()` wird mit offset=2 ausgeführt (verifizierbar via DOM — Akkordtext ändert sich, z. B. `C` → `D`).
- [ ] `EagleView.test.ts`: Kein `.eagle-controls`-Element im DOM nach dem Mount.
- [ ] `npm test` bleibt grün (bestehende EagleView-Tests angepasst).

## Out of Scope

- `.eagle-controls`-CSS aus `main.css` entfernen (kann gemacht werden, ist aber nicht Pflicht).
- ViewSwitcher-Verdrahtung (TICKET-004).
