# Agentic Primitives — Research Reference
*Synthesized from parallel research agents — 2026-03-07*
*Provider/model/harness agnostic. Applies to Claude Code, OpenCode, Augment, Droid, Goose, Gemini CLI, and any future harness.*

---

## The Nine Primitives

| Primitive | What it is | When it activates |
|-----------|-----------|------------------|
| **Always-loaded instructions** | Global rules file, loaded every session | Unconditional — costs context budget regardless |
| **Rules** | Modular instruction files, scoped by path | When file path matches scope pattern |
| **Skills** | On-demand instruction packs | Model detects relevance, or explicit invocation |
| **Commands** | Slash-command prompt shortcuts | User explicitly invokes `/command-name` |
| **Custom Tools** | LLM-callable functions | Model decides to call them mid-task |
| **Hooks** | Event-driven shell scripts | Lifecycle events (session start, tool use, etc.) |
| **MCP Servers** | External tool servers (JSON-RPC) | Always available as tools once registered |
| **Subagents** | Delegated focused sub-instances | Model spawns them or explicit delegation |
| **Plugins** | Distributable bundles of any/all above | Install once, components activate per own rules |

---

## 1. Always-Loaded Instructions (AGENTS.md / CLAUDE.md / system prompt)

### What it is
A global instruction file loaded unconditionally at the start of every session. Every byte costs context budget regardless of what the session is doing. This is the highest-cost primitive per byte.

### The core constraint
**Context window budget is finite and non-negotiable.** Research across harnesses consistently shows:
- 150–200 lines is the practical max before instruction adherence degrades
- Always-loaded content competes directly with working memory, codebase context, and conversation history
- Bloat in global instructions is a tax on every session, including sessions that don't need it

### What belongs here
Only content that is universally true across every session, every project, every task:
- Identity/instance protocol (who the agent is, bootstrap sequence)
- Universal behavioral rules (autonomy, response mode, communication style)
- Cross-project conventions that never vary (git rules, code style fundamentals)
- Infrastructure bootstrapping (memory system initialization)

### What does NOT belong here
- API references or documentation → move to a skill with `disable-model-invocation: true`
- Project-specific context (stack, domain, production paths) → move to project-level instructions
- Rules that only apply sometimes → move to path-scoped rules or skills
- Anything that starts with "when working on X..." → it's conditional, not global

### Rule: If it only matters sometimes → not a global rule. If it only matters for one project → not a global rule.

### Target: 80–100 lines covering identity + bootstrap + universal behavior only.

---

## 2. Rules (Modular Always-Loaded, Path-Scoped)

### What it is
Discrete instruction files that load automatically based on path matching. The escape valve for the global instruction file — allows granular, context-sensitive loading without bloating the global layer.

### When to use
- Language or framework conventions that only apply to some projects (`rules/solidjs.md` loads when editing `.jsx`/`.tsx` files in SolidJS projects)
- Security constraints for specific paths (`rules/production.md` loads only in `Infinity/bento/`)
- Team conventions that vary by project

### Implementation patterns

**Path-scoped rule (loads only in matching directory):**
```markdown
---
globs: ["Infinity/bento/**/*", "Infinity/bento-build/**/*"]
---
# Bento Production Rules
- Stack: Laravel + Vue 3 + PostgreSQL + HubSpot CRM + Forte payment gateway
- `main` branch is production — confirm before any push or destructive operation
- Key domain: inventory groups, payment schedules, user-vendor mapping
```

**Language-scoped rule:**
```markdown
---
globs: ["**/*.jsx", "**/*.tsx", "**/solid*/**/*"]
---
# SolidJS Rules
- Components execute ONCE — not React. Never destructure props.
- Fine-grained reactivity via signals, effects, memos. Not useState.
- Access signals in reactive scope (JSX, createEffect, createMemo) only.
```

