# Brief: AGT c004-fix-tests — apply the five triaged fixes (test code only)
Date: 2026-08-10
Cycle: c004 · Role: TEST FIXER

## What This Is
The c004 gate is RED with five reproducible failures. Two fresh triage agents
root-caused all five. **The verdict: NOT ONE of them is an implementation bug.**
Four are test bugs and one is a false premise written into the cycle's own
documentation. You apply the fixes.

Every change you make is inside a `#[cfg(test)] mod tests` block or
`tests/e2e.rs`. **You change NO implementation code.** If you believe a fix
requires touching implementation code, STOP and report — that would mean triage
was wrong, and that is a finding, not something you resolve by editing.

## READ THIS FIRST — why you specifically are being told to quote your diff
Last cycle, an agent in your exact seat **reported a fix as DONE that it had
never applied.** The fixture was byte-for-byte unchanged; an independent runner
caught it two gate runs later. The corollary that then worked, and that you are
being held to: **quote your own before/after diff for every fix.** A claim
without a diff is not evidence, and an independent runner re-gates everything
you do.

## Working location
- Worktree: `~/.herdr/worktrees/future/c004-ux`, branch `c004-ux`, HEAD
  `009ff77`. Tree is CLEAN.
- ALL cargo commands need this toolchain (the shim misresolves):
  `PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH cargo ...`
- `tests/e2e.rs` is 7,369 lines — navigate with grep, do not read it whole.

## FIX 1+2 — the two focused-divider style assertions (ONE shared root cause)
Failing: `client::sidebar::tests::style_overrides_to_the_focused_role_are_honoured_not_hard_coded`
(`sidebar.rs:1262`) and
`client::sidebar::tests::side_panel_divider_uses_focused_role_when_focused_and_divider_role_when_not`
(`sidebar.rs:1101`).

**Root cause (triage-verified against vendored ratatui-core-0.1.2 source):** the
test compares a *patch* against a *concrete* style. `ui.styles.apply(role,
Style::default())` returns a ratatui `Style` whose untouched channels are
`None`. But `buffer[(x,y)].style()` is `Cell::style()`, which always returns
`Some(_)` for fg/bg/underline_color, because a `Cell` stores concrete `Color`
and defaults unset channels to `Color::Reset`
(`ratatui-core-0.1.2/src/buffer/cell.rs:211-220`, confirmed by that crate's own
test at `:424-437`). `Style` derives structural `PartialEq`, so
`Some(Color::Reset) != None` and the two sides can never compare equal **even
though they render identically**. The implementation is provably correct: the
render path resets the cell then patches only fg+bold from
`ui.styles.apply(...)`, and never sets an ad-hoc style.

**Fix — make both sides travel the same reset+patch path, via a scratch Cell:**
- `sidebar.rs:1101-1116`: replace the two expected-value expressions with a
  helper such as
  ```rust
  let expected_style = |role| {
      let mut c = ratatui::buffer::Cell::default();
      c.set_style(ui.styles.apply(role, ui.styles.apply(SemanticStyle::Normal, Style::default())));
      c.style()
  };
  ```
  then compare against `expected_style(SemanticStyle::Focused)` and
  `expected_style(SemanticStyle::Divider)`.
- `sidebar.rs:1262-1269`: same pattern, single call —
  `expected_cell.set_style(ui.styles.apply(SemanticStyle::Focused, ui.styles.apply(SemanticStyle::Normal, Style::default())))`,
  then assert against `expected_cell.style()`.

Keep each test's ORIGINAL INTENT intact: F2 must still prove the divider uses
the Focused role when focused and the Divider role when not; F1 must still prove
a `[styles.focused]` TOML override is honoured on the rendered divider rather
than a compiled-in default. Do not weaken either into a tautology.

## FIX 3 — the frozen-scrollback no-yank test
Failing: `client::tests::render_view_shows_the_frozen_scrollback_screen_while_pane_pending_keeps_updating_underneath`
(`mod.rs:4378`, `assertion failed: view.accept(terminal_id, live_after.clone())`).

