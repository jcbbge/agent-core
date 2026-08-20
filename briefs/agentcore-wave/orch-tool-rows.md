# ORCH [tool/ coverage — 8 unrowed binaries]

slug: `tool-rows` · branch: `wave/tool-rows` · depends on: `orch-registry-vcs` landing first

Read `CONTRACT.md` in this directory first.

## Mission

The `tool/` primitive type exists to assert that a tool's binary is present and
not stale — `binary machine <path>` checks "executable, and no older than its
source tree." It currently covers **4 binaries out of 13**. Eight installed
binaries that skills actively instruct agents to run have no row at all, so a
missing or stale one produces no audit failure. Four of the five utensils in the
search family are in this state: a skill tells an agent to run a binary that
nothing verifies exists. Close the gap.

## Pre-Verified Facts (verified 2026-08-20)

Existing `tool/` rows, and the exact shape to copy — `~/.agent-core/registry:860`:

```
primitive tool/slim
  source ~/agent-core/primitives/tools/slim/build.zig
  binary machine ~/.local/bin/slim
end
```

Rows present: `tool/slim` (:860), `tool/latch` (:865), `tool/vein` (:870),
`tool/assay` (:875). Nothing else.

Binaries installed, unrowed, each confirmed with `command -v` this session:

| Tool | Path | Has skill row? | Source tree in store? |
|---|---|---|---|
| coraline | `~/.cargo/bin/coraline` | `skill/coraline` | no — vendor CLI |
| colgrep | `~/.cargo/bin/colgrep` | `skill/colgrep` | no — vendor CLI |
| pickbrain | `~/.cargo/bin/pickbrain` | `skill/pickbrain` | no — vendor CLI |
| composto | `/opt/homebrew/bin/composto` | `skill/composto` | no — vendor CLI |
| rg | `/opt/homebrew/bin/rg` | none | no — vendor CLI |
| component-verify | `~/.local/bin/component-verify` | none | `primitives/tools/component-verify/` |
| fleet-task | `~/.local/bin/fleet-task` | none | `primitives/tools/fleet-task/` |
| agent-core | `/opt/homebrew/bin/agent-core` | `skill/agentcore` | `primitives/../cli/` |

- `~/agent-core/primitives/tools/` contains: `assay`, `bigfile`, `boot-card`,
  `component-verify`, `fleet-task`, `latch`, `slim`, `statem`, `vein`,
  `_deprecated`, `README.md`.
- `boot-card` and `statem` have source trees and **no installed binary**. They
  are OUT OF SCOPE for you — a sibling orchestrator (`orch-tools-fate`) is
  gathering evidence on whether to build or deprecate them. Do not add rows for
  them and do not build them.
- `tools/README.md` records that `coraline`, `colgrep`, `pickbrain`, `composto`
  and `rg` are "Vendor CLIs on PATH", i.e. not built from this store.
- Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## The design problem you must solve

`binary` checks "executable and no older than `source`". For the four vendor
CLIs and `rg` there is **no source tree in the store**, so there is nothing for
the freshness half of the check to compare against. Determine what `source` must
point at for a sourceless vendor binary, by reading
`~/agent-core/cli/src/presence.zig` — it owns `binary` semantics — and
`~/agent-core/cli/src/registry.zig` for how `source` is parsed and whether it is
required.

Pick whichever of these the code actually supports, and say which and why:

- a row form that asserts presence/executability without a freshness comparison;
- pointing `source` at the tool's own skill file, so a documented-but-uninstalled
  tool fails;
- extending the CLI (**last resort** — if you go here, stop and deposit a
  `question` first, since it changes shared machinery mid-wave).

Do not guess and do not fabricate a verb the grammar does not have. If the
grammar cannot express presence-without-freshness, that is a finding worth more
than a wrong row.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `cli/src` and `primitives`.
2. Read `presence.zig` and `registry.zig`; determine the correct row form for a
   sourceless vendor binary. Record the file and line you concluded it from.
3. Add rows for the eight binaries above. Group them in one appended block with
   a dated comment explaining what the block is and why `tool/` coverage
   mattered — cite that four of five search utensils had skills pointing at
   unverified binaries.
4. Run `agent-core status`. Every new row must be ✓. If one reports ✗, the row is
   wrong or the tool is genuinely broken — determine which, and fix or report.
5. Update the `tool/` gap entry in `primitives/COMPONENTS.md`: correct the
   "4 of 13" count, and delete gap 2 if you fully closed it (per that file's
   maintenance rule, closed gaps are deleted, not marked done).
6. Commit. Deposit `done`.

## Done-when

- `grep -c "^primitive tool/" ~/.agent-core/registry` → 12.
- `agent-core status` reports 0 stale, 0 missing, and every `tool/*` row ✓.
  Paste the summary line and the `tool/` rows.
- The row form you chose for sourceless binaries is justified in your report by
  file and line from `presence.zig`.
- `primitives/COMPONENTS.md` count corrected, committed on `wave/tool-rows`.

## Report-back

Deposit `done` to `concierge` with: the summary line, the 12 `tool/` rows, your
chosen row form plus its `presence.zig` citation, and any tool that turned out to
be genuinely stale or missing. Write `orch-tool-rows.md.done`.
