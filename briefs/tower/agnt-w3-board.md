# AGNT [board-plane] — Prove board plane by exercise

Read `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/SHARED-PREFIX.md` first — it is the shared prefix. Everything below is your partition.

Model tier: sonnet-class judgment OK; mechanical proofs preferred.

## Pre-Verified Facts (lead verified all of these personally)

See SHARED-PREFIX.md facts 1–10 (ORCH verified 2026-08-13). Especially: normCwd samples (fact 4), F9 pre-probe (fact 7), schema ruling TWO ROW KINDS (fact 8).

## Parallel Work Notice

See SHARED-PREFIX. Partition map:
- YOU write: `BOARD.md`, `raw/board/**`, `workers/board.done`
- Sibling ledger: `LEDGER.md`, `VERBATIM.md`
- Sibling surfaces: `SURFACE.md`
- Sibling aux: `AUX.md`, `SPINE.md`
Do not touch sibling files.

## Tower

- CLAIM on `tower/w3-prove-planes` from=`AGNT w3-board` before work.
- Findings on same topic when load-bearing.
- TOWER-WAIVED for operator mail: this is fleet proof only.

## Tasks

1. Round-trip claim/finding/note via **MCP** `board_post` + `board_read` AND via **CLI** `bun ~/.tower/cli.mjs post …` + `board` — done when: `BOARD.md` section A quotes ids, timestamps, and read-back bodies for both paths.
2. Project isolation — done when: from cwd A=`/Users/jrg/agent-core` and cwd B=`/Users/jrg/Infinity/arc` (or worktree that norms to arc), post distinct probe notes under topics `tower/w3-probe-board-a` and `tower/w3-probe-board-b` (or project-scoped topics), then show which rows each cwd's `board_read`/CLI board sees; prove one project does not see the other's fleet rows. Paste commands + filtered ids.
3. Worktree collapse — done when: section C shows before/after for `normCwd` on `/Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck` → `/Users/jrg/agent-core`, and demonstrates board scoping treats worktree cwd rows as the project scope (post-from-worktree OR read-with-cwd evidence).
4. Multi-shape consumer behavior — done when: section D states how `board_read`/CLI behave on authored vs machine rows (lineage / verify-gate-bypass) **without repairing data**, citing bus-data ruling (SHARED fact 8) — count/tolerate, not fix.
5. F9 topic filter — done when: section E re-proves or refutes that `cli board <topic>` ignores topic; paste line counts + method. Defect → document as GAP (do not fix).

## Constraints

- Touch ONLY: `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/BOARD.md`, `raw/board/**`, `workers/board.done`.
- Absolute paths only for evidence writes (coder may be in a worktree).
- Do not commit. Do not edit production Tower code.

## Report back with

- Verdict: PROVEN / UNBROKEN / GAP for board plane.
- Exact commands run (copyable).
- Evidence path list.
- Deviations with reasons.
- Create empty marker file `workers/board.done` only after BOARD.md satisfies tasks 1–5.
