# Brief: AGT c004-td-d017 — test design for the d017 focus cluster (i001, i002, i003)
Date: 2026-08-10
Cycle: c004 · items i001 + i002 + i003 · Role: TEST-DESIGNER

## What This Is
You write the test DESIGN — criteria plus candidate test code — for the
three focus/keyboard items of cycle c004. You are the fourth of five
delegate roles and the boundaries are absolute:

- You write ONE file: `/Users/jrg/future/.madewell/specs/2026-08-10-d017-focus.test.md`
- You touch NO implementation file. You touch NO test file.
- You RUN NOTHING. No `cargo test`, no `cargo build`, no client.
- A separate TEST-AUTHOR transplants your candidate code into real Rust
  tests. A separate TEST-RUNNER runs them. You are neither.

Your value is that you derive tests from what was ASKED FOR, not from what
happened to get built. That independence is the point — last cycle a
test-designer in your seat overruled an implementer's recommendation after
reading the call site, and was right.

## Working location
- Run from `/Users/jrg/future` (the MAIN checkout). Your output file lives
  in its `.madewell/specs/`.
- The IMPLEMENTATION you are designing against is in a worktree:
  `~/.herdr/worktrees/future/c004-ux` (branch `c004-ux`). READ it freely by
  absolute path. Do not write there.
- If you ever run a cargo command to check something, don't — you run
  nothing. If you need a fact about the toolchain: it is
  `PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH`.

## Follow the shape of the spec that already worked
`/Users/jrg/future/.madewell/specs/2026-08-10-i004-scrollback.test.md` is the
sibling spec for item i004, written this cycle, and it is the standard to
match. Read it first — specifically how it opens with an "API Assumptions —
READ THIS FIRST" block (A1, A1a, A1b…) that names every guess it makes about
an API that did not exist yet, cites the code it read inline, and tells the
Test-Author exactly what to reconcile. That block is why its author's guesses
being wrong cost a mechanical rename instead of a rewrite.

You are in the same position, more so: **i002 and i003 are being implemented
RIGHT NOW, concurrently with you.** Design against the behavioural
done-conditions (stable) and flag every internal-API assumption for
reconciliation (in flux).

