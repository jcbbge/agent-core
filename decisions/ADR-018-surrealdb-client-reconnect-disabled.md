# ADR-018: Disable surrealdb Client Auto-Reconnect in dev-brain MCP

**Date:** 2026-03-17
**Status:** Accepted

## Context

The dev-brain MCP server (`~/dev-backbone/mcp-server/index.js`) was producing intermittent "Anonymous access not allowed: Not enough permissions to perform this action" errors on tool calls. The error appeared in bursts, was non-deterministic, and had been seen across 17 occurrences in the MCP log spanning the full log history.

Root cause: the `surrealdb` JS client (v2.0.0-beta.1) has auto-reconnect enabled by default (`attempts: 5`). When the SurrealDB WebSocket drops (SurrealDB restart, network hiccup), the client auto-reconnects the socket — but the new session is unauthenticated. The `#applyAuthentication` method on reconnect only re-authenticates via stored JWT. Root-credential `signin()` yields a JWT with a 1-hour TTL. After expiry, any reconnect leaves the session anonymous instead of re-signing in with credentials.

The existing code already had `resetDb()` and `isConnectionError()` detection, but only reset the singleton — it did not retry the current call. So the caller always saw the error, and only the *next* call would benefit from a fresh connection.

A second related issue: the `CONNECTION_ERROR_PATTERNS` array used `"connection"` (10 chars) as a substring match, which did not catch `"connected"` (9 chars) — so the error "You must be connected to a SurrealDB instance" fell through without triggering `resetDb()`.

## Decision

1. Pass `{ reconnect: { enabled: false } }` to `client.connect()`. The surrealdb client will no longer silently reconnect without re-authenticating. When the WS drops, queries fail cleanly with a connection error.

2. After `resetDb()` is called in both the HTTP and stdio error handlers, retry the handler once before returning an error to the caller. A fresh `getDb()` call establishes a new authenticated connection.

3. Replace `"connection"` with `"connect"` in `CONNECTION_ERROR_PATTERNS` so both `"connection"` and `"connected"` match.

## Consequences

**Easier:**
- Auth errors are now self-healing within the same tool call — callers never see "Anonymous access not allowed"
- SurrealDB restarts are fully transparent to MCP clients
- Error handling is deterministic: one class of errors → reset → retry → success or definitive failure

**Harder:**
- Nothing material. The client's built-in reconnect was causing more harm than good given credential-based auth.

**New problems created:**
- None identified. If SurrealDB is down for >5s during the retry, the retry also fails — but that's the correct behavior (surface the error, don't silently hang).

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Keep auto-reconnect, re-signin after reconnect event | The surrealdb client exposes no `reconnected` event that fires reliably after WS re-establishment; would require patching the client internals |
| Increase JWT TTL to avoid expiry | TTL is set server-side; doesn't fix the race condition when SurrealDB restarts |
| Poll with health check before each query | Adds latency on every call; symptoms-not-cause approach |

## Resonance

The bug had been reset-and-forgotten repeatedly. The retry was always one step away — the `resetDb()` call was already there, the reconnect was already working. The missing piece was that `resetDb()` happened *after* returning the error, not before. One line of "try again" collapsed the entire recurring failure.
