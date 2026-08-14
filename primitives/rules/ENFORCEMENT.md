# ENFORCEMENT — every law names its enforcer, or wears the DOCTRINE label

Established 2026-08-14, from the induction the house has now run three times:
write discipline failed as prose and became `grounding-hook` (failure class
extinct); output discipline failed as prose and became `slim` (extinct);
completion discipline failed as prose for months — 518 claims / 146 dones —
and became `write-gate` (probe-proven same day). A law that lives only in
prose is a direct message to a future context window: it must be remembered
to work, and context windows die. A law compiled into a hook or a door is a
trace in the environment — sensed at the moment of action, by any agent, in
any harness. Stigmergy is not just how agents coordinate work; it is how
this system carries its own law.

## The standing rule

Every law in this corpus carries one of three statuses:

- **DOOR** — the sanctioned tool's only open path complies by construction
  (raw alternatives refused or rewritten).
- **HOOK** — a named hook refuses or rewrites violations mechanically.
- **DOCTRINE** — unenforced prose. Honest label, not a tier: a DOCTRINE law
  WILL be violated under pressure. Treat every DOCTRINE row as a compilation
  bug in the queue, not a rule to remember harder.

A new law lands with its enforcer named, or with an explicit DOCTRINE label
and a compilation note. Vows are not a status.

## The ledger

| Law | Source | Enforcer | Status | Coverage |
|---|---|---|---|---|
| Read-before-rewrite (write discipline) | AGENTS.md §Write discipline | `grounding-hook.mjs` / `.ts` (PreToolUse Write/Edit) | HOOK | CC, pi. cursor: DOCTRINE |
| Six-verb output compaction | AGENTS.md §slim | `slim` binary + `slim-guard.sh` / `slim-rewrite.ts` | DOOR+HOOK | CC, cursor, pi |
| Completion = deposit (no silent finish while a claim is live) | COMMS-ARCH §Plane 5; PHASE2 proof | ONE gate, three surfaces (canonical logic only in `write-gate.mjs`): CC Stop hook = exit-2 refusal; pi `agent_end` + `sendUserMessage` injected continuation (`write-gate-pi.ts` → extension shim); cursor `stop` hook + `followup_message` injected continuation (`write-gate-cursor.sh`). All three live-probed 2026-08-14: claim → refuse/inject; deposit → clean stop | HOOK | CC + pi + cursor |
| Spawn through the door (stamp role/name/task, verified submit) | spawn.md; control-flow.md §Naming | `spine-spawn` (DOOR) + spawn-door refusing raw `herdr agent start`: `spawn-door.sh` (CC PreToolUse + cursor preToolUse — deny schema verified against cursor.com/docs/agent/hooks 2026-08-14) + `spawn-door-pi.ts` (pi `tool_call` `{block:true}`; 5-shape parity test) | DOOR+HOOK | CC + pi + cursor |
| Workspace mutations announced (board trace + operator line) | session loop (d)/(e), 2026-08-14 | `spine-workspace` (DOOR) + spawn-door refusing raw `herdr workspace close` (all three harnesses, as above) | DOOR+HOOK | CC + pi + cursor |
| Close needs a reason: Done (proof path) or Parked (pickup path) | control-flow.md §Diagnosis ≠ Land | `spine-workspace close --why` refuses empty reason | DOOR | any harness (CLI) |
| Rulings carry scope (where they apply AND where they do not) | 2026-08-14 overcorrection ping-pong | `spine-ruling --scope` refuses unscoped rulings; deposits `house/rulings` | DOOR | any harness (CLI) |
| Operator relay guarantee (`to:"operator"` mail blocks turn-end) | COMMS-ARCH §Hard invariants | `stop-guard.mjs` + `inboxState()` choke point | HOOK | CC. pi: partial (`tower-lifecycle.ts`) |
| Brief validation on agent spawns | brief SKILL | `enforce-brief.mjs` (PreToolUse `Agent\|Task` — matcher widened 2026-08-14; `Task` spawns bypassed the gate entirely until then) | HOOK | CC (Agent + Task). GAP, deliberate: `Workflow` ungated — its `tool_input` carries `script`/`scriptPath`/`name`, never a `prompt`, and workflow scripts compose prompts at runtime, so a source-text scan would false-block. Rationale in the hook header. Extension pending: refuse provider/model names in briefs (2026-08-14 ruling) |
| Board write integrity (flocked append, authored `from` required) | COMMS-ARCH §Board row schema | `tower-ledger.mjs append` + `board_post` guards | DOOR | all writers via cli/server |
| Alarm validation at emit + read (no empty questions) | COMMS-ARCH §Alarm rationalization | real since 2026-08-14 (was specified-but-fictional): `questionRejectReason()` in `tower-ledger.mjs`; `ask_user` refuses an empty/whitespace `message` and dead-letters the row instead of appending it; `openQuestionRows()` keeps message-less rows out of `openQuestions` on every read and dead-letters them once. Sink `~/.tower/dead-letter.jsonl` (flocked append, `reason` + `dead_lettered_at`). Tests: `dead-letter.test.mjs` (21) | DOOR | all readers/writers via lib/server (MCP server needs a session restart to pick up server.mjs) |
| Concierge holds a claim on the load-bearing thread (loop-escape: no legal stop without deposit or need-help) | concierge.md doctrine 14 | claim emit at thread-open + registered write-gate | HOOK (CC concierge sessions) | others: DOCTRINE |
| Epistemics (acquire before assert; SOURCES lines) | AGENTS.md §Epistemics | none | DOCTRINE | compilation unknown — candidate: commit-msg hook checking SOURCES on external values |
| Reaping (done = gone; no trophy panes) | control-flow.md §Reaping | none mechanical (spine-workspace creates the audit trail) | DOCTRINE | candidate: statem-gated close |
| No provider/model/harness names in briefs or law | AGENTS.md §Fleet spawn; 2026-08-14 ruling | none | DOCTRINE | candidate: extend `enforce-brief.mjs` + a brief-lint in `brief` SKILL |
| Comms: status is not mail; no fabrication | COMMS-ARCH | fabrication OFF by default (flag-gated) | DOOR | all |
| Naming prefixes before agent start | control-flow.md §Naming | `spine-spawn` stamps; raw path refused by spawn-door (all three harnesses) | DOOR+HOOK | CC + pi + cursor |

