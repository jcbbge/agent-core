# CORD herdr-spine — codify the herdr workspace/tab/pane topology doctrine

> From: CONCIERGE (operator intake 2026-08-12). Binding. Self-contained.
> Board topic: `herdr-spine/topology-doctrine`. `.done` marker: `~/agent-core/briefs/topology-doctrine/.done/cord.done` (plus per-worker markers as you see fit).

## 1. Mission

Codify the operator's new herdr topology doctrine — dictated verbatim 2026-08-12 and already applied live to the running fleet — into **`~/herdr-spine/docs/spawn.md`** (new §Topology section) and **`~/herdr-spine/docs/ctl-fleet.md`** (CTRL placement update). Doctrine lives in herdr-spine docs by operator decision — **do not touch agent-core** (no skill/rule/AGENTS.md edits).

## 2. The doctrine (operator's words, verbatim — the authority)

> "concierge as its own workspace in herdr. tab named 'Engine Shop'. consists of this one and only tab with three panes. the main 'Concierge' pane full half split right. in left half split divided into two sub panes for CTRL and for TOWR process across the entire session. for every task level item--new workspace with 1 tab for Concierge. then additional tab for orchestrator and additional tab for all agents/subagents."

Operator clarifications (2026-08-12, via CONCIERGE):

1. Task workspace tab 1 = **the task's CORD** (not a concierge presence — the Concierge is singular and lives only in the Engine Shop).
2. Codify in **herdr-spine docs** (spawn.md + ctl-fleet.md). Keep doctrine out of agent-core.
3. **Applied live immediately** (already executed — see §4 for the exact working recipes).

Canonical form (how to write it):

- **Concierge workspace** (singular, machine-plane; label `concierge`): exactly ONE tab, named `Engine Shop`, exactly three panes:
  - `CONCIERGE` — full-height **right** half.
  - Left half split horizontally: `CTRL fleet` (top) + `TOWR <active-project>` (bottom).
  - CTRL and TOWR are persistent infra panes for the entire session — reap-exempt per control-flow.md §Reaping (infra exception).
- **Task workspace** (one per task-level item; label = task slug): tab 1 = the task's `CORD`; tab 2 = `ORCH`(s); tab 3 = all `AGNT`/`SAGT` workers (gridded, ~4 visible max per the fanout contract; additional worker tabs beyond 4).
- No infra panes (CTRL/TOWR/statem) in task workspaces — observability is centralized in the Engine Shop. This **supersedes** the ctl-fleet.md placement recipe ("splits the CORD host pane in tab 1 at 0.62") for the machine-plane CTRL; that recipe is retired, not relocated.
- The Concierge never spawns into task workspaces except to deliver operator directives; collection happens via board + `.done` + CTRL/TOWR (COMMS-ARCH).

## 3. Scope

- EDIT: `~/herdr-spine/docs/spawn.md` — add a §Topology section carrying §2 above plus the verified command recipes in §4.
- EDIT: `~/herdr-spine/docs/ctl-fleet.md` — replace the "only sanctioned placement" recipe with the Engine Shop placement; note the retirement of the CORD-host-split recipe.
- COMMIT both in the `~/herdr-spine` repo per the commit convention (`docs(herdr-spine): …` + PHASE/DONE/TODO trailers; stage explicitly).
- DO NOT touch: agent-core (any file), the herdr SKILL.md, live panes, `~/herdr-spine/bin/*` code.

## 4. Pre-verified facts (verified live by CONCIERGE this session, 2026-08-12 ~15:45–16:00 UTC, herdr 0.8.0)

The doctrine is already applied and running — these recipes WORK, document them as-is:

