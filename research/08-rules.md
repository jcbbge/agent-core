# Primitive 8 — Rules

> *Always-on policies: the enforcement layer that protects the agentic loop from itself.*

---

## What It Is

**Rules** are always-active policies that constrain agent behavior across the entire session. Unlike directives (which provide context and knowledge), rules provide **constraints and enforcement** — they define what the agent *must* and *must not* do, and they are checked at every relevant point in the agentic loop.

Rules are the **safety and compliance layer**. They operationalize concerns like security, risk classification, organizational policy, and ethical boundaries into persistent, session-wide constraints.

Common names across platforms:
- Rules — explicit policies in directive files
- Guardrails — safety/compliance constraints
- Policies — enterprise governance framing
- Constraints — technical framing
- System-level restrictions — provider-level invariants
- Safety policies — RLHF-adjacent framing

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Org admin / platform team** | Enforce cross-team policies |
| **Security engineer** | Prevent dangerous operations |
| **Team lead** | Establish engineering standards that can't be overridden |
| **Developer** | Self-imposed constraints for discipline |
| **Compliance officer** | Regulatory and policy enforcement |

---

## Where It Lives

Rules can live in multiple locations, with different scope:

```
~/.agent/rules.md               ← user-global rules (every session)

project/CLAUDE.md               ← project-level rules (embedded in directives)
project/.agent/rules.md         ← explicit rules file
project/.agent/settings.json    ← machine-readable rule configuration

# Enterprise / managed agents:
org-policy.json                 ← org-wide rules pushed to all agents
```

### Structured rules format (JSON)

```json
{
  "rules": [
    {
      "id": "no-production-mutations",
      "description": "Never run destructive DB operations on production without explicit confirmation",
      "pattern": "DELETE|DROP|TRUNCATE|UPDATE.*production",
      "action": "require_confirmation",
      "severity": "critical"
    },
    {
      "id": "test-before-commit",
      "description": "Always run tests before committing",
      "trigger": "pre-commit",
      "action": "run_tests",
      "severity": "high"
    }
  ]
}
```

---

## When It Fires

**Load point:** Session start (rules are always-on); **checked at each relevant loop phase**.

```
[Session Start]
    → Rules loaded into active constraint set

[During every loop phase]
    → GATHER phase: rules constrain what context is loaded
    → PLAN phase: rules checked against proposed actions
    → ACT phase: rules validated before tool execution
    → VERIFY phase: rules checked against outputs

[Specific triggers]
    → Before shell commands (risk classification)
    → Before file modifications in restricted paths
    → Before network requests to external services
    → Before any destructive operation
```

Rules are checked **continuously** — not just at session start. This is what distinguishes them from directives: directives set context once, rules enforce policy throughout.

---

## Why It Exists

Without rules:
- The agent makes autonomous decisions about risk
- "Use your judgment" is the de facto policy — probabilistic, inconsistent
- No organizational control over what the agent does
- Individual sessions can violate team or org policies
- Catastrophic operations (delete prod DB) possible without guardrails

With rules:
- **Predictability** — agent behavior is bounded by policy
- **Safety** — dangerous operations can't be executed without explicit gates
- **Compliance** — org policies are enforced without relying on model judgment
- **Trust** — stakeholders can trust the agent within defined rule boundaries
- **Auditability** — rule violations can be logged and reviewed

**The key insight:** Rules are where human authority re-enters the agentic loop. Every other primitive delegates to the agent — rules are where the human says "regardless of what the agent thinks, this is the boundary."

---

## How to Implement

### Inline rules in directives

```markdown
# Project Rules

## NEVER Do These Without Explicit User Confirmation
- Run `DROP TABLE` or `TRUNCATE` on any database
- `rm -rf` on anything outside `node_modules/` or `dist/`
- Push to `main` or `production` branches directly
- Modify files in `src/generated/` (auto-generated, will be overwritten)
- Deploy to production environment

## Always Do These
- Run `pnpm test` before suggesting a commit
- Check if a migration is reversible before running it
- Classify shell commands as LOW/MEDIUM/HIGH risk before executing
- Ask before modifying any file outside the current task scope

## Shell Risk Classification
Before running any shell command, classify it:
- **LOW**: read-only operations (ls, cat, grep, git log, git status)
- **MEDIUM**: write operations on dev environment (npm install, pnpm build)
- **HIGH**: anything touching prod, deleting data, or network mutations

Report classification before executing. Ask for confirmation on HIGH.
```

