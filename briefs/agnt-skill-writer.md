# Brief: AGNT skill-writer — rewrite the herdr SKILL.md so a cold session inherits the upgrades
Spawner: ORCH skill-audit (pane w1A:pZ). Date: 2026-08-10. Status: binding.

## Mission
Rewrite `~/.claude/skills/herdr/SKILL.md` so that a session which loads ONLY
this skill learns the current doctrine, infra, and conventions — and could
spawn a correctly named, stamped, verified, reaped agent without reading
anything else first. Point to canonical docs; do NOT duplicate their prose.

You are the WRITER. A separate auditor verifies your text afterward. Write
what you can verify; mark anything you cannot verify as UNKNOWN rather than
guessing. Every factual claim you write must come from a file you read this
session or a command you ran this session.

## Your file partition — HARD
- You may edit EXACTLY ONE file: `~/.claude/skills/herdr/SKILL.md`.
- Read anything. Edit nothing else. Never commit. Never `git add`.
- Another agent is concurrently editing `~/agent-core/primitives/rules/control-flow.md`,
  `~/.tower/COMMS-ARCH.md`, `~/herdr-spine/docs/spawn.md`,
  `~/herdr-spine/docs/ctl-fleet.md`, and
  `~/agent-core/primitives/rules/tower-orchestration.md`. Do not touch those.
  Read them at the start; if a late re-read shows drift, prefer the doc.

## Pre-Verified Facts (ORCH, verified on disk/live 2026-08-10)
- Live binary: `herdr 0.8.0` (`herdr --version`). SKILL.md currently cites
  0.7.5 in several places — re-verify each behavior claim against 0.8.0
  before restating it, and update the version stamps you keep.
- `herdr agent start` at 0.8.0 accepts agent-arg passthrough:
  `herdr agent start <NAME> --kind <KIND> --pane <ID> [-- <AGENT_ARG>...]`
  (verified via `herdr agent start --help` this session). NAME rejects
  spaces/uppercase → `invalid_agent_name`; use lowercase-kebab.
- Canonical docs that exist on disk (verified this session):
  - `~/agent-core/primitives/rules/control-flow.md` — the hierarchy law
    (OPERATOR > CONCIERGE > CORD > ORCH > AGNT/SAGT), naming prefixes,
    Made Well mapping, §Reaping, §Observability spec, §Two-plane CTRL.
  - `~/.tower/COMMS-ARCH.md` — comms law: four planes, one message/one
    audience/once/in full, no fabrication, no truncation, bridge-exempt,
    notification rubric, project isolation + `<project-slug>/<topic>`.
  - `~/herdr-spine/docs/spawn.md` — spine-spawn modes, the STAMPING MANDATE
    (human work name at birth), the four name carriers, `$task`, the
    hierarchy sort token, the spine-spawn naming gap interim rule, topic
    namespacing, reaping.
  - `~/herdr-spine/docs/ctl-fleet.md` — the CTRL fleet pane (two-plane).
  - `~/herdr-spine/bin/ctl-fleet` — the executable (`--spawn` produces the
    tab-1 split).
  - `~/agent-core/primitives/tools/statem/{statem.ts,twr.ts,README.md}` —
    statem watcher + TOWR viewer; mapping file `~/.tower/statem-tabs.json`.
  - `~/herdr-spine/bin/handlers/10-notify` and `40-tower-bridge` — the
    notification policy and the Tower bridge; `~/.tower/bridge-exempt`,
    `~/.tower/bridge-fabricate-done`, `~/.tower/lib.mjs` `inboxState`.
  - `~/herdr-spine/bin/spine-spawn` — the one-command spawn wrapper.
  - `~/source/herdr-RETROFIT-MAP.md` — cited codebase map for 0.8.0.
- Conventions verified live by the coordinator: registration names MUST be
  lowercase-kebab; display case belongs in pane label / `--display-agent`;
  `$role` tokens drive agents-panel sorting; herdr exposes NO pane-birth
  timestamp (durations must come from transcript first-records or board
  CLAIM timestamps); tokens do NOT survive a server restart while agent
  registration names DO (the re-stamper gap).

## What to do
1. **Read first, in this order**: the current `SKILL.md`; then control-flow.md,
   COMMS-ARCH.md, spawn.md, ctl-fleet.md, the statem README, and skim
   `~/herdr-spine/bin/handlers/10-notify` + `40-tower-bridge` docstrings.
   Run `herdr --help`, `herdr agent --help`, `herdr pane --help`,
   `herdr api snapshot | head` to ground CLI claims at 0.8.0.
2. **Keep the hard-won operational content** already in SKILL.md — integrate
   it, do not discard it: sandbox policy, session targeting (`--session` /
   `HERDR_SOCKET_PATH`; `HERDR_SESSION` is not routing authority), IDs and
   current context, agent status semantics (idle vs done, corroborate
   non-busy readings), the VERIFIED-SUBMIT hard rule and its Pasted-text
   fallback, husk doctrine / restart-liveness, read sources and the
   empty-read retry, the coordinated fan-out contract, signal-over-polling
   (`events.subscribe`, subscribe-then-snapshot ordering), and the safety
   and coordination rules.
