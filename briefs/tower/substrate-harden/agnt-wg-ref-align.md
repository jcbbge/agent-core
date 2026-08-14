# AGNT brief — unit d-write-gate (shared prefix; your slice is at the tail)

You are an AGNT worker under ORCH `orch-write-gate`, unit **d-write-gate**, on
branch `feat/tower-write-gate` in `/Users/jrg/agent-core`. Do ONLY your slice.
You never commit — integration and commit are ORCH's. No emojis.

## Tower

- Board topic: `tower/write-gate`. FIRST action: post a CLAIM
  (`mcp__tower__board_post`, type=claim, from=your agent name) naming your
  slice and files. Post findings to the same topic during work.
- Never message the operator. Status is not mail. Questions: post a `note`
  prefixed `Q:` to `tower/write-gate`, then continue with everything not
  blocked (nq budget 3).
- LAST action: write your `.done` file (path in your slice) only after every
  done-when condition holds.

## Pre-Verified Facts (ORCH verified 2026-08-14 against source — trust these)

| Fact | Where |
|---|---|
| Pheromone impl (canonical) | `primitives/hooks/tower-ledger.mjs`; `primitives/mcps/tower/lib.mjs` re-exports it (`export * from '../../hooks/tower-ledger.mjs'`) |
| Pheromone file const | `PHEROMONES = process.env.TOWER_PHEROMONES_PATH || ~/.tower/pheromones.jsonl` (tower-ledger.mjs:27; read at import time — set env before spawning a subprocess) |
| Scent TTLs | tower-ledger.mjs:32-37 — work-available 1800s, work-claimed 30s, work-done 86400s, need-help 3600s |
| `emitPheromone(cwd, {...})` | tower-ledger.mjs:159 — requires evidence; payload_ref for available/done; ref for claimed/done |
| Field derivation (pure) | `pheromoneFieldFromRows(cwd, rows, {topic, now})` tower-ledger.mjs:186-222 — an available row is DONE when a work-done row's `ref` equals the **work-available row's id** (doneRefs: lines 192-194, 209-219) |
| Pheromone row shape | `{id, ts, cwd, topic, from, scent, route, ref, payload_ref, evidence, ttl_s}` (ts ISO-8601) |
| cwd scoping | `normCwd()` (exported by lib.mjs) — realpath + git-common-dir collapse |
| Board row shape | `{id, ts, cwd, type, from, topic, body}`; `append(file, obj)` exported by lib.mjs |
| Stop-hook precedent | `primitives/mcps/tower/hooks/stop-guard.mjs` — stdin JSON, exit 0 on `evt.stop_hook_active` (line 24), reason to stderr, exit 2 to block; imports `../lib.mjs` |
| Hook deploy | `~/.tower/hooks/<name>.mjs` is a symlink into `primitives/mcps/tower/hooks/` |
| Tests | `bun test <file>` run from `primitives/mcps/tower/` |
| Oracle header convention | `write-path.test.mjs:1-3`: shebang + `// Oracle tests for ...` + `// Authored from plan/brief only — never from implementation source.` |
| CLI | `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence "text"] [--ttl N] [--from name]` — prints new id on stdout, exit 2 on validation failure; `--from` defaults `$TOWER_FROM` then `cli:$USER` |
| Identity lookup | `herdr agent get "$HERDR_PANE_ID"` → JSON; registration name at `.result.agent.name` (verified live) |

## Gate contract (ORCH-pinned; binding for tests AND implementation)

Hook `primitives/mcps/tower/hooks/write-gate.mjs` (`#!/usr/bin/env bun`,
executable) reads ONE Stop-event JSON object on stdin
(`{"cwd", "session_id", "stop_hook_active", "transcript_path"}`) and exits 0
(allow) or 2 (refuse, reasons on stderr). Evaluation order:

1. `TOWER_WRITE_GATE=off` → exit 0 (kill switch).
2. Unparseable stdin → exit 0.
3. `evt.stop_hook_active` truthy → exit 0 (loop protection).
4. Identity := `$TOWER_FROM` (trimmed, non-empty) else, if `$HERDR_PANE_ID` is
   set, `herdr agent get "$HERDR_PANE_ID"` → `.result.agent.name` (any error ⇒
   unbound). Unbound ⇒ exit 0 (R3).
5. Time floor (epoch ms) := numeric `$TOWER_SESSION_START` else birthtime
   (mtime fallback) of `evt.transcript_path` if that file exists, else
   indeterminable ⇒ exit 0 (R3, never brick).
6. Rows := parse `PHEROMONES` JSONL tolerantly (skip bad lines). Scope: rows
   with `normCwd(row.cwd) === normCwd(evt.cwd ?? process.cwd())`.
7. Outstanding claims := scoped rows, scent `work-claimed`, `from === identity`,
   `ref` non-null, `Date.parse(ts) >= floor` — **TTL ignored** (R2: the 30s
   claim TTL means field-derived claims are always expired at Stop time; the
   gate reads raw rows). Dedupe by `ref`.
