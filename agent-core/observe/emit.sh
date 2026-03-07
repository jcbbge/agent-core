#!/usr/bin/env bash
# emit.sh — record a primitive usage event to SurrealDB
#
# Usage:
#   emit.sh <harness> <primitive_type> <primitive_name> [metadata_json]
#
# Examples:
#   emit.sh claude-code skill "research"
#   emit.sh opencode mcp "anima_bootstrap" '{"tool":"anima_bootstrap"}'
#   emit.sh claude-code command "start"
#
# Called from hooks/plugins in each harness. Silent on failure.

HARNESS="${1:-unknown}"
TYPE="${2:-unknown}"
NAME="${3:-unknown}"
META="${4:-{}}"

SURREAL_URL="${SURREAL_URL:-http://127.0.0.1:8000}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HOSTNAME=$(hostname -s 2>/dev/null || echo "unknown")

PAYLOAD=$(cat <<JSON
CREATE primitive_events SET
  harness = "$HARNESS",
  primitive_type = "$TYPE",
  primitive_name = "$NAME",
  metadata = $META,
  hostname = "$HOSTNAME",
  recorded_at = time::now();
JSON
)

curl -s -X POST "$SURREAL_URL/sql" \
  -H "Accept: application/json" \
  -H "Content-Type: text/plain" \
  -H "surreal-ns: dev" \
  -H "surreal-db: brain" \
  -u "root:root" \
  --data "$PAYLOAD" > /dev/null 2>&1 || true
