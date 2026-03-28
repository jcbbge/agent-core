# AgenticDeck - PRD

**Version**: 1.0  
**Date**: 2026-03-27  
**Status**: Draft  
**Author**: JR  

---

## 1. Executive Summary

**AgenticDeck** is a primitives management platform that serves as the "tool shed" for AI agents and humans alike. It provides a centralized, queryable registry of agentic primitives—skills, commands, rules, and subagents—enriched with the who/what/where/when/why/how context that enables world-class developer experience.

### The Problem

Current agent workflows suffer from:
- **Fragmentation**: Primitives scattered across markdown files, configs, and hardcoded instructions
- **Poor discoverability**: Agents can't dynamically find what tools are available for a given context
- **Static documentation**: No way to query "what should I use for X?" at runtime
- **No unified interface**: Every agent system (OpenCode, Claude Code, Cursor) has its own primitive system

### The Solution

AgenticDeck provides:
- **Single source of truth** for all primitives in SurrealDB
- **Rich metadata** with who/what/where/when/why/how for each primitive
- **Multi-dimensional query** via REST API and MCP server
- **Human UI** for managing primitives with world-class DX
- **Agent-native interface** so any agent can discover and use primitives dynamically

### Target Users

1. **Primary**: AI agents (OpenCode, Claude Code, Cursor, custom agents)
2. **Secondary**: Developers who want to understand and manage their agent workflows
3. **Tertiary**: Teams who want to standardize agent behavior across projects

---

## 2. Product Vision

> **"The tool shed that gives agents superpowers"**

AgenticDeck is to agents what a well-organized workshop is to a craftsman—not just the tools, but the knowledge of when to use each one, how to use it properly, and why it matters.

---

## 3. Data Model

### 3.1 Primitive Base

Every entry in AgenticDeck is a **Primitive** with this core structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (ulid) | Unique identifier |
| `name` | string | Machine-readable name (kebab-case) |
| `display_name` | string | Human-readable name |
| `description` | string | Brief summary (1-2 sentences) |
| `kind` | enum | `skill` \| `command` \| `rule` \| `subagent` |
| `content` | string | Full markdown content |
| `who` | string | Who is this for (target user) |
| `what` | string | What it does (concrete functionality) |
| `where` | string | Where to use it (context/environment) |
| `when` | string | When to use it (triggers/conditions) |
| `why` | string | Why it matters (value proposition) |
| `how` | string | How to use it (step-by-step guide) |
| `examples` | array | Usage examples |
| `tags` | array | Categorization tags |
| `related` | array | Related primitive IDs |
| `author` | string | Who created/owns it |
| `version` | string | Semantic version |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last modification |

### 3.2 Primitive Types

#### Skill
```json
{
  "kind": "skill",
  "triggers": ["when user asks to create X", "when working with framework Y"],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimated_duration": "5-15 minutes"
}
```

#### Command
```json
{
  "kind": "command",
  "syntax": "/command-name [args]",
  "aliases": ["shortcut", "alt-name"],
  "requires": ["context X", "tool Y"]
}
```

#### Rule
```json
{
  "kind": "rule",
  "enforcement": "strict" | "advisory",
  "applies_to": ["file patterns", "project types"],
  "globs": ["**/*.tsx", "**/solid*/**/*"]
}
```

#### Subagent
```json
{
  "kind": "subagent",
  "capabilities": ["design", "debugging", "code-review"],
  "model_preference": "sonnet" | "opus" | "haiku",
  "max_tokens": 50000
}
```

### 3.3 Collections

Primitives can be grouped into **Collections**:

| Field | Type |
|-------|------|
| `id` | string |
| `name` | string |
| `description` | string |
| `primitives` | array of primitive IDs |
| `is_public` | boolean |

---

## 4. Core Features

### 4.1 Primitive Management (CRUD)

- **Create**: Add new primitives via UI form or import from markdown
- **Read**: View primitive details with full context
- **Update**: Edit any field with version history
- **Delete**: Soft delete with archive, hard delete with confirmation

### 4.2 Query Interface

#### MCP Server (Primary for Agents)
```
Tools exposed:
- primitives.list(kind?: string, tags?: string[])
- primitives.search(query: string, limit?: number)
- primitives.get(id: string)
- primitives.suggest(context: string) -> recommended primitives
- primitives.validate(primitive: Primitive) -> validation result
```

#### REST API (Secondary)
```
GET    /api/primitives              # List all
GET    /api/primitives/:id          # Get one
POST   /api/primitives              # Create
PUT    /api/primitives/:id          # Update
DELETE /api/primitives/:id          # Delete
GET    /api/primitives/search?q=    # Full-text search
GET    /api/primitives/kind/:kind   # Filter by type
GET    /api/primitives/tags/:tag    # Filter by tag
GET    /api/suggest?context=        # Context-aware suggestions
```

#### GraphQL (Future)
For complex queries and subscriptions.

