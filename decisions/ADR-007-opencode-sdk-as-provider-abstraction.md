# ADR-007: OpenCode SDK as Provider Abstraction for Subagent Delegation

**Date:** 2026-03-11
**Status:** Accepted

## Context

The subagent-mcp server (PRD-006) was built with the Anthropic SDK hardcoded. Every `subagents_delegate` call went directly to the Anthropic API, making it provider-locked. Josh's stated requirement from the start: provider/model/harness-agnostic. A harness that only works with Anthropic isn't a primitive — it's a plugin.

The alternatives were: Vercel AI SDK (provider-agnostic, standalone), raw OpenAI-compatible HTTP, or the OpenCode SDK (`@opencode-ai/sdk`). OpenCode was chosen because it's already in the stack as a harness and has a running server with auth already configured.

## Decision

Use `@opencode-ai/sdk` (`createOpencode()`) as the LLM provider abstraction layer for subagent delegation. The embedded OpenCode server proxies calls to whatever provider is configured in `~/.config/opencode/opencode.json`. Agent definitions specify `provider` and `model` as YAML frontmatter — no code changes needed to switch providers.

## Consequences

**Easier:**
- Adding a new provider requires only updating `opencode.json` and the agent definition file
- Provider credentials live in one place (OpenCode config) — no key duplication
- Model routing inherits OpenCode's whitelist/validation logic

**Harder:**
- subagent-mcp now requires the `opencode` binary in PATH (plist dependency)
- The OpenCode SDK is session-based with SSE streaming — delegation is async, not request-response. Requires concurrent event subscription pattern to avoid race conditions
- Model IDs must match OpenCode's internal registry (e.g. `anthropic/claude-sonnet-4.5` not `claude-haiku-4-5-20251001`)

**New problems created:**
- `OPENROUTER_API_KEY` (or equivalent) must be in the daemon's environment — `.zshrc` isn't sourced by launchctl. Must be explicitly set in the plist `EnvironmentVariables`

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Keep Anthropic SDK | Hardcodes one provider. Violates the provider-agnostic requirement. |
| Vercel AI SDK | Requires one adapter package per provider. Each provider still needs its own API key in the plist. More config surface. |
| Raw OpenAI-compatible HTTP | Most portable but duplicates auth logic OpenCode already handles. |

## Resonance

The instinct to use what's already in the stack rather than adding new dependencies. OpenCode is already running. Its auth is already configured. The embedded server pattern means subagent-mcp inherits the full provider ecosystem for free. The complexity cost is real (SSE async pattern) but the coupling benefit outweighs it.
