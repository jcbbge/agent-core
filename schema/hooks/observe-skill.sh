#!/usr/bin/env bash
# observe-skill.sh — PostToolUse hook
# Fires when agent reads a SKILL.md. Emits skill invocation to SurrealDB.
# Env: TOOL_INPUT_FILE_PATH (injected by Claude Code PostToolUse)

FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"
[[ -z "$FILE_PATH" ]] && exit 0

# Extract skill name from .../skills/<name>/SKILL.md
SKILL_NAME=$(echo "$FILE_PATH" | sed 's|.*/skills/||' | sed 's|/SKILL\.md$||')

# Only emit if extraction succeeded (not empty, not the full path)
[[ -z "$SKILL_NAME" || "$SKILL_NAME" == "$FILE_PATH" ]] && exit 0

bash "$HOME/Documents/_agents/observe/emit.sh" \
  "claude-code" \
  "skill" \
  "$SKILL_NAME" \
  "{\"file_path\":\"$FILE_PATH\"}" 2>/dev/null || true
