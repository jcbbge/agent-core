# Work File Format (WORK.md)

Every project has a `WORK.md` at the git root. It is the three-tier dashboard.
It is tracked in git. It is human-readable. It requires no tooling to use.

## Structure

```markdown
# WORK — <project name>
Updated: <date>
Phase: <Ideate | Plan | Implement | Verify>

---

## PROJECT
<!-- Tier 1: The whole endeavor. Changes at milestone scale — weeks to months. -->

Status: <one line — what phase the project is in overall>
Next milestone: <what ships next and roughly when>

---

## ACTIVE
<!-- Tier 2: What is scoped and in motion right now. PM layer. -->
<!-- Tasks: defined, active, a path exists. Doing these now. -->

- [ ] <task> [<scope>]
- [ ] <task> [<scope>]

---

## BLOCKED
<!-- Active tasks that cannot proceed. Always include why and what unblocks it. -->

- [ ] <task> — <why blocked> — <what unblocks it>

---

## BACKLOG
<!-- Tier 2+3: Captured, not yet scheduled. Will become tasks. -->
<!-- Todos: known, important, no path yet. -->

- [ ] <todo> [<scope>]
- [ ] <todo> [<scope>]

---

## DONE
<!-- Completed tasks, most recent first. Date when moved here. -->

- [x] <task> — <date>
- [x] <task> — <date>
```

## The Distinction That Matters

**Task** — defined pathway, doing it now or this session. Lives in ACTIVE.
**Todo** — captured, will become a task eventually. Lives in BACKLOG.

The move from BACKLOG → ACTIVE is a deliberate decision. It means: this has a path now, I'm picking it up. Not automatic. Not date-driven. Deliberate.

The move from ACTIVE → DONE is the session-end action. It means: this is complete, verified, committed.

## Rules

- One WORK.md per project at git root
- Update ACTIVE and DONE at every session end
- BLOCKED must always explain why — never just "blocked"
- PROJECT section changes rarely — only at milestone boundaries
- BACKLOG is for capture, not planning — don't over-organize it
- Items in ACTIVE should have a scope tag: `[arc/quotes]`, `[arc/auth]`, etc.

## What This Is Not

- Not a sprint board
- Not a Jira replacement
- Not a kanban system
- Not exhaustive — if it's not worth writing down, don't
- Not permanent — DONE items can be pruned after a milestone ships

## The Four Phases in WORK.md

The `Phase:` header at the top reflects where the project currently is
in the four-phase cycle (Ideate → Plan → Implement → Verify).

Individual tasks can be in different phases — a feature in Implement
while another is in Verify. The top-level Phase is the dominant mode
of the project right now.
