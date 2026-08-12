# Unit D — Three-harness parity verification sweep (ORCH brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md` (read it first, including §7a/§7b). This is the mission's Unit D (§5) — the final verification sweep.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-d.done`.
> VERIFICATION unit — you run checks and report. You NEVER fix what you find; breakage is a finding routed UP to cord-agent-core, who briefs a repair unit. Spawn one AGNT (tester/researcher profile) via `~/cursor-shim/cursor-fleet worker` for the runnable checklist; shim defaults, no overrides, never spine-spawn.

## Mission

Prove — with runnable, provenance-stamped evidence — that the agent-core primitive ontology reaches all THREE harnesses (claude-code, pi, cursor) with identical capability shape. Extend `briefs/harness-parity-bridge.md` §17 (adopted by reference per mission §2.1) from two harnesses to three. Deliverable: final capability × harness matrix on the board, every cell filled or `N/A — <reason>`.

## Pre-verified facts (verified by CORD this session, 2026-08-12)

- `agent-core status` = **159 ok / 0 stale / 0 missing** across pi + claude-code + cursor (binary `cli/zig-out/bin/agent-core`, submodule HEAD `e244263`).
- Registry now covers: skills ×3 harnesses (incl. skill/herdr), directive/core ×3 (composed entrypoints), command/tower + command/tabs ×3, agents/* ×10 → claude-code + cursor user homes, hook/slim-guard → cc + cursor (cursor via hooks.json managed entry `agent_core: "hook/slim-guard"`).
- Cursor surface: `~/.cursor/skills-cursor/` (CLI-managed copies), `~/.cursor/commands/` (created by C3), `~/.cursor/agents/` (created by C3), `~/.cursor/hooks.json` (merge-managed), `~/.cursor/mcp.json` (tower, arc, bigfile).
- Entrypoints `~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md` are composed REGULAR files (core + banner + delta). The old §17-G2 symlink check is VOID — replaced by G2' below.
- Store hooks beyond slim-guard (ts/mjs) are pi-extension/manual only — v1 scope decision from C3, on the board. Matrix cell: `N/A — pi extension mechanism, no cursor/CC native equivalent deployed (v1)`.
- pi prompts: `~/.pi/agent/prompts/{tower,tabs}.md` deployed by C3.

## Tasks

1. **Provenance block on every evidence capture** (§17 format): `date -u +%Y-%m-%dT%H:%M:%SZ; pwd -P; git -C ~/agent-core rev-parse HEAD; git -C ~/agent-core/cli rev-parse HEAD`.
2. **17-A tools** (harness-agnostic CLIs): slim/latch/vein/assay `--help` exit 0; slim virgin-cache `zig build test` exit 0 with zero SKIP lines; each tool's README quickstart succeeds. bigfile per §17-D where runnable.
3. **17-B skills per harness ×3**: `agent-core status --harness <h>` 0 stale 0 missing; spot-check 3 deployed skill dirs per harness contain real files (not symlinks) with content matching store (`diff` against `primitives/skills/<name>/SKILL.md` — cursor/pi/cc copies must be byte-identical; report any that aren't).
4. **17-C hooks ×3**: CC — `~/.claude/hooks/slim-guard.sh` present + wired in `~/.claude/settings.json`. Cursor — `~/.cursor/hooks/slim-guard.sh` present + managed entry in `~/.cursor/hooks.json` with `agent_core` marker; hand-maintained sessionStart entry still present. pi — slim via TS extension (`~/.pi/agent/extensions/`); note load mechanism, mark matrix cell ADAPTED.
5. **Commands ×3**: `~/.claude/commands/{tower,tabs}.md`, `~/.pi/agent/prompts/{tower,tabs}.md`, `~/.cursor/commands/{tower,tabs}.md` all exist as regular files; byte-compare against `primitives/commands/` sources.
6. **Subagents ×2** (pi = N/A herdr/profiles): 10 files in `~/.claude/agents/` + `~/.cursor/agents/`, byte-compare against `primitives/subagents/`; project `.cursor/agents/` (5 role stubs) verified UNTOUCHED (diff against git HEAD — C3 reconciliation said DISJOINT).
7. **Directives ×3**: entrypoints are regular files; each byte-matches a hand-composed reference (`cat primitives/AGENTS.md` + banner line + `primitives/directives/<h>.md`); each contains the amended agnostic spawn law (grep `harness-homogeneous`).
8. **MCP**: cursor `~/.cursor/mcp.json` lists tower/arc/bigfile; CC equivalent config — find it (read `~/.claude.json` or `~/.claude/settings.json`, cite the file) and record the cell; pi MCP mechanism — record or `N/A — <reason>`. Do not invent; cite file paths.
9. **17-G global checks (updated)**: G1 status green ×3. **G2'** (replaces symlink check): all three entrypoints are regular files, `agent-core status` shows directive/core ✓×3. G3: `git -C ~/agent-core status --porcelain` — list what's dirty and attribute each to a mission (this repo hosts parallel missions; only flag UNATTRIBUTABLE dirt).
10. **Final matrix** (§17-F format, THREE harness columns + evidence post ids): every capability row from §17-F plus rows for commands, subagents, directives, hooks-json merge, MCP. Every cell filled or `N/A — <reason>`. Post to board as a finding with provenance.

## File partition

- READ-ONLY everywhere except: board posts + `/tmp` scratch + your `.done` marker. You may NOT edit repo files, registry, or harness configs. Findings of breakage route UP.
- Parallel unit: E (docs) owns `AGENTS.md` + `PRIMER.md` edits. Zero overlap with you.

## Doctrine constraints (bind you)

- Epistemics: every claim cites a command + output captured this session; `[UNKNOWN — <what was tried>]` where unresolvable.
- Comms law: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board; never to the operator.
- No `agent-core sync` of any kind — this unit verifies, it does not repair.

## Done-when

1. Every checklist section (2-9) executed with pass/fail per item and provenance-stamped evidence posted to the board.
2. Final 3-harness capability matrix posted as a finding; every cell filled or `N/A — <reason>`.
3. Any failures listed as explicit findings routed to cord-agent-core (do not fix).
4. Final report to cord-agent-core on the board; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-d.done`.

## Report-back

Board post to `agent-core/cursor-parity`, from `orch-d-sweep`, addressed to cord-agent-core. Then the `.done` marker. You will be reaped on collection.
