# COMMS-ARCH — the fleet↔operator communications substrate

Status: DESIGN OF RECORD (2026-08-10, operator mandate: "well thought out,
implemented right now"). Supersedes the fabrication behavior of
TOWER-AUTO-CONTRACT §9 where they conflict; the contract doc gets amended to
match this, not the other way around. Consumers who defer to this file for
comms law rather than restating it: `control-flow.md` §Communications,
`tower-orchestration.md` (top-of-file pointer). `spawn.md`'s Fleet-mail
topics section states the same project-namespacing rule as §Project
isolation below, independently — consistent, not contradictory, kept as
two angles (mechanics there, policy here) rather than collapsed.

## The one rule

**Every message has exactly one audience, and reaches it exactly once, in
full.** Everything below is a corollary.

**Companion (enforced):** the *hierarchy and escalation budget* that keep the
operator plane rare live in [`RESPONSIBLE-PARTY-AND-NQ.md`](RESPONSIBLE-PARTY-AND-NQ.md)
— every spawned agent has a durable responsible party (its parent), a question
climbs ONE link up per turn with an `nq` budget (default 3), and reaches the
human only after the budget is spent. That file makes this section's "the
operator NEVER receives fleet mail verbatim; the coordinator exercises
judgment" mechanical, and fixes the 2026-08-11 storm (a human reply now closes
the question; questions surface to one party, not every pane).

## Five planes, strictly separated

1. **STATUS (observability)** — herdr pane states + board `finding` lines.
   Who is alive, working, blocked, done. Pull-based: anyone who cares reads
   it (sidebar, `herdr api snapshot`, board tail). NEVER converted into
   mail. Never triggers a relay obligation.
2. **FLEET MAIL (agent→agent)** — briefs, CLAIMs, DONE reports, rulings.
   Addressed hierarchically: worker→its orchestrator, orchestrator→the
   coordinator. Carried on the board (topic-scoped) or direct pane prompt
   with verified submit. The operator NEVER receives fleet mail verbatim —
   the coordinator reads it, exercises judgment, and reports what matters.
3. **OPERATOR MAIL (→ operator)** — the ONLY plane the relay guard
   enforces. A row qualifies only if explicitly addressed: `to: "operator"`.
   Legitimate senders: the coordinator does NOT need this plane (its output
   IS the operator conversation); agents use it only for genuinely
   operator-urgent items the coordinator cannot answer (external
   credentials, destructive-action approval) or when no coordinator exists
   (headless fleets). Delivered once, full text, then acked.
4. **OPERATOR DIRECTIVES (operator → fleet)** — flow through the
   coordinator (the conversation) or directly into a pane. When direct, the
   receiving agent records it on the board so the coordinator's picture
   stays whole.
5. **STIGMERGIC FIELD (environmental)** — machine-facing, decaying,
   non-addressed coordination signals on `~/.tower/pheromones.jsonl`.
   Emitted with mandatory evidence; observed only through the scoped field
   reader `pheromoneField`. NO addressee; NEVER relayed. NEVER operator
   mail; never enter the ledger inbox planes. The `route` field is a
   derivation hint (`to_pane` > `to_role` > lineage > topic-scope), not an
   address. TTLs per D5 (`work-available` 15–60 min, `work-claimed` 30s +
   heartbeat, `work-done` 24h, `need-help` nQ-bounded) with read-time
   evaporation over the append-only log (the log never shrinks). The one
   rule survives: each plane keeps exactly one audience discipline; the
   field's audience is whoever the route derives to at read time.

## Hard invariants

- **Addressing is explicit.** Ledger rows carry `to`. Rows without `to` are
  legacy: kind `question` defaults to operator-visible (a blocked agent is
  always worth surfacing) and kind `alert` stays operator-visible (a
  mis-routed alarm is worse than a noisy one); everything else defaults to
  fleet mail, NOT operator mail.
- **No fabrication.** No component invents mail from status transitions.
  (40-tower-bridge on_done fabrication: OFF by default as of 2026-08-10;
  flag file ~/.tower/bridge-fabricate-done re-enables for headless fleets.)
- **No truncation.** If a message enters a plane, it enters whole. Preview
  tokens (herdr `verdict`/`task`) are display strings and may never be
  stored as message bodies.
- **The coordinator plane is exempt from bridging.** The operator-facing
  session's own turns are already delivered; bridging them creates echo
  loops. (~/.tower/bridge-exempt, one pane id per line; enforced by
  10-notify and 40-tower-bridge.)
