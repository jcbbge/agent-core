# ORCH [w2-consumer-resilience] — Tolerant readers that COUNT (concierge ruling)

You own ONE unit: make every Tower consumer survive bad JSONL rows and
**surface a visible integrity count**. Compaction is ruled NO — this is the
fix. Do NOT use emojis.

Your CORD is `CORD [Tower]` (w2Y:p1). Field refs: claim child work against
`ph-msrpa83e-efs6` (work-available this brief) once you start; heartbeat
claims (ttl 30s). Emit work-done with `ref` when closed.

## Pre-Verified Facts (CORD 2026-08-13)

1. Concierge ruled compaction NO:
   `briefs/tower/bus-data/CONCIERGE-RULING-compaction.md` — prefer tolerant
   parsers that COUNT over rewriting the append-only board.
2. 26 malformed board lines remain in place (historical); recovery rows
   already appended. Writer hardening is bus-data's lane (flock) — do not
   steal their claimed pheromones `ph-msro2bbg-xpzs` / `ph-msrosz2u-zaf2`.
3. Canonical code: `~/agent-core/primitives/mcps/tower/` +
   `primitives/hooks/tower-ledger.mjs`. Work in a **git worktree**; main
   checkout serves live symlinks.
4. Known consumers: `tower-ledger` `readAll`/`boardFor`/`inboxState`,
   `cli.mjs`, `server.mjs` MCP, `twr.ts`, `statem`, hooks, spine
   `40-tower-bridge` / `10-notify`. Audit each; fix in canonical paths.
5. Board topics: `tower/w2-consumer-resilience` + gate on
   `tower/fully-operational`. Stigmergy required — field is the scheduler.
6. COMMS-ARCH update in scope: document that consumers MUST tolerate and
   count bad rows; compaction deferred (cite ruling path).

## Tasks

1. **Core parse path** — done when: `tower-ledger.mjs` (and any thin
   wrappers) skip-and-count malformed lines; expose a stable integrity
   signal (e.g. `{ badRows, lastBadOffset }` or equivalent) readable by CLI
   status and/or `board`/`inbox`.
2. **Surfaces** — done when: `cli.mjs status` (or dedicated verb) shows the
   count; MCP paths do not throw on bad board/ledger lines; twr/statem
   either tolerate or have a named GAP filed on the board with evidence.
3. **COMMS-ARCH** — done when: short section records the concierge
   compaction ruling + consumer-tolerance law.
4. **Tests + live proof** — done when: tests cover skip-and-count; live run
   against real `~/.tower/board.jsonl` prints non-zero bad count matching
   ~26 (re-measure); bus stays up (`cli status` EXIT 0).
5. **Field close** — done when: `work-done` ref `ph-msrpa83e-efs6` with
   evidence path; board FINAL; `.done` marker.

## Constraints

- Do not compact/rewrite board.jsonl. Do not steal bus-data flock claims.
- Worktree only. No push. Visible panes. Evidence mandatory on every emit.
- Heartbeat every claim you hold (~ttl/3).

## Report back with

SHAs, integrity count live, consumer matrix (fixed/GAP), pheromone ids.
