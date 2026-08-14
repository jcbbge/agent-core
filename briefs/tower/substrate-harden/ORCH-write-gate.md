# ORCH [tower-write-gate] — d-write-gate (COMMITTED unit)

You are ORCHESTRATOR for exactly one committed unit: **the Tower write gate**.
You decompose, dispatch, verify, reap. **You never implement.** No emojis.

Branch: `feat/tower-write-gate` (already cut in `/Users/jrg/agent-core`).
Board topic: `tower/write-gate`. Banner in every report: `===== ORCH WRITE GATE =====`.
Fleet: you = fable. AGNT workers = claude/sonnet (`--profile coder`).

---

## The one thing

**"Done" is currently a private event.** An agent can idle, touch `.done`, get a
sidebar verdict — and the pheromone field never sees `work-done`. Live histogram
(measured 2026-08-14 from `~/.tower/pheromones.jsonl`, 795 rows):
`work-available` 110 · `work-claimed` **522** · `work-done` **148** · `need-help` 15.

No Stop hook mentions `work-done` (re-verified 2026-08-14 against
`~/.claude/settings.json`; Stop hooks are: `afplay`, `stop-guard.mjs`, superset
notify, `herdr-task-report.sh done`, `stop-verdict.mjs`, `ask-bridge.mjs sweep`).

This unit makes finish-without-deposit **mechanically refused**, and proves it.

---

## Pre-Verified Facts (CORD verified these 2026-08-14 — do not re-derive)

### Code paths

| Fact | Location |
|---|---|
| Pheromone impl (canonical) | `/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs` |
| `~/.tower/lib.mjs` re-exports it | `primitives/mcps/tower/lib.mjs` (`export * from '../../hooks/tower-ledger.mjs'`) |
| Scent enum + TTLs | `tower-ledger.mjs:32-37` — `work-available` 1800s, **`work-claimed` 30s**, `work-done` 86400s, `need-help` 3600s |
| `emitPheromone` | `tower-ledger.mjs:159` — validates scent, requires `evidence`; `payload_ref` required for available/done; `ref` required for claimed/done |
| Field derivation | `pheromoneFieldFromRows` `tower-ledger.mjs:186-222` |
| Pheromone file path | `PHEROMONES` `tower-ledger.mjs:27` — overridable via **`TOWER_PHEROMONES_PATH`** env (this is your test isolation lever) |
| Field scoping | by `normCwd(row.cwd)` then optional `topic` |
| Existing Stop hook precedent | `primitives/mcps/tower/hooks/stop-guard.mjs` — reads stdin JSON, `exit 0` if `evt.stop_hook_active`, writes reason to **stderr**, `exit 2` to block |
| Hook deploy mechanism | `~/.tower/hooks/<name>.mjs` is a **symlink** into `primitives/mcps/tower/hooks/` |
| Test convention | `bun test <file>` from `primitives/mcps/tower/`; oracle header style in `write-path.test.mjs:1-3` ("Authored from plan/brief only — never from implementation source") |
| Criteria convention | `<unit>.criteria.md` beside `<unit>.test.mjs` (see `write-path.criteria.md`, `flock-integrity.criteria.md`) |

### CLI surface (verified)

```
bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence "text"] [--ttl N] [--from name]
bun ~/.tower/cli.mjs field --topic <topic> [--json]
bun ~/.tower/cli.mjs scan  --topic <topic> [--json]
```
`emit` prints the new pheromone id on stdout, exits 2 with a message on validation failure.
`--from` defaults to `$TOWER_FROM` then `cli:$USER`.

### The ref fork (measured, not assumed)