- **Delivery is verified at the substrate.** Any component that types into
  an agent pane must observe the submit (status flip or transcript echo)
  or report non-delivery. A send without evidence is a non-send.
- **Dedupe by id, ack by id.** A message is relayed/acted on at most once;
  acks reference exact ids; re-renders of already-acked ids are forbidden.
  `work-claimed` and `work-done` pheromones carry `ref` to the exact
  pheromone ids they reference.

## What each existing component becomes

| Component | Today | Under this design |
|---|---|---|
| 40-tower-bridge `done→deliverable` | fabricates truncated operator mail from every done flip | OFF (flag-gated). Status stays on the status plane |
| 40-tower-bridge `blocked→question` | ledger question row | KEEP — blocked is the one status that is legitimately operator-relevant; row gains `to:"operator"` |
| 10-notify board lines | narrates every flip incl. coordinator | KEEP for fleet panes (status plane); exempt list honored |
| stop-guard.mjs / UserPromptSubmit injector | forces verbatim relay of EVERY unacked deliverable | enforces ONLY `to:"operator"` rows (and legacy questions); everything else never enters the inbox |
| tower_send / board posts by agents | deliberate mail | unchanged — this is the only way mail is born |
| herdr `verdict` token | stored as message body (truncated) | display-only, everywhere |
| `pheromones.jsonl` / pheromone emit | (none) | fifth plane: STIGMERGIC FIELD — append-only stream; read via `pheromoneField` only; never relayed, never operator mail |

## Migration order (small, safe, reversible)

1. DONE 2026-08-10: bridge-exempt (coordinator echo loop killed).
2. DONE 2026-08-10: fabrication off by default (status ≠ mail).
3. DONE 2026-08-10: inboxState (lib.mjs) — the single choke point for
   stop-guard, prompt injector, and relay tooling — admits only
   to:"operator" deliverables (+ alerts, + open questions).
