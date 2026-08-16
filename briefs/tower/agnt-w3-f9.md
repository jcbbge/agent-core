# AGNT [f9] — CLI `board <topic>` filter

Read `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/SHARED-PREFIX.md` first — shared prefix. Everything below is your partition.

Mission: wire `cli.mjs` `board` to honor optional topic argv so
`bun <cli> board <topic>` filters like MCP `board_read`. Lock with a test in
`cli.test.mjs`. Do NOT use emojis.

## Pre-Verified Facts (lead verified all of these personally)

See SHARED-PREFIX.md. Partition anchors:
- Defect: worktree `primitives/mcps/tower/cli.mjs` lines 127-130 —
  `const rows = boardFor(cwd)` ignores `process.argv[3]`.
- BEFORE (live, this session): `bun ~/.tower/cli.mjs board` and
  `bun ~/.tower/cli.mjs board tower/w3-plane-fixes` both 53 lines, byte-identical.
- `boardFor(cwd, { topic, limit })` already implemented
  (`tower-ledger.mjs:392` via `lib.mjs` re-export). MCP server already:
  `boardFor(CWD, { topic: args.topic, limit: args.limit })`.
- Tests live in `primitives/mcps/tower/cli.test.mjs` (bun:test). Exemplar
  spawn/read patterns also in `write-path.test.mjs` if needed.

## Parallel Work Notice

See SHARED-PREFIX. Sibling AGNT f1-f4 owns `server.mjs` + `plane-fixes.test.mjs`
+ COMMS-ARCH. Ignore those files.

## Tower

- CLAIM on `tower/w3-plane-fixes` from=`AGNT f9` before edits.
- Findings with before/after line counts.
- No doorbell.

## Tasks

1. **F9 fix** — done when: `board` branch passes optional topic from argv
   (typically `process.argv[3]` after `board`) into `boardFor(cwd, { topic })`
   when present and non-empty. Omitted / empty topic keeps project-wide listing
   (current behavior). Update the usage comment at top of `cli.mjs` if it
   documents `board` without topic.

2. **Test** — done when: `cli.test.mjs` has a real (no mock) test that proves
   filtered output ≠ unfiltered when multiple topics exist for the project cwd,
   OR proves that passing a topic argument changes `boardFor` invocation result
   using the real board file / CLI spawn against the **worktree** CLI path.
   Prefer spawning `bun <worktree>/primitives/mcps/tower/cli.mjs board …`
   with cwd `/Users/jrg/agent-core` so project scope matches live board.

3. **Local live check (worktree binary)** — done when: you run
   ```
   bun "$PWD/primitives/mcps/tower/cli.mjs" board
   bun "$PWD/primitives/mcps/tower/cli.mjs" board tower/w3-plane-fixes
   ```
   from cwd `/Users/jrg/agent-core` and record line counts proving they differ
   (post a finding with both counts). If the topic has zero rows, post a probe
   row first via `bun ~/.tower/cli.mjs post note tower/w3-plane-fixes "F9 probe …" --from 'AGNT f9'`
   then re-compare.

4. **Marker** — done when:
   `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/workers/f9.done`
   exists with test tail + the two line counts.

## Constraints

- Touch ONLY (under your spawn worktree cwd):
  - `primitives/mcps/tower/cli.mjs`
  - `primitives/mcps/tower/cli.test.mjs`
- Also allowed: `.done` marker under
  `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/workers/`
- Do not edit `server.mjs`. Do not commit. Do not patch main-tree live files.

## Report back with

- Diff summary for cli.mjs + cli.test.mjs.
- `bun test cli.test.mjs` tail from worktree tower dir.
- With-topic vs without-topic line counts (worktree CLI).
- Deviations with reasons.
