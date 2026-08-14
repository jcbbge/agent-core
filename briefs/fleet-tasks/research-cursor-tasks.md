# Cursor task/todo tool — research findings

**Provenance:** `Wed Aug 12 16:14:46 UTC 2026` · `/Users/jrg/agent-core`

**Mission:** Research-only for fleet-tasks w2E:p2 (CORD). No implementation.

---

## Executive summary

Cursor's agent todo system is a **session-scoped checklist** driven by the model-facing tool **`TodoWrite`**. Items carry `id`, `content`, and `status` (`pending` | `in_progress` | `completed` | `cancelled`); the host also accepts optional `activeForm` on the wire (observed in the live Cursor host tool schema this session, not in the bundled protobuf). Updates are **list-level with merge semantics** (`merge: true` patches by id; `merge: false` replaces/adds fresh list). The server returns validation metadata including `needs_in_progress_todos`, `final_todos`, and `was_merge`. UI renders per-state glyphs (circle / circle-dashed / check-circle / slash-circle) and updates live mid-turn. **Public docs do not document TodoWrite**; primary evidence is Cursor.app bundle strings + protobuf types + one CLI probe + live host tool schema.

---

## 1. Data model

### Todo item fields

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `id` | string | yes | `agent.v1.TodoItem` protobuf; `aiserver.v1.TodoItem` protobuf; live host schema |
| `content` | string | yes | same |
| `status` | enum/string | yes | same |
| `dependencies` | string[] | no | protobuf (both TodoItem types) |
| `created_at` / `updated_at` | int64 | no | `agent.v1.TodoItem` only (internal richer type) |
| `activeForm` | string | no | **live Cursor host `TodoWrite` tool schema this session only** — `[UNKNOWN]` in Cursor.app bundle grep |

**Protobuf — `agent.v1.TodoItem`** (`cursor-agent-exec/dist/main.js`):
```
id, content, status (enum TodoStatus), created_at, updated_at, dependencies[]
```

**Protobuf — `aiserver.v1.TodoItem`** (wire/API layer):
```
content, status (string), id, dependencies[]
```

**Status enum — `agent.v1.TodoStatus`** (exact spellings on wire as lowercase strings in UI/API):
- `pending`
- `in_progress` (underscore)
- `completed`
- `cancelled` (4th state — not just pending/in_progress/completed)

Source: bundle enum `TODO_STATUS_PENDING | IN_PROGRESS | COMPLETED | CANCELLED` plus UI type array `["pending","in_progress","completed","cancelled"]` in `plan-todos.types.js` embedded in `workbench.desktop.main.js`.

### Ordering

- List order is array order in `todos[]`.
- UI supports phase/group structure for plan-linked todos (`plan-todos` components); standalone agent todos appear as ordered checklist items.
- `[UNKNOWN]` whether server re-sorts on merge vs preserves caller order — observed transcripts preserve caller order.

### Merge semantics

**`UpdateTodosArgs` / `TodoWriteParams`:**
```
todos: TodoItem[] (repeated)
merge: bool
```

- **`merge: false`** — create/replace list (used when first capturing requirements or resetting).
- **`merge: true`** — patch existing items **by `id`**; omitted ids unchanged.

**`TodoWriteResult` fields** (server response):
- `success`, `ready_task_ids[]`, `needs_in_progress_todos` (bool), `final_todos[]`, `initial_todos[]`, `was_merge`

Source: `aiserver.v1.TodoWriteResult` in `cursor-agent-exec/dist/main.js`.

Observed in local transcripts: `merge: true` with partial item updates; `merge: false` when seeding a new list (e.g. `/Users/jrg/.cursor/projects/.../agent-5a69145b-...jsonl`).

---

## 2. Tool surface

### Model-callable name

| Surface | Name |
|---------|------|
| Cursor IDE / CLI agent (model-facing) | **`TodoWrite`** |
| Internal protobuf (agent runtime) | `agent.v1.UpdateTodosToolCall` / `UpdateTodosArgs` |
| Server/API protobuf | `aiserver.v1.TodoWriteParams` / `TodoWriteResult` |
| Alternate codex prompt alias | described as "Updates the todo list" (same semantics) |

