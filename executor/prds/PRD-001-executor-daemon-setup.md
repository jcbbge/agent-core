# PRD-001: Executor Daemon Installation and Setup

**Task ID:** #2
**Wave:** 1 (no dependencies)
**Blocks:** #3, #4, #6
**Runtime:** Bun / macOS

---

## Kotadb Code Intelligence

The executor repo is cloned and indexed at `/Users/jcbbge/executor`. Kotadb is running at `http://localhost:3099/`.

Use kotadb if you need to inspect executor internals — e.g. to verify the binary entry point, find the CLI command definitions, or check the plist-relevant config values:
```bash
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_symbols","arguments":{"query":"DEFAULT_SERVER_PORT","repository":"RhysSullivan/executor"}}}'
```

Relevant confirmed facts from codebase inspection:
- Default port defined in `packages/server/src/config.ts` line 30: `export const DEFAULT_SERVER_PORT = 8788`
- Port override CLI flag in `apps/executor/src/cli/main.ts` ~line 965: `Options.integer("port")`
- Correct foreground command: `executor server start --port 8000`
- macOS data dir: `~/Library/Application Support/Executor/`
- No plist template exists in the repo — write from scratch

---

## Overview

Install the executor daemon locally, configure it to run on port 8000 (reserved in infrastructure.md), and register it as a launchctl service so it starts on boot and persists across sessions.

---

## Goals

- Executor daemon running at `http://127.0.0.1:8000`
- Starts automatically via launchctl on login
- Port 8000 marked active in infrastructure.md
- Zero changes to any existing infrastructure

## Non-Goals

- Do not modify port allocations for existing services (3097, 3098, 3099, 8002)
- Do not touch ~/.claude.json, harness configs, or registry.json (those are Task #4)
- Do not add any sources yet (that is Task #3)

---

## Technical Specification

### 1. Install executor globally

Install the published npm package. This gives you the stable daemon binary now, independent of the source fork at `~/executor` (which PRD-004 will modify separately).

```bash
npm install -g executor
```

Verify install:
```bash
executor --version
# Expected: 1.1.9 or later
```

> **Note on source vs. npm:** The daemon runs from the globally installed npm binary for now. Once PRD-004 (content source kind) is complete, the plist will be updated to point at the locally built binary from `~/executor`. This is intentional — Wave 1 gets the daemon running without waiting for the fork work.

### 2. First-run provisioning

No action required. On first start, executor automatically provisions:
- Local account (`acc_<uuid>`)
- Personal organization (`org_<uuid>`)
- Default workspace (`ws_<uuid>`)

This happens silently. No wizard, no user input, no network call.

Data directory on macOS: `~/Library/Application Support/Executor/`

### 3. Test foreground start

Verify the port flag works before writing the plist:

```bash
executor server start --port 8000
```

Expected: server starts, logs to stdout, reachable at `http://127.0.0.1:8000`.

Verify:
```bash
executor status --json
# Should return JSON with port: 8000, status: running
```

Stop with Ctrl+C before proceeding.

### 4. Write launchctl plist

Create `/Users/jcbbge/Library/LaunchAgents/dev.brain.executor.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.brain.executor</string>

  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/executor</string>
    <string>server</string>
    <string>start</string>
    <string>--port</string>
    <string>8000</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/Users/jcbbge/Library/Application Support/Executor/run/server.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/jcbbge/Library/Application Support/Executor/run/server.log</string>

  <key>WorkingDirectory</key>
  <string>/Users/jcbbge</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>/Users/jcbbge</string>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
  </dict>
</dict>
</plist>
```

> **Note:** Verify the exact path of the executor binary first:
> ```bash
> which executor
> ```
> Update `ProgramArguments` first entry to match.

Also verify the log directory exists before loading:
```bash
mkdir -p "/Users/jcbbge/Library/Application Support/Executor/run"
```

### 5. Load and start the daemon

```bash
launchctl load ~/Library/LaunchAgents/dev.brain.executor.plist
launchctl start dev.brain.executor
```

### 6. Verify daemon is running

```bash
launchctl list | grep executor
# Should show dev.brain.executor with PID (non-zero)

curl http://127.0.0.1:8000/v1/local/installation
# Should return JSON with accountId, orgId, workspaceId
```

### 7. Update infrastructure.md

In `~/Documents/_agents/brain-infrastructure.md`, update the port 8000 entry from:
```
8000 — executor (reserved, not yet installed)
```
to:
```
8000 — executor daemon (active) — http://127.0.0.1:8000 — label: dev.brain.executor
```

### 8. Update registry.json port_allocation

In `~/Documents/_agents/primitives/mcp/registry.json`, update `port_allocation`:
```json
"8000": "executor daemon — http://127.0.0.1:8000 — label: dev.brain.executor"
```

---

## Acceptance Criteria

- [ ] `executor server start --port 8000` runs without error
- [ ] `curl http://127.0.0.1:8000/v1/local/installation` returns valid JSON
- [ ] `launchctl list | grep executor` shows PID (non-zero = running)
- [ ] Daemon survives a `launchctl stop` + `launchctl start` cycle
- [ ] infrastructure.md and registry.json updated to reflect active status
- [ ] No existing ports (3097, 3098, 3099, 8002) affected

---

## Rollback

```bash
launchctl stop dev.brain.executor
launchctl unload ~/Library/LaunchAgents/dev.brain.executor.plist
rm ~/Library/LaunchAgents/dev.brain.executor.plist
npm uninstall -g executor
```
