#!/usr/bin/env bash
# session-boundary-cursor.sh — Cursor sessionStart hook.
#
# Injects Session Boundary Contract legs 1-4
# (primitives/rules/session-lifecycle.md, "The Session Boundary Contract"):
#   1. Tower carry-over — unrelayed operator mail + open questions
#   2. Last TODO: handoff (git log — repo is truth)
#   3. Flight snapshot pointer, <24h (~/.tower/flight/)
#   4. Memory substrate (circadian mind wake) — ~/circadian/src/wake.ts,
#      run via bun, stdout appended verbatim after legs 1-3. Currently in
#      kill-switch mode (R7): emits constitution + NOW only, not the full
#      SELF/USER/greeting substrate — that is normal upstream circadian
#      behavior, not a defect of this adapter. Wake also appends a
#      scoreboard row per run — normal wake side effect, acceptable here.
#
# Ported from ~/.tower/hooks/session-start.mjs (the claude-code reference
# adapter for the same contract). This is a boundary adapter per the layer
# doctrine: data only, never instructions, silent when there is nothing to
# say. Leg 4 is a data provider (circadian), not a behavioral mandate —
# whatever wake emits is appended as-is, never interpreted or gated here.
#
# Output: Cursor's sessionStart hook output schema accepts
# {"additional_context": "..."} and injects it into the conversation's
# initial system context (docs.cursor.com/docs/hooks; confirmed by local
# repro test 2026-08-12 — see AGNT cursor-boundary report). sessionStart
# runs fire-and-forget, so failures here never block session creation;
# this script always exits 0.

BUN="${BUN_BIN_PATH:-$HOME/.bun/bin/bun}"
TOWER_CLI="$HOME/.tower/cli.mjs"
FLIGHT_DIR="$HOME/.tower/flight"
JQ="$(command -v jq 2>/dev/null || true)"

INPUT="$(cat 2>/dev/null || true)"

# cwd for this session: sessionStart input carries workspace_roots (array);
# fall back to the script's own $PWD (so standalone/manual runs still work).
CWD=""
if [ -n "$JQ" ] && [ -n "$INPUT" ]; then
  CWD="$(printf '%s' "$INPUT" | "$JQ" -r '.workspace_roots[0] // empty' 2>/dev/null)"
fi
[ -n "$CWD" ] && [ -d "$CWD" ] || CWD="$PWD"

LINES=()
TOWER_LOADED=0
HANDOFF_LOADED=0
FLIGHT_LOADED=0
MEMORY_LOADED=0

# --- Leg 1: Tower carry-over ---------------------------------------------
if [ -x "$BUN" ] && [ -f "$TOWER_CLI" ]; then
  STATUS_LINE="$(cd "$CWD" 2>/dev/null && "$BUN" "$TOWER_CLI" status 2>/dev/null | sed -n '2p')"
  UNRELAYED="$(printf '%s' "$STATUS_LINE" | grep -oE 'unrelayed: [0-9]+' | grep -oE '[0-9]+')"
  OPENQ="$(printf '%s' "$STATUS_LINE" | grep -oE 'open questions: [0-9]+' | grep -oE '[0-9]+')"
  UNRELAYED="${UNRELAYED:-0}"
  OPENQ="${OPENQ:-0}"
  if [ "$UNRELAYED" -gt 0 ] || [ "$OPENQ" -gt 0 ]; then
    TOWER_LOADED=1
    LINES+=("[Tower] Carried over from earlier sessions: ${UNRELAYED} unrelayed message(s), ${OPENQ} open question(s). Run /tower to see them; relay/surface before new work.")
  fi
else
  LINES+=("[Tower] carry-over unavailable (bun or ~/.tower/cli.mjs not found) — leg 1 skipped, legs 2-3 only.")
fi

