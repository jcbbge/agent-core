#!/usr/bin/env bash
# spawn-door — PreToolUse guard (CC Bash / cursor Shell). Raw fleet-mutating
# herdr verbs are refused and pointed at their door:
#
#   herdr agent start      → ~/bin/spine-spawn   (stamps role+name+task,
#                            delivers brief, verified submit — spawn.md)
#   herdr workspace close  → spine-workspace close --why "<reason>"
#                            (board trace + operator-visible echo)
#
# Law: ENFORCEMENT.md (agent-core/primitives/rules/). A tool whose only open
# door complies by construction beats a rule that must be remembered.
# Bypass (audited): prefix the command with SPAWN_DOOR=off — the guard
# allows it and posts a bypass note to the board, mirroring the write-gate's
# audited-bypass pattern. Fail-open on any internal error: a guard that
# bricks the machine is a failed guard.

command -v jq &>/dev/null || exit 0

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // .tool_input.cmd // .command // empty' 2>/dev/null)
[ -z "$CMD" ] && exit 0

# Audited bypass.
case "$CMD" in
  *SPAWN_DOOR=off*)
    { bun ~/.tower/cli.mjs post note house/spawn-door \
        "bypass: ${CMD:0:160}" --from spawn-door &>/dev/null & } 2>/dev/null
    exit 0 ;;
esac

# Strip quoted segments so doc-greps ('rg "herdr agent start"') and commit
# messages never match. Newlines are flattened FIRST so a quote pair spanning
# lines (heredoc commit bodies) still pairs correctly — line-by-line sed
# mis-paired them and blocked a legitimate git commit (caught live 2026-08-14).
STRIPPED=$(printf '%s' "$CMD" | tr '\n' ' ' | sed -e "s/'[^']*'//g" -e 's/"[^"]*"//g')

DENY=""
case "$STRIPPED" in
  *"herdr agent start"*)
    DENY="raw 'herdr agent start' is closed. Spawn through the door: ~/bin/spine-spawn (orch|worker|fanout|prompt) — it stamps role/name/task, delivers the brief, and verifies submit. Docs: ~/herdr-spine/docs/spawn.md. Deliberate low-level need: prefix SPAWN_DOOR=off (audited)." ;;
  *"herdr workspace close"*)
    DENY="raw 'herdr workspace close' is closed. Use: spine-workspace close <id> --why \"<reason>\" — it posts the board trace and the operator-visible line. Diagnosis is not Land: close only at Done or Parked-on-disk (control-flow.md). Deliberate low-level need: prefix SPAWN_DOOR=off (audited)." ;;
esac
[ -z "$DENY" ] && exit 0

# Emit deny in BOTH harness schemas; each harness reads its own key.
jq -n --arg reason "$DENY" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": $reason
  },
  "permission": "deny",
  "agent_message": $reason
}'
exit 0
