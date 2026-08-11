# agent-core — Repository Guide
**For:** AI agents working in this repository  
**Last updated:** 2026-08-11

Stack, control-flow, comms, and harness runtime doctrine live in the canonical file — read **`~/agent-core/primitives/AGENTS.md`**. This document covers only the repo layout and the Zig CLI.

---

## What This Repository Is

`agent-core` is a Zig CLI and a primitive store. jrg authors agent primitives (skills, rules, hooks, commands, directives, subagents) once under `primitives/` and uses the CLI to diff and deploy them to harness config dirs.

Two harnesses are registered: **pi** and **claude-code**. (opencode was dropped 2026-08-11.)

The binary is at `~/agent-core/cli/zig-out/bin/agent-core`, symlinked to `/opt/homebrew/bin/agent-core`.

Two git repos: `~/agent-core/` (store + research) and `~/agent-core/cli/` (Zig source, submodule).

---

## Repository Structure

```
~/agent-core/
  cli/                  ← Zig source (build here)
    src/
      main.zig          ← arg parsing, command dispatch
      registry.zig      ← registry parser, HarnessProfile, resolveDeployPath
      status.zig        ← status command
      sync.zig          ← sync command
      inline.zig        ← section injection for inline_agents strategy
      checksum.zig      ← SHA-256 utilities
    build.zig
  primitives/           ← canonical source files (the store)
    skills/             ← skill sources (flat .md or <name>/SKILL.md)
    rules/              ← .md rule files (store-only; read on demand)
    hooks/              ← hook scripts (claude-code deploy targets)
    commands/           ← slash command .md files
    subagents/          ← subagent definition .md files
    directives/         ← directive .md files
    plugins/            ← pi TypeScript extensions (not agent-core synced)
    tools/              ← standalone CLI tools (e.g. slim, bigfile)
    AGENTS.md           ← canonical global agent context (doctrine)
  research/             ← research documents (do not modify without reason)
  AGENTS.md             ← this file (repo/CLI guide only)
  PRIMER.md             ← human-readable primer for jrg

~/.agent-core/
  registry              ← THE MANIFEST (plain text; not in this repo)
```

---

## Build

Requires **Zig 0.16.0** (`zig version` to verify).

```bash
cd ~/agent-core/cli && zig build
```

Rebuild after any CLI source change before testing.

---

## CLI — Commands and Flags

```bash
agent-core status                        # diff source vs deployed, all primitives
agent-core status --harness <name>       # filter to one harness (pi | claude-code)
agent-core sync                          # sync all stale primitives
agent-core sync <id>                     # sync one primitive (e.g. skill/debug-hypothesis)
agent-core sync --harness <name>         # sync all for one harness
agent-core sync --dry-run                # preview without writing
agent-core --registry <path>             # override registry file location
```

**Standing order:** do not run `agent-core sync` without coordinator clearance while the registry is being stabilized.

---

## Registry

Manifest file: `~/.agent-core/registry` (plain text, edit to add primitives). Two block types:

**Harness profile** — paths and strategies per harness:

```
harness <name>
  skills      <dir>
  skill_format flat|directory   # flat=<name>.md, directory=<name>/SKILL.md
  prompts     <dir>             # pi slash commands
  hooks       <dir>             # claude-code shell hooks
  rule_strategy copy_file|inline_agents|unsupported
end
```

**Primitive** — maps a source file to deployment targets:

```
primitive <type/name>
  source <path>
  deploy <harness-name>            # resolved via profile
  deploy <harness-name> <path>     # explicit path override
end
```

Primitive type is the prefix before `/`: `skill/`, `rule/`, `hook/`, `command/`, `directive/`, `agents/`, `prompt/`

---

## Deployment Strategies

| Strategy | When | What it does |
|----------|------|-------------|
| `copy_file` | harness has a target dir for the primitive type | Copies source to resolved destination |
| `inline_agents` | `rule_strategy inline_agents` in harness profile | Injects/updates delimited section in harness agents file |
| `unsupported` | no deploy mapping | Skips with message |

**Inline section delimiters** (when `inline_agents` is active):

```
<!-- agent-core: rule/<name> -->
[content]
<!-- /agent-core: rule/<name> -->
```

Existing sections are replaced in-place. New sections are appended. Content outside delimiters is never touched.

Current registry (2026-08-11): rules are **store-only** — no `inline_agents` deploy. Pi's `~/.pi/agent/AGENTS.md` is a symlink to `primitives/AGENTS.md`; inline rule injection through that symlink is banned.

---

## Harness Deploy Targets (from live registry)

| | pi | claude-code |
|--|----|----|
| **Skills** | `~/.pi/agent/skills/<name>/SKILL.md` (directory) | `~/.claude/skills/<name>/SKILL.md` (directory) |
| **Prompts** | `~/.pi/agent/prompts/<name>.md` | — |
| **Hooks** | TypeScript extensions in `~/.pi/agent/extensions/` (manual; not agent-core synced) | `~/.claude/hooks/<name>.sh` |
| **Rules** | store-only (`primitives/rules/`; read on demand) | store-only |

Do not guess paths. Read `~/.agent-core/registry` or run `agent-core status` before adding deploy targets.

---

## CLI Source — Memory Allocation

Allocations inside `status.zig`, `sync.zig`, and `inline.zig` use `reg.allocator()` (the registry arena), not the GPA passed into the function. The GPA parameter is intentionally unused (`_`). Do not change this without understanding the leak implications.

---

## Out of Scope

- **Constellation** — separate project at `~/constellation-zg/`
- **Arc** — separate project at `~/Infinity/arc/`
- **Pi TypeScript plugins** — live under `primitives/plugins/` but deploy via dotfiles/extensions, not `agent-core sync`
- **TUI / interactive mode** — not planned for v1
- **Remote registries / marketplace** — v2+
