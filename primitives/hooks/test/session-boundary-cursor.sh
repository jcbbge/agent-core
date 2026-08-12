#!/usr/bin/env bash
# session-boundary-cursor.sh — oracles for the cursor sessionStart hook
# (../session-boundary-cursor.sh). One subcommand per VERIFY contract line.
#
# Hermetic on purpose: BUN_BIN_PATH is pointed at a nonexistent binary so
# legs 1 (tower status) and 4 (circadian wake) skip — no scoreboard rows,
# no tower reads, deterministic output — while the hook's own control flow
# (stdin parse, JSON emission, exit discipline) runs for real.
# component-verify manifest: ../VERIFY-session-boundary-cursor.toml
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$DIR/session-boundary-cursor.sh"
export BUN_BIN_PATH="/nonexistent/component-verify-no-bun"

case "${1:-}" in
  never-blocks)
    # A recorder never blocks: garbage stdin still exits 0.
    printf 'this is not json {{{' | bash "$HOOK" >/dev/null 2>&1
    code=$?
    if [[ "$code" -eq 0 ]]; then
      echo "never-blocks: PASS (exit 0 on garbage stdin)"
      exit 0
    fi
    echo "never-blocks: FAIL (exit $code on garbage stdin)" >&2
    exit 1
    ;;

  injection-shape)
    # Output, when present, is one JSON object whose additional_context is a
    # non-empty string (cursor's documented sessionStart injection shape).
    out="$(printf '{"workspace_roots":["/tmp"]}' | bash "$HOOK" 2>/dev/null)"
    code=$?
    if [[ "$code" -ne 0 ]]; then
      echo "injection-shape: FAIL (hook exited $code)" >&2
      exit 1
    fi
    if [[ -z "$out" ]]; then
      echo "injection-shape: FAIL (no output — expected at least the leg-1 unavailable line under BUN_BIN_PATH override)" >&2
      exit 1
    fi
    ctx="$(printf '%s' "$out" | jq -er '.additional_context' 2>&1)"
    if [[ $? -eq 0 && -n "$ctx" ]]; then
      echo "injection-shape: PASS"
      exit 0
    fi
    echo "injection-shape: FAIL (output is not {additional_context: <non-empty string>}):" >&2
    printf '%s\n' "$out" >&2
    exit 1
    ;;

  *)
    echo "usage: session-boundary-cursor.sh {never-blocks|injection-shape}" >&2
    exit 2
    ;;
esac
