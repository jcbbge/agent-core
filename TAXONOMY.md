# Agent-Core Taxonomy
**Updated:** 2026-08-14

This file is a **counts snapshot**, not the inventory. For the living, narrative
inventory of the whole agent estate (planes, gates, instruments, defects) —
read **`~/agent-core/AUDIT-2026-08-14-topology.md`**. Re-derive this table from
`~/.agent-core/registry` and `ls primitives/*` rather than hand-editing counts
by memory; it rots the moment it's typed by hand (see the 06-28 version this
replaced — it was three harnesses and 27 skills stale by the time anyone
looked again).

---

## Summary (counted live this session)

| Category | Count | Notes |
|----------|-------|-------|
| Harnesses | 3 (+1 pseudo) | pi, claude-code, cursor; `machine` is a check-only pseudo-harness (no config-dir profile) |
| Directives | 3 | per-harness deltas in `primitives/directives/` (`pi.md`, `claude-code.md`, `cursor.md`); canonical core is `primitives/AGENTS.md`, composed into each entrypoint by `agent-core sync` |
| Commands | 2 | `tabs.md`, `tower.md` |
| Skills | ~87 | flat `.md` or `<name>/SKILL.md`; `_attic/` holds retired flats |
| Hooks | ~20 | shell/`.ts`/`.mjs` across claude-code, cursor, pi bodies (write-gate, spawn-door, slim-guard, Tower ledger/ pheromone, credential-guard, session-boundary, herdr-*, stop-verdict, …) |
| Rules | 10 | store-only, read on demand (no `inline_agents` deploy currently registered) |
| Subagents | 10 | `architect`, `coder`, `debugger`, `peer`, `reviewer`, `scout`, `sigil-distiller`, `tabs-processor`, `test-writer`, `worker` |
| Plugins | 4 + attic | `peer-session.ts`, `propose-extension.ts`, `tower.ts`, `uptime.ts`; `_docs/` alongside; retired pi extensions live in `~/.pi/agent/extensions/` history, not here |
| Tools | 11 dirs | `slim`, `latch`, `vein`, `assay`, `bigfile`, `boot-card`, `component-verify`, `fleet-task`, `statem`, plus `_deprecated/` |
| Registered primitives | 77 | `grep -c '^primitive ' ~/.agent-core/registry` |
| `agent-core status` | 249 ok / 1 stale / 0 missing | 1 stale is a known, out-of-scope cursor hook divergence (see AUDIT doc P2 backlog) |

---

## What changed since the 2026-06-28 version

- opencode dropped entirely (2026-08-11) — this file's "10_plugins" numbered
  folders and opencode-era structure no longer exist; primitives live flat
  under `primitives/<category>/`, not `NN_category/`.
- cursor registered as a full third harness (2026-08-12), with parity
  extended to most skills.
- kotadb retired from super-search (2026-08-14) — search is now an honest
  5-layer router (colgrep, coraline, pickbrain, ripgrep, bigfile).
- Registry gained check-only verbs (`link`/`check`/`binary`) and the
  `machine` pseudo-harness (2026-08-14) for estate that was live but
  invisible to `agent-core status`.
- Counts above are lower than 06-28's stale 108 total mainly because that
  total was never accurate — it undercounted skills/hooks/subagents already
  in the store and listed directives/hooks counts that didn't match `ls`.

## Project-specific primitives (unchanged in spirit)

Arc (`~/infinity/arc/.claude/skills/`) and Bento
(`~/infinity/bento/.claude/skills/`) keep project-scoped skills out of this
store. Not re-audited this pass — see their own repos for current counts.
