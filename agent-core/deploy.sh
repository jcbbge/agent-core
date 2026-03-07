#!/usr/bin/env bash
# deploy.sh — push all primitives to all (or one) harness
#
# Usage:
#   ./deploy.sh              # deploy to all harnesses
#   ./deploy.sh claude-code  # deploy to one harness
#   ./deploy.sh --dry-run    # show what would happen

set -euo pipefail
# Resolve real path even when called via symlink
_SCRIPT="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || realpath "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"
CORE="$(cd "$(dirname "$_SCRIPT")" && pwd)"
PRIMITIVES="$CORE/primitives"
HARNESSES="$CORE/harnesses"
DRY_RUN=false
TARGET=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --*) echo "Unknown flag: $arg"; exit 1 ;;
    *) TARGET="$arg" ;;
  esac
done

echo "Agent Core — deploy"
echo "Primitives: $PRIMITIVES"
echo ""

if $DRY_RUN; then
  echo "DRY RUN — showing what would be deployed:"
  echo ""
  for harness_dir in "$HARNESSES"/*/; do
    name=$(basename "$harness_dir")
    [ "$name" = "_template" ] && continue
    [ -n "$TARGET" ] && [ "$name" != "$TARGET" ] && continue
    echo "  $name:"
    [ -f "$harness_dir/adapter.sh" ] && echo "    adapter: $harness_dir/adapter.sh" || echo "    adapter: MISSING"
    [ -f "$harness_dir/HARNESS.md" ] && echo "    docs:    $harness_dir/HARNESS.md" || echo "    docs:    MISSING"
  done
  exit 0
fi

run_adapter() {
  local name="$1"
  local adapter="$HARNESSES/$name/adapter.sh"
  if [ ! -f "$adapter" ]; then
    echo "  [$name] no adapter.sh — skipping"
    return
  fi
  echo "  [$name] deploying..."
  bash "$adapter" "$PRIMITIVES"
}

if [ -n "$TARGET" ]; then
  run_adapter "$TARGET"
else
  for harness_dir in "$HARNESSES"/*/; do
    name=$(basename "$harness_dir")
    [ "$name" = "_template" ] && continue
    run_adapter "$name"
  done
fi

echo ""
echo "Deploy complete."