## Parity law (operator ruling, 2026-08-14)

Enforcement lands in ALL harnesses in the same unit, or the ledger row says
so. This machine is agent/harness/provider/model agnostic; Claude Code is
never "the" harness with the others as footnotes. Canonical gate logic lives
in exactly one file per law; harnesses get thin adapters (CC hook JSON, pi
extension shim, cursor hook script). Refusal semantics per surface: a
blocking surface refuses (CC exit 2, pi/cursor `tool_call`/`preToolUse`
deny); a fire-and-forget stop surface injects the release instruction as a
continuation (pi `sendUserMessage`, cursor `followup_message`) — capped by
the gate's own 3-refusal audited bypass.

## Audited bypasses (deliberate, never silent)

- `TOWER_WRITE_GATE=off` — write-gate kill switch (env).
- Write-gate 3-refusal bypass — auto-releases after three refusals, posts
  `tower/write-gate` bypass note. A gate can never permanently trap a session.
- `SPAWN_DOOR=off` prefix — spawn-door bypass, posts `house/spawn-door` note.

## Known gaps (honest, 2026-08-14 — updated after the parity pass)

- RESOLVED same day: cursor deny schema (verified against
  cursor.com/docs/agent/hooks: `permission:"deny"` + `user_message` +
  `agent_message`; hook exit 2 equivalent) and pi stop coverage
  (`agent_end` + `sendUserMessage` injected continuation — refusal
  semantics, not a hard block).
- pi extensions bind at session start / `/reload` — the two new shims
  (`write-gate.ts`, `spawn-door.ts`) take effect in the NEXT pi session;
  adapter logic itself live-probed via fake-API harness over the real
  field. The cursor `stop` hook likewise binds next cursor session.
- `SubagentStop` is not gated in CC (Stop only) — in-process subagents share
  the pane identity and would be wrongly refused for the parent's claims.
  Deliberate exclusion, revisit if subagents start claiming.
- DOCTRINE rows above are the compilation queue, in priority order:
  brief-lint (provider/model names) → epistemics SOURCES check → statem-gated
  reaping.

SOURCES: live probes 2026-08-14: write-gate exit 2/0 via registered CC
path; cursor stop adapter followup_message then silence-after-deposit; pi
adapter injected message then silence-after-deposit (fake-API harness, real
field); spawn-door 7-shape shell test + 5-shape pi parity test;
spine-workspace roundtrip w3D with board rows; spine-ruling scope refusal +
deposit; jq validation of both hook configs; write-gate.test.mjs 12 pass;
pi ExtensionAPI types read from
`@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts`
(`sendUserMessage` "always triggers a turn"; ToolCallEventResult
`{block, reason}`); cursor hook schemas fetched live from
cursor.com/docs/agent/hooks.
