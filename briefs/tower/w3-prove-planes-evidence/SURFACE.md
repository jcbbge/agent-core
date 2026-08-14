# W3 prove-planes — SURFACE checklist (AGNT w3-surfaces)

Evidence root: `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`. Probed 2026-08-13 from cwd `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2y-p6` unless noted. Doorbell not exercised — gap (by design for surface smoke).

## Surface matrix (20 rows)

| surface | invoked how (exact) | result summary | pass/fail/gap | evidence pointer |
|---------|---------------------|----------------|---------------|------------------|
| MCP `send_to_user` | `CallMcpTool tower send_to_user { kind: "progress", from: "AGNT w3-surfaces", message: "W3 surfaces probe..." }` | Delivered `t-msrktcp7-kn4o` (progress); non-blocking ambient | pass | `raw/surfaces/mcp-send_to_user.txt` |
| MCP `ask_user` | `CallMcpTool tower ask_user { from: "AGNT w3-surfaces", question: "W3-SURFACE-PROBE: reply with exactly SURFACE-OK..." }` | Open question `t-msrktev3-k02o` created | pass | `raw/surfaces/mcp-ask_user.txt` |
| MCP `reply` | `CallMcpTool tower reply { question_id: "t-msrktev3-k02o", answer: "SURFACE-OK (probe answer — not operator)" }` | Answer recorded; asking agent can receive via check_inbox | pass | `raw/surfaces/mcp-reply.txt` |
| MCP `check_inbox` | `CallMcpTool tower check_inbox { from: "AGNT w3-surfaces" }` then `{ question_id: "t-msrktev3-k02o" }` after reply | Pre-reply: still_unanswered=[t-msrktev3-k02o]; post-reply: answers=[{question_id, answer, ts}], still_unanswered=[] | pass | `raw/surfaces/mcp-check_inbox.txt` |
| MCP `mark_relayed` | `CallMcpTool tower mark_relayed { ids: ["t-nonexistent-probe-id"] }` | Returns success "Acknowledged 1 message(s)" for nonexistent id — no validation | gap | `raw/surfaces/mcp-mark_relayed.txt` |
| MCP `board_post` | `CallMcpTool tower board_post { topic: "tower/w3-probe-surfaces", type: "note", from: "AGNT w3-surfaces", body: "..." }` | Posted `t-msrktczp-a40w` | pass | `raw/surfaces/mcp-board_post.txt` |
| MCP `board_read` | `CallMcpTool tower board_read { topic: "tower/w3-prove-planes", limit: 5 }` | Returns rows with **full** body text (no 100-char cut); e.g. finding bodies returned verbatim | pass | `raw/surfaces/mcp-board_read.txt`, `raw/surfaces/mcp-board_read-full-body-sample.txt` |
| MCP `relay_inbox` | `CallMcpTool tower relay_inbox { from: "AGNT w3-surfaces" }` | Rendered 2 open questions verbatim; no unrelayed deliverables/alert to ack in this call | pass | `raw/surfaces/mcp-relay_inbox.txt` |
| MCP `pheromone_emit` | `CallMcpTool tower pheromone_emit { scent: "work-available", topic: "tower/w3-probe-surfaces", from: "AGNT w3-surfaces", payload_ref: ".../surfaces-probe-marker", evidence: ".../mcp-pheromone-emit.txt" }` | Emitted `ph-msrktfqt-y2zn` | pass | `raw/surfaces/mcp-pheromone-emit.txt` |
| MCP `pheromone_field` | `CallMcpTool tower pheromone_field { topic: "tower/w3-probe-surfaces" }` | JSON buckets: open=2 (work-available from AGNT w3-surfaces), claimed/done/evaporated/help empty for topic | pass | `raw/surfaces/mcp-pheromone_field.txt` |
| CLI `status` | `bun ~/.tower/cli.mjs status` | Tower @ cwd; unrelayed/openQ/progress counts + recent progress lines + burn summary; exit 0 | pass | `raw/surfaces/cli-status.txt` |
| CLI `inbox` | `bun ~/.tower/cli.mjs inbox` | "Inbox clear." at probe time (worktree cwd); exit 0 | pass | `raw/surfaces/cli-inbox.txt` |
| CLI `board` | `bun ~/.tower/cli.mjs board` and `bun ~/.tower/cli.mjs board tower/w3-prove-planes` | **Topic arg ignored (F9):** both print **52** lines, identical first lines; raw `board.jsonl` has **10** rows with `topic=="tower/w3-prove-planes"` (6492 total rows). Returns cwd-scoped dump, not topic-filtered. | **fail** | `raw/surfaces/cli-board-no-topic.txt`, `raw/surfaces/cli-board-with-topic.txt`, `raw/surfaces/board-topic-filter-counts.txt` |
| CLI `post` | `bun ~/.tower/cli.mjs post note tower/w3-probe-surfaces "AGNT w3-surfaces CLI post probe" --from "AGNT w3-surfaces"` | Posted `cli-59a0b9cc-e730-4376-9da4-a85fb269fc4d`; exit 0 | pass | `raw/surfaces/cli-post.txt` |
| CLI `emit` | `bun ~/.tower/cli.mjs emit work-available tower/w3-probe-surfaces ".../surfaces-probe-marker" --from "AGNT w3-surfaces" --evidence ".../cli-emit.txt"` | Emitted `ph-msrktcm1-39cm`; exit 0 | pass | `raw/surfaces/cli-emit.txt` |
| CLI `field` | `bun ~/.tower/cli.mjs field --topic=tower/w3-probe-surfaces` from worktree cwd **and** from `/Users/jrg/agent-core` | Worktree cwd: open=0 (cursor worktree not in normCwd map). Canonical cwd: open=2, lists probe rows; exit 0 both | pass (gap: cursor worktree cwd blind spot) | `raw/surfaces/cli-field.txt`, `raw/surfaces/cli-field-agent-core-cwd.txt` |
| CLI `scan` | `bun ~/.tower/cli.mjs scan --topic=tower/w3-probe-surfaces` from worktree cwd **and** from `/Users/jrg/agent-core` | Worktree cwd: "No pheromone rows". Canonical cwd: 5 annotated rows with state; exit 0 both | pass (gap: cursor worktree cwd blind spot) | `raw/surfaces/cli-scan.txt`, `raw/surfaces/cli-scan-agent-core-cwd.txt` |
| CLI `burn` | `bun ~/.tower/cli.mjs burn` | 7-day rollup + today-by-spawn detail; exit 0 | pass | `raw/surfaces/cli-burn.txt` |
| CLI `all` | `bun ~/.tower/cli.mjs all` | Lists scopes with unrelayed/openQ counts (agent-core, empty scope, tmp drift-ack dirs); exit 0 | pass | `raw/surfaces/cli-all.txt` |
| CLI `projects` | `bun ~/.tower/cli.mjs projects` | "Tower projects — 14 drawer(s)" with stage/rumen/inbox flags; exit 0 | pass | `raw/surfaces/cli-projects.txt` |

