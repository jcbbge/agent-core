# ORCH [w4-retention] — Retention and rotation for Tower state (archive, never destroy)

You own ONE unit: design and implement retention/rotation so consumers do not
read unbounded JSONL forever, without destroying the record. Do NOT use emojis.

Your CORD is `CORD [Tower]` (w2Y:p1). Work in a git worktree. Main checkout
serves live bus code via symlinks — do not branch-switch it.

## Pre-Verified Facts (CORD 2026-08-13)

1. Live sizes (re-measure at start): board.jsonl ~6750+ lines / growing; ledger
   ~2696 lines; flight ~3.7M; deliverables ~1.9M; odometer present. No rotation
   anywhere today.
2. Fence: **archive, never destroy.** Quarantine/compaction of malformed rows
   is bus-data's lane (their COMPACTION-PROPOSAL awaits concierge yes). You may
   rotate **clean** history into dated archive files; you must not delete
   content and must keep scan/read paths correct across a rotation boundary.
3. Do **not** rewrite live `board.jsonl` in place for data repair. If rotation
   needs an atomic swap of the active file, state the procedure, prove it on a
   disposable copy first, and require CORD/concierge yes before touching the
   live board if the swap is irreversible. Prefer: append-only active file +
   periodic copy of aged prefix into `~/.tower/archive/` with a cursor/offset
   so readers skip archived ranges — or equivalent non-destructive design.
4. Consumers that full-read today: cli, lib/tower-ledger, MCP server, twr,
   ctl-fleet, statem, hooks, spine bridges. Your design must name how each
   keeps working (cursor already exists for some ledger/board paths in
   tower-ledger.mjs — reuse, do not fork a second cursor system blindly).
5. Disjoint from ORCH w3-plane-fixes: they own server.mjs F1/F4 + cli board
   filter. You own rotation policy + archive tooling + reader awareness.
   Coordinate on board if a shared file is unavoidable — default avoid
   `cli.mjs`/`server.mjs` edits; prefer `tower-ledger.mjs` helpers + a new
   `rotate.mjs` / `cli.mjs rotate` verb if needed (claim on board first).
6. Topics: `tower/w4-retention` + summaries on `tower/fully-operational`.

## Tasks

1. **Policy** — done when: `briefs/tower/w4-retention-evidence/POLICY.md`
   states retention windows (or size triggers) for board, ledger, odometer,
   flight, deliverables, pheromones; archive location; never-destroy
   invariant; how to read across the boundary.
2. **Implement** — done when: a real rotate path exists (CLI verb and/or
   script under canonical tower home), dry-runable, with lock, that archives
   aged content and leaves the active store correct. Prove on a **copy** of
   state under `/tmp` or evidence dir before any live run.
3. **Live apply (board/ledger)** — done when: either (a) live rotate executed
   with pre-backup sha, post-verify active+archive integrity, and board
   prefix/archive completeness proven, OR (b) BLOCKED row to CORD naming
   exactly why live apply needs concierge yes (e.g. atomic swap risk) with
   dry-run proof attached. Prefer (a) if additive archive-of-prefix is safe.
4. **Flight/deliverables** — done when: same policy applied or staged with
   evidence; large dirs get archive buckets by date without deleting.
5. **Report** — `.done` + board final with sizes before/after and GO/NO-GO.

## Constraints

- Archive never destroy. Back up before any live mutation.
- No board.jsonl "repair". No writer authorship changes.
- Worktree only. No push.
- Visible panes. No mocks for the dry-run proof.

## Report back with

Policy summary, commands, before/after sizes, SHAs, whether live rotate ran.
