# Brief: AGT c004-test-author — transplant three test designs into real Rust tests
Date: 2026-08-10
Cycle: c004 · items i001–i005 · Role: TEST-AUTHOR

## What This Is
You turn three test-design specs into real, compiling Rust tests. This role
exists because of a measured failure: cycle c002 landed at exactly its 305
baseline with ZERO new automated tests, because no role was permitted to put
test CODE into the repo — the implementer is barred from writing its own
tests, the designer writes criteria into a spec file, the runner may not edit.
You are the fifth delegate that closes that gap. Last cycle the same role took
`cargo test` from NOT COMPILING to 450 passing.

Your boundaries:
- You write TEST CODE ONLY. You may edit `#[cfg(test)] mod tests` blocks and
  `tests/e2e.rs`. You may add test-only helpers inside those blocks.
- **You do NOT change implementation code.** Not one line outside a test
  module. If a test cannot be written without an implementation change, that
  is a FINDING you report — not a change you make.
- You do NOT run the test suite and you do NOT rule on pass/fail. A separate
  TEST-RUNNER does that, and its independence from you is the point.
- You MAY and MUST compile-check (see Verification below). Shipping
  non-compiling tests to the runner wastes an entire gate run; this cycle's
  predecessor lost one exactly that way.

## Working location
- Worktree: `~/.herdr/worktrees/future/c004-ux` (branch `c004-ux`). Work here.
- ALL cargo commands need this toolchain (the shim misresolves):
  `PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH cargo ...`
- The SPECS live in the main checkout, `/Users/jrg/future/.madewell/specs/`.
  Read them there. `.madewell/` does not exist in the worktree by design.

## Your three source specs
1. `/Users/jrg/future/.madewell/specs/2026-08-10-i004-scrollback.test.md`
   — the scrollback substrate (i004: `terminal/ghostty.rs`, `terminal/runtime.rs`,
   `protocol.rs`, `daemon/mod.rs`). **Its "API Assumptions" A1–A4 and
   "Contract ambiguities" #1–4 were already ANSWERED** by i004's implementer in
   a reconciliation note on board topic `c004`. Read that note (it is long and
   precise) BEFORE transplanting — it gives you the real names and shapes, and
   it will save you from the spec's guesses. Highlights you must honour:
   `snapshot_at_offset` (NOT `snapshot_at`); `RuntimeMessage::Scrollback {
   offset: u32, respond: oneshot::Sender<ScreenSnapshot> }` with a BARE
   `ScreenSnapshot`, not `Result`-wrapped; `TerminalHandle::scrollback(offset:
   u32)`; `ServerMessage::ScrollbackSnapshot` has NO offset field; no new
   `CommandError` variant was added, so a render error maps to
   `CommandError::Stopped`.
2. `/Users/jrg/future/.madewell/specs/2026-08-10-d017-focus.test.md`
   — the focus cluster (i001 focus model, i002 never-swallow-a-key, i003 focus
   indication).
3. `/Users/jrg/future/.madewell/specs/2026-08-10-i005-scroll-ui.test.md`
   — the client scroll UI (i005).

Each spec carries a numbered API-Assumptions block naming what its author had
to guess. **Reconcile every one against the code as it now stands before you
transplant.** Where a guess is wrong the fix is usually a mechanical rename;
the BEHAVIOUR being asserted should rarely need to change. Where the behaviour
itself is wrong, that is a finding.

## Pre-Verified Facts (verified by the orchestrator — trust these)
- Branch HEAD when you start will be at or beyond `04027e6`. Items i001, i002,
  i004 are committed; i003 and i005 land before you are dispatched. **Run
  `git log --oneline -8` first** and report the SHA you worked against.
- Baseline at `main` (2e53f89): **450 passed, 1 ignored**. Your job moves the
  first number up. The ignored one is `isolated_keyboard_chaos_journey`,
  `#[ignore]`d against d015 — **it STAYS ignored.** Do not re-enable it, do not
  "fix" it, do not delete it: its inline comment carries the d015 reference,
  the seed, and both measured pass rates, and that forensic record is
  deliberate.
- Known flaky pair: `project::tests::*_killed_at_the_timeout`. Pre-existing,
  not yours. Do not build on it and do not try to fix it.
