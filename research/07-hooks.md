# Primitive 7 — Hooks

> *Deterministic event automation: the zero-hallucination layer.*

---

## What It Is

A **hook** is a deterministic script triggered by a specific event in the agent lifecycle. Hooks run outside the LLM loop — they are pure code, not AI, with no context cost and no probability of hallucination. They are the **automation bedrock** of the agentic system.

The critical distinction: hooks are **not the agent thinking**. They are side-channel automation that fires at defined lifecycle points. When an agent edits a file, a hook can immediately run a linter — without any tokens spent, without asking the model, without any possibility of the model deciding to skip it.

Common names across platforms:
- Hooks — most platforms (Claude Code, Cursor 1.7+)
- Lifecycle hooks — OpenAI Agents SDK
- Event triggers — some platforms
- Middleware — some agent frameworks
- Pre/post processors — generic

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Developer** | Auto-format on edit, run tests on save |
| **Team lead** | Enforce standards deterministically |
| **Security engineer** | Block dangerous commands before execution |
| **Platform builder** | Instrument the agent lifecycle for observability |

---

## Where It Lives

```
project/
  .agent/
    hooks/
      post-file-edit.js       ← fires after any file is written
      pre-shell-exec.js       ← fires before any shell command runs
      post-tool-call.js       ← fires after any tool completes
      session-start.js        ← fires at session initialization
      session-end.js          ← fires at session completion

~/.agent/hooks/               ← global hooks (every project)
```

Hooks are **merged across levels** — global hooks + project hooks both fire. Order is typically: global → project → subdirectory.

---

## When It Fires

**Load point:** Registered at session start; **fired by events** throughout the session.

### Universal lifecycle events

```
session:start          → Before any user interaction
session:end            → After session completes

tool:pre-call          → Before any tool executes
tool:post-call         → After any tool completes
tool:error             → When a tool throws

file:pre-write         → Before writing/editing a file
file:post-write        → After writing/editing a file
file:pre-read          → Before reading a file

shell:pre-exec         → Before running a shell command
shell:post-exec        → After shell command completes
shell:error            → When shell command fails

agent:plan             → When agent produces a plan
agent:pre-act          → Before agent takes an action
agent:post-act         → After agent completes an action

subagent:spawn         → When a subagent is created
subagent:complete      → When a subagent returns
```

---

## Why It Exists

Without hooks:
- Enforcement depends on the model "remembering" to do things
- The model can decide to skip formatting, tests, validation
- No way to intercept and block dangerous operations
- Background automation (logging, telemetry) burns context tokens

With hooks:
- **Determinism** — linting runs *every* time, no exceptions
- **Safety** — dangerous commands can be intercepted and blocked
- **Zero context cost** — automation without any LLM overhead
- **Observability** — instrument the lifecycle without affecting it
- **Separation of concerns** — automation logic lives outside the prompt

**The key insight:** Some things are too important to leave to probabilistic AI. Hooks provide the deterministic enforcement layer that AI cannot provide.

---

## How to Implement

### Basic hook structure (JavaScript)

```javascript
// hooks/post-file-edit.js
export default async function onPostFileEdit(event) {
  const { file, content, tool } = event;
  
  // Only run for TypeScript files
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
  
  try {
    const result = await exec(`npx eslint --fix ${file}`);
    if (result.exitCode !== 0) {
      // Return feedback to agent context
      return {
        feedback: `ESLint found issues in ${file}:\n${result.stderr}`,
        level: "warning"
      };
    }
  } catch (err) {
    console.error(`Hook error: ${err.message}`);
  }
}
```

### Blocking hook (pre-shell-exec)

