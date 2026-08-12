# ORCH-B — launch-and-build automation (refiners-fire Phase 4)

## Mission
You are an ORCHESTRATOR (2-ORCH) under the coordinator. Own Phase 4 of the refiners-fire plan: kill the manual "moon landing" startup checklist. Operator's goal, verbatim: "i just want to launch herdr, start a pi session or claude code session and fucking build." You partition, spawn AGNT workers, gate, integrate, commit. You do not implement beyond glue.

## SOP pack — read FIRST, law
- `~/agent-core/primitives/rules/control-flow.md` · `~/.tower/COMMS-ARCH.md` · `~/agent-core/primitives/skills/herdr/SKILL.md` (especially §Restart/husks, §spine-lab safety, the [[startup]] evidence block)
- `~/agent-core/AUDIT-2026-08-11-refiners-fire.md` §P2 startup findings
- Spawn: `python3 ~/herdr-spine/bin/spine-spawn fanout --task <t> --workspace $HERDR_WORKSPACE_ID --kind pi --cwd /Users/jrg/herdr-spine --brief <…>` (≤4/call)
- Tower posting (you + every worker brief): `cd /Users/jrg/herdr-spine && bun ~/.tower/cli.mjs post <claim|finding|note> herdr-spine/phase4 "<body>" --from <name>`
- Worker briefs MUST carry: Pre-Verified Facts, partition, done-when per task, the Tower mechanism, report-back + `.done` under `~/agent-core/briefs/wave2/done/`. Workers never commit; you integrate.

## Pre-Verified Facts (coordinator-verified)
- herdr 0.8.0 running; server socket `~/.config/herdr/herdr.sock`. The herdr server is NOT launchd-managed today; `local.herdr-awake` (a root sleep-suppression daemon) IS. launchd inventory: `~/Library/LaunchAgents/` + `~/dotfiles/launchagents/`.
- `[[startup]]`: the 0.8.0 manifest schema SUPPORTS it (`~/source/herdr/src/app/api/plugins/manifest.rs:25` declares `startup: Vec<RawPluginManifestStartup>` — verified by a prior audit reading the source), but the deployed `herdr-plugin.toml` carries no stanza (removed 2026-08-09) and docstrings in `~/herdr-spine/bin/spine-startup` FALSELY claim the schema lacks it. Live replacement today: `~/herdr-spine/bin/handlers/15-restore-view` reapplies the agent view on the first status event after restart.
- spine-spawn fanout derives worker display names as `<task>-wN` and the coordinator must manually re-stamp `AGNT <headline>` after every fanout (the "naming gap", spawn.md). spine-spawn is python3, `~/herdr-spine/bin/spine-spawn`; recent additions: `--thinking`, pi-first model passthrough.
- Circadian wake: full payload (~8k tokens) goes to every pane; fleet roles (`role=1-CORD..4-SAGT` or `CIRCADIAN_SKIP_GREETING=1`) skip ONLY the greeting block (`~/circadian/src/wake.ts` ~lines 52-86, 171-193). `git -C ~/circadian status` is currently CLEAN (one untracked .done file) — but circadian belongs to another work lane.
- SAFETY LAW (herdr skill): never `herdr server stop` from an active session; isolated experiments go through `~/herdr-spine/bin/spine-lab` (named spine-lab-* sessions with guarded lifecycle) — NEVER improvise against the default session. The live fleet (this workspace) must survive everything you do.

## Your partition
`~/herdr-spine/**` · herdr plugin config (`herdr-plugin.toml` — locate it, likely under `~/.config/herdr/`; verify before claiming) · `~/Library/LaunchAgents/com.herdr.*` (new files only) · `~/dotfiles/launchagents/` (new plist + doc only) · `~/circadian` ONLY on a branch, never main (see B4). NOT: `~/agent-core/**` store/registry (ORCH-A owns it), `~/.claude/settings.json`, `~/.tower/**`.

## Suggested worker split
- B1: launchd unit for the herdr server — plist (RunAtLoad, KeepAlive as appropriate), `plutil -lint` clean, and a SAFE activation path: must detect an already-running server and never spawn a second instance or touch the live one. Live-load ONLY if provably safe; otherwise deliver loaded-on-next-login + a manual activation command, documented.
- B2: `[[startup]]` stanza — prototype and PROVE in a spine-lab session first (server restart inside the lab, stanza spawns CTRL + TOWR panes). Only after lab proof, land the stanza in the real herdr-plugin.toml (which takes effect on the NEXT real restart — do not restart the live server). If 0.8.0 rejects the stanza, record the exact error and land nothing.
- B3: spine-spawn fanout self-stamping — derive `AGNT <headline>` + name/task/role tokens from each brief's H1 (strip markdown), apply at spawn; `python3 -m py_compile` + a real 1-brief fanout in this workspace as the live test (spawn a trivial echo-worker, verify stamps, reap it).
- B4: circadian wake slimming for fleet roles — work on branch `wake-slim` in ~/circadian only if the tree is still clean when the worker starts; slim payload for roles 3-AGNT/4-SAGT (constitution+SELF slice, keep NOW + brief-relevant evidence), tests passing (`bun test` in that repo if present — verify). If the tree is dirty or tests absent, deliver a design+patch file under briefs/wave2/ instead. Never commit to circadian main.

## Done when (your integration gate)
1. Every worker's done-when evidence verified by YOU (run the checks yourself, don't trust prose).
2. Nothing about the live herdr server, this workspace, or running panes was disturbed (fleet intact: `herdr workspace list` unchanged count before/after, minus your own reaped workers).
3. Your integration commits: ~/herdr-spine changes committed there (its own repo — verify), plists staged in ~/dotfiles if that's a repo (verify), circadian branch pushed nowhere (local branch only).
4. Workers reaped; `.done` files under briefs/wave2/done/; board claim + findings + final `DONE ORCH-B:` on herdr-spine/phase4.

## Report back with
Per-worker outcome table with evidence, commit hashes per repo, the [[startup]] lab verdict (works at 0.8.0: yes/no + evidence), what the NEXT cold boot will look like step-by-step after your changes, anything deferred. LAST action: `touch ~/agent-core/briefs/wave2/done/orch-b.done`.
