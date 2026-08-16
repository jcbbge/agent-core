#!/usr/bin/env bash
# doorbell-cursor — cursor `stop` hook: open operator questions must ring
# before the agent may idle. Cousin of write-gate-cursor.sh; uses
# followup_message injection (cursor stop cannot exit-2).
#
# stdin:  {"status":"completed|aborted|error","loop_count":N}
# stdout: {"followup_message":"<continuation>"} or nothing.
# Fail open always — a hook that bricks the harness is a failed hook.

command -v jq &>/dev/null || exit 0
command -v bun &>/dev/null || exit 0

LEDGER="$HOME/agent-core/primitives/hooks/tower-ledger.mjs"
[ -e "$LEDGER" ] || exit 0

INPUT=$(cat)
STATUS=$(printf '%s' "$INPUT" | jq -r '.status // "completed"' 2>/dev/null) || exit 0
[ -n "$STATUS" ] || exit 0
[ "$STATUS" = "completed" ] || exit 0
[ "${DOORBELL_HOOK:-}" = "off" ] && exit 0

PROJECT="${CURSOR_PROJECT_DIR:-$PWD}"
TOWER="${TOWER_HOME:-$HOME/.tower}"
RUNG_FILE="$TOWER/doorbell-rung.jsonl"

INBOX=$(
  CURSOR_PROJECT_DIR="$PROJECT" \
  TOWER_HOME="$TOWER" \
  TOWER_LEDGER_NO_CURSOR="${TOWER_LEDGER_NO_CURSOR:-}" \
  bun -e "
import { inboxState } from '$LEDGER'
console.log(JSON.stringify(inboxState(process.env.CURSOR_PROJECT_DIR)))
" 2>/dev/null
) || exit 0

OPEN=$(printf '%s' "$INBOX" | jq -c '.openQuestions // []' 2>/dev/null) || exit 0
COUNT=$(printf '%s' "$OPEN" | jq 'length' 2>/dev/null) || exit 0
[ "$COUNT" -gt 0 ] 2>/dev/null || exit 0

_rung_has() {
  local id="$1"
  [ -f "$RUNG_FILE" ] || return 1
  grep -Fxq "$id" "$RUNG_FILE" 2>/dev/null
}

UNRUNG_JSON=()
while IFS= read -r qjson; do
  [ -n "$qjson" ] || continue
  QID=$(printf '%s' "$qjson" | jq -r '.id // empty' 2>/dev/null) || continue
  [ -n "$QID" ] || continue
  _rung_has "$QID" && continue
  UNRUNG_JSON+=("$qjson")
done < <(printf '%s' "$OPEN" | jq -c '.[]' 2>/dev/null)

[ "${#UNRUNG_JSON[@]}" -gt 0 ] || exit 0

mkdir -p "$TOWER" 2>/dev/null || exit 0

MSG_PARTS=()
for qjson in "${UNRUNG_JSON[@]}"; do
  QID=$(printf '%s' "$qjson" | jq -r '.id // empty' 2>/dev/null) || continue
  QTEXT=$(printf '%s' "$qjson" | jq -r '.message // empty' 2>/dev/null | head -n1 | sed 's/[[:space:]]*$//') || continue
  [ -n "$QTEXT" ] || continue

  if [ -n "${DOORBELL_NOTIFY_CMD:-}" ]; then
    "$DOORBELL_NOTIFY_CMD" "operator question" "$QTEXT" 2>/dev/null || true
  else
    herdr notification show "operator question" --body "$QTEXT" --sound request 2>/dev/null || true
  fi

  printf '%s\n' "$QID" >>"$RUNG_FILE"

  if [ -f "$PROJECT/finding-store/cli.py" ]; then
    (cd "$PROJECT" && python3 finding-store/cli.py doorbell --question-id "$QID") 2>/dev/null || true
  fi

  MSG_PARTS+=("$QTEXT")
done

[ "${#MSG_PARTS[@]}" -gt 0 ] || exit 0

if [ "${#MSG_PARTS[@]}" -eq 1 ]; then
  FOLLOWUP="Operator question pending: ${MSG_PARTS[0]}"
else
  FOLLOWUP="Operator questions pending (${#MSG_PARTS[@]}). Answer via Tower before stopping."
fi

jq -n --arg m "$FOLLOWUP" '{followup_message: $m}'
exit 0
