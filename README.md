# Songbook Pro Presenter

A browser-based presenter for worship song sets created with [SongBook Pro](https://www.songbookpro.com/). Load a `.sbp` file and present your set in multiple views — with chords, lyrics, transposition, and live audio detection.

## Getting Started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm test         # run unit tests
```

Drop a `.sbp` file onto the app or use the file picker to load your set. For OnSong users, drag in a folder of `.chopro` files. Once a set is loaded, use the **Exportieren** button to save it back as a `.sbp` file — regardless of which format you originally loaded.

## Features

### Slide View

Full-screen presentation mode. One song fills the entire screen at a time. Navigate between songs with the arrow keys or spacebar. A font-size slider lets you scale the text to fit any projector or screen. A position indicator (`2 / 8`) shows where you are in the set. Designed for worship leaders and musicians on stage.

### Eagle View

A compact grid overview of every song in the set — chords only, no lyrics. Lets you quickly scan the structure of an entire set before or during a service. Each tile shows the song title and all chord progressions at a glance.

### Chord & Lyric Display

Chords are rendered directly above their corresponding syllable, so the spacing stays accurate regardless of word length. Chord visibility and lyric visibility are toggled independently. A chord/lyric font-ratio slider adjusts how large chords appear relative to the lyrics — useful when chords need to stand out or recede.

### Transposition

Transpose the entire set up or down by semitone. Works live — re-renders immediately without reloading the file. Available in both Slide View and Eagle View. Internally powered by [chordsheetjs](https://github.com/martijnversluis/ChordSheetJS).

### Multi-Column Layout

In Slide View, switch to a two-column layout for songs with many verses. Keeps all the text on screen without reducing font size.

### Search

Filter songs in both views by typing any word from the lyrics. In Slide View, search narrows down the navigation to matching songs only. Useful for quickly jumping to a specific song mid-set.

### Theme

Light, dark, and automatic (follows the OS setting) themes. Persisted across sessions.

### Fullscreen

Toggle native browser fullscreen for distraction-free presentation.

### File Formats

| Format | How to load |
|---|---|
| `.sbp` | SongBook Pro set file (ZIP archive) — drag & drop or file picker |
| `.chopro` / OnSong folder | Drag in an entire exported OnSong folder |
| Song Library | A folder of `.chopro` files — configured once via **Bibliothek → Ordner konfigurieren** |

### Song Library

Keep a folder of songs outside any set and pull individual songs into the current set on the fly. Click **Bibliothek** in the top bar to open the library drawer, then click **Ordner konfigurieren** to point the app at your library folder. The folder handle is persisted in IndexedDB so the library reopens automatically after a page reload (the browser will ask for folder access once per session).

**Required format:** the library folder must contain `.chopro` files (ChordPro / OnSong export format). Each `.chopro` file becomes one song. `.xml` files in the same folder are ignored.

Click **+** next to any song to append it to the end of the currently loaded set. The view remounts immediately so you can navigate to the new song.

### Export

Save the currently loaded set as a `.sbp` file — regardless of whether you originally loaded a `.sbp` file or an OnSong folder. Click **Exportieren** (visible once a set is loaded) to trigger a browser download. The exported file can be re-imported into the app.

### Live Audio Detection

A microphone sidecar panel for real-time musical analysis. Activate it with the **Mikro aktivieren** button — the browser will ask for mic permission once.

| Readout | What it shows |
|---|---|
| **Note** | The currently played pitch, e.g. `A4` or `G#3 +8¢`. Only shown when the signal is clear (clarity > 85 %). |
| **Tonart** | The estimated key of the music over the last several seconds, e.g. `G-Dur` or `d-Moll`. Derived from an accumulating pitch-class histogram and the Krumhansl–Schmuckler profiles. |
| **Akkord** ⚗ | An experimental best-effort chord label, e.g. `C-Dur` or `Am`. Derived from the frequency-domain chroma of the mic signal. Works best with an isolated instrument. |

The level bar shows the current microphone input volume in real time. Deactivating the panel stops all mic tracks immediately (the browser mic indicator goes off).

> **Note:** Chord detection is marked as experimental (⚗). It performs best with a single clean instrument in a quiet environment.

## Tech Stack

- **Vite + TypeScript** — no framework, no runtime dependencies beyond what's listed below
- **[chordsheetjs](https://github.com/martijnversluis/ChordSheetJS)** — chord transposition
- **[fflate](https://github.com/101arrowz/fflate)** — in-browser ZIP extraction for `.sbp` files
- **[pitchy](https://github.com/ianprime0509/pitchy)** — monophonic pitch detection (McLeod pitch method)
- **Vitest** — unit tests (252 tests, no browser required)

## Project Structure

```
src/
├── audio/          # mic capture, level metering, pitch detection, chroma, note math
├── components/     # SongRenderer — chord-over-syllable DOM builder
├── views/          # SlideView, EagleView, ListenerPanel, viewSwitcher
├── parser.ts       # .sbp ZIP → SongSet
├── chordproParser  # .chopro → Song
├── transpose.ts    # semitone transposition
└── theme.ts        # light / dark / auto
styles/
└── main.css        # design tokens, all component styles
```
