import { parseSbp } from './parser';
import { mountViewSwitcher } from './views/viewSwitcher';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="dropzone">
    <h1>Songbook Pro Presenter</h1>
    <p>Ziehe eine <code>.sbp</code>-Datei hierher oder wähle sie aus.</p>
    <input type="file" id="file-input" accept=".sbp" />
    <pre id="status"></pre>
  </main>
  <div id="songs"></div>
`;

const input = app.querySelector<HTMLInputElement>('#file-input')!;
const status = app.querySelector<HTMLPreElement>('#status')!;
const songs = app.querySelector<HTMLDivElement>('#songs')!;

/** Dispose function for the currently mounted view switcher; null if none loaded yet. */
let activeSwitcher: { dispose(): void } | null = null;

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const set = await parseSbp(file);
    status.textContent = `Geladen: ${set.name} (${set.songs.length} Songs)`;

    // Tear down the previous switcher (and its active view) before mounting a new one.
    activeSwitcher?.dispose();
    activeSwitcher = mountViewSwitcher(songs, set, 'slide');
  } catch (err) {
    status.textContent = `Fehler beim Laden: ${(err as Error).message}`;
    activeSwitcher?.dispose();
    activeSwitcher = null;
    songs.replaceChildren();
  }
});
