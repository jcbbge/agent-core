# ADR-002: Separate Declared Intent (stack.yaml) from Observed State (SurrealDB)

**Date:** 2026-03-09
**Status:** Accepted

## Context

A stack catalog needs to answer two different questions that cannot come from the same source:
1. "What *should* be installed?" — the declaration
2. "What *is* running right now?" — the observed reality

If agents treat declared intent as observed state, they make confident wrong decisions. A daemon that's declared but crashed = declared true, observed down. The simulation surfaced a live example: dev-brain had ghost thread records from crashed sessions, with no indication to agents that the state was stale.

## Decision

- `stack.yaml` = **declared intent** — human-editable, git-tracked, the source of truth for what *should* exist. Diff = changelog.
- SurrealDB `stack/catalog` = **observed state** — written by health checks and the sync script, queried by agents. Includes `last_seen_at`, `status`, `version` fields on every record.

Agents MUST query observed state. Agents MUST NOT treat `stack.yaml` content as current reality.

## Consequences

- Two layers to maintain (YAML + DB), but they serve genuinely different purposes
- Sync script bridges them: `stack.yaml` → SurrealDB on deploy
- Health checks write observed state independently of the sync script
- Stale state becomes visible: if `last_seen_at` is > N minutes ago, status is unknown
- Git history of `stack.yaml` is the changelog for free

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| SurrealDB as sole source of truth | No git history, no offline access, harder to edit |
| `stack.yaml` as sole source of truth | Not queryable by agents, agents must parse files, no health state |
| Merged: one file/table serves both purposes | Agents make wrong decisions on stale declared data |

## Resonance

The mental model shift: Terraform doesn't document infrastructure, it *declares* it. The declaration and the runtime state are separate concerns by design. Terraform state file ≠ `.tf` files. Same principle here. The friction of maintaining two layers is the cost of having reliable answers to two different questions.
