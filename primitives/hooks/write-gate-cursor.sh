#!/usr/bin/env bash
# write-gate-cursor — cursor `stop` hook adapter for the Tower write-gate.
# Cursor's stop hook cannot refuse a stop (fire-and-forget), but it CAN
# auto-submit a follow-up user message: `{"followup_message": "..."}`
# (cursor.com/docs/agent/hooks, fetched 2026-08-14). Same refusal semantics
# as the CC Stop hook, delivered as an injected continuation instead of an
# exit-2 block. The gate's own 3-refusal audited bypass caps the loop;
# cursor's loop_limit (default 5) backstops it.
#
# stdin:  {"status":"completed|aborted|error","loop_count":N}
# stdout: {"followup_message":"<release instruction>"} or nothing.
# Fail open always — a gate that bricks the harness is a failed gate.

command -v jq &>/dev/null || exit 0
GATE="$HOME/.tower/hooks/write-gate.mjs"
[ -e "$GATE" ] || exit 0

INPUT=$(cat)
STATUS=$(printf '%s' "$INPUT" | jq -r '.status // "completed"' 2>/dev/null)
[ "$STATUS" = "completed" ] || exit 0   # aborted/error stops are never gated

SID="${CURSOR_SESSION_ID:-cursor-$PPID}"
EVT=$(jq -n --arg cwd "$PWD" --arg sid "$SID" \
  '{cwd:$cwd, session_id:$sid, stop_hook_active:false}')

ERR=$(printf '%s' "$EVT" | bun "$GATE" 2>&1 1>/dev/null)
CODE=$?

if [ "$CODE" -eq 2 ] && [ -n "$ERR" ]; then
  jq -n --arg m "$ERR" '{followup_message: $m}'
fi
exit 0
