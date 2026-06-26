import type { Song } from '../types';
import { openLibraryFolder, loadLibrarySongs } from '../libraryStore';

export interface LibraryViewOptions {
  onAddSong: (song: Song) => void;
  hasSet: () => boolean;
}

export interface LibraryView {
  el: HTMLElement;
  open(): void;
  close(): void;
  toggle(): void;
  setHasSet(has: boolean): void;
  dispose(): void;
}

export function createLibraryView(options: LibraryViewOptions): LibraryView {
  // ---------------------------------------------------------------------------
  // Closure state
  // ---------------------------------------------------------------------------
  let allSongs: Song[] = [];
  let isOpen = false;

  // ---------------------------------------------------------------------------
  // Build DOM skeleton
  // ---------------------------------------------------------------------------
  const aside = document.createElement('aside');
  aside.className = 'library-drawer';
  aside.setAttribute('aria-hidden', 'true');

  // Header
  const header = document.createElement('div');
  header.className = 'library-drawer__header';

  const title = document.createElement('h2');
  title.className = 'library-drawer__title';
  title.textContent = 'Bibliothek';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'library-drawer__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Schließen');
  closeBtn.textContent = '×';

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'library-drawer__body';

  aside.appendChild(header);
  aside.appendChild(body);

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  function renderSongList(songs: Song[]): void {
    body.replaceChildren();

    const searchInput = document.createElement('input');
    searchInput.className = 'library-search';
    searchInput.type = 'search';
    searchInput.placeholder = 'Song suchen…';

    const list = document.createElement('ul');
    list.className = 'library-list';

    body.appendChild(searchInput);
    body.appendChild(list);

    renderListItems(songs, list);

    searchInput.addEventListener('input', onSearchInput);
  }

  function renderListItems(songs: Song[], list: HTMLUListElement): void {
    list.replaceChildren();

    const hasSet = options.hasSet();

    for (const song of songs) {
      const item = document.createElement('li');
      item.className = 'library-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'library-item__name';
      nameSpan.textContent = song.name;

      const addBtn = document.createElement('button');
      addBtn.className = 'library-item__add';
      addBtn.type = 'button';
      addBtn.setAttribute('aria-label', 'Zum Set hinzufügen');
      addBtn.textContent = '+';
      addBtn.disabled = !hasSet;

      addBtn.addEventListener('click', () => {
        options.onAddSong(song);
        addBtn.disabled = true;
        setTimeout(() => {
          addBtn.disabled = !options.hasSet();
        }, 300);
      });

      item.appendChild(nameSpan);
      item.appendChild(addBtn);
      list.appendChild(item);
    }
  }

  function renderEmptyState(): void {
    body.replaceChildren();

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'library-empty';

    const emptyText = document.createElement('p');
    emptyText.textContent = 'Kein Ordner konfiguriert.';

    const configureBtn = document.createElement('button');
    configureBtn.className = 'library-configure-btn shell-bar__btn';
    configureBtn.type = 'button';
    configureBtn.textContent = 'Ordner konfigurieren';

    configureBtn.addEventListener('click', onConfigureClick);

    emptyDiv.appendChild(emptyText);
    emptyDiv.appendChild(configureBtn);
    body.appendChild(emptyDiv);
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  function onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    const filtered = allSongs.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()),
    );
    const list = body.querySelector<HTMLUListElement>('.library-list');
    if (list) {
      renderListItems(filtered, list);
    }
  }

  async function onConfigureClick(): Promise<void> {
    const result = await openLibraryFolder();
    if (result !== null) {
      allSongs = result.songs;
      renderSongList(allSongs);
    }
  }

  function onCloseClick(): void {
    close();
  }

  closeBtn.addEventListener('click', onCloseClick);

  // ---------------------------------------------------------------------------
  // Init: load persisted library
  // ---------------------------------------------------------------------------
  async function init(): Promise<void> {
    try {
      const result = await loadLibrarySongs();
      if (result !== null && result.songs.length > 0) {
        allSongs = result.songs;
        renderSongList(allSongs);
      } else {
        renderEmptyState();
      }
    } catch {
      renderEmptyState();
    }
  }

  void init();

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function open(): void {
    isOpen = true;
    aside.classList.add('library-drawer--open');
    aside.setAttribute('aria-hidden', 'false');
  }

  function close(): void {
    isOpen = false;
    aside.classList.remove('library-drawer--open');
    aside.setAttribute('aria-hidden', 'true');
  }

  function toggle(): void {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function setHasSet(has: boolean): void {
    const addButtons = aside.querySelectorAll<HTMLButtonElement>(
      '.library-item__add',
    );
    for (const btn of addButtons) {
      btn.disabled = !has;
    }
  }

  function dispose(): void {
    closeBtn.removeEventListener('click', onCloseClick);
    aside.remove();
  }

  return { el: aside, open, close, toggle, setHasSet, dispose };
}
