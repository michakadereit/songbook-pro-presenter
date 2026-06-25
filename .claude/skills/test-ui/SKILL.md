---
name: test-ui
description: Verify that an exec-plan ticket's UI Acceptance Criteria actually pass by driving the running app with the Playwright MCP server. Use after implementing a ticket from docs/exec-plans/active/. Invoke as `/test-ui <plan-slug>/<ticket-id>` — e.g. `/test-ui sbp-presenter/TICKET-004`. Reads the ticket's Acceptance Criteria, runs each in the browser via Playwright MCP, and reports a per-criterion pass/fail with screenshots on failure.
---

# test-ui

You are running the `test-ui` skill. Your job: take an exec-plan ticket, extract its Acceptance Criteria, and **prove** each one passes against the running app by driving a real browser through the Playwright MCP server.

## Inputs

The user invokes `/test-ui <argument>`. The argument is one of:

- `<plan-slug>/<ticket-id>` — e.g. `sbp-presenter/TICKET-004`
- `<ticket-id>` alone — search `docs/exec-plans/active/` for it
- A full path to a ticket markdown file

If the argument is missing or ambiguous, **stop and ask**. Don't guess which ticket the user meant.

## Preconditions you MUST verify before testing

1. The Playwright MCP server is reachable. The tools you need are prefixed `mcp__playwright__` — list them via ToolSearch with the query `playwright` if you don't see them. If none exist, stop and tell the user the MCP server isn't connected.
2. The app is running. This is a static frontend — open `index.html` directly in the browser or via a local dev server. Quick check:
   ```bash
   # If using a dev server:
   curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
   # Expect 200. If connection refused, start the dev server first.
   ```

Never silently launch services — surface the precondition failure and ask the user to start them.

## Workflow

### 1. Read the ticket

Use `Read` on the resolved ticket file. Locate the `## Acceptance criteria` section. Each bullet is one criterion. Number them mentally as A1, A2, A3, …

### 2. Prepare a test .sbp file

For tests that need song data, use the sample file at `samples/` or ask the user to load one. This app has no backend — state lives in the loaded file.

### 3. Drive the browser via Playwright MCP

For each acceptance criterion, write a short plan ("navigate, interact, assert") and execute it with the Playwright MCP tools. Useful tool patterns:

- `mcp__playwright__browser_navigate` — open the page
- `mcp__playwright__browser_snapshot` — get the accessibility tree to find elements
- `mcp__playwright__browser_click`, `_type`, `_select_option` — interact
- `mcp__playwright__browser_take_screenshot` — capture on failure
- `mcp__playwright__browser_console_messages` — verify no console errors

Exact tool names may differ — list with ToolSearch query `playwright` if a name doesn't resolve.

Always use the accessibility snapshot to locate elements. Wait for the element to appear before interacting.

### 4. Per-criterion verdict

For each criterion produce one of:

- ✅ **PASS** — observed evidence ("chord '[G]' visible above lyric 'Amazing' in slide view")
- ❌ **FAIL** — observed evidence + screenshot path
- ⚠️ **SKIPPED** — only if a precondition couldn't be met; include why

Use evidence the user could verify themselves. "It worked" is not evidence.

### 5. Report

End with a short summary in this exact format:

```
## /test-ui sbp-presenter/TICKET-004

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| A1 | Slide view shows one song per screen | ✅ PASS | snapshot shows full-screen song tile |
| A2 | Arrow key advances to next song      | ❌ FAIL | screenshot: .claude/.cache/test-ui/A2.png — key event had no effect |
| A3 | Eagle view shows all songs in grid   | ✅ PASS | 5 tiles visible matching set file |

**Result: 2/3 PASS** — TICKET-004 not ready to mark DONE. See A2.
```

## What you must NOT do

- **Do not** mark a ticket `DONE` in its plan README. The user reviews your verdict and decides.
- **Do not** fix code from within this skill. If a criterion fails, report it.
- **Do not** invent acceptance criteria.
- **Do not** ignore console errors when a criterion requires no errors.
- **Do not** use Bash to curl the app — that's not testing the UI.

## Edge cases

- **File input can't be tested via keyboard**: Use `mcp__playwright__browser_set_input_files` to simulate a file drop/selection with the sample .sbp.
- **Element not found**: Take a snapshot, include the accessibility tree excerpt in the failure evidence.
- **Flaky timing**: Retry one criterion at most once. If still failing, mark ❌ and note "intermittent".
