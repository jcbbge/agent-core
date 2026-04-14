# Primitive 1 — Directives

> *Always-on context injection: the memory your agent has before you say a word.*

---

## What It Is

A **directive** is a persistent, hierarchically loaded instruction file — typically written in Markdown — that is injected into every agent session automatically. It requires no user invocation. It's always there.

Directives are the **long-term memory** of a project's conventions. They answer the question: *"What should this agent always know about this codebase, team, or workflow?"*

Common names across platforms:
- `CLAUDE.md` / `AGENTS.md` — file-based directives
- System prompts — provider-level always-on instructions
- `.cursorrules`, `.github/copilot-instructions.md` — IDE-specific variants
- "Memory files" — some platforms persist these dynamically

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Individual developer** | Personal preferences, shortcuts, "how I work" |
| **Team** | Shared conventions — package manager, code style, forbidden patterns |
| **Org / platform** | Cross-repo standards, security policies, deployment rules |

Directives solve the **cold start problem**: every session begins with zero context. Without directives, you re-explain the same things every time.

---

## Where It Lives

```
/ (repo root)
  CLAUDE.md          ← project-wide directive
  AGENTS.md          ← subagent configuration and defaults
  src/
    CLAUDE.md        ← subdirectory override (more specific wins)
  .github/
    copilot-instructions.md  ← GitHub Copilot equivalent
```

Directives can be layered:
- **Global** — user-level (`~/.agent/directives.md`), loaded in every session
- **Project root** — applies to all sessions in that repo
- **Subdirectory** — overrides parent for more specific contexts
- **Dynamic** — some runtimes allow runtime-injected "memory" that behaves as directives

**Resolution rule:** More specific (deeper) directives win over broader ones. Conflicts are resolved by specificity, not recency.

---

## When It Fires

**Load point:** Session start, before any user message is processed.

This is critical: directives shape the model's understanding of the entire session. They are loaded once (at session init), not per-message.

```
[Session Start]
    → Load global directives
    → Load project-root directives
    → Load subdirectory directives (if applicable)
    → Reconcile conflicts (specificity wins)
    → Inject into context window
    → [User sends first message]
```

---

## Why It Exists

Without directives:
- Every session starts cold — no project knowledge
- You repeat "use pnpm, not npm" fifty times
- Different team members get different behavior
- The agent makes incorrect assumptions about the stack

With directives:
- **Consistency** — same rules every session, every developer
- **Efficiency** — no re-explaining conventions
- **Enforceability** — team-wide standards become persistent
- **Specialization** — subdir directives let monorepos have per-package rules

**The key insight:** Directives are not about prompting — they are about *environment setup*. They turn a generic model into a project-aware collaborator.

---

## How to Implement

### Minimal example

```markdown
# Project Directives

## Stack
- Runtime: Node.js 22 with TypeScript
- Package manager: pnpm (never npm or yarn)
- Database: PostgreSQL with Drizzle ORM
- Testing: Vitest (never Jest)

## Code Conventions
- Prefer `const` over `let`; avoid `var`
- All async functions must handle errors explicitly
- Never use `any` type — use `unknown` and narrow

## Workflow
- Run `pnpm test` before every commit
- Never modify files in `src/generated/` — they are auto-generated
- Ask before running any destructive database operation
```

### Structural patterns

**Role framing:**
```markdown
You are a senior engineer on the Arc platform — an event sales system.
You understand the domain: quotes, contracts, venues, pricing.
```

**Explicit prohibitions:**
```markdown
NEVER:
- Commit without running tests
- Use `console.log` in production code (use the logger)
- Import from `../generated/` — use the public API
```

**Conditional rules:**
```markdown
## When working in /packages/api
Always check OpenAPI spec compatibility before changing route signatures.
```

### Multi-level directive strategy

```
~/.agent/CLAUDE.md          → Personal preferences (editor, style, language)
~/project/CLAUDE.md         → Project stack, architecture, conventions
~/project/src/api/CLAUDE.md → API-layer-specific rules
~/project/src/db/CLAUDE.md  → DB-layer-specific rules
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Load timing | Session start (once) |
| Token cost | **High** — full content injected at session start |
| Persistence | Entire session |
| Mitigation | Keep directives focused; avoid prose bloat; use bullet lists |

**Token budget tip:** Directives compete with your actual work for context space. A 4,000-token CLAUDE.md is 4,000 fewer tokens for code, output, and reasoning. Aim for signal density — short, authoritative rules beat verbose explanations.

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Rules** | Directives provide the "what"; Rules provide the "enforce" |
| **Skills** | Directives set context; Skills inject expertise on-demand |
| **Hooks** | Directives describe conventions; Hooks enforce them deterministically |
| **Subagents** | Parent directives can define subagent default behavior |
| **Plugins** | Plugins can include directives as part of their bundle |

---

## Research Sources

- [On the Impact of AGENTS.md Files on AI Coding Agent Efficiency](https://arxiv.org/html/2601.20404v1) — arxiv 2026
- [CLAUDE.md and AGENTS.md: The Configuration Layer](https://tianpan.co/blog/2026-02-25-claude-md-agents-md-ai-coding-agent-instruction-files) — Feb 2026
- [How to Build Your AGENTS.md (2026)](https://www.augmentcode.com/guides/how-to-build-agents-md) — Augment Code, Mar 2026
- [Best practices for agentic coding](https://www.rivista.ai/wp-content/uploads/2025/05/1746131911005.pdf) — Apr 2026
- [12 Production AI Agent Primitives](https://www.mindstudio.ai/blog/12-production-ai-agent-primitives-claude-code-leak) — MindStudio, Apr 2026

---

## Key Takeaway

> Directives are the **foundation layer** of the primitive stack. Everything else runs on top of them. If you only implement one primitive, implement this one. It converts a generic AI session into a project-aware, convention-respecting collaborator — automatically, every time.
