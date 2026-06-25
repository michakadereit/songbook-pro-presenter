import { describe, it, expect } from 'vitest';
import { renderSong } from './SongRenderer';
import type { RenderOptions } from './SongRenderer';
import type { Song } from '../types';

// -----------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------

const defaultOptions: RenderOptions = {
  showChords: true,
  showLyrics: true,
  chordRatio: 0.8,
};

/** A minimal song with one section "Chorus" containing two lines:
 *  1. "Bless the Lord, O my soul," with chords A@10 and E@21
 *  2. "(x2)" with no chords
 */
const testSong: Song = {
  id: 1,
  name: '10000 Reasons',
  author: 'Matt Redman',
  keyShift: 0,
  sections: [
    {
      title: 'Chorus',
      lines: [
        {
          lyrics: 'Bless the Lord, O my soul,',
          chords: [
            { symbol: 'A', position: 10 },
            { symbol: 'E', position: 21 },
          ],
        },
        {
          lyrics: '(x2)',
          chords: [],
        },
      ],
    },
  ],
};

// -----------------------------------------------------------------------
// AC1 — Grundstruktur
// -----------------------------------------------------------------------

describe('AC1 — basic structure', () => {
  it('returns an HTMLElement', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  it('contains the song name visibly', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.textContent).toContain('10000 Reasons');
  });

  it('renders a .section__title for each section', () => {
    const el = renderSong(testSong, defaultOptions);
    const sectionTitles = el.querySelectorAll('.section__title');
    expect(sectionTitles).toHaveLength(1);
    expect(sectionTitles[0].textContent).toBe('Chorus');
  });

  it('does not render a .section__title for sections with empty title', () => {
    const songWithEmptySection: Song = {
      ...testSong,
      sections: [{ title: '', lines: [{ lyrics: 'Intro line', chords: [] }] }],
    };
    const el = renderSong(songWithEmptySection, defaultOptions);
    const sectionTitles = el.querySelectorAll('.section__title');
    expect(sectionTitles).toHaveLength(0);
  });
});

// -----------------------------------------------------------------------
// AC2 — Segments with chord over syllable
// -----------------------------------------------------------------------

describe('AC2 — chord-over-syllable segments', () => {
  it('places chord A in a .seg__chord inside a .seg together with its syllable', () => {
    const el = renderSong(testSong, defaultOptions);
    const chordSpans = Array.from(el.querySelectorAll('.seg__chord'));
    const aChord = chordSpans.find((s) => s.textContent === 'A');
    expect(aChord).toBeTruthy();
    // The .seg__chord must be a direct child of a .seg
    expect(aChord!.parentElement?.classList.contains('seg')).toBe(true);
  });

  it('places chord E in a .seg__chord inside a .seg together with its syllable', () => {
    const el = renderSong(testSong, defaultOptions);
    const chordSpans = Array.from(el.querySelectorAll('.seg__chord'));
    const eChord = chordSpans.find((s) => s.textContent === 'E');
    expect(eChord).toBeTruthy();
    expect(eChord!.parentElement?.classList.contains('seg')).toBe(true);
  });

  it('reconstructed lyric text of first line equals the original', () => {
    const el = renderSong(testSong, defaultOptions);
    // Get all .line elements; first section, first line
    const lines = el.querySelectorAll('.line');
    const firstLine = lines[0];
    const lyricSpans = Array.from(firstLine.querySelectorAll('.seg__lyric'));
    const reconstructed = lyricSpans.map((s) => s.textContent).join('');
    expect(reconstructed).toBe('Bless the Lord, O my soul,');
  });

  it('each .seg has exactly one .seg__chord and one .seg__lyric', () => {
    const el = renderSong(testSong, defaultOptions);
    const segs = Array.from(el.querySelectorAll('.seg'));
    for (const seg of segs) {
      expect(seg.querySelectorAll('.seg__chord')).toHaveLength(1);
      expect(seg.querySelectorAll('.seg__lyric')).toHaveLength(1);
    }
  });
});

// -----------------------------------------------------------------------
// AC6 — Lines without chords
// -----------------------------------------------------------------------