**Root cause (triage-verified):** `PaneState::accept` (`mod.rs:2050-2060`)
correctly rejects any screen whose `revision <= self.newest_revision` — that is
intentional revision-gating so stale replies cannot clobber fresher state. The
test's `sample_screen()` helper (`mod.rs:4128-4146`) hardcodes
`ScreenSnapshot::new(1, ...)`, so `live_after` has revision 1 exactly like
`live_before`; `1 <= 1` means `accept` correctly returns `false`.
**i005's no-yank mechanism is NOT implicated and is not broken** — this test
never got far enough to exercise it.

**Fix (`mod.rs:4377`, test only):** give `live_after` a revision greater than 1
by constructing it directly rather than through `sample_screen`, e.g.
```rust
ScreenSnapshot::new(
    2,
    TerminalSize { columns: 10, rows: 1 },
    "LIVEAFTERX".chars().map(|ch| Cell { contents: ch.to_string(), style: CellStyle::default() }).collect(),
    Cursor { column: 0, row: 0, visible: false },
).unwrap()
```
**Do NOT change `sample_screen`'s signature** — it has 16 other call sites, and
most feed `ScrollbackState::accept`, which is request-id gated rather than
revision gated, so they neither need nor want this change.

After fixing, this test must still actually prove the no-yank behaviour: that
`render_view` renders the frozen scrollback screen while `pane.pending` keeps
updating underneath. That is the headline promise of item i005 — if your fix
makes the test pass without proving that, say so loudly rather than banking it.

## FIX 4 — the vte retention test, under a stated assumption
Failing: `terminal::ghostty::tests::scrollback_never_exceeds_the_vtes_configured_max_scrollback`
(`ghostty.rs:552`).

