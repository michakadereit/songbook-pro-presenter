---
name: hexagonal-architecture
description: Guide agents in building software following Hexagonal Architecture (Ports & Adapters) and Clean Architecture principles. Use this skill whenever the user asks to add a new feature, use case, or module; when the user asks "where does X go" in the codebase; when designing new modules; or when the user mentions "port", "adapter", "use case", "domain", "business logic", "hexagonal", or "clean architecture". Note: this project is a simple TypeScript frontend — the hexagonal pattern is applied lightly via module boundary discipline.
models: [sonnet, opus]
---

# Hexagonal Architecture (Ports & Adapters)

This skill guides you through building software that follows Hexagonal Architecture (Alistair Cockburn) combined with Clean Architecture layering (Robert C. Martin).

For Java-specific code examples, read `references/java-patterns.md`.

---

## Core idea in one sentence

The **application core** (domain + use cases) is independent of everything external — no framework, no HTTP. External systems connect through **ports** (interfaces owned by the core) and **adapters** (implementations owned by the infrastructure).

---

## The one rule that governs everything

**Dependencies point inward only.**

```
[View / UI]  →  [Song rendering logic]  →  [Song data model]
[File input] →  [Parser port]           ←  [Use case]
```

- A view may call a renderer. ✅
- A renderer may know about the Song data model. ✅
- The Song data model must NEVER import DOM APIs or file I/O. ❌
- The parser must NEVER manipulate DOM. ❌

---

## Layer map (this project)

| Layer | File(s) | Contains |
|---|---|---|
| **Domain** | `src/types.ts` | Song, SongSet, SongLine, Chord — pure data types, no DOM |
| **Ports/In** | `src/parser.ts` | `parseSbp(bytes): SongSet` — what the app can parse |
| **Use Cases** | `src/main.ts` | Orchestrates: load file → parse → mount view |
| **Primary Adapters** | `src/views/SlideView.ts`, `src/views/EagleView.ts` | Render SongSet to DOM |
| **Secondary Adapters** | File input, drag-and-drop handlers | Feed raw bytes to the parser |

### Visual

```
┌──────────────────────────────────────────────┐
│  Primary Adapters (views, DOM rendering)     │
│       │                                      │
│       ▼                                      │
│  ┌────────────────────────────────────────┐  │
│  │  Use Cases (main.ts orchestration)     │  │
│  │       │                    │           │  │
│  │       ▼                    ▼           │  │
│  │  Domain Types (Song,  Parser Port      │  │
│  │  SongSet, Chord)      parseSbp()       │  │
│  └────────────────────────────────────────┘  │
│                       │                      │
│                       ▼                      │
│  Secondary Adapters (file input, drag/drop)  │
└──────────────────────────────────────────────┘
```

---

## Decision guide: where does new code go?

```
Is it a business rule (e.g. "chords are inline in brackets")?
  → src/parser.ts or a pure helper in src/

Does it represent a thing in the domain (Song, Chord, SongSet)?
  → Type/interface in src/types.ts

Does it define HOW TO PARSE .sbp?
  → src/parser.ts

Does it render songs to DOM?
  → src/views/ or src/components/

Does it wire everything together (file input → parse → render)?
  → src/main.ts

Is it shared UI used by both views?
  → src/components/
```

---

## Common violations — catch these before committing

| Violation | Why it's a problem | Fix |
|---|---|---|
| `document.querySelector` in `parser.ts` | Parser becomes untestable without a DOM | Move DOM access to a view or component |
| Song type imports `FileReader` or DOM types | Domain becomes coupled to browser APIs | Keep Song as a pure data type |
| View directly reads `.sbp` bytes | Skips parser; format changes require multiple fixes | Route through `parseSbp()` |
| `main.ts` contains rendering logic | Entry point becomes a God module | Extract rendering to views/components |

---

## Testing strategy by layer

| Layer | Test type | What to use |
|---|---|---|
| Domain types (Song, Chord) | Unit | Vitest / plain assertions — no DOM |
| Parser (`parseSbp`) | Unit | Vitest with .sbp fixture bytes |
| Views | Integration | Browser or JSDOM with real parsed data |
| Full flow | Manual / E2E | Open in browser, load sample .sbp |

---

For Java-specific hexagonal patterns (if the project ever grows a backend), read `references/java-patterns.md`.
