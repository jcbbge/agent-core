# agent-core — Developer Primer
**For:** jrg
**Last updated:** 2026-08-14
**What this is:** Everything you need to remember when you come back to this project. Doctrine and full inventory live elsewhere now (see pointers below) — this file stays a short orientation, not the source of truth.

---

## What Is This

`agent-core` is your personal primitive store and sync CLI. You author agent primitives once — skills, rules, directives, hooks, commands, subagents — and it syncs them to wherever each harness expects them. One source of truth. One command to push changes everywhere.

You built this because you were duplicating, drifting, and losing track of your agent configuration across pi, opencode, and claude-code. opencode was dropped 2026-08-11; **cursor** joined as a full third harness 2026-08-12. Since then agent-core has grown a real substrate around it — Herdr (terminal/fleet runtime), Tower (message bus), and an enforcement layer (write-gate, spawn-door, credential-guard) wired into all three harnesses' hook systems. None of that lived here in April; all of it does now.

---

## Where Everything Really Lives

```
~/agent-core/
  primitives/           ← THE STORE. Canonical source files.
    skills/ rules/ hooks/ commands/ subagents/ directives/ plugins/ tools/
    AGENTS.md            ← canonical global agent context (doctrine — read this, not this primer, for doctrine)
  research/              ← research documents
  AGENTS.md              ← repo/CLI guide (layout + Zig CLI reference)
  TAXONOMY.md            ← counts snapshot, re-derived each audit pass
  WORK.md                ← this project's task board
  PRIMER.md              ← this file
  AUDIT-2026-08-14-topology.md  ← the living narrative inventory of the WHOLE
                                   agent estate (Herdr, Tower, gates, cursor-shim,
                                   defects) — read this for "what exists and why"

  cli/                  ← Zig CLI source (own git repo, submodule)

~/.agent-core/
  registry              ← THE MANIFEST. Plain text, hand-edited.
```

For doctrine (stack, control-flow, comms, harness runtime rules) the canonical
file is **`~/agent-core/primitives/AGENTS.md`** — it's composed into
`~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, and `~/AGENTS.md` by
`agent-core sync`. Edit the canonical source, never the composed copies.

---

## The Commands You Use Every Day

```bash
agent-core status                    # see what's in sync, stale, or missing (all harnesses + machine pseudo-harness)
agent-core status --harness cursor   # filter to one harness
agent-core sync                      # push everything that's stale
agent-core sync skill/debug-hypothesis   # push one primitive
agent-core sync --dry-run                # preview without writing
```

Registry also carries three **check-only** verbs (`link`, `check`, `binary`,
added 2026-08-14) that report on estate agent-core doesn't own (tool
binaries, git hooks, hook-JSON wiring) without ever writing to it — see
`primitives/AGENTS.md` "Deployment Strategies" for the grammar.

---

## The Registry Format

`~/.agent-core/registry` is a plain text file you edit by hand: `harness <name> … end` blocks define per-harness paths, `primitive <type/name> … end` blocks map a source file to `deploy <harness>` targets (plus the check-only verbs above). Full grammar and current harness list: read the registry itself — it's short and heavily commented, not `registry.example` (retired).

**To add a new primitive:** create the file in `primitives/`, add an entry to the registry, run `agent-core sync`.

---

## The Three Harnesses — What Each Supports

| Primitive type | claude-code | pi | cursor |
|----------------|-------------|-----|--------|
| Skills | `~/.claude/skills/<name>/SKILL.md` | `~/.pi/agent/skills/<name>/SKILL.md` | `~/.cursor/skills-cursor/<name>/SKILL.md` |
| Rules | store-only (read on demand) | store-only | store-only |
| Hooks | `~/.claude/hooks/<name>.sh` | TypeScript extension in `~/.pi/agent/extensions/` (manual) | `~/.cursor/hooks/<name>.sh` + wiring check against `~/.cursor/hooks.json` |
| Commands | (none native) | `~/.pi/agent/prompts/<name>.md` | `~/.cursor/commands/<name>.md` |
| Directive core | `~/.claude/CLAUDE.md` (composed) | `~/.pi/agent/AGENTS.md` (composed) | `~/AGENTS.md` (composed) |

**Key insight, unchanged since April:** every harness has its own directive filename; agent-core's harness profiles hide that from you.

---

## The Session Workflow

**Start:** `starting-session` skill → reads WORK.md + git state → surfaces risk zones.
**End:** `ending-session` skill → strikes the fleet, commits with the standard handoff, clears the Tower bus.

**Commit format (always):**
```
feat(arc/quotes): implement price lock snapshot

PHASE: Implement
DONE: schema migration, unit tests
TODO: integration test, API endpoint
BLOCKED: —

Co-Authored-By: <Model Name> <noreply@provider.com>
```

`WORK.md` lives at the git root of every project: `ACTIVE` / `BLOCKED` / `BACKLOG` / `DONE` (see `templates/WORK.md`).

---

## The Four Phases (Apply at Every Tier)

| Phase | What it means |
|-------|--------------|
| **Ideate** | What are we building and why? No code yet. |
| **Plan** | How do we build it? Architecture, task decomposition. |
| **Implement** | Build it. |
| **Verify** | Does it hold? Testing, review, validation. |

Same four phases at every zoom level: mega (project), macro (feature), meso (session), micro (task). This is the Made Well loop now (Discovery-Commit-Build-Land at the CORD tier; Imagine-Plan-Make-Verify at the ORCH tier) — see `primitives/rules/control-flow.md`.

---

## Current Inventory and What's Next

Don't hand-derive counts or a task list here — they rot (this file sat wrong
for four months). For:
- **counts** → `TAXONOMY.md` (re-derive, don't retype)
- **full narrative inventory + known defects** → `AUDIT-2026-08-14-topology.md`
- **active work** → `WORK.md`

---

## The Bigger Picture

Still true: this is the practical foundation for a **primitive OS** — author
agent capabilities once, deploy anywhere, regardless of harness, model, or
provider. The nine core primitives (directives, slash commands, skills,
tools, MCP, plugins, hooks, rules, agents) appear in every major harness;
agent-core maps them. What's changed since April is that "anywhere" now
includes a real substrate (Herdr fleet runtime, Tower message bus, an
enforcement layer) rather than three static config directories.
