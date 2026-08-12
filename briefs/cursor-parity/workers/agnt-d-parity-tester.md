# AGNT Unit D — Three-harness parity checklist runner

> From: orch-d-sweep (w2B:pV), 2026-08-12. You are the TESTER for Unit D. You RUN checks and report. You NEVER fix, sync, edit repo/registry/harness configs, or diagnose root cause. Breakage = finding routed UP to orch-d-sweep → cord-agent-core.
> Parent: `briefs/cursor-parity/unit-d-parity-sweep.md` · mission `briefs/cursor-parity/mission.md` §7a/§7b · §17 format `briefs/harness-parity-bridge.md`.
> Board: `agent-core/cursor-parity`. Your `.done`: `briefs/cursor-parity/.done/agnt-d-parity-tester.done`.
> Evidence file: `briefs/cursor-parity/d-parity-tester-results.md` (you create this; write-allowed).

Prove — with runnable, provenance-stamped evidence — that agent-core primitives reach claude-code, pi, and cursor with identical capability shape. Extend §17 from two harnesses to three. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-12T20:29:38Z this session)

- Provenance baseline: `pwd -P` = `/Users/jrg/agent-core`; agent-core HEAD `2efbe0827226f73099c76cd89ff1257e82b4f434`; cli submodule HEAD `4ad428587b919c1b923c32182ac9a12631fc4fb8`.
- `agent-core status` summary: **159 ok / 0 stale / 0 missing** (re-run yourself; cite fresh output).
- Entrypoints are REGULAR files (not symlinks): `~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md` — `file` shows "Unicode text, UTF-8".
- Tools on PATH: `~/.local/bin/{slim,latch,vein}` exist. **`assay` NOT on PATH** (`which assay` fails; `~/.local/bin/assay` missing) — record as finding, do not install.
- Skill dirs exist: `~/.claude/skills/slim`, `~/.pi/agent/skills/slim`, `~/.cursor/skills-cursor/slim` (directories).
- Commands present as regular files: `~/.claude/commands/{tower,tabs}.md`, `~/.pi/agent/prompts/{tower,tabs}.md`, `~/.cursor/commands/{tower,tabs}.md`.
- Subagents: 10 files each in `~/.claude/agents/`, `~/.cursor/agents/`, and `primitives/subagents/`.
- Hooks: `~/.claude/hooks/slim-guard.sh` (executable), `~/.cursor/hooks/slim-guard.sh`, pi `~/.pi/agent/extensions/slim-rewrite.ts`.
- Cursor MCP `~/.cursor/mcp.json` keys: tower, arc, bigfile.
- Old §17-G2 symlink check is VOID — use G2' (regular files + directive/core ✓×3).
- Store hooks beyond slim-guard (ts/mjs): matrix cell `N/A — pi extension mechanism, no cursor/CC native equivalent deployed (v1)`.
- Binary: `~/agent-core/cli/zig-out/bin/agent-core` (also on PATH as `agent-core`).

## Parallel Work Notice

- Unit E (docs) owns `AGENTS.md` + `PRIMER.md` edits — ignore dirt there; do not investigate or fix.
- Post findings to Tower board topic `agent-core/cursor-parity` (MCP `board_post` or append `~/.tower/board.jsonl`). Read board before claiming.
- Ignore uncommitted changes outside your evidence/results files — this repo hosts parallel missions. Attribute porcelain dirt; only flag UNATTRIBUTABLE.

## Tower

- Findings: `board_post` type=finding, topic=`agent-core/cursor-parity`, from=`agnt-d-parity-tester`.
- Progress with specific counts at checkpoints (not heartbeats).
- Questions UP to `orch-d-sweep` via board — never to the operator.
- On herdr: `spine-report task "…"` at start; `spine-report verdict "…"` when done.

## Tasks

Prepend EVERY evidence capture with:
```bash
date -u +%Y-%m-%dT%H:%M:%SZ; pwd -P; git -C ~/agent-core rev-parse HEAD; git -C ~/agent-core/cli rev-parse HEAD
```
Write all pass/fail + command tails into `briefs/cursor-parity/d-parity-tester-results.md`.