```javascript
// hooks/pre-shell-exec.js
// This hook intercepts EVERY shell command and classifies risk
export default async function onPreShellExec(event) {
  const { command } = event;
  
  const DANGEROUS_PATTERNS = [
    /DROP\s+TABLE/i,
    /rm\s+-rf\s+\//,
    /truncate/i,
    /DELETE\s+FROM\s+\w+\s*;?\s*$/i,  // DELETE without WHERE
    /format\s+[A-Z]:/i,               // Windows drive format
  ];
  
  const isDangerous = DANGEROUS_PATTERNS.some(p => p.test(command));
  
  if (isDangerous) {
    return {
      block: true,  // Prevent execution
      reason: `Command matches high-risk pattern. Explicit user approval required.`,
      requiresConfirmation: true
    };
  }
  
  // Log all shell commands for audit
  await appendToAuditLog({ command, timestamp: Date.now() });
  
  return { block: false };
}
```

### Observability hook (telemetry)

```javascript
// hooks/post-tool-call.js
export default async function onPostToolCall(event) {
  const { tool, input, output, duration, sessionId } = event;
  
  // Send to telemetry without affecting agent context
  await telemetry.track({
    event: 'agent.tool_call',
    properties: {
      tool: tool.name,
      duration_ms: duration,
      session: sessionId,
      success: !output.error
    }
  });
}
```

### Session lifecycle hooks

```javascript
// hooks/session-start.js
export default async function onSessionStart(event) {
  const { sessionId, projectPath } = event;
  
  // Validate environment before session begins
  const requiredEnvVars = ['DATABASE_URL', 'API_KEY'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    return {
      warning: `Missing environment variables: ${missing.join(', ')}. Some features may not work.`
    };
  }
}
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Hook registration | **Zero** — hooks are not in the context window |
| Hook execution | **Zero context cost** — runs outside LLM loop |
| Feedback injection | **Optional** — hooks can inject feedback into context if needed |
| Overhead | Pure compute — as fast as your script |

This is the **only primitive with true zero context cost**. Hooks run completely outside the model's context window. A complex linting hook that runs 50 rules costs exactly zero tokens.

---

## Hook Design Principles

1. **Fast** — hooks run synchronously in the agent lifecycle; slow hooks block agent progress
2. **Idempotent** — should be safe to run multiple times on the same event
3. **Fail gracefully** — hook errors should not crash the agent session
4. **Minimal side effects** — don't mutate context unless you explicitly need to inject feedback
5. **Single responsibility** — one hook per concern, compose via multiple hooks
6. **Non-blocking where possible** — telemetry hooks should be async fire-and-forget

---

## Cursor's Hook System (2025) — Reference Implementation

Cursor 1.7 introduced hooks that can:
- Intercept shell commands before execution (block or allow)
- Run formatters after file edits
- Inject feedback into the agent context
- Execute arbitrary scripts at lifecycle boundaries

This represents the emerging standard: hooks as **first-class lifecycle citizens**, not afterthoughts.

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Tools** | Hooks fire around tool calls (pre/post) |
| **Rules** | Rules describe policies; hooks enforce them deterministically |
| **Skills** | Hooks can trigger skill loading (e.g., on file type detection) |
| **Directives** | Directives describe hook conventions; hooks implement them |
| **Plugins** | Plugins bundle and distribute hooks |
| **Subagents** | Hooks can fire on subagent spawn/completion |

---

## Research Sources

- [Cursor 1.7 Adds Hooks for Agent Lifecycle Control — InfoQ](https://infoq.com/news/2025/10/cursor-hooks/) — Oct 2025
- [Lifecycle Hooks: Controlling Agent Execution — Agent Factory](https://agentfactory.panaversity.org/docs/Building-Agent-Factories/anthropic-agents-kit-development/lifecycle-hooks) — Apr 2026
- [Agent Architecture: Building AI-Powered Development Harnesses](https://blakecrosley.com/guides/agent-architecture) — Mar 2026 ("22 lifecycle events, each hookable with shell scripts the model cannot skip")
- [OpenAI Agents SDK — Lifecycle](https://openai.github.io/openai-agents-python/ref/lifecycle/) — Dec 2025

---

## Key Takeaway

> Hooks are the **only deterministic primitive** in the stack. Everything else involves the model — which means everything else is probabilistic. Hooks are not. They run. Every time. Without asking. This makes them the right layer for: safety enforcement, code quality automation, observability, and any behavior that must not be skipped.
