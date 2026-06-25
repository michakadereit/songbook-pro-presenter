import { describe, it, expect } from 'vitest';
import { folderNameFromFiles } from './shellHelpers';

/** Create a minimal File-like object with an optional webkitRelativePath. */
function makeFile(name: string, relativePath?: string): File {
  const file = new File([''], name);
  if (relativePath !== undefined) {
    Object.defineProperty(file, 'webkitRelativePath', {
      value: relativePath,
      writable: false,
    });
  }
  return file;
}

describe('folderNameFromFiles', () => {
  it('returns the first path segment from webkitRelativePath', () => {
    const files = [
      makeFile('song.chopro', 'my-setlist/song.chopro'),
      makeFile('other.chopro', 'my-setlist/other.chopro'),
    ];
    expect(folderNameFromFiles(files)).toBe('my-setlist');
  });

  it('falls back to "OnSong" when no webkitRelativePath is present', () => {
    const files = [makeFile('song.chopro'), makeFile('other.chopro')];
    expect(folderNameFromFiles(files)).toBe('OnSong');
  });

  it('falls back to "OnSong" for an empty file list', () => {
    expect(folderNameFromFiles([])).toBe('OnSong');
  });

  it('uses first file with a non-empty webkitRelativePath, skipping empty strings', () => {
    const files = [
      makeFile('a.chopro', ''),
      makeFile('b.chopro', 'setlist-b/b.chopro'),
    ];
    expect(folderNameFromFiles(files)).toBe('setlist-b');
  });

  it('handles nested paths by returning only the first segment', () => {
    const files = [makeFile('deep.chopro', 'root/sub/deep.chopro')];
    expect(folderNameFromFiles(files)).toBe('root');
  });
});
