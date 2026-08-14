# W1 — Tower hooks surgery (refiners-fire fix, Phase 0)

## Mission
Two surgical fixes to live Tower hooks: delete the dead SurrealDB probe from Claude Code's session-start hook, and fix the enforce-brief gate's regex + error message. Audit source: `~/agent-core/AUDIT-2026-08-11-refiners-fire.md` P1-2 and P1-6.

## Pre-Verified Facts (verified today by the coordinating audit)
- `~/.tower/hooks/session-start.mjs` lines ~48-71 POST to `http://127.0.0.1:6000/sql` (SurrealDB, retired 2026-08-02) on EVERY Claude Code SessionStart, 1.5s timeout; on success it would inject advice to call retired `mcp__alembic__*` tools. The pi port (`~/.pi/agent/extensions/tower-lifecycle.ts`) already dropped this block.
- `~/.tower/hooks/enforce-brief.mjs` line 36 regex: `/done when|done condition|exits? 0|must pass|pass criterion/i` — rejects the natural phrasing `Done-when:` (hyphen). Cost the coordinator 3 blocked spawn rounds today. Its error message does not state the accepted phrasings.
- These hooks are LIVE — they run in real sessions. Bad syntax bricks session starts / agent spawns machine-wide. Test before you finish.
- The rtk PreToolUse rewrite is active in Claude Code panes but you are a pi pane — still, for any evidence-grade comparison use full binary paths (/usr/bin/diff, /bin/cat).

## File partition — touch ONLY these
- `~/.tower/hooks/session-start.mjs`
- `~/.tower/hooks/enforce-brief.mjs`
Nothing else. Never commit anything. No git commands.

## Tasks
1. **session-start.mjs**: read the whole file, locate the SurrealDB block (the `127.0.0.1:6000` fetch and everything that consumes its result, including any alembic-advice injection), delete it cleanly. Done when: zero occurrences of `6000`, `surreal` (case-insensitive), or `alembic` remain in the file, AND `echo '{}' | bun ~/.tower/hooks/session-start.mjs` exits 0 and still prints the surviving context (handoff/flight/inbox logic intact).
2. **enforce-brief.mjs**: (a) line ~36: extend the done-when regex to also accept hyphenated/flexible forms — use `/done[\s-]?when|done[\s-]?condition|exits? 0|must pass|pass criterion/i`; (b) update the block-message so each missing-section line states the exact phrasings the regex accepts (e.g. "add a 'done when'/'done-when' condition per task"). Done when: `bun ~/.tower/hooks/enforce-brief.mjs` fed a crafted stdin JSON payload (tool_input.prompt ≥400 chars containing "Pre-Verified Facts", "TOWER-WAIVED: x", "Report back with", and "Done-when:" — hyphenated) exits 0, AND a payload missing all sections still exits 2 with the improved message.

## Tower
Post to board topic `agent-core/refiners-fire`: one `finding` per task completed (one line: what changed + verification evidence), and a final `finding` starting `DONE W1:` summarizing both. Use the tower MCP tools if present in your harness, else append JSON lines to `~/.tower/board.jsonl` per the documented fallback format (`{"id","ts","cwd","type":"finding","from":"agnt-tower-hooks","topic":"agent-core/refiners-fire","body":"..."}`).

## Report back with
Final message AND the board DONE post must carry: files changed, exact deletions/edits (line ranges), verification command outputs (exit codes for both enforce-brief test payloads and the session-start smoke run). LAST action, after the board post: `touch ~/agent-core/briefs/refiners-fire/w1.done`. The .done marker is the completion signal — write it only after every done-when above is verified.
