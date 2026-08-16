# AGNT [comms-arch-factual] — COMMS-ARCH flock + machine-kind sync (T3)

Repo `/Users/jrg/agent-core`. Fix stale append-lock language and name live machine kind `verify-gate-bypass`. Do NOT use emojis. Docs-only. No commit. No compaction. Do not weaken §JSONL consumer integrity.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Canonical file: `/Users/jrg/agent-core/primitives/mcps/tower/COMMS-ARCH.md` (live `~/.tower/COMMS-ARCH.md` is a symlink to it).
- L182–183 still say: hand-append banned but "there is still no kernel lock on the file itself" — STALE. Live `append()` in `primitives/hooks/tower-ledger.mjs` uses `LOCK_EX` (flock) with lockfile fallback.
- L196–197 still say: "No file lock on append — concurrent writers may interleave lines" — STALE vs flocked `append()`.
- Machine-emission table L192 still examples `bypass-audit`; live cursor-shim emits `verify-gate-bypass` (keep readers on `from ?? '?'`).
- §JSONL consumer integrity (from L199) is correct doctrine from W2 — leave its requirements intact; only fix flock/schema example language above.
- Field WA `ph-mss6xnwh-wkn4` (payload COMMS-ARCH; route hint CORD tower). Claim/heartbeat it; post board finding `to: CORD tower` for co-sign after edit.

## Parallel Work Notice

- Sibling make unit owns `statem.ts` + `twr.ts` — do not touch those.
- Spine twin WA and cursor-shim printf WA are out of fence.
- Ignore unrelated dirty tree.

## Tower

- Topic `tower/bus-data`, from=`AGNT comms-arch-factual`.
- CLAIM first; finding to CORD tower for co-sign; `.done` last. Never hand-append board.jsonl.
- Field: claim/heartbeat `ph-mss6xnwh-wkn4`; work-done with ref + evidence when done.

## Tasks

1. Correct L182–183 and L196–197 (and any duplicate "no file/kernel lock on append" nearby) so doctrine matches flocked `append()` — exclusive lock on write path; hand-append still banned; cursor locks for read cursors remain as stated if still accurate. — done when: those claims no longer deny flock; wording matches live ledger.
2. Extend machine-emission examples to name `verify-gate-bypass` (cursor-shim) alongside or instead of sole `bypass-audit` example. Readers keep `from ?? '?'`. — done when: COMMS-ARCH names `verify-gate-bypass`.
3. Board finding body must start with `to: CORD tower` asking co-sign of the factual sync (flock truth + verify-gate-bypass name). Do not weaken consumer integrity section.
4. Write `briefs/tower/bus-data/COMMS-ARCH-FACTUAL-PROOF.md` (before/after quotes + paths).
5. Write `briefs/tower/bus-data/agnt-comms-arch-factual.done`.

## Constraints

- Touch ONLY: `primitives/mcps/tower/COMMS-ARCH.md`, `briefs/tower/bus-data/COMMS-ARCH-FACTUAL-PROOF.md`, `briefs/tower/bus-data/agnt-comms-arch-factual.done`. Do not commit.

## Report back with

- exact line changes summary
- finding id / confirmation posted
- field work-done ref
- `.done` path
