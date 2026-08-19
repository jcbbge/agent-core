---
name: muster
description: What Muster is and how it rides on Herdr — the durable Common Lisp agent-coordination runtime, its write doors, its level-triggered coordination model, and the terminal-multiplexer seam. Use when the concierge (or any agent) needs to know what Muster is, how it works, how it relates to Herdr, how to operate or spawn through it, or how to explain it to the operator. Supersedes the tup skill.
---

# Muster

Muster is the durable half of an agent fleet, rebuilt in Common Lisp. It is a
coordination runtime that rides on Herdr, the terminal multiplexer. Herdr owns
the live terminals (panes, processes, agent detection); Muster owns the durable
control plane and the ledger of what happened. Muster is what tup used to be —
the tup Python stack is superseded and being retired. When this skill and tup
disagree, Muster wins.

Location: ~/muster. Everything is Common Lisp; there is no Python.

## The one-paragraph model

An agent is a pane in Herdr. Work is dispatched by spawning a pane. When an
agent finishes, it does not flip a status — it writes a durable FACT (a deposit)
into the append-only ledger. A parent advances the moment that fact appears in
the ledger, or the moment the producing pane ceases to exist — never on a clock.
That is the whole runtime: dispatch a pane, wait on a level (fact-in-log OR
pane-gone), fold the ledger, continue.

## Why it is shaped this way (the bets)

- Completion is a fact, not a signal. A finish written to a durable log can
  never be lost or missed the way an edge-triggered wake could. (This is why the
  old wake/bellman organ is gone.)
- Coordination is level-triggered: ready(node) = (result-fact in the fold) OR
  (NOT producer-alive?). No wall-clock timeouts anywhere — an agent may run for
  seconds or days; slow is distinguishable from stuck.
- Plans are homoiconic Lisp. Topology is data (s-expressions); every node is
  uniform; deeper orchestrations are just different cartridges run by one
  interpreter.
- The ledger is hash-chained and byte-reproducible. History is tamper-evident.

## How Muster and Herdr fit together

Herdr is the hands; Muster is the plan and the memory.

| Concern | Owner | How |
|---|---|---|
| Terminals / panes / processes | Herdr | herdr CLI: workspace create/close, pane split/close, agent list |
| Spawning an agent | Herdr (via muster-spawn) | `~/muster/bin/muster-spawn worker --label NAME --pane HOST --profile ROLE --brief PATH` |
| Is an agent still alive? | Herdr | herdr agent list — the liveness half of the ready predicate |
| Durable messages between agents | Muster | the deposit door (bin/muster-deposit) appends to deposits.jsonl |
| Durable objects / findings | Muster | durable/cli.lisp: mint / promote / dismiss / seal, list / get |
| Reading state | Muster | the runtime folds the ledger natively in Lisp — nothing to poll |

A coordination step, end to end: Muster dispatches by asking Herdr to spawn a
pane; the agent in that pane does its work and writes a deposit through Muster's
door; Muster notices the fact (or the pane's death) and folds it into the plan;
Herdr tears the pane down.

## Door discipline (the laws)

1. One write door per concern. Messages go through the deposit door only;
   durable objects through durable/cli.lisp only. Never hand-edit deposits.jsonl,
   the store, or events.jsonl.
2. Reads are folds. The runtime reads the ledger in Lisp. No reader daemon,
   nothing to poll.
3. events.jsonl is append-only, hash-chained, sealed to genesis. Editing any
   line breaks every hash after it.
4. Pane and workspace operations go through Herdr, not by hand.

## The deposit door

    ~/muster/bin/muster-deposit deposit --from NAME --to NAME --kind KIND --body "TEXT" [--ref ID]

- --kind is a fixed enum: done | need-help | report | question. Nothing else.
- All of --from, --to, --body must be non-empty (else exit 2).
- Completion is a deposit: an agent's last act before idling is a --kind done
  deposit naming what landed, with evidence.

## Spawning agents (zero-context law)

Agents spawn with ZERO context. The brief handed at spawn is the entire mind the
agent has — it must be fully self-contained: the WWWWW+H, the exact door
commands, the isolation env. A brief that assumes the agent already knows Muster
or Herdr will fail. See ~/muster/docs/agent-spawn-sop.md and
docs/spawn-context-pack.md.

## Isolation

Tests and probes never touch the live ledger. Point these at a scratch dir:
MUSTER_FIELD_DIR (the field), MUSTER_STORE_DIR + MUSTER_EVENTS_PATH (store +
chain). One-release compat fallback only: TUP_FIELD_DIR / TUP_STORE_DIR /
TUP_EVENTS_PATH remain accepted if MUSTER_* are unset.
Determinism seams for byte-parity: MUSTER_FIXED_TS, MUSTER_FIXED_DEP_ID,
MUSTER_FIXED_COL_ID (TUP_FIXED_* accepted as compat fallback).

## Observability

Opt-in, stderr-only so stdout stays byte-exact: MUSTER_LOG_LEVEL=debug|info|warn|error
(silent by default), MUSTER_LOG_FILE=/path for a file mirror.

## For the concierge specifically

- You do not run panes yourself; you talk to the operator and direct the fleet.
  Muster is the model of how that fleet coordinates durably.
- When you explain Muster to the operator, lead with the one-paragraph model: an
  agent is a pane, completion is a durable fact, coordination waits on a level,
  not a clock.
- The canonical on-disk truth is ~/muster/AGENTS.md (the laws) and ~/muster/docs/
  (guides). If this skill and the repo disagree, the repo wins.
