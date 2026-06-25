import type { SongSet } from '../types';
import { mountSlideView } from './SlideView';
import { mountEagleView } from './EagleView';

export type ViewMode = 'slide' | 'eagle';

/**
 * App-shell component: renders a tab bar ("Slide" | "Eagle") and a view container.
 * Switching tabs tears down the old view (calls dispose for SlideView, empties the
 * container for EagleView) and mounts the new one — same SongSet, no reload.
 *
 * DOM contract:
 *   .view-switcher              — root wrapper
 *     .view-tabs                — tab bar
 *       button[data-view="slide"]  — "Slide" tab (aria-pressed reflects active state)
 *       button[data-view="eagle"]  — "Eagle" tab
 *     .view-container           — the active view is rendered here
 *
 * @param root     Element to render into (replaces its children).
 * @param set      SongSet to display in both views.
 * @param initial  Which view to show first; defaults to 'slide'.
 * @returns        Object with `dispose()` — cleans up the active view and its listeners.
 */
export function mountViewSwitcher(
  root: HTMLElement,
  set: SongSet,
  initial: ViewMode = 'slide',
): { dispose(): void } {
  // ---------------------------------------------------------------------------
  // Closure state
  // ---------------------------------------------------------------------------
  let currentMode: ViewMode | null = null;
  /** Dispose function returned by mountSlideView; null while eagle is active. */
  let slideDispose: (() => void) | null = null;

  // ---------------------------------------------------------------------------
  // DOM skeleton
  // ---------------------------------------------------------------------------
  const wrapper = document.createElement('div');
  wrapper.className = 'view-switcher';

  const tabBar = document.createElement('div');
  tabBar.className = 'view-tabs';

  // Tab: Slide
  // data-view is the stable hook used by tests and click handlers.
  const slideTab = document.createElement('button');
  slideTab.className = 'view-tab';
  slideTab.dataset['view'] = 'slide';
  slideTab.textContent = 'Slide';
  slideTab.setAttribute('aria-pressed', 'false');

  // Tab: Eagle
  const eagleTab = document.createElement('button');
  eagleTab.className = 'view-tab';
  eagleTab.dataset['view'] = 'eagle';
  eagleTab.textContent = 'Eagle';
  eagleTab.setAttribute('aria-pressed', 'false');

  tabBar.appendChild(slideTab);
  tabBar.appendChild(eagleTab);

  const viewContainer = document.createElement('div');
  viewContainer.className = 'view-container';

  wrapper.appendChild(tabBar);
  wrapper.appendChild(viewContainer);
  root.replaceChildren(wrapper);

  // ---------------------------------------------------------------------------
  // View switching
  // ---------------------------------------------------------------------------

  function teardownCurrent(): void {
    if (slideDispose !== null) {
      slideDispose();
      slideDispose = null;
    }
    viewContainer.replaceChildren();
  }

  function updateTabState(mode: ViewMode): void {
    slideTab.setAttribute('aria-pressed', mode === 'slide' ? 'true' : 'false');
    eagleTab.setAttribute('aria-pressed', mode === 'eagle' ? 'true' : 'false');

    slideTab.classList.toggle('view-tab--active', mode === 'slide');
    eagleTab.classList.toggle('view-tab--active', mode === 'eagle');
  }

  function showView(mode: ViewMode): void {
    if (mode === currentMode) return;

    teardownCurrent();
    currentMode = mode;
    updateTabState(mode);

    if (mode === 'slide') {
      slideDispose = mountSlideView(viewContainer, set);
    } else {
      mountEagleView(viewContainer, set);
    }
  }

  // ---------------------------------------------------------------------------
  // Tab click listeners
  // ---------------------------------------------------------------------------
  slideTab.addEventListener('click', () => showView('slide'));
  eagleTab.addEventListener('click', () => showView('eagle'));

  // ---------------------------------------------------------------------------
  // Initial render
  // ---------------------------------------------------------------------------
  showView(initial);

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------
  return {
    dispose(): void {
      teardownCurrent();
    },
  };
}
