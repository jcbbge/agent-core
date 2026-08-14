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

## YOUR SLICE — B1: criteria + oracle tests (TEST-MAKER)

Agent name: `agnt-wg-criteria`. Files you own:
- `primitives/mcps/tower/write-gate.criteria.md` (new)
- `primitives/mcps/tower/write-gate.test.mjs` (new)

**Hard constraint:** `primitives/mcps/tower/hooks/write-gate.mjs` does not
exist (ORCH verified 2026-08-14) and you must NEVER create it or read any
implementation of it. Author both files from THIS BRIEF ONLY. Header the test
file with the oracle convention (shebang, `// Oracle tests for the Tower
write gate (d-write-gate).`, `// Authored from plan/brief only — never from
implementation source.`).

### Task B1-1 — criteria file
`write-gate.criteria.md` beside the test (convention: see
`write-path.criteria.md`, `flock-integrity.criteria.md` for tone). List every
behavior below as a numbered criterion with its exit-code expectation.

### Task B1-2 — oracle tests
Test mechanics (pinned):
- Run the hook as a **subprocess**:
  `Bun.spawnSync(["bun", "hooks/write-gate.mjs"], { stdin: Buffer.from(JSON.stringify(evt)), env: {...}, cwd: <tower dir> })`
  and assert on `.exitCode` and `.stderr`.
- Per test: `mkdtempSync` a temp dir; point `TOWER_PHEROMONES_PATH`,
  `TOWER_WRITE_GATE_STATE`, `TOWER_BOARD_PATH` at files inside it. Build env
  explicitly (start from a copy of `process.env`, then delete
  `HERDR_PANE_ID`, `TOWER_FROM`, `TOWER_SESSION_START`, `TOWER_WRITE_GATE`
  and set only what the case needs) so no test inherits this pane's identity.
  **No test may touch the real `~/.tower/pheromones.jsonl`, `board.jsonl`, or
  `write-gate-state.json`.**
- Seed pheromone rows by writing JSONL lines directly in the row shape from
  the facts table. Use the temp dir itself as the `cwd` on every row AND in
  `evt.cwd` (it is a real dir, not a git repo, so `normCwd` reduces to
  realpath on both sides and they match).
- Set `TOWER_FROM=probe-agent` and `TOWER_SESSION_START=<epoch ms before the
  seeded claim ts>` in the standard cases.
- Clean up temp dirs (`rmSync(dir, {recursive: true, force: true})`).

Required coverage (one test each, minimum):
1. Outstanding bound claim, no done, no help → exit 2.
2. Same, plus a `work-done` row with `ref` = the available id → exit 0.
3. Same as 1, plus a live `need-help` from the same identity on the claim's
   topic → exit 0.
4. Identity unbound (no TOWER_FROM, no HERDR_PANE_ID) → exit 0 even with an
   outstanding claim.
5. `stop_hook_active: true` → exit 0 even with an outstanding claim.
6. `TOWER_WRITE_GATE=off` → exit 0 even with an outstanding claim.
7. Claim ts older than `TOWER_SESSION_START` → exit 0 (time floor).
8. Claim `from` is a different agent → exit 0.
9. Refusal loop: run the hook 4 times against the same unreleased claim and
   same `session_id`. Runs 1-3 exit 2; run 4 exits 0 AND exactly one line
   whose body contains `bypass:` (with the agent, ref, and session id) was
   appended to the `TOWER_BOARD_PATH` file. A 5th run exits 0 without adding
   a second bypass line.
10. On refusal, stderr contains: the claim's topic, the ref id, and the
    substring `cli.mjs emit work-done`.
11. Claim expired by TTL (ts 60s ago, ttl_s 30) but inside the time floor →
    still exit 2 (R2: TTL ignored for claims).
12. A `work-done` refing the CLAIM ROW's id (not the available id) does NOT
    release → exit 2.

Done-when (all must hold):
- Both files exist; criteria numbered and complete.
- `cd primitives/mcps/tower && bun test write-gate.test.mjs` runs and **fails**
  (the hook does not exist yet — failures are expected and are the point).
  Capture the fail-count line.
- You never created `hooks/write-gate.mjs`.

### Report back with (board finding on `tower/write-gate`, then .done)
1. Both file paths.
2. The failing `bun test write-gate.test.mjs` summary line verbatim.
3. Criterion count.
Then write `briefs/tower/substrate-harden/agnt-wg-criteria.done` (one line:
ISO timestamp + "done"). Do not commit anything.