**Totals: 17 pass / 1 fail / 2 gap** (mark_relayed validation gap; field/scan cursor-worktree normCwd gap counted once each as gap; board topic filter = fail).

## Truncation (F11)

**Observed:** CLI `board` uses `rowPreview` hard cap **100 characters** (`cli.mjs:21-29`); MCP `board_read` returns **verbatim** body.

**Method:** Compared row `t-msrktj07-ltng` (body len **359**) — MCP/board_read and raw board return full text; CLI `board` output for cwd-scoped rows shows mid-word cut at ~100 chars (49/52 board lines exceed 110 chars because of metadata prefix + truncated body).

**Truncated (CLI) vs full (MCP/raw):**

```
CLI (first 100 chars of body only, mid-word):
FAN-OUT: 4 AGNTs working on w2Y:p4..p7 (board, ledger-verbatim, surfaces, aux-spine). Briefs: briefs

FULL (MCP board_read / raw board.jsonl):
FAN-OUT: 4 AGNTs working on w2Y:p4..p7 (board, ledger-verbatim, surfaces, aux-spine). Briefs: briefs/tower/agnt-w3-{board,ledger,surfaces,aux}.md. Evidence: briefs/tower/w3-prove-planes-evidence/. Schema ruling from bus-data absorbed (two row kinds). F9 pre-probe: CLI board topic arg ignored (52/52). Collecting via board + workers/*.done — not re-prompting.
```

Evidence: `raw/surfaces/truncation-f11-live.txt`, `raw/surfaces/mcp-board_read-full-body-sample.txt`.

## `board <topic>` filter (F9) — authoritative row

See CLI `board` row above: **fail**. Topic positional arg produces **no error** and **no filtering** — 52 lines with and without `tower/w3-prove-planes`; only 10 raw rows match that topic. Matches ORCH pre-probe and audit F9.

## Test plan (not landed)

- Mechanical lock on `board.jsonl` / ledger append paths (audit F7): `withCursorLock` wraps cursor cache only; raw `appendFileSync` unguarded — candidate for ORCH task 7 / CORD gate, not implemented here.
- CLI `board <topic>` should either filter via `boardFor(cwd, topic)` or reject unexpected positional with usage error.
- Shared preview policy: single truncation helper with explicit "...N more chars, use board_read" tail.
- `mark_relayed` should reject unknown ids or report 0 acknowledged.
- Extend `normCwd` to collapse `/Users/jrg/.cursor/worktrees/agent-core/*` → `/Users/jrg/agent-core` (field/scan blind from cursor worktrees).