### 4.3 Search & Discovery

- **Full-text search**: Name, description, content
- **Semantic search**: Find primitives by meaning (via SurrealDB or external)
- **Tag-based filtering**: Filter by multiple tags
- **Kind filtering**: skill/command/rule/subagent
- **Context-aware suggestions**: Given a task description, suggest relevant primitives

### 4.4 Import/Export

- **Import**: 
  - Single markdown file
  - Bulk from directory (migrate existing files)
  - JSON/YAML import
- **Export**:
  - Single primitive as markdown
  - Full collection as JSON
  - OpenCode-compatible format
  - Claude Code-compatible format

### 4.5 Version History

- Track all changes to primitives
- View diff between versions
- Restore previous versions
- Branch/fork primitives

### 4.6 Collaboration

- **Sharing**: Share collections via unique URL
- **Templates**: Create primitives from templates
- **Forking**: Fork public primitives to customize

---

## 5. User Experience

### 5.1 Human UI

#### Dashboard
- Overview of all primitives
- Recent activity
- Quick actions (create, import, search)
- Analytics (most used, recently added)

#### Primitive Editor
- Rich markdown editor
- Live preview
- Split view for who/what/where/when/why/how fields
- Validation indicators
- Version comparison

#### Search Interface
- Command palette (Cmd+K) for quick search
- Faceted filters
- Result previews
- Keyboard navigation

### 5.2 Agent Interface

#### MCP Tools
Agents call MCP tools directly—no config needed beyond MCP endpoint.

#### Context Injection
Agents can request primitive context to be injected into their system prompt.

#### Streaming Suggestions
Real-time suggestions as agents describe what they're trying to do.

---

## 6. Technical Architecture

### 6.1 Stack

