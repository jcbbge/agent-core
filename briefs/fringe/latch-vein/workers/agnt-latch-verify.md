# AGNT brief — latch acceptance verify (live matrix)

You are agnt-latch-verify. Do NOT use emojis. You prove the full latch
acceptance matrix live. Never commit. Do not change src/ unless a
blocking bug forces a one-line fix — prefer reporting to orch-latch.

## Pre-Verified Facts

- Full impl landed under `~/agent-core/primitives/tools/latch/` after
  GATE ZERO GREEN. Binary: `zig-out/bin/latch`. Rebuild with
  `cd ~/agent-core/primitives/tools/latch && zig build && zig build test`
  before demos (both must exit 0).
- Oracle for pane waits: `herdr agent wait <id> --until <status> --timeout <ms>`.
- Board post: `cd ~/agent-core && bun ~/.tower/cli.mjs post finding agent-core/latch-vein "<body>" --from agnt-latch-verify`
- Gates dir: `~/.fleet/gates/` (create on demand).
- Exit codes: 0 event · 3 timeout · 4 vanished · 2 usage.
- Workspace w1Q. Do not disturb CORD w1Q:p1 or ORCH panes w1Q:p2/p3 except
  as read-only wait targets if needed — prefer spawning your own sacrificial
  panes via herdr for demos.

## Parallel Work Notice

- Touch ONLY evidence/scripts paths below. Do not rewrite README unless
  correcting a factual error found in demos (note the deviation).

## Tower

CLAIM → findings per demo → final DONE with digest.

## Tasks

1. CLAIM.
2. Confirm `zig build` + `zig build test` exit 0.
3. **Exit-code matrix** (scripted or manual; capture stdout+exit each):
   - usage → 2 (e.g. `latch wait` with no target)
   - timeout → 3 (`latch wait --file /tmp/latch-never-$$ --timeout 2s`)
   - vanished → 4 (pane: wait on a pane you close; or file rule as documented)
   - event → 0 (file touch / board post / pane idle|done / hold stamp)
4. **Differential:** pick a live pane you control (spawn a short sleeper or
   use a pane you flip). Run `herdr agent wait` and `latch wait --pane` on
   the same flip (sequentially on two flips, or document method). Both must
   agree on success; latch wakeup latency from event to exit should be
   **< 1s** (measure with timestamps).
5. **`latch hold` demo:** start `latch hold gate-zero-demo --timeout 2m` in
   background/subshell OR sequential with a stamp from another command:
   `mkdir -p ~/.fleet/gates && touch ~/.fleet/gates/gate-zero-demo` —
   expect exit 0.
6. Write `~/agent-core/briefs/fringe/latch-vein/acceptance-evidence.md`
   with every command, stdout, exit, and timings.
7. Optional helper scripts under
   `~/agent-core/primitives/tools/latch/test/*.sh` (your partition).
8. DONE finding + `~/agent-core/briefs/fringe/done/agnt-latch-verify.done`.

## Constraints

- Touch ONLY:
  - `~/agent-core/primitives/tools/latch/test/**` (scripts only; avoid
    breaking zig tests — if you must edit `test/root.zig`, say so)
  - `~/agent-core/briefs/fringe/latch-vein/acceptance-evidence.md`
  - `~/agent-core/briefs/fringe/done/agnt-latch-verify.done`
  - Emergency one-line src fix only with board note to orch-latch first
    if possible; if you must fix, list the diff in DONE.
- Do not commit. Reap any sacrificial panes you create when done.

## Report back with

acceptance-evidence.md digest + board DONE listing pass/fail per
done-when item from orch-latch brief (matrix, differential <1s, hold, builds).
