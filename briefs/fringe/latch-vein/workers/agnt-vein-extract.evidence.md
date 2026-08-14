# agnt-vein-extract evidence

**Agent:** agnt-vein-extract  
**Date:** 2026-08-11

## Files touched

```
~/agent-core/primitives/tools/vein/src/schema.zig
~/agent-core/primitives/tools/vein/src/session.zig
~/agent-core/primitives/tools/vein/src/scan.zig
~/agent-core/primitives/tools/vein/src/extract_cc.zig
~/agent-core/primitives/tools/vein/src/extract_pi.zig
```

## Build

```bash
cd ~/agent-core/primitives/tools/vein && zig build
# exit 0
```

## Sample session extraction (Python baseline)

```bash
python3 << 'PY'
import sys
sys.path.insert(0, "/Users/jrg/agent-core/briefs/session-mining/fixtures-p3")
from extract_cc import extract
from extract_pi import extract as extract_pi

cc_path = "/Users/jrg/.claude/projects/-Users-jrg-future/6a214495-e55e-4441-9e0e-634f410f7d96.jsonl"
pi_path = "/Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T18-15-57-199Z_019ff209-d00f-7e0f-ad9a-9203e17710b4.jsonl"

cc_sel = {"session_id": "6a214495-e55e-4441-9e0e-634f410f7d96", "path": cc_path, "project_key": "-Users-jrg-future"}
pi_sel = {"session_id": "019ff209-d00f-7e0f-ad9a-9203e17710b4", "path": pi_path, "project_key": "--Users-jrg-agent-core--"}

print("CC calls:", len(extract(cc_sel, 0)))
print("pi calls:", len(extract_pi(pi_sel, 0)))
PY
# CC calls: 431
# pi calls: 0
```

## Zig extraction (unit tests)

```bash
cd ~/agent-core/primitives/tools/vein
printf '%s\n%s\n' \
  "/Users/jrg/.claude/projects/-Users-jrg-future/6a214495-e55e-4441-9e0e-634f410f7d96.jsonl" \
  "/Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T18-15-57-199Z_019ff209-d00f-7e0f-ad9a-9203e17710b4.jsonl" \
  > /tmp/vein-extract-sessions.txt

/opt/homebrew/bin/zig test src/lib.zig -OReleaseFast --test-filter "extract cc"
# OK — expects exactly 431 CC bash calls

/opt/homebrew/bin/zig test src/lib.zig -OReleaseFast --test-filter "extract pi"
# OK — expects 0 pi bash calls (session has no bash toolCall entries)

/opt/homebrew/bin/zig test src/lib.zig -OReleaseFast --test-filter "scan sample"
# OK — scan.run via sessions file: cc_calls=431, pi_calls=0
```

| Harness | Session | Python | Zig |
|---------|---------|--------|-----|
| CC | `6a214495-e55e-4441-9e0e-634f410f7d96` | 431 | 431 |
| pi | `019ff209-d00f-7e0f-ad9a-9203e17710b4` | 0 | 0 |

## SchemaDrift decisions

- `verifyShape` probes first JSONL line per session; drift → session skipped (no silent zero-corpus pass for malformed files).
- Missing Bash/bash `command` field on an otherwise matching tool item: call omitted; first occurrence flagged internally (no invented call count).
- Malformed JSON lines: skipped (same as Python `JSONDecodeError` continue).
- pi sample session legitimately has zero bash calls (Cursor SDK session, not shell-heavy).

## Notes

- Extractors delegate row enrichment to `classify.makeRow` (sibling implemented classify/csv).
- `main.zig` scan dispatch still stubbed (out of partition); evidence uses `scan.run` via unit test.
- `zig build test` reports csv round-trip leaks (sibling partition); `zig build` alone exits 0.
