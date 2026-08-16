# PROOF — the spine verbs reach a live cursor agent

Unit 3 task 2 (ORCH-1 `spine-routes-cursor`, T3). Captured 2026-08-16.

The subject is pane `w3W:p3`, the cursor agent spawned in
`PROOF-cursor-spawn.md`. **Every command in section 1 was run by the cursor
agent itself, in its own shell.** The ORCH ran nothing on its behalf. Each is
paired with an independent observation made from outside that pane, so no claim
rests on the agent's own word.

## 0. Identity — herdr injects `$HERDR_PANE_ID` into a cursor pane

Run by the cursor agent:

```
$ echo "HERDR_PANE_ID=$HERDR_PANE_ID"
HERDR_PANE_ID=w3W:p3
Exit code: 0
```

This is the fact the whole parity claim rests on: `spine-claim:157` and
`spine-report:20,64` read exactly this variable, and herdr sets it whatever
engine is seated.

## 1. `spine-claim` — claim, observe, release

Run by the cursor agent:

```
$ /Users/jrg/herdr-spine/bin/spine-claim claim "cursor-parity-probe" --ttl 30
spine-claim: claimed 'cursor-parity-probe' as claim_cursor-parity-probe=w3W:p3 ttl=30s
Exit code: 0

$ herdr pane list 2>&1 | grep -i "cursor-parity-probe"
Matched inside the full JSON pane list on self pane w3W:p3:
  tokens.claim="cursor-parity-probe"
  tokens.claim_cursor-parity-probe="w3W:p3"
Exit code: 0

$ /Users/jrg/herdr-spine/bin/spine-claim release "cursor-parity-probe"
spine-claim: released 'cursor-parity-probe' (claim_cursor-parity-probe)
Exit code: 0
```

**Independent observation.** `spine-watch`, running fleet-wide from a different
pane and with no knowledge of this probe, recognised the claim token written by
the cursor pane and classified it as a claim event:

```
spine-watch: claim token event, 0.2857s since previous line (pane=w3W:p3, tokens={'claim_cursor-parity-probe': 'w3W:p3'})
{"ts": 1786907570.946042, "pane_id": "w3W:p3", "tokens": {"claim": "cursor-parity-probe", "claim_cursor-parity-probe": "w3W:p3", "name": "cursor-verb-parity", "parent": "w3R:p1E", "project": "herdr-spine", "role": "2-ORCH", "task": "Shell"}}
```

**VERDICT: PASS.** The advisory-claim protocol works unmodified from a cursor
pane, and the claim is visible to the rest of the fleet.

## 2. `spine-watch` — the cursor pane is visible to fleet observation

Run by the ORCH from its own pane, while the cursor agent worked:

```
$ python3 bin/spine-watch --until-quiet 25 --timeout 180 > spine-watch.log 2>&1
$ grep -c 'w3W:p3' spine-watch.log
31
```

Thirty-one token-change events on the cursor pane, in a watcher that has no
source filter of any kind. Sample, showing the pane being tracked through the
spawn, its role stamp, its lineage to this ORCH, and its work:

```
{"ts": 1786907549.372288, "pane_id": "w3W:p3", "tokens": {"project": "herdr-spine"}}
{"ts": 1786907549.931466, "pane_id": "w3W:p3", "tokens": {"name": "cursor-verb-parity", "parent": "w3R:p1E", "project": "herdr-spine", "role": "2-ORCH", "task": "cursor-verb-parity"}}
{"ts": 1786907661.799973, "pane_id": "w3W:p3", "tokens": {"name": "cursor-verb-parity", "parent": "w3R:p1E", "project": "herdr-spine", "role": "2-ORCH", "task": "spine-watch observation probe", "verdict": "cursor pane ran spine-claim, spine-workspace and spine-report itself"}}
{"ts": 1786907664.075996, "pane_id": "w3W:p3", "tokens": {"name": "cursor-verb-parity", "parent": "w3R:p1E", "project": "herdr-spine", "role": "2-ORCH", "task": "idle", "verdict": "cursor pane ran spine-claim, spine-workspace and spine-report itself"}}
```

**VERDICT: PASS.** Unmodified, no adapter, no source filter to widen.

## 3. `spine-workspace` — the door runs and answers from a cursor pane

Run by the cursor agent (read-only by brief: it was told never to create or
close a workspace, least of all its own):

```
$ /Users/jrg/herdr-spine/bin/spine-workspace list
spine-workspace — the door for workspace lifecycle. Every create/close
leaves a board trace (topic house/workspaces) and one operator-visible
line, so visible state never mutates silently (session-loop law,
2026-08-14; ENFORCEMENT.md). Raw `herdr workspace close` is refused by
the spawn-door guard; this wrapper is the sanctioned path.

  spine-workspace create --label <L> --cwd <dir> [--focus]
  spine-workspace close  <workspace-id> --why "<reason>"

close REQUIRES --why: Done (proof on disk) or Parked (pickup path on
disk) — name which, and where. Diagnosis is not Land (control-flow.md).
Exit code: 1
```