- Workspace: `herdr workspace create --label <slug> --cwd <path> --no-focus`; rename: `herdr workspace rename <WS_ID> <label>`; tab rename: `herdr tab rename <TAB_ID> <label>`.
- **Engine Shop geometry** (splits only go `right`/`down`; there is no left/up split):
  1. With CONCIERGE full-width: `herdr pane split <P> --direction right --no-focus` → empty pane on the right.
  2. `herdr pane swap --source-pane <CONCIERGE> --target-pane <new>` → Concierge takes the right half, empty takes the left. **Note for the doc: in-tab `pane move` repositioning no-ops (`changed:false`, verified twice) — `pane swap --source-pane A --target-pane B` is the reorder verb.**
  3. `herdr pane split <left-pane> --direction down --no-focus` → left column becomes two stacked panes.
  4. `herdr pane rename` them `CTRL fleet` / `TOWR <project>`; launch with `herdr pane run <id> "bun ~/herdr-spine/bin/ctl-fleet"` and `herdr pane run <id> "bun ~/agent-core/primitives/tools/statem/twr.ts <project-root>"`.
- **Task workspace from a live pane:** `herdr pane move <PANE_ID> --new-workspace --tab-label "<label>" --no-focus` — verified with a LIVE pi agent (cord-agent-core): process survived, agent registration followed, pane got a new id (`w29:pX` → `w2B:p1`), workspace auto-created (rename after).
- `pane move` usage forms (from `--help`): in-layout moves require `--tab <id> --split right|down [--target-pane ID]`; `--new-tab [--workspace ID]`; `--new-workspace [--label] [--tab-label]`.
- Live proof of the applied doctrine: workspace `w29` label `concierge`, tab `Engine Shop` = [CTRL fleet (w29:p12) / TOWR agent-core (w29:p13)] left column + CONCIERGE (w29:p2) right half; task workspace `w2B` label `cursor-parity`, tab 1 `CORD agent-core` (w2B:p1).
- spine-spawn targets a workspace with `--workspace <id>` (orch mode; worker mode splits a given `--pane`).

## 5. Topology for executing THIS brief

This task is itself a task-level item: you are being spawned into a fresh workspace labeled `topology-doctrine`, tab 1 = you (CORD herdr-spine). Per the operator's standing rule (directed work with cd/git → full Made Well chain), fan out: one ORCH (topology-doctrine) → one AGNT (docs edit). Small unit — one of each, no fanout. All spawns `--kind pi --profile <role>` (cursor-gateway models only). Reap at collection.

## 5a. OPERATOR CORRECTION (2026-08-12 ~16:20 UTC, via CONCIERGE — in scope for your spawn.md edit)

Fleet spawn-path doctrine changed: all NEW spawns are **kind=cursor via the cursor-shim** (`~/cursor-shim/cursor-fleet up|orch|worker|fanout|make`; `cursor-spine` atomic), shim DEFAULT profiles/models (grok/composer tiers), no model overrides; `spine-spawn --kind pi --profile …` is superseded for fleet work. Note also that cursor-fleet already encodes CTRL/TOWR as fleet-wide singletons at the concierge tab (`cursor-fleet monitor`) — consistent with the Engine Shop doctrine you are codifying; cite it as prior art. One structural delta to record honestly: cursor-fleet gives each ORCH its own tab with its workers as panes in that tab, while the operator's 2026-08-12 doctrine says tab 2 = orchestrator(s), tab 3 = all workers — document the operator's form as the law and note the shim's current behavior as a gap to reconcile.

## 6. Done-when

- `spawn.md` §Topology + `ctl-fleet.md` placement update committed in `~/herdr-spine` (one commit, convention format).
- Doctrine text matches §2 exactly in substance (verbatim quote block encouraged), recipes match §4's verified commands.
- Board finding to `herdr-spine/topology-doctrine` with provenance block (`date -u`; `pwd -P`; `git -C ~/herdr-spine rev-parse HEAD`) + commit id.
- `.done` marker written; ORCH/AGNT panes reaped; final report posted.

## 7. Escalations

Route via board question to CONCIERGE only if: the docs' existing structure makes the edit ambiguous (e.g. ctl-fleet.md contradicts in more than the placement recipe), or `~/herdr-spine` turns out not to be a git repo / has unexpected dirty state (`git status` first — if dirty beyond your edits, stop and escalate).
