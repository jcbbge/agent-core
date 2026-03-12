# ADR-010: Primitive deployment uses copy-and-transform, not symlinks

**Date:** 2026-03-11
**Status:** Accepted

## Context

Agent-core primitives (rules, skills, commands, subagents, etc.) were deployed to harnesses via symlinks pointing from harness-specific paths to the source in `~/Documents/_agents/primitives/`. This broke silently in multiple ways:

- Format differences across harnesses meant symlinked content was wrong (e.g., Claude Code subagent frontmatter ≠ OpenCode subagent frontmatter)
- Symlinks implied identical format, which is false — each harness has its own schema for each primitive type
- A broken symlink target caused no error but resulted in the harness seeing nothing
- Primitives that are not file-based (MCP configs, rules injected via `instructions` array) had no clear deployment path

## Decision

All primitives are deployed via explicit copy or transformation from source to harness-specific paths. Symlinks are deprecated. `sync-primitives.py` is the canonical deploy mechanism.

When formats are identical across harnesses: copy the file.
When formats differ: transform and write harness-native output.
When primitives are config-file entries (MCP, hooks): merge into the config file.

## Consequences

**Easier:**
- Deployment is explicit and auditable — `ls ~/.config/opencode/agents/` shows exactly what OpenCode sees
- Format differences are handled intentionally, not silently wrong
- `sync-primitives.py` is idempotent — run it anytime to re-sync
- Adding a new harness only requires a new profile + transformer function

**Harder:**
- Source changes don't auto-propagate — must run `sync-primitives.py` to push updates
- Two-step workflow: edit source → sync → verify

**New problems:**
- Deployed copies can drift from source if sync is not run — audit script detects but doesn't fix this
- Hook to auto-sync on primitive file write would help but doesn't exist yet

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Symlinks everywhere | Breaks silently on format mismatch; implies identical schema which is false |
| Symlinks where format is identical | Hard to maintain the distinction; introduces a two-tier system that is easy to get wrong |
| Runtime loading from source | Requires harnesses to understand the source path convention; not harness-native |

## Resonance

The symlink felt like a shortcut. It was. Every shortcut that papers over a real difference creates a debt that compounds invisibly until it explodes. The right answer was always: understand exactly what each harness needs, give it exactly that, and make the translation explicit.
