import type { Song } from './types';
import { parseChordProFolder } from './chordproFolder';

export interface LibraryResult {
  songs: Song[];
  folderName: string;
}

// ---------------------------------------------------------------------------
// Private: IndexedDB helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('songbook-library', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    const req = store.put(handle, 'folder');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly');
    const store = tx.objectStore('handles');
    const req = store.get('folder');
    req.onsuccess = () =>
      resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteHandle(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    const req = store.delete('folder');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Private: load songs from a directory handle
// ---------------------------------------------------------------------------

async function songsFromHandle(
  handle: FileSystemDirectoryHandle,
): Promise<LibraryResult> {
  const files: File[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.chopro')) {
      const file = await (entry as FileSystemFileHandle).getFile();
      files.push(file);
    }
  }
  const songSet = await parseChordProFolder(files, handle.name);
  const songs = [...songSet.songs].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return { songs, folderName: handle.name };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Open a folder picker, persist the chosen handle to IndexedDB, then parse
 * and return all `.chopro` songs in that folder sorted alphabetically.
 *
 * Returns `null` if the user cancels the picker (AbortError).
 */
export async function openLibraryFolder(): Promise<LibraryResult | null> {
  try {
    const handle = await window.showDirectoryPicker();
    await putHandle(handle);
    return await songsFromHandle(handle);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Restore the previously chosen folder from IndexedDB and load its songs.
 *
 * Returns `null` when:
 * - no handle is stored in IndexedDB,
 * - the user denies the permission prompt, or
 * - any other error occurs.
 */
export async function loadLibrarySongs(): Promise<LibraryResult | null> {
  try {
    const handle = await getHandle();
    if (!handle) return null;
    const permission = await handle.requestPermission({ mode: 'read' });
    if (permission !== 'granted') return null;
    return await songsFromHandle(handle);
  } catch {
    return null;
  }
}

/**
 * Remove the persisted folder handle from IndexedDB.
 */
export async function clearLibrary(): Promise<void> {
  await deleteHandle();
}
