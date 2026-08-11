# Brief: OCH statem-tower — Made Well state machine + Tower stigmergy
Date: 2026-08-10
Status: ready

## What This Is
The MINIMAL stigmergic state layer the operator mandated: a gen_statem-style
tracker (https://www.erlang.org/doc/system/statem.html — explicit states,
explicit logged transitions) for the Made Well outer loop
(Discovery→Commit→Build→Land) and inner loop (Imagine→Plan→Make→Verify),
whose every transition leaves a visible trace WITHOUT being asked. Operator's
sizing words, binding: "the simplest, easiest, minimal, barebones answer."
You are an ORCHESTRATOR: plan, decompose, dispatch AGT/SUB workers (sonnet,
herdr panes, prefixed names per ~/agent-core/primitives/rules/control-flow.md),
verify, report to the coordinator (pane w1A:p1, "CRD future"). You never
implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
- Law to read first: ~/agent-core/primitives/rules/control-flow.md (hierarchy,
  naming, observability spec) and ~/.tower/COMMS-ARCH.md (comms law).
- Made Well state lives per project in `.madewell/`: `madewell.json` (outer:
  stage + discovery/active), `cycles/<id>.json` (inner: phase + items),
  `work/status.jsonl` (event log). Live example: /Users/jrg/future/.madewell/.
- Tower board is append-only JSONL at ~/.tower/board.jsonl; rows:
  {"id","ts","cwd","type","from","topic","body"}. Ledger (~/.tower/ledger.jsonl)
  is OPERATOR MAIL ONLY — statem traces go to the BOARD, never the ledger.
- `herdr tab rename <TAB_ID> <LABEL>...` exists (verified via --help).
  `herdr api snapshot` returns the full tree as JSON. Both callable from any
  shell. bun is installed (~/.bun/bin/bun).
- The orchestrator tab to drive first: the c004 orchestrator lives in tab
  w1A:t3 (pane renamed "OCH c004-ux" already).
- Transport ruling: operator said std/http/websocket, "don't care" — coordinator
  picks SIMPLEST: file-tail + stdout. No server unless a worker proves it needed.

## Finishing Point (all three, minimal)
1. `statem` — one small bun script: given a project root, watches `.madewell/`
   (poll ≤2s is fine), derives outer stage + inner phase(s), and on EVERY
   transition appends ONE board row (topic "statem", from "statem@<project>",
   body: "<project> OUTER <old>→<new>" or "INNER c00N <old>→<new> (<item>)").
   Explicit state enum, explicit transition log — nothing implicit.
2. Tab-title glyphs: on transition, statem runs `herdr tab rename` on the
   project's OCH tab(s): `OCH <name> <glyphs>` where glyphs are a
   filled/empty progression (▰▱ per phase, e.g. `▰▰▱▱ Make`). Mapping of
   OCH tab → project/cycle may be a simple config file; do not overbuild.
3. `TWR [project]` pane: one herdr pane per project workspace running a
   trivial viewer (tail -f styled, or bun) over the board filtered to that
   project's cwd/topics: last transitions, last findings, open questions.
   Spawn one for /Users/jrg/future as the proof.

## How We'll Know It's Done
- [ ] Editing /Users/jrg/future/.madewell/madewell.json stage (test fixture,
      not the real file — copy it to a temp project for the test) produces a
      board row within 2s and a tab title change
- [ ] TWR future pane exists, shows live rows, survives detach
- [ ] Total new code ≤ ~300 lines across the pieces; zero new services/deps
- [ ] Nothing writes to ~/.tower/ledger.jsonl

## Out of Scope
HTTP/websocket servers; dashboards; touching herdr source; the execution
pane (that is OCH herdr-qol's); anything in the future repo.

## Report back with (exact completion contract)
Board post topic "statem" from your OCH name: file paths, line counts, the
live evidence (board rows + a tab title before/after), TWR pane id, deviations
or "none". Then idle with wake signals armed on your workers — never end a
turn with live workers and no armed wake signal.
