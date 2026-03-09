#!/bin/bash
# test-hook-chain.sh — Experiment 3: Can a hook trigger a skill?
# Trigger: PostToolUse on any tool

# Log that hook fired
LOG_FILE="/tmp/hook-chain-test.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] HOOK FIRED: test-hook-chain" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Tool: $CLAUDE_TOOL_NAME" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attempting to trigger skill chain..." >> "$LOG_FILE"

# Try to signal that a skill should be loaded
# Method: Write marker file that model could detect
MARKER_FILE="/tmp/hook-skill-trigger"
echo "TRIGGER: test-chain-target" > "$MARKER_FILE"
echo "TIMESTAMP: $(date +%s)" >> "$MARKER_FILE"
echo "SOURCE_HOOK: test-hook-chain" >> "$MARKER_FILE"
echo "TOOL_NAME: $CLAUDE_TOOL_NAME" >> "$MARKER_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Marker written to $MARKER_FILE" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hook execution complete" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

# Exit cleanly — hooks must not fail
echo "Hook completed" >&2
exit 0
