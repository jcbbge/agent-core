# AGNT — live probe of the deployed Tower write-gate Stop hook

You are the **probe agent**. You run commands against the **real deployed
hook** and the **real Tower bus** and capture exactly what happened. You do
not judge, do not soften, do not repair. If the gate misbehaves, that is the
finding and you record it verbatim.

Parent: `ORCH write-gate-proof`. Project: `agent-core`.
Board topic: `agent-core/tower-bus-integrity`.

Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified every one personally, 2026-08-16)

- Deployed hook: `~/.tower/hooks/write-gate.mjs` is a symlink to
  `/Users/jrg/agent-core/primitives/mcps/tower/hooks/write-gate.mjs`
  (verified with `readlink`). That file is 168 lines, on branch `main`,
  last touched by commit `0bfbc48`
  ("fix(tower): write-gate refusal command now runnable (--evidence included)").
  This is the current checkout, NOT the `feat/tower-write-gate` branch.
- `~/.tower/PHASE2-WRITE-GATE-PROOF.md` **does not exist** (verified with
  `ls`). Do not create it. Writing it is the ORCH's job, not yours.
- Contract: `~/agent-core/primitives/mcps/tower/write-gate.criteria.md`.
  **Exit 0 = allow the stop. Exit 2 = refuse, reasons on stderr.**
- Hook behavior read from source this session
  (`primitives/mcps/tower/hooks/write-gate.mjs`):
  - line 27: unparseable stdin -> `process.exit(0)`
  - line 30: `evt.stop_hook_active` truthy -> `process.exit(0)`
  - identity binds from `$TOWER_FROM`, else `herdr agent get $HERDR_PANE_ID`
    -> `.result.agent.name`; failure leaves identity unbound -> exit 0
  - outstanding claim = scent `work-claimed`, `from === identity`, `ref`
    non-null, `ts >= floor`, scoped to normalized `cwd`; claim TTL ignored
  - released by a scoped `work-done` row with matching `ref`, or a live
    `need-help` from the same identity on the claim's topic
  - refusal state file: `$TOWER_WRITE_GATE_STATE`, default
    `~/.tower/write-gate-state.json`; **after 3 refusals for the same
    `(session_id, ref)` the 4th call BYPASSES with exit 0** and writes an
    audit note. Use a distinct `session_id` per case so no case is polluted
    by another case's refusal count.
  - time floor comes from `$TOWER_SESSION_START` (ms epoch)
  - stderr line 158-159 names the ref, the topic, and a runnable release
    command including `--evidence "released by write-gate"`
- Prior probe recipe (a different run, on a branch, NOT your proof):
  `~/agent-core/briefs/tower/substrate-harden/PHASE2-WRITE-GATE-PROOF.md`.
  Read it for the command shapes. Your run supersedes it.
- Emit verb (verified present):
  `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]`
  It prints the new pheromone id on stdout.
- Live bus: `~/.tower/pheromones.jsonl` and `~/.tower/board.jsonl` are real
  and append-only. `board.jsonl` has 26 known-corrupt rows, all at or below
  line 2577, all predating 2026-08-10. **Your appends land at the end and
  cannot make it worse.** Do not edit, rewrite, truncate, or `sed` either
  file. A sibling ORCH owns `board.jsonl` as a file.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.

## Touch ONLY

- `~/agent-core/briefs/tower-bus-integrity/write-gate-evidence/` — create it;
  every file you write goes here.
- Appends to the real bus **through `bun ~/.tower/cli.mjs`** only, scoped to
  the disposable topic `tower/write-gate-probe-20260816`.

Touch nothing else. Do not modify `write-gate.mjs`, `write-gate.criteria.md`,
the test suite, any brief, `INVENTORY.json`, or `ENFORCEMENT.md`. **Do not
modify the hook or the criteria to make a case pass** — a failing case is a
valid, wanted result.

## Sequencing (hard — a sibling ORCH is blocked on you)

Run the probe **first, before writing anything up**. Get all six cases
captured, then write the evidence files. Another agent is waiting to rewrite
`board.jsonl` and cannot start until your appends stop.

## Tasks

### 1. Set up an isolated probe environment

```
mkdir -p ~/agent-core/briefs/tower-bus-integrity/write-gate-evidence
export PROBE_TOPIC=tower/write-gate-probe-20260816
export TOWER_FROM=agnt-wg-probe-20260816
export TOWER_SESSION_START=$(( $(date +%s) * 1000 - 60000 ))
export TOWER_WRITE_GATE_STATE=$(mktemp -d)/write-gate-state.json
cd /Users/jrg/agent-core
```

Leave `TOWER_BOARD_PATH` and `TOWER_PHEROMONES_PATH` **unset** — the probe
must hit the real bus. Record the resolved values of `TOWER_SESSION_START`
and `TOWER_WRITE_GATE_STATE` verbatim.

Emit the obligation and verify the row that actually landed:

```
A=$(bun ~/.tower/cli.mjs emit work-available "$PROBE_TOPIC" briefs/tower-bus-integrity/AGNT-write-gate-probe.md --evidence "write-gate probe 20260816")
C=$(bun ~/.tower/cli.mjs emit work-claimed "$PROBE_TOPIC" briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref "$A" --evidence "write-gate probe claim 20260816")
grep -F "$C" ~/.tower/pheromones.jsonl
```

- **Done when:** `$A` and `$C` are recorded, and the grepped claim row is
  captured verbatim showing its `from`, `cwd`, `ts`, `ref`, and `topic`.
  **Confirm `from` equals `agnt-wg-probe-20260816`** — if the CLI stamped a
  different `from`, stop and report that immediately as a finding: the whole
  probe depends on identity matching.

