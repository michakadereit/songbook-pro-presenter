# TICKET-001 — `LibraryStore` — IDB + File System Access API

> Plan: [Song-Bibliothek](./README.md) · Spec ACs: AC1, AC2, AC7

## Ziel

Einen `.chopro`-Ordner über die File System Access API öffnen, alle `.chopro`-Dateien
darin parsen und den `FileSystemDirectoryHandle` in IndexedDB persistieren, damit der
Ordner nach Seiten-Reload ohne erneute Auswahl zugänglich bleibt.

## Abhängigkeiten

- `src/chordproFolder.ts`: `parseChordProFolder(files: File[]): Promise<SongSet>` —
  zum Parsen der Songs aus den Dateien des Handles.
- Kein Extra-Package nötig: `FileSystemDirectoryHandle` ist in IDB direkt speicherbar
  (structured-cloneable).

## Deliverables

### `src/libraryStore.ts` (neu)

```ts
export interface LibraryResult {
  songs: Song[];
  folderName: string;
}

export async function openLibraryFolder(): Promise<LibraryResult | null>;
// showDirectoryPicker() → Handle in IDB speichern → Songs laden
// Gibt null zurück, wenn der Nutzer abbricht (AbortError).

export async function loadLibrarySongs(): Promise<LibraryResult | null>;
// Handle aus IDB laden → handle.requestPermission({mode: 'read'}) → Songs laden
// Gibt null zurück wenn: kein Handle gespeichert, Permission verweigert, Fehler.

export async function clearLibrary(): Promise<void>;
// Handle aus IDB löschen
```

**IDB-Setup (inline, kein idb-Package):**
- DB-Name: `"songbook-library"`, Version 1, ObjectStore: `"handles"`, KeyPath: keiner
  (inline keys), Key für den Folder-Handle: `"folder"`.
- `openDB(): Promise<IDBDatabase>` als privater Helfer mit `indexedDB.open(...)`.

**Songs laden aus Handle:**
```ts
async function songsFromHandle(handle: FileSystemDirectoryHandle): Promise<LibraryResult>
```
- Über `handle.values()` iterieren, nur `FileSystemFileHandle` mit `.name.endsWith('.chopro')`.
- `entry.getFile()` → `File[]` aufbauen.
- `parseChordProFolder(files, handle.name)` → `SongSet` → Songs alphabetisch nach
  `name` sortieren.
- `folderName: handle.name` zurückgeben.

**TypeScript-Typen:**
`FileSystemDirectoryHandle`, `FileSystemFileHandle`, `showDirectoryPicker` sind in
modernen Browser-Typen (`lib: ["DOM"]`) vorhanden. Falls `tsconfig.json` das nicht
enthält, `.d.ts`-Erweiterung in `src/` anlegen (kein `@types`-Package nötig).

## Tests

`LibraryStore` nutzt Browser-APIs (`showDirectoryPicker`, `indexedDB`) — keine
automatisierten Unit-Tests möglich. **Browser-Verifikation in TICKET-003.**

Sicherstellen: `npx tsc --noEmit` kompiliert ohne Fehler, keine bestehenden Tests
gebrochen.

## Acceptance Criteria

- AC1 (Teil): `openLibraryFolder()` öffnet Folder-Picker, lädt Songs, speichert Handle.
- AC2: `loadLibrarySongs()` nach Reload liefert dieselben Songs ohne erneute Auswahl
  (nach Permission-Bestätigung des Browsers).
- AC7 (Teil): Ohne gespeichertem Handle gibt `loadLibrarySongs()` `null` zurück.
- `tsc` sauber, bestehende Tests grün.

## Out of Scope

- UI → TICKET-002. Shell-Integration → TICKET-003.
- Mehrere Ordner-Handles.
- Fehlerbehandlung jenseits von `null`-Return (kein eigenes Error-UI).
