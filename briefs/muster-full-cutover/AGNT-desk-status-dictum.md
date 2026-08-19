# AGNT [desk-status-dictum]

Patch the concierge desk-card **Desk status** bullet so the 2026-08-19 operator ruling is complete, including the under-pressure dictum. Do NOT use emojis. You implement; you do not commit. nQ to operator = 0. Questions climb to `orch-desk-status-dictum`.

The rest of the ruling is already on disk (Land e7597d6). Do not rewrite the bullet. Add only what is missing.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Canonical desk card already at `/Users/jrg/agent-core/primitives/profiles/concierge.md:146-152` (ORCH Read this session):

```
- **Desk status:** prepared, not invented. Use `~/bin/desk-status` (or
  `herdr agent list` / `herdr workspace list` + `jq`). Never `python3 -c` for
  herdr JSON. Never head/cat/Read compiled binaries
  (`~/muster/bin/muster-deposit` is a Mach-O). No keep-going shell chains after
  a probe crashes. Applies: concierge desk house-state pulls, all harnesses. Does
  not apply: product Python doors (`muster-spawn`), reading source `.lisp` /
  `.py` / `.md`.
```

- `rg -n 'under pressure|fold under pressure' /Users/jrg/agent-core/primitives/profiles/concierge.md` this session: **zero hits**. Those two clauses are the only missing pieces.
- Skill door already points at that bullet: `/Users/jrg/agent-core/primitives/skills/concierge/SKILL.md:28-32` (`~/bin/desk-status`; do not duplicate the paragraph). **Do not edit the skill.** Profile-only.
- `~/bin/desk-status` exists, executable, 2384 bytes, dated Aug 19 09:18, Bourne-Again shell (`ls -la` + `file` this session).
- Binding additions (operator ruling; bake this meaning; match surrounding desk-card bullet style, no emoji):
  1. Applies clause must include **under pressure** (verbatim intent: applies to desk house-state pulls, all harnesses, under pressure).
  2. Dictum, same bullet or the next sentence of that bullet: **rise to preparation; do not fold under pressure.**
- Do not change scope exclusions (muster-spawn product Python doors; reading source `.lisp` / `.py` / `.md`). Do not revert other desk-card lines. Do not expand into herdr skill or HARNESS-PARITY.
- Target bullet (byte-for-byte intent; wrap to match surrounding wrap width):

```
- **Desk status:** prepared, not invented. Use `~/bin/desk-status` (or
  `herdr agent list` / `herdr workspace list` + `jq`). Never `python3 -c` for
  herdr JSON. Never head/cat/Read compiled binaries
  (`~/muster/bin/muster-deposit` is a Mach-O). No keep-going shell chains after
  a probe crashes. Applies: concierge desk house-state pulls, all harnesses,
  under pressure. Rise to preparation; do not fold under pressure. Does
  not apply: product Python doors (`muster-spawn`), reading source `.lisp` /
  `.py` / `.md`.
```

## Parallel Work Notice

Ignore leftover uncommitted noise (`briefs/house/**`, statem, researcher.md, control-flow.md). Do not investigate, revert, or fix those. This unit is the two missing clauses only. Touch only your partition.

## Fleet comms (muster skill)

TOWER-WAIVED: muster-deposit only. Retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from agnt-desk-status-dictum --to orch-desk-status-dictum --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to agnt-desk-status-dictum`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Read the field before ever going idle. Empty inbox is not a stop. `report` is not `done`. Two stopping states only: every done-when met with evidence, or `need-help` naming owner after finishing independent work. nQ to operator = 0. Dead claimant recovery UNKNOWN. Do not invent TTL or flags.
- When depositing, `--body` is a string. Do not `head`/`cat`/`Read` `~/muster/bin/muster-deposit` (Mach-O).
- Herdr sidebar: `herdr pane report-metadata` with `--token task=` at start and `--token name=` when done.

## This agent

You are agnt-desk-status-dictum. Registration name for deposits: `agnt-desk-status-dictum`. Write the live absolute path in Touch ONLY (`/Users/jrg/agent-core/primitives/profiles/concierge.md`). If a coder worktree is forced, copy the finished file to that absolute path before `.done`.

## Tasks

1. Patch the Desk status bullet in `concierge.md` so Applies includes "under pressure" and the dictum "rise to preparation; do not fold under pressure" is present in that bullet. Keep never-python3 / never-head-binaries / desk-status / jq / MUSTER exclusions. — done when: `rg -n 'under pressure|fold under pressure' /Users/jrg/agent-core/primitives/profiles/concierge.md` shows both; the existing never-python3 / never-head-binaries / desk-status / jq / MUSTER exclusions remain. Read the bullet after the edit and quote it in full.

## Constraints

- Touch ONLY: `/Users/jrg/agent-core/primitives/profiles/concierge.md`. Do not edit the skill. Do not commit. Do not run `agent-core sync`. Do not delete ~/tup or ~/herdr-spine.
- Testing: NO MOCKS. Verification = the rg in done-when plus reading the bullet.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-desk-status-dictum` with:
- the patched concierge.md desk-card bullet, quoted in full
- the rg output
- every file created or modified
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-desk-status-dictum.md.done` with the same evidence. `.done` is last, after the deposit.
