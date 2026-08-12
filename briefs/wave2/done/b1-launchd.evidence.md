# B1 launchd herdr server — evidence

Agent: agnt-b1-launchd, under orch-phase4-automation.

## Deliverables (partition only)
- `~/Library/LaunchAgents/com.herdr.server.plist` (deployed copy)
- `~/dotfiles/launchagents/com.herdr.server.plist` (canonical, git-staged not committed)
- `~/dotfiles/launchagents/herdr-server-launchd.sh` (safe-start guard, chmod +x)
- `~/dotfiles/launchagents/README-herdr.md` (doc)

## Label
`com.herdr.server`

## KeepAlive decision
`KeepAlive = false`, `RunAtLoad = true`.
Rationale: the operator sometimes intentionally stops the server
(`herdr server stop`). `KeepAlive = true` would respawn it immediately and fight
that intent, violating the brief's SAFETY line. We honor an intentional stop over
auto-restart-on-crash. The guard's liveness probe additionally makes any future
respawn safe (it exits 0 when a server already answers).

## Safe-start guard
`herdr-server-launchd.sh` probes `herdr status server`; if it reports
`status: running` the guard exits 0 (no-op) so a second login / re-load /
`launchctl kickstart` never spawns a competing instance. Otherwise it
`exec /Users/jrg/.local/bin/herdr server` (real binary) in the foreground so
launchd tracks the process.

Note: `herdr` itself also refuses to start a second server ("error: herdr server
is already running"), so this is defense in depth.

### Guard dry-run against the LIVE server (proves no-op)
```
$ /Users/jrg/dotfiles/launchagents/herdr-server-launchd.sh
herdr-server-launchd: server already running; guard exiting 0 (no second instance).
guard exit: 0
```
Live server untouched afterward — single instance:
```
$ pgrep -fl '/Users/jrg/.local/bin/herdr$'
20575 /Users/jrg/.local/bin/herdr
$ herdr status server
status: running
version: 0.8.0
protocol: 19
```

## Lint output (plutil -lint)
```
/Users/jrg/dotfiles/launchagents/com.herdr.server.plist: OK
/Users/jrg/Library/LaunchAgents/com.herdr.server.plist: OK
```
Both copies byte-identical (`diff` → IDENTICAL).

## Activation decision
- Live-loaded: NO.
- Why: a server was already running; per the brief's safety-first default we did
  not `launchctl bootstrap`/`load` against the live instance. The plist will load
  automatically on next login. The guard makes manual activation safe at any time.

### Exact next-login / manual activation commands
Automatic: loads on next login (RunAtLoad).

Manual (safe now — guard exits 0 if a server already answers):
```
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.herdr.server.plist
```
Inspect / tear down the launchd job (does not stop a manually-run server):
```
launchctl print gui/$(id -u)/com.herdr.server
launchctl bootout gui/$(id -u)/com.herdr.server
```
Force a restart of the job:
```
launchctl kickstart -k gui/$(id -u)/com.herdr.server
```

## Logs
`~/Library/Logs/herdr-server.out.log`, `~/Library/Logs/herdr-server.err.log`.

## Safety invariants held
- Never ran `herdr server stop`. Never killed the live PID (20575).
- Never `launchctl load`/`bootstrap` against the live server.
- Never committed. Files staged in ~/dotfiles for ORCH to commit.
- Live server `status: running` before, during, and after the work.
