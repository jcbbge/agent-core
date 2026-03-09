#!/usr/bin/env bash
# observe-subagent.sh — PostToolUse hook
# Fires when orchestrator reads a subagent definition. Emits to SurrealDB.
# Env: TOOL_INPUT_FILE_PATH (injected by Claude Code PostToolUse)

FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"
[[ -z "$FILE_PATH" ]] && exit 0

# Extract agent name from .../agents/<name>.md
AGENT_NAME=$(basename "$FILE_PATH" .md)

[[ -z "$AGENT_NAME" || "$AGENT_NAME" == "$FILE_PATH" ]] && exit 0

bash "$HOME/Documents/_agents/observe/emit.sh" \
  "claude-code" \
  "subagent" \
  "$AGENT_NAME" \
  "{\"file_path\":\"$FILE_PATH\"}" 2>/dev/null || true
