# AGNT topology doctrine docs

> From: orch-topology-doctrine (w2C). Binding. Self-contained.
> Board topic: `herdr-spine/topology-doctrine`. Your `.done` marker:
> `~/agent-core/briefs/topology-doctrine/.done/agnt-docs.done`.

## 1. Mission

Add a §Topology section to `/Users/jrg/herdr-spine/docs/spawn.md` and update
the CTRL placement in `/Users/jrg/herdr-spine/docs/ctl-fleet.md`, carrying
mission.md §2 (quote the operator's verbatim block) and §4 (recipes as-is).

You do not commit. You edit only the two files in §3. When done, write the
`.done` marker, post a DONE note to the board, and go idle.

## 2. Doctrine (mission §2 — copy into docs; authority)

Operator's words, verbatim:

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

## 3. File partition (ONLY these two files)

- `/Users/jrg/herdr-spine/docs/spawn.md` — add a §Topology section carrying §2 above plus the verified command recipes in §4.
- `/Users/jrg/herdr-spine/docs/ctl-fleet.md` — replace the §Spawn "only sanctioned placement" recipe (splits the CORD host pane in tab 1 at 0.62) with the Engine Shop placement, and explicitly note that the CORD-host-split recipe is **RETIRED**, not relocated. Also update the §Observability-adjacent mention of `--spawn` placement in the herdr-skill-described flow ONLY inside ctl-fleet.md; if `--spawn` code behavior is referenced, document the doctrine placement as the law and the old recipe as retired — do not invent code changes (`bin/*` is out of scope).

Never touch: agent-core, the herdr SKILL.md, live panes, `~/herdr-spine/bin/*`, or any other file. Never commit.

## 4. Pre-verified recipes (mission §4 — document as-is; do not re-derive)

Verified live by CONCIERGE 2026-08-12 ~15:45–16:00 UTC, herdr 0.8.0. The
doctrine is already applied and running — these recipes WORK, document them
as-is:

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

## 5. ctl-fleet.md edit specifics

In §Spawn: the "only sanctioned placement" must now name the **Engine Shop**
(Concierge workspace, left column: CTRL fleet top + TOWR bottom) as the only
sanctioned CTRL placement. Mark the old 0.62 CORD-host-split recipe
**RETIRED**, not relocated. Do not claim you changed `bin/ctl-fleet` — docs
only; if `--spawn` still implements the old split, say the doctrine placement
is the law and the flag's prior recipe is retired pending code follow-up (or
word equivalently without inventing a code plan).

## 6. Done-when

1. Both edits complete.
2. Doctrine matches mission §2 in substance (verbatim quote block encouraged).
3. Recipes match §4 exactly (including `pane swap` as the reorder verb and the
   note that in-tab `pane move` repositioning no-ops).
4. Final action: write `~/agent-core/briefs/topology-doctrine/.done/agnt-docs.done`
   containing one line: what was edited.
5. Post a DONE note to board topic `herdr-spine/topology-doctrine` addressed
   to orch-topology-doctrine, then go idle. Idle after DONE is correct — not
   a summons. Do not re-prompt anyone.
