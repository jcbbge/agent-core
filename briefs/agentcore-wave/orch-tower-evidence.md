# ORCH [Tower: gather the evidence for a retirement ruling]

slug: `tower-evidence` · branch: `wave/tower-evidence`

Read `CONTRACT.md` in this directory first.

## Mission

Tower is documented as **retired** and is simultaneously **load-bearing**: eleven
live hook bindings, a registered MCP server, a CLI on PATH, and a registry row set
that all pass. Retired-but-load-bearing is the worst state a component can sit in
— nobody maintains it and everything depends on it.

**Your task is to gather evidence, not to decide, and not to remove anything.**
The deliverable is a written finding sharp enough that the operator can rule in
one read. You are explicitly forbidden from unwiring, deleting, or migrating any
Tower surface in this brief.

## Pre-Verified Facts (verified 2026-08-20)

**Documented as retired:**
- The `tower` skill deployed to claude-code is a stub whose own description reads:
  "DEAD — retired bus command stub; filename kept for provenance only."
- The global directive lists the retired message bus under "do not call", and
  instructs that durable comms go through muster.
- The brief skill carries a `TOWER-WAIVED` clause: "retired bus absorbed by
  muster-deposit."

**Simultaneously live:**
- `command -v tower` → `~/.local/bin/tower`.
- `~/.claude.json` global MCP servers include `tower`.
- `~/.claude/settings.json` binds these `~/.tower/hooks/*.mjs`:
  `flight-recorder.mjs` (SessionEnd + PreCompact), `stop-guard.mjs`,
  `write-gate.mjs`, `stop-verdict.mjs`, `ask-bridge.mjs` (Stop sweep, PostToolUse
  post, SessionEnd clear), `odometer.mjs`, `deposit-reminder.mjs`,
  `prompt-inject.mjs` (UserPromptSubmit), and `session-start.mjs` (SessionStart —
  **bound earlier today**, restoring boundary legs 1-3).
- Registry rows, all ✓: `hook/tower-session-start`, `hook/tower-stop-guard`,
  `hook/tower-stop-verdict`, `hook/tower-prompt-inject`,
  `hook/tower-enforce-brief`, `hook/tower-ask-bridge`, `hook/tower-odometer`,
  `hook/tower-odometer-stop`, `hook/tower-deposit-reminder`,
  `hook/tower-flight-recorder`, `hook/tower-write-gate-link`, plus
  `command/tower`.
- `~/.tower/hooks/session-start.mjs` is a symlink to
  `~/agent-core/primitives/mcps/tower/hooks/session-start.mjs`. Run directly it
  emits real content: last handoff from git log, a flight-snapshot pointer, and a
  `[boot]` line.
- `~/.tower/flight/` holds real snapshots, e.g.
  `2026-08-20-sessionEnd-be9adffc.md`.
- `primitives/mcps/tower/` contains the implementation, plus untracked
  `courier.mjs` and `courier.test.mjs`.
- `primitives/HARNESS-PARITY.md` lists the "Tower hook farm (11 hooks)" and a
  separate "Tower read (carry-over at wake)" row as current mechanisms.

**Muster, the nominal successor:** `~/muster/bin/muster-deposit` and
`muster-spawn` are live; the spawn door is enforced by a hook that refuses the
raw low-level herdr spawn command and redirects callers to muster-spawn.

Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## Tasks

Read-heavy. Answer each question with file citations and command output.

1. Worktree per CONTRACT.md, sparse-scoped to `primitives` — you will write one
   findings document and touch nothing else.
2. **Surface inventory.** Enumerate every live Tower surface: hooks and their
   bound events per harness, the MCP tools it exposes, the CLI's verbs, its data
   directories, and its registry rows. One table.
3. **Function inventory.** For each of the eleven hooks, state what it actually
   does — read the source, do not infer from the filename. Then classify each:
   - **(A) superseded by muster** — muster already does this;
   - **(B) unique to Tower** — nothing else on the machine provides it;
   - **(C) dead** — bound but does nothing useful now.
   Be specific about `flight-recorder`, `write-gate`, `stop-verdict`,
   `ask-bridge`, and `session-start`; those five look most likely to be (B).
4. **Dependency direction.** Does anything in muster call Tower, or vice versa?
   Does the `write-gate` bound at `~/.tower/hooks/write-gate.mjs` share a
   canonical source with `primitives/hooks/write-gate*`? Are they the same
   enforcement or two? This one matters most — a gate that exists twice may be
   enforcing inconsistently.
5. **What breaks if Tower is removed.** For each (B) surface, name what capability
   is lost and what would have to be built in muster to replace it. Estimate size
   in files touched, not in time.
6. **The untracked courier.** `primitives/mcps/tower/courier.mjs` and its test are
   uncommitted. Determine what they are and whether they represent in-flight
   migration work. Do not commit them — they are not yours.
7. Write `~/agent-core/briefs/agentcore-wave/FINDING-tower.md`:
   - a one-paragraph verdict up top, written so the operator can rule from it
     alone;
   - the three tables (surface, function+classification, breakage);
   - **two or three named options** with a recommendation, in the house style:
     recommendation first, tradeoffs stated, default named. Realistic options are
     likely (i) finish the muster cutover and retire Tower for real, (ii) drop the
     retirement and maintain Tower as the boundary/enforcement layer, (iii) split
     — keep the (B) surfaces under a non-Tower name, retire the rest.
   - an explicit list of what you did NOT verify.
8. Commit the finding. Deposit a `report` (not `done`) to `concierge` with the
   verdict paragraph inline, then write your `.done` marker and deposit `done`.

## Constraints

- **Change no bindings. Remove no rows. Unwire nothing.** Evidence only.
- If you find something actively broken, report it — do not fix it.
- Do not name a provider or model anywhere in the finding.

## Done-when

- `FINDING-tower.md` exists with verdict, three tables, options + recommendation,
  and the not-verified list.
- Every one of the eleven hooks is classified A/B/C with a source citation.
- The write-gate duplication question is answered yes or no with file evidence.
- `agent-core status` still reports 0 stale, 0 missing and no Tower row changed.
- Committed on `wave/tower-evidence`.

## Report-back

Deposit `report` to `concierge` with the verdict paragraph and the recommended
option, then `done`. Write `orch-tower-evidence.md.done`.
