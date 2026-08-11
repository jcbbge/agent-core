# Brief: AGT c004-td-i005 — test design for i005 (client scroll UI)
Date: 2026-08-10
Cycle: c004 · item i005 · Role: TEST-DESIGNER

## What This Is
You write the test DESIGN — criteria plus candidate test code — for c004
item i005, the client scroll UI over real terminal scrollback. Boundaries,
absolute:

- You write ONE file: `/Users/jrg/future/.madewell/specs/2026-08-10-i005-scroll-ui.test.md`
- You touch NO implementation file. You touch NO test file.
- You RUN NOTHING. No `cargo test`, no `cargo build`, no client.
- A separate TEST-AUTHOR transplants your candidate code into real Rust
  tests. A separate TEST-RUNNER runs them. You are neither.

You design from what was ASKED FOR, not from what got built. That
independence is the whole point of the role.

## Working location
- Run from `/Users/jrg/future` (the MAIN checkout). Your output file lives in
  its `.madewell/specs/`.
- The implementation is in a worktree: `~/.herdr/worktrees/future/c004-ux`
  (branch `c004-ux`). READ it freely by absolute path. Do not write there.

## Read these two first
1. `/Users/jrg/future/.madewell/specs/2026-08-10-i004-scrollback.test.md` —
   the sibling spec for the SERVER-SIDE substrate your item consumes, written
   this cycle. It is the quality standard to match, especially its "API
   Assumptions — READ THIS FIRST" block (A1, A1a, A1b…) which numbers every
   guess about an API that did not exist yet, cites the code it read inline,
   and tells the Test-Author exactly what to reconcile. Match that discipline.
2. `/Users/jrg/agent-core/briefs/agt-c004-i005.md` — the implementer's brief.
   It pins the ARCHITECTURE down hard (prefixed entry, modal mode, no config.rs).
   Design against the contract it states, not against whatever you find in
   the diff.

**i005 is being implemented RIGHT NOW, concurrently with you.** Design
against the behavioural done-conditions (stable) and flag every internal-API
assumption for reconciliation (in flux).

## The contract (verbatim from `.madewell/cycles/c004.json`)
> Scrolling up shows real earlier output for the focused pane; a jump-to-live
> key returns to the bottom; the scrolled state is visibly marked; new output
> while scrolled does not force a jump; wheel works where the terminal
> reports it; bare keys still reach the PTY when the main panel has focus
> (the d017 rule is not broken by this).

## Pre-Verified Facts (verified by the orchestrator against the code — trust these)
- Branch HEAD is `04027e6`. Items i001, i002, i004 are DONE and committed;
  the branch compiles (`cargo check --lib` = 0 errors).
