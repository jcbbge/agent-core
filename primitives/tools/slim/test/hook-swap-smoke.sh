#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

cp "$HOME/.claude/hooks/rtk-guard.sh" "$SCRATCH/guard-slim.sh"
sed 's/rtk/slim/g' "$SCRATCH/guard-slim.sh" > "$SCRATCH/guard-slim.sh.tmp"
mv "$SCRATCH/guard-slim.sh.tmp" "$SCRATCH/guard-slim.sh"
chmod +x "$SCRATCH/guard-slim.sh"

export PATH="$ROOT/zig-out/bin:$PATH"

run_case() {
  local name="$1"
  local cmd="$2"
  shift 2
  local out
  out="$(printf '{"tool_input":{"command":"%s"}}' "$cmd" | "$SCRATCH/guard-slim.sh")"
  if ! printf '%s' "$out" | jq -e "$1" >/dev/null 2>&1; then
    echo "FAIL $name" >&2
    echo "$out" >&2
    exit 1
  fi
  echo "PASS $name"
}

run_case "allow ls" "ls -la" '.hookSpecificOutput.updatedInput.command == "slim ls -la" and .hookSpecificOutput.permissionDecision == "allow"'
run_passthrough() {
  local name="$1"
  local cmd="$2"
  local out
  out="$(printf '{"tool_input":{"command":"%s"}}' "$cmd" | "$SCRATCH/guard-slim.sh")"
  if [[ -n "$out" ]]; then
    echo "FAIL $name (expected no hook output)" >&2
    echo "$out" >&2
    exit 1
  fi
  echo "PASS $name"
}

run_passthrough "passthrough pipe" "ls | wc -l"
run_case "allow git log" "git log -5" '.hookSpecificOutput.updatedInput.command == "slim git log -5"'
run_passthrough "passthrough cat" "cat f.txt"
run_passthrough "passthrough porcelain" "git status --porcelain"

echo "hook-swap-smoke: all cases passed"
