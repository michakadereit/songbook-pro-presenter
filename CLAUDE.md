# Songbook Pro Presenter

A WebApp to display and present song sets from SongBook Pro (*.sbp format).

## Project Goal

Parse `.sbp` set files (SongBook Pro format) and present them in a browser-based presenter with multiple display modes. Designed for live worship/band use.

## Core Features

- Load and parse `.sbp` set files
- Toggle lyrics and/or chords visibility independently
- Adjust font size ratio between chords and lyrics
- Two presentation views:
  - **Slide-Down View**: one song per full-screen slide, navigated sequentially (presentation mode)
  - **Eagle View**: all songs in the set as tiles, only chords visible — for a quick overview

## SongBook Pro File Format (.sbp)

`.sbp` files are ZIP archives containing `dataFile.txt` (JSON) and `dataFile.hash`.

### JSON structure

```jsonc
{
  "songs": [
    {
      "Id": 51,
      "name": "10000 Reasons",
      "author": "Matt Redman",
      "content": "{c: Chorus}\nBless the [C]Lord...",  // ChordPro format
      "key": 10,        // 1-based semitone index (1=C, 2=C#, ..., 10=A)
      "KeyShift": 9,    // transposition offset applied in the set
      "Capo": 0,
      "timeSig": "4/4",
      "TempoInt": 72
    }
  ],
  "sets": [
    {
      "details": { "Id": 65, "name": "CW | Lobpreis", "date": "2026-06-21T00:00:00.000" },
      "contents": [
        { "Order": 0, "SongId": 51, "keyOfset": 9 },
        { "Order": 1, "SongId": 192, "keyOfset": 9 }
      ]
    }
  ],
  "folders": []
}
```

### ChordPro content format

- **Section headers**: `{c: Verse 1}`, `{c: Chorus}`, `{c: Bridge}`
- **Inline chords**: `[G]Amazing [D]grace` — chord in brackets immediately before the syllable
- **Other directives**: `{ccli_license: ...}` — metadata, ignore for display

### Parsing approach

