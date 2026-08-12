# Unit E — Doc trail: repo guide + primer reflect the 3-harness world (make brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md`. Implementation goes through the enforced Verify beat (`cursor-fleet make`): bifurcated coder/test-maker worktrees, tester, arbiter, nQ≤3.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-e.done`.
> Doc-only unit. NEVER commit — CORD gates the outer-repo commit.

## Mission

The repo's own docs still describe the pre-mission world (two harnesses, symlinked entrypoints). Bring them current. This is the deferred doc trail from C2 (design proposal point 5) plus the kick's "E (docs)".

## Pre-verified facts (verified by CORD this session, 2026-08-12)

- `/Users/jrg/agent-core/AGENTS.md` (repo guide) currently says: "Two harnesses are registered: **pi** and **claude-code**"; "Pi's `~/.pi/agent/AGENTS.md` is a symlink to `primitives/AGENTS.md`; inline rule injection through that symlink is banned"; the deploy-targets table has only pi + claude-code columns; "Last updated: 2026-08-11".
- Live reality (all verified this mission): THREE harnesses registered (pi, claude-code, cursor). Entrypoints are COMPOSED deployed files (core `primitives/AGENTS.md` + banner + `primitives/directives/<harness>.md` via `agent-core sync directive/core`) — no symlinks. Cursor deploy surface: skills `~/.cursor/skills-cursor/` (directory format), commands `~/.cursor/commands/`, agents `~/.cursor/agents/`, hooks `~/.cursor/hooks/` + merge-managed `~/.cursor/hooks.json`. Registry grammar gained: `delta <path>` profile field, `hooks_json <path>` profile field, `agents <dir>` as a directory, claude-code `commands <dir>`. Port engine (`cli/src/port.zig`) transforms at deploy time; status/sync checksum TRANSFORMED bytes; symlinked dests are stale (de-symlink mandate, operator ruling 1).
- `PRIMER.md` exists at repo root — read it; update any 2-harness/symlink claims the same way. If it's already consistent, say so with evidence.
- Canonical doctrine `primitives/AGENTS.md` is NOT in scope (C2 + the spawn-law amendment already landed it).

## Tasks (coder)

1. Update `/Users/jrg/agent-core/AGENTS.md`: three registered harnesses; deploy-targets table gains a cursor column (skills/commands/agents/hooks rows per the facts above); replace the symlink sentence with the composition model (core+delta → entrypoint, edit sources not deployed files); registry grammar additions (`delta`, `hooks_json`, `agents` dir, cc `commands`); bump "Last updated" to 2026-08-12. Keep the doc's scope discipline — repo/CLI guide only, doctrine stays in primitives/AGENTS.md.
2. Update `PRIMER.md` the same way where it describes harnesses/deploys; evidence either way.
3. Do NOT touch anything else. No cli/ changes, no registry changes.

## Acceptance criteria (test-maker — derive the oracle from THESE, not from the code)

- T-E-3HARNESS: repo AGENTS.md states three registered harnesses (pi, claude-code, cursor); grep finds no "Two harnesses are registered" claim.
- T-E-NOSYMLINK: repo AGENTS.md contains no claim that any entrypoint is a symlink; it describes core+delta composition and names `directive/core`.
- T-E-CURSOR-SURFACE: deploy-targets table (or equivalent) lists cursor skills dir `~/.cursor/skills-cursor`, commands `~/.cursor/commands`, agents `~/.cursor/agents`, hooks `~/.cursor/hooks` + `hooks.json`.
- T-E-GRAMMAR: registry section documents `delta` and `hooks_json` profile fields.
- T-E-PRIMER: PRIMER.md has no stale 2-harness or symlink-entrypoint claims (or a finding posted that it was already consistent).
- T-E-SCOPE: `git -C /Users/jrg/agent-core diff --name-only` in the coder worktree shows ONLY `AGENTS.md` and (if needed) `PRIMER.md`.

## File partition

- You edit: `/Users/jrg/agent-core/AGENTS.md`, `/Users/jrg/agent-core/PRIMER.md` ONLY.
- Parallel unit: D (parity sweep) is read-only + board posts. Zero overlap.

## Doctrine constraints (bind you)

- Epistemics: every config path you write must come from the pre-verified facts above or a file you read this session.
- Comms law: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board.

## Done-when

1. Oracle green (tester run, arbiter on any Q, nQ≤3).
2. Final report to cord-agent-core on the board with the diff summary; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-e.done`.
