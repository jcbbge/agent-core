# Primitive 9 — Agents & Subagents

> *Delegated loops: parallelism, isolation, and specialization at agent scale.*

---

## What It Is

**Agents and subagents** are the mechanism by which an agentic system scales beyond a single context window and a single thread of execution. A **main agent** runs a single-threaded agentic loop. A **subagent** is a forked, isolated context that runs its own loop, completes a bounded task, and returns a summary to the parent.

**Agent teams** are coordinated collections of agents that collaborate — with a designated orchestrator or via peer-to-peer messaging — to tackle problems that exceed the capacity of any single agent.

Key concepts:
- **Isolation** — each subagent has its own context window, its own tool calls, its own failures
- **Parallelism** — multiple subagents run concurrently
- **Specialization** — subagents preload skills relevant to their task
- **Summarization** — subagents return summaries, not full transcripts
- **Delegation** — the orchestrator decides what to delegate, how, and when

Common names across platforms:
- Subagents — most CLI harnesses
- Worker agents — LangGraph and similar
- Specialist agents — industry framing
- Handoffs — OpenAI Agents SDK
- Forks — some harnesses

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Orchestrator agent** | Delegates subtasks to specialized subagents |
| **Developer** | Explicitly spawns subagents for parallel work |
| **Framework builder** | Designs multi-agent topologies |
| **Platform** | Coordinates agent teams across distributed runtimes |

---

## Where It Lives

Subagents are runtime constructs — they don't have a fixed filesystem location. They are spawned programmatically or via instruction:

```
# Instruction-based spawning (in prompt/slash command)
"Run this as a subagent: audit the authentication module for security issues.
Preload the security-review skill. Return a structured vulnerability report."

# Programmatic spawning (framework-level)
const securityAgent = await spawnSubagent({
  task: "Audit src/auth/ for security vulnerabilities",
  skills: ["security-review", "owasp-checklist"],
  tools: ["read-file", "grep", "search-deps"],
  maxTurns: 20,
  returnFormat: "structured-report"
});
```

---

## When It Fires

**Load point:** On-demand — when the orchestrator decides to delegate.

```
[Orchestrator receives complex task]
    → Plans decomposition
    → Identifies parallelizable subtasks
    → Spawns subagent(s) with:
        - Bounded task definition
        - Relevant skills preloaded
        - Appropriate tool access
        - Return format specification
    
[Subagent runs independently]
    → Own agentic loop (gather → plan → act → verify)
    → Own context window
    → Own tool call sequence
    → Produces result/summary

[Subagent completes]
    → Returns summary to orchestrator
    → Orchestrator integrates summaries
    → Continues own loop with synthesized information
```

---

## Why It Exists

Without subagents:
- Single context window limits task size
- Sequential execution — no parallelism
- One failure affects the entire task
- Generalist context handles everything — no specialization
- Long tasks corrupt context with irrelevant intermediate steps

With subagents:
- **Scale** — tasks can exceed any single context window
- **Parallelism** — independent subtasks run concurrently
- **Isolation** — subagent failure doesn't corrupt parent context
- **Specialization** — each subagent gets exactly the context it needs
- **Clean summaries** — parent receives distilled results, not raw transcripts

**The key insight:** Subagents aren't just a performance optimization. They're a *quality* improvement. A security audit subagent that only has security knowledge and security tools in its context will produce better results than a generalist agent that also has unrelated business logic and deployment configs in its window.

---

## How to Implement

### Basic subagent invocation pattern

```markdown
# In your orchestrator's planning phase:

For this task, I will spawn three parallel subagents:

1. **Security Subagent** — audit authentication and authorization
   - Skills: security-review, owasp-checklist, auth-patterns
   - Tools: read-file, grep, search-dependencies
   - Return: structured JSON list of vulnerabilities

2. **Performance Subagent** — profile database query patterns
   - Skills: database-patterns, query-optimization
   - Tools: read-file, run-tests, query-explain
   - Return: list of slow queries with optimization suggestions

3. **Architecture Subagent** — review module coupling
   - Skills: architecture-guide, dependency-analysis
   - Tools: read-file, analyze-imports, graph-deps
   - Return: coupling report with refactor recommendations
```

### Subagent orchestration topologies

**Hub-and-spoke (most common):**
```
Orchestrator
├── Security subagent
├── Performance subagent
└── Architecture subagent
      (all run in parallel, report to orchestrator)
```

**Pipeline (sequential handoffs):**
```
Planner → Researcher → Implementer → Reviewer → Verifier
         (each passes context to next)
```

**Hierarchical (nested):**
```
Orchestrator
├── Feature agent
│   ├── Backend subagent
│   └── Frontend subagent
└── QA agent
    ├── Unit test subagent
    └── Integration test subagent
```

