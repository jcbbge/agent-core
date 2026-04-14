# Primitive 5 — MCP Servers

> *External connectivity: the protocol that lets agents reach beyond the sandbox.*

---

## What It Is

**MCP (Model Context Protocol)** is a standardized, open protocol for connecting AI agents to external tools, data sources, and services. It defines how an agent runtime (the **host**) discovers and invokes capabilities exposed by **MCP servers** — separate processes that implement the protocol.

MCP is fundamentally an extension of the tool primitive: it makes tool connectivity **external, standardized, and composable**. Instead of bundling every capability into the agent harness itself, MCP servers let you bolt on new capabilities without modifying the agent.

As of early 2026: **10,000+ active MCP servers**, 97 million monthly SDK downloads.

Key protocol facts:
- Transport: JSON-RPC 2.0 (stdio, HTTP+SSE, or WebSocket)
- Discovery: Servers advertise their tools via a capabilities manifest
- Invocation: Same tool-call pattern as native tools, but over the protocol
- Isolation: Each server runs as a separate process — crash isolation, permission isolation

---

## Who Uses It

| Actor | Use case |
|-------|----------|
| **Developer** | Connects agent to their local database, APIs, or custom tools |
| **Platform builder** | Publishes MCP servers for others to use |
| **Enterprise** | Connects agents to internal systems without exposing them |
| **Framework author** | MCP as the integration layer — write once, use everywhere |

---

## Where It Lives

**Configuration:**
```json
// .agent/mcp.json (or .mcp.json)
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["./tools/mcp-db-server.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"],
      "transport": "stdio"
    }
  }
}
```

**Server process:**
```
Agent Runtime (host/client)
  ↕ JSON-RPC over stdio/HTTP
MCP Server Process (server)
  ↕ native SDK/API calls
External System (DB, API, browser, etc.)
```

---

## When It Fires

**Load point:** Session start (for discovery); actual calls at runtime.

```
[Session Start]
    → Agent reads .mcp.json
    → Starts configured MCP server processes
    → Requests tool manifests from each server
    → Merges MCP tools into available tool registry

[During Session — on tool call]
    → Agent decides to call an MCP-backed tool
    → Routes call to appropriate MCP server via JSON-RPC
    → Server executes and returns result
    → Result injected into agent context
```

---

## Why It Exists

Without MCP:
- Every agent harness builds its own integration layer
- Connecting to a database requires harness-specific code
- Tools are non-portable — a tool built for one harness doesn't work in another
- Security boundaries are implicit — everything runs in-process

With MCP:
- **Standardization** — one protocol, works with any compliant agent
- **Portability** — build a tool server once, use it everywhere
- **Isolation** — external processes with their own permissions
- **Discovery** — agents find capabilities at runtime, not compile time
- **Composability** — combine any MCP servers from the ecosystem

**The USB-C moment for AI tools:** Just as USB-C standardized physical connections, MCP standardizes AI tool connections. If you build an MCP server for your internal API, any MCP-compatible agent can use it instantly.

---

## How to Implement

### Consuming an MCP server (configuration)

```json
{
  "mcpServers": {
    "kotadb": {
      "command": "/opt/homebrew/bin/kotadb-mcp",
      "args": ["--db", "~/.kotadb/kota.db"],
      "env": { "KOTADB_PATH": "~/.kotadb/kota.db" }
    }
  }
}
```

### Building a minimal MCP server (TypeScript)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-project-tools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Advertise available tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "get-quote-summary",
      description: "Retrieve a summary of a quote by ID including line items and totals",
      inputSchema: {
        type: "object",
        properties: {
          quoteId: { type: "string", description: "Quote UUID" }
        },
        required: ["quoteId"]
      }
    }
  ]
}));

// Handle tool invocation
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "get-quote-summary") {
    const quote = await db.quotes.findById(args.quoteId);
    return {
      content: [{ type: "text", text: JSON.stringify(quote, null, 2) }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP server categories in the wild

| Category | Examples |
|----------|---------|
| **Databases** | PostgreSQL, SQLite, MongoDB, Redis |
| **Version control** | GitHub, GitLab, Bitbucket |
| **File systems** | Local FS, S3, Google Drive |
| **Browsers** | Playwright, Puppeteer, Browserbase |
| **APIs** | Stripe, Slack, Linear, Jira |
| **Code intelligence** | AST analysis, linters, type checkers |
| **Infrastructure** | Docker, Kubernetes, Terraform |
| **AI/ML** | Vector stores, embedding services |

---

## Context Cost

| Aspect | Detail |
|--------|--------|
| Schema discovery | **Low** — manifests loaded at session start |
| Per-call overhead | **Low** — JSON-RPC is lightweight |
| Result size | **Variable** — same as native tools, potentially large |
| Process overhead | Small: each server is a separate process |

---

## MCP vs. Native Tools — When to Use Each

| Situation | Use |
|-----------|-----|
| Quick project-specific utility | **Native tool** |
| Connecting to external service | **MCP server** |
| Shared across multiple projects | **MCP server** |
| Single harness, simple operation | **Native tool** |
| Cross-harness portability needed | **MCP server** |
| Heavy process (browser, DB) | **MCP server** (isolation) |

---

## The A2A Extension

Google's **Agent-to-Agent (A2A) protocol** (2025) extends the MCP idea to agent-level interoperability: instead of tools, agents themselves become discoverable, callable services. Where MCP standardizes *tool* integration, A2A standardizes *agent* integration. These protocols are complementary:

```
User
  ↓
Orchestrator agent (uses MCP for tools)
  ↓ A2A
Specialist agent A ←→ Specialist agent B
  ↓ MCP             ↓ MCP
External tools     External tools
```

---

## Composition with Other Primitives

| Combined with | Effect |
|---------------|--------|
| **Tools** | MCP tools are tools — same call pattern, different transport |
| **Plugins** | Plugins can bundle MCP server configs |
| **Hooks** | Hooks can react to MCP tool call events |
| **Subagents** | Subagents can have their own MCP configurations |
| **Rules** | Rules can restrict which MCP tools can be called |

---

## Research Sources

- [Model Context Protocol — IBM](https://www.ibm.com/think/topics/model-context-protocol) — May 2025
- [Agent Tools & Interoperability with MCP](https://tool.lu/en_US/deck/Wz/detail) — Dec 2025
- [Design Patterns for Deploying AI Agents with MCP](https://arxiv.org/html/2603.13417) — Apr 2026
- [Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) — Apr 2025
- [AI Agent Protocols 2026 — Complete Guide](https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide) — Jan 2026

---

## Key Takeaway

> MCP is the **integration protocol layer** — the USB-C of AI tooling. It makes agent capabilities composable, portable, and ecosystem-compatible. If you're building agent tooling and want it to work across harnesses, build it as an MCP server. The ecosystem is now large enough that chances are the server you need already exists.
