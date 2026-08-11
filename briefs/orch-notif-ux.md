# Brief: ORCH notif-ux — notifications become rare, readable summonses
Date: 2026-08-10
Status: ready

## What This Is
Operator verdict on app notifications: "they fire too many times", "content
is unusable, not contextual", "they flash too fast", "I only really care
about task completion." The policy is now codified in ~/.tower/COMMS-ARCH.md
§Notifications — read it first; it is the acceptance rubric. You are an
ORCHESTRATOR (control-flow doctrine, CORD·ORCH·AGNT·SAGT naming): dispatch
one sonnet AGNT, verify, reap, report. You never implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
- Notification source: ~/herdr-spine/bin/handlers/10-notify (fires on
  pane.agent_status_changed; already exempts panes in ~/.tower/bridge-exempt).
  A prior pass (board topic ergonomics-fix, 2026-08-09, DONE) made blocked
  toasts summons-shaped ("<agent> needs you") — do not regress it. VOLUME
  was never addressed: done/activity flips still toast.
- Toast mechanism: `herdr notification show <title> --body <b> [--sound ...]`
  (verified this session). Whether duration is configurable is UNVERIFIED —
  check `herdr notification show --help` and the herdr map
  (~/source/herdr-RETROFIT-MAP.md) before claiming either way.
- Role identification: panes carry $role tokens (0-CTL/2-OCH style — being
  renamed to CORD/ORCH/AGNT/SAGT by och-ctl-tweaks, IN FLIGHT; key your
  filter on BOTH old and new forms) and display_agent labels.
- COMMS-ARCH invariants bind: no fabrication, exempt list honored, content
  from real message sources never truncated preview tokens.
- Partition warning: och-ctl-tweaks is concurrently editing ctl-fleet,
  statem.ts, twr.ts, spawn docs. Your partition is 10-notify (+
  _spine_common.py helpers if needed). Do NOT touch their files.

## Finishing Point
10-notify's notification policy implements the rubric exactly:
- Toast fires ONLY for: ORCH-level done (task completion), operator
  summonses (blocked), alerts. AGNT/SAGT flips produce board lines only.
- Content: role + human work name + outcome, readable, no ids/fragments.
- 60s per-source coalescing (a second event within 60s updates/drops, never
  stacks a new flash).
- Duration: lengthened if herdr permits; if not, verify the content lands in
  the Tower inbox/board so a missed flash costs nothing, and note it.

## How We'll Know It's Done
- [ ] Live evidence: an AGNT done-flip produces NO toast; an ORCH done-flip
      produces ONE readable toast with role + name + outcome
- [ ] Blocked summons behavior unregressed (before/after capture)
- [ ] Coalescing proven with two rapid events from one source
- [ ] Worker reaped; board post topic notif-ux with the evidence

## Report back with (exact completion contract)
Board post topic notif-ux: diff summary, the live before/after evidence,
duration answer (configurable or not, with citation), deviations or "none".
