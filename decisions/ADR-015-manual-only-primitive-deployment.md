# ADR-015: Manual-only primitive deployment — scripts eliminated

**Date:** 2026-03-16
**Status:** Accepted
**Supersedes:** ADR-010 (copy-and-transform strategy), ADR-011 (research-first onboarding)

## Context

Agent Core had accumulated sync scripts for deploying primitives across harnesses: `sync.sh` at the repo root, plus `sync.py` files inside each harness directory. These scripts attempted to read `registry.json` and push primitives to the correct config locations for each harness.

In practice they failed silently and inconsistently — they would "run" without errors but miss primitives, apply wrong formats, or deploy to stale paths. The core problem was structural: each harness has meaningfully different config formats, file paths, and reload semantics. A single script abstraction was too thin to capture the differences reliably. When it broke, it was hard to diagnose because the scripts themselves became the source of truth rather than the harness's actual documentation.

The breaking event was Slate harness onboarding: a sync.py was built and deployed, but the MCP type had to be `"remote"` (not `"http"`), commands needed a specific template format, and AGENTS.md had its own lookup order distinct from other harnesses. The script handled none of this correctly without custom-casing every harness — at which point the script was just manual work with extra steps.

## Decision

Primitive deployment is manual. No sync scripts, no adapters, no automation layer.

Each harness has a `HARNESS.md` that documents exact config file paths, exact formats with examples, and a step-by-step manual update procedure for each primitive. When a primitive changes, an assistant reads the relevant HARNESS.md and makes the specific targeted edit.

## Consequences

**Easier:**
- Failures are visible — a wrong config is wrong, not silently overwritten
- Harness-specific quirks are documented where they matter, not buried in script logic
- Any assistant can perform an update by reading a single file
- Adding a new harness requires only writing a HARNESS.md, not an adapter

**Harder:**
- Updates across all four harnesses require four separate manual steps
- No single command to "sync everything"
- Drift is possible if a change is applied to some harnesses but not others

**New problem created:**
- Drift detection is now manual — no automated audit that catches when harnesses are out of sync with schema

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Fix and maintain sync scripts | Scripts were the source of silent failures; fixing them required custom-casing every harness quirk, which is manual work with extra steps |
| Symlinks from harness configs to schema | ADR-010 already established copy-and-transform; symlinks break when harnesses expect specific formats, and some configs (like slate.json) merge many primitives into one file |
| Single unified config with per-harness adapters | Same fundamental problem — the adapter layer becomes where all the drift and bugs live |

## Resonance

The scripts created confidence that wasn't earned. They ran. They printed success messages. The primitives might or might not have actually deployed correctly — you wouldn't know until something broke mid-session. The manual approach is slower but honest. The HARNESS.md is the contract. You read it, you do the thing, you verify it. No hidden layer.
