# Commit Convention

Every commit follows this format. No exceptions.

```
<type>(<scope>): <summary>

PHASE: <current phase — Ideate | Plan | Implement | Verify>
DONE: <what was completed this session, comma-separated>
TODO: <what remains active, comma-separated>
BLOCKED: <what is blocked and why — omit if none>

Co-Authored-By: <Model Name> <noreply@provider.com>
```

## Types

| Type | When |
|------|------|
| `feat` | New capability added |
| `fix` | Bug resolved |
| `refactor` | Code restructured, behavior unchanged |
| `docs` | Documentation only |
| `test` | Tests added or modified |
| `chore` | Build, deps, tooling |
| `session` | Session handoff commit (no code change) |

## Scope

The area of the codebase. Use the directory or feature name:
`arc/quotes`, `arc/auth`, `arc/contracts`, `agent-core`, `infra`

## The PHASE line

Every commit declares which phase the work was in.
This is how session-start knows where you are in the four-phase cycle.

## The TODO line

**This is the handoff.** The next session reads this line first.
It must be accurate. It must be specific. It is the contract between sessions.

Bad:  `TODO: finish feature`
Good: `TODO: integration test for price lock, API endpoint handler, stripe webhook`

## Example

```
feat(arc/quotes): implement price lock snapshot on quote creation

PHASE: Implement
DONE: schema migration, Drizzle model, snapshot creation on quote-add, unit tests
TODO: integration test, API endpoint handler
BLOCKED: —

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>
```

## Never

- `git add -A` — stage files explicitly
- Vague summaries — "fix stuff", "updates", "wip"
- Missing TODO line — even if everything is done, write `TODO: —`
