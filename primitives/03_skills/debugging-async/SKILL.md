# Primitive 3 — Skills

> *On-demand expertise modules: reusable knowledge that loads only when it matters.*

---

## What It Is

A **skill** is a markdown file with optional structured frontmatter that encapsulates domain knowledge, workflow patterns, or process expertise — loaded lazily into the agent context when needed, not always-on like directives.

Skills solve a core tension in agentic systems: *you want the agent to know things, but you can't afford to put everything in context all the time.*

Skills are the answer: **descriptions load at startup** (low token cost), **full content loads on relevance or explicit invocation** (higher cost, but only when needed).

Think of skills as the agent's **area-of-expertise library** — a database of "how we do things" that the agent can pull from on demand.

Common names across platforms:
- Skills (`.agent/skills/`) — file-based
- Memory files — some platforms dynamically create these
- Knowledge base entries — RAG-backed variants
- Custom instructions / personas — scoped versions

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Individual dev** | Personal workflow patterns — "how I debug race conditions" |
| **Team** | Shared expertise — "how we design API endpoints" |
| **Domain expert** | Encoding specialist knowledge — "how our billing system works" |
| **Framework builder** | Reusable patterns — "how to build a new plugin" |

---

## Where It Lives

```
project/
  .agent/
    skills/
      api-design.md         ← API design patterns and conventions
      database-patterns.md  ← Query patterns, migration conventions
      debugging-guide.md    ← Debugging strategies for this stack
      onboarding.md         ← New dev walkthrough
      security-review.md    ← Security checklist and patterns

~/.agent/skills/            ← Personal/global skills
```

---

## When It Fires

**Load point:** Two-phase loading.

```
[Session Start]
    → Scan skills/ directory
    → Load descriptions (frontmatter/first-line) → minimal token cost
    → Index skills for relevance matching

[During Session — trigger conditions]
    → User mentions topic matching skill description
    → User explicitly invokes: /skill api-design
    → Agent determines relevance and loads full content
    → Full skill content injected into context
```

This two-phase approach is what separates skills from directives:
- Directives: **fully loaded at session start** (high upfront cost)
- Skills: **lazily loaded on relevance** (low startup cost, pay-as-you-go)

---

## Why It Exists

Without skills:
- Either everything goes in CLAUDE.md (context bloat, irrelevant noise)
- Or nothing goes in (agent lacks domain expertise)
- No middle ground between "always loaded" and "not loaded"

With skills:
- **Modularity** — encapsulate expertise by domain
- **Token efficiency** — only pay for what you use
- **Portability** — fork a skill, share it, compose them
- **Specialization** — subagents can preload specific skills relevant to their task

**The key insight:** Skills separate the *what the agent knows* from the *when it knows it*. This maps directly onto how human experts work — a database expert doesn't constantly think about database patterns, but can instantly access that knowledge when a DB question arises.

---

## How to Implement

### Skill file structure

```markdown
---
name: api-design
description: REST API design patterns, conventions, and schema standards for this project
triggers:
  - api
  - endpoint
  - route
  - schema
  - openapi
---

# API Design Patterns

## Route Naming Conventions
- Use kebab-case: `/quote-items` not `/quoteItems`
- Resource-based: `/quotes/{id}/items` not `/getQuoteItems`
- Version in path: `/v1/quotes`

## Request/Response Standards
All responses follow this envelope:
\```json
{
  "data": {},
  "meta": { "requestId": "", "timestamp": "" },
  "errors": []
}
\```

## Authentication
Every route except `/health` and `/auth/*` requires `Authorization: Bearer <jwt>`.
Check `src/middleware/auth.ts` for the middleware pattern.

## Validation
Use Zod schemas co-located with route files:
\```typescript
const CreateQuoteSchema = z.object({
  venueId: z.string().uuid(),
  eventDate: z.string().datetime(),
  items: z.array(QuoteItemSchema).min(1)
})
\```

## Error Codes
Reference `src/errors/codes.ts` — never use raw HTTP status codes alone.
```

### Minimal skill with trigger hints

```markdown
---
name: debugging-async
description: Strategies for debugging async/await issues, race conditions, and Promise chains
---

## Async Debugging Playbook

1. **Identify the boundary** — where does async code enter sync code?
2. **Check for missing awaits** — most bugs are `foo()` instead of `await foo()`
3. **Trace the Promise chain** — use `.then().catch()` temporarily to see where it breaks
4. **Check for unhandled rejections** — add a global handler during debug
5. **Use async_hooks** — Node.js native tracing for async context loss
```

### Skill preloading in subagents

Skills become especially powerful when preloaded into subagents for their specific domain:

```
# Main agent spawns security subagent with preloaded skills:
spawn subagent:
  task: "audit authentication flows"
  preload_skills: [security-review, auth-patterns, owasp-checklist]
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Load timing | Two-phase: description at start, full content on relevance |
| Startup cost | **Low** — only descriptions (typically 1–3 lines each) |
| Active cost | **Medium** — full content loaded when triggered |
| Persistence | For the duration of relevance within the session |

---

## Skills vs. Directives — When to Use Each

| Situation | Use |
|-----------|-----|
| Rules that always apply | **Directive** |
| Knowledge needed sometimes | **Skill** |
| Team-wide conventions | **Directive** |
| Domain-specific expertise | **Skill** |
| Security invariants | **Directive** (rules) |
| "How to do X" workflows | **Skill** |

A useful heuristic: **If forgetting it would be a bug, it's a directive. If forgetting it would be a knowledge gap, it's a skill.**

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Directives** | Directives set the "what"; skills provide the "how" |
| **Slash commands** | `/apply-skill <name>` — explicit skill invocation pattern |
| **Subagents** | Preload domain skills into specialist subagents |
| **Plugins** | Skills are bundled in plugin packages for distribution |
| **Hooks** | Hooks can trigger skill loading based on file type |

---

## Research Sources

- [How to build reliable AI workflows with agentic primitives — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-build-reliable-ai-workflows-with-agentic-primitives-and-context-engineering/) — Oct 2025
- [Agentic Context Engineering (ACE)](https://arxiv.org/abs/2510.04618) — Oct 2025
- [State of Context Engineering in 2026](https://www.newsletter.swirlai.com/p/state-of-context-engineering-in-2026) — Mar 2026
- [The AI Agents Stack (2026 Edition)](https://theaiengineer.substack.com/p/the-ai-agents-stack-2026-edition) — Mar 2026

---

## Key Takeaway

> Skills are the **expertise-on-demand layer**. They solve the context budget problem by making knowledge lazy: always discoverable, never always-loaded. The best skill libraries are modular, focused, and match how your domain is actually organized — not how the agent is organized.
