# AGNT — Thorough audit of the Tower message bus (READ-ONLY)

You are a **one-off audit assist**, spawned by the concierge at the operator's request.
Your entire job is to produce **one findings report**. You are the instrument, not the
repair crew.

## Absolute constraints — read these twice

- **READ-ONLY. You change nothing.** No edits to any file under `~/.tower/`,
  `~/agent-core/`, `~/herdr-spine/`, or any project. No `git commit`, no `git add`, no
  branch creation. No deletes. No moves.
- **You must not mutate the bus.** Do not post test rows into `board.jsonl` or
  `ledger.jsonl`. Do not call `mcp__tower__send_to_user`, `ask_user`, `board_post`,
  `pheromone_emit`, or any other writing tool "just to see what happens." **This is a
  live production bus with live fleets on it** — a paused Arc fleet, an active Arc
  retrofit orchestrator, and two Tower orchestrators are all using it right now. A test
  row you inject becomes real mail to a real agent.
- **If you believe a claim can only be settled by writing, do not write.** Record it as
  an *unprovable-by-inspection* finding and say exactly what exercise would settle it
  and what it would cost. That is a legitimate, valuable finding — a fabricated
  conclusion is not.
- **Two orchestrators are actively editing Tower's code right now**
  (`ORCH w0-version-control`, `ORCH w0-canonical-source`). Expect files to change under
  you. Cite a commit sha or quote the line you read, so your findings stay checkable
  after they move.

## The standing rubric — MANDATORY, stamped on every finding

Verbatim from `~/.tower/RESPONSIBLE-PARTY-AND-NQ.md` §3:

> - Does it lead to **craft, beauty, and care**?
> - What choice leads to **world-class DX**?
> - What decision provides a **memorable and lovable UX**?
> - What gets us closer to an **efficient, optimized agentic experience**?

Every finding you report carries a rubric line. **The operator's explicit priority for
this audit is the fourth clause: a 10X agentic experience.** Judge the bus as the
primary consumer does — as an *agent* trying to send, receive, and read under a limited
context window, mid-task, without a human watching. The question behind every finding is
not "is this technically correct" but **"does this make an agent's life 10X better or
10X worse, and what would 10X look like?"**

Concretely, weight these heavily:
- **Silent failure is the cardinal sin.** Anywhere an agent can believe it communicated
  when it did not, or believe it received everything when it did not.
- **Context cost.** Anything forcing an agent to read more than it needs — untruncatable
  dumps, whole-file reads, no filtering, no cursors.
- **Discoverability.** Can an agent figure out the right verb without reading source?
- **Round-trip latency and dead ends.** Questions that can never be answered, mail with
  no reader, states with no exit.
- **Ceremony.** Steps an agent must remember rather than steps the tool enforces.

## The four axes to audit (the operator's framing — cover all four)

### Axis 1 — Agents SENDING
How does an agent get a message onto the bus, by every available path, and what can go
wrong? Paths known to exist: the MCP tools (`mcp__tower__board_post`, `send_to_user`,
`ask_user`, `reply`, `pheromone_emit`); the CLI (`bun ~/.tower/cli.mjs post|emit`); the
herdr-spine handlers that post on an agent's behalf; `fleet-task`'s automatic transition
findings; `statem`'s transition rows; and a **documented hand-built file-append
fallback** (the machine-wide agent context instructs appending a raw JSON line straight
into `board.jsonl` when no MCP is available). For each: what validates the input, what
happens on malformed input, is the write atomic, is it newline-terminated, is it locked
against concurrent writers, and **does the sender learn it failed**.

### Axis 2 — Agents RECEIVING
How does a message reach the agent it was addressed to? `check_inbox`, `relay_inbox`,
`mark_relayed`, `reply`, the `ask_user` round trip, the Stop-guard / verbatim-relay
machinery, notifications and the doorbell. Trace addressing end to end: fleet mail up
the CORD→ORCH→AGNT chain, operator-addressed mail, and the rule that **status is not
mail**. Find every place a message can be written but never read, read but never marked,
or marked without being delivered. Check the human-answer path — `RESPONSIBLE-PARTY-AND-NQ.md`
§4 documents a bug there that caused an outage; verify whether its fix is present.

### Axis 3 — Messages sent TO the bus (ingest)
The write side of the stores themselves: `board.jsonl`, `ledger.jsonl`,
`odometer.jsonl`, `pheromones.jsonl`, `deliverables/`, `flight/`, `cursors/`. Locking,
atomicity, schema/validation, id generation and collisions, timestamp discipline
(mixed `Z` precision is visible in the data), `cwd` stamping, and **project isolation**
— `normCwd` / `boardFor` in `lib.mjs`, `<project>/<topic>` namespacing, and the
git-worktree cwd collapse. Prove or disprove that one project cannot see another's rows
and that a worktree resolves to its project.

### Axis 4 — Messages READ from the bus
Every consumer, and what the read experience is actually like: `cli.mjs` (`status
inbox board scan all projects`), `server.mjs` / the MCP `board_read`, `lib.mjs`,
`twr.ts` (the `TOWR` pane), `ctl-fleet` (the `CTRL` panes), `statem.ts`,
`fleet-task`'s `tower.ts`, the `hooks/`, and the spine handlers. For each: does it
tolerate a malformed row or die, does it silently skip damage, can it filter and paginate
or must it read everything, and is what it returns *usable by an agent* — note that the
`board` CLI verb currently truncates row bodies, so reading one full finding requires
going to raw JSONL.