## Pre-Verified Facts (verified by the orchestrator this hour — trust these)
- Branch `c004-ux` HEAD is `94ea0c7` ("fix(client): add exhaustive
  ScrollbackSnapshot arm — build unblock"). It compiles: `cargo check --lib`
  reports 0 errors. That commit also carries the completed i001 and i004 work.
- **i001 is DONE and is your substrate.** `ChromeFocus::owns_pty()`
  (`src/client/mod.rs` ~line 102) is THE single accessor for "who owns the
  keyboard"; `ChromeFocus` has variants `MainPanel` and `SidePanel`. Both the
  input router and `passthrough_active()` derive from it. i001's own
  done-condition was "no behaviour change observable to the operator" — so
  its tests are about the INVARIANT (one source of truth; the ring gate and
  the passthrough decision cannot disagree), not about new behaviour.
- `passthrough_active(raw_output, chrome_focus, view, surface, rename, ...)`
  now takes `chrome_focus` and requires `MainPanel` before raw PTY bytes
  render. Raw passthrough is env-var opt-in and OFF by default.
- The key-routing path is: `Event::Key(key) if surface.is_none()` →
  `encode_key(key)` → `PrefixState::feed(bytes)` →
  `PrefixAction::{Wait, Dispatch(action), Send(bytes)}`
  (`src/client/input.rs:104`, enum at `input.rs:88`). `Ctrl-b` is byte `[2]`.
  The side-panel branch lives under `PrefixAction::Send(bytes)` in
  `src/client/mod.rs` (~line 834) and uses `ring_move(key)` to recognise ring
  and dial gestures.
- `commit_side_panel_focus(...)` is the EXISTING single focus-commit path;
  ruling Q1 says the focus request fires ONCE, at the ring transition into
  the main panel — not per keystroke. A test that asserts one request per
  transition is asserting a ruling, not a preference.
- `StylesConfig` (`src/client/config.rs:257`) with `StylePatch` (270),
  `StylesPatch` (296), hand-written `Deserialize` (307), `Default` (332),
  `impl` (371). Existing named styles: `normal`, `muted`, `current`,
  `selected`, `closing`, `attention`, `error`, `divider`. Exposed as
  `pub(super) styles: StylesConfig` (748). `BindingsConfig` methods
  `suffix()`/`label()` at config.rs:80/87.
- Test baseline at `main` (2e53f89): **450 passed, 1 ignored**.
  `isolated_keyboard_chaos_journey` is `#[ignore]`d against d015 and STAYS
  ignored — do not design anything that depends on re-enabling it. The known
  flaky pair `project::tests::*_killed_at_the_timeout` exists; don't build on it.
- Rendering is proved mechanically by **deterministic frame captures via
  ratatui's `TestBackend`**, written to `.madewell/work/test-results/` — that
  is the established ruling for this codebase ("Motion is verified
  mechanically and signed visually", DECISIONS.md 2026-08-10). The
  coordinator eyeballs a live client and the operator signs the look. So
  design i003's tests to assert that the two focus states DIFFER in specific
  cell attributes — never to assert that something "looks good".

## The three contracts (verbatim from the cycle store, `.madewell/cycles/c004.json`)

**i001 — focus model made explicit** (DONE; tests still owed)
> One value answers 'who has the keyboard' everywhere; the Tab ring and the
> passthrough path both derive from it rather than each keeping their own
> notion; no behaviour change observable to the operator.

**i002 — the side panel must NEVER swallow a non-ring key** (UX MANDATE, d017 part 2)
> With the side panel focused, typing an ordinary character moves focus to
> the main panel and that exact character reaches the PTY — not dropped, not
> doubled, not reordered. Ring and dial keys still act on the side panel and
> are NOT delivered. Ctrl-b prefix sequences still reach the chrome.

**i003 — unmissable focus indication** (UX MANDATE, d017 part 1)
> Rendered buffers differ unmistakably between side-panel-focused and
> main-panel-focused states in both the border/highlight and the dim level;
> the status line names the mode; all three icon presets and style overrides
> still work; no hard-coded colour that ignores StylesConfig.

## What the spec must contain
For each of the three items, in priority order:
1. The contract restated, then discrete numbered test cases with a one-line
   statement of what each PROVES. Not "test the focus" — "a bare 'a' pressed
   with SidePanel focus yields exactly one PTY write of b\"a\" AND leaves
   focus == MainPanel".
2. Candidate Rust test code, as close to transplantable as you can make it,
   naming the module/file you believe it belongs in and why.
3. An explicit API-Assumptions block per item, in the i004 spec's style, with
   every guess numbered and the reconciliation action stated.
4. The NEGATIVE cases, which are where this cycle's risk actually lives:
   - not doubled, not reordered (i002's own words) — a character must arrive
     exactly once, in order;
   - ring/dial keys must NOT leak to the PTY;
   - `Ctrl-b` + suffix must still dispatch chrome actions from either focus;
   - a bare `Tab` while the MAIN panel has focus must reach the PTY
     untouched (Tab is shell completion — a ruling, and breaking it is a
     product-wide regression);
   - i003 must not regress the three icon presets or `[ui.styles.*]` overrides.
5. Anything you judge NOT unit-testable, said plainly, with the reason and
   what a human would have to check instead. The i004 spec did exactly this
   for the daemon dispatch handler; that honesty is wanted, not penalised.

## Parallel Work — you are designing against moving code
In the same worktree, right now:
- `AGT c004-i002` (pane w1C:p5) owns `src/client/mod.rs`, `src/client/input.rs`.
- `AGT c004-i003` (pane w1C:p6) owns `src/client/sidebar.rs`, `src/client/cards.rs`,
  `src/client/chrome.rs`, `src/client/config.rs`.
Read their files; never edit them. Their DONE posts on board topic `c004`
will carry the real names and shapes — if one lands while you still have work
to do, read it and reconcile your assumptions. If you spot a conflict between
what a contract requires and what you can see is being built, SAY SO in the
spec and post it to the board. Do not silently encode a winner: last cycle a
designer in your seat declined to pick a side in a live architectural
conflict and reported it instead, and that was the right call.

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-td-d017`:
1. FIRST, before writing: a CLAIM — `CLAIM test design d017 (i001/i002/i003)
   — pane w1C:p7 — writes .madewell/specs/2026-08-10-d017-focus.test.md only`.
2. At the end: `DONE test design d017` with — the file path, a count of test
   cases per item, which of the five contract priorities each item's cases
   cover, every API assumption you flagged for reconciliation (numbered),
   anything you judged NOT unit-testable and why, and any conflict you found
   between a contract and the code.
Then stop. You ran nothing, so report no exit codes — say explicitly that
you ran nothing.