4. PARTIAL (verified 2026-08-10): `blocked` questions DO get `to:"operator"`
   — `bin/handlers/40-tower-bridge`'s `on_blocked()` sets it explicitly.
   Still open and load-bearing: `~/.tower/server.mjs`'s `send_to_user` tool
   — the only way an agent mints a `deliverable`/`alert` row — never sets
   `to` at all (its `entry` literal has no `to` field, and its `inputSchema`
   doesn't even expose the param). Consequence, confirmed against
   `inboxState()`'s filter (`lib.mjs`): a `deliverable` row without
   `to:"operator"` can NEVER enter `unrelayed`, so it can never block the
   Stop-hook guard — the verbatim-relay guarantee (tower-orchestration.md
   §The verbatim guarantee) currently fires for `alert` only (alerts default
   operator-visible when `to` is absent), NOT for `deliverable`. Fix:
   `send_to_user` must mint `to:"operator"` on `deliverable`/`alert` rows
   (or accept an explicit `to` param, defaulting to `"operator"`).
   **IMPLEMENTED 2026-08-13 (w3-plane-fixes):** `server.mjs` `send_to_user`
   defaults `to:"operator"` on deliverable/alert; optional `to` param exposed.
5. Amend TOWER-AUTO-CONTRACT.md to reference this file; delete the §9
   fabrication clause. Confirmed still open (2026-08-10): the file has zero
   references to COMMS-ARCH or "fabricat", and its §9 step 5 ("WS-2 handler
   specifics") still literally specifies unconditional deliverable
   fabrication on `done` + `$verdict` — the exact behavior migration item 2
   turned off by default in code without amending the spec that mandated it.
6. Truncation: any surviving path that stores a preview token as a body is
   a bug; bodies come from the message source (board post text, pane
   transcript slice), never from status tokens. Confirmed still open
   (2026-08-10): `40-tower-bridge`'s `on_done()`, when fabrication is
   re-enabled via `~/.tower/bridge-fabricate-done` (the documented
   headless-fleet path above), stores the raw `$verdict` token verbatim as
   `message` — no sanitizer — unlike `10-notify`'s board line for the same
   event, which runs it through `distill_outcome()` first. Fix: route
   `on_done()`'s deliverable body through the same sentence/word-boundary
   sanitizer 10-notify uses (or the pane's screen tail), not the raw token.

## Notifications (operator rubric, 2026-08-10)

A toast is a SUMMONS, and summonses are rare. "Status is not mail" extends
to: **status is not a toast.**

- Notify ONLY for: (1) TASK COMPLETION — an ORCH finishing its unit of work
  (cycle landed / gate verdict / final report posted); (2) a genuine
  operator summons (blocked question addressed to the operator); (3) an
  alert. NEVER for AGNT/SAGT activity or completions — those are status
  plane (board/CTRL pane) only.
- Content must be contextual and readable at a glance: role + HUMAN work
  name + outcome ("ORCH c004-ux — cycle complete, gate green 450/0"), never
  ids, never truncated token fragments.
- Pace: if a notification would fire within 60s of a previous one from the
  same source, coalesce or drop — a flashing stream is the same as silence.
- If the display duration is configurable, it must be long enough to read;
  if not, the content must survive in the Tower inbox so a missed flash
  costs nothing.

## Project isolation (operator, 2026-08-10)

Tower is isolatable to the repo the work belongs to:
- Every row carries `cwd`; ALL project-scoped reads go through the scoped
  readers (boardFor/inboxState — normCwd collapses worktrees onto their
  repo). Raw unscoped file reads are the machine-plane coordinator's
  privilege only.
- Fleet-mail TOPICS are namespaced `<project-slug>/<topic>` (e.g.
  `future/c004`). Un-namespaced topics are reserved for machine-plane infra
  (statem, comms, fleet).
- Agents post from their real working cwd (a worktree is fine — it
  collapses); never from scratch/temp dirs.
- TOWR panes are project-scoped by construction; the machine plane is the
  ONLY surface that sees across projects.

### Reading scoped (2026-08-10)

`boardFor` / `inboxState` (lib.mjs) and `twr.ts` (which reads through
`boardFor`) are the only sanctioned project-scoped readers — do not grow a
second scoping implementation. A raw `readAll(BOARD)`/`readAll(LEDGER)` or
any direct read of `board.jsonl`/`ledger.jsonl` is a machine-plane privilege
and must be declared as such at its call site.

`board_post` refuses scratch/temp cwds (server.mjs) and rejects authored board
rows without non-empty `from` (claim|finding|note). The pi fallback is
`bun ~/.tower/cli.mjs post` (brief SKILL.md) — same schema, same guards.
Hand-append to `board.jsonl` is banned in docs; there is still no kernel
lock on the file itself (see Board row schema below).

### Board row schema (2026-08-13)

Two families coexist on `board.jsonl`; readers must tolerate both:

| Family | Discriminator | Required fields | `from` |
|---|---|---|---|
| **Authored fleet mail** | `type` (claim \| finding \| note) | `id`, `ts`, `cwd`, `topic`, `body`, `from` | Required non-empty at write time (`board_post`, `cli.mjs post`) |
| **Machine emission** | `kind` (e.g. lineage, bypass-audit) | `ts`, `kind`, `via` | Must not be invented; readers use `from ?? '?'` |

Authored rows never carry `kind`; machine rows never carry authored `type`.
Append-only JSONL, one object per line, newline-terminated (`tower-ledger.mjs`
`append`). No file lock on append — concurrent writers may interleave lines;
cursor locks exist only for read cursors, not writes.

### JSONL consumer integrity (2026-08-13)

Tower JSONL files (`board.jsonl`, `ledger.jsonl`, `pheromones.jsonl`, …) are
append-only. Malformed lines can exist from historical concurrent writes or
hand-edits; consumers must not throw on them.

- **Skip-and-count is mandatory.** Every consumer that reads JSONL MUST tolerate
  unparseable lines: parse what you can, skip what you cannot, and surface a
  count. Use `parseJsonl(text)` or `readJsonlStats(file)` from
  `tower-ledger.mjs` (re-exported via `lib.mjs`). Returned shape:
  `{ rows, bad_line_count, bad_line_numbers }` — `rows` holds only successfully
  parsed objects; `bad_line_numbers` lists 1-based line indices of damaged
  lines. Missing file → zeros / empty rows.
- **Scoped readers already comply.** `readAll`, `boardFor`, and `inboxState`
  route through tolerant parsing; they must never throw solely because a line
  fails `JSON.parse`.
- **Surface the count.** `bun ~/.tower/cli.mjs board` prints an integrity
  summary line when the global board has unparseable rows (machine-plane
  privilege). `cli status` mirrors the same line. A bus that hides damage is
  worse than one that reports it.
- **Compaction is DEFERRED.** Physical rewrite or truncation of `board.jsonl` to
  remove bad lines is banned. Ruling and rationale:
  `briefs/tower/bus-data/CONCIERGE-RULING-compaction.md` — fix readers once;
  keep the append-only record intact.
