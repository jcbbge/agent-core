# ORCH [register the bigfile MCP surface]

slug: `bigfile-mcp` · branch: `wave/bigfile-mcp` · depends on: `orch-registry-vcs` landing first

Read `CONTRACT.md` in this directory first.

## Mission

Bigfile is the sanctioned way to navigate a huge source file without destroying
the context window, and a hook actively **denies** native reads of 3k+ line
PHP/JS/TS/TSX files and points agents at it. Its entire usefulness depends on the
MCP server being registered in each harness. Nothing verifies that registration.
Register the MCP surface so a harness that loses it fails an audit instead of
failing an agent mid-task.

## Pre-Verified Facts (verified 2026-08-20)

- Implementation lives at `~/agent-core/primitives/tools/bigfile/`.
- `primitives/tools/README.md` states: "the Bigfile MCP server implementation
  (tree-sitter huge-file navigation). Registered in Claude Code as
  `mcp__bigfile__*` (`~/.claude.json` → `src/server.ts`); in cursor via MCP
  `bigfile`; pi calls the same library / CLI."
- Global MCP servers in `~/.claude.json`: `varlock-docs`, `tower`, `bigfile`.
- MCP servers in `~/.cursor/mcp.json`: `arc`, `bigfile`.
- `command -v bigfile` → **not found**. There is no bigfile binary on PATH; it is
  MCP + library only. Do not add a `tool/` binary row for it.
- The skill covering it is `skill/navigating-big-files` (registered). There is no
  `skill/bigfile`.
- `primitives/HARNESS-PARITY.md`'s bigfile row records its verify command as a
  python one-liner that lists `~/.cursor/mcp.json` mcpServers keys — i.e. it is
  verified by hand, outside the audit, unlike every other registered row.
- Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## The design problem you must solve

The registry grammar has no `mcp` verb. `check <harness> <path>#<needle>` asserts
that a config file contains a needle — which is exactly the shape of an MCP
registration check, since both `~/.claude.json` and `~/.cursor/mcp.json` are JSON
config files that must mention `bigfile`.

Read `~/agent-core/cli/src/presence.zig` and `registry.zig` and confirm `check`
works against these paths before writing rows. Two hazards to verify, not assume:

- `~/.claude.json` is large and machine-generated. Confirm how the CLI reads it
  for a `check` — as text for a substring match, or as structured JSON.
- Choose a needle specific enough that it cannot match incidentally. Bare
  `bigfile` may appear in unrelated places in a large config; consider the
  server's command or script path instead, and justify your choice.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives`.
2. Confirm the current live registrations yourself — read both config files and
   record the exact `bigfile` entry from each, including the command it runs.
3. Add check rows asserting the MCP registration in claude-code and in cursor.
   Pick the type prefix that fits the file's existing conventions and justify it.
4. Verify with `agent-core status` that both rows are ✓. Then **prove the rows can
   fail**: temporarily point one needle at a string you know is absent, confirm it
   reports ✗, then restore it. A row you never saw fail is not evidence. Include
   both outputs in your report.
5. Replace the python one-liner in `HARNESS-PARITY.md`'s bigfile row with the
   `agent-core status` row id, matching how every other registered row in that
   table is verified.
6. Update `primitives/COMPONENTS.md` — bigfile's MCP column and gap 4.
7. Commit. Deposit `done`.

## Done-when

- Rows exist asserting the bigfile MCP registration in claude-code and cursor,
  both ✓.
- You have pasted a `✗` output from the deliberate-break test and the restored `✓`.
- `agent-core status` reports 0 stale, 0 missing. Paste the summary line.
- `HARNESS-PARITY.md` and `COMPONENTS.md` updated, committed on `wave/bigfile-mcp`.

## Report-back

Deposit `done` to `concierge` with the summary line, your rows, the needle you
chose and why, and the break/restore evidence. Write
`orch-bigfile-mcp-row.md.done`.
