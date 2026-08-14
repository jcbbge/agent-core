#!/usr/bin/env bash
# slim-guard-cursor — Cursor preToolUse:Shell hook. Rewrites commands through
# `slim rewrite` (the 6-verb output compactor, ~/agent-core/primitives/tools/slim/),
# allowlisted to the measured-safe verbs. Port of slim-guard.sh (Claude Code
# PreToolUse) to Cursor's hook protocol: Cursor's beforeShellExecution cannot
# rewrite input, so this runs on preToolUse with a Shell matcher and returns
# updated_input. Truth law: slim propagates child exit codes, passes
# unparseable output through raw, and marks every truncation — the guard only
# decides WHETHER a rewrite applies, never what output looks like.

if ! command -v jq &>/dev/null; then
  exit 0
fi

SLIM="${SLIM_BIN_PATH:-$HOME/.local/bin/slim}"
if [ ! -x "$SLIM" ]; then
  exit 0
fi

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // .tool_input.cmd // .command // empty')
[ -z "$CMD" ] && exit 0

REWRITTEN=$("$SLIM" rewrite "$CMD" 2>/dev/null)
EXIT_CODE=$?

# exit 0 + stdout = rewrite exists; exit 1 = no rewrite (pass through).
[ "$EXIT_CODE" -ne 0 ] && exit 0
if [ -z "$REWRITTEN" ] || [ "$CMD" = "$REWRITTEN" ]; then
  exit 0
fi

# Allowlist: only the six measured-safe verbs; no pipes/compounds/
# substitution; machine-format flags stay raw. Defense in depth — slim's
# own mapper also refuses these.
case "$CMD" in
  *"|"*|*"&"*|*";"*|*'$('*|*'`'*) exit 0 ;;
  *--porcelain*|*--format*|*--pretty*) exit 0 ;;
esac
case "$REWRITTEN" in
  "slim ls"*|"slim ps"*|"slim wc"*|"slim df"*|"slim git status"*|"slim git log"*) ;;
  *) exit 0 ;;
esac

UPDATED_INPUT=$(echo "$INPUT" | jq -c --arg cmd "$REWRITTEN" '.tool_input | .command = $cmd')
jq -n --argjson updated "$UPDATED_INPUT" '{
  permission: "allow",
  agent_message: "slim rewrite (allowlisted verb)",
  updated_input: $updated
}'
