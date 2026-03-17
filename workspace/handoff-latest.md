# Session Handoff
Date: 2026-03-17
Mode: meta/systems — dev-brain MCP infrastructure

## Completed

- **Fixed dev-brain MCP auth drop on SurrealDB reconnect (for real this time)** — Previous fix (same day, earlier session) only called `resetDb()` after returning the error — wrong order. Root cause: surrealdb v2.0.0-beta.1 auto-reconnects the WebSocket without re-authenticating (JWT expires after 1hr, no credential re-signin path on reconnect). Fix: (1) disabled auto-reconnect via `reconnect: { enabled: false }` on `client.connect()`, (2) added retry-once after `resetDb()` in both HTTP and stdio handlers so the caller never sees the error, (3) changed pattern `"connection"` → `"connect"` to also catch `"connected"` substring. Proven in log. See ADR-018.

- **Fixed `create_todo` schema rejection** — `task` table is SCHEMAFULL, had no `feature` field. Agents passing `feature` to `create_todo` got schema rejection errors. Added `DEFINE FIELD feature ON task TYPE none | string` to SurrealDB dev/brain + added `feature` to the `CREATE task SET ...` query in `handleCreateTodo`.

- **Fixed `ghost_handshake` ORDER BY parse error** — SurrealDB 3.0 requires ORDER BY fields to appear in SELECT. The anchor embedding query did `SELECT embedding ... ORDER BY created_at DESC` — `created_at` was not selected. Changed to `SELECT embedding, created_at ...`. Had been silently failing on every `ghost_handshake` call.

## Decisions Captured

- ADR-018: Disable surrealdb client auto-reconnect in dev-brain MCP

## agent-core state

- All three fixes live in `~/dev-backbone/mcp-server/index.js`
- Schema change applied directly to SurrealDB (dev/brain, task table)
- dev-brain MCP daemon: `com.jcbbge.dev-brain-mcp` running, exit 0

## Open Items

1. `~/dev-backbone` has no git repo — `index.js` changes are unversioned. Consider `git init` to prevent fixes being lost.
2. MCP log has 600+ process restart entries — investigate whether parallel Claude instances are thrashing the daemon via concurrent launchctl restarts. May need restart-rate guard in plist or a coordinator.

## Next Session Focus

Investigate the 600+ restart pattern in `~/.dev-brain/mcp.log` — diagnose whether parallel agent sessions are thrashing the daemon and add protection if so.
