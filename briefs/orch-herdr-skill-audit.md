# Brief: ORCH herdr-skill-audit — make every future session know the upgrades
Date: 2026-08-10
Status: ready

## What This Is
The operator's question, verbatim: "how do future herdr sessions know about
all of these upgrades? how do they know to use them?" Two deliverables:
(A) UPDATE ~/.claude/skills/herdr/SKILL.md so any session that loads the
    herdr skill learns the doctrine, the infra, and the conventions — with
    pointers to the canonical docs rather than duplicated prose where docs
    already exist.
(B) COMPLETE, THOROUGH AUDIT of the entire upgrade set: every claim in the
    updated skill and the canonical docs verified against disk and the live
    system; every stale/contradictory statement found and fixed or reported.
You are an ORCHESTRATOR (control-flow doctrine): sonnet AGNTs in prefixed
panes with human names stamped at birth, isolation between the writer and
the auditor (the agent that updates the skill does NOT audit its own text),
reap on done. You never implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
The upgrade inventory (all paths verified on disk this session):
- Doctrine: ~/agent-core/primitives/rules/control-flow.md — hierarchy
  (Operator>Concierge>CORD>ORCH>AGNT/SAGT), naming prefixes, Made Well
  mapping, reaping rule, observability spec (glyph-only tab titles, CTRL in
  tab-1 split, TOWR per project, two-line enriched rows, two-plane CTRL).
- Comms law: ~/.tower/COMMS-ARCH.md — four planes, no fabrication,
  bridge-exempt, notifications rubric (toast=summons, task-completion only,
  60s pacing), project isolation + `<project-slug>/<topic>` namespacing.
- Infra: ~/herdr-spine/bin/ctl-fleet (two-plane, --spawn produces the tab-1
  split; docs at ~/herdr-spine/docs/ctl-fleet.md);
  ~/agent-core/primitives/tools/statem/{statem.ts,twr.ts} (statem watcher +
  TOWR viewer; mapping file ~/.tower/statem-tabs.json).
- Handlers: ~/herdr-spine/bin/handlers/10-notify (notification policy T1–T6
  in its docstring), 40-tower-bridge (coordinator exemption via
  ~/.tower/bridge-exempt; done-fabrication OFF unless
  ~/.tower/bridge-fabricate-done exists; questions minted to:"operator").
  ~/.tower/lib.mjs inboxState routes only operator-addressed mail.
- Spawn discipline: ~/herdr-spine/docs/spawn.md (stamping mandate — human
  name + display case + $task at birth; reaping; topic namespacing).
- Research: ~/source/herdr-RETROFIT-MAP.md (cited codebase map, 0.8.0).
- Conventions verified live: agent registration names MUST be
  lowercase-kebab (invalid_agent_name otherwise); display case goes in pane
  labels / display_agent; $role tokens drive agents-panel sorting; herdr
  exposes NO pane-birth timestamp (durations come from transcript
  first-records); tokens do NOT survive server restart (re-stamper gap —
  KNOWN OPEN ITEM, verify whether anything addresses it yet).
- The target skill: ~/.claude/skills/herdr/SKILL.md (~182 lines). Known
  stale content to check: its topology section predates CORD/ORCH/AGNT/SAGT;
  the spine manifest note about [[startup]] daemons is stale (they ARE live
  at 0.8.0); spine-spawn (~/herdr-spine/bin/spine-spawn) may predate the
  stamping mandate — audit whether it stamps names/$task and report if not.
- Also in audit scope: ~/agent-core/primitives/rules/tower-orchestration.md
  (may contradict COMMS-ARCH — reconcile by pointer, not duplication).

## Finishing Point
1. SKILL.md updated: doctrine + naming + reaping + stamping in brief form,
   pointers to canonical docs, how to spawn (manual loop + spine-spawn with
   caveats), how CTRL/TOWR/statem are launched and what they show, comms
   rules that bind every agent (board namespacing, no operator-mail abuse).
   Keep the skill's existing hard-won operational content (verified-submit,
   husk doctrine, session targeting) — integrate, don't discard.
2. Audit report: every claim in SKILL.md + control-flow.md + COMMS-ARCH.md
   + spawn.md checked against disk/live herdr; each finding fixed in place
   (docs) or reported (code gaps, e.g. spine-spawn stamping, token
   re-stamper) — code fixes are OUT of scope, report them as queued items.
3. Cross-references coherent: each doc points to the others; no
   contradictions survive.

## How We'll Know It's Done
- [ ] A fresh reader of SKILL.md alone would spawn a correctly named,
      stamped, reaped agent and know where CTRL/TOWR/statem live
- [ ] Audit table on the board: claim → verified/fixed/reported, with
      file:line for every fix
- [ ] Writer/auditor isolation held; workers reaped
- [ ] Board post topic herdr/skill-audit with the evidence

## Report back with (exact completion contract)
Board post topic herdr/skill-audit: SKILL.md diff summary, the audit table,
queued code gaps, deviations or "none".
