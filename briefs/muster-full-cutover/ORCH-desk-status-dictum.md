# ORCH [desk-status-dictum]

Patch concierge doctrine so the 2026-08-19 operator ruling is complete, including the under-pressure dictum. Do NOT use emojis. You never implement — AGNTs cook. nQ to operator = 0. Parent: cord-muster-full-cutover.

The rest of the ruling is already on disk in Land e7597d6. Do not rewrite the bullet. Add only what is missing.

## Pre-Verified Facts (CORD verified 2026-08-19 this session)

- Canonical desk card already at `~/agent-core/primitives/profiles/concierge.md:146-152`:

```
- **Desk status:** prepared, not invented. Use `~/bin/desk-status` (or
  `herdr agent list` / `herdr workspace list` + `jq`). Never `python3 -c` for
  herdr JSON. Never head/cat/Read compiled binaries
  (`~/muster/bin/muster-deposit` is a Mach-O). No keep-going shell chains after
  a probe crashes. Applies: concierge desk house-state pulls, all harnesses. Does
  not apply: product Python doors (`muster-spawn`), reading source `.lisp` /
  `.py` / `.md`.
```

- Skill door already points at that bullet: `primitives/skills/concierge/SKILL.md:28-32` (`~/bin/desk-status`; do not duplicate the paragraph).
- `~/bin/desk-status` exists, executable, 2384 bytes, dated Aug 19 09:18.
- Operator ruling (this turn, guest book already written) still missing from the desk-card bullet:
  1. Applies clause must include **under pressure** (verbatim intent: applies to desk house-state pulls, all harnesses, under pressure).
  2. Dictum, same bullet or the next sentence of that bullet: **rise to preparation; do not fold under pressure.**
- Do not change scope exclusions (muster-spawn product Python doors; reading source .lisp/.py/.md).
- Commit: CORD Lands. You do not commit.
- Sync: after the profile edit, `agent-core sync skill/concierge` if you also touch the skill; if you only edit the profile, no sync required (profile is loaded by path).

## CORD rulings

1. Touch ONLY `primitives/profiles/concierge.md` unless the skill door needs a one-line pointer to the dictum — prefer profile-only.
2. Do not revert other desk-card lines. Do not expand into herdr skill or HARNESS-PARITY.
3. Do not commit. Do not delete ~/tup or ~/herdr-spine.

## Parallel Work Notice

Ignore leftover uncommitted noise (`briefs/house/**`, statem, researcher.md, control-flow.md). This unit is the two missing clauses only.

## Fleet comms (muster skill)

TOWER-WAIVED: muster-deposit only.

- `~/muster/bin/muster-deposit deposit --from orch-desk-dictum --to cord-muster-full-cutover --kind done|need-help|report|question --body "<evidence>"`
- `~/muster/bin/muster-deposit pending --to orch-desk-dictum`
- Pull loop mandatory. Two stopping states only. nQ to operator = 0.

## Tasks

1. Patch the Desk status bullet so Applies includes "under pressure" and the dictum "rise to preparation; do not fold under pressure" is present in that bullet. — done when: `rg -n 'under pressure|fold under pressure' ~/agent-core/primitives/profiles/concierge.md` shows both; the existing never-python3 / never-head-binaries / desk-status / jq / MUSTER exclusions remain.
2. Do not commit. Write `.done` last.

## Constraints

- Touch ONLY: `~/agent-core/primitives/profiles/concierge.md` (and skill/concierge only if a pointer is required). Do not commit.
- Testing: NO MOCKS. Verification = rg + reading the bullet.

## Report back with

Deposit `--kind done` with the new bullet excerpt, rg hits, every file touched. Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/ORCH-desk-status-dictum.md.done`. `.done` last.
