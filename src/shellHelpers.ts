/**
 * Shell helper utilities — pure functions extracted from the app shell
 * so they can be unit-tested without a DOM.
 */

/**
 * Derive a human-readable folder name from a list of File objects.
 *
 * Priority:
 * 1. First path segment of `file.webkitRelativePath` (set by browser folder picker).
 * 2. Fallback string `"OnSong"` if no webkitRelativePath is available.
 *
 * This is the same logic used by `parseChordProFolder`'s internal
 * `resolveFolderName`, exposed here so the shell can show the name
 * in the status line before / alongside calling the parser.
 */
export function folderNameFromFiles(files: File[]): string {
  for (const file of files) {
    const path = (file as File & { webkitRelativePath?: string })
      .webkitRelativePath;
    if (path) {
      const segment = path.split('/')[0];
      if (segment) return segment;
    }
  }
  return 'OnSong';
}

/**
 * Mark the app shell as having a set loaded.
 *
 * Adds the `has-set` class to the given root element (typically `document.body`).
 * CSS uses this marker to hide the `.uploader` container and reveal the view.
 * Calling this multiple times is safe — `classList.add` is idempotent.
 */
export function markSetLoaded(root: HTMLElement): void {
  root.classList.add('has-set');
}
