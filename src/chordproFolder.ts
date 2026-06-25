import type { SongSet } from './types';
import { parseChordPro } from './chordproParser';

/**
 * Parse a collection of `File` objects (from a folder picker or drag-and-drop)
 * into a `SongSet`.
 *
 * - Only files with a `.chopro` extension (case-insensitive) are parsed.
 * - Files are sorted alphabetically by `file.name` before processing.
 * - Each song's `id` is set to its 0-based index in the sorted list.
 * - The set name is derived (in priority order) from:
 *   1. The `folderName` parameter, if provided.
 *   2. The first path segment of `file.webkitRelativePath`, if available.
 *   3. The fallback string `"OnSong"`.
 */
export async function parseChordProFolder(
  files: File[],
  folderName?: string,
): Promise<SongSet> {
  // Filter to .chopro files only (case-insensitive).
  const choProFiles = files.filter((f) =>
    f.name.toLowerCase().endsWith('.chopro'),
  );

  // Sort alphabetically by filename (locale-independent stable sort).
  choProFiles.sort((a, b) => a.name.localeCompare(b.name));

  // Resolve the set name.
  const name = resolveFolderName(files, folderName);

  // Parse each .chopro file into a Song.
  const songs = await Promise.all(
    choProFiles.map(async (file, index) => {
      const text = await file.text();
      // Strip the .chopro extension to use as fallback name.
      const baseName = file.name.replace(/\.chopro$/i, '');
      const song = parseChordPro(text, baseName);
      song.id = index;
      return song;
    }),
  );

  return {
    id: 0,
    name,
    date: '',
    songs,
  };
}

/** Derive the set name from the optional parameter, webkitRelativePath, or fallback. */
function resolveFolderName(files: File[], folderName?: string): string {
  if (folderName) return folderName;

  // Try to extract the folder name from webkitRelativePath of any file.
  for (const file of files) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (path) {
      const firstSegment = path.split('/')[0];
      if (firstSegment) return firstSegment;
    }
  }

  return 'OnSong';
}
