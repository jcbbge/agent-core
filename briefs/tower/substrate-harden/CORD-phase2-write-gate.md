# CORD [Tower] — Phase 2: write gate (COMMITTED)

You are Coordinator for Tower. You never implement. Do NOT use emojis.
Spawn via this session's harness path and profiles only — never hardcode
provider, model, or `--kind` in briefs or commands you write for others.

Operator 2026-08-14: Tower must be fixed. Not hoped. Proven.

## Determination already made (do not re-litigate)

Phase 1 GROUND (`PHASE1-GROUND.md`) and Discovery (`DISCOVERY-phase2.md`):
**not a rewrite.** Append and sense already work. The failure is **private done**:
an agent can idle / touch `.done` / get `$verdict` with no `work-done` on the
field. No Stop hook mentions `work-done` (re-verified 2026-08-14). Live
histogram: ~522 claimed / ~148 done.

**This unit is `d-write-gate` only.** Ref-align (`work-done.ref` = available id)
is the first Imagine item inside this unit. No `~/tower` extract. No Fut.
No TraceType expansion. No store rewrite.

## How "operational" will be proven (done-when)

A disposable topic `tower/substrate-harden-probe` (or `tower/write-gate-probe`):

1. Emit `work-available` + `work-claimed` for a dummy unit.
2. Attempt to end/idle **without** `work-done` or `need-help` → **refused**
   (Stop / SubagentStop / idle path — whichever you implement; name it).
3. Emit matching `work-done` (`ref` = available id) → end **allowed**.
4. Repeat with `need-help` instead of done → end **allowed**.
5. Evidence on disk: `briefs/tower/substrate-harden/PHASE2-WRITE-GATE-PROOF.md`
   with the exact commands, hook path, and probe ids.

Until that proof file exists, Tower is **not** operational as a stigmergic
substrate. Mail/board still work; that is not the bar.

## Tasks

1. Brief one ORCH. Partition: (a) ref-align docs+test, (b) the refuse-to-finish
   hook beside `stop-guard.mjs`, (c) proof probe. Verify beat: test-maker ≠
   implementer if you use make; otherwise sonnet impl + separate sonnet verify.
2. Land on a branch in `~/agent-core`. Do not `git add -A`. Do not touch Arc.
3. Board `tower/write-gate`. Banner `===== CORD TOWER GATE =====`.

## Constraints

- Touch: `primitives/mcps/tower/` (hooks, COMMS-ARCH, tests), deployed via
  existing symlinks. State stays in `~/.tower/`.
- Probe topic only for test emits. Do not rewrite live board history.
- Production Neon / Arc / content: out of scope.

## Report

Proof path + hook file + test command + whether `origin`/`main` has the gate
or only a branch.
