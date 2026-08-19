# AGNT [residual live-ref sweep]

Fix remaining live teachings of herdr-spine / tup / field.py / spine-report / spine-claim / skill/tup outside ORCH-A/B partitions. Produce the residual rg report. Do NOT use emojis. You implement; you do not commit; you do not delete `~/tup` or `~/herdr-spine`. nQ to operator = 0. Questions climb to `orch-plugin-registry`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Wave 1 green (ORCH re-ran): `herdr plugin list` is only `llmtrim.proxy`. `rg herdr-spine ~/.config/herdr/config.toml ~/.config/herdr/plugins.json` has no hits. Registry has `skill/muster` (not `skill/tup`). `agent-core status` skill/muster all five deploys green. Stale tup skill dirs gone.
- Spawn door live: `/Users/jrg/muster/bin/muster-spawn`. Wrappers do not name herdr-spine/tup.
- ORCH-A Touch ONLY (do not retouch unless you deposit `need-help` first naming file+owner): `primitives/agent-bridge/compose-directive`, `primitives/profiles/{concierge,coordinator,orchestrator}.md`, `primitives/skills/{concierge,herdr,brief,muster,ending-session,coordinator,orchestrator}/SKILL.md`, `primitives/directives/*.md`, `primitives/AGENTS.md`, `primitives/rules/ENFORCEMENT.md`, `primitives/hooks/spawn-door.sh`, `primitives/hooks/spawn-door-pi.ts`. A leftover hits that are EXCUSED (do not edit): `primitives/skills/herdr/SKILL.md:63` "retired — do not call"; `primitives/skills/brief/SKILL.md:70` "do not teach spine-claim".
- ORCH-B Touch ONLY (do not retouch unless `need-help` first): `/Users/jrg/muster/bin/muster-spawn`, `/Users/jrg/bin/spine-spawn`, `/Users/jrg/bin/herdr`, `/Users/jrg/muster/docs/agent-spawn-sop.md`, `/Users/jrg/muster/docs/DRIVING.md`, `/Users/jrg/muster/AGENTS.md`, `/Users/jrg/muster/field/field.lisp`, `/Users/jrg/muster/durable/cli.lisp`. EXCUSED in muster-spawn (verify-migrate only, not desk): `:59` docstring, `:253` herdr_spine_root docstring, `:265` `~/herdr-spine` fallback, `:1495` argparse help. Do not "fix" those.
- Grep scope (run this exact command for the done-body report):
  ```
  rg -n --hidden -g '!briefs/house/**' -g '!briefs/tower-rebuild/**' -g '!briefs/comms-substrate/**' -g '!**/previous_convo.md' -g '!.git/**' -g '!**/node_modules/**' -g '!**/.cursor/chats/**' 'herdr-spine|spine-report|spine-claim|field\.py|skill/tup|~/tup/|tup/socket|tup/bin/tup' /Users/jrg/agent-core /Users/jrg/muster /Users/jrg/bin /Users/jrg/.cursor/skills-cursor /Users/jrg/.cursor/hooks /Users/jrg/.cursor/commands /Users/jrg/.cursor/agents /Users/jrg/.config/herdr
  ```
  Full scope in the parent brief also includes `~/.cursor` chats — those are transcripts, EXCUSE as historical, do not edit, list as excused-count not every chat file.