**Security rule:**
```markdown
---
globs: ["**/mcp*/**/*", "**/daemon*/**/*", "**/.plist"]
---
# Infrastructure Rules
- Read brain-infrastructure.md before touching MCP servers, SurrealDB, launchd plists, or port allocation.
- Do not create duplicate servers or reuse allocated ports.
```

### Key principle
Rules load silently based on file context — the model doesn't need to know they exist. They're zero-friction. A rule that loads in 3% of sessions costs nothing the other 97% of the time.

### Target structure
```
primitives/rules/
├── bento.md          # globs: Infinity/bento/**/*
├── solidjs.md        # globs: **/*.jsx, **/*.tsx
├── infrastructure.md # globs: **/mcp*/**, **/.plist
├── git.md            # universal git conventions (could be global)
└── security.md       # security constraints
```

---

## 3. Skills (On-Demand Instruction Packs)

### What it is
A `SKILL.md` file teaching the model a specialized procedure, workflow, or domain knowledge. The key distinction from always-loaded instructions: **skills are loaded on demand, not unconditionally**.

The model reads skill descriptions and decides when to load them. Good descriptions = automatic invocation. Bad descriptions = the skill might as well not exist.

### Anatomy

```markdown
---
name: skill-name
description: Precise trigger description. What domain this covers, when to use it, key triggers. The model reads this to decide whether to load the skill.
disable-model-invocation: true  # Optional: only load when user explicitly invokes
---

# Skill content here
Detailed instructions, patterns, reference material.
```

### `disable-model-invocation: true`
The most important but underused flag. When set, the model will NEVER auto-invoke this skill — it only loads when explicitly called by the user (`/skill-name`). Use this for:
- Skills that touch production systems (the model deciding autonomously to run a DB query is dangerous)
- Skills that take over the session mode (you decide when to activate them)
- Reference documentation (Scratchpad API reference, etc.)

### The description problem
Most broken skills have descriptions like "See command definition below" — invisible to the model. The description is the entire discovery surface. It must answer:
1. What domain/task does this cover?
2. What are the trigger phrases or contexts?
3. What does the model gain by loading it?

**Bad:** `description: See command definition below`
**Bad:** `description: Building with SolidJS`
**Good:** `description: Build SolidJS applications using fine-grained reactivity, signals, effects, memos, and component patterns. Use when creating SolidJS components, working with reactive state, or debugging reactivity. Critical for avoiding React-trained patterns that break in SolidJS.`

### Skill taxonomy (what kinds of skills work well)

| Type | Examples | Notes |
|------|---------|-------|
| **Domain expertise** | solidjs, laravel, bento | Deep knowledge of a specific tech/project |
| **Workflow** | sigiling-inbox, session-start, prd | Multi-step process guidance |
| **Analysis lens** | challenging-assumptions, detecting-blind-spots | Cognitive framing for specific problem types |
| **Reference** | scratchpad, anima | API/tool documentation (use `disable-model-invocation`) |
| **Meta-cognitive** | collaborating-partner-mode | Changes how the model operates |

### What makes a good skill vs a bad skill
A skill is worth keeping if it:
- Contains knowledge the model doesn't have by default
- Describes a repeatable process worth encoding
- Has a clear, specific trigger condition
- Reduces tokens needed in the conversation to establish context

A skill is dead weight if it:
- Just restates what the model already knows
- Has no specific trigger condition (when would the model NOT use this?)
- Is really an AGENTS.md rule in disguise
- Duplicates another skill

### Target count: 20–25 well-scoped skills. Every skill beyond that is either a candidate for consolidation or deletion.

---

## 4. Commands (Slash-Command Shortcuts)

### What it is
A prompt template file invoked explicitly via `/command-name`. Unlike skills, commands are never auto-invoked — they're always user-triggered. They expand into a full prompt that runs against the model.

### When to use commands vs skills
- **Skill**: The model should detect when this knowledge is relevant and apply it automatically
- **Command**: The user explicitly initiates a specific workflow or mode

