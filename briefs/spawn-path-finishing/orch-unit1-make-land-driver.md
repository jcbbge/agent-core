# ORCH brief — Unit 1: make-land-driver (the finisher)

Mission: `cursor-fleet make` spawns coder + test-maker into bifurcated worktrees and
STOPS — nobody runs tester reproduction, arbiter triage, merge-to-main, worktree
cleanup, pane reap, or the operator deliverable. Three missions on 2026-08-12 finished
in worktrees and never landed until the concierge merged by hand. Build the finisher:
make units must land end-to-end with zero human intervention. Land = main moves, not
`.done` files. Repo: `~/cursor-shim` (git, bash 3.2 compat, `set -euo pipefail`).
Do NOT use emojis anywhere.

Board topic: `cursor-shim/spawn-finishing`. You are ORCH; I am CORD (w2Q:p1). Workers
never commit; I gate and land THIS unit manually (the finisher can't finish itself —
the self-hosting trap, acknowledged in the mission). Run the Verify beat:
`cursor-fleet make <slug> --brief <impl-brief>` from your tab.

## Architecture (CORD-ruled, binding — the unit brief's "arbiter pane" was a proposal, not gospel)

The finish loop is MECHANICAL except one judgment step (triage). So:

1. **The finisher is a shell driver, not an agent** — deterministic, dry-run testable,
   burns zero tokens while waiting. New script `~/cursor-shim/cursor-finish`
   (or a `finish` mode — your Plan call; a separate rip-out-able script matches shim
   doctrine). `cursor-fleet make` spawns it automatically as a THIRD pane in the unit's
   tab via the `run_forever_in_pane` script-file pattern (cursor-fleet :87-93) — visible
   in the sidebar, no agent needed. `--no-finish` flag on make opts out.
2. **Judgment is delegated to the existing `arbiter` profile** (-p, verdict-then-gone,
   cursor-spine :344-345) — spawned by the finisher ONLY on red, nQ ceiling 3, then
   escalate `to:"operator"`.
3. **Latch on PANES, not board** — `latch wait --pane <id> --until done`
   (`~/.local/bin/latch`, verified `--help` this session: exit 0 matched / 3 timeout /
   4 vanished). Board latching depends on worker posting discipline; pane status is
   mechanical. Board is for human-visible findings.

## The finish loop (finisher owns all of it, in order)

