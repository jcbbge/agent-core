# AGNT [cord parent map]

Do NOT use emojis. Two-line patch in the lifted spawn door. Do not commit. nQ to operator = 0. Parent: orch-spawn-door.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- File: `/Users/jrg/muster/bin/muster-spawn` (executable Python door, 1531 lines after lift).
- `compose_directive_parent` at lines 129–143. Line 130 docstring: `cord-* → concierge`. Lines 133–134: `if from_name.startswith("cord-"): return "concierge"`.
- Live desk agent name is `cursor-concierge`. CORD done-signal and this fleet use `--to cursor-concierge`.
- Other `concierge` hits in this file are the **profile name**, not the agent name — leave them: `:898` role map, `:1187` default `--profile`, `:1416` help text.
- `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` exists. Do not edit it.
- Do not edit `~/tup/**` or `~/herdr-spine/**`.

## Parallel Work Notice

No sibling in flight on this file. ORCH-A owns compose-directive; you do not touch it.

## Fleet comms (muster skill)

TOWER-WAIVED: durable comms through `/Users/jrg/muster/bin/muster-deposit` only.

- `/Users/jrg/muster/bin/muster-deposit deposit --from agnt-spawn-parent-map --to orch-spawn-door --kind done|need-help|report|question --body "<evidence>"`
- Inbox: `/Users/jrg/muster/bin/muster-deposit pending --to agnt-spawn-parent-map`
- Collect: `/Users/jrg/muster/bin/muster-deposit collect <dep-id>`
- Two stopping states only: every done-when met, or `need-help` naming owner after independent work. Empty inbox is not a stop. `report` is not `done`.

## Tasks

1. In `/Users/jrg/muster/bin/muster-spawn` `compose_directive_parent` only: map `cord-*` to `cursor-concierge` (not `concierge`). Update the docstring on the same function to match. — done when: `from_name.startswith("cord-")` returns `"cursor-concierge"`; the function docstring says `cord-* → cursor-concierge`; `rg -n 'return "concierge"' /Users/jrg/muster/bin/muster-spawn` has no hits; `stat -f %m` of `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` is unchanged from before your edit (record both mtimes).

## Constraints

- Touch ONLY: `/Users/jrg/muster/bin/muster-spawn`. Do not commit. Do not edit compose-directive.
- Testing: NO MOCKS. A Python one-liner importing/executing just `compose_directive_parent` is enough if you can call it without starting herdr; otherwise `rg` of the two lines plus a quoted snippet is the evidence.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-spawn-door` with: the two changed lines; `rg -n 'cursor-concierge|return "concierge"'` on the file; compose-directive mtime before/after (must match); SHA256 of `muster-spawn`; deviations.

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-B4-cord-parent-map.md.done` last, after the deposit.