| Component | Technology |
|-----------|------------|
| Frontend | SolidStart (SolidJS 2.0) |
| Backend | SolidStart API routes |
| Database | SurrealDB (ws://127.0.0.1:8002) |
| Search | SurrealDB full-text + semantic (future: Qdrant) |
| MCP Server | Built-in via @modelcontextprotocol/server |
| Auth | API keys (v1), OAuth (future) |
| Hosting | Docker / Cloudflare Pages / Vercel |

### 6.2 Database Schema (SurrealDB)

```sql
-- Namespaces
USE NS agenticdeck;

-- Primitives table
DEFINE TABLE primitives SCHEMAFULL;
DEFINE FIELD name ON primitives TYPE string;
DEFINE FIELD display_name ON primitives TYPE string;
DEFINE FIELD description ON primitives TYPE string;
DEFINE FIELD kind ON primitives TYPE string;
DEFINE FIELD content ON primitives TYPE string;
DEFINE FIELD who ON primitives TYPE string;
DEFINE FIELD what ON primitives TYPE string;
DEFINE FIELD where ON primitives TYPE string;
DEFINE FIELD when ON primitives TYPE string;
DEFINE FIELD why ON primitives TYPE string;
DEFINE FIELD how ON primitives TYPE string;
DEFINE FIELD examples ON primitives TYPE array;
DEFINE FIELD tags ON primitives TYPE array;
DEFINE FIELD related ON primitives TYPE array;
DEFINE FIELD author ON primitives TYPE string;
DEFINE FIELD version ON primitives TYPE string;
DEFINE FIELD created_at ON primitives TYPE datetime;
DEFINE FIELD updated_at ON primitives TYPE datetime;
DEFINE FIELD deleted_at ON primitives TYPE datetime;
DEFINE INDEX primitives_name ON primitives FIELDS name UNIQUE;
DEFINE INDEX primitives_kind ON primitives FIELDS kind;
DEFINE INDEX primitives_tags ON primitives FIELDS tags;

-- Collections table
DEFINE TABLE collections SCHEMAFULL;
DEFINE FIELD name ON collections TYPE string;
DEFINE FIELD description ON collections TYPE string;
DEFINE FIELD primitives ON collections TYPE array;
DEFINE FIELD is_public ON collections TYPE bool;
DEFINE FIELD created_at ON collections TYPE datetime;

-- API Keys table
DEFINE TABLE api_keys SCHEMAFULL;
DEFINE FIELD name ON api_keys TYPE string;
DEFINE FIELD key_hash ON api_keys TYPE string;
DEFINE FIELD permissions ON api_keys TYPE array;
DEFINE FIELD created_at ON api_keys TYPE datetime;
DEFINE FIELD expires_at ON api_keys TYPE datetime;
DEFINE INDEX api_keys_key ON api_keys FIELDS key_hash UNIQUE;
```

### 6.3 Directory Structure

```
agenticdeck/
├── src/
│   ├── lib/
│   │   ├── db/           # SurrealDB client & queries
│   │   ├── primitives/  # Primitive CRUD logic
│   │   ├── search/       # Search implementation
│   │   └── mcp/          # MCP server handlers
│   ├── routes/
│   │   ├── api/         # REST API endpoints
│   │   ├── primitives/  # Primitive pages
│   │   ├── collections/ # Collection pages
│   │   └── search/      # Search UI
│   └── components/
├── supabase/            # Migration scripts
├── mcp/                 # MCP server package
└── Dockerfile
```

---

## 7. Migration Plan

### 7.1 Initial Data

Migrate from existing markdown files:

| Source | Count | Location |
|--------|-------|----------|
| Skills | 44 | `~/Documents/_agents/schema/skills/*/SKILL.md` |
| Commands | 23 | `~/Documents/_agents/schema/commands/*.md` |
| Rules | 9 | `~/Documents/_agents/schema/rules/*.md` |
| Subagents | 7 | `~/Documents/_agents/schema/subagents/*.md` |

### 7.2 Migration Script

```typescript
// Pseudo-code
const files = await glob('~/Documents/_agents/schema/**/*.{md,mdx}');
for (const file of files) {
  const content = await readFile(file);
  const frontmatter = parseYaml(content.frontmatter);
  const primitive = {
    ...frontmatter,
    content: content.body,
    kind: inferKindFromPath(file.path),
    who: "developers using this framework",
    what: frontmatter.description,
    // ... map remaining fields
  };
  await db.create('primitives', primitive);
}
```

---

## 8. Business Model

### 8.1 Open Source (MIT License)

**Core Features** (free forever):
- Self-hosted deployment
- All CRUD operations
- MCP server
- REST API
- Basic search
- Community support

### 8.2 Hosted Service (Future)

**Premium Features**:
- Managed hosting
- Semantic search (Qdrant integration)
- Team collaboration
- Analytics dashboard
- SSO/OAuth
- Priority support
- Usage metering

**Pricing Tiers**:
- Free: 1 user, 100 primitives
- Pro: $19/mo - 5 users, unlimited primitives
- Team: $49/mo - unlimited users, team features

---

## 9. Success Metrics

### 9.1 Technical Metrics

- [ ] MCP server responds < 100ms
- [ ] Search returns results < 200ms
- [ ] Primitive CRUD operations complete < 150ms

### 9.2 Adoption Metrics

- [ ] All 83 existing primitives migrated
- [ ] OpenCode harness configured to use AgenticDeck via MCP
- [ ] Query patterns logged and analyzed

### 9.3 Experience Metrics

- [ ] Human users can find primitives in < 3 clicks
- [ ] Agents successfully use suggestions in > 80% of relevant contexts
- [ ] Zero-config agent integration working

---

## 10. Phased Implementation

### Phase 1: Foundation (Week 1-2)
- [ ] SurrealDB schema defined
- [ ] Basic CRUD API
- [ ] Markdown migration script
- [ ] Basic SolidStart UI

### Phase 2: Query (Week 3-4)
- [ ] Full-text search
- [ ] Tag-based filtering
- [ ] REST API completion
- [ ] Basic MCP server

### Phase 3: Experience (Week 5-6)
- [ ] Rich primitive editor
- [ ] Dashboard & analytics
- [ ] Collection management
- [ ] Import/export

### Phase 4: Polish (Week 7-8)
- [ ] Version history
- [ ] Semantic search (if time permits)
- [ ] Documentation
- [ ] Deployment scripts

---

## 11. Open Questions

1. **Naming**: "AgenticDeck" - good? Alternatives: PrimitiveHub, AgentDeck, ToolShed, Primitives.io
2. **Initial hosting**: Deploy to existing infrastructure or cloud? (Current: same box as SurrealDB)
3. **Semantic search**: Use SurrealDB vectors or external (Qdrant)? (Recommend: SurrealDB first, Qdrant v2)
4. **Multi-tenant**: Support multiple organizations from day 1? (Recommend: single-tenant v1)

---

## 12. Dependencies & Constraints

### External Dependencies
- SurrealDB (existing at ws://127.0.0.1:8002)
- Existing primitives in `~/Documents/_agents/schema/`

### Technical Constraints
- Must use SolidJS 2.0 (as requested)
- Must work with existing executor/MCP infrastructure
- Must support offline/local-first operation

### Known Risks
- SurrealDB performance at scale (mitigate: benchmark, add caching)
- Migration may lose some metadata (mitigate: manual review post-migration)
- MCP server complexity (mitigate: use existing @modelcontextprotocol/server)

---

## 13. Next Steps

1. **Confirm spec** - Review and approve this document
2. **Create repo** - Initialize SolidStart project
3. **Set up SurrealDB** - Create namespace, run migrations
4. **Build Phase 1** - Foundation implementation
5. **Test migration** - Run migration script, verify data
6. **Deploy** - Deploy to development environment
7. **Configure OpenCode** - Point executor MCP to AgenticDeck

---

*This PRD serves as the implementation contract. All questions should be resolved before work begins.*
