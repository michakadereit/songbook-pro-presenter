---
name: clean-code
description: >
  Apply Clean Code principles to new or existing code in this project.
  Use when the user asks to "clean up", "refactor for clarity", "apply clean code",
  or when reviewing code for readability and maintainability issues.
  Covers naming, functions, modules, error handling, comments, and formatting
  — tailored to the TypeScript/vanilla JS frontend.
models: [haiku, sonnet, opus]
---

# clean-code

You are executing the `clean-code` skill. Your job: read existing code (or
code you are about to write) and apply the Clean Code principles below.

This skill is **prescriptive**: follow the rules, don't debate them. If a rule
conflicts with a project-specific constraint, note the conflict and explain the
exception — don't silently ignore it.

---

## Input

The user invokes `/clean-code <argument>`. The argument can be:

- A file path or glob — apply the principles to the code in those files
- A ticket or feature description — apply principles while implementing
- No argument — apply to the most recent diff (`git diff HEAD`)

If the scope is unclear, **ask before proceeding**.

---

## Phase 0 — Understand the scope

1. Read the target files or diff.
2. Identify the layer(s) involved:
   - **Parser** (`src/parser.ts`) — .sbp file parsing, data model
   - **Views** (`src/views/`) — SlideView, EagleView
   - **Components** (`src/components/`) — SongRenderer and shared UI
   - **Main entry** (`src/main.ts`) — wiring and app bootstrap
   - **Styles** (`styles/`) — CSS
3. Check branch: `git branch --show-current`. Pure refactors without functional
   change may go on `main`. Refactors that accompany a feature must stay on the
   feature branch.

---

## Principle 1 — Naming

**The name is the documentation. If you need a comment to explain a name, rename it.**

### Rules

| Smell | Fix |
|-------|-----|
| Abbreviations (`s`, `c`, `cfg`) | Full words: `song`, `chord`, `config` |
| Type-encoded names (`songList`, `chordString`) | `songs`, `chord` |
| Vague nouns (`data`, `info`, `result`, `temp`) | Say what it represents: `parsedSet`, `renderedLine` |
| Boolean names that don't read as predicates (`chords`, `active`) | `showChords`, `isActive` |
| Method names that lie about scope (`parseAndRender()`) | Split into `parse()` + `render()` |
| Magic numbers (`if (type == 1)`) | Named constant: `if (type == SONG_ITEM)` |

### TypeScript naming

```typescript
// BAD
const d = new Date();
const arr = res.songs.map(s => s.c);

// GOOD
const today = new Date();
const chords = parsedSet.songs.map(song => song.chords);
```

---

## Principle 2 — Functions

**A function does ONE thing. If you can extract a meaningful second function from
it, it was doing two things.**

### Rules

- **Max 20 lines** per function body (aim for 10). If it's longer, extract.
- **Max 3 parameters**. More → group into an options object.
- **One level of abstraction per function.**
- **No output parameters.** Return a value; don't mutate a passed-in object.
- **Command-Query Separation.** A function either *changes state* or *returns a value* — not both.
- **No side effects** in query functions.

### TypeScript example

```typescript
// BAD — fetch + transform + side-effect in one arrow function
const load = async () => {
  const r = await fetch('/api/songs');
  const j = await r.json();
  setSongs(j.map((s: any) => ({ id: s.id, title: s.name, lines: s.content.split('\n') })));
};

// GOOD
const fetchSongs = async (): Promise<Song[]> => {
  const response = await fetch('/api/songs');
  return (await response.json()).map(toSong);
};

const toSong = (raw: RawSong): Song => ({
  id: raw.id,
  title: raw.name,
  lines: raw.content.split('\n'),
});
```

---

## Principle 3 — Modules

**A module has ONE reason to change (Single Responsibility Principle).**

### Rules

- A module file over ~150 lines is a smell; extract when a file has more than one natural "theme".
- **No God modules**: a file that parses and renders and manages state is three files.
- **High cohesion**: all exports of a module should serve the same concern.

