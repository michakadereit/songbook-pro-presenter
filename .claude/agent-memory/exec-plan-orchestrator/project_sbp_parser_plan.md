---
name: project-sbp-parser-plan
description: Active exec-plan sbp-parser — 3 sequential tickets, 9 ACs, feat/sbp-parser branch. Sonnet throughout; Opus only if chordsheetjs enharmonics misbehave.
metadata:
  type: project
---

Active exec-plan: `docs/exec-plans/active/sbp-parser/`
Branch: `feat/sbp-parser` (already exists; parser.test.ts lives here)
Tests: `src/parser.test.ts` — 9 ACs in 2 describe blocks, driven by sample file `samples/CW _ Lobpreis (21.6.2026).sbp`

**Why:** Spec-driven: spec.md → red tests committed → exec-plan → implement green. Plan created 2026-06-25.

**How to apply:** When working on this plan, always confirm branch is `feat/sbp-parser`. Validate test count per phase before proceeding to next ticket.

## Ticket sequence (fully sequential, 0% parallelization):

TICKET-001 (Sonnet) — ZIP + JSON loading
- ACs: AC1, AC2, AC3, AC4, AC9 (5 tests)
- Key quirk: dataFile.txt starts with a version line ("1.0\n") — strip before JSON.parse
- Delivers: parseSbp skeleton with songs resolved and sections: []

TICKET-002 (Sonnet) — ChordPro line parser
- ACs: AC5, AC6, AC8 (3 tests)
- Depends on: TICKET-001 (Song structure must exist)
- Key quirk: AC6 checks chord positions 10 and 21 in the *cleaned* lyrics string (after removing [Chord] markers)
- {c:} headers → sections; other {…} directives → ignored; (x2) → plain lyrics, no chords

TICKET-003 (Sonnet, Opus if needed) — Transposition
- ACs: AC7 (1 test — all 9 green)
- Depends on: TICKET-002 (parsed Chord objects must exist)
- Uses: chordsheetjs@15.5.1 — Chord.parse(symbol)?.transpose(keyShift).toString()
- Watch: [C]+9 → A; [D/F#]+9 → B/D# — if chordsheetjs returns enharmonic equiv (Cb/Eb), escalate to Opus

## Post-plan DoD:
- npx tsc --noEmit clean
- Manual browser test: "CW | Lobpreis (5 Songs)" visible
- Merge feat/sbp-parser → main, delete branch locally + remote
