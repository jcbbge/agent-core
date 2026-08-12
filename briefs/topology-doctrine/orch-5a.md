# ORCH topology-doctrine-5a — gate the fleet spawn-path doctrine docs edit

> From: cord-herdr-spine (pane w2C:p2, workspace `topology-doctrine` w2C). Binding. Self-contained.
> Board topic: `herdr-spine/topology-doctrine`. Your `.done` marker: `~/agent-core/briefs/topology-doctrine/.done/orch-5a.done`.
> You were spawned via `cursor-fleet orch` (kind=cursor, cursor-shim, default profile orchestrator → cursor/grok-4.5:high) — your existence is the new doctrine applied; cite it in your finding.

## 1. Mission

Land the operator's fleet spawn-path doctrine amendment in
`~/herdr-spine/docs/spawn.md`. The authority is the mission brief at
`/Users/jrg/agent-core/briefs/topology-doctrine/mission.md` — **read it
first; it is binding on you.** The amendment is **§5a** (operator
correction, 2026-08-12 ~16:20 UTC, via CONCIERGE). The already-landed
§Topology work (commit `7778575`) is your sibling context, not your scope.

You do not edit docs yourself. You spawn the implementation through the NEW
spawn path (§2), you gate, you commit, you report. One unit.

## 2. Spawn the implementation — NEW DOCTRINE PATH (no alternatives)

The old path (`spine-spawn --kind pi`) is superseded for fleet work. Use the
cursor-shim. Pre-verified by CORD this session (2026-08-12 ~16:25 UTC):

- `~/cursor-shim/cursor-fleet` verbs: `up|orch|worker|fanout|make|monitor|down|status`.
- `~/cursor-shim/cursor-spine` is the atomic spawn primitive.
- Shim DEFAULT profiles/models (from `~/agent-core/primitives/profiles/profile-model get`):
  coordinator → `cursor/kimi-k3:high`, orchestrator → `cursor/grok-4.5:high`,
  coder → `cursor/composer-2.5`. **No `--model` overrides — the gate dies on
  unknown args and doctrine forbids overrides anyway.**
- **VERIFY GATE (hard, in cursor-spine):** a `coder` spawn is REFUSED unless an
  independent test path was forked for the brief's unit. The sanctioned
  transition is `cursor-fleet make <slug> --brief <path>` — it records the
  fork (`verify-mark`) and spawns IMPLEMENTER (coder) ∥ TEST-MAKER, each in
  its OWN git worktree of `--dir`, as splits off your pane. There is no
  sanctioned direct-coder path; do not use the `CURSOR_VERIFY_GATE=off`
  break-glass.

Recipe:

1. Write the implementer brief to
   `/Users/jrg/agent-core/briefs/topology-doctrine/agnt-spawnpath.md`.
   Required contents:
   - H1: `# AGNT fleet spawn-path doctrine docs`.
   - Mission: amend `~/herdr-spine/docs/spawn.md` to codify mission.md §5a.
     Copy mission.md §5a VERBATIM into the brief. Substance requirements:
     - New subsection adjacent to §Topology (e.g. §Spawn-path doctrine):
       all NEW fleet spawns are **kind=cursor via the cursor-shim**
       (`~/cursor-shim/cursor-fleet up|orch|worker|fanout|make`;
       `cursor-spine` atomic); shim DEFAULT profiles/models
       (coordinator `cursor/kimi-k3:high`, orchestrator
       `cursor/grok-4.5:high`, coder `cursor/composer-2.5`); **no
       model/profile overrides**; `spine-spawn --kind pi` is **superseded
       for fleet work**.
     - Prior art note: `cursor-fleet monitor` already treats CTRL/TOWR as
       fleet-wide SINGLETONS funneled to the concierge tab — consistent
       with the Engine Shop doctrine; cite as prior art.
     - Structural delta, recorded honestly: cursor-fleet today gives each
       ORCH its OWN TAB with its workers as PANES in that tab; the
       operator's 2026-08-12 doctrine is tab 2 = ORCH(s), tab 3 = ALL
       workers. **The operator's form is the law; the shim's current
       behavior is the documented gap to reconcile.** No code change is
       in scope — document, don't fix.
     - Where spawn.md's existing text presents `spine-spawn --kind pi` as
       THE fleet spawn path, mark it superseded for fleet work with a
       pointer to the new subsection. Do NOT rewrite the whole doc;
       spine-spawn still exists — the supersession is scoped to fleet
       work. Keep the diff tight.
   - File partition: the implementer touches ONLY
     `/Users/jrg/herdr-spine/docs/spawn.md` (inside its worktree). Nothing
     else. Never commits to the main checkout. Never touches agent-core,
     the herdr SKILL.md, live panes, or `~/herdr-spine/bin/*`.
   - Done-when: the edit is complete in its worktree and matches §5a in
     substance; final action writes
     `~/agent-core/briefs/topology-doctrine/.done/agnt-5a.done` (one line:
     what was edited + worktree path), posts a DONE note to board topic
     `herdr-spine/topology-doctrine` addressed to orch-topology-doctrine-5a,
     then goes idle. Idle after DONE is correct — not a summons.
   - The test-maker spawned beside it authors criteria from the same brief;
     that is expected — do not have the implementer interact with it.
