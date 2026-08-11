# Brief: AGT c004-triage-lib — root-cause the 4 reproducible lib-suite failures
Date: 2026-08-10
Cycle: c004 · Role: FAILURE TRIAGE (fresh eyes)

## What This Is
The c004 gate is RED. You root-cause four reproducible failures in the lib
suite. You are a FRESH agent: you wrote none of this code and none of these
tests, which is the entire reason you are the one doing this.

**You diagnose. You do NOT fix.** Do not edit implementation code, do not
edit test code. Your deliverable is a classification plus the precise minimal
fix you would apply, so a separate agent can apply it. If you fix things, the
next runner has no independent check on your reasoning.

You MAY run tests — running is how you diagnose. Run whatever you need.

## Working location
- Worktree: `~/.herdr/worktrees/future/c004-ux`, branch `c004-ux`, HEAD
  `009ff77`. The tree is CLEAN — keep it that way.
- ALL cargo commands need this toolchain (the shim misresolves):
  `PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH cargo ...`
- Useful: `cargo test --lib <name>` to run one test. The full suite aborts at
  the first failing target unless you pass `--no-fail-fast`.

## The four failures (verbatim from the gate runner, reproduced identically in two runs)
Lib suite: `432 passed; 4 failed; 0 ignored` (436 = 390 baseline + 46 new).
None of these are PTY-timing dependent.

**F1 — `client::sidebar::tests::style_overrides_to_the_focused_role_are_honoured_not_hard_coded`**
`sidebar.rs:1262` — *"divider style must always be derived from ui.styles.apply(SemanticStyle::Focused, ..)"*
left (actual): `Style::new().magenta().bg(Color::Reset).underline_color(Color::Reset).bold()`
right (expected): `Style::new().magenta().bold()`

**F2 — `client::sidebar::tests::side_panel_divider_uses_focused_role_when_focused_and_divider_role_when_not`**
`sidebar.rs:1101` — *"focused divider must use the SemanticStyle::Focused role, not an ad-hoc style"*
left (actual): cyan + `bg(Reset)` + `underline_color(Reset)` + bold
right (expected): cyan + bold

**F3 — `client::tests::render_view_shows_the_frozen_scrollback_screen_while_pane_pending_keeps_updating_underneath`**
`mod.rs:4378` — *assertion failed: `view.accept(terminal_id, live_after.clone())`*
(i.e. `accept` returned `false` where the test required `true`)

**F4 — `terminal::ghostty::tests::scrollback_never_exceeds_the_vtes_configured_max_scrollback`**
`ghostty.rs:552` — *"oldest retained line 6846 is far NEWER than max_scrollback=10000 implies (expected floor ~594) — a smaller/different buffer may be in use instead of the vte's own history"*

## What I already suspect — verify or refute, do not just agree with me
- **F1/F2 look like TEST-EXPECTATION bugs, not implementation bugs.** The
  actual style carries `bg(Color::Reset)` and `underline_color(Color::Reset)`
  which the hand-rolled expectation omits. If `StylesConfig::apply()`
  legitimately sets those fields, then the divider IS correctly derived from
  the Focused role and the test's expected value is simply under-specified —
  the fix would be to build the expectation THROUGH
  `ui.styles.apply(SemanticStyle::Focused, ..)` rather than hand-constructing
  a `Style`. **Read `StylesConfig::apply` (`src/client/config.rs`, impl at
  ~371) and confirm what it actually sets.** If instead the implementation is
  bolting on Reset fields it should not, that is an implementation bug — say so.
- **F4 is the one I care most about, because it may be a REAL FINDING about
  the cycle's premise.** d016 and every brief in this cycle state the bound as
  *"history is whatever the existing 10,000-line vte buffer already holds
  (`max_scrollback: 10_000`, `terminal/ghostty.rs:40`)"*. This test suggests
  only ~594 lines are actually retained. **Determine what `max_scrollback`
  really means to libghostty** — read the vendored source, do not infer. My
  hypothesis to test: it is a BYTE/memory budget for the page allocator, NOT a
  line count. Vendored source is under
  `~/.cargo/git/checkouts/libghostty-rs-*/` and the upstream Zig under
  `ghostty-src/src/terminal/` (`PageList.zig` was read productively by an
  earlier agent this cycle). If it is bytes, then i004's implementation is
  still correct — it reuses whatever the vte retains, which is exactly its
  contract — but the DOCUMENTED BOUND is wrong everywhere it is written, the
  test's expectation is wrong, and that is a finding the coordinator needs.
- **F3**: `view.accept(...)` returning `false` smells like test-harness
  misuse — a correlation/registration precondition the test did not set up
  (compare with how `ScrollbackState::accept` and the `ViewState` request/reply
  correlation are used in the real `run()` loop, and with the neighbouring
  passing tests). But it could equally be a real defect in the frozen-screen
  path, which is i005's core no-yank mechanism. **This one matters most for
  product correctness — if the no-yank mechanism is genuinely broken, the
  operator's viewport will get yanked and the item's headline promise fails.**
  Decide which it is, with evidence.

## How to work
1. Reproduce each failure individually first. Confirm the runner's report.
2. For each, read the code the assertion is about — implementation AND test —
   before forming a view. Cite `file:line`.
3. Classify each failure as exactly one of:
   - **TEST BUG** — implementation is correct, the test asserts the wrong thing;
   - **IMPLEMENTATION BUG** — the test is right and the code is wrong;
   - **PRE-EXISTING** — reproduces at `main` (2e53f89) too, independent of this
     cycle. To check this, `git stash` is NOT available to you (tree must stay
     clean) — instead create a scratch worktree:
     `git worktree add /tmp/c004-base 2e53f89` and test there, then
     `git worktree remove /tmp/c004-base` when done;
   - **DOCUMENTED-BOUND WRONG** — the code and test are both self-consistent but
     the premise written into the cycle docs is false (F4 candidate).
4. For each, state the MINIMAL fix: exact file, exact line, exact change. Small
   and surgical. If a fix requires a judgment call that belongs to a human
   (product behaviour, a documented bound), say so and do not pick.
5. If two failures share one root cause, say so — that changes the fix count.

## Standing rules from this project, paid for in blood
- Verify by the ARTIFACT: the test output, the code you read. Never by another
  agent's report, including mine and including the runner's.
- Do not talk yourself into a comfortable answer. "The test is wrong" is the
  convenient conclusion for four failures at gate time; make the code prove it.
- `isolated_keyboard_chaos_journey` stays `#[ignore]`d (d015). Not your problem.
- Known flaky pair `project::tests::*_killed_at_the_timeout` PASSED in both
  gate runs. Not your problem.

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-triage-lib`:
1. FIRST: a CLAIM — `CLAIM triage of the 4 lib failures — pane <your pane id>
   — diagnoses only, edits nothing`.
2. At the end, one block per failure F1–F4:
   - the classification (one of the four above);
   - the ROOT CAUSE, with the `file:line` evidence you read;
   - the exact minimal fix, as a diff or a precise instruction;
   - your confidence, and what would change your mind.
   Then: whether any share a root cause, and — for F4 specifically — what
   `max_scrollback` actually means, quoted from the source you read, and
   whether the cycle's documented bound needs correcting.
Then stop. Change nothing.
