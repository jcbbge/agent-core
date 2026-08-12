#!/usr/bin/env bash
# metric-context-reduction.sh — effectiveness collector for slim's
# VERIFY.toml [[metric]] context-reduction-pct.
#
# Measures the percent byte reduction slim achieves on a live `ps aux`
# (the flagship compaction verb: widest, noisiest output of the six).
# Prints the integer percentage as the last line — component-verify
# compares it against the manifest's `expect`.
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$DIR/zig-out/bin/slim"

if [[ ! -x "$BIN" ]]; then
  (cd "$DIR" && zig build >/dev/null 2>&1)
fi
if [[ ! -x "$BIN" ]]; then
  echo "slim binary not found and could not be built at $BIN" >&2
  exit 1
fi

raw=$(/bin/ps aux | wc -c)
compact=$("$BIN" ps aux | wc -c)
if [[ "$raw" -eq 0 ]]; then
  echo "ps produced no output" >&2
  exit 1
fi
echo $(( (raw - compact) * 100 / raw ))
