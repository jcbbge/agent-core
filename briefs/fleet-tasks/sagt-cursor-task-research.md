# SAGT cursor task-system research

> From: CORD fleet-tasks (w2E:p2). Binding. Self-contained.
> Board topic: `agent-core/fleet-tasks`. `.done` marker: `~/agent-core/briefs/fleet-tasks/.done/sagt-cursor-task-research.done`.

## Mission

Research Cursor's task/todo tool — the one the cursor agent harness renders as a
checklist with clear done/not-done state — so a later design mission can model a
CORD/ORCH-plane "whiteboard" task layer on it. **Research only. No implementation,
no edits anywhere except your findings file.**

## Questions to answer

1. **Data model.** What does a task item look like? Fields (id, content/title,
   status, activeForm?), state enum (pending / in_progress / completed — exactly
   which states, exact spellings), ordering, merge semantics on update.
2. **Tool surface.** Tool name(s) the model calls (e.g. `todo_write` /
   `TodoWrite`), input schema, whether it's one-shot full-list replace or
   granular add/update, and any rules the harness gives the model about when to
   use it (min step counts, exactly-one-in_progress, etc.).
3. **Rendering / UX.** How the UI presents it (checklist, glyphs per state,
   progress indication), and — as far as evidence supports — *why* it reads as
   excellent (state clarity, single in-progress focus, live updates mid-turn).
4. **Transitions.** What state transitions are legal/observed; whether the tool
   validates them; what happens to completed items (kept, collapsed, cleared).

## Sources, in order of preference (pre-verified by CORD this session)

a. **Cursor public docs online** — docs.cursor.com / cursor.com/docs. Fetch what
   exists about the task/todo tool and agent task UI. Cite URLs.
b. **Local `cursor-agent` CLI** — `~/.local/bin/cursor-agent`, version
   `2026.08.11-e8db854` (verified). CORD already captured `--help`: no task verbs
   at top level. Worth probing: `cursor-agent mcp --help`, `cursor-agent about`,
   and `--print --output-format stream-json` on a trivial read-only prompt to
   observe the raw tool-call schema if a todo tool fires (keep it cheap; one
   probe max, read-only prompt like "list your available tools" — do NOT let it
   edit files; use `--mode ask`).
c. **Cursor.app bundle** (`/Applications/Cursor.app`) — BOUNDED EFFORT ONLY:
   strings/ripgrep over the bundled JS for `todo_write`/`TodoWrite`/state enums
   if cheap (the bundle is large; cap yourself at ~10 minutes of grepping, then
   mark the rest `[UNKNOWN]`).
d. **SDK skill doc** `~/.cursor/skills-cursor/sdk/SKILL.md` — CORD has read it:
   it documents the Agent/Run SDK surface and does NOT mention a todo/task API.
   Treat that as evidence of absence on the SDK surface, not proof of absence
   overall.

## Epistemics (hard)

- Every claim about cursor internals needs a THIS-SESSION source: doc fetch (URL),
  CLI output (command + output), or file read (path). Otherwise write `[UNKNOWN]`.
  Do not invent cursor internals. Guess-and-disclose is banned.

## Report-back

1. Write findings to `~/agent-core/briefs/fleet-tasks/research-cursor-tasks.md`
   with a provenance block (`date -u`; `pwd -P`) and per-claim citations.
2. Post a 5-10 line summary finding to board topic `agent-core/fleet-tasks`
   (`from`: your pane id, e.g. `SAGT cursor-task-research (w2E:pX)`).
3. Write `.done` marker `~/agent-core/briefs/fleet-tasks/.done/sagt-cursor-task-research.done`
   containing one line: outcome + path to findings.
