# PRD-006: Subagent Delegation MCP Server

**Task ID:** #9
**Wave:** 2 (requires PRD-005 / Task #12 complete)
**Blocks:** #6
**Runtime:** Bun
**Port:** 3096

---

## Kotadb Code Intelligence

The executor repo is cloned and indexed at `/Users/jcbbge/executor`. Kotadb is running at `http://localhost:3099/`.

Use kotadb to understand how existing MCP servers in the stack are structured — particularly dev-brain at `~/dev-backbone/mcp-server/` as a reference for Bun HTTP MCP server patterns:
```bash
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_files","arguments":{"pattern":"index.*","directory":"/Users/jcbbge/dev-backbone/mcp-server"}}}'
```

Use dev-brain's MCP server implementation as your structural reference — same stack (Bun), same transport (streamable HTTP), same port registration pattern.

---

## Overview

Build a new Bun MCP server that exposes subagent delegation as callable MCP tools. Agents running in any harness (or inside executor's TypeScript sandbox) can call `subagents.delegate({ agent: "reviewer", input: "..." })` and get back the subagent's output. The server reads agent definitions from `~/Documents/_agents/primitives/subagents/` (created in Task #12) and calls the model API directly.

---

## Goals

- MCP server running at `http://127.0.0.1:3096/` with HTTP transport
- Tools: `subagents.list` and `subagents.delegate`
- Reads subagent definitions from the primitives directory at startup (hot-reloadable)
- Calls model API using the model specified in each agent's frontmatter
- Enforces tools allowlist from frontmatter (does not give subagents tools they don't have)
- Registers in `registry.json` and connects to executor as an MCP source

## Non-Goals

- Do not use Claude Code's native subagent spawning mechanism — this calls model APIs directly
- Do not implement a full agent loop — single-turn invocation only for now
- Do not build streaming responses initially — blocking call, return when complete
- Do not store execution history in this server (executor handles execution persistence)

---

## Stack

- **Runtime:** Bun
- **MCP SDK:** `@modelcontextprotocol/sdk` (latest, 1.x)
- **HTTP transport:** Streamable HTTP (not SSE, not stdio)
- **Model API:** Use `ANTHROPIC_API_KEY` env var for Anthropic models; use openrouter for other models
- **Source location:** `~/dev-backbone/subagent-mcp/` (or equivalent location for new MCP servers)

---

## Technical Specification

### File structure

```
subagent-mcp/
├── src/
│   ├── index.ts          # MCP server entrypoint
│   ├── loader.ts         # Reads + parses agent definition files
│   ├── delegator.ts      # Calls model API with agent definition
│   └── types.ts          # Shared types
├── package.json
└── README.md
```

### `types.ts`

```typescript
export interface AgentDefinition {
  name: string;
  description: string;
  model: string;
  tools: string[];
  temperature: number;
  systemPrompt: string;
}
```

### `loader.ts`

```typescript
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter"; // or parse YAML frontmatter manually

const AGENTS_DIR = `${process.env.HOME}/Documents/_agents/primitives/subagents`;

export async function loadAgents(): Promise<Map<string, AgentDefinition>> {
  const files = await readdir(AGENTS_DIR);
  const agents = new Map<string, AgentDefinition>();

  for (const file of files.filter(f => f.endsWith(".md"))) {
    const content = await readFile(join(AGENTS_DIR, file), "utf-8");
    const { data, content: systemPrompt } = parseFrontmatter(content);

    agents.set(data.name, {
      name: data.name,
      description: data.description,
      model: data.model,
      tools: data.tools ?? [],
      temperature: data.temperature ?? 0,
      systemPrompt: systemPrompt.trim(),
    });
  }

  return agents;
}
```

> **Note:** Use a minimal YAML frontmatter parser rather than `gray-matter` to keep dependencies light. The frontmatter format is simple enough to parse with a regex split on `---`.

### `delegator.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

export async function delegateToAgent(
  agent: AgentDefinition,
  input: string,
  context?: string
): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = context
    ? `${agent.systemPrompt}\n\n---\nAdditional context:\n${context}`
    : agent.systemPrompt;

  const message = await client.messages.create({
    model: agent.model,
    max_tokens: 8096,
    temperature: agent.temperature,
    system: systemPrompt,
    messages: [
      { role: "user", content: input }
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}
```

> **Model routing:** If `agent.model` starts with a non-Anthropic prefix (e.g., `openai/`, `google/`), route through OpenRouter instead of the Anthropic SDK. Check `agent.model` and use the appropriate client.

### `index.ts`

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadAgents } from "./loader.js";
import { delegateToAgent } from "./delegator.js";

const PORT = 3096;

async function main() {
  const agents = await loadAgents();

  const server = new Server(
    { name: "subagent-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler("tools/list", async () => ({
    tools: [
      {
        name: "subagents_list",
        description: "List all available subagents with their descriptions",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "subagents_delegate",
        description: "Delegate a task to a specialized subagent and return its output",
        inputSchema: {
          type: "object",
          properties: {
            agent: {
              type: "string",
              description: "Agent name: reviewer, test-writer, architect, debugger, sigil-distiller",
            },
            input: {
              type: "string",
              description: "The task or content to send to the agent",
            },
            context: {
              type: "string",
              description: "Optional additional context to inject into the agent's system prompt",
            },
          },
          required: ["agent", "input"],
        },
      },
    ],
  }));

  server.setRequestHandler("tools/call", async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "subagents_list") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              Array.from(agents.values()).map(a => ({
                name: a.name,
                description: a.description,
                model: a.model,
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "subagents_delegate") {
      const { agent: agentName, input, context } = args as {
        agent: string;
        input: string;
        context?: string;
      };

      const agent = agents.get(agentName);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Unknown agent: ${agentName}` }],
          isError: true,
        };
      }

      const result = await delegateToAgent(agent, input, context);
      return { content: [{ type: "text", text: result }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StreamableHTTPServerTransport({ port: PORT });
  await server.connect(transport);
  console.log(`Subagent MCP server running at http://127.0.0.1:${PORT}/`);
}

main().catch(console.error);
```

### `package.json`

```json
{
  "name": "subagent-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "bun src/index.ts",
    "dev": "bun --watch src/index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.0",
    "@modelcontextprotocol/sdk": "^1.10.0"
  }
}
```

---

## Daemon Registration

### launchctl plist

Create `/Users/jcbbge/Library/LaunchAgents/dev.brain.subagent-mcp.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.brain.subagent-mcp</string>

  <key>ProgramArguments</key>
  <array>
    <string>/path/to/bun</string>
    <string>/path/to/subagent-mcp/src/index.ts</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>/Users/jcbbge</string>
    <key>ANTHROPIC_API_KEY</key>
    <string>REPLACE_WITH_KEY_FROM_ENV</string>
  </dict>
</dict>
</plist>
```

> **Security note:** Do not hardcode the API key in the plist. Load from `~/.zshenv` or use a secrets manager. The plist shown above is a template only.

### Update registry.json

Add to `servers` array:

```json
{
  "name": "subagent-mcp",
  "description": "Subagent delegation — invoke reviewer, test-writer, architect, debugger, sigil-distiller via model API",
  "tool_count": 2,
  "transport": "http",
  "port": 3096,
  "url": "http://localhost:3096/",
  "runtime": "bun",
  "daemon": "dev.brain.subagent-mcp",
  "status": "pending",
  "default_enabled": true,
  "harnesses": ["claude-code", "opencode", "omp"]
}
```

Update `port_allocation`:
```json
"3096": "subagent-mcp — http://127.0.0.1:3096 — label: dev.brain.subagent-mcp"
```

---

## Connect to Executor

After daemon is running:

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "mcp",
    endpoint: "http://localhost:3096/",
    name: "subagent-mcp",
    namespace: "subagents",
    transport: "streamable-http"
  });
'
```

Verify:
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.subagents.list();
'
```

---

## Acceptance Criteria

- [ ] Server starts on port 3096 with `bun src/index.ts`
- [ ] `tools/list` returns `subagents_list` and `subagents_delegate`
- [ ] `subagents_list` returns all 5 agents with names and descriptions
- [ ] `subagents_delegate({ agent: "reviewer", input: "review this code: ..." })` returns a structured review
- [ ] Unknown agent name returns `isError: true` with helpful message
- [ ] Server registered in registry.json with correct port
- [ ] Connected to executor catalog at `tools.subagents.*`
- [ ] Survives daemon restart (launchctl stop/start)
- [ ] API key is NOT hardcoded in any committed file
