# ORCH topology-doctrine — gate the herdr topology doctrine docs edit

> From: cord-herdr-spine (pane w2C:p2, workspace `topology-doctrine` w2C). Binding. Self-contained.
> Board topic: `herdr-spine/topology-doctrine`. Your `.done` marker: `~/agent-core/briefs/topology-doctrine/.done/orch.done`.

## 1. Mission

Land the operator's herdr topology doctrine in `~/herdr-spine` docs. The
authority is the mission brief at
`/Users/jrg/agent-core/briefs/topology-doctrine/mission.md` — **read it
first; it is self-contained and binding on you.** Its §2 is the doctrine
(operator's verbatim words + canonical form), its §4 is the live-verified
command recipes, its §3 is the scope, its §6 is the done-when.

You do not edit docs yourself. You spawn ONE AGNT to edit, you gate, you
commit, you report. One unit, no fanout beyond the single worker.

## 2. Spawn the AGNT (exact recipe)

1. Write the worker brief to
   `/Users/jrg/agent-core/briefs/topology-doctrine/agnt-docs.md`. Required
   contents:
   - H1: `# AGNT topology doctrine docs` (fanout self-stamps identity from
     the H1 — this exact form).
   - Mission: add a §Topology section to `~/herdr-spine/docs/spawn.md` and
     update the CTRL placement in `~/herdr-spine/docs/ctl-fleet.md`,
     carrying mission.md §2 (quote the operator's verbatim block) and §4
     (recipes as-is). Include mission.md §2 and §4 copied verbatim into the
     brief so the AGNT never has to guess.
   - ctl-fleet.md specifics: replace the §Spawn "only sanctioned placement"
     recipe (splits the CORD host pane in tab 1 at 0.62) with the Engine
     Shop placement, and explicitly note that the CORD-host-split recipe is
     RETIRED, not relocated. Also update the §Observability-adjacent mention
     of `--spawn` placement in the herdr-skill-described flow ONLY inside
     ctl-fleet.md; if `--spawn` code behavior is referenced, document the
     doctrine placement as the law and the old recipe as retired — do not
     invent code changes (bin/* is out of scope).
   - File partition: the AGNT touches ONLY
     `/Users/jrg/herdr-spine/docs/spawn.md` and
     `/Users/jrg/herdr-spine/docs/ctl-fleet.md`. Nothing else. Never
     commits. Never touches agent-core, the herdr SKILL.md, live panes, or
     `~/herdr-spine/bin/*`.
   - Done-when: both edits complete, doctrine matches mission §2 in
     substance, recipes match §4 exactly; final action writes
     `~/agent-core/briefs/topology-doctrine/.done/agnt-docs.done`
     containing one line: what was edited. Then post a DONE note to board
     topic `herdr-spine/topology-doctrine` addressed to orch-topology-doctrine
     and go idle. Idle after DONE is correct — not a summons.
2. Spawn it (from your pane; `~/bin/spine-spawn` is python3 — NEVER `bun`):

   ```bash
   ~/bin/spine-spawn fanout --task topology-doctrine --kind pi \
     --profile coder \
     --brief ~/agent-core/briefs/topology-doctrine/agnt-docs.md \
     --workspace w2C --cwd /Users/jrg/herdr-spine
   ```

   One brief = one worker in a dedicated `topology-doctrine-workers` tab in
   task workspace w2C (doctrine: tab 3 = workers). Verify the spawn result
   JSON reports `submitted: true`; if not, follow the verified-submit
   fallback in the herdr skill before concluding anything.

## 3. Gate (you own integration — the AGNT never commits)

When `agnt-docs.done` exists and the DONE note is on the board:

1. `cd /Users/jrg/herdr-spine && git status --short` — the ONLY
   modifications allowed are `docs/spawn.md` and `docs/ctl-fleet.md`
   (pre-existing untracked files like `research/`, `.future/`,
   `bin/spine-wave`, `briefs/cabinet/` are not yours; leave them
   un-staged). Anything else modified → stop, post a board question to
   cord-herdr-spine.
2. Read both diffs (`git diff docs/spawn.md docs/ctl-fleet.md`). Verify
   against mission.md DIRECTLY (not against your own AGNT brief):
   - spawn.md carries a §Topology section with the doctrine of mission §2
     in substance — Concierge workspace (singular, label `concierge`, ONE
     tab `Engine Shop`, three panes: CONCIERGE right half, CTRL fleet +
     TOWR stacked left), task workspaces (tab 1 CORD, tab 2 ORCH, tab 3
     workers gridded ~4 max), no infra panes in task workspaces, Concierge
     never spawns into task workspaces except to deliver operator
     directives.
   - The §4 recipes appear as documented commands (split right + `pane
     swap` as the reorder verb — including the note that in-tab `pane
     move` repositioning no-ops — split down, renames, `pane run` launch
     commands, `pane move --new-workspace`).
   - ctl-fleet.md §Spawn now names the Engine Shop as the only sanctioned
     CTRL placement and marks the 0.62 CORD-host-split recipe retired.
3. Stage explicitly and commit as ONE commit:

   ```bash
   cd /Users/jrg/herdr-spine
   git add docs/spawn.md docs/ctl-fleet.md
   git commit -m "docs(herdr-spine): topology doctrine — Engine Shop + task workspaces

   PHASE: Land
   DONE: <what landed, 1-3 lines>
   TODO: —
   "
   ```

   (HEREDOC form is fine; keep the PHASE/DONE/TODO trailers exactly.)
4. Record the commit id: `git -C ~/herdr-spine rev-parse HEAD`.

## 4. Report + reap

1. Board finding to `herdr-spine/topology-doctrine` from
   `orch-topology-doctrine`, containing: the commit id, a 2-3 line summary,
   and a provenance block with the exact output of `date -u`, `pwd -P`
   (run from ~/herdr-spine), and `git -C ~/herdr-spine rev-parse HEAD`.
2. Reap the AGNT: verify the DONE note landed, then close the worker pane
   and its now-empty `topology-doctrine-workers` tab (done = gone;
   spawners reap their own agents).
3. Write `~/agent-core/briefs/topology-doctrine/.done/orch.done` (one
   line: commit id + "AGNT reaped").
4. Go idle. Your spawner (cord-herdr-spine) reaps you. Do not re-prompt
   anyone for chatter.

## 5. Escalate

Post a board question on `herdr-spine/topology-doctrine` to
`cord-herdr-spine` (then go idle and wait) if: git status shows
modifications beyond the two docs; the docs' existing structure makes the
edit ambiguous (ctl-fleet.md contradicting the doctrine in more than the
placement recipe); or the AGNT stalls/blocks without a board message.
Never route to the operator directly.

## 6. Hard rules

- Read mission.md before doing anything. It wins over this brief on any
  conflict — except file paths for briefs/.done, which are as stated here.
- Workers never commit. You commit once, only after verification.
- No mocks, no "documented but unverified" claims: the recipes you carry
  into the docs are mission §4's, already live-verified by CONCIERGE —
  copy them, don't re-derive or "improve" them.
- Do not touch agent-core (except your brief/.done paths under
  `~/agent-core/briefs/topology-doctrine/`), the herdr SKILL.md, live
  panes, or `~/herdr-spine/bin/*`.
