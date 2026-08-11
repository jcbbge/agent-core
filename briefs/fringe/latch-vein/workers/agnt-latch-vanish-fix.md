# AGNT brief — latch vanish exit-code fix

You are agnt-latch-vanish-fix. Do NOT use emojis. Never commit.

## Pre-Verified Facts (orch-latch verified THIS session)

- Live herdr close events look like:
  `{"data":{"pane_id":"w1Q:pR","type":"pane_closed","workspace_id":"w1Q"},"event":"pane_closed"}`
  Note: **`pane_closed` with underscore**, not `pane.closed`.
- Current matcher in
  `~/agent-core/primitives/tools/latch/src/wait.zig` `isPaneClosed`
  searches for `"event":"pane.closed"` → never matches → close-during-wait
  falls through to timeout (exit 3). Orch reproduced: latch exit 3 on close
  during `--until working` wait.
- Truth law: exit **4** = target vanished. Must not collapse into 3.
- Subscribe already includes `{"type":"pane.closed"}` (API subscription
  type still uses the dotted name — do not change that unless live proof
  requires it). Only the **incoming event** name is underscored.
- Build: `cd ~/agent-core/primitives/tools/latch && zig build && zig build test`
- Tower: `cd ~/agent-core && bun ~/.tower/cli.mjs post finding agent-core/latch-vein "<body>" --from agnt-latch-vanish-fix`

## Parallel Work Notice

Touch ONLY wait.zig (+ unit test in test/root.zig if needed). No other modules.

## Tasks

1. CLAIM.
2. Fix `isPaneClosed` (and any related parsers) to recognize live
   `"event":"pane_closed"` (keep accepting dotted form if present).
3. Unit test for the helper with a fixture string shaped like the live event.
4. Live prove: split pane → `latch wait --pane <id> --until working --timeout 8s`
   in background → `herdr pane close <id>` → latch exits **4** with vanished
   message. Capture stdout+exit in DONE.
5. `zig build` + `zig build test` exit 0.
6. DONE finding + `~/agent-core/briefs/fringe/done/agnt-latch-vanish-fix.done`.

## Constraints

- Touch ONLY:
  - `~/agent-core/primitives/tools/latch/src/wait.zig`
  - `~/agent-core/primitives/tools/latch/test/root.zig` (optional)
  - `~/agent-core/briefs/fringe/done/agnt-latch-vanish-fix.done`
- Do not commit.

## Report back with

Diff summary, live vanish proof (exit 4), build/test exits.