1. Unzip the `.sbp` file (it's a standard ZIP)
2. Read `dataFile.txt` as UTF-8 JSON
3. Find the set by matching `sets[0]` (or the first set)
4. Resolve songs: map `contents[].SongId` → `songs[].Id`, sorted by `contents[].Order`
5. Apply `keyOfset` from the set content (overrides the song's base `KeyShift`)
6. Parse `content` line by line: detect `{c: ...}` section headers and inline `[Chord]` markers

## Tech Stack

- **Frontend only** — no backend required; runs as a static web app
- **Vite + TypeScript** — build tool for development convenience and type safety
- File loaded via drag-and-drop or `<input type="file">`
- No server required in production — deployable as static files

## Display Logic

### Chord/Lyric Rendering

- Chords and lyrics are rendered together per line
- Independent visibility toggles: show/hide chords, show/hide lyrics
- Font size ratio (chords vs. lyrics) adjustable via slider

### Slide-Down View

- Full-screen, one song at a time
- Keyboard navigation (arrow keys / space) to move between songs
- Song title visible at top
- Suitable for projector / second screen use

### Eagle View

- Grid/tile layout showing all songs in the set
- Each tile: song title + chords only (no lyrics)
- Useful for quick structural overview before/during a set

## Project Structure

```
/
├── index.html
├── src/
│   ├── types.ts       # Song, SongSet, SongLine, Chord — pure data types
│   ├── parser.ts      # .sbp ZIP → JSON → SongSet
│   ├── views/
│   │   ├── SlideView.ts
│   │   └── EagleView.ts
│   ├── components/
│   │   └── SongRenderer.ts
│   └── main.ts
├── styles/
│   └── main.css
├── samples/           # .sbp files for development/testing
├── docs/
│   ├── specs/         # Feature specs (spec-driven development)
│   └── exec-plans/
│       ├── active/    # Plans in progress
│       └── completed/ # Finished plans
└── planner/           # Work logs, tickets, milestones
```

## Makefile Conventions

**The root `Makefile` documents all common dev commands.** This enables:
- **Self-documenting:** `make help` lists all available commands
- **Consistency:** one place to find dev, build, and test commands

### Makefile structure

```makefile
.PHONY: help dev build preview test clean

help:
	@echo "songbook-pro-presenter Makefile"
	@echo "  dev      Start Vite dev server"
	@echo "  build    Production build"
	@echo "  preview  Preview production build"
	@echo "  test     Run unit tests (Vitest)"
	@echo "  clean    Remove dist/"

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

test:
	npm test

clean:
	rm -rf dist/
```

## Spec-Driven Development

Feature specs live in `docs/specs/<feature-slug>/spec.md`.

**Pflicht-Reihenfolge vor jedem neuen Exec Plan:**
1. `spec.md` schreiben — User Flow + Akzeptanzkriterien festlegen
2. Tests aus ACs ableiten (unit oder browser) — Tests sind rot
3. Exec Plan + Tickets erstellen (referenzieren die spec.md)
4. Implementieren bis alle Tests grün
5. Ticket DONE, Commit + Push

Ohne `spec.md` darf kein Exec Plan gestartet werden.

### Qualität der Akzeptanzkriterien

Jede AC muss das **beobachtbare Ergebnis im UI** beschreiben, nicht nur die ausgelöste Aktion.

| ❌ Zu schwach | ✅ Besser |
|---|---|
| Slide-View zeigt Song an | Nach Laden der .sbp-Datei füllt Song 1 den vollen Bildschirm; Titel steht oben |
| Pfeiltaste wechselt Song | Nach Drücken von → verschwindet Song 1; Song 2 füllt den Bildschirm |
| Akkorde ausblendbar | Nach Klick auf „Akkorde ausblenden" sind keine `[Chord]`-Elemente im DOM sichtbar |

## Skills

Custom skills are stored in `.claude/skills/` as markdown files.

```markdown
---
name: <skill-name>
description: <when this skill should be used>
models: [model1, model2, ...]
---

<skill implementation>
```

### Available skills

- **clean-code** (`haiku`, `sonnet`, `opus`) — Clean Code refactoring for TypeScript/JS
- **hexagonal-architecture** (`sonnet`, `opus`) — module boundary discipline
- **tdd** (`sonnet`, `opus`) — Red → Green → Refactor cycle
- **test-ui** — verify ticket ACs against running app via Playwright MCP

## Execution plans

- All execution plans live in `docs/exec-plans/active/` while in progress and get moved to `docs/exec-plans/completed/` once finished.
- One plan per directory: `docs/exec-plans/active/<plan-slug>/` containing a `README.md` and one file per ticket (`TICKET-XXX-<slug>.md`).
- **Model recommendation:** Each plan's `README.md` must state a recommended model (Haiku, Sonnet, Opus) based on complexity.
- Tickets must be self-contained. Each ticket states its goal, dependencies, deliverables, acceptance criteria, and out-of-scope items.
- When a ticket is done, mark it in the plan's `README.md`. Move to `completed/` only when *all* tickets are done.

## Definition of Done

Bevor ein Ticket als `DONE` markiert wird:
1. Alle Acceptance Criteria aus dem Ticket erfüllt
2. `npm test` läuft grün (kein neuer failing Test)
3. Neue Features wurden manuell im Browser getestet (golden path + Randfall)
4. Commit + Push gemäß Conventional Commit Convention

## Work log (`planner/`)

- `planner/tickets/` — loose ideas, backlog items, things to investigate
- `planner/weekly-logs/` — weekly notes, current focus, short-term plans
- `planner/annual-logs/` — yearly goals and retrospectives
- `planner/milestones/` — milestones reached during implementation

**Pflicht:** Das Tagesprotokoll unter `planner/weekly-logs/YYYY/qQ/kwNN/YYYY-MM-DD/protocol.md` wird bei jeder Arbeitssession aktualisiert — was gemacht wurde, Entscheidungen, nächste Schritte. Vor einem Commit von Planungs- oder Spec-Dateien immer zuerst das Protokoll ergänzen.

## Branch-Check vor jeder Änderung

**Vor dem ersten Edit oder Commit in einer Session immer prüfen:**

```bash
git branch --show-current
```

- Planungs-Dateien (Spec, Exec Plan, CLAUDE.md, planner/) → `main`
- Roter Test (TDD, noch nicht grüne Tests) → Feature-Branch
- Implementierung eines Tickets → Feature-Branch des zugehörigen Plans
- Auf dem falschen Branch: erst wechseln, dann ändern.

## TDD-Branching-Regel

Wenn Test-Driven Development angewendet wird:

**Fehlschlagende Tests dürfen nie direkt auf `main` committed werden.**

Ablauf:
1. Feature-Branch anlegen: `git checkout -b feat/<ticket-slug>`
2. Roten Test committen (`test(<scope>): add failing test for <feature>`)
3. Implementieren bis Test grün ist
4. Merge auf `main` (nur mit grünen Tests)

## Branch-Cleanup nach Merge

**Nach erfolgreichem Merge eines Feature-Branches in `main` wird der Branch sofort lokal UND remote gelöscht.**

```bash
git branch -d feat/<slug>            # lokal
git push origin --delete feat/<slug> # remote
```

## Committing and pushing after execution plan tickets

When a ticket from an exec-plan is completed, always:

1. Stage the relevant files and create a **Conventional Commit**:
   - Format: `<type>(<scope>): <short description>`
   - Common types: `feat`, `fix`, `chore`, `docs`, `refactor`
   - Use the ticket id and slug as the scope: `feat(TICKET-001-parser): parse sbp zip format`
   - Keep the subject line under 72 characters.
2. **Push** the commit immediately after committing.
