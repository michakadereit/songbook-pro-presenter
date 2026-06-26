# Spec: Song-Bibliothek

> Status: Draft · Erstellt 2026-06-26

## Ziel

Einen lokalen Ordner als persistente Song-Bibliothek konfigurieren. Songs aus der
Bibliothek können einzeln zum aktuellen Set hinzugefügt werden. Die Bibliothek bleibt
nach Seiten-Reload verfügbar (kein erneutes Auswählen nötig).

## Architektur

```
LibraryStore        — File System Access API + IndexedDB (Persist, Lesen)
LibraryView         — Overlay-Drawer: Song-Liste, Suche, "+" je Song
main.ts             — Bibliothek-Button, Panel-Toggle, onAddSong-Callback
```

### LibraryStore (`src/libraryStore.ts`)

```ts
export async function openLibraryFolder(): Promise<Song[]>;
// showDirectoryPicker() → Handle in IDB speichern → Songs lesen

export async function loadLibrarySongs(): Promise<Song[] | null>;
// Handle aus IDB laden → requestPermission() → Songs lesen
// null wenn kein Handle gespeichert oder Zugriff verweigert

export async function clearLibrary(): Promise<void>;
// Handle aus IDB entfernen
```

Persistenz: der `FileSystemDirectoryHandle` wird direkt in IndexedDB gespeichert
(structured-cloneable, kein Extra-Package nötig). DB-Name: `songbook-library`, Store:
`handles`, Key: `"folder"`.

Songs werden via bestehenden `parseChordProFolder(files: File[])` geladen. Die Dateien
werden aus dem Directory-Handle über `handle.values()` iteriert und per
`entry.getFile()` geholt.

### Ordner-Handle + Browser-Permissions

- Beim ersten Öffnen: `showDirectoryPicker()` → Permission automatisch erteilt.
- Nach Reload: Handle aus IDB → `handle.requestPermission({mode: 'read'})` → Browser
  zeigt einen einmaligen Permission-Prompt (einmaliger Klick des Nutzers nötig).
- Wird Permission verweigert: leerer Zustand mit "Ordner erneut konfigurieren".

### LibraryView (`src/views/LibraryView.ts`)

- Overlay-Drawer von der rechten Seite (CSS-Transition `transform: translateX`)
- Song-Liste alphabetisch sortiert (Name des Songs)
- Suchfeld: filtert Songs case-insensitiv nach Name in Echtzeit
- Je Song: Name + „+" -Button (deaktiviert wenn kein Set geladen)
- Leer-Zustand (kein Ordner): „Bibliothek-Ordner konfigurieren"-Button
- Leer-Zustand (Ordner leer / keine .chopro): Hinweistext
- Schließen-Button oben rechts im Drawer

### Song zum Set hinzufügen

Hinzufügen eines Songs hängt ihn ans Ende des aktuellen `SongSet` an und ruft
`loadSet(newSet, label)` neu auf (remount des ViewSwitcher, View startet bei Song 1).
Der Drawer bleibt offen.

## User Flow

1. Nutzer klickt „Bibliothek" in der Shell-Bar → Drawer öffnet sich.
2. **Erster Besuch (kein Ordner):** Button „Ordner konfigurieren" → Folder-Picker →
   Ordner wird geöffnet, Songs werden geladen und angezeigt.
3. **Folgebesuche (Handle in IDB):** Drawer öffnet mit Permission-Prompt → nach
   Klick erscheinen die Songs sofort.
4. Nutzer tippt in das Suchfeld → Liste filtert.
5. Nutzer klickt „+" bei einem Song → Song am Ende des aktuellen Sets → View remountet.
6. Nutzer schließt Drawer (×-Button oder erneuter Klick auf „Bibliothek").

## Akzeptanzkriterien

### AC1 — Ordner konfigurieren: Songs werden angezeigt
Nach Klick auf „Ordner konfigurieren" und Auswahl eines Ordners mit `.chopro`-Dateien
zeigt der Drawer alle Songs alphabetisch nach Name (kein `.chopro`-Suffix sichtbar).

### AC2 — Persistenz nach Reload
Nach Seiten-Reload öffnet der Drawer (nach Permission-Bestätigung durch den Nutzer)
dieselbe Song-Liste ohne erneute Ordner-Auswahl.

### AC3 — Suche filtert Songs
Eingabe in das Suchfeld (z.B. „grace") zeigt nur Songs, deren Name den Suchtext
enthält (case-insensitiv). Leeren des Felds zeigt alle Songs wieder.

### AC4 — Song zum Set hinzufügen
Klick auf „+" bei einem Library-Song hängt ihn ans Ende des aktuellen Sets; der View
remountet und der neue Song ist über die Navigation erreichbar (SlideView, letzter
Song; EagleView, neues Tile sichtbar).

### AC5 — „+" deaktiviert ohne geladenes Set
Ist kein Set geladen, sind alle „+"-Buttons deaktiviert (kein Crash).

### AC6 — Drawer öffnen/schließen
Bibliothek-Button in der Shell-Bar toggelt den Drawer. ×-Button im Drawer schließt ihn.

### AC7 — Kein Ordner konfiguriert: Leer-Zustand
Ohne gespeichertem Handle zeigt der Drawer nur den „Ordner konfigurieren"-Button.

## Out of Scope

- Songs aus der Bibliothek bearbeiten oder löschen.
- Mehrere Bibliotheks-Ordner gleichzeitig.
- `.sbp`-Dateien als Bibliothek (nur `.chopro`-Ordner).
- Drag & Drop-Reihenfolge beim Hinzufügen.
- Set aus der Bibliothek komplett neu zusammenstellen (ohne vorher ein Set zu laden).