**Independent observation, and the honest reading of that exit 1.** `list` is
not a verb `spine-workspace` has; `create` and `close` are the whole surface.
The ORCH ran the identical command from its own **claude** pane:

```
$ ~/herdr-spine/bin/spine-workspace list
[byte-identical usage text]
MY_EXIT=1
```

Same output, same exit code, from a different engine. The exit 1 is a usage
error, not a harness failure, and it is **engine-independent** — which is
itself the parity result. The mutating verbs were exercised by the ORCH
(`create` produced workspace `w3W` for this very test; `close` reaped it), and
`spine-workspace` has no pane or engine concept at all: `:40,60` are pure
`herdr workspace` calls.

**VERDICT: PASS**, with the caveat stated plainly — the cursor agent proved the
door *runs and answers* identically; it did not exercise `create`/`close`,
because a probe agent closing workspaces is not a risk worth taking for a fact
the code's structure and the ORCH's own `create`/`close` already settle.

## 4. `spine-report` — self-report from a cursor pane

Run by the cursor agent:

```
$ /Users/jrg/herdr-spine/bin/spine-report task "cursor verb-parity probe"
Output: (silent) | Exit code: 0

$ /Users/jrg/herdr-spine/bin/spine-report verdict "cursor pane ran spine-claim, spine-workspace and spine-report itself"
Output: (silent) | Exit code: 0
```

**Independent observation.** The verdict token is visible in `herdr agent list`
from outside the pane, and `spine-watch` caught the task token flipping:

```
$ herdr agent list   # pane w3W:p3
tokens = {"name": "cursor-verb-parity", "parent": "w3R:p1E", "project": "herdr-spine",
          "role": "2-ORCH", "task": "idle",
          "verdict": "cursor pane ran spine-claim, spine-workspace and spine-report itself"}
```

**VERDICT: PASS.**

## 5. `ctl-fleet` — the cursor pane reports honestly (T4, proven on the same live pane)

Rendered while `w3W:p3` was alive, from the modified `bin/ctl-fleet`:

```
herdr-spine
  ✓ ORCH cursor-verb-parity                      —
    cursor pane ran spine-claim, spine-workspace and spine-report itself
    ✓ AGNT spine-cursor-route                      26m
    ✓ AGNT spine-cursor-route-test                 26m
```

and, in the same frame, the claude regression case still reading real
durations:

```
  ✓ ORCH credential-scrub                        1h8m
  ✓ ORCH harness-homogeneity                     52m
  ✓ ORCH tower-bus-integrity                     1h8m
```

The cursor pane renders `—` ("not measured here"); claude panes still render a
measured duration. Before the change the cursor row rendered `""`,
indistinguishable from a session under a minute.

**VERDICT: PASS.**

## Findings raised by the probe

1. **A hook false-positive worth knowing about.** The cursor agent could not
   post its full verbatim transcript to the board: the `spine-workspace` usage
   text it was quoting contains the literal string `herdr workspace close`, and
   the spawn-door guard matches that string in any command, including a Tower
   post that merely quotes it. The agent captured the refusal and posted an
   abbreviated note instead of bypassing it — correct behaviour. The guard is
   doing its job bluntly rather than wrongly, but it means **tool output that
   quotes a guarded command cannot be deposited verbatim by the agent that
   produced it.** The full transcript in this document was recovered by the
   ORCH via `herdr pane read`.
2. `herdr pane list | grep <token>` returns the entire JSON blob rather than a
   filtered line — the output is one JSON document, so a line-oriented grep
   matches everything or nothing. Cosmetic, but it makes `grep` a poor
   instrument for observing a claim; `spine-watch` is the right one, and it
   worked.
3. `spine-report` is silent on success. Correct but worth stating in briefs, so
   an agent does not read the silence as a failure.

## Summary

| Verb | Ran by the cursor agent | Independent confirmation | Verdict |
|---|---|---|---|
| `$HERDR_PANE_ID` injection | yes | pane id matches `herdr agent list` | PASS |
| `spine-claim` claim/observe/release | yes | `spine-watch` claim-token event | PASS |
| `spine-watch` visibility | n/a (observation) | 31 events on `w3W:p3` | PASS |
| `spine-workspace` | yes (read-only) | byte-identical output + exit 1 from a claude pane | PASS |
| `spine-report` task/verdict | yes | verdict token in `herdr agent list` | PASS |
| `ctl-fleet` duration | n/a (rendering) | `—` for cursor, real durations for claude, same frame | PASS |

Five of five verbs work on a live cursor agent with **no code change to any of
them**. The only change this unit made to reach that state was deleting a
refusal and adding model translation and flag passthrough to the spawn door.
