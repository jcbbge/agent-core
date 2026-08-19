# AGNT [registry skill/muster]

Remove registry `skill/tup`, register+sync `skill/muster`, delete the two stale tup skill directories. Do NOT use emojis. You implement; you do not commit; you do not delete `~/tup` or `~/herdr-spine`. nQ to operator = 0. Questions climb to `orch-plugin-registry`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- ORCH-A `.done` and ORCH-B `.done` exist. Spawn door is live: `/Users/jrg/muster/bin/muster-spawn` executable 61488 bytes. `/Users/jrg/bin/herdr` line 9: `SPINE_SPAWN="${SPINE_SPAWN:-$HOME/muster/bin/muster-spawn}"`. Desk invoke is `"$SPINE_SPAWN" desk …` (not python3). `/Users/jrg/bin/spine-spawn` execs muster-spawn. `herdr --version` → `herdr 0.8.0`.
- `herdr plugin list` (this session): `herdr-spine (herdr-spine) enabled [local:/Users/jrg/herdr-spine]` config `/Users/jrg/.config/herdr/plugins/config/herdr-spine`; also `llmtrim.proxy` enabled. Do not touch llmtrim.
- Local plugin path: `herdr plugin unlink --help` → `herdr plugin unlink <PLUGIN_ID>`. `herdr plugin disable <PLUGIN_ID>` also exists. After unlink, `herdr plugin list` must not show herdr-spine.
- `/Users/jrg/.config/herdr/plugins.json` object 1: `plugin_id` herdr-spine, `plugin_root` `/Users/jrg/herdr-spine`, `enabled` true, startup `python3 bin/spine-startup`, events `python3 bin/spine-hook`. Object 2 is llmtrim.proxy — leave it.
- `/Users/jrg/.config/herdr/config.toml` executable keybindings (ORCH read this session):
  - lines 113–122 `[[keys.command]]` `key = "prefix+space"` `command = "/Users/jrg/herdr-spine/bin/spine-greeting"`
  - lines 124–134 `[[keys.command]]` `key = "prefix+i"` `command = "/Users/jrg/herdr-spine/bin/spine-inbox"`
  - Comments `# >>> spine managed >>>` (line 19) and `# <<< spine managed <<<` (line 148) plus lines 136–146 name `~/.config/herdr/plugins/config/herdr-spine/choreo.toml` and instruct re-running herdr-spine `install.sh`. Those comments are live teaching — strip them. Keep `[theme]` / `[ui.sidebar.*]` herdr-native tables (lines 23–111); they are not executable herdr-spine paths.
- Plugin choreo leftover: `/Users/jrg/.config/herdr/plugins/config/herdr-spine/choreo.toml` exists (2342 bytes). Goes with unlink. Do not delete `/Users/jrg/herdr-spine` (the repo). Operator deletes that after Land.
- Registry `~/.agent-core/registry` lines 490–499 are `primitive skill/tup` (source missing). `skill/muster` is not in the registry. Canonical source `~/agent-core/primitives/skills/muster/SKILL.md` exists (5491 bytes). Stale tup skill dirs: `~/.pi/agent/skills/tup/SKILL.md` and `~/.config/opencode/skills/tup/SKILL.md` (9822 bytes each, Aug 17). Unlink-spine does not touch registry or those dirs; registry-muster does not touch herdr plugin config.
- Write live absolute paths. Do not treat a git worktree as the landing zone. Do not commit.

## Parallel Work Notice

Two AGNTs this wave, disjoint files. Ignore uncommitted noise in `briefs/house/**`, `briefs/tower-rebuild/**`, ORCH-A/B partitions. Do not investigate, revert, or fix those.

- **agnt-unlink-spine:** herdr plugin unlink/disable CLI; `/Users/jrg/.config/herdr/plugins.json` only if the CLI leaves a leftover herdr-spine object; `/Users/jrg/.config/herdr/config.toml` (spine keybinding fragments + comments that teach herdr-spine); leftover `/Users/jrg/.config/herdr/plugins/config/herdr-spine/` after unlink.
- **agnt-registry-muster:** `~/.agent-core/registry` (delete skill/tup, add skill/muster), `agent-core sync skill/muster`, delete `~/.pi/agent/skills/tup` and `~/.config/opencode/skills/tup`.

## Fleet comms (muster skill)

