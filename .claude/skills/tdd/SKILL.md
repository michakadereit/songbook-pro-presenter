---
name: tdd
description: >
  Guide an agent through a complete Test-Driven Development cycle (Red → Green → Refactor)
  for this project. Accepts a ticket file path, ticket ID, or plain feature description.
  Enforces branch hygiene, selects the right test type (unit / browser), writes
  failing tests first, verifies they are red, then drives implementation to green.
  Use when the user says "write TDD", "do TDD for …", or wants to implement a feature
  test-first.
models: [sonnet, opus]
---

# tdd

You are executing the `tdd` skill. Your mission: implement a feature or fix
**test-first**, following the strict Red → Green → Refactor cycle. Every phase
has a mandatory verification gate — do not skip them.

---

## Input

The user invokes `/tdd <argument>`. The argument can be:

- A path to an exec-plan ticket file (e.g. `docs/exec-plans/active/my-plan/TICKET-003-foo.md`)
- A ticket ID alone (e.g. `TICKET-003`) — search `docs/exec-plans/active/` for it
- A free-form feature description (e.g. "parse inline chords from a line")

If the argument is missing or ambiguous, **ask before proceeding**.

---

## Phase 0 — Understand the requirement

1. If the input is a ticket file, read it with `Read`. Extract:
   - Goal / user story
   - Acceptance criteria
   - Which module/layer is being changed (parser, view, component, main)
   - Any stated out-of-scope items (respect them)

2. If the input is a free-form description, ask clarifying questions until you
   know: _what behaviour is expected?_ and _in which module does it live?_

3. Identify the **primary layer** of the change. Map it to a test type:

   | Layer | File(s) | Test type | Runner |
   |-------|---------|-----------|--------|
   | Parser / domain logic | `src/parser.ts`, `src/types.ts` | **Unit test** (Vitest, no DOM) | `npm test` |
   | View rendering | `src/views/` | **Unit test** (Vitest + JSDOM) or browser | `npm test` |
   | Component | `src/components/` | **Unit test** (Vitest + JSDOM) | `npm test` |
   | Full app integration | all | **Manual / browser** | Open `index.html` |

   When a feature spans multiple layers, start with the **innermost** layer
   (parser/domain first, then rendering). Each layer gets its own test.

---

## Phase 1 — Branch hygiene (MANDATORY)

Before writing a single test, ensure you are on the right branch.

```bash
git branch --show-current
```

Rules (from project CLAUDE.md):

- **Planning / spec files only → `main`** (but TDD is never this case)
- **Failing tests + implementation → feature branch**

If you are on `main`, create a feature branch now:

```bash
git checkout -b feat/<ticket-slug>
# e.g. feat/TICKET-003-parse-chords
```

Derive the slug from the ticket ID + a 2–4 word description.

**Never write a failing test on `main`.**

---

## Phase 2 — RED: Write the failing test

### General rules

- One test per acceptance criterion. Name tests after the **observable outcome**.
- Structure each test body with Given / When / Then.
- Test only the public API of the unit under test. Never test private functions.
- Do **not** create production code yet. Let the test fail.

### Unit test template (Vitest, no DOM)

```typescript
import { describe, it, expect } from 'vitest';
import { parseLine } from '../src/parser';

describe('parseLine', () => {
  it('extracts inline chords from a line', () => {
    // GIVEN
    const raw = '[G]Amazing [D]grace';

    // WHEN
    const result = parseLine(raw);

    // THEN
    expect(result.chords).toEqual([
      { chord: 'G', position: 0 },
      { chord: 'D', position: 10 },
    ]);
    expect(result.lyrics).toBe('Amazing grace');
  });
});
```

### Unit test template (Vitest + JSDOM for DOM rendering)

```typescript
import { describe, it, expect } from 'vitest';
import { renderSong } from '../src/components/SongRenderer';
import { Song } from '../src/types';

describe('renderSong', () => {
  it('renders song title as heading', () => {
    // GIVEN
    const song: Song = { title: 'Amazing Grace', sections: [] };
    const container = document.createElement('div');

    // WHEN
    renderSong(song, container, { showChords: true, showLyrics: true });

    // THEN
    expect(container.querySelector('h2')?.textContent).toBe('Amazing Grace');
  });
});
```

---

## Phase 2 — RED: Verify the test fails

After writing the test(s), run:

```bash
npm test
```

Confirm the tests are **red** (compilation error or assertion failure).

**Gate:** You must see a failure before proceeding to Phase 3.

Once the test is verifiably red, commit it:

```bash
git add <test-file-path>
git commit -m "test(<ticket-or-slug>): add failing test for <feature>"
```

---

## Phase 3 — GREEN: Write the minimum implementation

Now implement the production code required to make the failing test(s) pass.

### Rules for the green phase

- **Minimum viable code only.** Solve the failing assertion, nothing more.
- Respect module boundaries:
  - **Parser** (`src/parser.ts`) — pure data transformation, no DOM
  - **Views** (`src/views/`) — DOM rendering only, receives parsed data
  - **Types** (`src/types.ts`) — data shapes only, no logic
  - **Main** (`src/main.ts`) — wiring only
- Do not add defensive handling for inputs that can't reach this code.

### Verify green

```bash
npm test
```

**Gate:** You must see a green run before proceeding to Phase 4.

---

## Phase 4 — REFACTOR

With tests green, clean up:

- Rename anything that is unclear
- Extract a function if a block of code is used more than once
- Remove duplication between test setups
- Do **not** add features that weren't in the spec

After any refactor, rerun:

```bash
npm test
```

---

## Phase 5 — Full test suite check

Before marking the work done, run the full test suite:

```bash
npm test
```

No pre-existing test may newly fail.

---

## Phase 6 — Commit + push

Once all tests are green:

1. Stage all relevant files:
   ```bash
   git add <files>
   ```

2. Create a Conventional Commit:
   ```
   feat(<ticket-or-slug>): <short description under 72 chars>
   ```

3. Push to origin:
   ```bash
   git push -u origin feat/<ticket-slug>
   ```

4. If this completes a ticket, mark it `DONE` in the plan's `README.md` and
   update `planner/weekly-logs/<current-week>/protocol.md`.

---

## What you must NOT do

- **Never write production code before the failing test exists and has been run.**
- **Never commit a failing test to `main`.** Feature branch only.
- **Never write tests that only check element presence** in DOM tests. Tests must verify the *visible result* (text content, attribute values, counts).
- **Never skip the verification gates** (red must be red, green must be green).
- **Never add features or refactors** during the green phase.

---

## Multi-layer features

If the acceptance criteria span parser + rendering:

1. Write + verify parser unit tests (innermost)
2. Make parser tests green
3. Write + verify rendering unit tests
4. Make rendering tests green
5. Manual browser test (outermost — load sample .sbp and verify in browser)

Each layer has its own red → green → refactor micro-cycle.