1. Read unit state (below). `latch wait --pane` coder + test-maker until done.
2. Create integration worktree `wt-finish-<slug>` off main; merge BOTH unit branches
   (commit each worktree's changes on its own branch first — integration commits are
   the finisher's, handoff format). Merge conflict = partition violation → alert +
   stop (human), do NOT improvise resolution.
3. Spawn `tester` (cursor-spine, interactive profile) in the unit tab, `--dir` =
   integration worktree; its brief contract: run the suite, write verdict JSON to
   `$SHIM_DIR/.make/<slug>.tester.json` `{verdict: pass|fail, failures: [...]}`.
   Latch on its pane; read the verdict file (testimony is not evidence — the file is).
4. Red → spawn `arbiter` headless with tester output → ruling routes: bad test →
   re-prompt test-maker pane (KEEP=1, still alive — `herdr agent prompt <pane> ... --wait
   --until working`, verified-submit rule per herdr skill); bad impl → re-prompt coder
   pane; pre-existing/out-of-scope → escalate `to:"operator"`. Loop to 3. nQ > 3 →
   escalate. Every ruling appended to `$SHIM_DIR/.make/<slug>.jsonl`.
5. Green → merge integration branch to MAIN in the real checkout, run
   `bash docs/qa-verify.sh` on main (the gate, in the gate's environment), require
   0 failures.
6. Cleanup: `git worktree remove` all three worktrees + delete branches; reap coder /
   test-maker / tester panes (`cursor-spine reap <pane>`); post board DONE to the
   unit topic + `to:"operator"` deliverable (full summary, once); THEN self-reap
   (finisher is a leaf mechanic — durable state is on disk/board before it dies).

## Pre-Verified Facts (CORD verified each personally this session)

- Current main: b8a17a4 (units 2+3 landed). `--workspace` now exists on make/spine
  (822cd83). Rebase worktrees on current main at Make time.
- make verb: cursor-fleet `make)` block. Spawns coder then test-maker, prints JSON
  with `impl_pane`/`test_pane` — NO worktree names today. `--no-finish` does not
  exist yet (you add it). `--workspace` DOES exist (unit2).
- Worktree model (verified against herdr-spine `git worktree list`): cursor-agent
  `--worktree <name>` → worktree at `~/.cursor/worktrees/<repo-basename>/<name>` on
  branch `<name>`. Name derivation: `worktree_name_for` (cursor-spine :72-75) —
  `wt-<label-lowercase>-<pane-lowercase-colon-to-dash>`, e.g. pane w2Q:p7 coder →
  `wt-agnt-coder-w2q-p7`. Derivable from pane ids already in make's JSON.
- Unit state file (NEW, you build it): make writes `$SHIM_DIR/.make/<slug>.json` —
  {slug, dir, brief, impl_pane, test_pane, impl_wt, test_wt, ts} — finisher reads it.
  Add `.make/` to .gitignore (check `.monitor.json` precedent, qa-verify :30-31).
- **make's pane-id extraction is BROKEN (observed live this mission by ORCH unit2,
  root-caused by me):** cursor-spine's interactive path lets herdr's `agent start`
  JSON blob ride stdout alongside spine's own summary JSON line (:624-625), so
  `"$SPINE" ...` captures TWO documents and `pane_id_from_json` parses neither —
  `IMPL_PANE`/`TEST_PANE` come back empty (make silently falls back to BASE_PANE at
  :266). The state-file work MUST fix this: capture herdr's stdout separately in
  spine (or have make parse only the LAST json line), so recorded pane ids are real.
- coder/test-maker panes are interactive KEEP=1 (cursor-spine :345) — alive until
  reaped, re-promptable for fix rounds. tester same. arbiter is async self-reap.
- `latch` exit codes: 0 matched, 2 usage, 3 timeout, 4 target vanished. Finisher treats
  4 (pane vanished) as a distinct failure — check board/job dirs before concluding.
- qa-verify: `docs/qa-verify.sh`, `ck()` :12, `H()` dry-run helper :13, no pipefail
  (:5-7), C8 gate `PASS >= 99` :166. Baseline 100/100 this session. DRY-RUN/STATIC
  ONLY — never spawn real panes from tests (78fa55c/6c85350). cursor-spine has
  `--dry-run` (:495-529); give cursor-finish a `--dry-run` that prints its resolved
  plan (state file, panes, worktrees, merge order) and exits.
- bash 3.2 + `set -u`: empty arrays need `${arr[@]+"${arr[@]}"}` (095ffab).
- herdr `pane run` mangles inline `bash -c` — long-lived pane commands go through a
  script FILE (cursor-fleet :83-93 comment, run_forever_in_pane).
- Prompt delivery is not delivery until the status flip is observed
  (`herdr agent prompt <id> "..." --wait --until working --timeout 30000`).

## Acceptance criteria

- AC1: `cursor-fleet make <slug> --brief <p>` spawns coder + test-maker + finisher
  pane; make's JSON gains a `finisher` field; unit state file written.
- AC2: finisher drives the full loop above; green path ends with main moved, suite
  green ON MAIN, worktrees removed, panes reaped, operator deliverable posted.
- AC3: red path routes through arbiter with nQ ≤ 3, rulings recorded, then escalate.
- AC4: `--no-finish` preserves today's spawn-and-stop behavior.
- AC5: qa-verify green + new dry-run/static cases (make spawns finisher, state file
  shape, cursor-finish --dry-run output, --no-finish path, nQ ceiling constant).
- AC6 (evidence, mine to collect at land): dry-run/mechanical proof + ONE live
  supervised make run landing end-to-end.

## Tasks

1. Plan phase → implementation brief → `cursor-fleet make unit1-make-land-driver
   --brief <impl-brief>` from your tab.
2. Partition (disjoint, state in both worker briefs):
   - coder → `cursor-fleet` (make verb), NEW `cursor-finish` script, `.gitignore`.
   - test-maker → `docs/qa-verify.sh` ONLY.
   - NOTE: units 2+3 land BEFORE this one — rebase your worktrees on current main at
     Make time; expect `--workspace` flags to exist on make/spine by then.
3. Collect workers; do NOT merge — report to me.

## Constraints

- Workers touch ONLY partitioned files. No commits by anyone but CORD (finisher's
  integration commits are the designed exception, inside the finisher, at land time).
- No mocks; dry-run/static tests only.
- Match existing style (hj/die/log/pane_id_from_json). Comments state constraints.
- bash 3.2; `set -euo pipefail` safe. Update header usage lines + rules/cursor-fleet.md
  where make is documented (coder partition).

## Report back with

Per-file diff summary, new qa-verify cases, worker DONE ids, deviations + reasons.
Post findings to `cursor-shim/spawn-finishing`.
