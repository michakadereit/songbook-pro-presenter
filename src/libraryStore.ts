import type { Song, SongSet } from './types';
import { parseChordProFolder } from './chordproFolder';
import { parseChordPro } from './chordproParser';
import { parseSbp } from './parser';
import { songSetToSbpBlob } from './exporter';

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
  const choProFiles: File[] = [];
  const txtFiles: File[] = [];
  const sbpFiles: File[] = [];

  for await (const entry of handle.values()) {
    if (entry.kind !== 'file') continue;
    const fileHandle = entry as FileSystemFileHandle;
    if (entry.name.endsWith('.chopro')) {
      choProFiles.push(await fileHandle.getFile());
    } else if (entry.name.endsWith('.txt')) {
      txtFiles.push(await fileHandle.getFile());
    } else if (entry.name.endsWith('.sbp')) {
      sbpFiles.push(await fileHandle.getFile());
    }
  }

  const chordProSongs: Song[] = choProFiles.length > 0
    ? (await parseChordProFolder(choProFiles, handle.name)).songs
    : [];

  const txtSongs: Song[] = await Promise.all(
    txtFiles.map(async (file) => {
      const text = await file.text();
      return parseChordPro(text, file.name.replace(/\.txt$/i, ''));
    }),
  );

  const sbpSongs: Song[] = [];
  for (const file of sbpFiles) {
    try {
      const set = await parseSbp(file);
      sbpSongs.push(...set.songs);
    } catch {
      // ungültige .sbp-Datei überspringen, kein Crash
    }
  }

  const allSongs = [...chordProSongs, ...txtSongs, ...sbpSongs]
    .sort((a, b) => a.name.localeCompare(b.name));

  return { songs: allSongs, folderName: handle.name };
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

/**
 * Export each song in `songs` as its own `.sbp` file into the configured
 * library folder.
 *
 * Returns `{ written: 0 }` when no folder handle is stored or the user denies
 * write permission.  Individual file failures are silently skipped.
 */
export async function exportSongsToLibrary(songs: Song[]): Promise<{ written: number }> {
  const handle = await getHandle();
  if (!handle) return { written: 0 };

  const perm = await handle.requestPermission({ mode: 'readwrite' });
  if (perm !== 'granted') return { written: 0 };

  let written = 0;
  for (const song of songs) {
    try {
      const singleSet: SongSet = {
        id: song.id,
        name: song.name,
        date: '',
        songs: [song],
      };
      const blob = songSetToSbpBlob(singleSet);
      const fileName = `${song.name}.sbp`;
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      written++;
    } catch {
      // single file failure — skip, continue with remaining songs
    }
  }
  return { written };
}