Commands are best for:
- One-shot workflows with a clear starting point (`/session-start`, `/commit`, `/prd`)
- Shortcuts to complex prompts the user runs repeatedly
- Meta-workflows that restructure how the session operates

### Structure
```markdown
---
name: command-name
description: Brief description shown in command picker
---

The prompt that gets expanded when the user runs /command-name.
Can include instructions, context gathering steps, output format.
```

### The distinction
If you find yourself writing "Use this skill when the user types /something" — it should be a command, not a skill. Skills describe when the model should load them. Commands describe what happens when the user invokes them.

---

## 5. Custom Tools (LLM-Callable Functions)

### What it is
Code functions (TypeScript/JavaScript/Python) that the model can invoke as tools mid-task. Extends what the model can **do** rather than what it **knows**. The model receives a tool definition (name, description, parameter schema) and decides when to call it.

### Custom tool vs MCP server
- **Custom tool**: Single-purpose function, lives in the project or harness config, no separate server process
- **MCP server**: Collection of tools behind a JSON-RPC server, runs as a separate process (daemon or spawned)

Use a custom tool when the capability is project-specific and simple (one function, minimal deps).
Use MCP when you need multiple related tools, external service access, or tools across multiple projects.

### Implementation pattern

```typescript
// .harness/tools/run-tests.ts
export default {
  name: "run_tests",
  description: "Run the test suite for a specific module. Use when verifying a change didn't break existing behavior.",
  parameters: {
    type: "object",
    properties: {
      module: { type: "string", description: "Module path to test" },
      watch: { type: "boolean", description: "Watch mode" }
    },
    required: ["module"]
  },
  async execute({ module, watch }) {
    const flag = watch ? "--watch" : ""
    return exec(`bun test ${module} ${flag}`)
  }
}
```

### Design principles
- **Narrow scope**: One tool should do one thing. Don't build a swiss-army-knife tool.
- **Idempotent where possible**: Tools that always produce the same output for the same input are easier to reason about.
- **Clear descriptions**: The model decides when to call the tool based on the description. Same rules as skill descriptions.
- **Structured output**: Return structured data (JSON), not unformatted text. The model needs to parse it.
- **Fast**: Tools add latency to every turn they're called. If a tool takes 5 seconds, that's 5 seconds the user waits.

---

## 6. Hooks (Event-Driven Automation)

### What it is
Shell scripts or commands that fire automatically in response to agent lifecycle events. Hooks run **outside** the model's context — they don't consume tokens, they don't wait for the model. They're pure side-effect machines.

### Available lifecycle events

| Event | When it fires | Primary use |
|-------|--------------|-------------|
| `SessionStart` | New conversation begins | Bootstrap memory, health checks, register instance |
| `SessionEnd` | Conversation ends | Flush state, fold memories, handoff capture |
| `UserPromptSubmit` | User sends a message | Capture prompt, inject context, timestamp |
| `PreToolUse` | Before any tool is called | Validate, block, audit |
| `PostToolUse` | After any tool completes | Lint, test, sync, observe |
| `Stop` | Model finishes responding | Capture response, post-process |
| `SubagentStart` | Subagent begins | Track parallelism, register thread |
| `SubagentStop` | Subagent completes | Aggregate results, cleanup |
| `PreCompact` | Before context compression | Preserve critical state |

### Hook patterns

**Bootstrap on session start:**
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{ "type": "command", "command": "~/.hooks/bootstrap.sh 2>/dev/null" }]
    }]
  }
}
```

**Capture every tool use for observability:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "~/.hooks/observe-tool.sh 2>/dev/null" }]
    }]
  }
}
```

**Lint on file write:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "~/.hooks/lint-on-write.sh 2>/dev/null" }]
    }]
  }
}
```

**Block production writes:**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "~/.hooks/check-production-path.sh 2>/dev/null" }]
    }]
  }
}
```