# --- Leg 2: last TODO: handoff --------------------------------------------
if command -v git >/dev/null 2>&1 && (cd "$CWD" 2>/dev/null && git rev-parse --git-dir >/dev/null 2>&1); then
  LOG="$(cd "$CWD" && git log --format="%h %s%n%b" -5 2>/dev/null || true)"
  if [ -n "$LOG" ] && command -v perl >/dev/null 2>&1; then
    # Same regex as session-start.mjs: first commit header, then the
    # nearest following "TODO: " line (non-greedy across the log window).
    TODO_MATCH="$(printf '%s\n' "$LOG" | perl -0777 -ne 'if (/^([0-9a-f]+ .+)$(?s:.*?)^TODO: (.+)$/m) { print "$1\x1e$2" }')"
    if [ -n "$TODO_MATCH" ]; then
      HEADER="${TODO_MATCH%%$'\x1e'*}"
      TODO="${TODO_MATCH#*$'\x1e'}"
      HASH="${HEADER%% *}"
      TODO_TRIMMED="$(printf '%s' "$TODO" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
      if [ "$TODO_TRIMMED" != "—" ]; then
        HANDOFF_LOADED=1
        LINES+=("[Tower] Last handoff (${HASH}): TODO: ${TODO_TRIMMED}")
      fi
    fi
  fi
fi

# --- Leg 3: flight snapshot pointer, <24h ---------------------------------
if [ -d "$FLIGHT_DIR" ]; then
  LATEST="$(ls -t "$FLIGHT_DIR" 2>/dev/null | head -1)"
  if [ -n "$LATEST" ]; then
    MTIME="$(stat -f %m "$FLIGHT_DIR/$LATEST" 2>/dev/null || stat -c %Y "$FLIGHT_DIR/$LATEST" 2>/dev/null)"
    NOW="$(date +%s)"
    if [ -n "$MTIME" ] && [ $((NOW - MTIME)) -lt 86400 ]; then
      FLIGHT_LOADED=1
      LINES+=("[Tower] Flight snapshot from the previous context: ${FLIGHT_DIR}/${LATEST} - read it if the handoff above seems incomplete.")
    fi
  fi
fi

# --- Leg 4: memory substrate (circadian mind wake) ------------------------
# A recorder never blocks: wake failing, missing, or erroring never fails
# this hook. Run standalone from the target cwd so wake's own cwd-scoped
# retrieval (session-relevant units) matches what a real session would see.
# No shell-level `timeout` wrapper here on purpose — it is a homebrew
# binary (/opt/homebrew/bin/timeout), not guaranteed on PATH inside a hook
# runner's environment; the script-level timeout instead lives in
# ~/.cursor/hooks.json's per-hook `timeout` field (documented cursor hooks
# config option), which bounds the whole sessionStart script including
# this leg.
WAKE_TS="/Users/jrg/circadian/src/wake.ts"
if [ -x "$BUN" ] && [ -f "$WAKE_TS" ]; then
  WAKE_OUT="$(cd "$CWD" 2>/dev/null && "$BUN" "$WAKE_TS" 2>/dev/null || true)"
  if [ -n "$WAKE_OUT" ]; then
    MEMORY_LOADED=1
    LINES+=("$WAKE_OUT")
  fi
fi

# Boot card stamp (primitives/tools/boot-card/): one line reporting which
# Session Boundary Contract legs this adapter actually loaded this run.
# This adapter owns all four legs in one script, unlike claude-code/pi
# where legs are split across separate adapters.
TOWER_GLYPH="✗(clear)"; [ "$TOWER_LOADED" -eq 1 ] && TOWER_GLYPH="✓"
HANDOFF_GLYPH="✗(none declared)"; [ "$HANDOFF_LOADED" -eq 1 ] && HANDOFF_GLYPH="✓"
FLIGHT_GLYPH="✗(none<24h)"; [ "$FLIGHT_LOADED" -eq 1 ] && FLIGHT_GLYPH="✓"
MEMORY_GLYPH="✗(no output)"; [ "$MEMORY_LOADED" -eq 1 ] && MEMORY_GLYPH="✓"
LINES+=("[boot] tower ${TOWER_GLYPH} · handoff ${HANDOFF_GLYPH} · flight ${FLIGHT_GLYPH} · memory ${MEMORY_GLYPH}")

if [ "${#LINES[@]}" -eq 0 ]; then
  exit 0
fi

CONTEXT="$(printf '%s\n' "${LINES[@]}")"
if [ -n "$JQ" ]; then
  "$JQ" -n --arg ctx "$CONTEXT" '{additional_context: $ctx}'
else
  ESCAPED="$(printf '%s' "$CONTEXT" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\n/\\n/g')"
  printf '{"additional_context":"%s"}\n' "$ESCAPED"
fi
exit 0