- Test layout: `#[cfg(test)] mod tests` blocks in nearly every
  `src/client/*.rs` — `mod.rs:2393`, `input.rs:126`, `actions.rs:547`,
  `chrome.rs:1151`, `sidebar.rs:906`, `cards.rs:434`, `config.rs:1194`,
  `command_bar.rs:430`, `viewport.rs:283`, `phoropter.rs:404` — plus one large
  integration file `tests/e2e.rs` (**7,369 lines / 253KB — navigate it with
  grep or the bigfile tooling; do NOT read it whole**).
- Rendering assertions use ratatui's `TestBackend` for deterministic frame
  captures; that is the established mechanism in this codebase for proving a
  visual difference. Captures belong in
  `/Users/jrg/future/.madewell/work/test-results/` if a spec asks you to write
  one out.
- `ClientSurface` is at `src/client/mod.rs:83` and referenced only in mod.rs.
  i005 was free to model scrollback as a new variant OR as separate state and
  was required to report which — read its DONE post on board topic `c004`
  rather than assuming.
- **The mouse wheel is very likely NOT IMPLEMENTED.** There was no mouse
  support anywhere in `src/` at cycle start, and enabling mouse capture was
  referred to the coordinator as an open product question; i005 was instructed
  not to enable it without a ruling. The i005 spec marks its wheel cases
  CONDITIONAL. **Do not transplant wheel tests unless the wheel actually
  landed** — verify in the code, not from the spec. A test for a feature that
  does not exist is not coverage; it is a red gate.

## How to work
1. Read all three specs and the two board reconciliation notes first. Then
   `git log` and read the actual diffs of i002/i003/i005 so you are
   transplanting against reality.
2. Transplant priority-ordered, spec by spec. Prefer many small focused tests
   over few broad ones — a failure should name its own cause.
3. Put each test in the module the spec nominates unless the code says
   otherwise; say so when you override a spec's placement, and why.
4. Assert BEHAVIOUR, not implementation detail. A test that pins an internal
   name adds friction without adding safety.
5. Include the NEGATIVE cases. They are where this cycle's real risk sits:
   bare keys still reach the PTY when the main panel has focus (the d017
   ruling); ring/dial keys do NOT leak to the PTY; `Ctrl-b` sequences still
   dispatch; a bare `Tab` in the main panel is never intercepted; new output
   while scrolled does not yank the viewport; over-scroll clamps rather than
   errors; `offset == 0` is byte-identical to the live snapshot; no new
   retention was introduced.
6. **Do not encode a winner in a live conflict.** If two specs, or a spec and
   the code, disagree about what correct behaviour IS, build the fixtures
   where they agree and REPORT the disagreement. Last cycle the designer in
   your chain did exactly this and it was the right call; separately, a
   test-author OVERRULED an implementer's recommendation after reading the
   predicate's only call site, and was also right. Read the call site, then
   decide, then say what you decided.

## Verification — compile only, never execute
Before reporting, all three must be clean:
- `cargo fmt --check`
- `cargo clippy --all-targets -- -D warnings`
- `cargo test --no-run`

`cargo test --no-run` COMPILES the test binaries without running them, and it
is explicitly authorized and required. **Do not run the tests themselves** and
do not report any pass/fail count — that is the Test-Runner's ruling to make,
and you handing it a verdict would defeat the isolation this role exists for.

This is a deliberate refinement of the c003 rule that the Test-Author "runs
nothing": compile-checking is not running, and last cycle a whole gate run was
burned on the discovery that `cargo build` + narrow clippy can be green while
`cargo test --no-run` and `clippy --all-targets` are red.

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-test-author`:
1. FIRST, before editing: a CLAIM — `CLAIM test authoring c004 — pane <your
   pane id> — writes test modules + tests/e2e.rs only, no implementation code`.
2. At the end: `DONE test authoring` with —
   - the commit SHA you worked against, and your `git diff --stat`;
   - how many tests you added, per item (i001/i002/i003/i004/i005), and where;
   - every spec API-assumption you had to reconcile, and what the real shape was;
   - every spec case you did NOT transplant, each with its reason (wheel not
     implemented / not unit-testable / needs an implementation change);
   - any conflict you found between a spec and the code, or between two specs,
     and what you did instead of picking a winner;
   - any place a test could not be written without an implementation change —
     as a FINDING, with the change you would want;
   - exit codes for `cargo fmt --check` / `cargo clippy --all-targets -- -D warnings`
     / `cargo test --no-run`;
   - explicit confirmation that you changed NO implementation code and RAN NO
     tests, and that `isolated_keyboard_chaos_journey` is still `#[ignore]`d.
Then stop.
