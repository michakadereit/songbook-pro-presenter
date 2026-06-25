import type { Song, SongLine } from '../types';

export interface RenderOptions {
  showChords: boolean;
  showLyrics: boolean;
  /** Font-size ratio of chords relative to lyrics (e.g. 0.8). */
  chordRatio: number;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** One rendered segment: an optional chord anchored above a slice of lyric text. */
interface Segment {
  chord: string | null;
  text: string;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Split a SongLine into Segments based on chord positions.
 *
 * Algorithm:
 *   - Sort chords defensively by position (ascending).
 *   - If the first chord's position > 0, emit a leading segment (chord: null)
 *     covering the text before it.
 *   - Each chord starts a segment that runs until the next chord's position
 *     (or end of lyrics).
 *
 * Public CSS contract (consumed by TICKET-003):
 *   .seg          — one chord+lyric column unit
 *   .seg__chord   — chord label row inside a segment
 *   .seg__lyric   — lyric text row inside a segment
 */
function splitLine(line: SongLine): Segment[] {
  const { lyrics, chords } = line;

  if (chords.length === 0) {
    // Whole line is one lyric-only segment
    return [{ chord: null, text: lyrics }];
  }

  const sorted = [...chords].sort((a, b) => a.position - b.position);
  const segments: Segment[] = [];

  // Leading text before the first chord
  if (sorted[0].position > 0) {
    segments.push({ chord: null, text: lyrics.slice(0, sorted[0].position) });
  }

  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].position;
    const end = i + 1 < sorted.length ? sorted[i + 1].position : lyrics.length;
    segments.push({ chord: sorted[i].symbol, text: lyrics.slice(start, end) });
  }

  return segments;
}

/** Build a single <span class="seg"> element from a Segment. */
function renderSegment(seg: Segment): HTMLElement {
  const span = document.createElement('span');
  span.className = 'seg';

  const chordSpan = document.createElement('span');
  chordSpan.className = 'seg__chord';
  chordSpan.textContent = seg.chord ?? '';

  const lyricSpan = document.createElement('span');
  lyricSpan.className = 'seg__lyric';
  lyricSpan.textContent = seg.text;

  span.appendChild(chordSpan);
  span.appendChild(lyricSpan);
  return span;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a single song to a DOM element.
 *
 * Returns <article class="song"> containing:
 *   <h2 class="song__title">     — song name
 *   <section class="section">*   — one per SongSection
 *     <h3 class="section__title">  — omitted when section.title is empty
 *     <div class="line">*          — one per SongLine
 *       <span class="seg">*        — segments (chord above lyric)
 *
 * Public CSS contract (consumed by TICKET-003):
 *   .song              — root article element
 *   .song--no-chords   — modifier: CSS hides .seg__chord via display:none
 *   .song--no-lyrics   — modifier: CSS hides .seg__lyric via display:none
 *   .song__title       — <h2> with the song name
 *   .section           — <section> per SongSection
 *   .section__title    — <h3> per section label (absent when title is "")
 *   .line              — <div> per SongLine
 *   .seg               — one chord+lyric column unit
 *   .seg__chord        — chord label
 *   .seg__lyric        — lyric text slice
 */
export function renderSong(song: Song, options: RenderOptions): HTMLElement {
  const article = document.createElement('article');
  article.className = 'song';

  // Apply RenderOptions modifiers
  if (!options.showChords) {
    article.classList.add('song--no-chords');
  }
  if (!options.showLyrics) {
    article.classList.add('song--no-lyrics');
  }
  article.style.setProperty('--chord-ratio', String(options.chordRatio));

  // Song title
  const h2 = document.createElement('h2');
  h2.className = 'song__title';
  h2.textContent = song.name;
  article.appendChild(h2);

  // Sections
  for (const section of song.sections) {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'section';

    // Section title — only when non-empty
    if (section.title !== '') {
      const h3 = document.createElement('h3');
      h3.className = 'section__title';
      h3.textContent = section.title;
      sectionEl.appendChild(h3);
    }

    // Lines
    for (const line of section.lines) {
      const lineEl = document.createElement('div');
      lineEl.className = 'line';

      for (const seg of splitLine(line)) {
        lineEl.appendChild(renderSegment(seg));
      }

      sectionEl.appendChild(lineEl);
    }

    article.appendChild(sectionEl);
  }

  return article;
}
