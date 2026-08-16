#!/usr/bin/env bash
# Reproduction harness for AGNT-forensics (agent-core/tower-bus-integrity).
# NEVER point $BOARD at ~/.tower/board.jsonl — this is a scratch file only.
#
# Simulates the two independent pre-2026-08-13 board writers that ran with
# NO shared locking discipline for the full damage window (2026-07-24 ..
# 2026-08-10):
#   - writer_node.mjs   mimics agent-core primitives/hooks/tower-ledger.mjs
#                       append() BEFORE any flock existed: JSON.stringify
#                       (compact), bare appendFileSync, no lock.
#   - writer_python.py  mimics herdr-spine bin/spine-claim board_append()
#                       at commit cc72a03 (2026-07-24, the commit that
#                       introduced it) through commit 25c1ef0~1 (2026-08-13,
#                       the commit before the fix): json.dumps (Python's
#                       default separators are ", " and ": " -- SPACED),
#                       bare open(...,"a"), no lock.
#
# Result on this machine (APFS, 2026-08-16): running these two writers
# concurrently in high volume (120 processes x 8KB bodies x 3 rounds) did
# NOT reproduce a torn/concatenated line -- macOS/APFS serializes whole
# write(2) calls to an O_APPEND fd even without flock, at these sizes. That
# is a negative result, reported honestly in WRITER-FORENSICS.md: it shows
# the two writers were UNLOCKED against each other for three weeks (a real
# defect, confirmed by source+git history), but does not by itself prove
# byte-level interleaving is what produced lines 2502/2577. Run this to see
# that negative result reproduced, or crank ROUNDS/PROCS/BODY_BYTES to hunt
# for the tear on your own hardware/filesystem.

set -euo pipefail
cd "$(dirname "$0")"
SCRATCH_DIR="$(mktemp -d)"
BOARD="$SCRATCH_DIR/scratch-board.jsonl"
ROUNDS="${ROUNDS:-3}"
PROCS="${PROCS:-60}"
BODY_BYTES="${BODY_BYTES:-8000}"
BIGBODY=$(python3 -c "print('x'*${BODY_BYTES})")

echo "scratch board: $BOARD"
for round in $(seq 1 "$ROUNDS"); do
  rm -f "$BOARD"
  for i in $(seq 1 "$PROCS"); do
    bun writer_node.mjs "$BOARD" "node-$round-$i" "sim-node" "sim/race" "$BIGBODY" &
    python3 writer_python.py "$BOARD" "py-$round-$i" "sim-py" "sim/race" "$BIGBODY" &
  done
  wait
  echo "round $round: $(wc -l < "$BOARD" | tr -d ' ') lines written (expected $((PROCS*2)))"
  python3 - "$BOARD" <<'PY'
import json, sys
path = sys.argv[1]
bad = 0
with open(path) as f:
    for i, l in enumerate(f, 1):
        l = l.rstrip("\n")
        if not l:
            continue
        try:
            json.loads(l)
        except Exception as e:
            bad += 1
            print(f"  LINE {i} BAD ({e}): {l[:200]!r}")
print(f"  total bad this round: {bad}")
PY
done
rm -rf "$SCRATCH_DIR"