TOWER-WAIVED: muster-deposit only. No tup, field.py, bellman, tower, herdr-spine bins.

- Mail: `/Users/jrg/muster/bin/muster-deposit deposit --from <your-registration-name> --to orch-plugin-registry --kind done|need-help|report|question --body "<evidence>"`
- Pending: `/Users/jrg/muster/bin/muster-deposit pending --to <your-registration-name>`
- Collect: `/Users/jrg/muster/bin/muster-deposit collect <dep-id>` — live compiled door currently reuses one dep-id (BUG-1 in `/Users/jrg/muster/docs/BUGREPORT.md`). Do not collect-by-id if that would collide; still deposit with evidence.
- Pull loop: emit work with evidence (`report`); read pending before idle; `done` / `need-help` with evidence. Empty inbox is not a stop. `report` is not `done`. "Reported and awaited instruction" is not a stopping state.
- nQ to operator = 0. Escalate to orch-plugin-registry only. Dead claimant recovery UNKNOWN.
- Two stopping states only: every done-when met with evidence, or `need-help` naming owner after finishing independent work.

## File partitions (this fleet)

- **agnt-unlink-spine:** `herdr plugin unlink/disable`; `~/.config/herdr/plugins.json` leftover only; `~/.config/herdr/config.toml` spine fragments; leftover `~/.config/herdr/plugins/config/herdr-spine/`.
- **agnt-registry-muster:** `~/.agent-core/registry`; deployed muster skill via `agent-core sync skill/muster`; delete the two stale tup skill directories.
- Residual live-ref rg of agent-core/muster/bin/cursor/herdr-config is a later wave (ORCH). Do not start it.

## This agent

You are agnt-registry-muster. Registration name for deposits: `agnt-registry-muster`. Retire skill/tup from the registry and deploy skill/muster.

## Tasks

1. In `/Users/jrg/.agent-core/registry` delete the `primitive skill/tup` block and its preceding comment (currently lines 490–499, including the `# tup: registered 2026-08-16` comment). Do not restore `primitives/skills/tup/`. — done when: `rg -n '^primitive skill/tup' /Users/jrg/.agent-core/registry` has no hits.
2. Add `primitive skill/muster` immediately after the `skill/herdr` `end` (herdr currently ends at line 488). Template (directory SKILL.md, same deploy set as herdr):
   ```
   primitive skill/muster
     source ~/agent-core/primitives/skills/muster/SKILL.md
     deploy pi
     deploy prime-agent
     deploy claude-code
     deploy cursor
     deploy opencode
   end
   ```
   A short comment that it replaces skill/tup is allowed. — done when: that block is present; source path is exactly that SKILL.md.
3. Run `agent-core sync skill/muster` from a directory that can see the registry. — done when: that command exits 0. Capture full stdout+exit in the report.
4. Run `agent-core status` and extract skill/tup and skill/muster lines. — done when: status has no `skill/tup` listing; `skill/muster` is present and not `source missing`.
5. Delete the directories `/Users/jrg/.pi/agent/skills/tup` and `/Users/jrg/.config/opencode/skills/tup` (the directory, not only SKILL.md). There is no `~/.cursor/skills-cursor/tup` and no `~/.claude/skills/tup` (ORCH `ls` this session: no such file). — done when: `ls` of each of those two paths fails with no such file.

## Constraints

- Touch ONLY: `/Users/jrg/.agent-core/registry`; files `agent-core sync skill/muster` writes under harness skill dirs; `/Users/jrg/.pi/agent/skills/tup`; `/Users/jrg/.config/opencode/skills/tup`. Do not commit. Do not delete `~/tup` or `~/herdr-spine`. Do not edit herdr plugins.json or config.toml. Do not edit `primitives/skills/muster/SKILL.md` (ORCH-A already landed it).
- Testing: NO MOCKS. Verification = the commands in done-when, run in this environment.
- Write live absolute paths named above. Match surrounding registry style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-plugin-registry` with:
- registry diff summary (skill/tup gone, skill/muster present) — cite the new block
- `agent-core sync skill/muster` full stdout + exit
- `agent-core status` excerpt covering skill/muster (and proving skill/tup is absent)
- `ls` evidence the two stale dirs are gone
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-C2-registry-muster.md.done` containing the same evidence. `.done` is last, after the deposit.
