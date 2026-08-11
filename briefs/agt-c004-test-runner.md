# Brief: AGT c004-test-runner — run the c004 gate, twice, and rule on it
Date: 2026-08-10
Cycle: c004 · Role: TEST-RUNNER

## What This Is
You run the gate for cycle c004 and you report exactly what happened. You are
deliberately a different agent from everyone who wrote the code and everyone
who wrote the tests, because in this project "reported done" has twice turned
out not to be evidence.

Read that plainly, because it is your entire reason for existing (DECISIONS.md,
2026-08-10, LAND c003): a test-author once reported DONE on a fix it had never
applied — the fixture was byte-for-byte unchanged — and only an independent
runner caught it, two gate runs later. **A second red gate is a better outcome
than a green one talked into existence.** You are not here to make the gate
pass. You are here to find out whether it passes.

Your boundaries:
- You RUN. You do NOT edit. Not implementation code, not test code, not
  configuration. If something is broken, you report it; you do not fix it.
- You do not triage root causes beyond what the output tells you. A fresh agent
  does failure triage if needed.

## Working location
- Worktree: `~/.herdr/worktrees/future/c004-ux` (branch `c004-ux`). Run here.
- **ALL cargo commands need this toolchain — the shim misresolves and will
  waste your run:**
  `PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH cargo ...`
- Write your results file into the MAIN checkout:
  `/Users/jrg/future/.madewell/work/test-results/2026-08-10-c004-gate-run1.md`
  (and `-run2.md`). `.madewell/` does not exist in the worktree by design.

## The gate — all four, in this order
1. `cargo fmt --check` → must be exit 0
2. `cargo clippy --all-targets -- -D warnings` → must be exit 0
   (**`--all-targets` matters**: a whole gate run was lost last cycle to
   `cargo build` + narrow clippy being green while `--all-targets` was red)
3. `cargo test --no-run` → must be exit 0
4. `cargo test --no-fail-fast` (the FULL suite) → must be green

   **`--no-fail-fast` is mandatory and was learned the hard way.** Plain
   `cargo test` aborts after the first failing target, so a single lib failure
   silently prevents `tests/e2e.rs` from running at all — the first c004 gate
   run reported only lib results and hid a real, reproducible e2e regression
   until a supplementary pass caught it. A gate that can hide an entire test
   binary is not a gate.

Then **run the full suite a SECOND time, back to back**, and compare. The gate
is green only if it is green TWICE CONSECUTIVELY. Determinism is part of the
gate, not a bonus.

## RUN ON A QUIET MACHINE — this is not optional, and I measured why
Before you start, confirm no other agents are mid-build:
`herdr api snapshot` and check that the c004 worker panes (`w1C:p5`–`w1C:p9`)
are idle/done, not `working`.

I measured the baseline myself at `main` (2e53f89) **while four agents were
running concurrent cargo builds**, and got 449 passed / **1 failed** / 1
ignored — `cargo test` exited 101. The failure was
`workspace_and_tab_bars_create_and_rename_logical_contexts`
(`tests/e2e.rs:130`: *PTY output never contained "c new · r rename"*). I then
re-ran that single test in isolation on the same checkout: **1 passed, 6.95s.**

So that failure was pure machine load, and the mechanism is a known one — d015
is exactly this: an un-timed synchronous `write_all` on a saturated PTY master
wedges the runtime worker. **The e2e suite produces FALSE REDS under CPU
contention.** If you run the gate while other agents build, you will report a
red that isn't real, and this project has already burned whole gate runs on
misattributed intermittents. Wait for quiet. If you cannot get quiet, say so in
your report and treat every e2e failure as suspect until re-run in isolation.

## Baseline and the two known exceptions
- Baseline at `main` (2e53f89): **450 passed, 1 ignored** — which I confirmed
  independently rather than inheriting: 390 in the lib suite + 60 in `e2e`
  = 450 passed, with 1 ignored in `e2e`. This cycle added tests, so expect
  **≥450 passed plus the new ones, and still exactly 1 ignored.** A count
  BELOW 450 means something was lost — report it loudly.
- `isolated_keyboard_chaos_journey` is the 1 ignored test, `#[ignore]`d against
  d015. **It stays ignored.** Do not run it with `--ignored`, do not report it
  as a failure, do not suggest re-enabling it. Its inline comment carries the
  d015 reference, the fixed seed, and both measured pass rates on purpose.
- Known flaky pair: `project::tests::*_killed_at_the_timeout`. **If either
  fails, RERUN IT specifically before you rule on it**, and report both
  outcomes. It has passed in both runs of every recent gate; a single failure
  is not automatically a real defect, and neither is it automatically noise —
  say which you observed.

## Separate the reproducible from the intermittent
This is the most valuable thing you produce. If anything fails:
- Report each failure with its test name and the actual output — the assertion
  message, the panic, the diff. Not a summary of it. The output IS the evidence.
- State explicitly which failures appeared in BOTH runs (reproducible) and
  which in only one (intermittent). Last cycle's runner did exactly this and it
  turned "20 failures" into "3 reproducible + 1 intermittent", which is what
  made the cycle diagnosable.
- For an intermittent, say how many times you saw it out of how many runs. If
  you can cheaply run a suspect test a few more times to get a rate, do — that
  is running, which is your job, and a measured rate is worth far more than
  "flaky".

## Do not talk yourself into green
- Do not assume the fixes worked. Do not assume prior agents' reports are true.
  Verify by the OUTPUT, which is the only artifact you produce.
- Do not report a count you did not see printed. Quote cargo's own summary
  lines verbatim.
- If the gate is red, say RED in the first line of your report. A clear red is
  a successful run of your role.

## Deliverables
1. Two results files, each containing: the commit SHA under test, the exact
   commands with their exit codes, cargo's verbatim summary lines
   (`test result: ...`), and the full output of any failure.

   **Name them with your OWN agent name and the commit, not a bare `run1`/`run2`.**
   Use the shape
   `2026-08-10-c004-gate-<your-agent-name>-<short-sha>-run1.md` (and `-run2.md`).
   Learned the hard way this cycle: a first runner wrote
   `…-c004-gate-run1.md`/`-run2.md`, and a later post-fix runner wrote the same
   two filenames and **overwrote the red gate's evidence**. The forensics had to
   be reconstructed from board posts. Never reuse another attempt's filename —
   a gate's evidence is the artifact the whole role exists to produce.
2. A board post (below).

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-test-runner`:
1. FIRST: a CLAIM — `CLAIM gate run c004 — pane <your pane id> — runs only,
   edits nothing`.
2. At the end, lead with **GREEN** or **RED**, then:
   - the commit SHA under test (`git log --oneline -1`);
   - a table: command → exit code → result, for all four gate steps, for BOTH
     runs;
   - passed / failed / ignored counts for each run, quoted from cargo;
   - reproducible vs intermittent failures, separated, with real output;
   - the known-flaky pair's outcome in both runs, plus any rerun you did;
   - confirmation that exactly 1 test is ignored and it is
     `isolated_keyboard_chaos_journey`;
   - explicit confirmation that you edited NOTHING;
   - the paths of the two results files you wrote.
Then stop. Do not fix anything, and do not recommend landing or not landing —
that ruling belongs to the orchestrator, the coordinator, and the operator.