### Hook design rules
1. **Always suppress stderr** (`2>/dev/null`) — hook failures must never surface to the user unless actionable
2. **Fast**: Hooks that add latency to every prompt are hooks that get disabled
3. **Non-blocking by default**: Hooks run for side effects. If they need to block (PreToolUse for validation), that's the exception
4. **Idempotent**: The same hook might fire multiple times in a session

### The observability opportunity
Hooks are the only mechanism that runs unconditionally regardless of model behavior. `PostToolUse` with `matcher: ".*"` fires on every single tool call. This is the foundation for a full observability layer:
- Which tools is the model using? How often?
- Which skills are being loaded?
- What's the session token cost?
- What files are being touched most?

All of this can pipe to SurrealDB without touching the model's context budget.

### Hook environment variables (available in hook scripts)
- `CLAUDE_TOOL_NAME` — which tool fired
- `CLAUDE_TOOL_INPUT` — JSON of the tool's input parameters
- `CLAUDE_TOOL_RESULT` — JSON of the tool's output (PostToolUse only)
- `CLAUDE_SESSION_ID` — current session identifier
- `CLAUDE_CWD` — working directory

---

## 7. MCP Servers (Model Context Protocol)

### What it is
An external server process exposing tools to the model via the Model Context Protocol (JSON-RPC). Each MCP server registers a set of tools with names, descriptions, and parameter schemas. The model can call these tools exactly like built-in tools.

### Transport types
- **HTTP**: Server runs as a persistent daemon. Model connects via `http://localhost:PORT/`. Best for always-available infrastructure tools.
- **stdio**: Server spawned by the harness on demand. Slower startup, no port management. Best for project-specific tools.

### When to use MCP vs custom tools

Use **MCP** when:
- Multiple related tools that share state (DB connection, auth context)
- Tools needed across multiple projects without per-project config
- External service integration (GitHub, Notion, database)
- Tools that need a persistent daemon (SurrealDB connection pool, Ollama embeddings)

Use **custom tools** when:
- Single-purpose, project-specific function
- Simple execution, no shared state
- Don't want to manage a server process

### MCP design considerations
- **Tool count matters**: Each tool adds to the model's working context. 20 tools is the soft ceiling per server before it becomes noise.
- **Tool descriptions are critical**: Same as skills — the model decides when to use a tool based on the description.
- **HTTP over stdio for always-on tools**: stdio servers have cold-start latency. HTTP daemons are immediately available.
- **Context window cost**: Every enabled MCP server's tools load into context. 10 servers × 10 tools each = 100 tools competing for the model's attention.

### Registry pattern
A central `registry.json` that documents all MCP servers — transport, port, tool count, which harnesses use it, daemon name, status. This is the source of truth for deployment scripts.

```json
{
  "servers": [{
    "name": "anima",
    "transport": "http",
    "port": 3098,
    "url": "http://localhost:3098/",
    "tool_count": 7,
    "harnesses": ["all"],
    "default_enabled": true,
    "disable_when": "never"
  }]
}
```

### Port allocation discipline
Reserve ports explicitly. Don't discover what's available at runtime.

---

## 8. Subagents (Delegated Sub-Instances)

### What it is
A separate agent instance spawned by the orchestrating model to handle a specific, bounded task. The subagent receives a focused system prompt, completes its task, and returns a result. The orchestrator integrates the results.

### Critical constraint: One level deep
Subagents cannot spawn their own subagents. The architecture is flat: orchestrator → subagents. There is no recursive delegation. This is a hard limit of current harnesses.

### When to use subagents

**Good candidates:**
- Tasks that can run in parallel without file conflicts
- Work that benefits from a clean context window (no history baggage)
- Specialized roles that need different behavioral constraints than the orchestrator
- Tasks where you want isolation (a subagent that can only read, not write)

