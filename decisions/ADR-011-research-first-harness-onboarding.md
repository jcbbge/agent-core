# ADR-011: Harness onboarding requires research-first documentation before deployment

**Date:** 2026-03-11
**Status:** Accepted

## Context

Primitive mappings for OMP were written from file-system inference (directory names, config structure) rather than official documentation. This produced a profile that was wrong on multiple points (assumed no rules/skills/commands/agents support when OMP in fact supports all of them via `~/.omp/agent/{rules,skills,commands,agents}/`). The same class of error affected OpenCode (assumed skills were not natively loaded; they are — OpenCode reads `~/.claude/skills/` as a fallback).

Guessing harness behavior from file structure is faster than reading docs but produces incorrect profiles that silently misconfigure the entire deployment.

## Decision

No harness profile may be written until official documentation or source code has been read for each of the nine primitives. Each primitive entry in the profile must include a `source_doc` field citing the specific doc URL or source file that proves the mapping.

Profiles marked `"status": "UNVERIFIED"` are excluded from the audit script entirely — they cannot produce false green checkmarks.

The onboarding SOP is documented at `~/Documents/_agents/primitives/harnesses/ONBOARDING-SOP.md`.

## Consequences

**Easier:**
- Profiles are trustworthy — a green audit result is real
- Wrong assumptions surface during research, not during a debugging session
- The `source_doc` field makes profiles auditable by humans and agents

**Harder:**
- Onboarding a new harness takes longer — research is required before any deployment
- If official docs are wrong or outdated, the profile will reflect the docs, not reality

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Infer from file structure | Fast but wrong — proved wrong for both OMP and OpenCode this session |
| Trust previous agent's assumptions | Assumptions compound; one wrong inference produces N wrong deployments |
| Verify by trial-and-error | Too slow; harness behavior is non-obvious from errors |

## Resonance

The frustration was legitimate. Guessing was the problem the entire time. Not the tooling, not the protocol — the willingness to write a profile without reading the docs first. The research agents exist specifically for this. Use them.