**Peer (collaborative):**
```
Agent A ←→ Agent B
    ↕           ↕
(shared state / message bus)
```

### Effective subagent design

```typescript
// Framework-agnostic subagent spawn pattern
interface SubagentConfig {
  task: string;              // Bounded, specific task description
  context?: string;          // Essential context only (not everything)
  skills?: string[];         // Domain-specific skills to preload
  tools?: string[];          // Tool allowlist (principle of least privilege)
  maxTurns?: number;         // Prevent runaway loops
  timeout?: number;          // Wall clock timeout
  returnFormat?: string;     // How to structure the return value
  isolateFrom?: string[];    // What NOT to inherit from parent
}

const vulnAudit = await spawnSubagent({
  task: "Audit src/auth/ for security vulnerabilities. Focus on: SQL injection, auth bypass, token handling, session management.",
  context: "This is an Express.js API. Auth uses JWT. Relevant files are in src/auth/ and src/middleware/.",
  skills: ["security-review", "owasp-checklist"],
  tools: ["read-file", "grep", "list-dir"],  // No shell exec — read-only
  maxTurns: 25,
  timeout: 120_000,  // 2 minutes
  returnFormat: `{
    vulnerabilities: Array<{ severity: 'critical'|'high'|'medium'|'low', location: string, description: string, remediation: string }>,
    summary: string,
    confidence: number
  }`
});
```

---

## Multi-Agent Patterns (2026 Research)

Research from 2026 identifies convergent patterns in multi-agent system design:

### 1. Supervisor pattern
```
Supervisor agent coordinates all work.
Workers report to supervisor.
Supervisor synthesizes and makes final decisions.
Best for: Hierarchical tasks with clear authority structure.
```

### 2. Swarm pattern
```
Agents operate peer-to-peer with shared state.
No central coordinator.
Emergent coordination via shared blackboard.
Best for: Exploration tasks, research, parallel investigation.
```

### 3. Pipeline pattern
```
Agents form an assembly line.
Output of agent N is input to agent N+1.
Specialized transformation at each stage.
Best for: ETL, document processing, structured workflows.
```

### 4. Debate pattern
```
Multiple agents produce solutions independently.
A judge/evaluator agent selects or synthesizes the best.
Best for: High-stakes decisions, code review, design choices.
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Subagent context | **Isolated** — separate from parent window |
| Parent cost | **Low** — only receives summary, not full transcript |
| Skill preload in subagent | **Targeted** — only relevant skills loaded |
| Parallelism benefit | Multiple agents × isolated windows = effective scaling |

**Key economy:** A subagent's entire execution — every tool call, every intermediate result — lives in its isolated context window. The parent pays only for the final summary. This is the economic model that makes large-scale agentic tasks feasible.

---

## Agent Communication Protocols

The emerging A2A (Agent-to-Agent) protocol standardizes how agents communicate:

```
Agent A wants to delegate to Agent B:
1. A queries A2A directory for agents with capability X
2. A sends task request to B via A2A protocol
3. B executes and returns result in standardized format
4. A integrates result and continues

This works across:
- Different runtimes (Python vs TypeScript agents)
- Different models (GPT-4o vs Claude vs Gemini)
- Different hosts (local vs cloud vs on-prem)
```

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Directives** | Subagents can inherit parent directives or have their own |
| **Skills** | Subagents preload domain-specific skills for specialization |
| **Tools** | Subagents have their own tool allowlists (least privilege) |
| **MCP** | Subagents can connect to different MCP servers than parent |
| **Hooks** | Hooks fire on spawn/completion events |
| **Rules** | Rules propagate from parent to child by default |

---

## Research Sources

- [AI Agent Orchestration Patterns — Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) — Feb 2026
- [Spring AI Agentic Patterns: Subagent Orchestration](https://spring.io/blog/2026/01/27/spring-ai-agentic-patterns-4-task-subagents/) — Jan 2026
- [Task-Adaptive Multi-Agent Orchestration](https://arxiv.org/pdf/2602.16873.pdf) — Apr 2026
- [Multi-Agent Systems & AI Orchestration Guide 2026](https://www.codebridge.tech/articles/mastering-multi-agent-orchestration-coordination-is-the-new-scale-frontier) — Feb 2026
- [Unlocking exponential value with AI agent orchestration — Deloitte](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html) — Nov 2025

---

## Key Takeaway

> Agents and subagents are the **scaling primitive**. They break through the context window ceiling, enable specialization, and make parallelism possible. The shift from single-agent to multi-agent is not merely a performance improvement — it's a qualitative change in what agentic systems can accomplish. The best multi-agent designs give each agent exactly the context, skills, and tools it needs for its specific job — and no more.