- LIVE TEACHING ORCH confirmed this session (FIX these; they are NOT A/B Touch ONLY):
  - `/Users/jrg/agent-core/primitives/profiles/coder.md:9-10` instructs `spine-claim` / `spine-report`.
  - `/Users/jrg/agent-core/primitives/rules/worktree-lifecycle.md:7,9,90,100,112,125` cites `~/herdr-spine/bin/spine-spawn` and handlers as the live door. Live door is `/Users/jrg/muster/bin/muster-spawn reap` (forwarder `~/bin/spine-spawn` OK). Do not leave a runnable `~/herdr-spine/...` path.
  - `/Users/jrg/agent-core/primitives/HARNESS-PARITY.md:82-93,140,155` still teaches `skill/tup` and `bash ~/herdr-spine/test/...` / `ls ~/herdr-spine/bin/handlers/` as live verify commands.
  - `/Users/jrg/agent-core/primitives/rules/comms-arch.md:86-90` tells agents to brief `spine-claim` as a live mechanism.
  - `/Users/jrg/agent-core/primitives/rules/responsible-party-and-nq.md:49,58` cites `herdr-spine/bin/spine-spawn:806-833` and `handlers/16-parent-wake` as what exists today.
  - `/Users/jrg/agent-core/primitives/hooks/herdr-task-report.sh:26,52` comments treat `spine-report` as current. Byte-identical copy at `/Users/jrg/.cursor/hooks/herdr-task-report.sh` (sha256 `810f69a92ea578623ce76e611055c440aa082dbf0f082c45a76a6ff4799509a4`). Edit both (or edit canonical then copy) so comments do not teach spine-report as live. Keep herdr `pane report-metadata` behavior.
  - `/Users/jrg/agent-core/primitives/skills/brief/.claude-plugin/plugin.json` description still says "fleet comms via tup field".
  - `/Users/jrg/agent-core/.cursor/agents/{coder,concierge,coordinator,orchestrator}.md` still cite herdr-spine as live topology / spine-claim. These are NOT the primitives/profiles files A edited (except they duplicate coder). Align with current profiles: herdr native tokens; no herdr-spine; no spine-claim/spine-report.
  - `/Users/jrg/agent-core/primitives/tower/tower.mjs:47-48` default `SPINE_SPAWN` is `join(homedir(), "herdr-spine", "bin", "spine-spawn")`. Retarget default to `join(homedir(), "muster", "bin", "muster-spawn")`. Keep env override.
  - `/Users/jrg/agent-core/primitives/mcps/tower/drift-check.mjs:32` defaults `TOWER_DRIFT_SPINE_DIR` to `herdr-spine/cc-hooks`. Stop treating herdr-spine as a live fallback; env override may remain for sandbox fixtures.
  - `/Users/jrg/agent-core/primitives/mcps/tower/{DEPLOYMENT.md,COMMS-ARCH.md,RESPONSIBLE-PARTY-AND-NQ.md,server-drift.criteria.md,server-drift.qa.md}` instruct running `~/herdr-spine/install.sh` or reading herdr-spine docs as live. Neutralize: retired / do not call; operator deletes that repo after Land. Do not invent a replacement herdr-spine install.
  - `/Users/jrg/.config/herdr/config.toml:71` comment still teaches `spine-claim` as what sets `$claim`. Keep the `[ui.sidebar.agents]` `$claim` token row (herdr-native). Strip the live-teaching comment.
  - `/Users/jrg/muster/docs/api-surface.md:30` heading `field/field.py — the deposit door`; `:86-87` `~/herdr-spine/bin/spine-spawn` as a live wrapper. Deposit door is `/Users/jrg/muster/bin/muster-deposit`. Spawn door is `/Users/jrg/muster/bin/muster-spawn` (`~/bin/spine-spawn` forwarder OK). This file is NOT in B's Touch ONLY.
  - `/Users/jrg/muster/docs/PORT-PROGRAM.md:24` still states as ground truth `Spawn body: ~/tup/socket/spawn.py`. Mark landed/current: muster-spawn exists; tup/herdr-spine out of service pending operator delete. Do not teach those paths as live.
  - `/Users/jrg/agent-core/primitives/hooks/tower-pheromone.test.mjs:71` `CWD_B = '/Users/jrg/herdr-spine'`. Retarget off that repo path (fixture under agent-core or skip-if-absent). Do not require `~/herdr-spine` to exist.
