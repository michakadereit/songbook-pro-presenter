/**
 * Toggles fullscreen mode for the given element.
 * Calls `el.requestFullscreen()` when no fullscreen element is active,
 * otherwise calls `document.exitFullscreen()`.
 * Uses optional chaining defensively in case the Fullscreen API is unavailable.
 */
export function toggleFullscreen(el: Element): void {
  if (document.fullscreenElement == null) {
    (el as HTMLElement).requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}
