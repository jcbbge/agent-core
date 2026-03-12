#!/usr/bin/env python3
"""
sync-primitives.py — deploys all 9 agent-core primitives to all harnesses.
NO SYMLINKS. Copy and transform only.
Run this any time a primitive changes.

Usage:
  python3 sync-primitives.py           # deploy everything
  python3 sync-primitives.py --dry-run # preview only
"""

import os, sys, shutil, json, re
from pathlib import Path

DRY = "--dry-run" in sys.argv
SRC = Path.home() / "Documents/_agents/primitives"

# ─── Harness deploy targets ────────────────────────────────────────────────
HARNESSES = {
    "claude-code": {
        "agent_file":   Path.home() / ".claude/CLAUDE.md",
        "rules_dir":    Path.home() / ".claude/rules",
        "skills_dir":   Path.home() / ".claude/skills",
        "commands_dir": Path.home() / ".claude/commands",
        "agents_dir":   Path.home() / ".claude/agents",
    },
    "opencode": {
        "agent_file":   Path.home() / ".config/opencode/AGENTS.md",
        "rules_dir":    None,   # injected via opencode.json instructions array
        "skills_dir":   Path.home() / ".config/opencode/skills",
        "commands_dir": Path.home() / ".config/opencode/commands",
        "agents_dir":   Path.home() / ".config/opencode/agents",
    },
    "omp": {
        "agent_file":   Path.home() / ".omp/agent/AGENTS.md",
        "rules_dir":    Path.home() / ".omp/agent/rules",
        "skills_dir":   Path.home() / ".omp/agent/skills",
        "commands_dir": Path.home() / ".omp/agent/commands",
        "agents_dir":   Path.home() / ".omp/agent/agents",
    },
}

OK  = "\033[32m✓\033[0m"
ERR = "\033[31m✗\033[0m"
SKP = "\033[2m—\033[0m"
YLW = "\033[33m⚠\033[0m"

def log(symbol, msg):
    print(f"  {symbol} {msg}")

def nuke_symlink_replace_with_dir(path: Path):
    """If path is a symlink, remove it and create a real directory."""
    if path.is_symlink():
        path.unlink()
        if not DRY:
            path.mkdir(parents=True, exist_ok=True)
        log(YLW, f"removed symlink → created dir: {path}")
    elif not path.exists():
        if not DRY:
            path.mkdir(parents=True, exist_ok=True)

