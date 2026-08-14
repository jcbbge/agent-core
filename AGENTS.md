# agent-core — Repository Guide
**For:** AI agents working in this repository  
**Last updated:** 2026-08-11

Stack, control-flow, comms, and harness runtime doctrine live in the canonical file — read **`~/agent-core/primitives/AGENTS.md`**. This document covers only the repo layout and the Zig CLI.

---

## What This Repository Is

`agent-core` is a Zig CLI and a primitive store. jrg authors agent primitives (skills, rules, hooks, commands, directives, subagents) once under `primitives/` and uses the CLI to diff and deploy them to harness config dirs.

Three harnesses are registered: **pi**, **claude-code**, and **cursor** (added 2026-08-12). (opencode was dropped 2026-08-11.) A fourth, non-harness pseudo-target, **machine**, covers machine-wide estate with no config-dir profile of its own (tool binaries, git hooks) — see the check-only verbs below.

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
agent-core status --harness <name>       # filter to one harness (pi | claude-code | cursor | machine)
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
| `link` (check-only) | registry line `link <harness> <path>` | Verifies path is a symlink to the source; never writes |
| `check` (check-only) | registry line `check <harness> <path>[#<needle>]` | Verifies path mentions needle (default: source); never writes |
| `binary` (check-only) | registry line `binary <harness> <path>` | Verifies path is executable, no older than source; never writes |

The three check-only verbs (added 2026-08-14) exist for VISIBILITY, not ownership — they report state for estate installed by other tools (Tower's installer, the harnesses, `zig build`) that agent-core must never plant symlinks over (operator ruling, 2026-08-12). `machine` is a pseudo-harness for machine-wide estate with no harness profile of its own (tool binaries, git hooks); every such registry line carries its path explicitly since there is no profile to resolve against. `agent-core status --harness machine` filters to it.

**Inline section delimiters** (when `inline_agents` is active):

```
<!-- agent-core: rule/<name> -->
[content]
<!-- /agent-core: rule/<name> -->
```

Existing sections are replaced in-place. New sections are appended. Content outside delimiters is never touched.

Current registry: rules are **store-only** — no `inline_agents` deploy. The composed entrypoints (`~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md`) are generated copies of `primitives/AGENTS.md` (banner + harness delta appended), not symlinks — a 2026-08-12 ruling retired the pi symlink specifically because inline rule injection through a symlink would corrupt the canonical source.

---

## Harness Deploy Targets (from live registry)

| | pi | claude-code | cursor |
|--|----|----|----|
| **Skills** | `~/.pi/agent/skills/<name>/SKILL.md` (directory) | `~/.claude/skills/<name>/SKILL.md` (directory) | `~/.cursor/skills-cursor/<name>/SKILL.md` (directory) |
| **Prompts/Commands** | `~/.pi/agent/prompts/<name>.md` | — | `~/.cursor/commands/<name>.md` |
| **Hooks** | TypeScript extensions in `~/.pi/agent/extensions/` (manual; not agent-core synced) | `~/.claude/hooks/<name>.sh` | `~/.cursor/hooks/<name>.sh` + wiring check against `~/.cursor/hooks.json` |
| **Agents/subagents** | — | `~/.claude/agents/` | `~/.cursor/agents/` |
| **Rules** | store-only (`primitives/rules/`; read on demand) | store-only | store-only |

Cursor registered 2026-08-12 (added `--harness cursor`; full parity ruling extended most existing skills to `deploy cursor`). Do not guess paths. Read `~/.agent-core/registry` or run `agent-core status` before adding deploy targets.

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