CLI probe (`cursor-agent --print --output-format stream-json --mode ask`, session `5cf72c76-...`) listed **`TodoWrite`** in the model's tool array. No separate `todo_write` model name in that output (internal strings use `TODO_WRITE` constant and `todo_write` in some paths).

### Input schema (host)

From live Cursor host tool definition **this session** (Composer agent in Cursor IDE):
```json
{
  "merge": "boolean (required)",
  "todos": [{
    "id": "string (required)",
    "content": "string (required)",
    "status": "enum: pending | in_progress | completed | cancelled (required)",
    "activeForm": "string (optional) — present tense label shown while in_progress"
  }]
}
```
Constraints stated in host schema: `todos.minItems = 2`; exactly one `in_progress` at a time.

### Internal read tool

`agent.v1.ReadTodosToolCall` / `ReadTodosArgs` supports `status_filter[]` and `id_filter[]`. `[UNKNOWN]` whether all models receive this as a callable tool — not listed in CLI ask-mode probe output.

### Harness rules (when to use)

From bundled system prompt strings (`cursor-agent-exec/dist/main.js`, `haiku`/`latest` variant):

**Use when:**
1. Complex multi-step tasks (**3+ distinct steps**)
2. Non-trivial planning work
3. User explicitly requests todo list
4. User provides multiple tasks
5. After new instructions — capture as todos (`merge=false`)
6. After completing tasks — mark complete (`merge=true`) and add follow-ups
7. When starting work — mark one `in_progress`

**Do NOT use when:**
- Single straightforward task
- Trivial / <3 step work
- Informational-only requests

**Management rules (bundled):**
- Only **ONE** `in_progress` at a time
- Mark complete **immediately** after finishing
- Cancel unneeded tasks (`cancelled`) instead of leaving stale pending
- Prefer first todo as `in_progress`; batch todo writes with other tool calls
- Don't narrate todo updates to user (except first creation)

**Codex variant guidelines:**
- At most one `in_progress`
- Cancel immediately when obsolete
- Prefer first todo `in_progress`
- Batch with parallel tool calls

**Model availability:** Cursor forum staff stated TODO tools were historically **Claude-only**, expanded later (e.g. GPT-5). Tool presence is gated by `toolInfo.allTools.TODO_WRITE` / `hasTodoWriteTool` in prompt builder. Source: forum threads + bundle `TODO_WRITE` conditionals.

### SDK surface

`~/.cursor/skills-cursor/sdk/SKILL.md` documents Agent/Run/MCP SDK only — **no todo/task API**. Evidence of absence on external SDK, not proof the IDE lacks todos.

### Public docs

- https://cursor.com/docs/agent/tools — lists Search, Web, Edit, Shell, Browser, Image, Ask questions; **no TodoWrite page**
- https://cursor.com/docs/agent/tools/todo — **404**
- https://cursor.com/docs/agent/plan-mode.md — plan markdown + build flow; mentions plan todos are pre-created on Build but not the TodoWrite schema

---

## 3. Rendering / UX

From `workbench.desktop.main.js` (`plan-todos.types.js`, status components):

| Status | Label | Icon/glyph |
|--------|-------|------------|
| `pending` | Pending | `circle` |
| `in_progress` | In progress | `circle-dashed` |
| `completed` | Completed | `check-circle` |
| `cancelled` | Cancelled | `slash-circle` |

CSS classes: `statusPending`, `statusInProgress`, `statusCompleted`, `statusCancelled`, plus `statusSelected` for selection.

**Why it reads well (evidence-backed):**
1. **State clarity** — four distinct visual states including cancelled (not binary done/not-done).
2. **Single focus** — prompt + server flag `needs_in_progress_todos` enforce one active item; matches "whiteboard sticky note" mental model.
3. **Live mid-turn updates** — tool calls stream during agent turn; bundled prompts require status reconciliation before new edits and after each step.
4. **Silent updates** — "don't tell the user you're updating todos" reduces chat noise; checklist carries state.
5. **Merge=true incremental patches** — list stays visible; completed items remain checked rather than disappearing.

`activeForm` (host schema): optional present-tense label for in-progress display — `[UNKNOWN]` exact UI rendering; field absent from bundled JS grep.

Plan mode integration: Build/Parallel flows inject "Todos from the plan have already been created… Mark them as in_progress as you work" — todos can originate from plan markdown, not only model-initiated TodoWrite.

