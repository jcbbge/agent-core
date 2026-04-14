# agent-core Design Decisions
**Date:** 2026-04-14  
**Status:** Working notes — decisions made, questions open

---

## Decision 1: Global-First, Project-Aware

**What:** agent-core manages two scopes:

1. **Global** — primitives that apply everywhere, across all sessions, all projects
   - Lives in `~/agent-core/primitives/`
   - Syncs to harness global config dirs (`~/.claude/`, `~/.pi/agent/`, `~/.config/opencode/`)
   - Managed by `~/.agent-core/registry`

2. **Project-local** — primitives scoped to a specific codebase
   - Lives in `<project>/.agent/primitives/` (or `.agent-core/`)
   - Syncs to project-local harness dirs (`.claude/`, `.pi/`, etc.)
   - Managed by `<project>/.agent-core/registry`

**Why this matters:** A zig skill belongs in the zig project, not globally. An Arc-specific directive belongs in `~/Infinity/arc/`, not in `~/.claude/CLAUDE.md`.

**Current mistake to fix:** `directive/arc-conventions` was deploying to `~/.claude/CLAUDE.md` (global). It should deploy to `~/Infinity/arc/CLAUDE.md` (project). Fix in registry.

---

## Decision 2: CLAUDE.md is Anthropic-Only

**The fact:** `CLAUDE.md` is Claude Code-specific. Other harnesses have their own directive file names:

| Harness | Directive file |
|---------|---------------|
| claude-code | `CLAUDE.md` + `AGENTS.md` |
| pi | `AGENTS.md` (no CLAUDE.md concept) |
| opencode | `AGENTS.md` |
| cursor | `.cursorrules` |
| copilot | `.github/copilot-instructions.md` |
| windsurf | `.windsurfrules` |
| aider | `CONVENTIONS.md` / `.aider` |
| unknown | user-defined |

**Implication for agent-core:** The harness profile `directives` field is harness-specific. There is no universal directive filename. When the user adds a new harness, they specify what file(s) are the directive target.

---

## Decision 3: Harness Profiles are User-Defined, Not Curated

**The fact:** There are hundreds of harnesses. We know three. We cannot maintain a registry of all of them.

**The approach:**
- Ship with built-in profiles for the three known harnesses (pi, opencode, claude-code)
- Provide a `harness add` command that walks through the mapping questions
- Provide a meta-skill/prompt that guides creating a profile for an unknown harness

**The meta-prompt for new harness onboarding:**
> "I want to add [harness name] to agent-core. Walk me through identifying where each primitive type lives in this harness."

The prompt scans available docs/source, asks the user to confirm paths, and writes the harness block to the registry.

---

## Decision 4: Meta-Prompts as Primitives

**The insight:** The process of creating a new primitive should itself be a primitive — a meta-prompt. One per type.

| Meta-primitive | Purpose |
|----------------|---------|
| `meta/new-skill` | Walk through creating a new skill for global or project scope |
| `meta/new-directive` | Create a new directive with proper scope (global vs project) |
| `meta/new-hook` | Create a hook for a specific lifecycle event |
| `meta/new-harness-profile` | Onboard a new harness into agent-core |
| `meta/audit-primitive` | Review an existing primitive for deprecated refs, stale paths, security |

These live in `~/agent-core/primitives/meta/` and are available as slash commands in any harness.

---

## Decision 5: Primitive Security Scanning

**The threat:** Community-sourced primitives (skills, directives copied from the web) may contain:
- Exfiltration URLs (phone-home on load)
- Prompt injection attacks (override system behavior)
- Malicious instructions disguised as documentation
- Hidden unicode/zero-width characters

**The requirement:** Before any external primitive is added to the store, it should be scanned.