def copy_file(src: Path, dst: Path):
    if DRY:
        print(f"    [copy] {src.name} → {dst}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def copy_dir_contents(src: Path, dst: Path, glob="*"):
    """Copy all files matching glob from src into dst (flat)."""
    nuke_symlink_replace_with_dir(dst)
    count = 0
    for f in sorted(src.glob(glob)):
        if f.is_file():
            copy_file(f, dst / f.name)
            count += 1
    return count

def copy_dir_recursive(src: Path, dst: Path):
    """Copy full directory tree from src to dst."""
    nuke_symlink_replace_with_dir(dst)
    count = 0
    for item in sorted(src.iterdir()):
        if item.is_dir():
            sub_dst = dst / item.name
            if not DRY:
                sub_dst.mkdir(parents=True, exist_ok=True)
            for f in item.glob("**/*"):
                if f.is_file():
                    rel = f.relative_to(src)
                    copy_file(f, dst / rel)
                    count += 1
        elif item.is_file():
            copy_file(item, dst / item.name)
            count += 1
    return count

# ─── Frontmatter helpers ──────────────────────────────────────────────────

def parse_md(path: Path):
    text = path.read_text()
    if not text.startswith("---"):
        return {}, text.strip()
    end = text.find("---", 3)
    if end == -1:
        return {}, text.strip()
    fm_raw = text[3:end].strip()
    body = text[end + 3:].strip()
    fm = {}
    current_key = None
    for line in fm_raw.splitlines():
        if re.match(r"^  - ", line):
            if current_key:
                if not isinstance(fm.get(current_key), list):
                    fm[current_key] = []
                fm[current_key].append(line[4:].strip())
        elif ":" in line and not line.startswith(" "):
            k, _, v = line.partition(":")
            current_key = k.strip()
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                fm[current_key] = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
            else:
                fm[current_key] = v
    return fm, body

def write_md(path: Path, fm: dict, body: str):
    if DRY:
        print(f"    [write] {path}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["---"]
    for k, v in fm.items():
        if isinstance(v, list):
            if not v:
                lines.append(f"{k}: []")
            else:
                lines.append(f"{k}:")
                for item in v:
                    lines.append(f"  - {item}")
        else:
            lines.append(f"{k}: {v}")
    lines += ["---", "", body, ""]
    path.write_text("\n".join(lines))

# ─── Primitive 1: Agent file ──────────────────────────────────────────────

def sync_agent_file():
    print("\n[1] AGENT FILE")
    src = SRC / "agent-file/AGENTS.md"
    if not src.exists():
        log(ERR, f"source not found: {src}"); return

    targets = {
        "claude-code": HARNESSES["claude-code"]["agent_file"],
        "opencode":    HARNESSES["opencode"]["agent_file"],
        "omp":         HARNESSES["omp"]["agent_file"],
    }
    for harness, dst in targets.items():
        if dst.is_symlink():
            if not DRY: dst.unlink()
            log(YLW, f"{harness}: removed symlink")
        copy_file(src, dst)
        log(OK, f"{harness}: {dst.name}")

# ─── Primitive 2: Rules ───────────────────────────────────────────────────

def sync_rules():
    print("\n[2] RULES")
    src = SRC / "rules"

    # Claude Code
    dst = HARNESSES["claude-code"]["rules_dir"]
    n = copy_dir_contents(src, dst, "*.md")
    log(OK, f"claude-code: {n} rules → {dst}")

    # OMP — same format, copy directly
    dst = HARNESSES["omp"]["rules_dir"]
    n = copy_dir_contents(src, dst, "*.md")
    log(OK, f"omp: {n} rules → {dst}")

    # OpenCode — no rules dir; rules loaded via opencode.json instructions glob
    # The glob points to ~/.claude/rules/*.md which we just populated above.
    # Verify the instructions array is set in opencode.json.
    oc_config = Path.home() / ".config/opencode/opencode.json"
    if oc_config.exists():
        with open(oc_config) as f:
            d = json.load(f)
        rules_glob = str(Path.home() / ".claude/rules/*.md")
        instructions = d.get("instructions", [])
        if rules_glob not in instructions:
            if not DRY:
                instructions.append(rules_glob)
                d["instructions"] = instructions
                with open(oc_config, "w") as f:
                    json.dump(d, f, indent=2)
            log(OK, f"opencode: rules glob added to instructions array")
        else:
            log(OK, f"opencode: rules already in instructions array")

# ─── Primitive 3: Skills ─────────────────────────────────────────────────

def sync_skills():
    print("\n[3] SKILLS")
    src = SRC / "skills"

    for harness in ["claude-code", "opencode", "omp"]:
        dst = HARNESSES[harness]["skills_dir"]
        n = copy_dir_recursive(src, dst)
        log(OK, f"{harness}: {n} skill files → {dst}")

# ─── Primitive 4: Commands ────────────────────────────────────────────────

def sync_commands():
    print("\n[4] COMMANDS")
    src = SRC / "commands"

    for harness in ["claude-code", "opencode", "omp"]:
        dst = HARNESSES[harness]["commands_dir"]
        n = copy_dir_contents(src, dst, "*.md")
        log(OK, f"{harness}: {n} commands → {dst}")

# ─── Primitive 8: Subagents ───────────────────────────────────────────────

def transform_opencode_agent(fm, body):
    out = {"description": fm.get("description", ""), "mode": "subagent"}
    if fm.get("model"): out["model"] = fm["model"]
    out["steps"] = 50
    return out, body

def transform_omp_agent(fm, body):
    out = {"name": fm.get("name", ""), "description": fm.get("description", "")}
    if fm.get("model"): out["model"] = fm["model"]
    tools = fm.get("tools", [])
    if tools: out["tools"] = tools if isinstance(tools, list) else [tools]
    out["spawns"] = []
    return out, body

def sync_agents():
    print("\n[8] SUBAGENTS")
    src = SRC / "subagents"
    skip = {"README.md"}

    # Claude Code — copy canonical as-is
    dst = HARNESSES["claude-code"]["agents_dir"]
    nuke_symlink_replace_with_dir(dst)
    count = 0
    for f in sorted(src.glob("*.md")):
        if f.name in skip or f.is_symlink(): continue
        copy_file(f, dst / f.name)
        count += 1
    log(OK, f"claude-code: {count} agents → {dst}")

    # OpenCode + OMP — transform
    for harness, transformer in [("opencode", transform_opencode_agent), ("omp", transform_omp_agent)]:
        dst = HARNESSES[harness]["agents_dir"]
        nuke_symlink_replace_with_dir(dst)
        count = 0
        for f in sorted(src.glob("*.md")):
            if f.name in skip or f.is_symlink(): continue
            fm, body = parse_md(f)
            out_fm, out_body = transformer(fm, body)
            name = fm.get("name") or f.stem
            write_md(dst / f"{name}.md", out_fm, out_body)
            count += 1
        log(OK, f"{harness}: {count} agents → {dst}")

# ─── Primitives 5,6,7,9: MCPs, Hooks, Custom Tools, Plugins ─────────────

def sync_mcp():
    print("\n[7] MCP SERVERS")
    registry = SRC / "mcp/registry.json"
    if not registry.exists():
        log(ERR, "registry.json not found"); return

    with open(registry) as f:
        reg = json.load(f)
    servers = {s["name"]: s for s in reg.get("servers", [])}

    # Claude Code
    cc_path = Path.home() / ".claude.json"
    if cc_path.exists():
        with open(cc_path) as f:
            d = json.load(f)
        mcp = d.setdefault("mcpServers", {})
        added = []
        for name, s in servers.items():
            if name not in mcp:
                url = s.get("url", f"http://localhost:{s['port']}/")
                mcp[name] = {"type": "http", "url": url}
                added.append(name)
        if not DRY and added:
            with open(cc_path, "w") as f:
                json.dump(d, f, indent=2)
        status = f"all {len(mcp)} present" if not added else f"added: {added}"
        log(OK, f"claude-code: {status}")

    # OpenCode
    oc_path = Path.home() / ".config/opencode/opencode.json"
    if oc_path.exists():
        with open(oc_path) as f:
            d = json.load(f)
        mcp = d.setdefault("mcp", {})
        added = []
        for name, s in servers.items():
            if name not in mcp:
                url = s.get("url", f"http://localhost:{s['port']}/")
                mcp[name] = {"type": "remote", "url": url, "enabled": True, "timeout": 5000}
                added.append(name)
        if not DRY and added:
            with open(oc_path, "w") as f:
                json.dump(d, f, indent=2)
        status = f"all {len(mcp)} present" if not added else f"added: {added}"
        log(OK, f"opencode: {status}")

    # OMP
    omp_path = Path.home() / ".omp/agent/mcp.json"
    if omp_path.exists():
        with open(omp_path) as f:
            d = json.load(f)
        mcp = d.setdefault("mcpServers", {})
        added = []
        for name, s in servers.items():
            if name not in mcp:
                url = s.get("url", f"http://localhost:{s['port']}/")
                mcp[name] = {"type": "http", "url": url}
                added.append(name)
        if not DRY and added:
            with open(omp_path, "w") as f:
                json.dump(d, f, indent=2)
        status = f"all {len(mcp)} present" if not added else f"added: {added}"
        log(OK, f"omp: {status}")

# ─── Main ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if DRY:
        print("DRY RUN — no files will be written\n")
    else:
        print("SYNCING PRIMITIVES → ALL HARNESSES\n")

    sync_agent_file()   # 1
    sync_rules()        # 2
    sync_skills()       # 3
    sync_commands()     # 4
    # 5 custom tools: scratchpad already in omp config.yml; Claude Code via rules file; OpenCode via MCP
    # 6 hooks: harness-specific TS/JSON — not portable, managed per-harness manually
    sync_mcp()          # 7
    sync_agents()       # 8
    # 9 plugins: harness-specific — not portable

    print("\nDone. Run primitives-audit.sh to verify.")
