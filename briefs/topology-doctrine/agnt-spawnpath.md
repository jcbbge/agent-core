# AGNT fleet spawn-path doctrine docs

> From: orch-topology-doctrine-5a. Binding. Self-contained.
> Board topic: `herdr-spine/topology-doctrine`. Your `.done` marker:
> `~/agent-core/briefs/topology-doctrine/.done/agnt-5a.done`.
> You were spawned via `cursor-fleet make` (IMPLEMENTER; kind=cursor,
> cursor-shim, default coder profile). A TEST-MAKER runs beside you from the
> same brief — do not interact with it.

## Mission

Amend `~/herdr-spine/docs/spawn.md` to codify mission.md §5a (fleet spawn-path
doctrine). Copy of §5a follows — it is the authority for substance.

### §5a VERBATIM (from mission.md — OPERATOR CORRECTION 2026-08-12 ~16:20 UTC)

Fleet spawn-path doctrine changed: all NEW spawns are **kind=cursor via the cursor-shim** (`~/cursor-shim/cursor-fleet up|orch|worker|fanout|make`; `cursor-spine` atomic), shim DEFAULT profiles/models (grok/composer tiers), no model overrides; `spine-spawn --kind pi --profile …` is superseded for fleet work. Note also that cursor-fleet already encodes CTRL/TOWR as fleet-wide singletons at the concierge tab (`cursor-fleet monitor`) — consistent with the Engine Shop doctrine you are codifying; cite it as prior art. One structural delta to record honestly: cursor-fleet gives each ORCH its own tab with its workers as panes in that tab, while the operator's 2026-08-12 doctrine says tab 2 = orchestrator(s), tab 3 = all workers — document the operator's form as the law and note the shim's current behavior as a gap to reconcile.

## Substance requirements

- New subsection adjacent to §Topology (e.g. §Spawn-path doctrine):
  - all NEW fleet spawns are **kind=cursor via the cursor-shim**
    (`~/cursor-shim/cursor-fleet up|orch|worker|fanout|make`;
    `cursor-spine` atomic);
  - shim DEFAULT profiles/models (coordinator `cursor/kimi-k3:high`,
    orchestrator `cursor/grok-4.5:high`, coder `cursor/composer-2.5`);
  - **no model/profile overrides**;
  - `spine-spawn --kind pi` is **superseded for fleet work**.
- Prior art note: `cursor-fleet monitor` already treats CTRL/TOWR as
  fleet-wide SINGLETONS funneled to the concierge tab — consistent with
  the Engine Shop doctrine; cite as prior art.
- Structural delta, recorded honestly: cursor-fleet today gives each ORCH
  its OWN TAB with its workers as PANES in that tab; the operator's
  2026-08-12 doctrine is tab 2 = ORCH(s), tab 3 = ALL workers. **The
  operator's form is the law; the shim's current behavior is the
  documented gap to reconcile.** No code change is in scope — document,
  don't fix.
- Where spawn.md's existing text presents `spine-spawn --kind pi` as THE
  fleet spawn path, mark it superseded for fleet work with a pointer to
  the new subsection. Do NOT rewrite the whole doc; spine-spawn still
  exists — the supersession is scoped to fleet work. Keep the diff tight.

## File partition

Touch ONLY `/Users/jrg/herdr-spine/docs/spawn.md` (inside your worktree).
Nothing else. Never commit to the main checkout. Never touch agent-core
(except writing your `.done` marker), the herdr SKILL.md, live panes, or
`~/herdr-spine/bin/*`.

## Done-when

1. The edit is complete in your worktree and matches §5a in substance.
2. Final action writes `~/agent-core/briefs/topology-doctrine/.done/agnt-5a.done`
   (one line: what was edited + worktree path).
3. Post a DONE note to board topic `herdr-spine/topology-doctrine` addressed
   to orch-topology-doctrine-5a.
4. Then go idle. Idle after DONE is correct — not a summons.
