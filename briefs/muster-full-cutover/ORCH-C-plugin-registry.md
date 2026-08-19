# ORCH [plugin-registry-sweep]

Uninstall herdr-spine from herdr, remove spine-managed key fragments, drop registry `skill/tup`, register+sync `skill/muster`, delete stale tup skill copies, and produce the residual live-ref report. Do NOT use emojis. You own this unit: Imagine → Plan → Make → Verify. You never implement production yourself — AGNTs cook; you brief, inspect, gate, reap. nQ to operator = 0. Questions climb to CORD (`cord-muster-full-cutover`) with nq budget 3.

You spawn LAST after ORCH-A and ORCH-B are green. If `~/muster/bin/muster-spawn` is missing or `~/bin/herdr` still names herdr-spine/tup, post `need-help` to CORD naming that — do not invent a spawn door.

Operator deletes `~/tup` and `~/herdr-spine` after Land. You do NOT delete those repos.

## Pre-Verified Facts (CORD verified 2026-08-19 this session)

- `herdr plugin list`: `herdr-spine (herdr-spine) enabled [local:/Users/jrg/herdr-spine]` config `/Users/jrg/.config/herdr/plugins/config/herdr-spine`; also `llmtrim.proxy` enabled — do not touch llmtrim.
- Local plugin → unlink, not GitHub uninstall. Verified: `herdr plugin unlink --help` → `herdr plugin unlink <PLUGIN_ID>`; `herdr plugin disable <PLUGIN_ID>` also exists. After unlink, `herdr plugin list` must not show herdr-spine.
- `~/.config/herdr/plugins.json` has the herdr-spine object (`plugin_id` herdr-spine, `plugin_root` `/Users/jrg/herdr-spine`, enabled true, startup `python3 bin/spine-startup`, events `python3 bin/spine-hook`).
- `~/.config/herdr/config.toml`: `[[keys.command]]` `prefix+space` → `/Users/jrg/herdr-spine/bin/spine-greeting`; `prefix+i` → `/Users/jrg/herdr-spine/bin/spine-inbox`. Closing comment `# <<< spine managed <<<`. Plugin choreo lives at `~/.config/herdr/plugins/config/herdr-spine/choreo.toml` — goes with unlink; do not leave keybindings that exec herdr-spine bins.
- Registry `~/.agent-core/registry` lines 490–499:
  ```
  primitive skill/tup
    source ~/agent-core/primitives/skills/tup/SKILL.md
    deploy pi / prime-agent / claude-code / cursor / opencode
  end
  ```
  Source file is missing (`agent-core status`: `skill/tup` `source missing`). `skill/muster` is NOT in the registry. Canonical source exists: `~/agent-core/primitives/skills/muster/SKILL.md`. Deployed copies already at `~/.cursor/skills-cursor/muster/SKILL.md` and `~/.claude/skills/muster/SKILL.md`. Template for the new block: `skill/herdr` at registry ~481–488 (directory SKILL.md, same deploy set as herdr unless a deploy target lacks a skills dir).
- Stale tup skills: `~/.pi/agent/skills/tup/SKILL.md` and `~/.config/opencode/skills/tup/SKILL.md` exist (9822 bytes, Aug 17). No `~/.cursor/skills-cursor/tup`, no `~/.claude/skills/tup`.
- `agent-core sync skill/tup --dry-run` already fails source-missing. After removing the primitive, `agent-core status` must not list `skill/tup`.
- Grep scope: `~/agent-core`, `~/muster`, `~/bin`, `~/.cursor`, `~/.config/herdr`. Exclude archives/backups/historical briefs (`briefs/house/**`, `briefs/tower-rebuild/**`, `briefs/comms-substrate/**`, `**/previous_convo.md`). Excuse: comments that say retired/do not call; hash-chain history; this cutover's own briefs under `briefs/muster-full-cutover/`. Live teaching (instructions to run those paths) is a defect — fix if the file is in your sweep trees and not owned by a still-running sibling (A/B should already be done).
- `herdr --version` was 0.8.0 at skill authoring; re-verify plugin list after unlink, do not assume.

