# Primitive 6 — Plugins

> *Distribution layer: the npm for agent capabilities.*

---

## What It Is

A **plugin** is a namespaced, installable bundle that packages multiple agent primitives (skills, tools, MCP configs, hooks, directives) into a distributable, reusable unit. Plugins are the **composition and sharing mechanism** of the agent ecosystem.

Think of plugins as a deployment artifact for agent capabilities. Where an npm package bundles JavaScript code for reuse, a plugin bundles agent capabilities — you install it once, and your agent gains a coherent set of new powers without per-repo configuration.

Common names across platforms:
- Plugins / extensions — most platforms
- Agent packs — some enterprise platforms
- Capability bundles — generic term
- Marketplace apps — hosted plugin ecosystems

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Individual developer** | Install a community plugin to add a capability |
| **Team** | Publish an internal plugin to share across projects |
| **Open-source maintainer** | Distribute an agent capability to the community |
| **Enterprise** | Deploy standardized capability packs across all teams |
| **Framework author** | Bundle the framework's capabilities as an installable plugin |

---

## Where It Lives

```
~/.agent/plugins/                    ← installed plugins (user-level)
  my-project-tools/
    plugin.json                      ← plugin manifest
    skills/
      architecture.md
      patterns.md
    tools/
      custom-deploy.ts
    hooks/
      post-edit-lint.js
    mcp/
      database-server.json
    directives/
      project-defaults.md

project/
  .agent/
    plugins.json                     ← which plugins are active for this project
```

### Plugin manifest (`plugin.json`)

```json
{
  "name": "arc-agent-pack",
  "version": "1.2.0",
  "description": "Agent capabilities for the Arc event sales platform",
  "author": "jrg",
  "namespace": "arc",
  "provides": {
    "skills": ["architecture", "domain-model", "pricing-rules"],
    "tools": ["validate-quote", "check-price-lock", "generate-contract"],
    "hooks": ["post-edit-lint", "pre-commit-test"],
    "mcp": ["arc-database", "arc-billing"],
    "directives": ["arc-conventions"]
  },
  "requires": {
    "runtime": ">=0.8.0",
    "tools": ["file", "shell"]
  }
}
```

---

## When It Fires

**Load point:** Session start, after directives, as part of capability initialization.

```
[Session Start]
    → Load user-level directives
    → Read plugins.json / installed plugins
    → For each active plugin:
        → Load plugin directives
        → Register plugin tools
        → Start plugin MCP servers
        → Register plugin hooks
        → Index plugin skills (descriptions only)
    → Session begins with full plugin capability set
```

Plugins are **namespace-aware**: a plugin's tools are typically accessible as `pluginName.toolName` to avoid collision with other plugins or built-ins.

---

## Why It Exists

Without plugins:
- Every project manually configures tools, hooks, MCP, skills
- No way to share configuration across projects
- Team members get different setups based on what they've manually configured
- Open-source community has no distribution mechanism for agent capabilities

With plugins:
- **Portability** — one install, consistent capability everywhere
- **Shareability** — publish to a registry, install with one command
- **Consistency** — everyone on the team gets identical setup
- **Composability** — mix and match plugins from different sources
- **Maintenance** — update a plugin once, all users get the fix

**The ecosystem flywheel:** Plugins enable an agent capability marketplace. Just as npm created an ecosystem of reusable JavaScript, plugins enable an ecosystem of reusable agent capabilities.

---

## How to Implement

### Creating a plugin

**Project structure:**
```
my-plugin/
  plugin.json         ← manifest (required)
  README.md           ← documentation
  skills/
    domain-model.md
  tools/
    index.ts          ← tool registrations
  hooks/
    post-edit.js
  mcp/
    servers.json
  directives/
    defaults.md
```

**Minimal plugin.json:**
```json
{
  "name": "my-team-tools",
  "version": "1.0.0",
  "description": "Standard tooling for our engineering team",
  "namespace": "team",
  "provides": {
    "tools": ["run-lint", "run-tests", "check-types"],
    "hooks": ["post-edit-format"],
    "skills": ["team-conventions", "architecture-guide"]
  }
}
```

### Installing a plugin

```bash
# From a registry (hypothetical)
agent plugin install arc-agent-pack

# From a local path
agent plugin install ./local-plugin

# From git
agent plugin install github:myorg/my-agent-plugin

# List installed
agent plugin list

# Enable for project
agent plugin enable arc-agent-pack
```

### Plugin composition patterns

**The "Kitchen Sink" plugin:** Packages everything for a monorepo
```
monorepo-plugin/
  → skill: how to navigate the monorepo
  → skill: package relationships
  → tool: cross-package impact analysis
  → hook: validate package boundaries on edit
  → directive: monorepo conventions
```

**The "Safety" plugin:** A portable rules/guardrails bundle
```
safety-plugin/
  → rule: classify shell commands before running
  → hook: block destructive DB operations
  → skill: security review checklist
  → hook: scan for secrets before commit
```

**The "CI" plugin:** Brings CI awareness to local agents
```
ci-plugin/
  → tool: run CI checks locally
  → skill: CI configuration guide
  → hook: validate CI config on .yml changes
  → directive: CI conventions
```

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Discovery cost | **Low** — manifest read at startup |
| Skill cost | **Low at start** — lazy loaded like regular skills |
| Tool schema cost | **Low** — schemas injected, not implementations |
| Hook cost | **Zero** — event-driven, no context cost |
| Directive cost | **High** — any plugin directives are always-loaded |

**Warning:** Plugin directives contribute to always-loaded context. Be selective — only put truly universal conventions in plugin directives.

---

## The Plugin Marketplace Pattern

The most mature agent ecosystems (analogous to VS Code extensions, npm packages) will develop around plugin registries:

```
Registry (hypothetical)
  ├── Official plugins     ← provided by harness maintainers
  ├── Verified community  ← vetted third-party
  ├── Community          ← unvetted community
  └── Private/Enterprise ← org-specific, private registry
```

Trust and security become critical:
- Plugins that register hooks or tools have significant system access
- Signature verification, permission manifests, sandboxing become necessary
- The plugin model will likely converge toward OS-style app permissions

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **All primitives** | Plugins are bundles of primitives — they package all of them |
| **Directives** | Plugins include directives (careful — context cost) |
| **MCP** | Plugins configure and auto-start MCP servers |
| **Hooks** | Plugins register hooks as part of installation |
| **Skills** | Plugins bundle skills for their domain |
| **Tools** | Plugins register custom tools under their namespace |

---

## Research Sources

- [12 Production AI Agent Primitives](https://www.mindstudio.ai/blog/12-production-ai-agent-primitives-claude-code-leak) — MindStudio, Apr 2026
- [Agentic AI Frameworks: Top 8 Options in 2026](https://www.instaclustr.com/education/agentic-ai/agentic-ai-frameworks-top-10-options-in-2026/) — Mar 2026
- [The Agentic Developer Stack in 2026](https://dev.to/axiom_agent/the-agentic-developer-stack-in-2026-tools-patterns-and-hard-lessons-59ak) — Mar 2026

---

## Key Takeaway

> Plugins are the **distribution and reuse layer** of the primitive stack. They are how the agent ecosystem compounds. A well-designed plugin converts hours of per-project configuration into a single install. If you're building agent tooling for a specific domain, packaging it as a plugin is how you share it with the community — it becomes a deployable unit of agent capability.
