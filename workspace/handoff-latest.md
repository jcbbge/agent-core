# Session Handoff
Date: 2026-03-11
Mode: meta/systems

## Completed

- **Replaced Anthropic SDK with `@opencode-ai/sdk` in subagent-mcp** — original PRD-006 hardcoded Anthropic. Rewrote `delegator.ts` to use OpenCode's embedded server (`createOpencode()`), routing all LLM calls through OpenCode's provider abstraction. Provider and model now declared in agent definition YAML — no code changes to switch providers.

- **Added `provider` field to all 5 agent definitions** — all set to `openrouter` with `anthropic/claude-sonnet-4.5` or `anthropic/claude-sonnet-4.6`. Model IDs validated against OpenCode's internal registry (only 2 Claude models available via OpenRouter whitelist).

- **Fixed SSE async pattern in delegator** — `session.prompt()` returns immediately (empty body). Actual response delivered via `client.event.subscribe()` SSE stream. Concurrent subscription pattern: subscribe → start for-await in background → send prompt → await `session.idle` event → fetch messages. Race condition fixed.

- **Fixed daemon PATH** — `~/.opencode/bin` added to plist so `createOpencode()` finds the binary.

- **Smoke test confirmed to 99%** — MCP connection ✓, agent listing ✓, model resolution ✓, API call reaching OpenRouter ✓. One blocker: auth.

## Decisions captured

- ADR-007: OpenCode SDK as provider abstraction for subagent delegation

## ONE open blocker

**`OPENROUTER_API_KEY` in plist is invalid.** Key from `~/.zshrc` returns 401 from OpenRouter directly. Find the current working key and set it in:

`~/Library/LaunchAgents/dev.brain.subagent-mcp.plist`

After updating key:
```
launchctl unload ~/Library/LaunchAgents/dev.brain.subagent-mcp.plist
launchctl load ~/Library/LaunchAgents/dev.brain.subagent-mcp.plist
launchctl start dev.brain.subagent-mcp
bun /Users/jcbbge/dev-backbone/subagent-mcp/smoke-test.ts
```

## Clean up after smoke test passes

- `~/dev-backbone/subagent-mcp/debug-events.ts`
- `~/dev-backbone/subagent-mcp/debug-models.ts`
- `~/dev-backbone/subagent-mcp/debug-prompt.ts`

## agent-core state

- 57 skills · 8 rules deployed
- subagent-mcp daemon port 3096 (blocked on auth)
- executor daemon port 8000
- All 3 harnesses have executor at `http://127.0.0.1:8000/mcp`

## Next session focus

Fix OpenRouter key → smoke test passes → Task #6 (PRD-007: wire content sources + subagent-mcp to executor agent-runtime, full stack smoke test).