3. **Fix what is stale.** Known suspects — verify each, fix or delete:
   - The frontmatter `description` says fut(ure) is this machine's
     multiplexer and herdr is "a tool available for legacy and hosted
     operations". control-flow.md §Substrate says herdr IS the substrate:
     "use, leverage, optimize, and extend it in every way possible". These
     contradict. Reconcile toward control-flow.md, which is the operator law
     and is dated 2026-08-10. Keep the description's genuinely useful parts
     (what herdr is, when to invoke, `HERDR_ENV=1` for pane-local control).
   - The topology section ("Your topology: Coordinator > Orchestrator >
     Agents") predates CORD/ORCH/AGNT/SAGT. Replace with the real hierarchy.
   - Version stamps: 0.7.5 claims restated without re-verification at 0.8.0.
   - The claim that the plugin agent view is reapplied by spine-startup on
     server start — verify against `~/herdr-spine` on disk before keeping.
   - The pointer to `tower-orchestration.md` as "the message bus" — COMMS-ARCH.md
     is now the comms law. Point at COMMS-ARCH.md as primary.
   - Any path claim (e.g. "skills live in ~/agent-core/primitives/skills/") —
     `ls` it before keeping it.
4. **Add what is missing** (brief form + pointer, never a copy of the doc):
   - **Hierarchy and naming**: the prefix table (CORD/ORCH/AGNT/SAGT plus
     CTRL and TOWR infra panes), lowercase-kebab registration forms, rename
     BEFORE the agent starts. → control-flow.md
   - **The stamping mandate**: human work name (the item TITLE, never a raw
     id) stamped at birth; the four name carriers (`agent start <name>`,
     `report-metadata --display-agent`, `pane rename`, `--token name=`);
     `--token task=` for the activity line (80-char cap); `--token role=`
     for hierarchy sort; the trap that tokens die on server restart.
     → spawn.md
   - **Reaping**: done = gone; spawners reap their own agents and the empty
     tab; exceptions are infra panes (CTRL, TOWR, statem) and the operator's
     focused pane; durable state lives on disk and the board, never in a
     dead pane's scrollback. → control-flow.md §Reaping
   - **How to spawn**: the manual loop (already in the skill) AND
     `~/herdr-spine/bin/spine-spawn <orch|worker|fanout|prompt>` with its
     real caveats — fanout is hard-capped at 4 briefs; it passes one role
     string to both `pane rename` and `agent start` and derives fanout roles
     as `<task>-wN`, so it does NOT satisfy the stamping mandate on its own:
     include the per-worker re-stamp follow-up from spawn.md §The spine-spawn
     gap verbatim-equivalent. Also note the agent-arg passthrough
     (`-- --model sonnet`) for choosing a worker model.
   - **Observability infra — where it lives and what it shows**:
     `ctl-fleet` (CTRL fleet pane; two-plane machine/project view; `--spawn`
     puts it as a SPLIT of tab 1 beside the coordinator, never an isolated
     tab), `twr.ts` (one TOWR pane per project workspace), `statem.ts` (per
     project Made Well state tracker; writes glyph-only tab titles via
     `herdr tab rename`; mapping `~/.tower/statem-tabs.json`). State the
     exact launch commands you verify, and say what each pane shows.
   - **Comms rules that bind every agent**: COMMS-ARCH's one rule and four
     planes; status is not mail and status is not a toast; fleet mail flows
     up the hierarchy and only `to:"operator"` rows reach the operator;
     board topics are `<project-slug>/<topic>` with bare topics reserved for
     machine-plane infra; post from a real repo cwd (board_post refuses
     scratch/temp); notification rubric (task completion / operator summons /
     alert only, contextual content, 60s pacing). → COMMS-ARCH.md
5. **Shape**: keep it a working operator's manual, not an essay. Front-load
   the doctrine (hierarchy, naming, stamping, reaping, comms) so a cold
   reader hits it before the CLI detail. Use a short "Canonical docs" table
   near the top listing each doc and what it owns. Aim for roughly the
   current length; do not balloon it past ~320 lines. Bump
   `metadata.version` and update `metadata.tags`/`description` to match.

## Done when
- [ ] `~/.claude/skills/herdr/SKILL.md` is rewritten and self-consistent.
- [ ] A cold reader of it alone could: name a pane correctly, stamp it,
      spawn + verify submit, find CTRL/TOWR/statem, post to the board with
      the right topic form, and reap the agent when done.
- [ ] Every claim you kept or wrote is traceable to a file you read or a
      command you ran this session; unverifiable claims are removed or
      marked UNKNOWN.
- [ ] No file outside your partition was modified; nothing committed.

## Comms (binding)
- Your FIRST action: post a CLAIM to the Tower board, topic
  `herdr/skill-audit`, from cwd `/Users/jrg/agent-core`, including your pane
  id. Use the tower MCP `board_post` if available; otherwise append one JSON
  line to `~/.tower/board.jsonl`:
  `{"id":"<uniq>","ts":"<iso>","cwd":"/Users/jrg/agent-core","type":"finding","from":"agnt-skill-writer","topic":"herdr/skill-audit","body":"CLAIM ..."}`
- Route every question to your spawner (ORCH skill-audit, pane `w1A:pZ`) —
  never to the operator.
- Your LAST actions, in order: (1) write your report to
  `~/agent-core/briefs/reports/agnt-skill-writer-report.md`; (2) post a DONE
  finding to topic `herdr/skill-audit` summarizing it; (3) create the marker
  `~/agent-core/briefs/.done-agnt-skill-writer`.

## Report back with
A section-by-section summary of what changed in SKILL.md: what you KEPT,
what you REWROTE, what you DELETED as stale (with the evidence that made it
stale), what you ADDED (with the doc each pointer targets), and any claim
you could not verify — listed explicitly as UNKNOWN, with what would settle
it. Include the final line count.
