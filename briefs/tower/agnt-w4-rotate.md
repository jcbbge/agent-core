# AGNT [w4-rotate] — Implement Tower Phase-1 rotation (archive, never destroy)

Model tier: top (rotate correctness + cursor boundary; expensive if wrong).

Implement `rotate.mjs` and tower-ledger archive awareness per
`briefs/tower/w4-retention-evidence/POLICY.md`. Prove on a disposable copy.
Do NOT use emojis. Do NOT commit. Do NOT push. Do NOT Phase-2 truncate live.

This brief is the PLAN for `cursor-fleet make w4-rotate` (coder ∥ test-maker).

## Pre-Verified Facts (ORCH verified 2026-08-13)

- POLICY (authoritative):  
  `/Users/jrg/.spine/worktrees/agent-core/w4-retention/briefs/tower/w4-retention-evidence/POLICY.md`  
  (mirrored at `~/agent-core/briefs/tower/w4-retention-evidence/POLICY.md`).  
  Phase-1 = additive prefix copy + manifest + cursor metadata; live file size
  unchanged. Phase-2 truncate/swap = BLOCKED without `TOWER_ROTATE_PHASE2_OK=1`
  and concierge/CORD yes.
- Worktree (coder + tests land here via make forks): base  
  `/Users/jrg/.spine/worktrees/agent-core/w4-retention` branch `orch/w4-retention`
  @ `01b1956` (+ POLICY evidence). Main `~/agent-core` serves live symlinks —
  do not `git checkout` it away from its tip.
- Canonical cursor/ledger: `primitives/hooks/tower-ledger.mjs`  
  (`lib.mjs` re-exports). Existing: `withCursorLock`, `readTailBytes`,
  `cursorValid` (invalidates when `st.size < cursor.offset`),
  `syncLedgerInboxCursor`, `syncBoardScopeCursor`, cursors under
  `~/.tower/cursors/`.
- Live sizes (approx; remeasure in proof): board ~4.2MB/6900 lines;
  ledger ~1.1MB/2700; odometer ~281KB; flight ~3.8MB; deliverables ~1.9MB;
  pheromones tiny → DEFER per POLICY.
- Fence vs w3-plane-fixes: they own `server.mjs` + `cli.mjs` board filter.
  **Do not edit** `cli.mjs` or `server.mjs`. Prefer new  
  `primitives/mcps/tower/rotate.mjs` (+ tests beside it) and helpers in
  `tower-ledger.mjs`. Optional symlink note for `~/.tower/rotate.mjs` in
  evidence (deploy is CORD/ops; document the symlink command, do not mutate
  live `~/.tower` code links without ORCH).
- Proof root: worktree  
  `briefs/tower/w4-retention-evidence/rotate-proofs/<stamp>/` or  
  `/tmp/tower-rotate-proof-<stamp>/`. No mocks — real copied JSONL.
- Topics: `tower/w4-retention`. Done markers under evidence dir.

## Parallel Work Notice

ORCH w3-plane-fixes edits `server.mjs`/`cli.mjs` — ignore those diffs.
CORD bus-data owns board repair — do not rewrite board rows.
Read board topic `tower/w4-retention` before claiming files.

## Tower (mid-run communication)

- CLAIM first: topic `tower/w4-retention`, type=claim, from=AGNT w4-rotate
  (coder) / AGNT w4-rotate-tests (test-maker).
- Findings: proof paths, sha256s, dry-run results (specific numbers).
- No operator mail. spine-report task/verdict on Herdr.

## Partition map (disjoint)

| Role | Owns |
|------|------|
| **coder (Implementer)** | `primitives/mcps/tower/rotate.mjs` (new); archive helpers + cursor archive fields in `primitives/hooks/tower-ledger.mjs` only as needed for Phase-1 read-across; evidence `rotate-proofs/` + `IMPLEMENT.md` under `briefs/tower/w4-retention-evidence/`; optional `DEPLOY-ROTATE.md` with symlink instructions. Must NOT edit test files. |
| **test-maker** | `primitives/mcps/tower/rotate.test.mjs` (new) and/or `primitives/hooks/tower-rotate.criteria.md`; derives tests from this PLAN/POLICY only — never reads coder output. Must NOT edit rotate.mjs or production ledger beyond test fixtures under evidence/tmp. |

## Tasks (shared intent — coder implements, test-maker tests)

1. **rotate.mjs** — done when: script exists at
   `primitives/mcps/tower/rotate.mjs` supporting at minimum:
   `--store board|ledger|odometer|flight|deliverables|all`,
   `--dry-run`, `--phase 1|2` (phase 2 refuses without env
   `TOWER_ROTATE_PHASE2_OK=1`), `--evidence-dir`, lock at
   `~/.tower/cursors/rotate.lock` (or `TOWER_HOME`-relative), Phase-1
   copies aged/size-triggered prefix into
   `archive/<store>/<store>-<stamp>.jsonl` (dirs → `archive/<store>/YYYY-MM/`),
   appends `archive/manifest.jsonl`, never deletes archive content.
2. **Ledger helpers** — done when: Phase-1 readers can honor
   `archivePath` + `archivedByteEnd` (or equivalent documented in POLICY §3)
   without a second cursor system; full-read fallback concatenates
   archive+active; Phase-1 leaves active file bytes unchanged.
3. **Proof-on-copy** — done when: evidence dir contains `PROOF.md` with
   commands run, sha256 of archive segment, line counts, and a real dry-run
   + apply against a **copy** of board (and ledger if touched) under
   evidence or `/tmp` — EXIT 0; no mocks.
4. **Tests** — done when: automated tests (no mocks) cover dry-run
   no-write, Phase-1 archive completeness (prefix bytes match),
   Phase-2 refusal without env, lock contention refuse, never-destroy
   (archive exists after rotate). Tests run via `bun test` on the
   test path.
5. **Markers** — done when: coder writes
   `briefs/tower/w4-retention-evidence/agnt-w4-rotate.done`; test-maker
   writes `…/agnt-w4-rotate-tests.done` (or make finisher consolidates —
   if using make finisher, follow its markers).

## Constraints

- Archive never destroy. No board.jsonl repair. No writer authorship changes.
- No Phase-2 live apply. No push. No commit.
- Prefer `TOWER_HOME` env override so proof copies work without touching live
  `~/.tower` state files during tests/proof.
- Match surrounding code style (plain node:fs, bun-runnable .mjs).
- Pheromones: defer (POLICY) — rotate may no-op with message.

## Report back with

Paths created/modified; `bun test` tails; PROOF.md path; sha256s; dry-run
command that ORCH can re-run; whether Phase-1 live apply is ready (yes/no +
why); deviations with reasons.
