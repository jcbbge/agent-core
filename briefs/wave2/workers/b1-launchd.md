# AGNT launchd herdr server

You are AGNT B1 under orch-phase4-automation. Deliver a launchd unit so the herdr headless server comes up at login without a second instance fighting the live fleet. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified)
- herdr 0.8.0; real binary `/Users/jrg/.local/bin/herdr`; wrapper `/Users/jrg/bin/herdr`.
- Headless server form: `herdr server` (help: "Run as headless server"). Named sessions: `herdr --session <name> server` (spine-lab uses this). Default session socket: `~/.config/herdr/herdr.sock`.
- Live server NOW: `herdr status server` → running, socket `~/.config/herdr/herdr.sock`. PID observed via `pgrep -fl herdr` includes `/Users/jrg/.local/bin/herdr`. Do not stop it. Do not `herdr server stop`.
- No `com.herdr.*` plists exist under `~/Library/LaunchAgents/` today. Template style: `~/dotfiles/launchagents/com.localllm.server.plist` (RunAtLoad, KeepAlive false for that service — choose KeepAlive appropriately for a long-lived server).
- `~/dotfiles` IS a git repo. Stage new files there; do not commit (ORCH commits).
- SAFETY: never touch the live default session. Your activation path must detect an already-running server (socket answering / `herdr status server`) and refuse to spawn a second instance.

## Parallel Work Notice
Siblings: B2 (`herdr-plugin.toml` + `bin/spine-startup`), B3 (`bin/spine-spawn` + `docs/spawn.md`), B4 (`~/circadian` branch `wake-slim`). Ignore their uncommitted changes. Touch ONLY your partition.

## Tower
Post from `/Users/jrg/herdr-spine` (or `/Users/jrg/dotfiles` when writing there):
```
cd /Users/jrg/herdr-spine && bun ~/.tower/cli.mjs post <claim|finding|note> herdr-spine/phase4 "<body>" --from agnt-b1-launchd
```
CLAIM on start. Finding with evidence on finish. Questions go up to orch-phase4-automation, not the operator.

## Partition (ONLY these paths)
- `~/Library/LaunchAgents/com.herdr.server.plist` (or `com.herdr.*` you choose — document the label)
- `~/dotfiles/launchagents/com.herdr.server.plist` (canonical copy + short README/doc note if a docs file already exists for launchagents; otherwise a `~/dotfiles/launchagents/README-herdr.md`)
- Optional helper script under `~/dotfiles/launchagents/` or `~/herdr-spine/bin/herdr-server-launchd.sh` IF needed for the safe-start guard (prefer one small wrapper that exits 0 when server already up)

Do NOT edit: `herdr-plugin.toml`, `bin/spine-spawn`, circadian, `~/.tower/**`, live herdr config.toml.

## Tasks
1. Author a launchd plist: Label `com.herdr.server`, ProgramArguments invoke the REAL binary (`/Users/jrg/.local/bin/herdr` with `server` — or a wrapper that checks liveness first). RunAtLoad true. KeepAlive: only if safe (if KeepAlive would respawn while operator intentionally stopped, prefer KeepAlive false + RunAtLoad, document tradeoff).
2. `plutil -lint` clean on both copies.
3. SAFE activation: if server already running, do nothing destructive. Prefer: install plist to `~/Library/LaunchAgents/` AND `~/dotfiles/launchagents/`, but DO NOT `launchctl load`/`bootstrap` against a live server unless you can prove the ProgramArguments path is a no-op when the socket already answers. Default: deliver loaded-on-next-login + document exact manual activation command (`launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.herdr.server.plist` or current macOS equivalent).
4. Write evidence file: `~/agent-core/briefs/wave2/done/b1-launchd.evidence.md` with lint output, install paths, activation decision (live-loaded: yes/no + why), and the exact next-login / manual commands.

## Constraints
- Never `herdr server stop`. Never kill PID of the live server.
- Never commit.
- No mocks.

## Done when
- Both plists exist, `plutil -lint` exits 0.
- Evidence file written.
- Live server still `status: running` after your work.
- Board finding posted.
- Final action: `touch ~/agent-core/briefs/wave2/done/b1-launchd.done`

## Report back with
Label chosen, KeepAlive decision + rationale, live-load yes/no, lint evidence, next-boot steps, path to evidence file.
