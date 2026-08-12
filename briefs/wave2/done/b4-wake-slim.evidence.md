# b4-wake-slim — evidence

Worker: AGNT B4 under orch-phase4-automation
Date: 2026-08-11

## Branch / tip
- Repo: `~/circadian`
- Branch: `wake-slim` (checked out, changes left UNCOMMITTED for ORCH to integrate — brief §Constraints)
- Base tip (`git rev-parse HEAD`): `85ed43bade60f64b7067c7b7bb09a07b7920ee27` (still main's tip; no commits made)
- Working tree on `wake-slim`:
  ```
   M src/wake.test.ts
   M src/wake.ts
  ?? src/wake-payload.ts   (new, import-safe pure core)
  ```
- Tracked diffstat: `src/wake.test.ts +119` / `src/wake.ts +37 -130` (net: buildPayload + pure helpers moved out of the self-executing hook script).

## What changed
1. Extracted the pure, import-safe core of the WAKE injection into `src/wake-payload.ts`:
   `CAP_TOKENS`, `STALE_MS`, `extractLastSleep`, `classifyFleetTier` (+ `FleetTier` type),
   `sliceSelf`, `buildPayload`. `wake.ts` (a SessionStart hook that runs `runHook()` at
   import time and cannot be imported by a test) now imports them — one source of truth.
2. `classifyFleetTier(role|name)` returns the fleet tier (`CORD|ORCH|AGNT|SAGT`) or null.
   `isFleetWorkerPane()` now also returns the detected `tier`.
3. `buildPayload` gained a `slim` flag. When `slim` (executor tiers 3-AGNT/4-SAGT):
   - SELF is replaced by `sliceSelf(self)` — DOCTRINE section only (deterministic cut at the
     second `## ` heading; fails OPEN to full SELF if the shape is unexpected, never drops
     content it cannot bound).
   - The `<mind:user>` block is dropped entirely.
   - Constitution + Josh constitution + NOW + brief-relevant session-evidence are KEPT.
   - The `<mind:fleet-worker>` note is used (greeting mandate already suppressed for fleet).
4. `runHook()` sets `slim = fleet.tier === "AGNT" || fleet.tier === "SAGT"` and passes it to
   `buildPayload`. Kill-switch fail-safe takes precedence (SELF/USER already withheld there),
   so slim is a no-op under kill switch. Orchestrator tiers (1-CORD/2-ORCH) and operator panes
   are byte-identical to before (operator block layout preserved exactly).

## What a 3-AGNT wake now contains vs before
- Before (operator/full, also what AGNT got): constitution + full SELF (Doctrine + Motifs +
  How-we-work) + Josh constitution + full USER + NOW + evidence + greeting/fleet note.
- After (3-AGNT / 4-SAGT slim): constitution + SELF **Doctrine only** + Josh constitution +
  **no USER** + NOW + evidence + fleet-worker note.
- Unchanged: 1-CORD / 2-ORCH and operator panes still receive the full payload.

## Measured size (real mind/ files)
```
operator chars=33629 (~8408 tok)
slim     chars=23184 (~5796 tok)
reduction chars=10445 (31%)   ~2612 tokens saved per AGNT/SAGT wake
```

## Tests
`bun test src/wake.test.ts` — 15 pass / 0 fail (added: classifyFleetTier, sliceSelf,
buildPayload slim path, operator regression guard).

Full suite `bun test` — 463 pass / 0 fail across 21 files (~35s).

Test tail:
```
 15 pass
 0 fail
 45 expect() calls
Ran 15 tests across 1 file.
```
```
 463 pass
 0 fail
 3101 expect() calls
Ran 463 tests across 21 files. [35.31s]
```

## Not done / notes
- No commit, no push, no merge (per brief). `wake-payload.ts` is a new untracked file on the
  branch; ORCH should `git add src/wake-payload.ts src/wake.ts src/wake.test.ts` when integrating.
- The pre-existing untracked `briefs/pending-sleep-selfheal/done/orch-pending-sleep.done` was
  present before this work and is unrelated.
