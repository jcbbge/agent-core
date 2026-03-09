#!/usr/bin/env bash
# observe-mcp.sh — PostToolUse hook
# Fires on every MCP tool call. Emits to SurrealDB.
# Env: CLAUDE_TOOL_NAME injected as the full tool name e.g. mcp__anima__anima_bootstrap

TOOL_NAME="${CLAUDE_TOOL_NAME:-${TOOL_NAME:-}}"
[[ -z "$TOOL_NAME" ]] && exit 0

# Extract server and tool from mcp__<server>__<tool>
SERVER=$(echo "$TOOL_NAME" | sed 's/mcp__//; s/__[^_]*//' | cut -d_ -f1-2 | sed 's/mcp__//')
# Simpler: just use full tool name as primitive_name, server as metadata
SERVER=$(echo "$TOOL_NAME" | awk -F'__' '{print $2}')
TOOL=$(echo "$TOOL_NAME" | awk -F'__' '{print $3}')

bash "$HOME/Documents/_agents/observe/emit.sh" \
  "claude-code" \
  "mcp" \
  "$TOOL_NAME" \
  "{\"server\":\"$SERVER\",\"tool\":\"$TOOL\"}" 2>/dev/null || true