1. **17-A tools** — done when: slim/latch/vein `--help` exit 0 recorded; assay located or `[UNKNOWN — needs input: assay install location]` per §17-A5; slim virgin-cache `cd ~/agent-core/primitives/tools/slim && rm -rf .zig-cache zig-out && zig build test` exit 0 with **zero SKIP lines**; each tool README quickstart attempted (cite path + result); bigfile §17-D where runnable (MCP or `bun` path) or `[UNKNOWN — <tried>]`.

2. **17-B skills ×3** — done when: `agent-core status --harness {pi,claude-code,cursor}` each shows 0 stale 0 missing; spot-check **3** skill dirs per harness (suggest: slim, latch, herdr) are **regular files not symlinks** (`test ! -L …/SKILL.md` and parent not a symlink); `diff -q` each against `primitives/skills/<name>/SKILL.md` — report any non-identical.

3. **17-C hooks ×3** — done when: CC slim-guard present + PreToolUse wired in `~/.claude/settings.json` (cite JSON path/snippet); Cursor `~/.cursor/hooks/slim-guard.sh` present + `~/.cursor/hooks.json` has managed entry with `agent_core` marker AND hand-maintained sessionStart still present (cite both); pi slim-rewrite.ts present under extensions — note jiti/`/reload` load mechanism; matrix cell ADAPTED.

4. **Commands ×3** — done when: all six paths exist as regular files; `diff -q` against `primitives/commands/{tower,tabs}.md` for each deploy; report mismatches.

5. **Subagents ×2** — done when: 10 files in `~/.claude/agents/` and `~/.cursor/agents/` byte-compare OK vs `primitives/subagents/`; pi = `N/A — herdr/profiles`; project `.cursor/agents/` (5 role stubs under `/Users/jrg/agent-core/.cursor/agents/` if present) verified UNTOUCHED vs `git -C ~/agent-core HEAD` (diff clean or list only expected stubs).

6. **Directives ×3** — done when: three entrypoints are regular files; each byte-matches hand-composed ref:
   ```bash
   BANNER='<!-- agent-core: composed from primitives/AGENTS.md + primitives/directives/<H>.md — edit sources, not this file -->'
   # compose: cat primitives/AGENTS.md; echo; echo "$BANNER"; cat primitives/directives/<H>.md
   ```
   (Use the exact banner line present in each live entrypoint if it differs — cite the live banner.) Each contains `harness-homogeneous` (grep).

7. **MCP** — done when: cursor mcp.json lists tower/arc/bigfile (cite); CC MCP config found by reading `~/.claude.json` and/or `~/.claude/settings.json` — cite file path + server names or `N/A — <reason>`; pi MCP mechanism recorded or `N/A — <reason>`. Do not invent.

8. **17-G global** — done when: G1 status green ×3; G2' entrypoints regular + `agent-core status` shows directive/core ✓ for all three; G3 `git -C ~/agent-core status --porcelain` listed with attribution (mission unit or UNATTRIBUTABLE).

9. **Final matrix** — done when: §17-F rows PLUS commands, subagents, directives, hooks-json merge, MCP — THREE harness columns + evidence post ids; every cell filled or `N/A — <reason>`; posted as board finding.

## Constraints

- Touch ONLY: `briefs/cursor-parity/d-parity-tester-results.md`, board posts, `/tmp` scratch, your `.done` marker.
- No `agent-core sync`. No edits to registry, harness configs, or production trees.
- Epistemics: every claim cites command + this-session output; else `[UNKNOWN — <what was tried>]`.

## Report back with

1. Board finding(s) to `agent-core/cursor-parity` from `agnt-d-parity-tester` addressed to orch-d-sweep: per-section pass/fail counts, failures list (no diagnosis), path to results file, final matrix (or pointer to results §matrix).
2. Write `briefs/cursor-parity/.done/agnt-d-parity-tester.done` LAST (after board posts).
3. Completion message must include: provenance block, summary table (section → pass/fail/N), failure IDs, results path.