8. A claim with ref `R` on topic `T` is RELEASED when either: any scoped
   `work-done` row has `ref === R` (TTL ignored), OR a live (unexpired per
   `ttl_s`, default 3600) `need-help` row exists, scoped, `from === identity`,
   `topic === T`.
9. No outstanding claims, or all released → exit 0.
10. Refusal counting (R4): state file `$TOWER_WRITE_GATE_STATE` else
    `~/.tower/write-gate-state.json`, JSON object keyed
    `"<session_id>:<ref>"` (session_id := `evt.session_id ?? "unknown"`),
    value `{count, bypassed}`.
    - If EVERY unreleased ref already has `count >= 3`: for each not yet
      `bypassed`, append ONE board note (file `$TOWER_BOARD_PATH` else lib
      `BOARD`) shaped `{id, ts, cwd, type:"note", from:"write-gate",
      topic:"tower/write-gate", body:"bypass: agent=<identity> ref=<R>
      session=<session_id> after 3 refusals"}`, mark `bypassed: true`,
      exit 0. Net: attempts 1-3 refuse (exit 2, count 1→2→3); attempt 4+
      allows; exactly one note per (session, ref).
    - Else: increment `count` for each unreleased ref, write stderr, exit 2.
      stderr MUST contain, per unreleased ref: the topic, the ref id, and a
      runnable line containing
      `cli.mjs emit work-done <topic> <payload_ref> --ref <R>`
      (payload_ref: the claim row's payload_ref if present, else the
      placeholder `<artifact-path>`).
11. Any internal error → exit 0 (a gate that bricks the machine is a failed
    gate).

CORD rulings behind this (binding, do not re-litigate): R1 `work-done.ref` =
the work-available id (code already means this; docs are wrong); R2 raw rows,
not the derived field; R3 identity-bound or no-op, plus session time floor;
R4 release conditions, 3-refusal audited bypass, `TOWER_WRITE_GATE=off` kill
switch, internal-error ⇒ allow.

---

## YOUR SLICE — A: ref alignment (docs + derivation-pinning test)

Agent name: `agnt-wg-ref-align`. Files you own (nobody else touches them):
- `primitives/mcps/tower/COMMS-ARCH.md`
- `primitives/mcps/tower/ref-align.test.mjs` (new)

Context: of 148 live `work-done` rows, 126 ref a `work-available` id, 9 ref a
`work-claimed` row id, 13 ref neither. The code (doneRefs, above) already
means the available id. The docs say the opposite in places. Fix the docs.

### Task A1 — COMMS-ARCH.md correction
`grep -n "work-done" primitives/mcps/tower/COMMS-ARCH.md` currently hits lines
55, 78-79, 86, 92, 148, 181 (ORCH ran this 2026-08-14). Line 79 reads
"`work-done` `ref`-ing the claim" — WRONG. Line 181-182 says claimed and done
"carry `ref` to the exact ..." — read it and correct if it names the claim.
Audit every hit plus line 140 context. After your edit exactly ONE meaning
survives everywhere: **`work-done.ref` = the `work-available` id, and
`work-claimed.ref` = the `work-available` id** (both already true in code).
Done-when: `grep -n "work-done" primitives/mcps/tower/COMMS-ARCH.md` shows no
claim-ref phrasing anywhere.

### Task A2 — identity-card paragraph (d-identity-card)
In the stigmergic-field section of COMMS-ARCH.md (near the scent/TTL text,
lines ~55-92), add a short identity-card paragraph defining:
`work_item_id` = the `work-available` pheromone id · `agent_id` = the
pheromone `from` field · `payload_ref` = brief/artifact path.
Done-when: the paragraph exists and uses those three exact terms.

### Task A3 — derivation-pinning test
New file `primitives/mcps/tower/ref-align.test.mjs`, oracle header per the
convention above. Import `pheromoneFieldFromRows` from `./lib.mjs`. Synthetic
rows only — the function is pure; NO file writes, no env changes, no live
`~/.tower` access. Use one fixed cwd string (e.g. `/tmp`) on rows and call.
Assert both directions:
- an available row lands in `done` when a `work-done` row's `ref` is the
  **available id**;
- it does NOT land in `done` when the `work-done` refs the **claim row's id**
  (pass `now` so the claim is live and the row lands in `claimed` instead).
Done-when: `cd primitives/mcps/tower && bun test ref-align.test.mjs` is green.

### Report back with (board finding on `tower/write-gate`, then .done)
1. Exact lines changed in COMMS-ARCH.md (numbers + one-line summary each).
2. The clean `grep -n "work-done"` output.
3. The `bun test ref-align.test.mjs` result line verbatim.
Then write `briefs/tower/substrate-harden/agnt-wg-ref-align.done` (one line:
ISO timestamp + "done"). Do not commit anything.