- **The server side already exists** (i004, committed). Exact shapes, from the
  implementer's own authoritative reconciliation note on board topic `c004`:
  - `ClientMessage::RequestScrollback { terminal_id: TerminalId, offset: u32 }`
  - `ServerMessage::ScrollbackSnapshot { terminal_id: TerminalId, screen: ScreenSnapshot }`
    — deliberately **NO offset field in the reply**; correlation is by `request_id`.
  - `offset == 0` is byte-identical to today's live snapshot (same code path).
  - **Clamping is vte-side** (libghostty's PageList): an arbitrarily large
    offset clamps to the oldest retained line and CANNOT error. Do not design
    tests that expect a client-side clamp or an error on over-scroll.
  - History is the existing 10,000-line vte buffer (`max_scrollback: 10_000`,
    `terminal/ghostty.rs:40`). NO new retention is permitted anywhere — a test
    that asserts no new unbounded buffer appeared is IN scope and valuable.
- The client already has an explicit no-op arm
  `ServerMessage::ScrollbackSnapshot { .. } => {}` in `src/client/mod.rs`
  after the `Welcome` arm (added by i002 in `94ea0c7`). i005 gives it a body.
- `ClientSurface` (`src/client/mod.rs:83`) is the existing modal-overlay enum,
  referenced in no other file. i005 may model scrollback as a new variant of
  it OR as separate state — **it is instructed to report which and why, so do
  not hard-code either assumption**; write the assumption down as a
  reconciliation point.
- Key routing: `Event::Key(key) if surface.is_none()` → `encode_key(key)` →
  `PrefixState::feed(bytes)` → `PrefixAction::{Wait, Dispatch(action),
  Send(bytes)}` (`input.rs:104`, enum at `input.rs:88`). `Ctrl-b` is byte `[2]`.
  Note the `if surface.is_none()` guard — when a surface is active, keys are
  already routed away from the PTY. That is the sanctioned mechanism for
  consuming bare keys in a mode.
- New actions are added in `actions.rs`: the enum, `ALL_ACTIONS` (and its
  hard-coded length `[ClientAction; 32]`), `config_key()` (436),
  `default_suffix()` (478), `label()`, the `COMMANDS` table, and the
  `#[cfg(test)] requires_launcher()` match (502). Adding an action needs NO
  config.rs change. Existing validation forbids two actions sharing a `Ctrl-b`
  suffix (config.rs:940), and `config_keys_are_unique_across_all_actions`
  (actions.rs:656) already guards uniqueness.
- Rendering is proved mechanically by deterministic **ratatui `TestBackend`**
  frame captures written to `.madewell/work/test-results/` — the established
  ruling ("Motion is verified mechanically and signed visually"). So design
  the "visibly marked" test to assert that specific cell attributes/content
  DIFFER between live and scrolled states. Never assert that something looks
  good; a human signs the look.
- Test layout: `#[cfg(test)] mod tests` blocks inside nearly every
  `src/client/*.rs` (e.g. `mod.rs:2393`, `input.rs:126`, `actions.rs:547`),
  plus one large integration file `tests/e2e.rs` (7,369 lines — if you cite it,
  navigate with grep or the bigfile tooling, do not read it whole).
- Baseline at `main` (2e53f89): **450 passed, 1 ignored**.
  `isolated_keyboard_chaos_journey` stays `#[ignore]`d against d015 — design
  nothing that depends on re-enabling it. Known flaky pair
  `project::tests::*_killed_at_the_timeout` — don't build on it.
- **There is NO mouse support anywhere in the codebase** (`grep` for `Mouse` /
  `EnableMouseCapture` across `src/` returns nothing). Enabling mouse capture
  is an open question with the coordinator, and i005 is under instruction NOT
  to enable it without a ruling. So: design the wheel tests SEPARATELY and
  clearly marked CONDITIONAL — they are expected to be un-transplantable this
  cycle, and the Test-Author must not be misled into thinking wheel support
  landed. Say this explicitly in the spec.

## The cases that actually matter — this is where the risk lives
Cover the happy path, but these are the ones that catch real defects:
1. **The d017 rule is not broken.** With the MAIN panel focused and no
   scrollback mode active, a bare key — including `PageUp`/`PageDown` and a
   bare `Tab` — still reaches the PTY untouched. This is an operator ruling
   and the most important negative test in the item.
2. **No silent yank.** New output arriving while scrolled back must NOT force
   the viewport to the bottom. Design this precisely: what arrives, what the
   offset was, what it still is afterwards.
3. **Jump-to-live returns to the bottom** and leaves the mode, and the state
   is then indistinguishable from never having scrolled.
4. **Over-scroll clamps, does not error** (and the clamp is the vte's, so the
   client must not add its own).
5. **`offset == 0` is byte-identical to the live snapshot** — the seam between
   i004 and i005.
6. **Real earlier output, correct rows, not corrupted** — scrolling up shows
   what was actually there.
7. **The scrolled state is visibly marked**, asserted as concrete differing
   cells via `TestBackend`.
8. Ring (Tab/Shift+Tab), dial (Return/Shift+Return), and `Ctrl-b` prefix
   sequences all still behave — i005 must not regress i001/i002/i003.
9. **No new retention** — the d016 bound.

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-td-i005`:
1. FIRST, before writing: a CLAIM — `CLAIM test design i005 — pane w1C:p9 —
   writes .madewell/specs/2026-08-10-i005-scroll-ui.test.md only`.
2. At the end: `DONE test design i005` with — the file path, the test-case
   count, which of the 9 risk areas above each case covers, every API
   assumption flagged for reconciliation (numbered), which cases you marked
   CONDITIONAL on the mouse ruling, anything you judged NOT unit-testable and
   why, and any conflict you found between the contract and the code.
Then stop. You ran nothing — say so explicitly and report no exit codes.