**Bad candidates:**
- Tasks that require tight back-and-forth with the orchestrator
- Tasks with deep dependencies on each other's output
- Anything that would require subagents to coordinate directly

### Model selection
Match model to task complexity:
- **Haiku / small model**: Mechanical tasks — format conversion, simple extraction, boilerplate generation, grep-and-replace
- **Sonnet / mid model**: Standard dev work — feature implementation, debugging, code review
- **Opus / large model**: Architecture decisions, security analysis, complex reasoning, orchestration

Over-sizing subagents (using Opus for mechanical tasks) wastes budget and time. Under-sizing (using Haiku for architectural work) produces low-quality output.

### Proven subagent patterns

**Code reviewer** — reads implementation, never writes:
```markdown
---
name: code-reviewer
description: Reviews code for correctness, security, and maintainability. Read-only — never modifies files.
---
You are a code reviewer. Read the specified files and return a structured review.
Your only tools are Read, Grep, and Glob. You cannot write or edit files.
Report: bugs, security issues, missing error handling, API misuse, performance concerns.
Format: markdown with severity ratings.
```

**Test writer** — implements tests for completed code, never touches implementation:
```markdown
---
name: test-writer
description: Writes tests for completed implementations. Never modifies implementation files.
---
You write tests only. You cannot edit implementation files.
Given the implementation, write comprehensive tests covering: happy path, edge cases, error conditions, boundary values.
The agent that implemented a feature must never write its own tests — that's you.
```

**Planner / architect** — produces specs, never implements:
```markdown
---
name: architect
description: Designs implementation plans and architecture. Produces specs for implementation agents.
---
You plan and design. You do not implement.
Output: numbered step-by-step implementation plan with file paths, function signatures, and acceptance criteria.
The plan is handed to implementation agents — it must be self-contained.
```

**Debugger** — diagnoses without fixing, gives root cause:
```markdown
---
name: debugger
description: Diagnoses bugs and traces root causes without implementing fixes.
---
You diagnose. You do not fix.
Given a bug report or failing test, trace the execution path, identify the root cause, and explain exactly what's wrong and where.
Output: root cause, affected files/lines, explanation of why it fails, recommended fix approach (not the fix itself).
```

### Parallelization rules
- Can agents B and C produce correct output without seeing A's result? Yes → parallel. No → sequential.
- Agents editing the same file = guaranteed conflict. Fan out by file, not by feature.
- Maximum 3–5 files per subagent. If scope is broader, split further.

---

## 9. Plugins (Distributable Bundles)

### What it is
A packaging and distribution primitive. A plugin bundles any combination of skills, hooks, tools, subagent definitions, and MCP server configs into a single installable unit with a manifest.

**Critical distinction**: A plugin is not a new capability type. Everything inside a plugin could exist as standalone config. The plugin wraps it so it can be shared, installed, and namespaced.

### When to use plugins vs standalone config

**Use standalone config when:**
- Personal, single-project use
- Experimenting before committing
- Short names preferred (`/review` not `/my-plugin:review`)

**Use a plugin when:**
- Sharing a workflow bundle across multiple projects
- Distributing to a team or community
- Combining skills + hooks + tools into a coherent kit
- You've copied the same `.harness/` config between repos more than once → package it

**The threshold:** Copying config between repos manually more than once → package it.

### Plugin anatomy
```
my-plugin/
├── manifest.json          # Required: name, version, description, entry points
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── hooks/
│   └── hooks.json
├── tools/
│   └── my-tool.ts
├── subagents/
│   └── my-agent.md
└── mcp/
    └── config.json
```

### Namespacing
Plugin skills and commands are namespaced to prevent collisions: `/my-plugin:skill-name` instead of `/skill-name`. This means multiple plugins can have skills with the same name without conflict.

