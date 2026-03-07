#!/usr/bin/env bash
# OpenCode adapter
set -euo pipefail
PRIMITIVES="$1"
OC="$HOME/.config/opencode"

deploy_mcp() {
  local primitives="$PRIMITIVES"
  python3 - "$primitives" <<'PYEOF'
import json, os, sys

primitives = sys.argv[1]
registry_path = os.path.join(primitives, "mcp/registry.json")
oc_path = os.path.expanduser("~/.config/opencode/opencode.json")

with open(registry_path) as f:
    registry = json.load(f)

with open(oc_path) as f:
    config = json.load(f)

# Rebuild mcp section from registry for opencode harness
mcp = {}
for s in registry["servers"]:
    if "opencode" not in s.get("harnesses", []):
        continue
    if s["transport"] == "http":
        mcp[s["name"]] = {"type": "http", "url": s["url"], "enabled": True}
    elif s["transport"] == "stdio":
        # Keep existing stdio config if present (don't clobber command/env)
        existing = config.get("mcp", {}).get(s["name"])
        if existing:
            mcp[s["name"]] = existing
        else:
            print(f"  WARNING: {s['name']} is stdio — configure manually in opencode.json")

config["mcp"] = mcp
with open(oc_path, "w") as f:
    json.dump(config, f, indent=2)
print(f"[opencode] mcp → ~/.config/opencode/opencode.json ({len(mcp)} servers: {', '.join(mcp.keys())})")
PYEOF
}

deploy_mcp
# Skills: rsync to opencode skills dir
rsync -a --delete "$PRIMITIVES/skills/" "$OC/skills/"
echo "[opencode] skills → ~/.config/opencode/skills/ ($(ls "$PRIMITIVES/skills/" | wc -l | tr -d ' ') skills)"
echo "[opencode] done. Changes take effect on next OpenCode session."
