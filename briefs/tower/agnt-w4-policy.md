# AGNT [w4-policy] — Retention/rotation POLICY for Tower state

Model tier: sonnet (design judgment; no production code).

Write the retention POLICY for Tower so consumers stop full-reading unbounded
JSONL forever, without destroying the record. Do NOT use emojis anywhere.

Repo: agent-core (Tower canonical code). Work ONLY in the worktree below.
Live bus state lives under `~/.tower/` (symlinks into main checkout — do not
branch-switch main; do not mutate live state).

## Pre-Verified Facts (ORCH verified 2026-08-13)

- Worktree: `/Users/jrg/.spine/worktrees/agent-core/w4-retention` on branch
  `orch/w4-retention` at `01b1956`. Evidence output dir (create if needed):
  `/Users/jrg/.spine/worktrees/agent-core/w4-retention/briefs/tower/w4-retention-evidence/`
  (mirror path under `~/agent-core/briefs/tower/w4-retention-evidence/` is OK
  only if you cannot write the worktree path — prefer worktree).
- Live sizes (remeasured): `board.jsonl` 6792 lines / ~4.2MB;
  `ledger.jsonl` 2696 / ~1.1MB; `odometer.jsonl` 1026 / ~281KB;
  `flight/` 3.7M; `deliverables/` 1.9M; `pheromones.jsonl` 19 lines / 8KB;
  `~/.tower/archive/` ABSENT.
- Canonical ledger/cursor code:
  `/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs` (re-exported by
  `primitives/mcps/tower/lib.mjs`). Byte-offset cursors already exist:
  `~/.tower/cursors/ledger.inbox.cursor.json`,
  `board.scope.cursor.json`, `ledger.jsonl.offset.json`. Shape includes
  `{offset,size,mtimeMs,...}`. `cursorValid` returns false when
  `st.size < cursor.offset` (shrink invalidates → rebuild). Lock helper:
  `withCursorLock` via `wx` pid files under `cursors/`.
- CORD fence (orch-w4-retention.md): **archive, never destroy.** Prefer
  append-only active file + copy of aged prefix into `~/.tower/archive/` with
  a cursor/offset so readers skip archived ranges. Atomic swap/truncate of
  live `board.jsonl` needs CORD/concierge yes after disposable proof. No
  board.jsonl "repair". Quarantine/compaction = bus-data lane (not yours).
- Disjoint: ORCH w3-plane-fixes (w2Y:p8) owns `server.mjs` F1/F4 + `cli.mjs`
  board filter. Default avoid those files. Prefer new `rotate.mjs` +
  tower-ledger helpers; claim on board before touching shared files.
- Consumers that full-read today (must name keep-working strategy for each):
  cli.mjs, hooks/tower-ledger.mjs, MCP server.mjs, twr, ctl-fleet,
  statem, hooks, spine bridges (`herdr-spine` board append / tower-auto).
- Topics: post CLAIM/findings to `tower/w4-retention`. Done marker:
  `briefs/tower/w4-retention-evidence/agnt-w4-policy.done`.

## Parallel Work Notice

ORCH w3-plane-fixes is in flight on `server.mjs` / `cli.mjs` — ignore their
uncommitted changes; do not investigate, revert, or fix them. CORD bus-data
owns board repair/compaction — do not touch. Concern yourself only with
POLICY.md. Post claims to Tower board topic `tower/w4-retention` before
writing; read the board first.

## Tower (mid-run communication)

- CLAIM first on topic `tower/w4-retention` (type=claim, from=AGNT w4-policy).
- Findings with specific decisions (windows, archive layout) as type=finding.
- Harness: MCP `board_post` / `board_read`, or append JSONL to
  `~/.tower/board.jsonl` with real cwd `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
  and topic `tower/w4-retention`.
- On Herdr: `spine-report task "..."` at start; `spine-report verdict "..."` at end.
- Do NOT send operator mail. Status idle after done is correct.

## Tasks

1. Survey consumers — done when: POLICY.md lists each consumer above and
   states whether it uses byte cursors today, full-read, or dir scan; and
   the exact keep-working strategy after rotation (reuse existing cursor
   system; do not propose a second competing cursor design).
2. Choose triggers — done when: POLICY.md states retention windows and/or
   size triggers for board, ledger, odometer, flight, deliverables,
   pheromones (justify numbers from live sizes; pheromones is tiny — say so).
3. Archive layout — done when: POLICY.md specifies `~/.tower/archive/`
   layout (dated files/buckets), never-destroy invariant, how to read
   across the boundary (active + archive), and whether Phase-1 is
   additive-prefix-copy (no live truncate) vs atomic swap (needs yes).
4. Rotate contract — done when: POLICY.md specifies CLI/script surface
   (`bun ~/.tower/rotate.mjs` and/or `cli.mjs rotate`), dry-run, lock file
   location, proof-on-copy requirement under `/tmp` or evidence dir, and
   what live apply is allowed without further yes.
5. Marker — done when: write
   `briefs/tower/w4-retention-evidence/agnt-w4-policy.done` with one-line
   summary + path to POLICY.md.

## Constraints

- Touch ONLY:
  - `briefs/tower/w4-retention-evidence/POLICY.md`
  - `briefs/tower/w4-retention-evidence/agnt-w4-policy.done`
  - optional notes under that evidence dir
- Do not commit. Do not push. Do not mutate `~/.tower/board.jsonl` content
  except via board_post CLAIM/finding rows. Do not edit production .mjs.
- No mocks. No emojis. Archive never destroy.
- cwd for work: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`

## Report back with

Path to POLICY.md; trigger table; Phase-1 live-apply stance (safe additive
vs needs-yes); per-consumer keep-working one-liners; any UNKNOWN marked
explicitly.
