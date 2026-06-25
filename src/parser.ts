import type { SongSet } from './types';

/**
 * Parse a Songbook Pro `.sbp` file (a ZIP containing `dataFile.txt`) into a SongSet.
 *
 * NOTE: Implementation is intentionally deferred — this module is driven by
 * `docs/specs/sbp-parser/spec.md` (spec-driven development). See README/CLAUDE.md.
 *
 * Known format quirks captured during research:
 *   - `dataFile.txt` starts with a version line ("1.0\n") BEFORE the JSON.
 *   - `songs[]` and `sets[].contents[]` carry a `Deleted` flag to filter out.
 *   - Set content `keyOfset` is the final transposition (overrides song KeyShift).
 */
export async function parseSbp(_file: Blob): Promise<SongSet> {
  throw new Error('parseSbp not implemented yet — write docs/specs/sbp-parser/spec.md first');
}
