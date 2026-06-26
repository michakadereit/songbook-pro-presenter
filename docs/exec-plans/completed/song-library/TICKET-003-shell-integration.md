# TICKET-003 — Shell-Integration + CSS

> Plan: [Song-Bibliothek](./README.md) · Spec ACs: AC4, AC5, AC6

## Ziel

`LibraryView` in die App-Shell einbinden: Bibliothek-Button in der Shell-Bar,
`onAddSong`-Callback, CSS für den Drawer (Overlay + Transition), und `setHasSet`-
Synchronisation mit dem Set-Ladezustand.

## Abhängigkeiten

- TICKET-001: `LibraryStore` vorhanden.
- TICKET-002: `LibraryView` / `createLibraryView` vorhanden.
- `src/main.ts`: `loadSet`, `activeSongSet` (für Song-Append-Logik).
- `styles/main.css`: Drawer-CSS hinzufügen.

## Deliverables

### `src/main.ts` (ändern)

1. Import ergänzen:
   ```ts
   import { createLibraryView } from './views/LibraryView';
   ```

2. `activeSongSet: SongSet | null = null` als Modul-Variable tracken:
   - `loadSet(set, label)` setzt `activeSongSet = set` und ruft
     `libraryView.setHasSet(true)` auf.
   - Bei Ladefehler / Dispose: `activeSongSet = null`, `libraryView.setHasSet(false)`.

3. `LibraryView` erzeugen und `document.body` anhängen:
   ```ts
   const libraryView = createLibraryView({
     hasSet: () => activeSongSet !== null,
     onAddSong: (song) => {
       if (!activeSongSet) return;
       const newSet: SongSet = {
         ...activeSongSet,
         songs: [...activeSongSet.songs, { ...song, id: activeSongSet.songs.length }],
       };
       loadSet(newSet, activeSongSet.name);
     },
   });
   document.body.append(libraryView.el);
   ```

4. Bibliothek-Button im Shell-Bar HTML:
   ```html
   <button class="shell-bar__btn" id="library-btn" type="button">Bibliothek</button>
   ```
   Click-Handler: `libraryView.toggle()`.

### `styles/main.css` (ändern)

Drawer als rechts einfahrendes Overlay:

```css
.library-drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  width: min(24rem, 90vw);
  background: var(--surface);
  border-inline-start: 1px solid var(--border);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  transform: translateX(100%);
  transition: transform 0.25s ease;
  z-index: 100;
  overflow-y: auto;
  padding: var(--space-4);
}

.library-drawer--open {
  transform: translateX(0);
}

.library-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-4);
}

.library-drawer__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--fg-muted);
  padding: var(--space-1);
}

.library-search {
  width: 100%;
  margin-block-end: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 0.9rem;
}

.library-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.library-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: calc(var(--radius) / 2);
}

.library-item:hover {
  background: var(--bg);
}

.library-item__name {
  flex: 1;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-item__add {
  flex-shrink: 0;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: calc(var(--radius) / 2);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.library-item__add:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.library-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding-block: var(--space-6);
  color: var(--fg-muted);
  font-size: 0.9rem;
  text-align: center;
}
```

## Acceptance Criteria

- AC4: Klick auf „+" fügt Song am Ende des aktuellen Sets hinzu; SlideView/EagleView
  zeigt den neuen Song (über Navigation erreichbar).
- AC5: Ohne geladenes Set sind alle „+"-Buttons deaktiviert.
- AC6: Bibliothek-Button in Shell-Bar toggelt den Drawer; ×-Button schließt ihn.
- Bestehende Tests grün, `tsc` sauber, Browser-Verifikation mit Playwright MCP.

## Browser-Verifikation (Playwright MCP)

1. `npm run dev` starten; `http://localhost:5173/` öffnen.
2. `.sbp`-Datei laden → Set erscheint in Slide-View.
3. „Bibliothek"-Button klicken → Drawer fährt von rechts ein.
4. „Ordner konfigurieren" → `samples/onsong/` wählen → Songs erscheinen.
5. Einen Song suchen → gefilterte Liste.
6. „+" klicken → View remountet; letzter Song navigierbar (→ bis ans Ende).
7. Seiten-Reload → Bibliothek-Button → Drawer zeigt Songs nach Permission-Klick.

## Out of Scope

- Animations-Polishing (Easing, Backdrop-Overlay zum Schließen) — kann später ergänzt werden.
- Mehrere Bibliotheks-Ordner.
- Song-Reihenfolge beim Hinzufügen (immer ans Ende).
