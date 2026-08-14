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

## YOUR SLICE — C: live probe + proof document

Agent name: `agnt-wg-probe`. File you own:
- `briefs/tower/substrate-harden/PHASE2-WRITE-GATE-PROOF.md` (new)

Preconditions (ORCH confirmed before spawning you): slices A and B2 are done —
`~/.tower/hooks/write-gate.mjs` symlink is live and
`bun test write-gate.test.mjs` is green.

Probe rules:
- Probe topic: **`tower/write-gate-probe`** only. Real emits to the real
  pheromone file are FINE on this topic (it is disposable). **Never rewrite or
  delete existing history in any `~/.tower/*.jsonl`.**
- Run everything from `/Users/jrg/agent-core` so row cwd matches `evt.cwd`.
- Bind a probe identity and floor for every hook invocation AND every emit:
  `export TOWER_FROM=agnt-wg-probe` and set `TOWER_SESSION_START` once, before
  your first emit, to a past value:
  `export TOWER_SESSION_START=$(( $(date +%s) * 1000 - 60000 ))`.
- Point the state file away from the real one:
  `export TOWER_WRITE_GATE_STATE=$(mktemp -d)/write-gate-state.json`.
  Do NOT set TOWER_PHEROMONES_PATH or TOWER_BOARD_PATH — the probe is against
  the real files on the disposable topic.
- Hook invocation pattern (capture exit code and stderr verbatim):
  `echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-1","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"`

### The five operator steps (record every command + output verbatim)
1. `bun ~/.tower/cli.mjs emit work-available tower/write-gate-probe briefs/tower/substrate-harden/agnt-wg-probe.md --evidence "write-gate probe"` → capture id `A`.
2. `bun ~/.tower/cli.mjs emit work-claimed tower/write-gate-probe x --ref <A> --evidence "write-gate probe claim"` → capture id `C`.
3. Run the hook (pattern above) → **must exit 2**; capture stderr verbatim.
   Confirm stderr names the topic, the ref `A`, and a runnable
   `cli.mjs emit work-done` command.
4. `bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe briefs/tower/substrate-harden/agnt-wg-probe.md --ref <A> --evidence "write-gate probe done"` → re-run the hook → **must exit 0**.
5. Fresh cycle with `session_id":"probe-2"`: emit a new work-available (id
   `A2`), a new work-claimed ref A2, hook → exit 2; then
   `bun ~/.tower/cli.mjs emit need-help tower/write-gate-probe --evidence "write-gate probe help"` (no payload_ref needed) → re-run hook → **must exit 0**.

If any step's exit code differs from the expectation, STOP that step, record
exactly what happened (including whether the 30s claim TTL is implicated),
post it as a finding, and continue with the remaining steps that still make
sense. A mismatch is evidence, not something you fix — you must not edit the
hook or the tests.

### Task C-2 — proof document
Write `briefs/tower/substrate-harden/PHASE2-WRITE-GATE-PROOF.md` containing:
1. The hook path and the `ls -l ~/.tower/hooks/write-gate.mjs` line.
2. Every exact command run, every probe id, every exit code, the verbatim
   refusal stderr from steps 3 and 5.
3. The `cd primitives/mcps/tower && bun test write-gate.test.mjs` command and
   its result line, run by you.
4. **Honesty section, verbatim requirement:** state plainly that the gate is
   NOT registered in `~/.claude/settings.json`; the proof is the hook
   contract under a real Stop payload fed by hand, not a live pane refusal.
   Do not imply more than that.
5. Environment used (the four exports above) so the probe is reproducible.

### Done-when
- All five steps executed and recorded (or mismatches documented honestly).
- Proof file exists with all five sections.
- Finding posted to `tower/write-gate` with the proof path + one-line verdict
  per step (2/0/2/0 pattern or the observed deviation).
Then write `briefs/tower/substrate-harden/agnt-wg-probe.done` (one line: ISO
timestamp + "done"). Do not commit anything.