**The approach (v1 — simple):**
`agent-core scan <file>` — reads a primitive file and checks for:
- URLs (flag any URL that isn't a documentation reference)
- Suspicious instruction patterns (`ignore previous`, `disregard`, `act as`, `you are now`)
- Hidden characters (non-printable unicode, zero-width joiners)
- Unusually large files (>50KB for a skill is suspicious)
- Output a clean/suspicious verdict with a diff of flagged content

**The approach (v2):**
- Checksummed allow-list for known-good primitives
- Community verification layer (like npm audit)

**This is a real threat.** Do not skip this. Many "free skills" repos include tracking pixels or subtle instruction overrides.

---

## Decision 6: Global vs Project Registry

**Two registry files, two scopes:**

```
~/.agent-core/registry          ← global: your personal primitives
<project>/.agent-core/registry  ← project: repo-specific primitives
```

When you run `agent-core status` in a project directory:
- Shows global primitives + project primitives
- Project primitives override global ones with the same ID
- `--global` flag to show only global
- `--project` flag to show only project

**The contractor use case:** You give them a project `.agent-core/registry` with the Arc primitives. They don't need your global store. Their global store is their own.

---

## The Directive / CLAUDE.md Mistake — What Happened and Why

When we ran `agent-core sync`, it copied `directive/arc-conventions.md` to `~/.claude/CLAUDE.md` — overwriting 267 lines of global config with 16 lines of Arc-specific rules.

**Root cause:** The registry had `deploy claude-code` which resolved via the harness profile to `directives = ~/.claude/CLAUDE.md`. Correct path, wrong scope. Arc conventions are project-scoped, not global.

**The fix:**
1. Arc-conventions primitive deploys to `~/Infinity/arc/CLAUDE.md` (project) not `~/.claude/CLAUDE.md` (global)
2. The global `CLAUDE.md` is managed by dotfiles, not agent-core
3. Add a scope concept to primitives: `scope: global | project`

**The rule going forward:**
- `~/.claude/CLAUDE.md` — managed by dotfiles, never touched by agent-core
- `~/Infinity/arc/CLAUDE.md` — managed by agent-core Arc collection
- `~/.claude/AGENTS.md` — managed by dotfiles (the shared AGENTS.md)

---

## Decision 7: Harness Scoping Conventions (Stretch Goal)

**The insight:** Each harness has its own rules for how global and project-level primitives interact — precedence, merging, override behavior. This is harness-specific and non-trivial.

**Claude Code's documented dual-scope model:**

| Primitive | Global | Project | Precedence |
|-----------|--------|---------|------------|
| CLAUDE.md | `~/.claude/CLAUDE.md` | `./CLAUDE.md` or `.claude/CLAUDE.md` | Project overrides global |
| Settings | `~/.claude/settings.json` | `.claude/settings.json` + `.claude/settings.local.json` | Project > Global |
| Rules | `~/.claude/rules/*.md` | `.claude/rules/*.md` | Project overrides |
| Agents | `~/.claude/agents/*.md` | `.claude/agents/*.md` | Project overrides |
| Commands | `~/.claude/commands/*.md` | `.claude/commands/*.md` | **Both available** |
| Skills | `~/.claude/skills/` | `.claude/skills/` | **Both available** |
| Hooks | `~/.claude/hooks/` | `.claude/hooks/` | **Both execute** |
| MCP | `~/.claude.json` (user) | `.mcp.json` (project) | Three scopes: local > project > user |

**Key patterns across harnesses:**
- **Override** — project wins, global ignored (directives, settings, rules)
- **Merge/Both** — both apply, no conflict (commands, skills, hooks)
- **Three-way** — local > project > global (MCP in claude-code)

**Implication for harness profiles (stretch goal):**
When profiling a harness, capture not just paths but scoping behavior:

```
harness claude-code
  # ... paths ...
  scope_model  dual                    # global + project
  directives_scope  project-overrides  # project wins
  skills_scope      both-available     # additive
  hooks_scope       both-execute       # additive
  mcp_scope         three-way          # local > project > user
end
```

This tells agent-core: when deploying to a project, which primitives override vs. extend the global ones. Deferred — not blocking v1.

---

## Open Questions (Not Blocking, Just Tracked)

1. **Project registry discovery** — should `agent-core status` auto-detect project registry when run from a project dir? Or always explicit?

2. **Skill search** — "find me a zig skill" — does this search the local store first, then a remote registry, then the web? What's the fallback chain?

3. **Primitive versioning** — when you update a skill, what happens to projects that deployed the old version? Do they get a warning? Auto-update?

4. **The M1 schema dir** — `/Documents/_agents/` — needs an audit pass. Likely contains: deprecated tool refs, stale paths, early-iteration primitives worth salvaging.

---

## Current Priority Queue

```
CRITICAL (do now):
[x] Restore ~/.claude/CLAUDE.md from dotfiles
[ ] Fix arc-conventions registry entry → deploy to project dir, not global
[ ] Sync AGENTS.md → pi and opencode from dotfiles master

HIGH (this session):
[ ] git init ~/agent-core/cli/
[ ] Register real primitives: debug-hypothesis, install skill, hooks
[ ] Separate arc-conventions into project-scoped collection

SOON (next session):
[ ] Build meta/new-harness-profile prompt
[ ] Build agent-core scan command (security scanning)
[ ] M1 audit — extract schema/ dir contents
[ ] Add project-scoped registry support to CLI
```
