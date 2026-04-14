# agent-core — Developer Primer
**For:** jrg  
**Last updated:** 2026-04-14  
**What this is:** Everything you need to remember when you come back to this project.

---

## What Is This

`agent-core` is your personal primitive store and sync CLI. You author agent primitives once — skills, rules, directives, hooks, commands, subagents — and it syncs them to wherever each harness expects them. One source of truth. One command to push changes everywhere.

You built this because you were duplicating, drifting, and losing track of your agent configuration across pi, opencode, and claude-code. Now you don't.

---

## Where Everything Lives

```
~/agent-core/
  primitives/           ← THE STORE. Your canonical source files.
    skills/             ← 35 skills (flat .md files, named by id)
    rules/              ← 6 rules
    hooks/              ← 4 shell scripts (claude-code hooks)
    commands/           ← 1 slash command
    subagents/          ← 6 subagent definitions
    directives/         ← project-scoped directives
    meta/               ← integration profile template
  templates/
    WORK.md             ← copy this into any new project
  research/             ← 15 docs: primitives research, design decisions, audit notes
  WORK.md               ← THIS project's task board
  PRIMER.md             ← this file

  cli/                  ← The Zig source code for the CLI tool
    src/
      main.zig          ← arg parsing, command dispatch
      registry.zig      ← registry parser + HarnessProfile + resolveDeployPath
      status.zig        ← status command
      sync.zig          ← sync command (copy_file + inline_agents strategies)
      inline.zig        ← section injection into AGENTS.md (pi/opencode rules)
      checksum.zig      ← SHA-256 per file
    build.zig

~/.agent-core/
  registry              ← THE MANIFEST. Edit this to add/change deployments.
  registry.example      ← documented format reference

/opt/homebrew/bin/agent-core  ← global symlink, always available
```

---

## The Two Commands You Use Every Day

```bash
agent-core status                    # see what's in sync, stale, or missing
agent-core sync                      # push everything that's stale
agent-core sync skill/debug-hypothesis   # push one primitive
agent-core sync --harness claude-code    # push everything for one harness
agent-core sync --dry-run                # preview without writing
```

That's it. Those five forms cover 95% of daily use.

---

## The Registry Format

`~/.agent-core/registry` is a plain text file you edit by hand. Format:

```
# Harness profiles — define where each primitive type lives per harness
harness claude-code
  agents      ~/.claude/AGENTS.md
  skills      ~/.claude/skills
  skill_format directory          # creates <name>/SKILL.md subdirectory
  hooks       ~/.claude/hooks
  rules       ~/.claude/rules     # auto-sets rule_strategy to copy_file
end

harness pi
  agents      ~/.pi/agent/AGENTS.md
  skills      ~/.pi/agent/skills
  skill_format flat               # copies file directly as <name>.md
  rule_strategy inline_agents     # injects rules as delimited sections in AGENTS.md
end

harness opencode
  agents      ~/.config/opencode/AGENTS.md
  skills      ~/.config/opencode/skills
  skill_format directory
  commands    ~/.config/opencode/commands
  rule_strategy inline_agents
end

# Primitives — one entry per primitive, deploy to relevant harnesses
primitive skill/debug-hypothesis
  source ~/agent-core/primitives/skills/debug-hypothesis.md
  deploy pi
  deploy claude-code
  deploy opencode
end

primitive rule/commit-convention
  source ~/agent-core/primitives/rules/commit-convention.md
  deploy claude-code              # → ~/.claude/rules/commit-convention.md
  deploy pi                       # → injected into ~/.pi/agent/AGENTS.md
  deploy opencode                 # → injected into ~/.config/opencode/AGENTS.md
end
```

**To add a new primitive:** create the file in `primitives/`, add an entry to the registry, run `agent-core sync`.

---

## The Three Harnesses — What Each Supports

