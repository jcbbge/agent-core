# Harness Engineering — The Third Era

> *From prompts to context to environment: the shift that changes everything.*

---

## The Three-Era Model

The practice of working with AI models for development has gone through three distinct paradigm shifts. Understanding where we are in this progression is essential for understanding why the nine primitives exist and why the harness layer is now where the leverage is.

```
2022–2024: PROMPT ENGINEERING
"What do I say to the model to get what I want?"

2025: CONTEXT ENGINEERING
"What information do I put in the context window, when, and at what cost?"

2026+: HARNESS ENGINEERING
"What environment do I build around the model to make it reliable, scalable, and safe?"
```

**Sources:**
- [Why Harness Engineering Replaced Prompting in 2026 — Epsilla](https://www.epsilla.com/blogs/harness-engineering-evolution-prompt-context-autonomous-agents) — Mar 2026
- [From Prompts to Harnesses — Four Years of AI Agentic Patterns](https://bits-bytes-nn.github.io/insights/agentic-ai/2026/04/05/evolution-of-ai-agentic-patterns-en.html) — Apr 2026
- [The Rise of Agentic Harnesses](https://news.agentcommunity.org/issues/2026-01-28-the-rise-of) — Jan 2026

---

## Era 1: Prompt Engineering (2022–2024)

**Core insight:** The model is a text function. The quality of output depends on the quality of input.

**What was optimized:**
- Phrasing of instructions
- Few-shot example selection
- Chain-of-thought formatting
- System prompt wording
- Role framing ("You are a senior engineer...")

**What was built:**
- Prompt libraries
- Few-shot databases
- Prompt testing frameworks
- Template systems

**Why it was insufficient:**
- Prompts have no structure across sessions
- No way to share conventions across team members
- No automation layer
- Context management was entirely manual
- No lifecycle — everything was one-shot

**What was missing:** The nine primitives didn't exist yet.

---

## Era 2: Context Engineering (2025)

**Core insight:** The model is good. The bottleneck is *what you put in front of it*.

**What was optimized:**
- What goes in the context window
- When different content loads (lazy vs. eager)
- Token budget allocation across different content types
- Dynamic context composition
- RAG (Retrieval-Augmented Generation) for knowledge injection

**What was built:**
- Directives (CLAUDE.md, AGENTS.md)
- Skills (lazy-loaded knowledge)
- Structured context loading pipelines
- Vector store integrations
- Token budget managers

**The key paper:** [Agentic Context Engineering (ACE)](https://arxiv.org/abs/2510.04618) — 2025 — formalized context as a first-class engineering discipline.

**What was still missing:**
- Deterministic enforcement (hooks)
- Event-driven automation
- Lifecycle management
- Multi-agent coordination
- Cross-session memory
- Observability

The primitives were emerging, but the **runtime** didn't exist yet.

---

## Era 3: Harness Engineering (2026+)

**Core insight:** The model is largely commoditized. The competitive advantage is the environment it operates in.

**What is being optimized:**
- Lifecycle management (hooks, events)
- Multi-agent orchestration (subagents, teams)
- Safety and guardrails (rules, guardrail pipelines)
- Cross-session persistence (memory, state)
- Observability (traces, telemetry)
- Protocol standardization (MCP, A2A)
- Distribution (plugins, package ecosystems)

**What is being built:**
- Full agent runtimes (not just wrappers around API calls)
- Plugin/extension ecosystems
- Agent-to-agent communication protocols
- Persistent memory architectures
- Evaluator frameworks
- Observability stacks for agents

**The harness is the product.** The model is a component.

---

## What Is a Harness?

A **harness** is the infrastructure layer that makes an agent runtime work reliably, safely, and at scale. It's not the model. It's not the interface. It's the layer in between.

```
┌─────────────────────────────────────────────┐
│                  INTERFACE                   │
│         (IDE, CLI, chat, API)                │
├─────────────────────────────────────────────┤
│                   HARNESS                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Primitives│ │Lifecycle │ │Orchestration │ │
│  │ (the 9) │ │management│ │  (routing,   │ │
│  │         │ │ (hooks,  │ │  subagents)  │ │
│  │         │ │ events)  │ │              │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Memory   │ │ Safety   │ │Observability │ │
│  │ & State  │ │& Rules   │ │  & Traces    │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
├─────────────────────────────────────────────┤
│                    MODEL                     │
│         (LLM API — interchangeable)          │
└─────────────────────────────────────────────┘
```

The harness is what makes model-swapping possible. If your system is built on the harness layer (the nine primitives + emerging primitives), swapping from one model to another is a configuration change, not a rewrite.

---

## The Agentic Loop — Primitives at Precise Points

The gather → plan → act → verify loop is the fundamental unit of agentic execution. Each primitive hooks into this loop at a specific point:

```
┌─────────────────────────────────────────────────────┐
│  SESSION INITIALIZATION                              │
│  → Directives loaded                                 │
│  → Rules established                                 │
│  → Skills indexed                                    │
│  → Tool schemas registered                           │
│  → MCP servers started                               │
│  → Plugins initialized                               │
│  → Hooks registered                                  │
│  → session:start hooks fire                          │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  GATHER                                              │
│  → Skills loaded on relevance                        │
│  → Memory retrieved on query                         │
│  → Context manager adjusts window                    │
│  → User message processed                            │
│  → Slash command injected (if /command)              │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  PLAN                                                │
│  → Planner produces structured plan                  │
│  → Rules checked against proposed actions            │
│  → Router selects appropriate model/agent            │
│  → agent:plan hook fires                             │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  ACT                                                 │
│  → tool:pre-call hook fires                          │
│  → Guardrail pipeline checks action                  │
│  → Tool executes (built-in or MCP)                   │
│  → tool:post-call hook fires                         │
│  → Subagent spawned (if delegating)                  │
│  → file:post-write hook fires (if file modified)     │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  VERIFY                                              │
│  → Evaluator assesses output quality                 │
│  → Rules checked against output                      │
│  → Memory updated with new knowledge                 │
│  → State persisted                                   │
│  → Trace recorded                                    │
└────────────────────────┬────────────────────────────┘
                         ↓
                    [loop or complete]
```

---

## The Key Properties of a Well-Architected Harness

### 1. Model-agnostic
The harness works with any model capable of tool calling. Switching providers is a config change. The nine primitives are the abstraction layer.

### 2. Composable
Primitives compose cleanly. A skill can load a rule, trigger a hook, and invoke an MCP tool — without coupling. The composition is the system.

### 3. Observable
Every lifecycle event is recorded. You can answer: "What happened in that session? Why did the agent make that decision? What tools were called? How long did each step take?"

### 4. Safe by default
Rules and hooks enforce safety without relying on the model's judgment. Dangerous operations are blocked at the harness layer, not the prompt layer.

### 5. Scalable
Subagents and multi-agent patterns let the harness coordinate work that exceeds any single context window. The harness — not the model — is what scales.

---

## For the Builders: Key Decisions

If you're building a harness or agent tooling, these are the decisions that matter most:

### Decision 1: What is your directive strategy?
- Flat vs. hierarchical (global → project → subdir)
- How do you handle conflicts?
- What belongs in directives vs. skills?

### Decision 2: How do you manage context budget?
- What's your token budget strategy?
- What's always-loaded vs. lazy-loaded?
- Do you have active context management?

### Decision 3: What are your lifecycle events?
- What events does your harness expose for hooking?
- Are hooks pre/post/blocking or only observational?
- How do hooks compose (merge, priority, conflict)?

### Decision 4: What is your multi-agent topology?
- Do you support subagents? Agent teams?
- How do agents communicate?
- What is the context inheritance model?

### Decision 5: How do you handle safety?
- Rules only (probabilistic) or hooks (deterministic)?
- What are your non-negotiable invariants?
- How do you handle escalation?

### Decision 6: What is your distribution model?
- Do you have a plugin/extension system?
- Can capabilities be shared?
- How do you handle versioning and compatibility?

---

## The Provider-Agnostic View

The nine primitives appear across all major platforms, though under different names:

| Primitive | Generic | Variant A | Variant B | Variant C |
|-----------|---------|-----------|-----------|-----------|
| Directives | System context files | CLAUDE.md | AGENTS.md | .cursorrules |
| Slash commands | Command shortcuts | /commands | @mentions | Prompt macros |
| Skills | Knowledge modules | Skills | Memories | Custom instructions |
| Tools | Action functions | Tools | Functions | Actions |
| MCP | Protocol integration | MCP servers | Tool servers | API connectors |
| Plugins | Bundled capabilities | Plugins | Extensions | Packages |
| Hooks | Event automation | Hooks | Triggers | Middleware |
| Rules | Policy enforcement | Rules | Guardrails | Policies |
| Subagents | Delegated loops | Subagents | Workers | Handoffs |

**The platform doesn't matter. The primitives do.**

Understanding the primitive gives you the mental model that works across every harness, every model, every provider. When a new platform launches, you already understand its architecture — you just need to find out what each primitive is called there.

---

## What's Coming

The next 12–18 months in harness engineering will likely see:

1. **Primitive standardization** — cross-platform specifications for what directives, hooks, and skills mean, similar to how HTTP standardized web communication
2. **Harness benchmarks** — standardized tests for harness quality (safety, reliability, performance)
3. **Plugin ecosystems** — npm-scale marketplaces for agent capabilities
4. **Memory becoming table stakes** — every serious harness will have cross-session memory
5. **A2A going mainstream** — agent-to-agent communication will be as common as HTTP requests
6. **Edge deployment** — harnesses will run on-device, not just in the cloud
7. **Multi-harness orchestration** — a task that starts in one harness (IDE) can hand off to another (cloud worker) seamlessly

---

## Resources for Harness Engineers

- [Harness Engineering: The Complete Guide — NXCode](https://www.nxcode.io/resources/news/harness-engineering-complete-guide-ai-agent-codex-2026) — Mar 2026
- [From Prompts to Harnesses — Four Years of AI Agentic Patterns](https://bits-bytes-nn.github.io/insights/agentic-ai/2026/04/05/evolution-of-ai-agentic-patterns-en.html) — Apr 2026
- [AI Agent Harness, 3 Principles for Context Engineering](https://hugobowne.substack.com/p/ai-agent-harness-3-principles-for) — Dec 2025
- [Agentic Systems in 2026: From Prompt Engineering to Production Engineering](https://reynders.co/blog/agentic-systems-2026-prompt-engineering-to-production-engineering/) — Mar 2026
- [State of Context Engineering in 2026](https://www.newsletter.swirlai.com/p/state-of-context-engineering-in-2026) — Mar 2026
- [Natural-Language Agent Harnesses — arXiv](https://arxiv.org/pdf/2603.25723v1.pdf) — Mar 2026

---

## Key Takeaway

> Harness engineering is the discipline of building the environment that makes agents reliable. The nine primitives are its vocabulary. The agentic loop is its structure. The shift from "what do I prompt?" to "what do I build?" is the defining transition of 2026 — and the builders who understand the primitives at depth will be the ones who win.
