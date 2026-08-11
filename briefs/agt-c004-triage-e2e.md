# Brief: AGT c004-triage-e2e — is the e2e sidebar failure a cycle-introduced regression?
Date: 2026-08-10
Cycle: c004 · Role: FAILURE TRIAGE (fresh eyes)

## What This Is
The c004 gate is RED. One of its failures is an END-TO-END test, and it is the
one most likely to be a REAL PRODUCT REGRESSION this cycle introduced — as
opposed to a test-expectation problem. You root-cause it.

You are a FRESH agent: you wrote none of this code and none of these tests.

**You diagnose. You do NOT fix.** No edits to implementation or test code.
Your deliverable is a verdict plus the precise minimal fix, for a separate
agent to apply. You MAY run tests freely — running is how you diagnose.

## Working location
- Worktree: `~/.herdr/worktrees/future/c004-ux`, branch `c004-ux`, HEAD
  `009ff77`. The tree is CLEAN — keep it that way.
- ALL cargo commands need this toolchain (the shim misresolves):
  `PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH cargo ...`
- Run just this test: `cargo test --test e2e <name>`.
- `tests/e2e.rs` is 7,369 lines / 253KB — **navigate with grep or the bigfile
  tooling; do not read it whole.**

## The failure
`public_workspace_sidebar_docks_navigates_and_collapses_responsively`
panics at `tests/e2e.rs:130:29`:
> PTY output never contained "c new · r rename"

## What the gate runner already established — do not redo this
- It reproduces **4/4 in isolation on an otherwise-idle machine** (11.02s,
  10.79s, 10.82s, 10.83s). **This is NOT load flakiness.** That distinction is
  already settled; start from it.
- It is the SAME assertion site (`e2e.rs:130`) and the SAME needle
  (`"c new · r rename"`) as a *different* test,
  `workspace_and_tab_bars_create_and_rename_logical_contexts`, which I measured
  earlier failing under heavy CPU load and passing in isolation (1 passed,
  6.95s). **That other test PASSED in every gate run.** So the shared
  assertion helper at `e2e.rs:130` is used by at least two tests, one of which
  now fails deterministically and one of which does not. That asymmetry is a
  clue, not noise — the difference between those two tests is likely the whole
  answer.
- Compile-level gates are all green at `009ff77`: `fmt` 0,
  `clippy --all-targets -D warnings` 0, `cargo test --no-run` 0.

## MY LEADING HYPOTHESIS — test it, and refute it if it is wrong
I think **item i003 introduced this**, in commit `06effd5`. i003 added an
unmissable-focus treatment to the side panel, and one part of it **carves a
1-row status header out of the top of the sidebar's content area** (rendered by
a new `render_focus_status`, `src/client/sidebar.rs`, and skipped only when
`content.height <= 1`). It also layers a DIM attribute over every card cell
when the main panel has focus, via a new `dim_area`.

The failing test asserts on the literal string `"c new · r rename"` appearing
in PTY output. If that hint text is rendered in the sidebar region, then
stealing one row for a status header could push it out of the visible area,
truncate it, or change where it lands — making the needle unfindable. A
responsive/collapse test that exercises narrow or short docked layouts is
exactly where a one-row budget change would bite first, which would also
explain why the sibling test at the same assertion site still passes.

**Verify this properly by bisecting.** Do not reason it out from the diff alone:

    git worktree add /tmp/c004-bisect <sha>
    # build and run the single test there, per sha
    git worktree remove /tmp/c004-bisect

The relevant commits, oldest to newest:
- `2e53f89` — main, pre-cycle baseline
- `94ea0c7` — build unblock + i001/i004 integration
- `04027e6` — i002 (never swallow a non-ring key)
- `06effd5` — **i003 focus indication** (my suspect)
- `29f7831` — i005 scrollback UI
- `009ff77` — test authoring (tests only, 0 deletions)

Find the FIRST commit where this test fails. That is the answer, and it is
worth more than any amount of diff-reading. Note `009ff77` added only test
code with zero deletions, so it is very unlikely to be the culprit — but check
it if the bisect points there, because that would be a genuine surprise worth
knowing about.

## The judgment I actually need from you
If this IS an i003 regression, the interesting question is which side is wrong:
- **The product is wrong** — the status row should not consume a content row
  when space is tight, or should be rendered differently (e.g. into existing
  chrome rather than carved from content). Then the fix is in `sidebar.rs`.
- **The test is wrong** — the hint text legitimately moved as a deliberate,
  operator-mandated UI change, and an e2e test that pins the old layout is now
  asserting yesterday's design. Then the fix is in `tests/e2e.rs`.

**This is a real call and I want your recommendation with reasoning, not a
coin flip.** Weigh it against the mandate that produced i003: the operator's
verbatim demand was a better user experience and unmissable focus indication —
so a status row that names the mode is wanted. But silently losing a
discoverability hint (`c new · r rename` teaches the operator their own
keybindings) is also a UX loss, and trading one UX win for one UX loss without
noticing is exactly what a gate is for. If you think it needs a human, say so
and say why.

## Standing rules from this project, paid for in blood
- Verify by the ARTIFACT — the bisect result, the code you read, the output you
  saw. Never by another agent's report, including mine.
- Do not conclude "the test is stale" because it is the cheap fix at gate time.
  Make the code prove which side is right.
- `isolated_keyboard_chaos_journey` stays `#[ignore]`d (d015). Not your problem.

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-triage-e2e`:
1. FIRST: a CLAIM — `CLAIM triage of the e2e sidebar failure — pane <your pane
   id> — diagnoses only, edits nothing`.
2. At the end:
   - the BISECT RESULT: per-commit pass/fail for the shas you tested, and the
     first failing commit;
   - the ROOT CAUSE with `file:line` evidence — what exactly stops the needle
     from appearing;
   - why the sibling test at the same assertion site still passes;
   - CLASSIFICATION: cycle-introduced product regression / stale test pinning a
     deliberately-changed UI / pre-existing / something else;
   - your RECOMMENDATION (fix the product or fix the test) with reasoning, and
     the exact minimal change either way;
   - whether you think this needs a human ruling, and why.
Then stop. Change nothing.
