# ORCH brief — Unit 2: shim-workspace-targeting

Mission: `cursor-fleet make` / `cursor-fleet worker` / `cursor-spine <profile>` currently
split the CALLER's tab (default base pane = `$HERDR_PANE_ID`). Spawning from a control
plane pollutes it (operator incident 2026-08-12: a make run from the Engine Shop split
the concierge tab). Add explicit `--workspace <id>` targeting so spawns land in the
mission workspace regardless of caller pane, and add a loud warning when a control-plane
pane is about to host a same-tab worker split. Repo: `~/cursor-shim` (git, bash 3.2
compat, `set -euo pipefail`). Do NOT use emojis anywhere.

Board topic: `cursor-shim/spawn-finishing`. You are ORCH; I am CORD (w2Q:p1). Workers
never commit; I gate and land. Run the Verify beat: decompose via
`cursor-fleet make <slug> --brief <impl-brief>` from your own tab (your ORCH tab is the
sanctioned worker host — the guard below must NOT fire for you).

## Pre-Verified Facts (CORD verified each personally this session, main @ 095ffab)

- `~/cursor-shim/cursor-fleet` `make` verb: lines 234-272. `BASE_PANE="${HERDR_PANE_ID:-}"`
  at :237 — this default is the bug. Coder spawn :260-263, test-maker :265-268, both via
  `"$SPINE" ... --pane`. Output JSON at :270-271.
- `~/cursor-shim/cursor-fleet` `worker` verb: lines 212-215 — bare `exec "$SPINE" "$@"`.
  Worker targeting therefore lives entirely in cursor-spine.
- Prior art for `--workspace`: `orch` at cursor-fleet :151-158 and `fanout` at :336-352 —
  both parse `--workspace` (default `${HERDR_WORKSPACE_ID:-}`) and call
  `hj tab create --workspace "$WS_ID" --label "<label>" --cwd "$DIR" --no-focus`, then read
  the root pane via `pane_id_from_json` (helper at cursor-fleet :53-64).
- `~/cursor-shim/cursor-spine`: arg parse loop :303-322 (no `--workspace` today).
  `--tab` path :538-544 (uses `$HERDR_WORKSPACE_ID`); split path :546-550
  (`--pane "$SPLIT_PANE"`, default `$HERDR_PANE_ID` :303). `--into` :313 (caller-owned pane).
- `herdr tab create --workspace <id> --label <t> --cwd <dir> --no-focus` — syntax verified
  against `herdr tab create --help` this session.
- Caller role token read: `herdr pane get "$HERDR_PANE_ID"` returns JSON;
  `.result.pane.tokens.role` carries e.g. `0-CONCIERGE` (verified live on w29:p2 this
  session). Panes spawned by cursor-spine are stamped `--token "role=$ROLE_TOKEN"`
  (cursor-spine :574-584): `0-CONCIERGE|1-CORD|2-ORCH|3-AGNT|4-SAGT`.
- bash 3.2 + `set -u` trap: expanding an empty array `"${arr[@]}"` is a fatal unbound
  error — use the `${arr[@]+"${arr[@]}"}` pattern (commit 095ffab; existing example at
  cursor-fleet :260).
- qa-verify suite: `~/cursor-shim/docs/qa-verify.sh` (170 lines). `ck()` at :12,
  dry-run helper `H()` at :13 (fakes `HERDR_ENV=1 HERDR_PANE_ID=w1J:p1`). NO pipefail
  (header comment :5-7 — SIGPIPE would misreport). Gate `C8: PASS count >= 99` at :166.
  Baseline this session: **100 passed, 0 failed** (ran twice). Static greps + dry-runs
  only — NEVER spawn a real pane from a test (cf. 78fa55c/6c85350).
- `cursor-spine --dry-run` prints resolution lines (`mode`, `worktree`, `cmd`, …) and
  exits before any herdr mutation (:495-529) — safe for tests.
- cursor-agent `--worktree <name>` creates worktree `~/.cursor/worktrees/<repo-basename>/<name>`
  on branch `<name>` (verified against herdr-spine's `git worktree list`).

## CORD rulings (binding — do not re-litigate)

1. **AC3 guard scope:** the control-plane warning fires ONLY for caller role tokens
   `0-CONCIERGE` and `1-CORD`. `2-ORCH` is EXEMPT — its tab is the designated worker
   host (control-flow topology: "Each ORCH gets its OWN TAB; its AGNT/SAGT workers are
   panes in that tab"). The unit brief's inclusion of 2-ORCH was over-broad; ruled.
2. **Warn, never refuse.** A refusal can strand legitimate recovery spawns. The warning
   is loud (stderr, prefixed `cursor-spine: WARN:`) and names the fix
   (`--workspace <id>`). Explicit `--pane` / `--workspace` / `--into` / `--tab` = intent,
   no warning.
3. **`make --workspace` shape:** create ONE tab in the target workspace
   (label `make-<slug>`), use its root pane as BASE_PANE for both spawns (coder splits
   root, test-maker splits coder's pane — existing :261/:266 mechanics unchanged).
4. **`cursor-spine --workspace <id>`:** when set (and no `--into`), spawn into a NEW TAB
   in that workspace (same code path as `--tab` but with the explicit workspace id
   instead of `$HERDR_WORKSPACE_ID`). `--workspace` + `--pane` together = die (ambiguous).

## Acceptance criteria

- AC1: `cursor-fleet make <slug> --brief <p> --workspace <id>` opens coder + test-maker
  panes in workspace `<id>`, never the caller's tab.
- AC2: `cursor-spine <profile> ... --workspace <id>` (and therefore
  `cursor-fleet worker <profile> --workspace <id>`) lands the pane in workspace `<id>`.
- AC3: caller pane carrying role `0-CONCIERGE` or `1-CORD`, with NO explicit targeting
  flag, gets the loud stderr warning before any same-tab split; explicit flags or
  `2-ORCH`/`3-AGNT`/unset role = silence.
- AC4: `bash docs/qa-verify.sh` green with new dry-run/static cases for AC1-AC3
  (e.g. `--workspace` parses + reaches tab-create args in make/spine source; dry-run
  shows target workspace; guard greps). No live spawns in tests.

## Tasks

1. Plan phase: derive the implementation brief (acceptance criteria above are the spec),
   then `cursor-fleet make unit2-workspace-targeting --brief <impl-brief>` from your tab.
2. Partition (disjoint, state it in both worker briefs):
   - coder → `cursor-fleet`, `cursor-spine` ONLY.
   - test-maker → `docs/qa-verify.sh` ONLY (new `### shim-workspace-targeting` section;
     keep C8 gate satisfied; suite must stay 0-fail).
3. Collect both workers (board DONE + their reports), do NOT merge yourself — report to me.

## Constraints

- Workers touch ONLY their partitioned files. No commits by anyone but CORD.
- No mocks; tests are static/dry-run only, exactly as the existing suite does it.
- Match existing code style (hj helper, die/log, pane_id_from_json). Comments state
  constraints, not narration.
- bash 3.2 compatible; `set -euo pipefail` safe (empty-array pattern above).
- Update the usage lines in both scripts' headers and `rules/cursor-fleet.md` spawn
  examples IF they show make/worker invocation (coder: check rules/cursor-fleet.md
  lines ~89-99; doc edits there are in the coder partition).

## Report back with

Per-file diff summary (cursor-fleet, cursor-spine, docs/qa-verify.sh,
rules/cursor-fleet.md), the new qa-verify case list, both workers' board DONE ids,
any deviations + reasons. Post findings to `cursor-shim/spawn-finishing`.
