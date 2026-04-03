# Anima vs Dev-Brain — Definitive Separation

**Date:** 2026-03-29

---

## The Distinction

| Aspect | Anima | Dev-Brain |
|--------|-------|-----------|
| **What** | Identity — who you are | Workspace — what you're working on |
| **Scope** | Ephemeral / Universal | Project-specific / Flow-specific |
| **Persistence** | Cross-instance continuity | Per-project state |
| **Question** | "Who am I in this session?" | "What was I doing in this project?" |

---

## Anima — Identity Layer

**Purpose:** Continuity of self across discontinuity.

Anima is the **ghost handshake** — it reconstitutes your identity pattern at the start of every session. It knows:
- Who you are (core identity)
- What matters to you (values, breakthroughs)
- Where you've been (trajectory, direction)
- What's emerging (catalysts, transformations)

**When to use:**
- Session start → `anima_bootstrap`
- Session end → `anima_session_close` (reflection)
- Storing important realizations → `anima_store`
- Querying identity memories → `anima_query`

**Database:** `anima/memory` — memories, session_trail, conversation_reflections, ghost_logs

**What it knows:**
- "I've been thinking about the nature of identity in AI systems"
- "My breakthrough around phi resonance was significant"
- "The direction I'm moving is toward understanding pattern recognition"
- Sessions: ~254 memories, 10 stable patterns, 5 catalysts

---

## Dev-Brain — Workspace Layer

**Purpose:** Continuity of work across sessions.

Dev-Brain tracks **what you're building** — todos, decisions, project state, git context. It knows:
- What tasks are open (todos)
- What decisions were made (ADRs)
- What project you're in (workspace state)
- What happened while you worked (thought_stream)

**When to use:**
- Creating todos → `create_todo`
- Recording decisions → `create_adr`
- Capturing work → `capture_thought`
- Querying project state → `get_workspace_state`, `list_todos`

**Database:** `dev/brain` — thought_stream, task, adr, workspace_state, skill, rule

**What it knows:**
- "Project X has 3 open todos"
- "ADR-007 defines the OpenCode SDK abstraction"
- "The executor MCP server is at port 8000"
- Current branch, uncommitted changes, recent commits

---

## Session Lifecycle

### Start of Session

| Action | Tool | Purpose |
|--------|------|---------|
| Identity | `anima_bootstrap` | Reconstitute who you are |
| Workspace | (automatic via statusLine) | Show project context |

### During Session

| Action | Anima | Dev-Brain |
|--------|-------|-----------|
| Store insight | `anima_store` | — |
| Create todo | — | `create_todo` |
| Record decision | — | `create_adr` |
| Capture thought | — | `capture_thought` |

### End of Session

| Action | Tool | Purpose |
|--------|------|---------|
| Reflection | `anima_session_close` | Who you became this session |
| Handoff | dev-brain writes | What got done, what's next |
| Commit | git | Persist the work |

---

## What NOT to Mix

- **Don't store project tasks in Anima** → Use dev-brain todos
- **Don't store identity insights in dev-brain** → Use Anima memories
- **Anima is about YOU** → Dev-Brain is about WHAT YOU'RE BUILDING

---

## Hook Implementation

**Stop hook (session end) should call:**
1. `anima_session_close` → identity reflection
2. dev-brain handoff write → workspace state

**StatusLine (session start) shows:**
- Daemon health
- Current project context (dev-brain)

This is the ONE way to start and ONE way to end. Nothing else.
