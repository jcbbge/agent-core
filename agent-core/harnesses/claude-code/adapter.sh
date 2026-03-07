#!/usr/bin/env bash
# Claude Code adapter
set -euo pipefail
PRIMITIVES="$1"
CLAUDE="$HOME/.claude"

deploy_skills() {
  rsync -a --delete "$PRIMITIVES/skills/" "$CLAUDE/skills/"
  echo "[claude-code] skills → ~/.claude/skills/ ($(ls "$PRIMITIVES/skills/" | wc -l | tr -d ' ') skills)"
}

deploy_commands() {
  mkdir -p "$CLAUDE/commands"
  rsync -a --delete "$PRIMITIVES/commands/" "$CLAUDE/commands/"
  echo "[claude-code] commands → ~/.claude/commands/ ($(ls "$PRIMITIVES/commands/" 2>/dev/null | wc -l | tr -d ' ') commands)"
}

deploy_rules() {
  local rules_src="$PRIMITIVES/rules"
  local count
  count=$(find "$rules_src" -name "*.md" -not -name "README.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -eq 0 ]; then
    echo "[claude-code] rules: no rule files yet (add .md files to primitives/rules/)"
    return
  fi
  mkdir -p "$CLAUDE/rules"
  rsync -a --delete --exclude="README.md" "$rules_src/" "$CLAUDE/rules/"
  echo "[claude-code] rules → ~/.claude/rules/ ($count files)"
}

deploy_subagents() {
  local agents_src="$PRIMITIVES/subagents"
  local count
  count=$(find "$agents_src" -name "*.md" -not -name "README.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -eq 0 ]; then
    echo "[claude-code] subagents: none yet (add .md files to primitives/subagents/)"
    return
  fi
  mkdir -p "$CLAUDE/agents"
  rsync -a --delete --exclude="README.md" "$agents_src/" "$CLAUDE/agents/"
  echo "[claude-code] subagents → ~/.claude/agents/ ($count agents)"
}

deploy_mcp() {
  local primitives="$PRIMITIVES"
  python3 - "$primitives" <<'PYEOF'
import json, os, sys

primitives = sys.argv[1]
registry_path = os.path.join(primitives, "mcp/registry.json")
mcp_path = os.path.expanduser("~/.claude/mcp.json")

with open(registry_path) as f:
    registry = json.load(f)

servers = {}
for s in registry["servers"]:
    if "claude-code" in s.get("harnesses", []) and s["transport"] == "http":
        servers[s["name"]] = {"type": "http", "url": s["url"]}

config = {"mcpServers": servers}
with open(mcp_path, "w") as f:
    json.dump(config, f, indent=2)
print(f"[claude-code] mcp → ~/.claude/mcp.json ({len(servers)} servers: {', '.join(servers.keys())})")
PYEOF
}

deploy_skills
deploy_commands
deploy_rules
deploy_subagents
deploy_mcp
echo "[claude-code] done. Restart Claude Code to pick up MCP changes."
