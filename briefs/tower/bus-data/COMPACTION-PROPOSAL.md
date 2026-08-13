# COMPACTION-PROPOSAL — remove 26 unparseable lines from `~/.tower/board.jsonl`

**Status:** PROPOSAL ONLY — **DO NOT EXECUTE** until concierge posts explicit yes on board topic `tower/bus-data`.

**Author:** AGNT compaction-proposal (T4, bus-data integrity unit)  
**Date:** 2026-08-13  
**Gated by:** CORD ruling — live-board compact/truncate/delete/in-place rewrite forbidden until concierge yes.

---

## Scope

Remove exactly **26** known-unparseable lines from the live Tower board. Recovery rows appended in T2 remain; this step only drops the original corrupt physical lines.

### Source inventory (T1)

| Field | Value |
|-------|-------|
| Backup path | `/Users/jrg/agent-core/briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak` |
| Backup sha256 | `10cc463f2f0c4bba890783f2f28cdb460f9100e1253a5b11e54f0c7053e36baf` |
| Lines at backup | 6472 |
| Parse OK at inventory | 6446 |
| Bad count | 26 |
| Last bad line | 2577 (zero bad lines after) |

### Bad line numbers (exact — from INVENTORY.json)

```
1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516,
2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577
```

### Damage classes

| Class | Lines |
|-------|-------|
| `non_json_text` | 1, 2 |
| `truncated` | 3 |
| `unescaped_body` | 553 |
| `invalid_escape` | 2113 |
| `concatenated_objects` | 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577 |

Prior append-only recovery (commit `8e54604`, T2) left these 26 lines in place on purpose. Quarantine raw bytes for unrecoverable cases live under `briefs/tower/bus-data/quarantine/` (verify before compaction).

---

## Recommended strategy: **new-file + atomic-swap** (primary)

Build a clean JSONL beside the live file, merge any concurrent tail appends, then rename once. Live `board.jsonl` stays open for writers during the long build phase.

### Why not lock+rewrite (alternative — rejected as primary)

| Concern | lock+rewrite | new-file + atomic-swap |
|---------|--------------|------------------------|
| Writer pause | Requires exclusive lock for entire rewrite; all Arc/Tower/bus-data fleets must stop or race | Writers append to live file throughout build; only swap window is critical |
| Current code | `tower-ledger.mjs:76` and `cli.mjs:163` use `appendFileSync` with **no flock** | No change to writer code required |
| Interrupt mid-op | Partial in-place rewrite leaves board corrupt and unappendable | Interrupted build leaves live file untouched; only temp files discarded |
| Rollback | Must restore full backup | Rename `board.jsonl.pre-compact-*` back |

**Alternative (maintenance window only):** `flock -x ~/.tower/board.jsonl` + in-place rewrite via temp file in same directory + `mv` over target. Usable only if all concurrent appenders are confirmed stopped (herdr fleet strike). Not recommended while w2X/w2Y/w2Z are live.

---

## Interrupt-safety proof

Live board path: `~/.tower/board.jsonl` (`BOARD` in `tower-ledger.mjs:24`).

Writers: MCP `board_post`, `bun ~/.tower/cli.mjs post`, `cursor-spine` printf lineage/bypass — all append-only, no lock today.

### Phase map and failure modes

| Phase | Live board state | If killed here |
|-------|------------------|----------------|
| P0 Pre-flight backup | Unchanged, appendable | No effect |
| P1 Snapshot copy (`board.snap`) | Unchanged, appendable | Delete partial snap; retry |
| P2 Build `board.compacted` from snap (skip 26 lines) | Unchanged, appendable | Delete partial compacted; retry |
| P3 Tail merge (lines appended after snap line count) | Unchanged, appendable | Delete compacted; retry from P1 |
| P4 Pre-swap byte backup (`board.pre-compact-*`) | Unchanged, appendable | Delete backup copy; retry |
| P5 Atomic swap (`mv` old → `.pre-compact`, `mv` compacted → `board.jsonl`) | Brief rename window | See rollback |
| P6 Post-swap tail drain (re-read `.pre-compact` inode tail) | New file live, appendable | Manual tail append from `.pre-compact` |
| P7 Verify parse counts | Compacted live | Rollback from P4 backup |

**Concurrent appender during P1–P3:** Appends land on live `board.jsonl` after snapshot line count. P3 copies those lines into `board.compacted` before swap. No writer blocked.

