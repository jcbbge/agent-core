# Emerging Primitives — Beyond the Nine

> *What the nine don't cover yet, and where the field is going.*

---

## Overview

The nine core primitives form a complete foundation for most agentic systems today. But the field is moving fast — particularly in the harness engineering era of 2026, where the environment (not the model) is becoming the competitive differentiator.

This document covers:
1. **Memory** — persistent knowledge beyond context windows
2. **Evaluators** — automated quality and correctness assessment
3. **Planners** — explicit reasoning structures separate from execution
4. **Routers** — intelligent task routing to agents, models, or tools
5. **State** — structured persistence across sessions and agents
6. **Context managers** — active token budget and window orchestration
7. **Traces / Observability** — first-class execution provenance
8. **Guardrail pipelines** — multi-layer safety beyond single rules

---

## Emerging Primitive 1: Memory

### What it is

**Memory** gives agents knowledge that persists beyond a single context window. It separates what an agent *currently knows* (context window) from what it *can know* (persistent store).

### The four memory types

| Type | What it stores | Scope | Access |
|------|---------------|-------|--------|
| **Episodic** | Past interactions, decisions, outcomes | Per-user or per-project | Semantic search |
| **Semantic** | Domain knowledge, facts, patterns | Global or domain-scoped | Semantic search |
| **Procedural** | How-to workflows, successful strategies | Task-type scoped | Pattern matching |
| **Working** | Current session state, in-progress context | Session-scoped | Direct |

### Why it's becoming a primitive

- Context windows are finite; real-world projects span months
- Agents currently forget between sessions — cold start every time
- "The agent doesn't remember what we decided last week" is a major pain point
- Memory enables *learning* — agents that improve with use

### Implementation patterns

```typescript
// Memory write — after a significant decision
await memory.store({
  type: "procedural",
  content: "When debugging async race conditions in this codebase, always check src/queue/ first — the job processor is the most common source.",
  tags: ["debugging", "async", "queue"],
  projectId: "arc",
  confidence: 0.9
});

// Memory read — at session start or on relevance trigger
const relevant = await memory.search({
  query: "debugging async issues",
  projectId: "arc",
  limit: 5,
  minConfidence: 0.7
});
// Inject relevant memories into context
```

### Memory architecture 2026

```
Working memory     → Context window (current session)
Episodic memory    → Vector store (semantic search over past interactions)
Semantic memory    → Knowledge base (structured domain facts)
Procedural memory  → Skill library (learned workflows — connects to Skills primitive)
```

**Research:** As of 2026, memory is the defining architectural challenge for production agents. Pure context-window "memory" is insufficient for any use case spanning more than a single session.

