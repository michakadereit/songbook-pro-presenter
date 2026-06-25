import { parseSbp } from './parser';
import { renderSong } from './components/SongRenderer';

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

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const set = await parseSbp(file);
    status.textContent = `Geladen: ${set.name} (${set.songs.length} Songs)`;

    // Temporary render harness until the Slide/Eagle views exist.
    songs.replaceChildren();
    for (const song of set.songs) {
      songs.appendChild(
        renderSong(song, { showChords: true, showLyrics: true, chordRatio: 0.8 }),
      );
    }
  } catch (err) {
    status.textContent = `Fehler beim Laden: ${(err as Error).message}`;
    songs.replaceChildren();
  }
});