**Root cause — the cycle's documented bound is FALSE, and triage proved it from
the vendored Zig source:** `max_scrollback` is a **BYTE** budget, not a line
count. `PageList.zig:604-609`: *"max_size is the maximum number of BYTES that
will be allocated for pages."* `Screen.zig:256-258`: *"The maximum size of
scrollback in BYTES."* The Rust binding's own doc comment
(`libghostty-vt .../terminal.rs:244`, "Maximum number of lines to keep in
scrollback history") is itself wrong and does not match the layer it wraps.

So `max_scrollback: 10_000` at `terminal/ghostty.rs:40` configures a
**10,000-byte page budget**, and the retained line count is a content-dependent
function of per-cell storage — not 10,000 lines, and not even deterministic
across differing content. i004's implementation is CORRECT either way; only the
description was wrong.

**ORCHESTRATOR RULING you are implementing — re-document, do not re-tune.** I am
proceeding on the conservative option and it is stated here so you are not
guessing: **do NOT change `max_scrollback` at ghostty.rs:40.** Raising it would
INCREASE RETENTION, and d016's bound for this cycle is explicitly "no new
retention, no second buffer, no unbounded growth" — so re-tuning it is a
deliberate product decision for the operator, not a gate fix. It is being
queued as a discovery item. The setting predates this cycle and is unchanged by
it.

**Fix (`ghostty.rs`, test only):** the test's `expected_floor` formula at
`ghostty.rs:543` (`TOTAL_LINES.saturating_sub(MAX_SCROLLBACK + ROWS)`) is
invalid under byte semantics — it assumes line-for-line eviction. Rewrite the
test to assert the STRUCTURAL properties that are actually true and actually
worth guarding:
- pruning genuinely happened (`oldest_line > 0` — history is bounded, nothing
  grows without limit);
- scrollback is not empty and real history is retained
  (`oldest_line < TOTAL_LINES - ROWS`);
- and keep the test's real purpose: **no unbounded growth**.

Rename it if the old name now overstates what it proves, and put a comment in
the test stating plainly that `max_scrollback` is a BYTE budget, citing
`PageList.zig` — so the next reader does not re-derive this the hard way. Do
not assert a precise line fencepost; that would require duplicating ghostty's
internal page-layout math and would be fragile against any content change.

## FIX 5 — the e2e sidebar needle (a false negative, not a product regression)
Failing: `public_workspace_sidebar_docks_navigates_and_collapses_responsively`
(`tests/e2e.rs:130`, *PTY output never contained "c new · r rename"*).

**Root cause — triage bisected it to commit `06effd5` (i003) and then proved the
screen is CORRECT:** with 2 workspaces and a 122-col terminal the sidebar is
docked, so i003's new `dim_area` (`sidebar.rs:504-513`) has already washed
`SemanticStyle::Muted` over the blank cells of the content area. When `\x02w`
opens the drawer, the footer `" ↑↓ ↵ c new · r rename"` (`sidebar.rs:787`) is
**also** styled `SemanticStyle::Muted` (`config.rs:675-679`). So every SPACE in
that string is now cell-identical to what was already painted, and ratatui's
`Buffer::diff` emits no write for unchanged cells — it just repositions the
cursor. Triage confirmed this in the captured PTY bytes:
`\x1b[24;9Hc\x1b[24;11Hnew\x1b[24;15H·\x1b[24;17Hr\x1b[24;19Hrename`.
Every glyph IS written and the line is fully legible on a real terminal; it is
simply no longer a contiguous escape-free byte run. `PtyChild::text()`
(`e2e.rs:170-172`) concatenates raw bytes and `wait_for` (`e2e.rs:115-131`) does
a literal `str::contains`, so the escapes fragment the needle.

The sibling test passes because it has only 1 workspace, so `hide_when_single`
(default true, `config.rs:673`) leaves the sidebar undocked — nothing is
pre-painted, every cell differs, one contiguous dirty run.

**Fix (`tests/e2e.rs`, test harness only):** add a needle-matching path that
strips ANSI/CSI escape sequences before the `contains` check, and use it for the
two `wait_for("c new · r rename")` call sites in this test (around
`e2e.rs:4942` and `e2e.rs:5043`).

**CRITICAL — do NOT change `text()` or `wait_for` globally.** Several other
tests deliberately assert on raw escape sequences (triage cited `e2e.rs:3628`,
`3632`, `5316-5317`, `4822-4823` checking exact SGR/mode codes); stripping
escapes globally would silently gut them. Add a SIBLING helper (e.g.
`wait_for_rendered`, or a CSI-stripping filter over `text()`) and switch only
those two assertions.

Write the helper as something the harness can reuse: triage's closing note is
that any future assertion of this shape — a drawer overlaying a dimmed docked
view — can now legitimately produce escape-fragmented runs, so this is worth
having generally rather than as a two-line patch. Give it a doc comment
explaining why it exists.

## Verification you must do
- `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`,
  `cargo test --no-run` → all must be 0.
- Run the five tests you fixed and confirm each PASSES. You may run tests; you
  may not rule on the gate. A separate independent runner re-gates everything.
- **Then run `cargo test --no-fail-fast`** and report the counts you see. Plain
  `cargo test` aborts at the first failing target and hid the entire e2e suite
  during the first gate run — do not repeat that.
- Expected shape if all five fixes land: lib `436 passed; 0 failed`, e2e
  `60 passed; 0 failed; 1 ignored`. Baseline was 390 lib + 60 e2e = 450 passed
  / 1 ignored; this cycle added 46 tests.
- `isolated_keyboard_chaos_journey` stays `#[ignore]`d (d015). Do not touch it.

## Commit
One commit, staging only the files you changed, by explicit path — never
`git add -A`. Project format (`PHASE: Verify`, `DONE:`, `TODO:`). State in the
body that these are test-only fixes and that no implementation bug was found.

## Report back (exact contract)
Post to the fleet board, topic `c004`, `from` = `c004-fix-tests`:
1. FIRST: a CLAIM — `CLAIM the 5 triaged test fixes — pane <your pane id> —
   test code only, no implementation changes`.
2. At the end, per fix F1–F5: **your own before/after diff quoted**, and
   confirmation the test now passes. Then: the commit SHA, `git diff --stat`,
   the three compile exit codes, the full `--no-fail-fast` counts, explicit
   confirmation that you changed no implementation code, and anything you could
   not fix or chose not to.
Then stop.
