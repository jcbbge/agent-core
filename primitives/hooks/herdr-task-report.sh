#!/bin/sh
# herdr-task-report — auto-populate the Herdr sidebar's $task line for Claude Code panes.
#
# WHY THIS EXISTS
# ~/.config/herdr/config.toml asks each agent row for a second line:
#     rows = [["state_icon","state_text","agent","workspace"], ["$task","$claim"]]
# `$task` is a pane metadata token. herdr never invents it — something must
# report it. herdr's own integration (hooks/herdr-agent-state.sh) reports only
# agent STATE (idle/working/blocked), never task text — verified: it contains
# zero `report-metadata` calls. So that second line rendered empty on every
# Claude pane: you could see THAT claude was done, never WHAT it was done with.
#
# This is a SEPARATE file on purpose. herdr-agent-state.sh says:
#   "managed by herdr; reinstalling or updating the integration overwrites this
#    file. add custom hooks beside this file instead of editing it."
# This is that hook, beside it. `herdr integration install claude` cannot clobber it.
#
# WIRING (settings.json)
#   UserPromptSubmit -> prompt   : the request becomes the task line
#   PreToolUse       -> tool     : verb + target while work happens
#   Stop             -> done     : "done: <request>"
#   SessionEnd       -> clear    : token removed
#
# MECHANISM
# `herdr pane report-metadata <pane> --source custom:spine --token task=...`
# — herdr-native sidebar tokens (--source/--token/--ttl-ms; no --key/--value).
#
# Fails silent and fast outside a Herdr pane: safe in a bare terminal, CI, or
# a headless `claude -p` run. Never blocks a turn; never non-zero exits.
# report-metadata is fire-and-forget (background subshell) — matches pi's
# herdr-task-report.ts detached spawn; the herdr socket round trip must not
# block the hook chain.

set -eu

action="${1:-}"

# Read hook JSON from stdin before any early exit, so we never block the writer.
hook_input=""
if [ ! -t 0 ]; then
  hook_input="$(cat 2>/dev/null || true)"
fi

# --- guards: only act inside a live Herdr pane -------------------------------
[ "${HERDR_ENV:-}" = "1" ]        || exit 0
[ -n "${HERDR_PANE_ID:-}" ]       || exit 0
[ -n "${HERDR_SOCKET_PATH:-}" ]   || exit 0
command -v herdr >/dev/null 2>&1  || exit 0

SOURCE="custom:spine"
TTL_MS=900000                     # 15 min sidebar task token TTL
STATE_DIR="${TMPDIR:-/tmp}/herdr-task-report"
STATE_FILE="$STATE_DIR/${HERDR_PANE_ID}.request"
mkdir -p "$STATE_DIR" 2>/dev/null || exit 0

# Ignore subagent traffic — only the root session owns the pane's row.
# (Same rule herdr's own integration applies via the agent_id field.)
case "$hook_input" in
  *'"agent_id"'*) exit 0 ;;
esac

report() {
  # $1 = token value; empty clears the token — fire-and-forget, never await herdr
  if [ -n "${1:-}" ]; then
    ( herdr pane report-metadata "$HERDR_PANE_ID" --source "$SOURCE" \
      --token "task=$1" --ttl-ms "$TTL_MS" >/dev/null 2>&1 || true ) &
  else
    ( herdr pane report-metadata "$HERDR_PANE_ID" --source "$SOURCE" \
      --clear-token task >/dev/null 2>&1 || true ) &
  fi
}

# Extract a field from the hook JSON and shorten it for a 26-36 col sidebar.
# python3 is the only dependency, and it is the same one herdr's hook requires.
extract() {
  # $1 = mode (prompt|tool)
  command -v python3 >/dev/null 2>&1 || return 1
  MODE="$1" HOOK_JSON="$hook_input" python3 - <<'PY' 2>/dev/null || return 1
import json, os, re, sys

MAX = 58
mode = os.environ.get("MODE", "")
raw = os.environ.get("HOOK_JSON") or ""

try:
    data = json.loads(raw) if raw.strip() else {}
except Exception:
    data = {}

def shorten(s):
    s = re.sub(r"[\x00-\x1f\x7f]", " ", str(s))
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) <= MAX:
        return s
    cut = s[:MAX]
    sp = cut.rfind(" ")
    return (cut[:sp] if sp > MAX * 0.6 else cut) + "\u2026"

def base(p):
    p = str(p).rstrip("/")
    return p.rsplit("/", 1)[-1] or p

out = ""

if mode == "prompt":
    out = data.get("prompt") or ""

elif mode == "tool":
    name = str(data.get("tool_name") or "tool")
    ti = data.get("tool_input") or {}
    if not isinstance(ti, dict):
        ti = {}
    if name in ("Read", "Write"):
        out = f"{name.lower()} {base(ti.get('file_path', ''))}"
    elif name in ("Edit", "MultiEdit", "NotebookEdit"):
        out = f"edit {base(ti.get('file_path') or ti.get('notebook_path') or '')}"
    elif name == "Bash":
        cmd = str(ti.get("command") or "").strip()
        out = "run " + " ".join(cmd.split()[:3])
    elif name in ("Grep", "Glob"):
        out = f"{name.lower()} {ti.get('pattern') or ''}"
    elif name in ("Task", "Agent"):
        out = f"delegate: {ti.get('description') or ti.get('subagent_type') or 'subagent'}"
    elif name == "WebFetch":
        out = f"fetch {ti.get('url') or ''}"
    elif name == "WebSearch":
        out = f"search {ti.get('query') or ''}"
    elif name == "TodoWrite":
        out = "updating plan"
    else:
        out = re.sub(r"^mcp__", "", name).replace("__", " ").replace("_", " ")

sys.stdout.write(shorten(out))
PY
}

case "$action" in
  prompt)
    text="$(extract prompt || true)"
    [ -n "$text" ] || exit 0
    printf '%s' "$text" >"$STATE_FILE" 2>/dev/null || true
    report "$text"
    ;;

  tool)
    text="$(extract tool || true)"
    [ -n "$text" ] || exit 0
    report "$text"
    ;;

  done)
    if [ -r "$STATE_FILE" ]; then
      req="$(cat "$STATE_FILE" 2>/dev/null || true)"
    else
      req=""
    fi
    if [ -n "$req" ]; then
      # re-truncate: "done: " prefix can push it past the column budget
      report "$(printf 'done: %s' "$req" | cut -c1-58)"
    else
      report "idle"
    fi
    ;;

  clear)
    report ""
    rm -f "$STATE_FILE" 2>/dev/null || true
    ;;

  *)
    exit 0
    ;;
esac

exit 0
