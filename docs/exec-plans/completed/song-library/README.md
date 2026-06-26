# Exec Plan: Song-Bibliothek

> Spec: [`docs/specs/song-library/spec.md`](../../../specs/song-library/spec.md)
> Branch: `feat/song-library` · Erstellt 2026-06-26

## Ziel

Lokalen `.chopro`-Ordner als persistente Bibliothek konfigurieren. Drawer-Panel zum
Durchsuchen und Hinzufügen von Songs zum aktuellen Set. Handle-Persistenz über
IndexedDB. Alle 7 ACs grün + Browser-verifiziert.

## Architektur

```
src/libraryStore.ts     — File System Access API + IDB (keine DOM-Abhängigkeit)
src/views/LibraryView.ts — Overlay-Drawer: Liste, Suche, + je Song
main.ts                 — Bibliothek-Button, Panel-Toggle, onAddSong-Callback
styles/main.css         — Drawer-CSS (translateX-Transition)
```

Wiederverwendung:
- `parseChordProFolder` (besteht) parst `.chopro`-Dateien aus dem Ordner.
- `loadSet` (besteht in `main.ts`) remountet den View.

## Empfohlene Modelle

- TICKET-001 LibraryStore (File System Access API + IDB): **Sonnet**
- TICKET-002 LibraryView (Drawer-Komponente, Suche): **Sonnet**
- TICKET-003 Shell-Integration + CSS (Drawer, main.ts Wiring): **Opus**
  (CSS-Transition, mehrere Touch-Points, UX-Qualität)

## Tickets

| Ticket | Titel | ACs | Abhängig von | Modell | Status |
|--------|-------|-----|--------------|--------|--------|
| TICKET-001 | `LibraryStore` — IDB + File System Access | AC1, AC2, AC7 | — | Sonnet | ✅ DONE |
| TICKET-002 | `LibraryView` — Drawer-Panel | AC1, AC3, AC5, AC6, AC7 | 001 | Sonnet | ✅ DONE |
| TICKET-003 | Shell-Integration + CSS | AC4, AC5, AC6 | 002 | Opus | ✅ DONE |

**Abgeschlossen 2026-06-26:** 266 Tests grün, `tsc`/Build sauber, im Browser verifiziert
(Bibliothek-Button + Drawer-Toggle, Leer-Zustand, ×-Schließen; `showDirectoryPicker`
headless nicht testbar → IDB-Persistenz manuell zu verifizieren). Gemergt nach `main`.

Sequenziell 001 → 002 → 003 (jedes Ticket baut auf dem vorherigen auf; teilen
`styles/main.css` → kein paralleler Edit).

Alle als **Vordergrund-Agenten** (Bash für Vitest + tsc nötig).

## Definition of Done (Plan)

- `npx tsc --noEmit` sauber, `npm run build` ok, bestehende Tests grün.
- Browser-Verifikation (Playwright MCP): Ordner wählen → Songs sichtbar → Song
  hinzufügen → View zeigt neuen Song → nach Reload Drawer wieder zugänglich.
- Branch nach `main` gemergt, Plan nach `completed/`, Branch gelöscht.
