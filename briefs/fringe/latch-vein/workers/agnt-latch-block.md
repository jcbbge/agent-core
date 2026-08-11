# AGNT brief — latch GATE ZERO blocker (sacrificial)

You are agnt-latch-block. Do NOT use emojis. You run the GATE ZERO risk
test: a long-blocking `latch wait --pane` inside a real pi harness pane.

## Pre-Verified Facts (orch-latch verified this session)

- Binary: `/Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch`
  (`zig build` + `zig build test` exit 0 this session).
- Target sleeper pane: **`w1Q:p9`** (agnt-latch-sleeper). It will run
  `sleep 600` then flip to idle/done. Do NOT prompt or disturb that pane.
- Socket: `~/.config/herdr/herdr.sock`.
- Exit codes: 0 matched · 3 timeout · 4 vanished · 2 usage.
- Tower: `cd ~/agent-core && bun ~/.tower/cli.mjs post finding agent-core/latch-vein "<body>" --from agnt-latch-block`
- Grounding: fresh Read between consecutive Edits to one file.

## Parallel Work Notice

- Sleeper owns only its `.done` marker. You own the evidence files below.
- Do not edit `primitives/tools/latch/src/**` (proto is frozen for this trial).

## Tower

CLAIM at start. Final GATE ZERO verdict finding is mandatory. Questions to
orch-latch via board note only.

## Tasks

1. CLAIM: starting GATE ZERO block on w1Q:p9.
2. Record `date -u +%Y-%m-%dT%H:%M:%SZ` as T0 in your notes.
3. Run exactly (from any cwd; use absolute binary path):
   ```
   /Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --pane w1Q:p9 --timeout 15m
   ```
   Shell tool must allow ≥ 960000 ms block. Do not wrap in timeout(1) that
   is shorter. Do not poll herdr yourself — latch is the wait.
4. When latch returns, record immediately:
   - wall UTC timestamp T1
   - latch stdout (verbatim)
   - latch exit code
   - elapsed seconds (T1−T0)
   - Whether the pi/Cursor harness showed any stuck warning, killed the
     tool call, asked you to continue, or otherwise interrupted the block.
     Be literal: quote any such UI/text, or write `none observed`.
5. Write evidence file:
   `~/agent-core/briefs/fringe/latch-vein/gate-zero-evidence.md`
   with those fields plus a one-line VERDICT:
   - `GREEN` if latch exited 0, elapsed ≈ 600s (±90s), wakeup appears
     immediate on sleeper completion, and harness did not kill/nag-abort
     the blocking call.
   - `RED` otherwise, with the failing criterion named.
6. Board finding: `GATE ZERO <GREEN|RED>: <one line evidence summary>`.
7. Marker: `~/agent-core/briefs/fringe/done/agnt-latch-block.done`
   (same digest as the evidence file).

## Constraints

- Touch ONLY:
  - `~/agent-core/briefs/fringe/latch-vein/gate-zero-evidence.md`
  - `~/agent-core/briefs/fringe/done/agnt-latch-block.done`
- Do not commit. Do not re-prompt the sleeper. Do not implement more latch verbs.

## Report back with

Evidence file + board GATE ZERO finding + `.done`. Idle after.
