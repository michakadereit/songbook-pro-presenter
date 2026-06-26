# TICKET-002 — `LibraryView` — Drawer-Panel

> Plan: [Song-Bibliothek](./README.md) · Spec ACs: AC1, AC3, AC5, AC6, AC7

## Ziel

Eine `LibraryView`-Komponente als Overlay-Drawer, der Songs aus dem `LibraryStore`
anzeigt, nach Name filtern lässt und je Song einen „+"-Button bietet.

## Abhängigkeiten

- TICKET-001: `LibraryStore` (`openLibraryFolder`, `loadLibrarySongs`) vorhanden.
- Kein neues CSS in diesem Ticket (Drawer-CSS kommt in TICKET-003). Das Ticket
  baut nur das DOM + die Logik, Styling minimal/funktional.

## Deliverables

### `src/views/LibraryView.ts` (neu)

```ts
export interface LibraryViewOptions {
  onAddSong: (song: Song) => void;
  hasSet: () => boolean;  // true wenn aktuell ein SongSet geladen ist
}

export interface LibraryView {
  el: HTMLElement;            // der Drawer-Container
  open(): void;               // Drawer einblenden
  close(): void;              // Drawer ausblenden
  toggle(): void;
  setHasSet(has: boolean): void; // "+" Buttons en/deaktivieren
  dispose(): void;
}

export function createLibraryView(options: LibraryViewOptions): LibraryView;
```

**DOM-Struktur:**
```html
<aside class="library-drawer" aria-hidden="true">
  <div class="library-drawer__header">
    <h2>Bibliothek</h2>
    <button class="library-drawer__close" type="button" aria-label="Schließen">×</button>
  </div>
  <div class="library-drawer__body">
    <!-- Leer-Zustand (kein Ordner): -->
    <div class="library-empty">
      <button id="lib-configure-btn" type="button">Ordner konfigurieren</button>
    </div>
    <!-- Oder: Song-Liste -->
    <input class="library-search" type="search" placeholder="Song suchen…" />
    <ul class="library-list">
      <li class="library-item">
        <span class="library-item__name">Song-Titel</span>
        <button class="library-item__add" type="button" aria-label="Zum Set hinzufügen">+</button>
      </li>
    </ul>
  </div>
</aside>
```

**Interne Logik:**

1. `init()`: `loadLibrarySongs()` aufrufen.
   - `null` → Leer-Zustand „Ordner konfigurieren" anzeigen.
   - Songs vorhanden → Song-Liste rendern.

2. „Ordner konfigurieren"-Klick → `openLibraryFolder()` → Songs neu rendern.

3. Suchfeld `input`-Event → Songs filtern (`name.toLowerCase().includes(query)`),
   Liste neu rendern (kein Re-Fetch, nur Filter über gecachte `allSongs`).

4. „+"-Klick → `options.onAddSong(song)` aufrufen; Button kurz deaktivieren (Debounce 300 ms).

5. `setHasSet(has)`: Alle „+"-Buttons mit `disabled = !has` belegen.

**open/close:** `aria-hidden` + CSS-Klasse `library-drawer--open` (Transition in TICKET-003).

## Tests

`LibraryView` nutzt `openLibraryFolder` / `loadLibrarySongs` (Browser-APIs) → kein
sinnvoller Unit-Test. `tsc` sauber, bestehende Tests grün.

## Acceptance Criteria

- AC1 (Teil): Nach `openLibraryFolder()` zeigt der Drawer die Songs alphabetisch.
- AC3: Suchfeld filtert Songs in Echtzeit case-insensitiv.
- AC5: `setHasSet(false)` → alle „+"-Buttons deaktiviert; kein Crash bei Klick.
- AC6 (Teil): `open()` / `close()` / `toggle()` ändern den Sichtbarkeitszustand.
- AC7: Ohne Ordner zeigt der Drawer den „Ordner konfigurieren"-Button.
- `tsc` sauber, bestehende Tests grün.

## Out of Scope

- Drawer-CSS (Transition, Overlay) → TICKET-003.
- Shell-Bar-Button → TICKET-003.
- Song zum Set hinzufügen (Callback nur verdrahtet, Effekt in TICKET-003).
