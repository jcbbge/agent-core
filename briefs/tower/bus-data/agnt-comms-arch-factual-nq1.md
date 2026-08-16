# AGNT [comms-arch-factual-nq1] — bounce: apply factual sync on CURRENT main COMMS-ARCH

Repo `/Users/jrg/agent-core`. Prior coder worktree forked before `b20f63a` (Plane 5 stigmergy) and overwrote the whole file — REJECTED at ORCH Verify. Re-apply ONLY the factual flock/schema fixes onto the current file. Do NOT use emojis. Do not commit. Do not delete Plane 5 / nQ sections.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Work in: `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals` (branch `tower/bus-data-residuals`) OR a fresh make worktree from current `main` — current COMMS-ARCH is **318 lines** and MUST keep `### Plane 5 — stigmergic coordination`.
- Live stale language on CURRENT file (line numbers after Plane 5 land):
  - ~L278–279: "there is still no kernel lock on the file itself"
  - ~L292: "No file lock on append — concurrent writers may interleave lines"
  - Machine-emission table still examples `bypass-audit` without naming `verify-gate-bypass`
- Target wording (from prior accepted intent — do not invent beyond this):
  - Hand-append banned; sanctioned writes use flocked `append()` in `tower-ledger.mjs` (`LOCK_EX` + lockfile fallback).
  - Machine kind examples include `verify-gate-bypass` (and may keep `bypass-audit`); readers `from ?? '?'`.
  - Exclusive lock on write path; hand-append / bare `appendFileSync` remain banned; cursor locks for read cursors only.
- §JSONL consumer integrity must remain intact. Plane 5 + Concierge exception + nQ-on-field must remain byte-stable except if a line-number shift from the small edits above.

## Parallel Work Notice

- T1+T2 already integrated on `tower/bus-data-residuals` — do not touch `statem.ts`/`twr.ts`.
- Ignore unrelated dirty tree.

## Tower

- Topic `tower/bus-data`, from=`AGNT comms-arch-factual-nq1`.
- Finding `to: CORD tower` for co-sign after edit. Claim/heartbeat `ph-mss6xnwh-wkn4`. Never hand-append board.jsonl.

## Tasks

1. Edit ONLY the stale flock/schema sentences on CURRENT `primitives/mcps/tower/COMMS-ARCH.md`. — done when: no "no kernel lock" / "No file lock on append" lies; `verify-gate-bypass` named; Plane 5 section still present (`rg -n 'Plane 5'`); file length stays ~318 (±10 for wording), not ~224.
2. Update `briefs/tower/bus-data/COMMS-ARCH-FACTUAL-PROOF.md` with before/after on CURRENT lines + proof that Plane 5 survived (`rg` output).
3. Write/overwrite `briefs/tower/bus-data/agnt-comms-arch-factual.done`.
4. Board finding starting `to: CORD tower`.

## Constraints

- Touch ONLY: `primitives/mcps/tower/COMMS-ARCH.md`, `briefs/tower/bus-data/COMMS-ARCH-FACTUAL-PROOF.md`, `briefs/tower/bus-data/agnt-comms-arch-factual.done`.
- Prefer editing in `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals` so integration lands on the unit branch. Do not commit.

## Report back with

- `wc -l` + `rg -n 'Plane 5|no kernel|No file lock|verify-gate-bypass|LOCK_EX'`
- finding id
- `.done` path