## CORD rulings (do not re-ask)

1. Unlink/disable herdr-spine; do not delete `~/herdr-spine`. Leave llmtrim.
2. Remove config.toml keybindings that invoke herdr-spine binaries. Do not invent replacement greeting/inbox plugins this Land unless herdr breaks without them — if prefix+space / prefix+i would point at missing bins, delete those command stanzas.
3. Remove `skill/tup`. Add `skill/muster` and `agent-core sync skill/muster`.
4. Delete the two stale tup skill directories named above (the directory, not only SKILL.md).
5. Do not commit agent-core or muster. CORD Lands. Do not delete `~/tup`.
6. Final rg report in the done body lists only excused historical paths if any.

## Parallel Work Notice

ORCH-A (agent-core doctrine) and ORCH-B (muster-spawn + wrappers) run first. Ignore their in-flight diffs except to avoid writing the same files. Your Touch ONLY does not include compose-directive, profiles, or `~/muster/bin/muster-spawn`.

## Fleet comms (muster skill)

TOWER-WAIVED: muster-deposit only. No tup, field.py, bellman, tower, herdr-spine bins.

- `~/muster/bin/muster-deposit deposit --from orch-plugin-sweep --to cord-muster-full-cutover --kind done|need-help|report|question --body "<evidence>"`
- `~/muster/bin/muster-deposit pending --to orch-plugin-sweep`
- `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.

## File partitions (this fleet)

- **ORCH-C (you):** `~/.config/herdr/plugins.json` (via `herdr plugin unlink/disable`, not hand-edits unless the CLI leaves a leftover), `~/.config/herdr/config.toml` (spine keybinding fragments only), `~/.agent-core/registry` (skill/tup removal + skill/muster add), delete `~/.pi/agent/skills/tup` and `~/.config/opencode/skills/tup`, residual live-ref fixes in the grep trees that are NOT in A/B partitions (A/B already green). You MAY fix leftover live refs in agent-core files A did not own (e.g. `primitives/profiles/coder.md`, `primitives/rules/worktree-lifecycle.md`, `primitives/HARNESS-PARITY.md`) when the rg report would otherwise be a live teaching.
- **ORCH-A / ORCH-B:** do not retouch their partitions unless rg proves they left a live teaching AND you deposit `need-help` first naming the file and owner.

## Tasks

1. Unlink/disable herdr-spine. Remove spine-greeting / spine-inbox command stanzas from config.toml. — done when: `herdr plugin list` has no herdr-spine; `rg herdr-spine ~/.config/herdr/config.toml ~/.config/herdr/plugins.json` has no enabled plugin and no executable keybinding paths.
2. Registry: delete `skill/tup`; add `skill/muster` from the herdr-like template; `agent-core sync skill/muster` exit 0; `agent-core status` has no skill/tup. — done when: those commands' outputs are in the done body.
3. Delete stale tup skill dirs (pi + opencode). — done when: `ls` of those paths fails (no such file).
4. Residual rg over the grep scope. Fix remaining live teachings outside A/B partitions. — done when: done-body rg report lists every hit as excused or fixed, with path+line.
5. Do not commit. Write `.done` last.

## Constraints

- Touch ONLY the ORCH-C partition plus leftover live-ref files named in task 4 (not A/B files unless need-help). Do not commit. Do not delete `~/tup` or `~/herdr-spine`.
- Testing: NO MOCKS. Verification = the commands in done-when.
- Worker briefs: profiles only — never provider/model/`--kind`.

## Report back with

Deposit `--kind done` to `cord-muster-full-cutover` with:
- `herdr plugin list` after
- config.toml / plugins.json rg
- registry diff summary (skill/tup gone, skill/muster present)
- `agent-core status` excerpt (no skill/tup; skill/muster ok)
- ls evidence stale dirs gone
- full residual rg report (every hit, excused or fixed)
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/ORCH-C-plugin-registry.md.done` with the same evidence. `.done` is last, after the deposit.
