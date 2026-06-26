import { describe, it, expect } from 'vitest';
import { folderNameFromFiles, markSetLoaded } from './shellHelpers';

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

describe('markSetLoaded', () => {
  it('adds the has-set class to the given root element', () => {
    const root = document.createElement('div');
    markSetLoaded(root);
    expect(root.classList.contains('has-set')).toBe(true);
  });

  it('is idempotent — calling twice does not duplicate the class', () => {
    const root = document.createElement('div');
    markSetLoaded(root);
    markSetLoaded(root);
    expect([...root.classList].filter(c => c === 'has-set').length).toBe(1);
  });

  it('does not remove other existing classes', () => {
    const root = document.createElement('div');
    root.classList.add('existing-class');
    markSetLoaded(root);
    expect(root.classList.contains('existing-class')).toBe(true);
    expect(root.classList.contains('has-set')).toBe(true);
  });
});
