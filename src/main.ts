import { parseSbp } from './parser';
import { parseChordProFolder } from './chordproFolder';
import { mountViewSwitcher } from './views/viewSwitcher';
import { folderNameFromFiles } from './shellHelpers';
import type { SongSet } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="dropzone">
    <h1>Songbook Pro Presenter</h1>
    <p>Lade eine <code>.sbp</code>-Datei oder einen OnSong-Ordner mit <code>.chopro</code>-Dateien.</p>
    <div class="loader-inputs">
      <label class="loader-label">
        <span class="loader-label__text">SongBook Pro Datei</span>
        <input type="file" id="file-input" accept=".sbp" />
      </label>
      <label class="loader-label">
        <span class="loader-label__text">OnSong-Ordner laden</span>
        <input type="file" id="folder-input" multiple />
      </label>
    </div>
    <pre id="status"></pre>
  </main>
  <div id="songs"></div>
`;

const fileInput = app.querySelector<HTMLInputElement>('#file-input')!;
const folderInput = app.querySelector<HTMLInputElement>('#folder-input')!;
const status = app.querySelector<HTMLPreElement>('#status')!;
const songs = app.querySelector<HTMLDivElement>('#songs')!;

// webkitdirectory is not in standard TS DOM types — set via setAttribute.
folderInput.setAttribute('webkitdirectory', '');

/** Dispose function for the currently mounted view switcher; null if none loaded yet. */
let activeSwitcher: { dispose(): void } | null = null;

/**
 * Mount a new ViewSwitcher for the given SongSet, disposing the previous one.
 * Updates the status line with the set label.
 */
function loadSet(set: SongSet, label: string): void {
  status.textContent = `Geladen: ${label} (${set.songs.length} Songs)`;
  activeSwitcher?.dispose();
  activeSwitcher = mountViewSwitcher(songs, set, 'slide');
}

// --- .sbp file input ---
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const set = await parseSbp(file);
    loadSet(set, set.name);
  } catch (err) {
    status.textContent = `Fehler beim Laden: ${(err as Error).message}`;
    activeSwitcher?.dispose();
    activeSwitcher = null;
    songs.replaceChildren();
  }
});

// --- Folder input (OnSong .chopro) ---
folderInput.addEventListener('change', async () => {
  const files = folderInput.files ? [...folderInput.files] : [];
  if (files.length === 0) return;

  try {
    const folderName = folderNameFromFiles(files);
    const set = await parseChordProFolder(files, folderName);

    if (set.songs.length === 0) {
      status.textContent = 'Keine .chopro-Dateien im Ordner gefunden.';
      return;
    }

    loadSet(set, set.name);
  } catch (err) {
    status.textContent = `Fehler beim Laden: ${(err as Error).message}`;
    activeSwitcher?.dispose();
    activeSwitcher = null;
    songs.replaceChildren();
  }
});
