---
name: brief
description: Generate a spawn-ready agent brief from a task description. Enforces the delegation protocol (pre-verified facts, exact done conditions) plus every codified orchestration lesson - parallel-work notices, file partitions, floor baselines, no-mock testing, CI-exact verification, Tower etiquette. Use before fanning work out to subagents; pairs with the scout agent for fact verification.
argument-hint: "<task description, or 'milestone <id>' for audit-plan tasks>"
---

Produce a spawn-ready brief for: $ARGUMENTS

A brief passes one test: **"if the lead handed this task to a senior colleague,
would any detail be ambiguous? would any open question block them?"** If yes
anywhere, the brief is not done.

## Step 1 — Resolve ambiguity BEFORE drafting

Scan the task for forks: any "or", any acceptance criterion with two readings,
any decision the worker would have to make that the lead should own. Resolve
each from context, code, or by asking the user NOW. A fork delegated is a
coin flipped.

## Step 2 — Gather and verify facts

Collect every fact the worker needs: file paths with line numbers, commands
with their exact invocations, test baselines, API shapes, env quirks. Then
verify them — either yourself (run the commands, read the cited lines) or by
spawning the `scout` agent with the draft facts (read-only verifier; returns a
corrected, paste-ready facts section). Facts you did not verify do not go in
the brief.

## Step 3 — Compose, using exactly this structure

```
<one-paragraph mission statement: repo, stack, what this task is. "Do NOT use emojis anywhere.">

## Pre-Verified Facts (lead verified all of these personally)
- <file X exists at /absolute/path; cited code confirmed at :NN>
- <command Y: `exact command` run from /dir — exits 0, output: ...>
- <test baseline: at least N pass, 0 fail — count may GROW while you work>
- <env quirks: e.g. wrapper scripts, NEVER-do variants and why>

## Parallel Work Notice
<who else is in flight, which files they own, "ignore uncommitted changes to
X/Y/Z — do not investigate, revert, or fix them. Concern yourself only with
your task."> <If fleet coordination matters: "post claims/findings to the
Tower board (mcp__tower__board_post, topic '<topic>'); read it before
claiming files (mcp__tower__board_read).">

## Tower (mid-run communication)
- Deliverables/results the user must see verbatim: mcp__tower__send_to_user
  (kind=deliverable, from=<your role>). Urgent/load-bearing: kind=alert.
- Progress with specific numbers at meaningful checkpoints: kind=progress.
- A decision only the user can make: mcp__tower__ask_user, then poll
  mcp__tower__check_inbox while continuing other work.

## Tasks
1. <precise action> — done when: <exact, testable condition>
2. ...

## Constraints
- Touch ONLY: <explicit file list>. Do not commit.
- Testing: NO MOCKS, ever (real DB/data per AGENTS.md Testing Policy; cite the
  exemplar test file if one exists).
- Verification: run exactly as CI does — <the project's exact commands and dirs>.
- Match surrounding code style; comments state constraints, not narration.

## Report back with
<exactly what the completion message must contain: per-file diff summary,
test tails, deviations with reasons>
```

## Step 4 — Model tier (tokenomics — decide per brief, default DOWN)

Every spawn carries a `model` choice; choosing nothing means the most
expensive tier. Decide deliberately:

- **haiku** — mechanical, spec-complete transforms: the brief states exactly
  what to change and how to verify; no judgment beyond following instructions
  (renames, pattern sweeps with explicit rules, format conversions).
- **sonnet** — standard execution with local judgment: implement-to-spec,
  test writing against an exemplar, focused searches.
- **top tier (omit model)** — genuine judgment: design decisions, security
  reasoning, ambiguous debugging, anything where a wrong call is expensive.

If the brief is good enough for haiku and you are reaching for a bigger
model, ask whether the brief is actually underspecified — fix the brief, not
the bill. State the chosen tier at the top of the brief. Check
`bun ~/.claude/tower/cli.mjs burn` when calibrating.

## Step 5 — Partition check (multi-agent fan-outs)

If this brief is one of several running in parallel: verify the file
partitions are disjoint; tasks sharing a file share an agent. Tasks under ~10
lines of verified change: do inline, don't spawn. State the same partition map
in every brief.

## Step 6 — Codified lessons (hard requirements, learned the expensive way)

- **CI-config conditionals are unverifiable locally.** Any `if:`/ternary-
  emulation (`cond && X || Y`) in workflow YAML inside a brief must be marked
  `LIVE-VERIFY REQUIRED` with an explicit pass criterion the agent checks in
  a real run's log (2026-06-11: `cond && 0 || 1` always yields 1 — falsy
  short-circuit; the spec called it pre-verified and it wasn't).
- **Report ALL files created — including config.** The report contract must
  say "list every file you created or modified, including dotfiles/config";
  an agent once added a load-bearing bunfig.toml and never mentioned it.
- **Thresholds are set in the GATE'S environment.** Coverage/size floors
  measured with extra infrastructure attached (a DB, secrets) are invalid —
  the brief must state the exact environment the gate runs in and require the
  number be measured there (2026-06-11: floor set from DB-attached coverage
  failed in the DB-less gate).
- **Worktree agents + git-hook managers collide.** `bun install`/`prepare`
  from a worktree can corrupt the shared repo's `core.hooksPath` (fix:
  `lefthook install --reset-hooks-path` from the main checkout). Worktree
  briefs must say: do not run dependency install; run ring-0 gate commands
  manually before pushing.
- **Enforcement note:** the PreToolUse hook `enforce-brief.mjs` blocks Agent
  spawns missing Pre-Verified Facts / Tower (or TOWER-WAIVED + reason) /
  Report / done-when sections. Waiving Tower is allowed only explicitly.

Output the finished brief in a single fenced block, ready to paste into a
Task/Agent prompt. After it, list anything you could not verify and what you
recommend (scout run, user question) before spawning.
