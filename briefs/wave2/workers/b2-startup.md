# AGNT startup stanza lab

You are AGNT B2 under orch-phase4-automation. Prototype and PROVE a `[[startup]]` stanza that restores CTRL + TOWR panes after server start — in a spine-lab session first. Only after lab proof, land the stanza in the real `herdr-plugin.toml` (takes effect on NEXT real restart — do NOT restart the live server). Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified)
- Schema SUPPORTS startup: `~/source/herdr/src/app/api/plugins/manifest.rs` `RawPluginManifest.startup: Vec<RawPluginManifestStartup>` (field present; `#[serde(default)]`). Prior comments in `herdr-plugin.toml` and `bin/spine-startup` claiming the field is absent are FALSE — correct those comments when you land.
- Deployed `~/herdr-spine/herdr-plugin.toml` currently has NO `[[startup]]` stanza (removed 2026-08-09). `plugins.json` may show a stale startup entry — trust the toml + a lab restart log, not the cached json alone.
- Live replacement today for agent view: `~/herdr-spine/bin/handlers/15-restore-view` on `pane.agent_status_changed`. Keep that path; `[[startup]]` is additive for CTRL/TOWR boot, not a replacement unless lab proves otherwise.
- Lab tool: `~/herdr-spine/bin/spine-lab` — sessions MUST be named `spine-lab-*`. Subcommands: `tripwire`, `start <name>`, `tripwire-check`, `stop`, `delete`. Capture tripwire BEFORE lab mutations; check AFTER. Never improvise against the default session. Never `herdr server stop` on default.
- CTRL spawn recipe: `bun ~/herdr-spine/bin/ctl-fleet --spawn [workspace_id] [--project <root>]` (docs/ctl-fleet.md). TOWR: `bun ~/agent-core/primitives/tools/statem/twr.ts <project-root>` in a display pane renamed `TOWR <project>`.
- CHANGELOG notes one-shot plugin `[[startup]]` hooks for restoring plugin-owned state after server startup/handoff.
- Fixture example of panes table (different feature): `~/source/herdr/tests/fixtures/plugin-smoke/herdr-plugin.toml` has `[[panes]]` — you may use `[[startup]]` command that shells out to spawn CTRL/TOWR; do not assume `[[panes]]` alone meets the brief.

## Parallel Work Notice
B1 owns launchd plists. B3 owns `bin/spine-spawn` + `docs/spawn.md`. B4 owns circadian. Ignore their diffs. Your partition only.

## Tower
```
cd /Users/jrg/herdr-spine && bun ~/.tower/cli.mjs post <claim|finding|note> herdr-spine/phase4 "<body>" --from agnt-b2-startup
```

## Partition (ONLY)
- `~/herdr-spine/herdr-plugin.toml` (add `[[startup]]` only after lab proof; fix false docstring comments)
- `~/herdr-spine/bin/spine-startup` (rewrite/repurpose as the startup command that ensures CTRL+TOWR; fix false "schema lacks startup" claims)
- Optional new helper under `~/herdr-spine/bin/spine-boot-*` if cleaner than bloating spine-startup
- `~/herdr-spine/docs/plugin.md` (startup section only — correct the truth)
- Evidence: `~/agent-core/briefs/wave2/done/b2-startup.evidence.md`

Do NOT edit: `bin/spine-spawn`, LaunchAgents, circadian, `~/.tower/**`.

## Tasks
1. `spine-lab tripwire` on default session.
2. Start `spine-lab-startup-b2` (or similar spine-lab-* name). Prototype a temporary plugin/startup command in the LAB only (copy or session-scoped config as needed). Goal: after lab server (re)start, the startup hook runs and CTRL + TOWR panes exist in the lab session. Capture log lines proving the hook fired (herdr-server log / plugin log under the lab session dir).
3. If 0.8.0 rejects or silently drops the stanza: record the EXACT error/evidence, land NOTHING in the real toml, write evidence, stop. Verdict = no.
4. If proven: land `[[startup]]` in real `herdr-plugin.toml` pointing at the fixed `bin/spine-startup` (or new helper). Correct false comments. Do NOT restart the live/default server.
5. `spine-lab tripwire-check` must PASS. Then stop+delete the lab session.
6. Evidence file: lab session name, log excerpts, verdict yes/no, whether real toml was landed, tripwire-check result.

## Constraints
- Never restart/stop the live default herdr server.
- Never commit.
- Lab only for restarts.

## Done when
- Evidence file with lab verdict (works at 0.8.0: yes/no + proof).
- If yes: real toml has `[[startup]]`; false docs corrected.
- Default session topology unchanged (tripwire-check PASS).
- Board finding posted.
- Final: `touch ~/agent-core/briefs/wave2/done/b2-startup.done`

## Report back with
Verdict line first: `[[startup]] lab: yes|no — <one evidence clause>`. Then what landed, what deferred.
