# agent-core — Agent Context
**For:** AI agents working in this repository  
**Last updated:** 2026-04-14  
**Read this before touching anything.**

---

## What This Repository Is

`agent-core` is a Zig 0.15.2 CLI tool and primitive store. It solves one problem: jrg authors agent primitives (skills, rules, hooks, commands, directives, subagents) once in a canonical location and syncs them to wherever each harness expects them.

Three harnesses are supported: **pi.dev**, **opencode**, **claude-code**.

The binary is at `~/agent-core/cli/zig-out/bin/agent-core`, symlinked globally to `/opt/homebrew/bin/agent-core`.

---

## Repository Structure

```
~/agent-core/
  cli/                  ← Zig source (the CLI tool)
    src/
      main.zig          ← arg parsing, command dispatch
      registry.zig      ← registry parser, HarnessProfile, resolveDeployPath
      status.zig        ← status command
      sync.zig          ← sync command
      inline.zig        ← section injection for inline_agents strategy
      checksum.zig      ← SHA-256 utilities
    build.zig
  primitives/           ← canonical source files (the store)
    skills/             ← SKILL.md files (directory format from M1, flat for pi)
    rules/              ← .md rule files
    hooks/              ← .sh hook scripts
    commands/           ← slash command .md files
    subagents/          ← subagent definition .md files
    directives/         ← directive .md files
    meta/               ← integration profile template
  templates/
    WORK.md             ← template for new project task boards
  research/             ← 15 research documents (do not modify without reason)
  WORK.md               ← THIS project's task board (update at session end)
  AGENTS.md             ← this file
  PRIMER.md             ← human-readable primer for jrg

~/.agent-core/
  registry              ← THE MANIFEST (plain text, edit to add primitives)
```

---

## The CLI — Commands and Flags

```bash
agent-core status                        # diff source vs deployed, all primitives
agent-core status --harness <name>       # filter to one harness
agent-core sync                          # sync all stale primitives
agent-core sync <id>                     # sync one primitive (e.g. skill/debug-hypothesis)
agent-core sync --harness <name>         # sync all for one harness
agent-core sync --dry-run                # preview without writing
agent-core --registry <path>             # override registry file location
```

**Build:** `cd ~/agent-core/cli && zig build`  
**After any source change:** rebuild before testing.

---

## Registry Format — How It Works

`~/.agent-core/registry` is a plain text file. Two block types:

**Harness profile** — defines paths and strategies per harness:
```
harness <name>
  agents      <path>          # agents file (AGENTS.md equivalent)
  skills      <dir>           # skills directory
  skill_format flat|directory # flat=<name>.md, directory=<name>/SKILL.md
  prompts     <dir>           # slash commands (pi)
  commands    <dir>           # slash commands (opencode)
  hooks       <dir>           # hooks directory
  rules       <dir>           # rules directory → auto-sets rule_strategy=copy_file
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

Three strategies, auto-selected or explicit:

| Strategy | When | What it does |
|----------|------|-------------|
| `copy_file` | harness has `rules` dir, or any non-rule primitive with a target dir | Copies source file to resolved destination |
| `inline_agents` | `rule_strategy inline_agents` in harness profile | Injects/updates delimited section in the harness agents file |
| `unsupported` | no rules mapping exists | Skips with message |

**Inline section delimiters:**
```
<!-- agent-core: rule/commit-convention -->
[content]
<!-- /agent-core: rule/commit-convention -->
```

Existing sections are replaced in-place. New sections are appended. Content outside delimiters is never touched.

---

## Harness Path Conventions (Verified)

| | pi | opencode | claude-code |
|--|----|---------|----|
| **Skills** | `~/.pi/agent/skills/<name>.md` (flat) | `~/.config/opencode/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| **Rules** | injected into AGENTS.md | injected into AGENTS.md | `~/.claude/rules/<name>.md` |
| **Hooks** | TypeScript extension (manual) | TypeScript plugin (manual) | `~/.claude/hooks/<name>.sh` |
| **Commands** | `~/.pi/agent/prompts/<name>.md` | `~/.config/opencode/commands/<name>.md` | — |
| **Agents file** | `~/.pi/agent/AGENTS.md` | `~/.config/opencode/AGENTS.md` | `~/.claude/AGENTS.md` |

**Do not guess paths.** These were verified against actual harness source code and official docs. If adding a new harness, read its docs or source before writing a profile.

---

## Key Design Decisions

1. **Local-first, no server.** Everything is files. No database, no daemon, no network. If git + filesystem work, agent-core works.

2. **Visibility over automation.** `status` shows what's stale. `sync` fixes it. No magic auto-propagation that could corrupt files.

3. **Concept-to-mechanism.** A primitive type has different mechanisms per harness. The profile captures both path AND strategy, not just path.

4. **Registry is the source of truth.** The filesystem under `primitives/` is the store. The registry is the manifest. They are separate. Files can exist in the store without being registered.

5. **Rules in pi/opencode are inline.** Neither harness has a native rules directory. Rules are injected as delimited sections into AGENTS.md. This is the verified mechanism for both.

6. **CLAUDE.md is Anthropic-only.** Every harness has its own directive filename. The harness profile `directives` field captures this. Do not assume CLAUDE.md works everywhere.

7. **skill_format matters.** Pi uses flat `.md` files. Opencode and claude-code use `<name>/SKILL.md` subdirectories. The profile captures this. agent-core handles the structure automatically.

---

## Memory Allocation — Important

All allocations inside `status.zig`, `sync.zig`, and `inline.zig` use `reg.allocator()` (the registry's arena allocator) not the GPA passed into the function. The GPA allocator parameter is unused (`_`). This is intentional — it prevents leaks by tying all intermediate allocations to the registry's lifetime. Do not change this pattern without understanding the consequence.

---

## Current State (2026-04-14)

- **32 primitives tracked.** All in sync. `agent-core status` exits clean.
- **~27 skills in store but not registered.** They exist in `primitives/skills/` but have no registry entry yet. Do not deploy them without jrg's decision on which harnesses they belong to.
- **Two git repos:** `~/agent-core/` (store + research) and `~/agent-core/cli/` (Zig source). Both on `main`, both clean.

---

## Session Protocol for This Repo

**Start:** Run `agent-core status` to see current sync state. Read `WORK.md` for active tasks.

**Before modifying CLI source:** Understand what you're changing. The four source files (`registry.zig`, `status.zig`, `sync.zig`, `inline.zig`) are tightly coupled. A change to `HarnessProfile` in registry.zig will require updates in all three other files.

**After modifying CLI source:** `cd ~/agent-core/cli && zig build`. Fix all errors before testing. The compiler is strict — treat warnings as errors.

**Before modifying the registry:** `agent-core status --dry-run` first. Understand what will change.

**At session end:** Update `WORK.md`, commit with the standard format:
```
<type>(agent-core): <summary>

PHASE: <phase>
DONE: <what was completed>
TODO: <what remains>
BLOCKED: <or omit>

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>
```

---

## What Is NOT in Scope for agent-core

- **Constellation** — separate project at `~/constellation-zg/`. agent-core is designed to upgrade when Constellation ships (WORK.md → Nebula), but do not add Constellation-specific code here.
- **Arc** — separate project at `~/Infinity/arc/`. agent-core serves Arc but is not part of it.
- **TUI / interactive mode** — not planned for v1. Deferred.
- **Plugin/extension adapters** — TypeScript hooks for pi/opencode are out of scope. agent-core handles file primitives only.
- **Remote registries / marketplace** — v2+. Not now.
