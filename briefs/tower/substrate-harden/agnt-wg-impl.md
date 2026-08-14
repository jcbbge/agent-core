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

## YOUR SLICE — B2: implementation (IMPLEMENTER)

Agent name: `agnt-wg-impl`. File you own:
- `primitives/mcps/tower/hooks/write-gate.mjs` (new)

You are spawned in an isolated spine git worktree (a filesystem wall between
you and the test author's checkout — deliberate). Work entirely inside your
spawn cwd with RELATIVE paths; ORCH integrates your file back into the main
checkout and deploys the `~/.tower/hooks/` symlink. Do NOT touch
`/Users/jrg/agent-core` directly and do NOT create any `~/.tower` symlink.

The oracle tests already exist in your checkout:
`primitives/mcps/tower/write-gate.test.mjs` with `write-gate.criteria.md`
beside it, authored by a different agent from this same contract before you
existed. **You must not edit either file.** If a test contradicts the
contract above, post the disagreement as a `Q:` note to `tower/write-gate`
with the test name and both readings, skip nothing else, and let ORCH
arbitrate.

### Task B2-1 — implement the hook
Write `hooks/write-gate.mjs` implementing the contract exactly. Guidance:
- Model the file on `hooks/stop-guard.mjs` (stdin read loop, top-level
  structure). Import `{ PHEROMONES, BOARD, normCwd, append }` from
  `../lib.mjs` — the deployed symlink resolves to the repo file, so the
  relative import holds in both locations.
- Wrap the whole evaluation after arg parsing in try/catch → `process.exit(0)`
  on any throw (contract line 11). The kill switch, stdin parse, and
  `stop_hook_active` checks come first.
- Identity lookup subprocess: `execFileSync('herdr', ['agent','get',
  process.env.HERDR_PANE_ID], ...)` inside its own try/catch; parse
  `.result.agent.name`; empty/missing ⇒ unbound.
- Board note id: reuse the lib `id()` export if exported, else inline a
  `t-<base36>` generator matching the shape in the facts table.
- `chmod +x` the file.

### Done-when (all must hold, in YOUR checkout)
1. `cd primitives/mcps/tower && bun test write-gate.test.mjs` fully green —
   capture the summary line verbatim.
2. `test -x primitives/mcps/tower/hooks/write-gate.mjs` succeeds.
3. `bun test` (full suite in `primitives/mcps/tower/`) has no NEW failures
   versus before your change (run it; if a pre-existing failure exists,
   record it as pre-existing with the test name).
4. `git status --porcelain` in your checkout shows ONLY
   `primitives/mcps/tower/hooks/write-gate.mjs` (plus your `.done`) — the
   test and criteria files unmodified.

### Report back with (board finding on `tower/write-gate`, then .done)
1. Absolute path of your checkout + the hook file inside it.
2. Green `bun test write-gate.test.mjs` summary line verbatim.
3. Full-suite result line + any pre-existing failures noted.
4. Any test you believe wrong (as `Q:` note, separately).
Then write `briefs/tower/substrate-harden/agnt-wg-impl.done` in YOUR checkout
(one line: ISO timestamp + "done"). Do not commit anything.
