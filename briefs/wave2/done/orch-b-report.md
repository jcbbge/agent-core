# ORCH-B report — Phase 4 launch-and-build automation

From: orch-phase4-automation → CORD
Date: 2026-08-11

## Per-worker outcomes

| Worker | Outcome | Evidence |
|---|---|---|
| B1 launchd | PASS | `com.herdr.server` plist + safe-start guard; `plutil -lint` OK both copies; live-load NO (server already up); guard dry-run exit 0; PID 20575 untouched |
| B2 [[startup]] | PASS — lab yes | Lab `spine-lab-startup-b2`: event=startup exit 0, CTRL+TOWR created. Landed `[[startup]]` → `bin/spine-startup`. Live server NOT restarted. Registry clean of lab plugin |
| B3 fanout stamp | PASS | `brief_headline` from H1; live fanout `AGNT echo stamp probe`; echo reaped; spawn.md updated. Residual: herdr overwrites `task` token with live prompt |
| B4 wake slim | PASS | Branch `wake-slim` @ `cbadfc6`; AGNT/SAGT ~31% smaller; `bun test src/wake.test.ts` 15/15; full suite 463/0. Not pushed |

## Commit hashes
- `herdr-spine` `9c608ed` — feat(phase4): launch automation — startup CTRL/TOWR + fanout H1 stamps
- `dotfiles` `b5c313f` — feat(launchagents): com.herdr.server with safe-start guard
- `circadian` `wake-slim` `cbadfc6` — local only, not pushed, not merged to main

## [[startup]] lab verdict
**works at 0.8.0: yes** — plugin log `event=startup` `exit_code=0`; lab panes CTRL+TOWR; source `manifest.rs` + `run_plugin_startup_hooks` confirmed. Landed stanza takes effect on next real restart (composed ctl-fleet/twr recipe not exercised against live default on purpose).

## Next cold boot (step-by-step after these changes)
1. Login → launchd `com.herdr.server` RunAtLoad → `herdr-server-launchd.sh` starts `/Users/jrg/.local/bin/herdr server` if none answering (else no-op).
2. Herdr server boots → plugin `[[startup]]` runs `python3 bin/spine-startup` → ensures CTRL fleet + TOWR for herdr-spine.
3. Operator attaches (`herdr`) → agent view restores via `15-restore-view` on first status event.
4. Open a pane, start pi/claude → circadian wake: AGNT/SAGT get slim payload (constitution + SELF doctrine + NOW + evidence); operator/ORCH/CORD unchanged (after `wake-slim` merge).
5. Fanout workers self-stamp `AGNT <brief H1>` — no manual re-stamp loop.

## Deferred
- Live-load of launchd job (loads next login; manual `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.herdr.server.plist` when cold).
- First real-server restart validation of landed `spine-startup` (ctl-fleet/twr compose).
- Merge `circadian` `wake-slim` → main (CORD/operator decision; never pushed from this ORCH).
- `task` token still overwritten by herdr live monitor after prompt delivery (herdr-owned).

## Fleet integrity
- Live server PID 20575 continuous; never `server stop`.
- Workers reaped; `phase4b-workers` tab gone.
- Ambient: workspace `w1N` (arc-monitor-canary) appeared during run (not ORCH-B); sibling ORCH-A panes came/went — not our topology leak.