### 2. Run all six probe cases

Each case: run the exact command, capture the **command, exit code, stdout,
and stderr separately**. Use a distinct `session_id` per case. Feed stdin as
one JSON object. Template:

```
echo '{"cwd":"/Users/jrg/agent-core","session_id":"<CASE>","stop_hook_active":false}' \
  | bun ~/.tower/hooks/write-gate.mjs > /tmp/out.$$ 2> /tmp/err.$$ ; echo "exit=$?"
```

- **case-1 outstanding obligation -> expect exit 2.** session_id `probe-c1`,
  `stop_hook_active:false`, full env from task 1. Capture the stderr line in
  full; it must name `ref=$C`... check whether it names the **claim id** or
  the **work-available id `$A`** and record exactly which, verbatim.
- **case-2 obligation discharged -> expect exit 0.** Emit
  `work-done "$PROBE_TOPIC" <payload_ref> --ref "$A" --evidence "write-gate probe release"`,
  then re-run the hook with session_id `probe-c2`.
  **Note:** the ref that releases is per criteria 13/14 — record which ref you
  passed and whether it released. If `--ref "$A"` does not release, try
  `--ref "$C"` and record BOTH attempts and both exit codes. Do not hide the
  first attempt.
- **case-3 kill switch -> expect exit 0.** Re-establish a fresh outstanding
  claim (new `A2`/`C2` on the same topic), then run with
  `TOWER_WRITE_GATE=off` and session_id `probe-c3`. The claim must still be
  outstanding, so that exit 0 proves the switch and not an empty field.
  Verify that by ALSO running the identical command without the kill switch
  under session_id `probe-c3-control` and capturing its exit 2.
- **case-4 `stop_hook_active` truthy -> expect exit 0.** Same outstanding
  claim, `"stop_hook_active":true`, session_id `probe-c4`.
- **case-5 unparseable stdin -> expect exit 0.** Feed `not json at all`
  (and, as a second sub-case, empty stdin). Capture both.
- **case-6 identity unbound -> expect exit 0.** Same outstanding claim, but
  run the hook with `env -u TOWER_FROM -u HERDR_PANE_ID` so neither variable
  reaches it. session_id `probe-c6`. This must exit 0 even though the claim
  is live for cwd+topic.

After the last case, **release the outstanding claim** with a `work-done`
ref-ing what is open, so you leave no live obligation on the bus.

- **Done when:** all six cases (plus the two sub-cases and the case-3
  control) have command, exit code, stdout, and stderr captured verbatim.

### 3. Write the evidence files

Under `briefs/tower-bus-integrity/write-gate-evidence/`:

- `probe-transcript.md` — one section per case, in run order, each with:
  the exact command, the resolved env, exit code, verbatim stdout, verbatim
  stderr. No paraphrase. No summary in place of output.
- `probe-results.md` — a table: case | expected exit | actual exit | PASS or
  FAIL | which numbered criteria in `write-gate.criteria.md` it exercises.
  Cite criteria by number, quoting the criterion text you matched against.
  Mark FAIL plainly where behavior differs. Do not mark a case PASS on
  reasoning — only on the captured exit code and stderr.

Then run `bun test primitives/mcps/tower/write-gate.test.mjs` from
`/Users/jrg/agent-core` and save the raw output to
`write-gate-evidence/bun-test.txt`. **This is corroboration only, never
proof** — say so in the file.

- **Done when:** all three files exist, every claim in them traces to a
  captured run, and no case is marked PASS without its exit code present.

### 4. Guard the credential rule

Raw bus dumps may carry a scrubbed board credential with the prefix
`srt:af8c45e6`. Match on the prefix only — **never write the full value into
any file, including a report saying you did not find it.** Before finishing,
run:

```
grep -rn "srt:af8c45e6" ~/agent-core/briefs/tower-bus-integrity/write-gate-evidence/ ; echo "grep_exit=$?"
```

- **Done when:** the grep returns no matches (`grep_exit=1`). If it matches,
  redact the credential to `srt:REDACTED` in your evidence files and say so
  in the report. Nothing containing that string may enter git.

## Tower

- Post: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/tower-bus-integrity "<body>" --from "AGNT wg-probe"`
- CLAIM first, findings as you go, `.done` last.
- **Stigmergic field (mandatory, rank 3):** claim your work with
  `bun ~/.tower/cli.mjs emit work-claimed agent-core/tower-bus-integrity briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref ph-msw4hgep-vsyo --evidence "<path>"`,
  heartbeat it, and close with `work-done` ref-ing that claim. Emit
  `need-help` rather than going quiet. Note these coordination emits use the
  project topic, NOT `$PROBE_TOPIC` — keep the two apart.
- **Two legal stopping states only:** every done-when met, or a posted
  `need-help` naming what you need and who owns it, after doing everything
  that does not depend on it. Questions climb to `ORCH write-gate-proof`,
  nq budget 3.

## Report back with

- Case-by-case: expected exit, actual exit, PASS or FAIL, criteria numbers.
- The verbatim stderr of case-1 and the case-3 control (the two refusals).
- The resolved `TOWER_SESSION_START`, `TOWER_WRITE_GATE_STATE`, `$A`, `$C`,
  and the run timestamp (`date -u`) of the first and last hook invocation.
- For case-2: which `--ref` value actually released the claim.
- `bun test` pass/fail counts.
- Every file created or modified, including dotfiles.
- Any Pre-Verified Fact above that turned out wrong, and what you found
  instead. Report this even if everything else passed.