**Sources:**
- [State of AI Agent Memory 2026 — Mem0](https://mem0.ai/blog/state-of-ai-agent-memory-2026) — Apr 2026
- [Memory Primitives: The Infrastructure Layer](https://primitivesai.substack.com/p/memory-primitives-the-infrastructure) — Mar 2026
- [AI Agent Memory Architectures: From Context Windows to Persistent Knowledge](https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge) — Apr 2026
- [Beyond Context Windows: Building Cognitive Memory for AI Agents](https://qconlondon.com/presentation/mar2026/beyond-context-windows-building-cognitive-memory-ai-agents) — Mar 2026

---

## Emerging Primitive 2: Evaluators

### What it is

An **evaluator** is a component that assesses the quality, correctness, or safety of agent outputs — either inline (during the loop) or as a post-processor. Evaluators can be another LLM, a rule-based system, a test suite, or a human-in-the-loop.

### Why it's becoming a primitive

- Agents produce probabilistic outputs — without evaluation, errors compound
- "Act then verify" is the implicit model; evaluators make verification explicit
- Production systems require automated quality gates, not just human review
- The "debate" multi-agent pattern (multiple agents + evaluator) consistently outperforms single agents

### Evaluator patterns

```
Output ──→ Evaluator ──→ Score/Verdict
                  ↓
           [Pass] Continue
           [Fail] Retry with feedback
           [Uncertain] Human review
```

**Types:**
1. **Self-evaluation** — the same model re-checks its own output (cheap, limited)
2. **Cross-evaluation** — a different model/agent evaluates (more reliable)
3. **Rule-based** — deterministic checks (test suite, schema validation, linters)
4. **Human-in-the-loop** — escalate uncertain cases to humans
5. **Statistical** — track output distributions over time

### Implementation pattern

```typescript
// Evaluator as a first-class construct
const evaluator = createEvaluator({
  name: "code-quality-evaluator",
  criteria: [
    { name: "type-safety", weight: 0.3, check: runTypeCheck },
    { name: "test-coverage", weight: 0.3, check: runCoverage },
    { name: "linting", weight: 0.2, check: runLint },
    { name: "conventions", weight: 0.2, check: checkConventions }
  ],
  threshold: 0.8,  // 80% weighted score to pass
  onFail: "retry_with_feedback",
  maxRetries: 3
});

// Inline in agentic loop
const result = await agent.run(task, { evaluator });
```

**Sources:**
- [AI Agents in 2026: Practical Architecture — Tools, Memory, Evals, Guardrails](https://andriifurmanets.com/blogs/ai-agents-2026-practical-architecture-tools-memory-evals-guardrails) — Jan 2026
- [Responsible AI: Evaluation](https://vikasgoyal.github.io/industries/agentic/agentic-ai-2026-04-01.html) — Apr 2026

---

## Emerging Primitive 3: Planners

### What it is

A **planner** is an explicit reasoning step that occurs before execution — producing a structured plan that the agent (or a separate executor) then follows. This separates the cognitive work of *figuring out what to do* from the mechanical work of *doing it*.

### Why it's becoming a primitive

- Direct act → verify loops produce lower quality on complex tasks
- Explicit plans are auditable, modifiable, and can be validated before execution
- "Think before acting" structures produce measurably better outcomes
- Separating planner and executor enables plan review by humans or other agents

### Planner patterns

```
Task Description
      ↓
[Planner] → Structured Plan
      ↓
[Plan Validator] → Approved/Modified Plan
      ↓
[Executor] → Follows plan step by step
      ↓
[Evaluator] → Verifies result against plan
```

**Plan formats:**
```json
{
  "task": "Refactor authentication to support OAuth",
  "steps": [
    { "id": 1, "action": "Audit current auth implementation", "files": ["src/auth/"], "reversible": true },
    { "id": 2, "action": "Create OAuth provider abstraction", "files": ["src/auth/providers/"], "reversible": true },
    { "id": 3, "action": "Implement Google OAuth provider", "dependsOn": [2], "reversible": true },
    { "id": 4, "action": "Migrate existing sessions", "files": ["src/db/migrations/"], "reversible": false, "requiresConfirmation": true }
  ],
  "risks": ["Session data migration is irreversible"],
  "estimatedComplexity": "L",
  "humanCheckpoints": [4]
}
```

---

## Emerging Primitive 4: Routers

### What it is

A **router** is a component that directs tasks, queries, or actions to the most appropriate destination — the right model, the right agent, the right tool, or the right MCP server — based on task characteristics.

### Why it's becoming a primitive

- Different models/agents have different strengths (coding vs. analysis vs. writing)
- Cost optimization: use smaller/cheaper models for simple tasks
- Latency optimization: route to fastest appropriate model
- Multi-provider deployments need intelligent dispatch

### Router patterns

```typescript
// Model router — select model based on task type
const router = createModelRouter({
  routes: [
    { match: { type: "code-generation", complexity: "high" }, model: "claude-3-7-sonnet" },
    { match: { type: "code-generation", complexity: "low" }, model: "claude-3-5-haiku" },
    { match: { type: "documentation" }, model: "gpt-4o-mini" },
    { match: { type: "security-audit" }, model: "claude-3-7-sonnet" },
    { default: true, model: "claude-3-5-haiku" }
  ]
});

// Agent router — delegate to specialist agent
const agentRouter = createAgentRouter({
  agents: {
    "security": securityAgent,
    "database": databaseAgent,
    "frontend": frontendAgent
  },
  classify: async (task) => {
    // Use a fast classifier to determine agent assignment
    return await classifier.predict(task);
  }
});
```

**Sources:**
- [Task-Adaptive Multi-Agent Orchestration](https://arxiv.org/pdf/2602.16873.pdf) — Apr 2026
- [Agentic AI Intelligence Report](https://vikasgoyal.github.io/industries/agentic/agentic-ai-2026-03-18.html) — Mar 2026

---

## Emerging Primitive 5: State

### What it is

**State** is structured data that persists across turns within a session, across sessions, or across agents in a multi-agent system. Unlike memory (semantic, searchable), state is structured and directly addressable — it's the "database" of the agentic system.

### Why it's becoming a primitive

- Complex workflows have intermediate results that need to persist
- Multi-agent systems need a shared data layer
- "Where did we get to?" is a fundamental resumability concern
- Stateful agents can be paused, resumed, and recovered

### State patterns

```typescript
// Session state — persists across turns
const state = createSessionState({
  schema: {
    currentTask: z.string(),
    completedSteps: z.array(z.string()),
    pendingDecisions: z.array(z.object({
      question: z.string(),
      options: z.array(z.string()),
      requiredBy: z.string()
    })),
    artifacts: z.record(z.string(), z.any())
  }
});

// Shared state across agents (blackboard pattern)
const sharedState = createSharedState({
  scope: "project",
  agents: ["orchestrator", "security-agent", "perf-agent"]
});
```

**Sources:**
- [The AI Agents Stack (2026 Edition)](https://theaiengineer.substack.com/p/the-ai-agents-stack-2026-edition) — Mar 2026
- [Agentic AI Frameworks: Top 8 Options in 2026](https://www.instaclustr.com/education/agentic-ai/agentic-ai-frameworks-top-10-options-in-2026/) — Mar 2026

---

## Emerging Primitive 6: Context Managers

### What it is

A **context manager** actively manages the contents of the agent's context window — deciding what to include, what to compress, what to evict, and what to retrieve — to keep the context window high-signal within token budget constraints.

### Why it's becoming a primitive

- Context windows are large but finite — and cost money per token
- Long sessions develop "context rot" — irrelevant history degrades performance
- Different phases of work need different context contents
- Dynamic context management can 10x effective context capacity

### Context management patterns

```typescript
// Active context management
const contextManager = createContextManager({
  budgetTokens: 80_000,
  strategies: {
    compression: "summarize-old-turns",  // Compress early turns
    eviction: "recency-weighted",        // Keep recent, evict stale
    retrieval: "relevance-triggered",    // Fetch memory on demand
    pinned: ["directives", "current-task-plan"]  // Never evict
  },
  onBudgetWarning: (remaining) => {
    // Proactively summarize when approaching limit
    return summarizeRecentHistory();
  }
});
```

**Sources:**
- [State of Context Engineering in 2026](https://www.newsletter.swirlai.com/p/state-of-context-engineering-in-2026) — Mar 2026
- [Context Engineering for AI Agents: Token Economics](https://www.getmaxim.ai/articles/context-engineering-for-ai-agents-production-optimization-strategies/) — Oct 2025

---

## Emerging Primitive 7: Traces / Observability

### What it is

**Traces** are structured records of everything that happens in the agentic loop — tool calls, model invocations, context injections, decision points, errors — stored externally and queryable after the fact. Observability is what makes agentic systems debuggable and auditable.

### Why it's becoming a primitive

- Agentic systems are hard to debug without execution provenance
- Production systems require audit trails for compliance
- Performance profiling requires time-series data across runs
- Multi-agent systems have complex causality that needs tracing

### Trace structure

```typescript
interface AgentTrace {
  sessionId: string;
  taskId: string;
  timestamp: number;
  events: Array<{
    type: 'tool_call' | 'model_invocation' | 'hook_fire' | 'subagent_spawn' | 'decision';
    timestamp: number;
    duration_ms: number;
    input: unknown;
    output: unknown;
    tokens?: { input: number; output: number; };
    error?: string;
    parentEventId?: string;  // For causality tracking
  }>;
  summary: {
    total_turns: number;
    total_tokens: number;
    total_tool_calls: number;
    success: boolean;
    error?: string;
  };
}
```

**Sources:**
- [Harness Engineering: The Complete Guide](https://www.nxcode.io/resources/news/harness-engineering-complete-guide-ai-agent-codex-2026) — Mar 2026
- [Agent Architecture: Building AI-Powered Development Harnesses](https://blakecrosley.com/guides/agent-architecture) — Mar 2026

---

## Emerging Primitive 8: Guardrail Pipelines

### What it is

A **guardrail pipeline** is a multi-stage safety system that intercepts agent inputs and outputs at multiple points — not a single rule file, but an active, layered checking architecture with separate input guardrails, output guardrails, and real-time monitoring.

### Why it's becoming a primitive

- Single rule files are insufficient for enterprise safety requirements
- Multi-layer defense: no single check is 100% reliable
- Different stages need different types of checks
- Regulatory compliance requires auditable, systematic safety infrastructure

### Pipeline architecture

```
Input → [PII detector] → [Intent classifier] → [Policy checker]
                                                        ↓
                                                 Agent processes
                                                        ↓
Output → [Hallucination checker] → [Safety scorer] → [Output filter]
              ↓
         [Audit logger] → Compliance store
```

**Sources:**
- [AI Agent Guardrails: Production Guide for 2026](https://authoritypartners.com/insights/ai-agent-guardrails-production-guide-for-2026/) — Nov 2025
- [8 Best AI Agent Guardrails Solutions in 2026](https://galileo.ai/blog/best-ai-agent-guardrails-solutions) — Mar 2026

---

## Summary Table — Nine + Eight

| # | Primitive | Type | Load Point | Context Cost |
|---|-----------|------|------------|-------------|
| 1 | Directives | Context | Session start | High |
| 2 | Slash Commands | Interface | On-demand | Zero until invoked |
| 3 | Skills | Knowledge | Lazy / on-relevance | Low-Medium |
| 4 | Tools | Execution | Schema at start, call at runtime | Low-Variable |
| 5 | MCP Servers | Integration | Schema at start, call at runtime | Low-Variable |
| 6 | Plugins | Distribution | Session start | Bundled |
| 7 | Hooks | Automation | Event-driven | Zero |
| 8 | Rules | Policy | Session start | Low |
| 9 | Agents/Subagents | Scaling | On-demand | Isolated |
| 10 | **Memory** | **Persistence** | **On-retrieval** | **Low (retrieved)** |
| 11 | **Evaluators** | **Quality** | **Post-execution** | **Low-Medium** |
| 12 | **Planners** | **Reasoning** | **Pre-execution** | **Medium** |
| 13 | **Routers** | **Dispatch** | **Per-task** | **Near-zero** |
| 14 | **State** | **Data** | **Always** | **Near-zero (external)** |
| 15 | **Context Managers** | **Optimization** | **Active** | **Reduces cost** |
| 16 | **Traces** | **Observability** | **Always** | **Zero (external)** |
| 17 | **Guardrail Pipelines** | **Safety** | **Always** | **Low** |

---

## Where This Is Going

The convergence point in 2026 is **harness engineering** — the recognition that the model is becoming commoditized, and the competitive advantage lies in the architecture that surrounds it:

1. **Memory becomes table stakes** — agents without cross-session memory will be uncompetitive for serious use cases
2. **Evaluation becomes automated** — human review of every output doesn't scale; automated evaluators become required
3. **Protocols standardize** — MCP, A2A, and emerging standards will make primitives portable across every harness
4. **Harnesses become runtimes** — the line between "IDE plugin" and "agent runtime" will disappear; harnesses will have proper process models, scheduling, and resource management
5. **Observability becomes non-negotiable** — enterprises won't deploy agents without full trace visibility
6. **Composition over configuration** — building agent capabilities by composing primitives will replace per-project manual configuration

The nine primitives this document started with are the **current stable layer** — what every serious agent harness implements today. The eight emerging primitives are the **next stable layer** — what the next generation of harnesses will implement as table stakes.