describe('AC6 — chord-less lines', () => {
  it('renders lyric text "(x2)" in a line without chords', () => {
    const el = renderSong(testSong, defaultOptions);
    const lines = Array.from(el.querySelectorAll('.line'));
    const x2Line = lines.find((l) => l.textContent?.includes('(x2)'));
    expect(x2Line).toBeTruthy();
  });

  it('has no .seg__chord with non-empty content in the chord-less "(x2)" line', () => {
    const el = renderSong(testSong, defaultOptions);
    const lines = Array.from(el.querySelectorAll('.line'));
    const x2Line = lines.find((l) =>
      Array.from(l.querySelectorAll('.seg__lyric')).some(
        (s) => s.textContent === '(x2)',
      ),
    );
    expect(x2Line).toBeTruthy();
    const nonEmptyChordSpans = Array.from(
      x2Line!.querySelectorAll('.seg__chord'),
    ).filter((s) => s.textContent !== '');
    expect(nonEmptyChordSpans).toHaveLength(0);
  });
});

// -----------------------------------------------------------------------
// AC3 — Chords hideable via showChords: false
// -----------------------------------------------------------------------

describe('AC3 — showChords: false hides chord elements', () => {
  it('sets class song--no-chords on the root element when showChords is false', () => {
    const el = renderSong(testSong, { ...defaultOptions, showChords: false });
    expect(el.classList.contains('song--no-chords')).toBe(true);
  });

  it('does NOT set song--no-chords when showChords is true', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.classList.contains('song--no-chords')).toBe(false);
  });

  it('lyric text is still fully present when showChords is false', () => {
    const el = renderSong(testSong, { ...defaultOptions, showChords: false });
    const lyricSpans = Array.from(el.querySelectorAll('.seg__lyric'));
    const reconstructed = lyricSpans.map((s) => s.textContent).join('');
    expect(reconstructed).toContain('Bless the Lord, O my soul,');
  });
});

// -----------------------------------------------------------------------
// AC4 — Lyrics hideable via showLyrics: false (Eagle-case)
// -----------------------------------------------------------------------

describe('AC4 — showLyrics: false hides lyric elements', () => {
  it('sets class song--no-lyrics on the root element when showLyrics is false', () => {
    const el = renderSong(testSong, { ...defaultOptions, showLyrics: false });
    expect(el.classList.contains('song--no-lyrics')).toBe(true);
  });

  it('does NOT set song--no-lyrics when showLyrics is true', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.classList.contains('song--no-lyrics')).toBe(false);
  });

  it('chord elements are still present when showLyrics is false', () => {
    const el = renderSong(testSong, { showChords: true, showLyrics: false, chordRatio: 0.8 });
    const chordSpans = Array.from(el.querySelectorAll('.seg__chord'));
    const nonEmptyChords = chordSpans.filter((s) => s.textContent !== '');
    expect(nonEmptyChords.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------
// AC5 — chordRatio sets --chord-ratio CSS custom property
// -----------------------------------------------------------------------

describe('AC5 — chordRatio sets --chord-ratio inline style', () => {
  it('sets --chord-ratio to 0.7 on the root element when chordRatio is 0.7', () => {
    const el = renderSong(testSong, { ...defaultOptions, chordRatio: 0.7 });
    expect(el.style.getPropertyValue('--chord-ratio')).toBe('0.7');
  });

  it('sets --chord-ratio to 0.8 on the root element when chordRatio is 0.8', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.style.getPropertyValue('--chord-ratio')).toBe('0.8');
  });

  it('sets --chord-ratio to 1.2 on the root element when chordRatio is 1.2', () => {
    const el = renderSong(testSong, { ...defaultOptions, chordRatio: 1.2 });
    expect(el.style.getPropertyValue('--chord-ratio')).toBe('1.2');
  });
});

// -----------------------------------------------------------------------
// AC7 — No raw ChordPro markup in output
// -----------------------------------------------------------------------

describe('AC7 — no raw ChordPro markup in DOM', () => {
  it('does not contain "[" in textContent', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.textContent).not.toContain('[');
  });

  it('does not contain "]" in textContent', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.textContent).not.toContain(']');
  });

  it('does not contain "{c:" in textContent', () => {
    const el = renderSong(testSong, defaultOptions);
    expect(el.textContent).not.toContain('{c:');
  });
});