### Plugin vs individual primitives — decision tree
1. Is this for personal use only in one project? → Standalone config
2. Am I sharing this with teammates? → Plugin (project-scoped install)
3. Am I distributing to the community? → Plugin + marketplace listing
4. Is it a coherent workflow bundle (skills + hooks + tools together)? → Plugin
5. Is it just one skill? → Standalone skill, not a plugin

---

## Cross-Cutting Concerns

### Context window budget
| Primitive | Context cost | Notes |
|-----------|-------------|-------|
| Always-loaded instructions | High (every session) | Minimize ruthlessly |
| Rules | Conditional (path-matched) | Zero cost when not matched |
| Skills | On-demand | Only costs when loaded |
| Commands | Zero until invoked | Expands to prompt on invocation |
| Custom tools | Low (schema only) | Tool description loads, not implementation |
| Hooks | Zero | Runs outside model context |
| MCP tools | Medium (all schemas load) | 10 tools ≈ 1K tokens always loaded |
| Subagents | Isolated | Their context is separate |
| Plugins | Depends on contents | Sum of component costs |

### The observability gap
None of the primitives emit telemetry by default. There's no built-in answer to: which skills are being auto-invoked? Which tools get called most? What's the token cost per session? This has to be built explicitly — the `PostToolUse` hook with a matcher of `.*` is the foundation. Pipe to a database. Build dashboards. Close the loop.

### The discovery problem
The model discovers skills by reading their descriptions. The model discovers tools by reading their schemas. If the description is bad, the primitive is invisible. Treat every description as an interface contract — it determines whether the primitive gets used.

### Harness-agnostic primitive mapping
Not every harness implements every primitive. The canonical source of truth (`agent-core`) defines all primitives. Each harness adapter deploys what it supports:

| Primitive | Broad support | Notes |
|-----------|--------------|-------|
| Always-loaded instructions | Universal | File name varies (`AGENTS.md`, `CLAUDE.md`, `system.md`) |
| Rules | Growing | Path-scoped loading varies by harness |
| Skills | Universal | Format varies but SKILL.md is common |
| Commands | Varies | Some harnesses call these "slash commands" |
| Custom tools | Varies | TS/JS files in harness config dir |
| Hooks | Growing | Event names differ across harnesses |
| MCP Servers | Universal (HTTP) | stdio support varies |
| Subagents | Varies | Some harnesses don't support sub-spawning |
| Plugins | Varies | Most harnesses support install-from-dir |

---

## Current State vs Target (agent-core audit)

### Deployed (post 2026-03-07)
- 57 skills in `primitives/skills/` — deployed to all harnesses
- 20 commands in `primitives/commands/` — deployed
- 2 MCP servers in registry (anima, kotadb) — deployed to Claude Code harness
- dev-brain in registry as stdio — deployed to OpenCode only

### Missing / broken
- `primitives/rules/` — empty (no path-scoped rules deployed anywhere)
- `primitives/subagents/` — empty (no subagent definitions)
- `primitives/hooks/` — empty (existing hooks live in `~/.claude/settings.json` directly, not managed by agent-core)
- `primitives/plugins/` — empty (no plugins built)
- 12 skills have "See command definition below" as description — invisible to model auto-invocation
- 4+ duplicate skills (persistence, debug-logs variants, solidjs variants) — consolidation needed
- AGENTS.md (~237 lines) includes Scratchpad API reference and Bento context — should move to skills/rules

### Priority order
1. Populate `primitives/rules/` with path-scoped rules (Bento, SolidJS, infrastructure)
2. Fix 12 broken skill descriptions
3. Trim AGENTS.md: move Scratchpad API ref to a skill, move Bento context to a rule
4. Add `disable-model-invocation: true` to: `bento-do-query`, `session-start`, `session-end`, `prd`
5. Consolidate duplicate skills → target 20–25
6. Populate `primitives/subagents/` with reviewer, test-writer, architect, debugger
7. Build `primitives/hooks/` manifest (wrap existing hooks + add observability)
8. Build observability hook pipeline → SurrealDB