| Primitive type | claude-code | pi | opencode |
|----------------|-------------|-----|---------|
| Skills | `~/.claude/skills/<name>/SKILL.md` | `~/.pi/agent/skills/<name>.md` (flat) | `~/.config/opencode/skills/<name>/SKILL.md` |
| Rules | `~/.claude/rules/<name>.md` | injected into AGENTS.md | injected into AGENTS.md |
| Hooks | `~/.claude/hooks/<name>.sh` | TypeScript extension (manual) | TypeScript plugin (manual) |
| Commands | (none native) | `~/.pi/agent/prompts/<name>.md` | `~/.config/opencode/commands/<name>.md` |
| Directives | `~/.claude/CLAUDE.md` | `~/.pi/agent/CLAUDE.md` | `~/.config/opencode/AGENTS.md` |
| Agents file | `~/.claude/AGENTS.md` | `~/.pi/agent/AGENTS.md` | `~/.config/opencode/AGENTS.md` |

**Key insight:** `CLAUDE.md` is Anthropic-only. Every harness has its own directive filename. agent-core handles this via the harness profile — you don't think about it.

---

## The Session Workflow

Every session, every project:

**Start:** invoke `session-start` skill → reads WORK.md + last commit → shows you where everything is → asks "what are we expanding into?"

**End:** invoke `session-end` skill → updates WORK.md → commits with structured format → outputs the NEXT line.

**Commit format (always):**
```
feat(arc/quotes): implement price lock snapshot

PHASE: Implement
DONE: schema migration, unit tests
TODO: integration test, API endpoint
BLOCKED: —

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>
```

The `TODO:` line is the handoff. Session-start reads it first next time.

**WORK.md lives at the git root of every project:**
- `ACTIVE` = tasks with a defined path, doing now
- `BACKLOG` = todos, captured but not yet scheduled
- `BLOCKED` = can't move, explain why
- `DONE` = completed, with date

---

## The Four Phases (Apply at Every Tier)

| Phase | What it means |
|-------|--------------|
| **Ideate** | What are we building and why? No code yet. |
| **Plan** | How do we build it? Architecture, task decomposition. |
| **Implement** | Build it. Writing code. |
| **Verify** | Does it hold? Testing, review, validation. |

These apply to the whole project (mega), to features (macro), to sessions (meso), to individual tasks (micro). Same phases at every zoom level. This is the Constellation model — it will eventually power the visual layer.

---

## Current Primitive Inventory (2026-04-14)

**Registered and deployed (32 primitives tracked, all in sync):**
- Skills: debug-hypothesis, install, debugging-async, building-with-solidjs, building-with-solidstart, solidjs-2.0, session-start, session-end
- Rules: commit-convention, work-file-format
- Hooks: agent-spawn-check, rtk-rewrite, session-start, session-end
- Commands: install

**In the store but not yet registered (~27 skills + 6 rules + 6 subagents):**
These are in `~/agent-core/primitives/` but not in the registry yet. Audit needed — they were ported from M1 but haven't been deployed anywhere. Key ones worth registering soon: `delegate`, `prd`, `designing-apis`, `repo-deep-dive-analysis`, `debugging-with-logs`, `refactor`, `backend-first-security`, `challenging-assumptions`.

---

## What's Next (from WORK.md)

**Active:**
1. Contractor bootstrap kit for Arc — collection + setup.sh
2. Finalize session-start and session-end — done, use them now

**Backlog (in rough priority):**
1. Audit full 9-primitive stack in registry — not just skills
2. Register ported M1 skills
3. `agent-core add` scaffolding command
4. Test suite for CLI
5. GitHub repo

---

## The Bigger Picture

This tool is the practical foundation for something you've been building toward: a **primitive OS** — a universal layer where agent capabilities are authored once and deployed anywhere, regardless of which harness, model, or provider you're using.

The nine core primitives (directives, slash commands, skills, tools, MCP, plugins, hooks, rules, agents) appear in every major harness. agent-core maps them. The harness profile system handles the translation. The inline strategy handles harnesses that don't have native support for a primitive type.

When Constellation ships, WORK.md retires and the Nebula takes over. The session skills upgrade in place. Same output shape, different substrate.

Right now it solves your immediate problem: one change, one command, everything stays in sync.