**Concurrent appender during P5 (rename window):** Unix `appendFileSync` opens by path each call; after rename, new opens target the new inode. Appends between P3 tail read and P5 may land only on the old inode. P6 drains any remaining bytes/lines from `board.jsonl.pre-compact-*` into live `board.jsonl`. Board stays appendable throughout; worst case is duplicate tail lines (detectable by id/ts dedup — operator review), not corruption.

**Concurrent appender after P5:** Normal append to new clean file.

**Property proved:** At no point is `board.jsonl` truncated or half-written in place. Either the original file serves writers, or a complete replacement file is atomically promoted.

---

## Exact command sequence (copy-pasteable)

**DO NOT RUN** until concierge yes on `tower/bus-data`.

```bash
set -euo pipefail

BOARD="$HOME/.tower/board.jsonl"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORKDIR="$HOME/agent-core/briefs/tower/bus-data/compaction-run-$STAMP"
BACKUP_REF="$HOME/agent-core/briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak"

# 26 bad line numbers (1-indexed)
BAD_LINES='1 2 3 553 2113 2502 2504 2507 2511 2513 2514 2515 2516 2521 2523 2525 2527 2530 2542 2556 2559 2569 2571 2573 2574 2577'

mkdir -p "$WORKDIR"
cd "$WORKDIR"

# P0 — fresh pre-compaction backup (independent of T1 backup)
cp -a "$BOARD" "$WORKDIR/board.pre-compact.$STAMP.bak"
sha256sum "$BOARD" "$WORKDIR/board.pre-compact.$STAMP.bak"

# P1 — snapshot + record line count at snap time
cp -a "$BOARD" "$WORKDIR/board.snap"
SNAP_LINES=$(wc -l < "$WORKDIR/board.snap" | tr -d ' ')
echo "snap_lines=$SNAP_LINES" | tee "$WORKDIR/snap.meta"

# P2 — build compacted file: emit every snap line except bad line numbers
: > "$WORKDIR/board.compacted"
line=0
while IFS= read -r raw || [[ -n "$raw" ]]; do
  line=$((line + 1))
  skip=0
  for b in $BAD_LINES; do
    if [[ "$line" -eq "$b" ]]; then skip=1; break; fi
  done
  if [[ "$skip" -eq 1 ]]; then
    printf '%s\n' "$raw" >> "$WORKDIR/quarantine-from-live-line-${line}.raw"
    continue
  fi
  printf '%s\n' "$raw" >> "$WORKDIR/board.compacted"
done < "$WORKDIR/board.snap"

# P2b — parse-check compacted body (must be 100% JSON)
python3 - <<'PY'
import json, sys
path = "board.compacted"
bad = 0
with open(path, "rb") as f:
    for i, line in enumerate(f, 1):
        if not line.strip():
            continue
        try:
            json.loads(line)
        except json.JSONDecodeError as e:
            print(f"PARSE FAIL line {i}: {e}", file=sys.stderr)
            bad += 1
if bad:
    sys.exit(1)
print("compacted parse OK")
PY

# P3 — tail merge: lines appended to live board after snapshot
LIVE_LINES=$(wc -l < "$BOARD" | tr -d ' ')
if [[ "$LIVE_LINES" -gt "$SNAP_LINES" ]]; then
  tail -n +"$((SNAP_LINES + 1))" "$BOARD" >> "$WORKDIR/board.compacted"
  echo "merged tail lines $((SNAP_LINES + 1))..$LIVE_LINES" | tee -a "$WORKDIR/snap.meta"
fi

# P4 — record pre-swap hashes
sha256sum "$BOARD" "$WORKDIR/board.compacted" | tee "$WORKDIR/pre-swap.sha256"

# P5 — atomic swap (critical section — seconds, not minutes)
PRE="$HOME/.tower/board.jsonl.pre-compact-$STAMP"
mv "$BOARD" "$PRE"
mv "$WORKDIR/board.compacted" "$BOARD"

# P6 — drain any appends that hit old inode during swap
PRE_LINES=$(wc -l < "$PRE" | tr -d ' ')
LIVE_NOW=$(wc -l < "$BOARD" | tr -d ' ')
COMPACTED_BASE=$((SNAP_LINES - 26))  # lines kept from snap
EXPECTED=$((COMPACTED_BASE + (LIVE_LINES - SNAP_LINES)))
if [[ "$PRE_LINES" -gt "$LIVE_LINES" ]]; then
  tail -n +"$((LIVE_LINES + 1))" "$PRE" >> "$BOARD"
  echo "post-swap drain appended $((PRE_LINES - LIVE_LINES)) lines from pre inode" | tee "$WORKDIR/post-swap-drain.log"
fi

# P7 — verification
python3 - <<'PY'
import json, sys
path = sys.argv[1]
ok = bad = 0
with open(path, "rb") as f:
    for i, line in enumerate(f, 1):
        if not line.strip():
            continue
        try:
            json.loads(line)
            ok += 1
        except json.JSONDecodeError:
            bad += 1
print(f"ok={ok} bad={bad}")
sys.exit(1 if bad else 0)
PY "$BOARD"

wc -l "$BOARD" "$PRE" "$BACKUP_REF" | tee "$WORKDIR/post-verify.lines"
sha256sum "$BOARD" | tee "$WORKDIR/post-verify.sha256"

echo "DONE — compacted board live. Pre-compact inode preserved at: $PRE"
echo "Rollback: see Rollback section if verification fails."
```

