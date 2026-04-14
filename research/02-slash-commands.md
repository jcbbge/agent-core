# Primitive 2 — Slash Commands

> *On-demand prompt shortcuts: the user's way to drive the agent with precision.*

---

## What It Is

A **slash command** is a user-invoked shortcut that injects a predefined markdown prompt as a user message into the current agent context. The user types `/something` — the agent receives the full content of that command as if they'd written it out.

Slash commands are **manual triggers**. Unlike directives (always-on) or hooks (event-driven), slash commands require deliberate user invocation. They are the **ergonomic layer** between human intent and agentic action.

Common names across platforms:
- `/commands` — file-based slash command definitions
- Custom instructions / command palette — IDE equivalents
- Prompt shortcuts — some platforms call them this
- "Macros" — in older tooling

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Developer** | `/review` — run code review on current file |
| **Developer** | `/deploy` — trigger deploy checklist |
| **Team lead** | `/standup` — generate a standup report from recent commits |
| **QA engineer** | `/test-plan` — generate test plan for current diff |
| **Any user** | Quick, repeatable, complex prompts without retyping |

---

## Where It Lives

```
project/
  .agent/
    commands/
      review.md       ← /review
      deploy.md       ← /deploy
      test-plan.md    ← /test-plan
      standup.md      ← /standup

~/.agent/commands/    ← global commands (available in every project)
```

Slash commands are typically discoverable:
- Type `/` → see list of available commands
- Tab-complete → auto-suggest matching commands

---

## When It Fires

**Load point:** On-demand, triggered by the user typing `/command-name`.

```
[User types "/review"]
    → Harness looks up commands/review.md
    → Injects content as user message
    → Agent processes in current context
    → Returns response
```

Key distinction from directives:
- Directives: **always present** (background)
- Slash commands: **on-demand** (foreground, user-driven)

---

## Why It Exists

Without slash commands:
- Repeatable complex prompts must be retyped each time
- Institutional prompt knowledge lives in people's heads or notes
- No consistent way to trigger workflows across team members

With slash commands:
- **Repeatability** — same prompt, same result, every time
- **Discoverability** — team can see available commands via `/`
- **Standardization** — encode team best practices as commands
- **Efficiency** — complex 20-line prompts become `/review`

**The key distinction from tools:** Slash commands don't execute code. They inject *prompts*. The agent then decides what to do with that prompt, including calling tools. This makes slash commands the **human-layer interface** to the primitive stack.

---

## How to Implement

### Basic command file structure

```markdown
<!-- commands/review.md -->
Perform a thorough code review of the most recently modified files.

Check for:
1. Logic errors and edge cases
2. TypeScript type safety — no `any`, no unsafe casts
3. Missing error handling
4. Performance concerns (N+1 queries, unnecessary re-renders)
5. Security issues (injection, auth bypass, data exposure)

Format your response as:
- **Critical** — must fix before merge
- **Warning** — should fix, explain trade-off if deferring
- **Suggestion** — optional improvement

Reference the project conventions in CLAUDE.md.
```

### Command with arguments (advanced)

Some platforms support `$ARGUMENTS` placeholder:

```markdown
<!-- commands/explain.md -->
Explain the following in plain English, suitable for a junior developer:

$ARGUMENTS

Include:
- What it does
- Why it exists
- How it connects to the rest of the system
- A simple analogy if helpful
```

Usage: `/explain the useOptimisticUpdate hook in src/hooks/`

### Parameterized workflow command

```markdown
<!-- commands/ticket.md -->
Create a detailed implementation plan for the following feature request:

$ARGUMENTS

Output format:
1. **Scope** — what's in, what's out
2. **Files to modify** — with rationale
3. **New files needed** — with proposed structure
4. **Edge cases** — enumerate them
5. **Testing strategy** — unit, integration, e2e
6. **Estimated complexity** — S/M/L/XL with justification
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Load timing | On-demand (user invocation) |
| Token cost | **On-demand** — only when invoked |
| Persistence | Single turn (injected once) |
| Overhead | Near-zero when not invoked |

This is slash commands' **key advantage**: they contribute zero context cost until invoked. You can have 50 slash commands defined and pay for none of them until you use them.

---

## Debate: Are Slash Commands an Anti-Pattern?

Research from late 2025 raises a valid critique: slash commands can **fragment attention** if they trigger context switches the agent can't gracefully handle. The argument is:

- Slash commands that are too broad ("do everything") cause inconsistent results
- Better to use slash commands for **focused, bounded operations** than open-ended ones
- The more specific the command, the more reliable the outcome

**Best practice:** Slash commands should be scoped. `/review-auth-logic` > `/review`. The specificity makes results predictable.

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Tools** | Slash commands trigger the agent, which then calls tools |
| **Skills** | `/invoke-skill` pattern — commands that load specific skills |
| **Directives** | Commands inherit the directive context — they don't bypass it |
| **Agents/Subagents** | Commands can spawn subagents ("run this as a subagent") |
| **Hooks** | Commands are user-triggered; hooks are event-triggered — complementary |

---

## Research Sources

- [Slash Commands vs Subagents: How to Keep AI Tools Focused](https://jxnl.co/writing/2025/08/29/context-engineering-slash-commands-subagents/) — Jason Liu, Aug 2025
- [Custom Slash Commands — Agent Factory](https://agentfactory.panaversity.org/docs/Building-Custom-Agents/anthropic-agents-kit-development/custom-slash-commands) — Feb 2026
- [The Usen't Case for AI Coding Agent Slash Commands](https://blog.cani.ne.jp/2025/11/24/usent-case-for-ai-coding-agent-slash-commands.html) — Nov 2025 (critique perspective)
- [How To Create Specific Agent Commands](https://www.youtube.com/watch?v=pVk1-vqGMJA) — Oct 2025

---

## Key Takeaway

> Slash commands are the **precision layer** of the human–agent interface. They encode institutional prompt knowledge as repeatable, discoverable, zero-cost-until-invoked shortcuts. The best slash commands are narrow and specific — not "do a review" but "check auth logic for OWASP Top 10."