### Programmatic rule enforcement

```typescript
// Rule engine (provider-agnostic pattern)
interface Rule {
  id: string;
  description: string;
  check: (action: AgentAction) => RuleResult;
  severity: 'info' | 'warning' | 'error' | 'blocking';
}

const noProductionMutations: Rule = {
  id: 'no-prod-mutations',
  description: 'Block destructive operations on production without confirmation',
  severity: 'blocking',
  check: (action) => {
    if (action.type !== 'shell') return { pass: true };
    const isDestructive = /DROP|DELETE|TRUNCATE|rm\s+-rf/i.test(action.command);
    const isProduction = /production|prod/i.test(action.command);
    
    if (isDestructive && isProduction) {
      return {
        pass: false,
        reason: 'Destructive operation on production requires explicit confirmation',
        requiresConfirmation: true
      };
    }
    return { pass: true };
  }
};
```

### Layered rule architecture

```
Org-level rules     ← highest authority, can't be overridden
  └── Team rules    ← team-specific additions
       └── Project rules  ← project-specific constraints
            └── User preferences  ← lowest authority
```

**Conflict resolution:** Higher-level rules always win. An org rule blocking production deploys cannot be overridden by a project rule enabling them.

---

## Rules vs. Hooks — The Enforcement Spectrum

| Aspect | Rules | Hooks |
|--------|-------|-------|
| What enforces | The model (AI judgment) | Code (deterministic) |
| Consistency | High but probabilistic | 100% deterministic |
| Flexibility | High (model interprets context) | Low (binary) |
| Use for | Nuanced, context-sensitive policy | Binary, non-negotiable enforcement |
| Example | "Classify shell risk before running" | `if dangerous_pattern: block()` |

**Ideal pattern:** Describe policy as rules (AI layer), implement critical invariants as hooks (deterministic layer).

```
Rule: "Classify shell commands as LOW/MEDIUM/HIGH before executing"
Hook: "Intercept and block commands matching DANGER_PATTERNS regex"
```

The rule handles 95% of cases with nuance. The hook handles the 5% that are non-negotiable.

---

## Guardrail Patterns (2026 Research)

Enterprise AI deployments are converging on layered guardrail systems:

1. **Input guardrails** — what requests the agent will accept
2. **Reasoning guardrails** — how the agent is allowed to plan
3. **Output guardrails** — what outputs are acceptable
4. **Tool guardrails** — which tools can be called under what conditions
5. **Audit guardrails** — what must be logged regardless

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Load timing | Session start |
| Token cost | **Low** — rules should be concise, authoritative statements |
| Checking cost | **Zero** (if hooks enforce) / **Low** (if AI enforces) |
| Best format | Bullet lists, explicit "NEVER/ALWAYS" framing |

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Directives** | Rules often live in directive files — they're a distinct section |
| **Hooks** | Hooks provide deterministic enforcement of rules |
| **Tools** | Rules constrain which tools can be called and how |
| **Plugins** | Safety plugins bundle portable rule sets |
| **Subagents** | Rules apply to subagents (inherited from parent context) |

---

## Research Sources

- [AI Agent Risks & Guardrails: 2026 Enterprise Security Guide](https://atlan.com/know/ai-agent-risks-guardrails/) — Apr 2026
- [AI Agent Guardrails: Production Guide for 2026](https://authoritypartners.com/insights/ai-agent-guardrails-production-guide-for-2026/) — Nov 2025
- [8 Best AI Agent Guardrails Solutions in 2026](https://galileo.ai/blog/best-ai-agent-guardrails-solutions) — Mar 2026
- [AI Agents in 2026: Practical Architecture](https://andriifurmanets.com/blogs/ai-agents-2026-practical-architecture-tools-memory-evals-guardrails) — Jan 2026
- [Agent Architecture: Building AI-Powered Development Harnesses](https://blakecrosley.com/guides/agent-architecture) — Mar 2026

---

## Key Takeaway

> Rules are the **human authority layer** — the point where organizational policy, safety constraints, and non-negotiable invariants re-enter the agentic loop. They distinguish "the agent uses good judgment" from "the agent operates within defined boundaries." In production agentic systems, rules are what make agents trustworthy — not just capable.
