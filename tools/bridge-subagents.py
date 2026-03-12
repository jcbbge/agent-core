#!/usr/bin/env python3
"""
bridge-subagents.py — transforms canonical subagent definitions to harness-native format.

Canonical source: ~/Documents/_agents/primitives/subagents/*.md
Outputs:
  Claude Code:  ~/.claude/agents/[name].md         (already symlinked — skip)
  OpenCode:     ~/.config/opencode/agents/[name].md
  OMP:          ~/.omp/agent/agents/[name].md
"""

import os, sys, re
from pathlib import Path

SOURCE = Path.home() / "Documents/_agents/primitives/subagents"
TARGETS = {
    "opencode": Path.home() / ".config/opencode/agents",
    "omp":      Path.home() / ".omp/agent/agents",
}

def parse_md(path: Path) -> tuple[dict, str]:
    """Returns (frontmatter_dict, body_str). Simple YAML parser — no deps."""
    text = path.read_text()
    if not text.startswith("---"):
        return {}, text.strip()
    end = text.index("---", 3)
    fm_raw = text[3:end].strip()
    body = text[end + 3:].strip()
    fm = {}
    for line in fm_raw.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            v = v.strip()
            # Parse YAML list shorthand [a, b, c]
            if v.startswith("[") and v.endswith("]"):
                v = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
            # Parse YAML block list (next lines starting with "  -")
            fm[k.strip()] = v
    # Handle block-style lists
    current_key = None
    fm2 = {}
    for line in fm_raw.splitlines():
        if line.startswith("  - "):
            if current_key:
                fm2.setdefault(current_key, []).append(line[4:].strip())
        elif ":" in line and not line.startswith(" "):
            k, _, v = line.partition(":")
            current_key = k.strip()
            v = v.strip()
            if v and not v.startswith("["):
                fm2[current_key] = v
            elif v.startswith("[") and v.endswith("]"):
                fm2[current_key] = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
    return fm2, body

def write_md(path: Path, frontmatter: dict, body: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["---"]
    for k, v in frontmatter.items():
        if isinstance(v, list):
            if len(v) == 0:
                lines.append(f"{k}: []")
            else:
                lines.append(f"{k}:")
                for item in v:
                    lines.append(f"  - {item}")
        elif "\n" in str(v):
            # Multi-line string — use YAML block scalar
            lines.append(f"{k}: |")
            for subline in str(v).splitlines():
                lines.append(f"  {subline}")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    lines.append("")
    lines.append(body)
    path.write_text("\n".join(lines) + "\n")

def transform_opencode(fm: dict, body: str) -> tuple[dict, str]:
    """
    OpenCode agent format:
      - mode: subagent
      - description: from canonical
      - model: opencode model string (use canonical if compatible, else default)
      - steps: 50 (reasonable default)
    Body = system prompt verbatim.
    """
    out_fm = {
        "description": fm.get("description", ""),
        "mode": "subagent",
    }
    # Model: keep canonical model if set, else no model (inherits session default)
    model = fm.get("model", "")
    if model:
        out_fm["model"] = model
    out_fm["steps"] = 50
    return out_fm, body

def transform_omp(fm: dict, body: str) -> tuple[dict, str]:
    """
    OMP agent format:
      - name: from canonical
      - description: from canonical
      - model: from canonical
      - tools: list or "*"
      - spawns: [] (don't allow spawning by default)
    Body = system prompt verbatim.
    """
    out_fm = {
        "name": fm.get("name", ""),
        "description": fm.get("description", ""),
    }
    model = fm.get("model", "")
    if model:
        out_fm["model"] = model
    tools = fm.get("tools", [])
    if tools:
        out_fm["tools"] = tools if isinstance(tools, list) else [tools]
    out_fm["spawns"] = []
    return out_fm, body

TRANSFORMERS = {
    "opencode": transform_opencode,
    "omp":      transform_omp,
}

def main():
    dry_run = "--dry-run" in sys.argv
    results = {"generated": [], "skipped": [], "errors": []}

    agent_files = [f for f in SOURCE.glob("*.md")
                   if f.name not in ("README.md",) and not f.is_symlink()]

    for src in sorted(agent_files):
        try:
            fm, body = parse_md(src)
            name = fm.get("name") or src.stem

            for harness, target_dir in TARGETS.items():
                out_path = target_dir / f"{name}.md"
                transformer = TRANSFORMERS[harness]
                out_fm, out_body = transformer(fm, body)

                if dry_run:
                    print(f"[DRY RUN] {harness}: {src.name} → {out_path}")
                else:
                    write_md(out_path, out_fm, out_body)
                    results["generated"].append(f"{harness}/{name}.md")

        except Exception as e:
            results["errors"].append(f"{src.name}: {e}")

    if not dry_run:
        print(f"Generated {len(results['generated'])} agent files:")
        for g in results["generated"]:
            print(f"  ✓ {g}")
        if results["errors"]:
            print(f"\nErrors ({len(results['errors'])}):")
            for e in results["errors"]:
                print(f"  ✗ {e}")

if __name__ == "__main__":
    main()