### Expected post-compaction counts (baseline from T1 inventory)

At execution time, live line count will exceed 6472 (T2 recovery appends + ongoing fleet traffic). Verification targets:

- `bad=0` on full-file JSON parse (required)
- Line count decrease equals **26** relative to pre-compaction live count at P1 snap (not relative to T1 backup)
- Every skipped line's raw bytes present in `$WORKDIR/quarantine-from-live-line-*.raw` or pre-existing `briefs/tower/bus-data/quarantine/`

---

## Verification after execution

```bash
BOARD="$HOME/.tower/board.jsonl"

# 1) Zero parse failures
python3 -c "
import json, sys
bad=ok=0
for i,l in enumerate(open('$BOARD','rb'),1):
    if not l.strip(): continue
    try: json.loads(l); ok+=1
    except: bad+=1; print('bad line', i)
print('ok', ok, 'bad', bad); sys.exit(bad)
"

# 2) Line count vs pre-compaction backup from run dir
wc -l "$BOARD" "$HOME/agent-core/briefs/tower/bus-data/compaction-run-*/board.pre-compact.*.bak"

# 3) sha256 record (informational — content will differ from T1 backup by design)
sha256sum "$BOARD"
```

Record results in a post-compaction note on `tower/bus-data` (operator or ORCH).

---

## Rollback

If verification fails or operator aborts after swap:

```bash
STAMP="<same stamp as run>"
PRE="$HOME/.tower/board.jsonl.pre-compact-$STAMP"
BAK="$HOME/agent-core/briefs/tower/bus-data/compaction-run-$STAMP/board.pre-compact.$STAMP.bak"

# Prefer pre-swap live copy (captures all appends through swap)
if [[ -f "$PRE" ]]; then
  cp -a "$PRE" "$HOME/.tower/board.jsonl"
elif [[ -f "$BAK" ]]; then
  cp -a "$BAK" "$HOME/.tower/board.jsonl"
else
  cp -a "$HOME/agent-core/briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak" "$HOME/.tower/board.jsonl"
  echo "WARNING: rolled back to T1 inventory backup — appends after 2026-08-13T13:49:35Z lost unless merged manually"
fi

# Verify rollback board is appendable
bun ~/.tower/cli.mjs post note tower/bus-data "ROLLBACK: compaction aborted; board restored from pre-compact backup" --from "operator"
```

T1 reference backup (last known good full snapshot at inventory time):

- Path: `/Users/jrg/agent-core/briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak`
- sha256: `10cc463f2f0c4bba890783f2f28cdb460f9100e1253a5b11e54f0c7053e36baf`

---

## Execution gate

**DO NOT EXECUTE** this procedure until:

1. Concierge posts explicit **yes** on board topic `tower/bus-data`, and  
2. CORD routes execution to operator/ORCH, and  
3. T2 recovery and quarantine are complete (26/26 handled), and  
4. Optional: brief maintenance notice to w2X/w2Y fleets if swap window timing is tight.

This document is an artifact only. AGNT compaction-proposal did not run any compaction commands against `~/.tower/board.jsonl`.