- EXCUSE without editing (list each class in the report, not every historical brief path):
  - `briefs/muster-full-cutover/**` this cutover; `briefs/house/**`, `briefs/tower-rebuild/**`, `briefs/comms-substrate/**`; other `briefs/**` historical tickets.
  - `primitives/tools/vein/test/acceptance/**` and `primitives/tools/slim/**/fixtures/**` historical corpora.
  - `~/.cursor/chats/**` transcripts; `**/previous_convo.md`.
  - `research/**` historical.
  - A/B excused lines named above.
  - `~/.config/herdr/spine-lab/*.json` leftover lab tripwires — not agent teaching. Do not delete `~/herdr-spine`. If a file only names herdr-spine as lab metadata, EXCUSE. If it execs a herdr-spine bin, neutralize or remove the leftover lab file (not the repo).
- Write live absolute paths. Do not commit.

## Parallel Work Notice

C1 (unlink) and C2 (registry) are reaped and green. You are the only worker this wave. Ignore uncommitted noise outside Touch ONLY. Do not retouch A/B partitions without `need-help` first.

## Fleet comms (muster skill)

TOWER-WAIVED: muster-deposit only. No tup, field.py, bellman, tower CLI as the mail path, herdr-spine bins.

- Mail: `/Users/jrg/muster/bin/muster-deposit deposit --from agnt-residual-rg --to orch-plugin-registry --kind done|need-help|report|question --body "<evidence>"`
- Pending: `/Users/jrg/muster/bin/muster-deposit pending --to agnt-residual-rg`
- Collect: `/Users/jrg/muster/bin/muster-deposit collect <dep-id>` — live compiled door reuses one dep-id (BUG-1). Do not collect-by-id if that would collide; still deposit with evidence.
- Pull loop: emit work with evidence; read pending before idle; `done` / `need-help` with evidence. Empty inbox is not a stop. `report` is not `done`.
- nQ to operator = 0. Escalate to orch-plugin-registry only. Dead claimant recovery UNKNOWN.
- Two stopping states only: every done-when met with evidence, or `need-help` naming owner after finishing independent work.

## File partitions (this fleet)

- **agnt-residual-rg (you):** leftover live-ref files listed in Pre-Verified Facts FIX list, plus any additional live teaching the rg command finds that is not in A/B Touch ONLY and not in the EXCUSE classes. Not A/B Touch ONLY files. Not `~/tup/**`. Not `~/herdr-spine/**`.

## This agent

You are agnt-residual-rg. Registration name for deposits: `agnt-residual-rg`. Fix live teachings; classify every remaining rg hit as excused or fixed.

## Tasks

1. Fix every LIVE TEACHING file listed above so a reader is not instructed to run `~/herdr-spine/**`, `~/tup/**`, `field.py`, `spine-report`, `spine-claim`, or `skill/tup` as live. Replacement live paths: `~/muster/bin/muster-spawn` (forwarder `~/bin/spine-spawn` OK), `~/muster/bin/muster-deposit`, herdr native `pane report-metadata` / tokens. Historical SOURCES lines may cite dates; they must not instruct the reader to run those paths. — done when: those files no longer contain live (non-excused) teachings.
2. Re-run the rg command in Pre-Verified Facts over the listed trees. For every remaining hit: `path:line` plus `excused:<reason>` or `fixed:<what changed>`. Chat/transcript hits: one excused count, not every file. — done when: the done body contains that full classification; zero unclassified hits in the command's output.
3. If rg proves an A/B Touch ONLY file still has live teaching (not the excused lines named above), deposit `need-help` naming the file and owner (`orch-doctrine-cutover` or `orch-spawn-door`); do not edit it. — done when: either no such file, or need-help deposited with path+owner.

## Constraints

- Touch ONLY leftover live-ref files in the FIX list plus newly found live teachings outside A/B partitions. Do not commit. Do not delete `~/tup` or `~/herdr-spine`. Do not edit A/B Touch ONLY files.
- Testing: NO MOCKS. Verification = the rg command in done-when.
- Write live absolute paths. Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-plugin-registry` with:
- full residual rg classification (every hit excused or fixed, path+line; chats as a count)
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-C3-residual-rg.md.done` containing the same evidence. `.done` is last, after the deposit.
