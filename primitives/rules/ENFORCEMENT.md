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
| Completion = deposit (no silent finish while a claim is live) | COMMS-ARCH §Plane 5; PHASE2 proof | `write-gate.mjs` on Stop (registered CC settings.json 2026-08-14; probe re-run same day: exit 2 → deposit → exit 0) | HOOK | CC. pi: DOCTRINE (`agent_end` observed, stop-refusal unverified). cursor: DOCTRINE (no stop event in hooks schema) |
| Spawn through the door (stamp role/name/task, verified submit) | spawn.md; control-flow.md §Naming | `spine-spawn` (DOOR) + `spawn-door.sh` refusing raw `herdr agent start` (PreToolUse, CC + cursor, 2026-08-14) | DOOR+HOOK | CC verified; cursor deny-schema UNVERIFIED (fail-open); pi: DOCTRINE |
| Workspace mutations announced (board trace + operator line) | session loop (d)/(e), 2026-08-14 | `spine-workspace` (DOOR) + `spawn-door.sh` refusing raw `herdr workspace close` | DOOR+HOOK | same as above |
| Close needs a reason: Done (proof path) or Parked (pickup path) | control-flow.md §Diagnosis ≠ Land | `spine-workspace close --why` refuses empty reason | DOOR | any harness (CLI) |
| Rulings carry scope (where they apply AND where they do not) | 2026-08-14 overcorrection ping-pong | `spine-ruling --scope` refuses unscoped rulings; deposits `house/rulings` | DOOR | any harness (CLI) |
| Operator relay guarantee (`to:"operator"` mail blocks turn-end) | COMMS-ARCH §Hard invariants | `stop-guard.mjs` + `inboxState()` choke point | HOOK | CC. pi: partial (`tower-lifecycle.ts`) |
| Brief validation on Agent spawns | brief SKILL | `enforce-brief.mjs` (PreToolUse Agent) | HOOK | CC. Extension pending: refuse provider/model names in briefs (2026-08-14 ruling) |
| Board write integrity (flocked append, authored `from` required) | COMMS-ARCH §Board row schema | `tower-ledger.mjs append` + `board_post` guards | DOOR | all writers via cli/server |
| Alarm validation at emit (no empty questions) | COMMS-ARCH §Alarm rationalization | server/cli emit validation + dead-letter | DOOR | all |
| Concierge holds a claim on the load-bearing thread (loop-escape: no legal stop without deposit or need-help) | concierge.md doctrine 14 | claim emit at thread-open + registered write-gate | HOOK (CC concierge sessions) | others: DOCTRINE |
| Epistemics (acquire before assert; SOURCES lines) | AGENTS.md §Epistemics | none | DOCTRINE | compilation unknown — candidate: commit-msg hook checking SOURCES on external values |
| Reaping (done = gone; no trophy panes) | control-flow.md §Reaping | none mechanical (spine-workspace creates the audit trail) | DOCTRINE | candidate: statem-gated close |
| No provider/model/harness names in briefs or law | AGENTS.md §Fleet spawn; 2026-08-14 ruling | none | DOCTRINE | candidate: extend `enforce-brief.mjs` + a brief-lint in `brief` SKILL |
| Comms: status is not mail; no fabrication | COMMS-ARCH | fabrication OFF by default (flag-gated) | DOOR | all |
| Naming prefixes before agent start | control-flow.md §Naming | `spine-spawn` stamps; raw path refused by `spawn-door.sh` | DOOR+HOOK | CC, cursor (guard); pi DOCTRINE |

## Audited bypasses (deliberate, never silent)

- `TOWER_WRITE_GATE=off` — write-gate kill switch (env).
- Write-gate 3-refusal bypass — auto-releases after three refusals, posts
  `tower/write-gate` bypass note. A gate can never permanently trap a session.
- `SPAWN_DOOR=off` prefix — spawn-door bypass, posts `house/spawn-door` note.

## Known gaps (honest, 2026-08-14)

- cursor deny schema for preToolUse is unverified — the guard emits both CC
  and cursor shapes; if cursor ignores the deny key the command proceeds
  (fail-open). Verify against cursor-shim on next cursor session.
- pi cannot yet refuse a stop: `agent_end` in `tower-lifecycle.ts` is
  observational. Investigate a blocking pre-stop surface in the pi extension
  API before claiming coverage.
- `SubagentStop` is not gated in CC (Stop only) — in-process subagents share
  the pane identity and would be wrongly refused for the parent's claims.
  Deliberate exclusion, revisit if subagents start claiming.
- DOCTRINE rows above are the compilation queue, in priority order:
  brief-lint (provider/model names) → epistemics SOURCES check → statem-gated
  reaping.

SOURCES: live probes this session (2026-08-14): write-gate exit 2/0 via
registered path; spawn-door 7-shape test; spine-workspace create/close
roundtrip w3D with board rows; spine-ruling scope refusal + deposit;
`~/.claude/settings.json` + `~/.cursor/hooks.json` post-edit jq validation;
write-gate.test.mjs 12 pass.