## Grounding corpus — read across ALL of these, not just Tower

The operator named these explicitly. Tower does not exist alone; its contract is
distributed across the stack, and a finding that ignores the neighbours is a wrong
finding.

| Where | What to read |
| --- | --- |
| **tower** | `~/agent-core/primitives/mcps/tower/` — the NEW canonical git home (commit `5e281be`, branch `tower/w0-version-control`): `cli.mjs`, `server.mjs`, `lib.mjs`, `cli.test.mjs`, `hooks/`, `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, `server-drift.*`. Also `~/.tower/` — the **deployed runtime that actually executes**, plus all state files. |
| **agent-core** | `primitives/rules/tower-orchestration.md`, `primitives/rules/control-flow.md`, `primitives/AGENTS.md` (the file-append fallback instruction lives here), `primitives/profiles/*.md` (what each tier is told about comms), `primitives/tools/statem/`, `primitives/tools/fleet-task/` (esp. `tower.ts`). |
| **herdr-spine** | `bin/handlers/` — `10-notify`, `16-parent-wake`, `40-tower-bridge`, `50-scent-digest`, `_spine_common.py`; `bin/spine-inbox`, `bin/spine-report`, `bin/spine-claim`; `docs/`. This is the pane-event → bus bridge. |
| **herdr** | `~/agent-core/primitives/skills/herdr/SKILL.md` — how agents are told to compose herdr with Tower; the pane-status planes that must NOT become mail. |
| **madewell** | Arc's `.madewell/` as the live seam plus the kernel at `~/madewell` (**read-only — never edit**). How Made Well state transitions become bus traces, via `statem`. |

## Pre-Verified Facts (concierge, 2026-08-12/13 — cited claims, re-verify before relying)

- `board.jsonl`: 5,976 lines / 3.8 MB, of which **26 lines do not parse as JSON**, in
  four modes: non-JSON tool output at lines 1-3 (`1 matches in 1F:`, `[file] 628 (1):`,
  plus a record truncated mid-field); unescaped content (line 553, `Expecting ','` at
  char 393, inside `body`); invalid backslash escape (line 2113, char 1353, inside
  `body`); two objects concatenated with no newline (line 2502, `Extra data` at char
  296).
- Other stores: `ledger.jsonl` 2,654 lines / 1.1 MB, `odometer.jsonl` 1,016 lines,
  `pheromones.jsonl` 14 lines, `deliverables/` ~450 entries, `flight/` ~843 entries.
  **No rotation anywhere.**
- `cli.mjs` usage advertises: `status inbox board post emit field scan burn all projects`.
- MCP tool surface: `ask_user board_post board_read check_inbox mark_relayed
  pheromone_emit pheromone_field relay_inbox reply send_to_user`.
- `statem` posts to topic `statem`; `fleet-task` posts to `<project>/fleet-tasks`.
- Tower's code was untracked until commit `5e281be` today; `~/.tower/` remains the
  executing copy and no deploy/sync mechanism existed as of that commit.

## Deliverable — one report, written to disk

Write **`~/agent-core/briefs/tower-bus-audit-FINDINGS.md`**. That is the only file you
create. Structure it:

1. **Verdict up front** — is the bus trustworthy for agent-to-agent communication today?
   One paragraph, plain, no hedging. If the answer is "mostly, with N ways to lose a
   message," say that.
2. **Findings, ordered by agentic-experience impact** (worst first). Each finding:
   - a one-line claim
   - **evidence**: `file:line` and a quoted snippet, or the exact command you ran and its
     output — never "it appears that"
   - **failure scenario**: concrete — which agent, doing what, loses what
   - **rubric line** (the four clauses, with the agentic-experience judgement explicit)
   - **the 10X move**: what would make this genuinely excellent, not merely fixed
3. **Message-lifecycle map** — one compact diagram/table tracing a message from an
   agent's intent through send, ingest, storage, read, delivery, ack; marking every step
   where it can be silently lost.
4. **Proven vs assumed** — an explicit two-column list. What you drove or read directly
   versus what you inferred. Do not blur these.
5. **What a 10X bus would look like** — short, opinionated, concrete. The operator wants
   direction, not a list of patches.

Then post a **short** summary finding to board topic `tower/bus-audit` (one row, from
your registered name, pointing at the report path). That is the single write you are
permitted, because it is how your work reaches the fleet — keep it to a summary and the
path, and post it exactly once.

## Report back to the concierge

Your final pane output: the verdict paragraph, the count of findings by severity, the
report path, and anything you could not settle without writing. Do not summarise the
whole report into the pane — the report is the artifact.

SOURCES: `RESPONSIBLE-PARTY-AND-NQ.md` §3 (rubric, quoted verbatim), `~/.tower/`
listing + per-line JSON parse of `board.jsonl`, `cli.mjs` usage string,
`~/herdr-spine/bin/handlers/` listing, `~/agent-core/primitives/mcps/tower/` listing at
`5e281be`, `~/agent-core/primitives/tools/` listing — all read by the concierge
2026-08-12/13.
