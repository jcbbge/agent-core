#!/usr/bin/env bash
# sync-stack.sh — Read stack.yaml and upsert entries to SurrealDB stack/catalog.
# Idempotent: safe to run multiple times. Uses UPSERT to overwrite on conflict.
#
# Requires: ~/bin/surreal, yq (brew install yq)
# Usage: bash sync-stack.sh [path/to/stack.yaml]
#
# Syncs: ports, platform (as daemon records), intelligence (as mcp_server records),
#        integrations, scripts

STACK_YAML="${1:-$(dirname "$0")/../stack.yaml}"
SURREAL="${HOME}/bin/surreal"
ENDPOINT="ws://127.0.0.1:8002/rpc"
NS="stack"
DB="catalog"
DB_USER="root"
DB_PASS="root"

if [[ ! -f "$STACK_YAML" ]]; then
  echo "ERROR: stack.yaml not found at $STACK_YAML" >&2
  exit 1
fi

if ! command -v yq &>/dev/null; then
  echo "ERROR: yq is required. Install with: brew install yq" >&2
  exit 1
fi

surreal_sql() {
  local sql="$1"
  "$SURREAL" sql \
    --endpoint "$ENDPOINT" \
    --username "$DB_USER" \
    --password "$DB_PASS" \
    --namespace "$NS" \
    --database "$DB" \
    --hide-welcome \
    2>/dev/null <<< "$sql" 1>/dev/null || true
}

yq_get() {
  yq e "$1" "$STACK_YAML" 2>/dev/null | tr -d '\r' | sed 's/^null$//'
}

echo "[sync-stack] Reading $STACK_YAML"
echo "[sync-stack] Target: $ENDPOINT / $NS / $DB"
echo ""

# ── PORTS ────────────────────────────────────────────────────────────────────

echo "[sync-stack] Syncing ports..."
while IFS= read -r port_num; do
  [[ -z "$port_num" ]] && continue
  reserved_for=$(yq_get ".ports.$port_num" | sed 's/"/\\"/g')
  surreal_sql "UPSERT port:$port_num SET number = $port_num, reserved_for = \"$reserved_for\", status = 'reserved';"
  echo "  port $port_num → $reserved_for"
done < <(yq_get '.ports | keys | .[]')

echo ""

# ── PLATFORM → daemon records ────────────────────────────────────────────────

echo "[sync-stack] Syncing platform (daemons)..."
platform_count=$(yq_get '.platform | length')
for i in $(seq 0 $((platform_count - 1))); do
  name=$(yq_get ".platform[$i].name")
  label=$(yq_get ".platform[$i].label")
  binary=$(yq_get ".platform[$i].binary")
  notes=$(yq_get ".platform[$i].notes" | sed 's/"/\\"/g')
  [[ -z "$name" ]] && continue

  surreal_sql "UPSERT daemon:⟨${name}⟩ SET name = \"$name\", label = \"$label\", binary_path = \"$binary\", notes = \"$notes\";"
  echo "  daemon: $name ($label)"
done

echo ""

# ── INTELLIGENCE → mcp_server records ────────────────────────────────────────

echo "[sync-stack] Syncing intelligence (MCP servers)..."
intel_count=$(yq_get '.intelligence | length')
for i in $(seq 0 $((intel_count - 1))); do
  name=$(yq_get ".intelligence[$i].name")
  transport=$(yq_get ".intelligence[$i].transport")
  runtime=$(yq_get ".intelligence[$i].runtime")
  path=$(yq_get ".intelligence[$i].path")
  always_on=$(yq_get ".intelligence[$i].always_on")
  tool_count=$(yq_get ".intelligence[$i].tool_count")
  notes=$(yq_get ".intelligence[$i].notes" | sed 's/"/\\"/g')
  [[ -z "$name" ]] && continue

  surreal_sql "UPSERT mcp_server:⟨${name}⟩ SET name = \"$name\", transport = \"$transport\", runtime = \"$runtime\", path = \"$path\", always_on = $always_on, tool_count = $tool_count, notes = \"$notes\";"
  echo "  mcp_server: $name ($transport/$runtime, $tool_count tools)"
done

echo ""

# ── INTEGRATIONS ──────────────────────────────────────────────────────────────

echo "[sync-stack] Syncing integrations..."
integ_count=$(yq_get '.integrations | length')
for i in $(seq 0 $((integ_count - 1))); do
  name=$(yq_get ".integrations[$i].name")
  type=$(yq_get ".integrations[$i].type")
  install_cmd=$(yq_get ".integrations[$i].install" | sed 's/"/\\"/g')
  version=$(yq_get ".integrations[$i].version")
  notes=$(yq_get ".integrations[$i].notes" | sed 's/"/\\"/g')
  harnesses_json=$(yq_get ".integrations[$i].harnesses | @json")
  [[ -z "$name" ]] && continue

  surreal_sql "UPSERT integration:⟨${name}⟩ SET name = \"$name\", type = \"$type\", harnesses = $harnesses_json, install_cmd = \"$install_cmd\", version = \"$version\", notes = \"$notes\";"
  echo "  integration: $name ($type)"
done

echo ""

# ── SCRIPTS ──────────────────────────────────────────────────────────────────

echo "[sync-stack] Syncing scripts..."
script_count=$(yq_get '.scripts | length')
for i in $(seq 0 $((script_count - 1))); do
  name=$(yq_get ".scripts[$i].name")
  path=$(yq_get ".scripts[$i].path")
  purpose=$(yq_get ".scripts[$i].purpose" | sed 's/"/\\"/g')
  owned_by=$(yq_get ".scripts[$i].owned_by")
  [[ -z "$owned_by" ]] && owned_by="agent-core"
  [[ -z "$name" ]] && continue

  surreal_sql "UPSERT script:⟨${name}⟩ SET name = \"$name\", path = \"$path\", purpose = \"$purpose\", owned_by = \"$owned_by\";"
  echo "  script: $name ($path)"
done

echo ""
echo "[sync-stack] Done. Stack catalog synced to $NS/$DB."
