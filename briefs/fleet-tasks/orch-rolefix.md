# ORCH fleet-task-rolefix — repair the herdr role-resolution envelope path (U1 defect)

Model tier: shim default (operator mandate — no overrides). Do NOT use emojis anywhere.

You are ORCH fleet-task-rolefix, spawned by CORD fleet-tasks (pane w2H:p1, workspace w2H). Small
defect-fix unit on the just-landed `fleet-task` CLI. Implementation through
`cursor-fleet make <slug> --brief <p>` (enforced Verify beat — spec
`~/cursor-shim/docs/inner-loop-verify.md`). Workers never commit; you do not commit; CORD gates.

## The defect (CORD found it dogfooding the live store, 2026-08-12 ~18:20 UTC)

`~/agent-core/primitives/tools/fleet-task/role.ts` lines 33-36: `roleFromHerdr()` parses
`herdr pane get <id>` output as `{ tokens?: { role?: string } }` — top-level `tokens`.

The ACTUAL envelope (verified live this session, herdr 0.8.0):

```
$ herdr pane get w2H:p1
{"id":"cli:pane:get","result":{"pane":{"agent":"cursor",...,"tokens":{"name":"fleet-tasks","role":"1-CORD","task":"..."}}}}
```

Top-level keys are `id` and `result`; tokens live at `result.pane.tokens.role`. Consequence:
`data.tokens?.role` is ALWAYS undefined → every herdr-pane caller resolves "undeterminable" →
write denied → forced onto the `--role` escape hatch. Fail-closed masked the dead primary path;
the 12/12 suite never exercised the real envelope (coverage gap — the deeper defect).

Evidence of the live failure (CORD, this session): `fleet-task mission open …` from pane w2H:p1
(tokens.role="1-CORD" confirmed via `herdr pane get`) → `write denied — role undeterminable`.

## Pre-Verified Facts (CORD verified each personally)

- `role.ts` current content: `JSON.parse(r.stdout.toString()) as { tokens?: { role?: string } }`,
  `const raw = data.tokens?.role;` — the only consumer of the envelope; `HERDR_MAP` keys are
  `1-CORD|2-ORCH|3-AGNT|4-SAGT`.
- Envelope shape: top-level `{id, result: {pane: {...}}}` — verified via raw `head -c 400` and a
  key listing (`['id','result']`, no top-level `tokens`).
- The CLI is installed: `~/.local/bin/fleet-task` → symlink to
  `primitives/tools/fleet-task/fleet-task.ts`. Suite: `cd ~/agent-core/primitives/tools/fleet-task
  && bun test fleet-task.test.ts` → currently 12/12.
- Suite convention: NO MOCKS; tests use `FLEET_TASKS_HOME` temp dirs and real subprocesses
  (see `test-helpers.ts`).
- Repo: `~/agent-core`, HEAD `3c91cfd` (fleet-task landed). Parallel cursor-parity mission has
  uncommitted/staged work in the repo (`cli` submodule, `briefs/cursor-parity/`, vein fixtures,
  `.cursor/`, `.pi/`) — NEVER stage or commit anything outside your partition; before committing
  anything (you won't — CORD gates), CORD re-verifies the index.

## Parallel Work Notice

- **YOUR partition:** `~/agent-core/primitives/tools/fleet-task/role.ts` +
  `fleet-task.test.ts` / `test-helpers.ts` (regression test). Nothing else.
- **NOT yours:** everything else in the repo; `~/.fleet-tasks/state.json` (live store — CORD is
  dogfooding with it NOW; never write it from tests; `FLEET_TASKS_HOME` temp dirs only).
- Board: topic `agent-core/fleet-tasks`. CLAIM at start, DONE finding at end. Questions route UP
  to CORD fleet-tasks via a board `note` — never to the operator.

## Tasks

1. **Fix the envelope path** in `roleFromHerdr()`: read `result.pane.tokens.role` (the one
   verified shape; no speculative multi-shape tolerance). Done when: from a herdr pane carrying
   `tokens.role=1-CORD`, `fleet-task mission open …` (no `--role`) succeeds; from a pane carrying
   `3-AGNT` (or a simulated envelope of one) write is still denied.
2. **Regression test that would have caught this** — the real gap. The test must exercise the
   REAL `herdr pane get` JSON envelope shape (a fixture captured from live `herdr pane get`
   output is honest; a hand-invented shape is a mock in disguise). It must FAIL against the old
   code and PASS against the fix. Done when: `git stash` the fix → test red; unstash → green
   (demonstrate both in your report).
3. **Re-run the full suite** — 13/13 (or 12+new) green in the MAIN checkout, uncommitted.

## Constraints

- Touch ONLY: `role.ts`, `fleet-task.test.ts`, `test-helpers.ts` (if helper needed). No commits.
- NO MOCKS. Match existing code style. Comments state constraints, not narration.
- Verify beat via `cursor-fleet make` is mandatory even for one line — the bifurcation is the
  point (the test-maker derives the regression test from THIS brief's envelope evidence, not from
  the fix).

## Report back with

Board finding on `agent-core/fleet-tasks` + `.done` marker
`~/agent-core/briefs/fleet-tasks/.done/impl-rolefix.done`: per-file diff summary, test tail,
the red→green demonstration of the regression test, and the live-penetration evidence (a real
`fleet-task` write from a herdr pane with NO `--role` flag succeeding as CORD).