2. Spawn from your own pane:

   ```bash
   cd /Users/jrg/herdr-spine && ~/cursor-shim/cursor-fleet make topology-spawnpath \
     --brief ~/agent-core/briefs/topology-doctrine/agnt-spawnpath.md \
     --dir /Users/jrg/herdr-spine
   ```

   Expect JSON with `impl_pane` and `test_pane` (splits in your tab). If the
   make call fails, read the error, fix the cause (never bypass the gate),
   and if genuinely blocked post a board question to cord-herdr-spine.

## 3. Gate (you own integration — workers never commit to main)

When `agnt-5a.done` exists and the DONE note is on the board:

1. Locate the implementer's worktree (the make JSON, `cursor-spine ps`, or
   `herdr worktree list`; shim worktrees live under
   `~/.cursor/worktrees/herdr-spine/`). Read the diff there:
   `git -C <worktree> diff` (and `git -C <worktree> status --short`).
2. Verify against mission.md §5a DIRECTLY (not against your own AGNT brief):
   - spawn-path doctrine present: kind=cursor via cursor-shim, the five
     cursor-fleet verbs + cursor-spine named, shim default profiles/models,
     no-override rule, `spine-spawn --kind pi` superseded for fleet work.
   - Prior-art note: `cursor-fleet monitor` CTRL/TOWR fleet-wide singletons
     at the concierge tab, tied to the Engine Shop doctrine.
   - Structural delta recorded: shim ORCH-tab-with-worker-panes vs operator
     doctrine tab2=ORCH/tab3=workers; operator's form stated as the law,
     shim behavior as the gap to reconcile.
   - ONLY `docs/spawn.md` modified in the worktree.
3. Bring the change to the main checkout `/Users/jrg/herdr-spine` (apply the
   diff or merge the worktree branch — your mechanics), then in the main
   checkout: `git status --short` must show ONLY `docs/spawn.md` modified
   (pre-existing untracked `research/`, `.future/`, `bin/spine-wave`,
   `briefs/cabinet/` are not yours; leave un-staged). Anything else → stop,
   board question to cord-herdr-spine.
4. Stage explicitly and commit as ONE commit:

   ```bash
   cd /Users/jrg/herdr-spine
   git add docs/spawn.md
   git commit -m "docs(herdr-spine): fleet spawn-path doctrine — cursor-shim is the spawn path

   PHASE: Land
   DONE: <what landed, 1-3 lines>
   TODO: reconcile shim ORCH-tab topology with operator tab2/tab3 doctrine (code, separate brief)
   "
   ```

5. Record the commit id: `git -C ~/herdr-spine rev-parse HEAD`.

## 4. Report + reap

1. Board finding to `herdr-spine/topology-doctrine` from
   `orch-topology-doctrine-5a`: commit id, 2-3 line summary, provenance
   block (`date -u`; `pwd -P` from ~/herdr-spine; `git -C ~/herdr-spine
   rev-parse HEAD`), and one line noting this unit ran end-to-end on the
   new spawn path (cursor-fleet orch → cursor-fleet make bifurcation).
2. Reap: verify the DONE note, then close the implementer and test-maker
   panes (done = gone; spawners reap their own agents). Worktree cleanup:
   remove the merged worktrees (`herdr worktree` helpers or `git worktree
   remove`) once the change is landed in main.
3. Write `~/agent-core/briefs/topology-doctrine/.done/orch-5a.done` (one
   line: commit id + "workers reaped").
4. Go idle. Your spawner (cord-herdr-spine) reaps you. Do not re-prompt
   anyone for chatter.

## 5. Escalate

Board question on `herdr-spine/topology-doctrine` to `cord-herdr-spine`
(then idle and wait) if: the make spawn fails twice; the worktree diff
touches anything beyond docs/spawn.md; main checkout shows unexpected dirty
state; or a worker stalls/blocks without a board message. Never route to
the operator directly.

## 6. Hard rules

- Read mission.md (especially §5a) before doing anything. It wins over this
  brief on any conflict — except brief/.done paths, which are as stated here.
- Workers never commit to the main checkout. You commit once, only after
  verification.
- No mocks, no unverified claims: the spawn-path facts above were verified
  against the shim source this session — carry them, don't re-derive or
  "improve" them.
- Do not touch agent-core (except your brief/.done paths under
  `~/agent-core/briefs/topology-doctrine/`), the herdr SKILL.md, live
  panes outside your own tab's workers, or `~/herdr-spine/bin/*`.
- No `--model` overrides anywhere. Shim defaults only.
