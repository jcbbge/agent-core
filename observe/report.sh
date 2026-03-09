#!/usr/bin/env bash
# report.sh — query primitive_events from SurrealDB
# Usage:
#   report.sh              # today's events
#   report.sh recent       # last 20 events
#   report.sh top          # most-used skills
#   report.sh harness      # breakdown by harness

SURREAL_URL="${SURREAL_URL:-http://127.0.0.1:8000}"
MODE="${1:-today}"

query() {
  curl -s -X POST "$SURREAL_URL/sql" \
    -H "Accept: application/json" \
    -H "Content-Type: text/plain" \
    -H "surreal-ns: dev" \
    -H "surreal-db: brain" \
    -u "root:root" \
    --data "$1" 2>/dev/null
}

case "$MODE" in
  today)
    echo "=== Primitive events today ==="
    query "SELECT harness, primitive_type, primitive_name, recorded_at FROM primitive_events WHERE recorded_at > time::now() - 1d ORDER BY recorded_at DESC;" | python3 -c "
import json, sys
data = json.load(sys.stdin)
rows = data[0]['result']
if not rows:
    print('  (none yet)')
else:
    for r in rows:
        ts = r['recorded_at'][:16].replace('T',' ')
        print(f\"  {ts}  {r['harness']:12}  {r['primitive_type']:10}  {r['primitive_name']}\")
print(f'  Total: {len(rows)}')
"
    ;;

  recent)
    echo "=== Last 20 primitive events ==="
    query "SELECT harness, primitive_type, primitive_name, recorded_at FROM primitive_events ORDER BY recorded_at DESC LIMIT 20;" | python3 -c "
import json, sys
data = json.load(sys.stdin)
rows = data[0]['result']
if not rows:
    print('  (none)')
else:
    for r in rows:
        ts = r['recorded_at'][:16].replace('T',' ')
        print(f\"  {ts}  {r['harness']:12}  {r['primitive_type']:10}  {r['primitive_name']}\")
"
    ;;

  top)
    echo "=== Most-used primitives (all time) ==="
    query "SELECT primitive_name, primitive_type, count() AS uses FROM primitive_events GROUP BY primitive_name, primitive_type ORDER BY uses DESC LIMIT 20;" | python3 -c "
import json, sys
data = json.load(sys.stdin)
rows = data[0]['result']
if not rows:
    print('  (none)')
else:
    for r in rows:
        print(f\"  {r['uses']:4}x  {r['primitive_type']:10}  {r['primitive_name']}\")
"
    ;;

  harness)
    echo "=== Usage by harness ==="
    query "SELECT harness, count() AS uses FROM primitive_events GROUP BY harness ORDER BY uses DESC;" | python3 -c "
import json, sys
data = json.load(sys.stdin)
rows = data[0]['result']
if not rows:
    print('  (none)')
else:
    for r in rows:
        print(f\"  {r['uses']:4}x  {r['harness']}\")
"
    ;;

  *)
    echo "Usage: report.sh [today|recent|top|harness]"
    ;;
esac
