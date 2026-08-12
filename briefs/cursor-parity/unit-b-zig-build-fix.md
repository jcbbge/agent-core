# Unit B — CLI Zig 0.16 build fix (ORCH brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md` (read it first).
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-b.done`.
> You orchestrate; spawn one AGNT (coder profile) for the edit. The cli is a GIT SUBMODULE — commits land in `/Users/jrg/agent-core/cli` (its own repo), never the outer repo.

## Mission

`zig build` in `/Users/jrg/agent-core/cli` is broken on Zig 0.16.0. Fix it, reconcile the in-flight build-file changes, verify behavior matches the currently installed binary, commit in the submodule. This blocks Unit C (cursor harness registration in the CLI).

## Pre-verified facts (verified by CORD this session, 2026-08-12 ~15:35 UTC)

- Reproduced: `cd ~/agent-core/cli && zig build` →
  `src/main.zig:34:23: error: root source file struct 'heap' has no member named 'GeneralPurposeAllocator'`
  (`var gpa = std.heap.GeneralPurposeAllocator(.{}){};` — GPA removed in Zig 0.16.0). `zig version` = 0.16.0.
- The cli submodule has UNCOMMITTED changes in flight: `M build.zig`, `M build.zig.zon`, plus untracked `build.zig.bak` and `build.zig.zon.bak`. INSPECT these first (`git -C ~/agent-core/cli diff`) — they may be a partial 0.16 migration. Reconcile; do not blindly overwrite.
- The installed binary `cli/zig-out/bin/agent-core` WORKS (built before the break): `agent-core status` = 37 ok / 0 stale / 0 missing. Building will overwrite `zig-out/bin/agent-core`, so CAPTURE ITS OUTPUT FIRST:
  `cli/zig-out/bin/agent-core status > /tmp/agent-core-status-pre.txt` (and `... --harness pi`, `... --harness claude-code` likewise) before any build.
- Sibling Zig 0.16 projects with working allocators to copy the idiom from: `/Users/jrg/agent-core/primitives/tools/slim/src/`, `.../latch/src/`, `.../vein/src/`, `.../assay/src/` (read their `main.zig` / `build.zig`).
- Repo doctrine (AGENTS.md): allocations in `status.zig`/`sync.zig`/`inline.zig` intentionally use the registry arena, not the GPA — the GPA param is deliberately unused. Preserve that design; the fix is the allocator idiom at `main.zig:34`, not a refactor of the arena pattern.

## Tasks

1. Capture pre-build reference output (above).
2. Read `git -C /Users/jrg/agent-core/cli diff` and the `.bak` files; post a finding to the board describing what the in-flight changes are and your reconciliation decision.
3. Fix `src/main.zig:34` using the Zig 0.16 allocator idiom (check the sibling tools first — match house style). Fix any further 0.16 breakage that surfaces, minimally — this is a build-fix unit, not a modernization sweep. If the breakage cascades beyond ~5 sites, stop and report to cord-agent-core with the full error list.
4. Virgin-cache verification (load-bearing): `cd /Users/jrg/agent-core/cli && rm -rf .zig-cache zig-out && zig build` → exit 0. Then `zig-out/bin/agent-core status` and both `--harness` variants → diff against `/tmp/agent-core-status-pre.txt`; must match (37 ok / 0 stale / 0 missing).
5. Commit in the SUBMODULE ONLY, per the commit convention: `fix(cli): zig 0.16 allocator idiom` with PHASE/DONE/TODO trailer lines, `SOURCES:` line if any external values, stage explicitly (never `git add -A`). Include the reconciled build.zig/build.zig.zon; decide the fate of the `.bak` files (delete or leave untracked — say which in the report). Do NOT commit `.zig-cache/`. Do NOT touch the outer repo.

## File partition

- You own: `/Users/jrg/agent-core/cli/` (the submodule) exclusively.
- You never touch: outer-repo files, `~/.agent-core/registry`, `primitives/`, harness config dirs.
- Parallel unit in flight: Unit A (read-only, writes only `research/harness-ontology-map.md`). No overlap.

## Doctrine constraints (bind you)

- Evidence: provenance block (`date -u`; `pwd -P`; `git rev-parse HEAD` in the submodule) on the build+status verification capture; post it to the board.
- Comms law: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board; never to the operator; status is not mail.
- No `agent-core sync` of any kind (standing order — registry is being stabilized).

## Done-when

1. Virgin-cache `zig build` exit 0 on Zig 0.16.0.
2. `zig-out/bin/agent-core status` (+ both `--harness` filters) matches the pre-break reference output.
3. Submodule commit exists with the conventional message; `git -C cli status` clean except untracked cache/bak artifacts you explicitly declined to commit.
4. Evidence (provenance + build result + status diff result) posted to board `agent-core/cursor-parity`.
5. Final report to cord-agent-core on the board; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-b.done`.

## Report-back

Board post to `agent-core/cursor-parity`, from `orch-zig16-build`, addressed to cord-agent-core. Then the `.done` marker. You will be reaped on collection.
