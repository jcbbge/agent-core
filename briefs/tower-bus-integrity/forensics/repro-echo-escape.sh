#!/usr/bin/env bash
# Reproduction for the "n separator" lead in AGNT-forensics.
# NEVER point BOARD at ~/.tower/board.jsonl -- scratch file only.
#
# The pre-2026-08-13 `brief` skill (primitives/skills/brief/SKILL.md, blob
# a1031c2, replaced in agent-core commit 88b3d6f) told any harness without
# the Tower MCP (its own example: pi) to hand-append one JSON line to
# board.jsonl -- i.e. construct the JSON as TEXT and append it yourself,
# with no serializer and no lock. This is what a hand-typed shell append
# looks like when the author (human or LLM) writes a literal `\n` meaning
# "row separator", inside a plain `echo` (no -e): POSIX echo does not
# interpret backslash escapes by default, so the two characters `\` and
# `n` are written to the file as-is, verbatim, followed by echo's own real
# trailing newline.
set -euo pipefail
SCRATCH_DIR="$(mktemp -d)"
BOARD="$SCRATCH_DIR/scratch-board.jsonl"

echo '{"id":"c003-test-runner-claim","ts":"2026-08-10T05:18:22Z","cwd":"/x","type":"finding","from":"c003-test-runner","topic":"c003","body":"CLAIM gate execution"}\n' >> "$BOARD"

echo "--- raw bytes (od -c), tail ---"
od -c "$BOARD" | tail -5
echo
echo "--- per-line JSON parse ---"
python3 - "$BOARD" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    for i, l in enumerate(f, 1):
        try:
            json.loads(l)
            print(f"line {i}: OK")
        except Exception as e:
            print(f"line {i}: BAD ({e}) -> {l[:120]!r}")
PY
echo
echo "CONFIRMS: plain \`echo '...\\n'\` (no -e) writes the row's intended"
echo "separator as two literal characters '\\' 'n', not a real newline byte --"
echo "matching the 'n between } and {' shape ONLY after something downstream"
echo "additionally strips the backslash (not reproduced here; see"
echo "WRITER-FORENSICS.md candidate write-up for what is and isn't proven)."
rm -rf "$SCRATCH_DIR"
