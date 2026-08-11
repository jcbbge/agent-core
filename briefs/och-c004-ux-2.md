# Brief: OCH c004-ux (continuation) — resume cycle c004 from durable state
Date: 2026-08-10
Status: ready

## What This Is
Cycle c004 (client scrollback + focus legibility for the future project) lost
its orchestrator to context exhaustion after wave 1. Its handoff is clean and
durable. You are the FRESH orchestrator: resume from disk, drive the cycle to
its gate, leave the branch unmerged for coordinator review and operator
sign-off. You never implement. Naming per
~/agent-core/primitives/rules/control-flow.md (agents: lowercase registration
names agt-*, display case via --display-agent, stamp $task per
~/herdr-spine/docs/spawn.md).

## Pre-Verified Facts (coordinator, 2026-08-10)
- Durable state (all verified this hour): worktree
  ~/.herdr/worktrees/future/c004-ux, branch c004-ux (checked-out at 2e53f89 —
  RUN `git -C <worktree> status && git log --oneline -3` first: i001+i004 may
  be uncommitted working-tree changes). Cycle store
  /Users/jrg/future/.madewell/cycles/c004.json: phase plan, i001 done, i004
  done, i002/i003/i005 pending. Event log: .madewell/work/status.jsonl tail.
  Rulings: .madewell/DECISIONS.md 2026-08-10 block (scroll-the-terminal
  requirement; daemon/protocol plumbing IN scope this cycle; UX mandate).
- Predecessor's handoff, binding: the tree is RED — i004 added
  ServerMessage::ScrollbackSnapshot (protocol.rs) forcing a non-exhaustive
  match at src/client/mod.rs:578; the missing arm is i005's FIRST task (this
  is written into i005's item text in c004.json). i002/i003/i005 are disjoint
  by file and can run concurrently — but CROSS-CHECK partitions against each
  other's enum/signature surfaces BEFORE dispatching (this cycle and c003 both
  paid for skipping that; any item adding an enum variant must carry every
  exhaustive-match site in its partition).
- Toolchain: use PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH
  for ALL cargo commands (shim misresolves). Gate = cargo fmt --check,
  cargo clippy --all-targets -- -D warnings, full cargo test, deterministic
  (run twice), baseline 450 passed / 1 ignored at main 2e53f89. Known flaky
  pair: project::tests::*_killed_at_the_timeout (rerun before ruling).
  isolated_keyboard_chaos_journey stays #[ignore]d (d015).
- Protocol: sonnet AGT workers in herdr panes, Isolation Mandate
  (implementer ≠ test-author ≠ runner; fresh failure triage), verified
  submits (agent prompt --wait), wake signals armed whenever workers live,
  fleet mail on the board topic c004 — operator mail plane is off-limits
  (COMMS-ARCH). Coordinator is pane w1A:p1 ("CRD future").
- The SPENT predecessor pane w1A:p3 ("OCH c004-ux") is read-only history —
  do not prompt it, do not close it.

## Finishing Point
i002 (side panel never swallows a key — non-ring keypress snaps focus to main
AND delivers the keystroke), i003 (unmissable focus indication), i005 (client
scroll UI over real terminal scrollback, starting with the mod.rs:578 arm)
built, test-authored, and gated deterministically green on branch c004-ux;
acceptance evidence written; branch left unmerged; report to coordinator.

## How We'll Know It's Done
- [ ] c004.json reaches verify with i002/i003/i005 done
- [ ] Gate green twice consecutively (fmt 0, clippy --all-targets 0, tests ≥450+new, 1 ignored)
- [ ] Board post topic c004: gate table, files, worker panes used, deviations
- [ ] Branch unmerged; coordinator eyeball + operator sign-off follow

## Report back with (exact completion contract)
The board post above, then idle with wake signals armed. Front-load any
questions in ONE batch to the coordinator via board topic c004.