---

## 4. Transitions

### Legal states
`pending` → `in_progress` → `completed` | `cancelled`

Also direct jumps observed in UI helpers (`sOm` cycles status for dev UI) — production agent path follows prompt rules above.

### Validation
- Server returns `needs_in_progress_todos: true` when an in-progress item is required and missing (field on `TodoWriteResult`).
- Host schema: max one `in_progress`; min 2 todos per write.
- Status strings validated against `["pending","in_progress","completed","cancelled"]` (zod-like `UX` validator in bundle).

### Completed item retention
- **Kept** in list with `completed` status (check-circle glyph) — not cleared automatically.
- Prompt: "Reference todo task names (not IDs); never reprint the full list" in updates.
- Cancelled items remain visible with slash-circle unless removed via merge semantics `[UNKNOWN]` if delete-on-cancel or keep — UI has `delete` command in plan-todos keymap for plan editor; agent path uses `cancelled` status.

---

## 5. CLI probe results

| Command | Result |
|---------|--------|
| `cursor-agent --version` | `2026.08.11-e8db854` |
| `cursor-agent --help` | No task-specific subcommands |
| `cursor-agent mcp --help` | MCP management only |
| `cursor-agent about` | CLI metadata; no todo verbs |
| `cursor-agent --print --output-format stream-json --mode ask -p "List every tool…"` | Final assistant output included **`TodoWrite`** in JSON array; stream-json did not emit todo schema in first 200 lines |

---

## 6. Open questions / UNKNOWNs

1. **`activeForm`** — present in live host tool schema; not found in Cursor.app bundle grep. May be host-side-only or recently added.
2. **ReadTodos** — exists in protobuf; model exposure varies by profile.
3. **Persistence** — session-scoped in chat context; survives within conversation / context refresh per bundled "fresh context window keeps TODO items" text; exact storage path `[UNKNOWN]` (unlike Qwen's `~/.qwen/todos/`).
4. **Server-side merge conflict rules** — when `merge:true` references unknown id, behavior `[UNKNOWN]`.
5. **Public documentation** — none found; internal prompt strings are the canonical spec today.

---

## 7. Design implications for CORD/ORCH whiteboard (research-only notes)

Operator asked for research only — brief pointers for downstream ORCH:
- Adopt **merge-by-id patch** + full-list replace modes.
- Enforce **single in_progress** at validation layer (`needs_in_progress_*` equivalent).
- Keep **completed visible** (checklist, not ephemeral log).
- Support **`cancelled`** as first-class, not delete-only.
- Separate **fleet task layer** (Tower/board) from harness personal TodoWrite — aligns with operator mental model ("sticky notes on whiteboard" vs "personal notebook").

---

## Sources (this session)

| # | Source | What it proved |
|---|--------|----------------|
| S1 | https://cursor.com/docs/agent/tools | Public tools page; no TodoWrite |
| S2 | https://cursor.com/docs/agent/tools/todo | 404 — no public todo doc |
| S3 | https://cursor.com/docs/agent/plan-mode.md | Plan flow; todos pre-created on Build |
| S4 | `~/.cursor/skills-cursor/sdk/SKILL.md` | SDK has no todo API |
| S5 | `~/.local/bin/cursor-agent --version/--help/mcp --help/about` | CLI version; no todo verbs |
| S6 | `cursor-agent --print --output-format stream-json --mode ask …` | TodoWrite in tool list |
| S7 | `/Applications/Cursor.app/.../cursor-agent-exec/dist/main.js` | Protobuf types, tool descriptions, TODO_WRITE gating, TodoWriteResult |
| S8 | `/Applications/Cursor.app/.../workbench.desktop.main.js` | UI status enum, glyphs, plan-todos components |
| S9 | Live Cursor host `TodoWrite` tool schema (this agent run) | activeForm, minItems:2, one in_progress |
| S10 | Local transcripts under `~/.cursor/projects/*/agent-transcripts/*.jsonl` | Observed merge:true/false calls |
| S11 | Forum: https://forum.cursor.com/t/to-do-lists-dont-work/117110 | Model gating history; manual `todo_write` trigger |
| S12 | https://agentos.to/skills/reference/dev/cursor/ | Third-party tool list including TodoWrite (secondary) |
