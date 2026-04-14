# Primitive 4 — Tools

> *The hands of the agent: functions it can call to act on the world.*

---

## What It Is

A **tool** is a typed, schema-defined function that the agent can invoke during the agentic loop to take actions beyond generating text. Tools are what transform a language model from a *responder* into an *actor*.

Every agentic system has tools. Without tools, an agent can only talk. With tools, it can:
- Read and write files
- Execute shell commands
- Search the web
- Query databases
- Call APIs
- Spawn subprocesses

Tools are the **ACT** phase of the gather → plan → act → verify loop made concrete.

Common names across platforms:
- Tools / tool calls — universal term
- Functions / function calling — OpenAI lineage
- Actions — some platforms (Zapier, Langchain)
- Skills (confusingly) — AWS Bedrock Agents calls tools "skills"
- Plugins — some platforms conflate tools and plugins

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Agent runtime** | Core engine — the loop calls tools automatically |
| **Builder/developer** | Registers custom tools for project-specific operations |
| **Framework author** | Provides built-in tool sets (file, shell, browser, etc.) |

The user doesn't directly invoke tools — the agent decides when to call them based on the task at hand.

---

## Where It Lives

**Built-in tools** — provided by the harness/runtime:
```
edit-file, read-file, run-shell, search-web, grep, list-dir
```

**Custom tools** — registered by the developer:
```
project/
  .agent/
    tools/
      run-tests.ts         ← custom test runner tool
      query-database.ts    ← project-specific DB query
      deploy-preview.ts    ← preview deployment trigger
      validate-schema.ts   ← schema validation tool
```

**Tool registration** — how they enter the agent's awareness:
```typescript
// TypeScript tool registration pattern (provider-agnostic)
registerTool({
  name: "run-tests",
  description: "Run the project test suite and return results",
  input_schema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Test file pattern to run (optional)"
      },
      watch: {
        type: "boolean",
        description: "Run in watch mode"
      }
    }
  },
  execute: async ({ pattern, watch }) => {
    const cmd = `pnpm test ${pattern ?? ''} ${watch ? '--watch' : ''}`;
    const result = await exec(cmd);
    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.code };
  }
});
```

---

## When It Fires

**Load point:** At runtime, during the ACT phase of the agentic loop.

```
[Agent plans action]
    → Decides tool call is needed
    → Selects tool by name (from registered tools)
    → Validates input against schema
    → Executes tool function
    → Receives tool output
    → Injects output into context
    → Continues reasoning
```

The agent does **not** ask the user before calling tools (unless configured to do so for sensitive operations). Tool calling is autonomous, schema-validated, and feeds results back into the reasoning loop.

---

## Why It Exists

Without tools, an LLM is stateless and read-only:
- It cannot modify files
- It cannot run code
- It cannot verify its own output
- It cannot interact with external systems

Tools provide **agency** — the ability to act, observe, and adapt.

The feedback loop is critical:
```
Act (tool call) → Observe (tool output) → Adapt (updated reasoning)
```

This is what separates a chat interface from an autonomous agent.

---

## How to Implement

### Tool anatomy

Every tool has four components:

1. **Name** — unique identifier the agent uses to invoke it
2. **Description** — natural language explaining what it does and when to use it
3. **Input schema** — JSON Schema defining accepted parameters
4. **Execute function** — the actual implementation

### Built-in tool categories (universal across harnesses)

| Category | Tools | Purpose |
|----------|-------|---------|
| File system | read, write, edit, delete, list | Manipulate project files |
| Shell | run-command, exec | Execute arbitrary shell commands |
| Search | grep, find, semantic-search | Find content in codebase |
| Browser | navigate, screenshot, click | Web interaction |
| Network | http-request, fetch | API calls |
| Process | spawn, kill, monitor | Process management |

### Custom tool patterns

**Domain-specific tool:**
```typescript
// Project-specific: validate that a quote price matches the Galley snapshot
registerTool({
  name: "validate-quote-price",
  description: "Validates that quote line items match the locked price snapshot. Use when modifying quotes.",
  input_schema: {
    type: "object",
    properties: {
      quoteId: { type: "string", description: "Quote UUID" }
    },
    required: ["quoteId"]
  },
  execute: async ({ quoteId }) => {
    const quote = await db.quotes.findById(quoteId);
    const snapshot = await db.priceSnapshots.findByQuote(quoteId);
    const isValid = validatePriceConsistency(quote, snapshot);
    return { valid: isValid, discrepancies: isValid ? [] : findDiscrepancies(quote, snapshot) };
  }
});
```

**Safety-wrapped shell tool:**
```typescript
registerTool({
  name: "run-migration",
  description: "Run database migration. Always requires confirmation for production.",
  input_schema: {
    type: "object",
    properties: {
      environment: { type: "string", enum: ["development", "staging", "production"] },
      migrationFile: { type: "string" }
    },
    required: ["environment", "migrationFile"]
  },
  execute: async ({ environment, migrationFile }) => {
    if (environment === "production") {
      // Hook into rules layer — require human confirmation
      throw new Error("REQUIRES_CONFIRMATION: Running migrations on production requires explicit user approval.");
    }
    return await runMigration(environment, migrationFile);
  }
});
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Schema cost | **Low** — schemas injected into context at session start |
| Execution cost | **Variable** — output size depends on tool result |
| Feedback cost | Tool output enters context window (can be large for shell output) |
| Mitigation | Truncate large outputs; summarize before returning |

**Token management tip:** Tool outputs can bloat context fast. A `grep` result with 500 lines is 500 lines in context. Build tools that summarize or filter their outputs before returning.

---

## The Tool Contract

A good tool follows these principles:

1. **Deterministic** — same inputs → same outputs (or at least predictable)
2. **Focused** — does one thing well
3. **Informative error messages** — the agent needs to understand failures to recover
4. **Output-efficient** — returns what the agent needs, not everything available
5. **Idempotent when possible** — safe to call multiple times
6. **Schema-accurate** — description must match actual behavior

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **MCP Servers** | MCP extends tools to external systems via protocol |
| **Hooks** | Hooks fire on tool events (pre-call, post-call) |
| **Rules** | Rules constrain which tools can be called and when |
| **Skills** | Skills describe how to use tools in domain context |
| **Subagents** | Subagents have their own isolated tool call contexts |

---

## Research Sources

- [Agent Tools & Interoperability with MCP](https://smallake.kr/wp-content/uploads/2025/12/Agent-Tools-Interoperability-with-Model-Context-Protocol-MCP.pdf) — Dec 2025
- [AI Agents in 2026: Practical Architecture](https://andriifurmanets.com/blogs/ai-agents-2026-practical-architecture-tools-memory-evals-guardrails) — Jan 2026
- [The Agentic Developer Stack in 2026](https://dev.to/axiom_agent/the-agentic-developer-stack-in-2026-tools-patterns-and-hard-lessons-59ak) — Mar 2026
- [Design Patterns for Deploying AI Agents with MCP](https://arxiv.org/html/2603.13417) — Apr 2026

---

## Key Takeaway

> Tools are the **agency engine**. They are what make agents agents rather than chatbots. The quality of a harness is largely determined by the quality of its tool set — the descriptions, schemas, safety wrappers, and output shapes. Build tools like you build APIs: intentional contracts, not afterthoughts.
