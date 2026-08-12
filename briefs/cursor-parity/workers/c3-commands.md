# MAKE brief — c3-commands (Unit C3 slice 1/3)

> From: orch-c3-parity, 2026-08-12. Binding. Parent: `briefs/cursor-parity/unit-c3-parity-expansions.md`.
> Board: `agent-core/cursor-parity`. Make slug: `c3-commands`.
> SPAWN: already under `cursor-fleet make` — you are coder OR test-maker (isolation wall). Do NOT spawn further. Shim defaults. No model overrides.
> Do NOT use emojis anywhere.

Register store command primitives and deploy them to every harness with a native slash-command/prompts mechanism. Identity port unless evidence shows a format difference (this session: store `primitives/commands/*.md` frontmatter matches CC/cursor command shape; pi prompts are the same `.md` files).

## Pre-Verified Facts (orch verified 2026-08-12T16:47Z)

- C2 collected: `briefs/cursor-parity/.done/unit-c2.done` + retest 9/9 PASS. Live `agent-core status`: 60 ok / 0 stale / 0 missing.
- CLI HEAD (submodule): `53c9dfba67211305ae41e34ddfc97aa40c65695d`. Build: Zig 0.16.0. Binary: `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`.
- Store commands (only these two): `~/agent-core/primitives/commands/tower.md`, `~/agent-core/primitives/commands/tabs.md` — both YAML frontmatter + markdown body + ` ```! ` exec fence.
- Registry harnesses (read live `~/.agent-core/registry`):
  - pi: has `prompts ~/.pi/agent/prompts` — NO `commands` field. Dir exists, empty.
  - claude-code: has skills + hooks + delta — NO `commands` field. `~/.claude/commands/tower.md` exists (PRESENT-MANUAL, older paths).
  - cursor: has `commands ~/.cursor/commands`. Dir ABSENT on disk (created on first sync via `ensureDir`).
- `resolveDeployPath` (`cli/src/registry.zig`): `command` → `profile.commands` only; `prompt` → `profile.prompts` only. So a `command/` primitive cannot resolve on pi today without a fallback or explicit path.
- Port engine (`cli/src/port.zig`): non-directive = identity. Keep identity for commands.
- Registry claim held by `orch-c3-parity` — coder may edit `~/.agent-core/registry` under that claim; post dry-run finding before any real sync.
- Integration oracle precedent: `cli/test/integration/c2_acceptance.sh` + fixtures under `cli/test/fixtures/`.
- Standing order: no bare `agent-core sync`. Scoped `agent-core sync <id>` only after dry-run posted to board. Workers do not commit the outer repo; CLI submodule commits ARE yours (coder) per convention.

## Parallel Work Notice

- orch-c3-parity owns sequencing: c3-commands THEN c3-subagents THEN c3-hooks. Ignore other fleet noise.
- Do not touch: `primitives/AGENTS.md`, `primitives/directives/`, `~/cursor-shim/`, project `.cursor/agents/`, hooks.json, subagent registry entries.
- Concern yourself only with commands + the minimal `resolveDeployPath` fallback.

## Tower

- Board topic: `agent-core/cursor-parity`. from=`agnt-c3-commands-coder` or `agnt-c3-commands-testmaker`.
- Post claim before registry edit; dry-run preview as finding; done report as finding to orch-c3-parity.
- Status is not mail.

## Tasks — IMPLEMENTER (coder)

1. Minimal CLI: in `resolveDeployPath`, for prim_type `command`, resolve `profile.commands orelse profile.prompts` (then `{dir}/{filename}.md`). Update the grammar comment. No other schema fields.
2. Registry (`~/.agent-core/registry`, claim first on board):
   - Add `commands ~/.claude/commands` under `harness claude-code`.
   - Add primitives:
     ```
     primitive command/tower
       source ~/agent-core/primitives/commands/tower.md
       deploy pi
       deploy claude-code
       deploy cursor
     end

     primitive command/tabs
       source ~/agent-core/primitives/commands/tabs.md
       deploy pi
       deploy claude-code
       deploy cursor
     end
     ```
3. Virgin-cache build: `cd ~/agent-core/cli && rm -rf .zig-cache zig-out && zig build` → exit 0.
4. Board-post dry-run output of:
   `agent-core sync command/tower --dry-run` and `agent-core sync command/tabs --dry-run`.
5. Scoped sync (not dry-run) those two ids only.
6. Verify destinations exist as regular files (not symlinks):
   - `~/.claude/commands/{tower,tabs}.md`
   - `~/.pi/agent/prompts/{tower,tabs}.md`
   - `~/.cursor/commands/{tower,tabs}.md`
7. `agent-core status` → 0 stale / 0 missing (count will rise by the new primitives).
8. Submodule commit in `~/agent-core/cli` with PHASE/DONE/TODO handoff. Registry is NOT in git. Do not commit outer agent-core repo.
9. Touch `briefs/cursor-parity/.done/c3-commands-coder.done` and board-report to orch-c3-parity with provenance (`date -u`; `pwd -P`; `git -C cli rev-parse HEAD`).

## Tasks — TEST-MAKER

Author an integration oracle `cli/test/integration/c3_commands_acceptance.sh` (and fixtures if needed) that proves the acceptance criteria below WITHOUT reading the implementer's code. Derive tests only from this brief. Wire so `zig build test` and/or the shell script is the oracle the tester will run. Touch `briefs/cursor-parity/.done/c3-commands-testmaker.done` + board finding with the criterion ID list.

## Acceptance criteria (oracle must name these IDs)

| ID | Criterion |
|----|-----------|
| T-C3-CMD-RESOLVE-PI | `command/` prim resolves via pi `prompts` dir when `commands` field absent (fixture registry). |
| T-C3-CMD-RESOLVE-CC | `command/` prim resolves via claude-code `commands` dir. |
| T-C3-CMD-RESOLVE-CURSOR | `command/` prim resolves via cursor `commands` dir. |
| T-C3-CMD-STATUS-OK | After sync to matching bytes, status shows ok for command/tower on all three harnesses (fixture). |
| T-C3-CMD-STATUS-MISSING | Missing dest → missing/`?` for that harness. |
| T-C3-CMD-IDENTITY-PORT | port(command, any harness) bytes equal source (identity). |
| T-C3-CMD-LIVE-DEPLOYED | Live check (optional skip if AGENT_CORE_LIVE≠1): the six dest files exist as regular files after coder sync. |

## Constraints

- Touch ONLY: `cli/src/registry.zig` (and tests/fixtures under `cli/test/`), `cli/src/port.zig` only if a unit test needs exporting (prefer not), `~/.agent-core/registry`, and `.done` markers under `briefs/cursor-parity/.done/`.
- Do NOT modify `primitives/commands/*` sources.
- No bare `agent-core sync`.
- Workers do not commit outer repo.

## Done-when

- Coder: CLI committed, registry updated, both commands synced to three harnesses, status green, `.done/c3-commands-coder.done`.
- Test-maker: acceptance script landed in test-maker worktree (merged by orch/tester path per Verify beat), `.done/c3-commands-testmaker.done`.
- Tester (later, spawned by orch): green oracle.

## Report-back

Board finding to `agent-core/cursor-parity` addressed to orch-c3-parity.
