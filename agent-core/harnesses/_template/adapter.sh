#!/usr/bin/env bash
# adapter.sh — harness adapter template
# Copy to harnesses/[name]/adapter.sh and implement each section.
# Called by deploy.sh with: adapter.sh [primitives_dir]

set -euo pipefail
PRIMITIVES="$1"
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── SKILLS ────────────────────────────────────────────────────────────────────
# If this harness supports skills, copy/link them here.
deploy_skills() {
  local target=""  # e.g. "$HOME/.config/harness/skills"
  if [ -z "$target" ]; then echo "[template] skills: not configured"; return; fi
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/skills/" "$target/"
  echo "[harness-name] skills → $target"
}

# ── COMMANDS ──────────────────────────────────────────────────────────────────
# If this harness supports slash commands, deploy them here.
deploy_commands() {
  local target=""  # e.g. "$HOME/.config/harness/commands"
  if [ -z "$target" ]; then echo "[template] commands: not configured"; return; fi
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/commands/" "$target/"
  echo "[harness-name] commands → $target"
}

# ── RULES ─────────────────────────────────────────────────────────────────────
# Assemble rule fragments into this harness's rules file.
deploy_rules() {
  local target=""  # e.g. "$HOME/.config/harness/AGENTS.md"
  if [ -z "$target" ]; then echo "[template] rules: not configured"; return; fi
  # Rules are assembled from primitives/rules/*.md fragments
  # cat "$PRIMITIVES/rules/"*.md > "$target"
  echo "[harness-name] rules → $target"
}

# ── MCP ───────────────────────────────────────────────────────────────────────
# Update this harness's MCP config from the registry.
deploy_mcp() {
  local config=""  # e.g. "$HOME/.config/harness/mcp.json"
  if [ -z "$config" ]; then echo "[template] mcp: not configured"; return; fi
  # Read registry, patch harness MCP config
  # python3 "$HARNESS_DIR/patch-mcp.py" "$PRIMITIVES/mcp/registry.json" "$config"
  echo "[harness-name] mcp → $config"
}

# ── RELOAD ────────────────────────────────────────────────────────────────────
# Reload the harness after changes (if possible).
reload() {
  # e.g. pkill -HUP harness-process || true
  echo "[harness-name] reload: restart harness to pick up changes"
}

deploy_skills
deploy_commands
deploy_rules
deploy_mcp
reload
