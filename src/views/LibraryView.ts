import type { Song } from '../types';
import { openLibraryFolder, loadLibrarySongs } from '../libraryStore';

export interface LibraryViewOptions {
  onAddSong: (song: Song) => void;
  hasSet: () => boolean;
  onExportSetToLibrary?: () => Promise<void>;
}

export interface LibraryView {
  el: HTMLElement;
  open(): void;
  close(): void;
  toggle(): void;
  setHasSet(has: boolean): void;
  refresh(): Promise<void>;
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

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'library-refresh-btn';
  refreshBtn.type = 'button';
  refreshBtn.setAttribute('aria-label', 'Aktualisieren');
  refreshBtn.textContent = '↻';
  refreshBtn.style.display = 'none';

  const exportSetBtn = document.createElement('button');
  exportSetBtn.className = 'library-export-btn';
  exportSetBtn.type = 'button';
  exportSetBtn.textContent = 'Set → Library';
  exportSetBtn.style.display = 'none';

  const changeFolderBtn = document.createElement('button');
  changeFolderBtn.className = 'library-change-btn';
  changeFolderBtn.type = 'button';
  changeFolderBtn.setAttribute('aria-label', 'Ordner wechseln');
  changeFolderBtn.textContent = 'Ordner wechseln';
  changeFolderBtn.style.display = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'library-drawer__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Schließen');
  closeBtn.textContent = '×';

  header.appendChild(title);
  header.appendChild(refreshBtn);
  header.appendChild(exportSetBtn);
  header.appendChild(changeFolderBtn);
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

    changeFolderBtn.style.display = '';
    refreshBtn.style.display = '';
    updateExportBtnVisibility();
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

    changeFolderBtn.style.display = 'none';
    refreshBtn.style.display = 'none';
    exportSetBtn.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // Export button helpers
  // ---------------------------------------------------------------------------

  function updateExportBtnVisibility(): void {
    const visible = options.onExportSetToLibrary !== undefined && options.hasSet();
    exportSetBtn.style.display = visible ? '' : 'none';
  }

  exportSetBtn.addEventListener('click', () => {
    void (async () => {
      exportSetBtn.disabled = true;
      exportSetBtn.textContent = '…';
      await options.onExportSetToLibrary?.();
      await refresh();
      exportSetBtn.disabled = false;
      exportSetBtn.textContent = 'Set → Library';
    })();
  });

  async function onRefreshClick(): Promise<void> {
    refreshBtn.disabled = true;
    await refresh();
    refreshBtn.disabled = false;
  }

  refreshBtn.addEventListener('click', () => {
    void onRefreshClick();
  });

  // ---------------------------------------------------------------------------
  // Refresh: reload songs from library folder
  // ---------------------------------------------------------------------------

  async function refresh(): Promise<void> {
    const result = await loadLibrarySongs();
    if (result) {
      allSongs = result.songs;
      renderSongList(allSongs);
    }
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

  async function onChangeFolderClick(): Promise<void> {
    const result = await openLibraryFolder();
    if (result !== null) {
      allSongs = result.songs;
      renderSongList(allSongs);
    }
  }

  function onCloseClick(): void {
    close();
  }

  changeFolderBtn.addEventListener('click', onChangeFolderClick);
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
    updateExportBtnVisibility();
  }

  function dispose(): void {
    changeFolderBtn.removeEventListener('click', onChangeFolderClick);
    refreshBtn.removeEventListener('click', () => {
      void onRefreshClick();
    });
    closeBtn.removeEventListener('click', onCloseClick);
    aside.remove();
  }

  return { el: aside, open, close, toggle, setHasSet, refresh, dispose };
}