Of 148 live `work-done` rows: **126** ref a `work-available` id, 9 ref a
`work-claimed` row id, 13 ref neither.
`pheromoneFieldFromRows` completes work when `doneRefs.has(available.id)`
(`tower-ledger.mjs:192-194, 209-219`) — i.e. **the code already means the
available id.** `COMMS-ARCH.md:79` says the opposite ("`work-done` `ref`-ing the
claim"). Code + live majority win.

### Fleet

- Spawn: `python3 ~/herdr-spine/bin/spine-spawn worker --label <label> --brief <path> --kind claude --profile coder` (AGNT = sonnet via `coder.kind_models.claude`).
- `spine-spawn verify-mark <brief> [--criteria <file>]` / `verify-status <brief>` record + check that test criteria were authored before implementation.
- `--model fable` is a valid Claude CLI alias (verified live this session).

---

## Binding design rulings (CORD decided — implement these, do not re-litigate)

These four exist because the obvious implementation of this gate is a **no-op or a
machine-brick**. Both failure modes are already paid for.

**R1 — `work-done.ref` = the `work-available` id.**
Fix the *docs*, not the code. `COMMS-ARCH.md:79` (and check `:181-182`) must say
the available id. Add one test pinning the derivation.

**R2 — The gate MUST NOT trigger off live claims.**
`work-claimed` TTL is **30 seconds**. At Stop time the claim is essentially always
expired, so a gate keyed on `pheromoneField().claimed` would silently never fire.
The gate reads **raw rows** and treats a claim as *outstanding* regardless of TTL.

**R3 — Identity binding is mandatory; no identity means no gate.**
The gate considers only claims bound to **this** agent, or it exits 0.
Binding key is the pheromone `from` field. Resolution order:
`$TOWER_FROM` → herdr agent name for `$HERDR_PANE_ID` → **unbound ⇒ `exit 0`**.
Additionally apply a **time floor**: ignore claims older than this session's start.
Rationale: 522 dangling `work-claimed` rows exist on `/Users/jrg/agent-core`. A
cwd-scoped gate without R3 blocks every session in this repo forever, including
CORD's. **A gate that bricks the machine is a failed gate, not a strict one.**

**R4 — Release conditions, loop protection, audited bypass, kill switch.**
Stop is **allowed** when, for every outstanding claim `ref = R` bound to this agent
(same cwd + topic scope):
- a `work-done` row exists with `ref === R`, **or**
- a live `need-help` row from this agent exists on that topic.

Otherwise refuse: write the specific missing deposits to **stderr** with the exact
`cli.mjs emit` command to run, and `exit 2`.
- Honor `evt.stop_hook_active` the way `stop-guard.mjs:24` does.
- Refusal is **not** infinite: after **3** refusals for the same
  (session, ref) — counted in `~/.tower/write-gate-state.json` — allow the stop
  and append a `note` to board topic `tower/write-gate` recording the bypass
  (agent, ref, session id). Pressure, with an audited escape.
- Kill switch: `TOWER_WRITE_GATE=off` ⇒ `exit 0` immediately. Document it.
- Never brick the harness: any internal error ⇒ `exit 0`.

---

## Scope

**Touch:** `primitives/mcps/tower/` (new `hooks/write-gate.mjs`, criteria, tests,
`COMMS-ARCH.md`) and the `~/.tower/hooks/` symlink. State stays in `~/.tower/`.

**Do NOT touch:** `~/.claude/settings.json` (global Stop registration is the
operator's gate, not this unit's), the live board history, Arc, content,
production Neon, `~/tower` extraction, Fut, RuntimeAdapter, TraceType expansion,
the store, or the 30s claim TTL (that is `d-claim-ttl`, a *later* unit — if the
probe shows the TTL is the blocker, report it, do not fix it).

---

## Partition — four AGNTs, one verify beat

Write each worker brief to `briefs/tower/substrate-harden/` before spawning.
Each worker: CLAIM-first on `tower/write-gate`, findings to the board,
`.done` file last. Reap when done.

### Slice A — `agnt-wg-ref-align` (sonnet, docs + test)
Files: `primitives/mcps/tower/COMMS-ARCH.md`, one new/extended test.
1. Correct `COMMS-ARCH.md:79` and audit `:140`, `:181-182` so exactly one meaning
   survives: `work-done.ref` = the `work-available` id. `work-claimed.ref` is
   also the available id (already true in code).
2. Add the identity-card paragraph (d-identity-card): `work_item_id` =
   `work-available` id · `agent_id` = `from` · `payload_ref` = brief/artifact path.
3. One test asserting `pheromoneFieldFromRows` moves an available row to `done`
   when a `work-done` refs the **available** id, and does **not** when it refs the
   claim row id. Use synthetic rows (the function is pure) — no live file writes.
Done-when: `bun test` green; `grep -n "work-done" COMMS-ARCH.md` shows no
claim-ref phrasing left.

### Slice B1 — `agnt-wg-criteria` (sonnet, TEST-MAKER — must run BEFORE B2)
Files: `primitives/mcps/tower/write-gate.criteria.md` + `write-gate.test.mjs`.
Authored **from this brief only.** `hooks/write-gate.mjs` must not exist yet, and
this worker must never read it. Header the test file with the oracle line from
`write-path.test.mjs:1-3`.
Must cover, at minimum:
- refuses (exit 2) with outstanding bound claim, no done, no help
- allows (exit 0) once a `work-done` refs the available id
- allows (exit 0) with a live `need-help` instead
- allows (exit 0) when identity is unbound (R3)
- allows (exit 0) when `stop_hook_active` is true
- allows (exit 0) with `TOWER_WRITE_GATE=off`
- ignores claims older than the session time floor (R3)
- ignores claims belonging to a different `from` (R3)
- refusal count reaches 3 ⇒ allow + board bypass note (R4)
- stderr on refusal names the topic, the ref, and a runnable `emit` command
Isolation: set `TOWER_PHEROMONES_PATH` to a temp file per test. **No test may
write to the real `~/.tower/pheromones.jsonl` or `board.jsonl`.**
Done-when: criteria file exists, tests exist and **fail** (no implementation yet),
`spine-spawn verify-mark` recorded with `--criteria write-gate.criteria.md`.

### Slice B2 — `agnt-wg-impl` (sonnet, IMPLEMENTER — different agent from B1)
File: `primitives/mcps/tower/hooks/write-gate.mjs` (+ the `~/.tower/hooks/` symlink).
Implement R2/R3/R4 until B1's tests are green. **Do not edit the test file.** If a
test looks wrong, post the disagreement to `tower/write-gate` and let ORCH arbitrate.
Done-when: `bun test write-gate.test.mjs` fully green; hook is executable;
`ls -l ~/.tower/hooks/write-gate.mjs` shows the symlink into the repo.

### Slice C — `agnt-wg-probe` (sonnet, proof)
Runs only after A and B2 are green.
Probe topic: **`tower/write-gate-probe`**. Real emits to the real pheromone file
are fine on this topic (it is disposable); **no rewriting of existing history.**
Execute the operator's five steps and record every command verbatim:
1. `emit work-available tower/write-gate-probe <payload_ref>` → capture id `A`.
2. `emit work-claimed tower/write-gate-probe x --ref A` → capture id `C`.
3. Feed a real Stop event JSON on stdin to `~/.tower/hooks/write-gate.mjs`
   (`{"cwd":"/Users/jrg/agent-core","session_id":"...","stop_hook_active":false}`)
   with the probe identity bound → **must exit 2**; capture stderr verbatim.
4. `emit work-done tower/write-gate-probe <payload_ref> --ref A` → re-run the hook
   → **must exit 0**.
5. Repeat 1-3 with a fresh available id, then `emit need-help` instead of done →
   **must exit 0**.
Write `briefs/tower/substrate-harden/PHASE2-WRITE-GATE-PROOF.md` containing: the
hook path, every exact command, every probe id, every exit code, the verbatim
refusal stderr, and the `bun test` command + result line.
**Also record, honestly, that the gate is not registered in
`~/.claude/settings.json` — the proof is the hook contract under a real Stop
payload, not a live pane refusal.** State that plainly; do not imply more.

---

## Verify beat

B1 (test-maker) and B2 (implementer) are **different agents**. B1 finishes and is
reaped before B2 spawns. Use `spine-spawn verify-mark` / `verify-status` so the
ordering is on the record. You arbitrate disagreements; you do not write code or
tests yourself.

---

## Land

- Branch `feat/tower-write-gate` in `/Users/jrg/agent-core`. **Never `git add -A`.**
  Stage only: `primitives/mcps/tower/hooks/write-gate.mjs`,
  `primitives/mcps/tower/write-gate.criteria.md`,
  `primitives/mcps/tower/write-gate.test.mjs`,
  `primitives/mcps/tower/COMMS-ARCH.md`, the ref-align test,
  and `briefs/tower/substrate-harden/*.md`.
- `primitives/profiles/models.json` also carries an **unrelated uncommitted change
  from a prior session** plus CORD's one-line `"fable": "fable"` addition. **Do not
  commit that file.** Leave it dirty.
- Commit format per `~/.claude/CLAUDE.md` (PHASE / DONE / TODO / BLOCKED,
  `Co-Authored-By:`). Do not push, do not merge to main — CORD reports branch state
  to the operator.

## Report back to CORD (`cord-tower`, board topic `tower/write-gate`)

Banner, then:
1. Proof file path.
2. Hook file path + whether the `~/.tower/hooks/` symlink is live.
3. Exact test command and its pass/fail line.
4. Branch name + commit sha(s); confirm `main` does **not** have the gate.
5. Anything you refused to do and why. If the 30s claim TTL bit during the probe,
   say so — that is evidence for the next unit, not a defect to fix here.
