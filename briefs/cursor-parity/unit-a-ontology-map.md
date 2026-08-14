# Unit A — Ontology map + parity matrix (ORCH brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md` (read it first).
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-a.done`.
> READ-ONLY unit. The ONLY filesystem write allowed is the deliverable `research/harness-ontology-map.md`. Never commit — CORD gates and commits.

## Mission

Produce the canonical map of the agent-core primitive ontology × harness adapter surface across THREE harnesses: claude-code, pi, cursor. Deliverable: new doc `/Users/jrg/agent-core/research/harness-ontology-map.md` + the parity matrix posted to the board.

## Tasks

1. Enumerate every primitive TYPE in the store under `/Users/jrg/agent-core/primitives/`: skills, rules, hooks, commands/prompts, subagents, directives, profiles, plugins, tools. Read `~/.agent-core/registry` IN FULL for the registered deploy surface.
2. Build the matrix: primitive type × harness. Per cell classify exactly one of:
   - PRESENT-REGISTERED (deployed via agent-core CLI)
   - PRESENT-MANUAL (symlink / hand-edit / hand-maintained)
   - ADAPTED (format translation at the harness edge — precedent: `primitives/hooks/slim-guard.sh` → `primitives/hooks/slim-guard-cursor.sh`)
   - MISSING
   - N/A — <reason>
3. Resolve these UNKNOWNs with this-session evidence (read the harness's own config/docs; never invent schemas):
   - **Cursor command home**: `~/.cursor/commands/` DOES NOT EXIST (verified at intake), yet a `/tower` command executed in a cursor session today. Find where cursor actually loads commands from: check project-level `.cursor/commands/`, `~/.cursor/cli-config.json`, cursor's own docs, and any `commands` key in cursor config. Record the answer with the file path or doc URL as evidence.
   - **Cursor rules surface**: what cursor actually loads — `~/AGENTS.md` (symlink to `primitives/AGENTS.md`), `.cursor/rules/` (project-level), anything user-level? Enumerate what exists on disk today.
   - **Cursor subagents surface**: does cursor have a subagent/agent-definition mechanism, and if so where?
   - **Cursor hooks**: `~/.cursor/hooks.json` event names + payload shapes vs claude-code's `~/.claude/settings.json` hook events — name the differences that an adapter must translate (sessionStart vs SessionStart, preToolUse matcher semantics, etc.).
4. cursor-shim (`~/cursor-shim/`) is in scope for the MAP only. DO NOT modify it.

## Pre-verified facts (verified by CORD this session, 2026-08-12 ~15:35 UTC)

- `agent-core status` (installed binary `cli/zig-out/bin/agent-core`): 37 ok / 0 stale / 0 missing. Harnesses registered: pi, claude-code ONLY.
- Registry `~/.agent-core/registry` comment at "Tool skills (2026-08-12 wave)" section states verbatim: "cursor is not an agent-core harness, no deploy lines for it here."
- Cursor surface: `~/.cursor/hooks.json` = sessionStart → `~/.cursor/herdr-agent-state.sh`; preToolUse (matcher `Shell`) → `~/agent-core/primitives/hooks/slim-guard-cursor.sh`. `~/.cursor/mcp.json` = tower, arc, bigfile. `~/.cursor/skills-cursor/` = 24 entries; 7 are symlinks into `primitives/skills/` (herdr, super-search, navigating-big-files, slim, latch, vein, assay). `~/AGENTS.md` → symlink to canonical `primitives/AGENTS.md`.
- claude-code surface: `~/.claude/skills/`, `~/.claude/hooks/`, `~/.claude/commands/tower.md` exists, wiring in `~/.claude/settings.json`.
- pi surface: `~/.pi/agent/{skills,prompts,extensions}`; prompts dir empty.
- Repo HEAD at intake: `0634b9d459356f6a1b09c58aacfa8a6213885978`.

## File partition

- You write: `research/harness-ontology-map.md` ONLY.
- You never touch: `cli/`, `~/.agent-core/registry`, `primitives/`, any harness config dir, `~/cursor-shim/`.
- Parallel unit in flight: Unit B owns `cli/` exclusively. No overlap.

## Doctrine constraints (bind you)

- Epistemics: no asserted fact without a this-session source; mark `[UNKNOWN]` where unresolvable; never invent config schemas.
- Evidence: load-bearing captures carry a provenance block (`date -u`; `pwd -P`; `git rev-parse HEAD`).
- Comms law `~/.tower/COMMS-ARCH.md`: findings to board topic `agent-core/cursor-parity`; questions route UP to cord-agent-core via the board, never to the operator; status is not mail.
- Anything MISSING that has NO harness-native mechanism at all → flag explicitly in the doc and on the board (CORD escalates; you do not resolve).

## Done-when

1. `research/harness-ontology-map.md` exists, covers every primitive type × 3 harnesses, every cell classified, both UNKNOWN sections resolved or marked `[UNKNOWN]` with what was tried.
2. Parity matrix posted to board `agent-core/cursor-parity` as a finding, with provenance block.
3. Final report posted to the board addressed to cord-agent-core: what landed, open questions, escalation candidates.
4. Last action: `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-a.done`.

## Report-back

Board post to `agent-core/cursor-parity`, from `orch-cursor-ontology`, addressed to cord-agent-core. Then the `.done` marker. You will be reaped on collection — durable state goes on disk and the board, never in scrollback.
