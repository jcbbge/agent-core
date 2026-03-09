#!/usr/bin/env bash
# observe-rule.sh — PostToolUse hook
# Fires when agent reads a rule file. Emits rule load event to SurrealDB.
# Env: TOOL_INPUT_FILE_PATH (injected by Claude Code PostToolUse)

FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"
[[ -z "$FILE_PATH" ]] && exit 0

# Extract rule name from .../rules/<name>.md
RULE_NAME=$(basename "$FILE_PATH" .md)

[[ -z "$RULE_NAME" || "$RULE_NAME" == "$FILE_PATH" ]] && exit 0

bash "$HOME/Documents/_agents/observe/emit.sh" \
  "claude-code" \
  "rule" \
  "$RULE_NAME" \
  "{\"file_path\":\"$FILE_PATH\"}" 2>/dev/null || true