### Module boundaries (this project)

```
src/parser.ts      → parsing only: reads .sbp bytes, returns SongSet data structure
src/views/         → rendering only: consumes SongSet, produces DOM
src/components/    → reusable UI fragments consumed by multiple views
src/main.ts        → wiring only: loads file, calls parser, mounts views
```

A function in `parser.ts` that manipulates DOM is a boundary violation — fix it.

---

## Principle 4 — Comments

**The only good comment explains WHY, not WHAT. Code explains what.**

### Never write these

```typescript
// Increment i
i++;

// Check if song is active
if (song.isActive) { ... }
```

### Write comments for these (and only these)

```typescript
// .sbp format uses 1-based key index where 10 = A (not 0 = C)
// mapping here converts to standard 0-based semitone offset
const semitone = key - 1;

// ChordPro {c: ...} directives are section markers — render as headings, not lyrics
if (line.startsWith('{c:')) { ... }
```

---

## Principle 5 — Error Handling

**Error handling is part of the logic, not an afterthought.**

### Rules

- **Don't return `null`** from functions that can fail gracefully — return `T | undefined` or a `Result<T>` type.
- **Don't swallow exceptions**:
  ```typescript
  // BAD
  try { parse(file); } catch { /* nothing */ }

  // GOOD
  try { parse(file); } catch (e) {
    throw new ParseError(`Failed to parse .sbp file: ${e}`);
  }
  ```
- **Fail fast** in constructors and factory functions:
  ```typescript
  function parseSong(raw: RawSong): Song {
    if (!raw.name) throw new Error('Song must have a name');
    if (!raw.content) throw new Error('Song must have content');
    ...
  }
  ```
- **Domain errors carry meaning** — name them after the business rule violated: `InvalidSbpFormatError`, not `ParseException`.

---

## Principle 6 — Formatting

**Formatting is communication. Inconsistency implies inconsistency in logic.**

- Prefer `const` over `let`; never use `var`.
- Destructure immediately at the top of a function:
  ```typescript
  // BAD
  const render = (props: Props) => `<div>${props.song.title}</div>`;

  // GOOD
  const render = ({ song }: Props) => `<div>${song.title}</div>`;
  ```
- Group imports: framework/lib first, then local.
- Blank lines separate logical paragraphs within a function.
- No horizontal scrolling: wrap lines at 120 characters.

---

## Principle 7 — No Premature Abstraction

**Three similar lines of code is better than a premature abstraction.**

Signs of over-engineering:
- A helper that is called exactly once
- An interface with exactly one implementation (and no future implementations planned)
- A base class added "because we might add another type later"

Rules:
- Extract a function/module only when you have **concrete duplication** (at least two real call sites) or when the abstraction has a **name that communicates a domain concept** worth making explicit.
- Do not design for hypothetical future requirements.

---

## Phase 1 — Identify violations

Read the target code. For each violation found, record:
1. **File and line number**
2. **Which principle**
3. **What's wrong** (one sentence)
4. **Proposed fix** (before/after snippet)

---

## Phase 2 — Apply fixes

Apply fixes in this order:
1. Renames first
2. Extract functions/modules
3. Error handling cleanup
4. Comment cleanup
5. Formatting last

After each meaningful change, verify the code still type-checks (if TypeScript is used):

```bash
npx tsc --noEmit
```

---

## Phase 3 — Verify no regressions

Open the app in a browser and verify the golden path still works after the refactor.

---

## Phase 4 — Commit

```
refactor(<scope>): <what changed and why it's cleaner>
```

Do **not** bundle refactors with feature changes in the same commit.

---

## What you must NOT do

- **Do not rename things that are part of the public file format contract** (e.g. JSON field names from .sbp parsing).
- **Do not extract code into a helper that is called only once**, unless the name communicates a domain concept.
- **Do not add abstractions "for flexibility"** that aren't needed today.
- **Do not commit with failing tests.**
- **Do not mix refactoring and feature work in the same commit.**
