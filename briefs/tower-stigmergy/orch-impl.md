# ORCH tower-impl — implement the stigmergic Tower (pheromone bus), phases 1+2

> From: CORD tower-stigmergy (w2G:p1). Binding. Self-contained.
> Board topic: `constellation-zg/tower-stigmergy`. Post from a real repo cwd only.
> `.done` markers: `~/agent-core/briefs/tower-stigmergy/.done/impl-u1.done` … `impl-u4.done`.
> You own the INNER loop (Imagine → Plan → Make → Verify) for four units. Workers never commit — YOU gate.

## 1. Authority chain (read first, in this order)

1. `~/constellation-zg/docs/TOWER_STIGMERGY_DESIGN_0812.md` — the binding design. §4.2 row schema, §4.4 evaporation semantics, §4.5 route resolution, §4.6 direction A (idle-flip digest) are the spec you implement.
2. Operator rulings (mission.md §5a): D1 dedicated `~/.tower/pheromones.jsonl` stream · D2 COMMS-ARCH Amendment A1 (fifth plane: STIGMERGIC FIELD) · D3 idle-flip digest first · D4 read-time evaporation over the append-only log · D5 TTL defaults (work-available 15–60min, work-claimed 30s+heartbeat, work-done 24h, need-help nQ-bounded) · D6 NO git-init of ~/.tower · D7 Tower fleet-scale only (never touch constellation-zg `src/`).
3. CORD kickoff finding on the board (t-msqbmzqo-okvp) — activation model + partition declaration.

## 2. Partition law (a parallel mission is live — disjointness is law)

YOU OWN:
- `~/.tower/` — `server.mjs`, `cli.mjs`, `COMMS-ARCH.md`, new `pheromones.jsonl` machinery.
- `~/agent-core/primitives/hooks/tower-ledger.mjs` + ONE new sibling test file — DECLARED extension (design §4.1 mandates pheromoneField live in the same module as boardFor/inboxState; COMMS-ARCH bans a second scoping implementation). Do not touch any other file in agent-core. agent-core is a git repo with OTHER missions' uncommitted work — stage ONLY your two files by explicit path, never `git add -A`.
- `~/herdr-spine/bin/handlers/50-scent-digest` (new file only).

YOU DO NOT TOUCH:
- `~/herdr-spine/bin/ctl-fleet*` (parallel fleet-tasks mission), `~/agent-core/cli/`, `~/.agent-core/registry` (cursor-parity mission), constellation-zg `src/` (D7), any harness config, any running pane, any other existing handler.

## 3. Operational constraints (~/.tower is LIVE production)

- **Backup law:** before EVERY edit of a `~/.tower` file: `cp <file> <file>.bak-$(date -u +%Y%m%dT%H%M%SZ)`. Post `shasum -a 256 <file>` before/after to the board for every `~/.tower` edit (no git there — hashes are the evidence).
- **Append-only truth:** `pheromones.jsonl` is never rewritten, truncated, or compacted. Evaporation is derived at read time (D4).
- **Activation model (verified):** server.mjs is MCP stdio per harness session, not a daemon. No restart/deploy step exists or is needed — new code is live on the next MCP session / CLI invocation / handler event. Do not invent a restart procedure.
- **A1 is a doc edit with teeth:** the fifth plane's semantics (emit/observe, no addressee, no relay, TTLs, read-time evaporation) must be precise enough that the cursor-parity and fleet-tasks missions can cite it as law.

## 4. Pre-verified facts (CORD verified this session, 2026-08-12 ~16:45 UTC — cite these, do not rediscover)

### Tower code
- `~/.tower/lib.mjs:6` — `export * from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs'` (canonical grammar module; your additions there are re-exported for free).
- `~/agent-core/primitives/hooks/tower-ledger.mjs` — `TOWER/LEDGER/BOARD/DELIVERABLES/ODOMETER/FLIGHT` consts :22-27 · `normCwd` :35 (cached; collapses macOS /tmp and git worktrees) · `id()` :64 (`t-<base36>-<rand>`) · `append(file,obj)` :65 · `readAllFull` :81 · cursor machinery (withCursorLock, per-stream cursor json under `~/.tower/cursors/`) :100-229 · `inboxState(cwd)` :272 · `boardFor(cwd,{topic,limit})` :285 · `_test` reference exports :301. Header comment: consumed by lib.mjs, CC hooks, pi extensions — keep it pure functions, no listeners.
- Existing test pattern: `~/agent-core/primitives/hooks/tower-ledger-diff.test.mjs` — bun script, dynamic import, `assertEq` helper, exercises cold+warm cursor paths against live files read-only. Your new test follows this shape but MUST NOT write to live streams: add a `TOWER_PHEROMONES_PATH` env override in tower-ledger.mjs for the pheromones path (default `join(TOWER,'pheromones.jsonl')`) so tests write to a tmpdir file.
- `~/.tower/server.mjs` — TOOLS array :35-150 (tool descriptor shape), `callTool` switch :152-249, `board_post` scratch-cwd refusal :210-212 (replicate this guard on pheromone_emit), MCP stdio loop :251-297. CWD fixed at process start :32.
- `~/.tower/cli.mjs` — verb dispatch on `process.argv[2]` :18, `post` verb :74-103 (arg parsing incl. `--from`, scratch refusal :88, row shape, direct appendFileSync to board.jsonl :102). Add verbs in the same style.
- herdr-spine is a git repo @ `63e1010`; commit convention `<type>(<scope>): <summary>` + PHASE/DONE/TODO trailers; stage explicitly.

### herdr event edge (for U3)
- Dispatcher contract `~/herdr-spine/docs/dispatcher.md`: every executable regular file in `bin/handlers/` not starting with `.`/`_` runs as its own subprocess per `pane.agent_status_changed` event, sorted by basename, **5s wall-clock budget**, env `HERDR_PLUGIN_EVENT_JSON` (+`HERDR_SOCKET_PATH`, `HERDR_BIN_PATH`, `HERDR_PLUGIN_STATE_DIR`), all failures log to stderr and **exit 0**. Prefix bands: 30+ = wave-B FIELD handlers — `50-scent-digest` fits.
- `~/herdr-spine/bin/handlers/_spine_common.py` (import as `sc`, sys.path insert per sibling handlers): `log(prefix,msg)` :37 · `parse_event()` :43 (returns dict with pane_id/status/agent/ws) · `get_panes()` :81 · `pane_of(panes,pane_id)` :93 · `pane_name(pane,pane_id)` :121 · `workspace_name(ws_id)` :138 · `board_append(entry_type, body, from_name, topic)` :326 · `find_focused(panes)` :353 · `verified_prompt(pane_id, text, timeout_ms=4000)` :361.
- Template to study: `~/herdr-spine/bin/handlers/16-parent-wake` — fires on status in (done,idle) :119, role classification :47-54, 60s per-key pacing with JSON state file + env-overridable path :57-87, focused-pane/operator-parent suppression :142-156, `verified_prompt` delivery :158-163, board record of every wake :144-148, all-failures-exit-0 wrapper :166-171.
- Pane role tokens: `tokens.role` carries e.g. `3-AGNT`, `2-ORCH` (numeric prefix) or bare `AGNT`/`ORCH` — normalize by stripping `^\d+-` (16-parent-wake:41-44).

### Shim mechanics (how you spawn)
- `cursor-fleet worker <profile> (--brief <p>|--prompt <t>) [--dir <root>]` — execs cursor-spine. Profiles: coder, test-maker, tester (interactive, spawner-reaped), arbiter (one-shot), researcher (SAGT, `--headless` one-shot auto-reaped).
- **Verify gate (hard):** a `coder` spawn is REFUSED unless `cursor-spine verify-mark <brief>` recorded criteria for that brief. `cursor-fleet make <slug> --brief <p>` does verify-mark + parallel coder/test-maker in separate worktrees automatically — but ONLY for git-repo targets.
- **~/.tower is not a git repo:** for U1 use the raw path — test-maker authors criteria+tests from the brief first, `cursor-spine verify-mark <brief>`, then `cursor-fleet worker coder --brief <p> --dir ~/herdr-spine`. cursor-spine force-enables `--worktree` for coder (of --dir); the coder edits `~/.tower/*` and `~/agent-core/primitives/hooks/tower-ledger.mjs` by ABSOLUTE PATH and is under standing orders NEVER to read any `*.test.mjs` — profile discipline is the wall (cursor-fleet.md §Verify beat, raw-coder fallback). Break-glass `CURSOR_VERIFY_GATE=off` is audited to Tower — do not use it.
- U3 targets herdr-spine (a git repo) — `cursor-fleet make` bifurcation applies cleanly there.

## 5. Units

### U1 — pheromone stream + derived reader + CLI + MCP  → `.done/impl-u1.done`

Implement the design §4.1/§4.2/§4.4 exactly:

1. **`~/agent-core/primitives/hooks/tower-ledger.mjs`:**
   - `export const PHEROMONES = process.env.TOWER_PHEROMONES_PATH || join(TOWER, 'pheromones.jsonl')`.
   - Row schema (design §4.2 verbatim): `{id, ts, cwd, topic, from, scent, route:{to_role,to_pane,reply_to}, ref, payload_ref, evidence, ttl_s}`. id = `ph-<base36 ms>-<4 rand base36>` (mirror `id()` shape).
   - `SCENT_TTL_DEFAULTS`: `work-available: 1800` (30min, inside the operator-accepted 15–60min band), `work-claimed: 30` (spine-claim parity; heartbeat = re-emit with same `ref`), `work-done: 86400`, `need-help: 3600` (nQ-bounded placeholder — the nQ resolution close-out is a later phase; TTL keeps the field clean).
   - `emitPheromone(cwd, {scent, topic, from, route, ref, payload_ref, evidence, ttl_s})` — validates: scent in the four-value enum; `evidence` non-empty (P3 no-fabrication); `payload_ref` required for work-available/work-done; `ref` required for work-claimed/work-done; `ttl_s` defaults per scent. Appends one row. Returns the row.
   - `pheromoneField(cwd, {topic, now} = {})` — the scoped derived reader (normCwd scoping exactly like boardFor). Full-file read is fine (stream starts empty; note in a comment that cursor machinery can be added later mirroring boardFor if volume demands). Derivation per design §4.4: a `work-available` is **open** (now < ts+ttl_s, no live claim ref, no done ref), **claimed** (live work-claimed refs it — claim itself TTL-bound, latest claim wins), **done** (a work-done refs it), **evaporated** (TTL lapsed while open). work-claimed/work-done/need-help rows are themselves live iff within their own TTL. Return `{open: [...], claimed: [...], done: [...], evaporated: [...], help: [...]}` with the rows.
   - Extend `_test` exports with the pure derivation helper (split derivation into a pure function over rows so tests drive it with synthetic rows + synthetic `now`).
2. **`~/.tower/cli.mjs`** — new verbs (backup law before editing):
   - `emit <scent> <topic> <payload_ref> [--ref id] [--to-role r] [--to-pane p] [--reply-to id] [--evidence "..."] [--ttl N] [--from name]` — scratch-cwd refusal identical to `post` (:88); prints the minted id.
   - `field [--topic t] [--json]` — derived field for this cwd; human output lists open/claimed/done counts then each open row as `[ts] scent from → payload_ref (ttl remaining)`; `--json` prints the raw derivation (this is what U3's handler consumes).
   - `scan [--topic t] [--json]` — all rows with derived state annotations (the desire-line/debug view).
   - Update the usage line :172.
3. **`~/.tower/server.mjs`** — new MCP tools (backup law): `pheromone_emit` (same validation; scratch-cwd refusal like board_post; `from` param required in schema description) and `pheromone_field` ({topic?} → JSON derivation for the server's cwd). Follow the existing TOOLS/callTool pattern exactly.
4. **Tests** — `~/agent-core/primitives/hooks/tower-pheromone.test.mjs` (test-maker authors from THIS brief, never from the implementation): emit validation (evidence required, enum, ref requirements), field derivation transitions (open→claimed→done, evaporation at ttl boundary via synthetic now, expired claim re-opens), cwd scoping (two cwds isolated), TTL defaults applied, env-override path honored. Run: `bun ~/agent-core/primitives/hooks/tower-pheromone.test.mjs` exits 0. Also re-run `bun ~/agent-core/primitives/hooks/tower-ledger-diff.test.mjs` — must stay green (you are editing the module it covers).

**Done-when:** `bun ~/.tower/cli.mjs emit work-available constellation-zg/tower-stigmergy <path> --evidence <path>` from a real repo cwd mints a row; `field` shows it open; `field` after a `work-claimed` emit shows claimed; synthetic-TTL test proves evaporation; both test files green; backups + shasum before/after for server.mjs/cli.mjs posted; agent-core commit (2 files, explicit paths) gated by YOU.

### U2 — COMMS-ARCH Amendment A1  → `.done/impl-u2.done`

Edit `~/.tower/COMMS-ARCH.md` (backup law + shasum before/after):
- "Four planes, strictly separated" → five. New plane 5: **STIGMERGIC FIELD (environmental)** — machine-facing, decaying, non-addressed coordination signals carried on `~/.tower/pheromones.jsonl`. Semantics that MUST be stated precisely (the parallel missions will cite this): pheromones are emitted with mandatory evidence and observed through the scoped field reader (`pheromoneField`) only; they have NO addressee and are NEVER relayed; they are NEVER operator mail and never enter the ledger inbox planes; the route field is a derivation hint (to_pane > to_role > lineage > topic-scope), not an address; TTLs per D5 with read-time evaporation over the append-only log (the log never shrinks); the one rule survives — each plane keeps exactly one audience discipline, and the field's audience is whoever the route derives to at read time.
- Update the "What each existing component becomes" table with a pheromone row; extend "Dedupe by id, ack by id" with: claims/dones carry `ref` to exact pheromone ids.
- Independent of U1 — run in parallel. A `researcher` one-shot (`cursor-fleet worker researcher --brief <u2 brief> --headless`) is an acceptable vehicle; YOU verify the diff word-by-word against this spec.

**Done-when:** COMMS-ARCH.md carries the fifth plane with the semantics above; backup + before/after shasum posted; no other content changed.

### U3 — `50-scent-digest` idle-flip handler  → `.done/impl-u3.done`

New executable `~/herdr-spine/bin/handlers/50-scent-digest` (python3 stdlib only, dispatcher contract §4 facts above; study 16-parent-wake as the template). Depends on U1's `field --json` verb.

Behavior:
- Fire only on `status == "idle"`. All failures log + exit 0.
- One `sc.get_panes()` read; resolve the pane's cwd, role token (normalize `^\d+-`), human name. No cwd → log, exit 0.
- Query the field by shelling out to `bun ~/.tower/cli.mjs field --json` WITH the pane's cwd as the process cwd (the CLI is the sanctioned scoped reader — NEVER reimplement derivation or scoping in python). CLI path overridable via `SCENT_DIGEST_CLI` env (tests inject a fixture); non-zero exit/unparseable JSON → log, exit 0.
- Route match (design §4.5 order) over the open set: `route.to_pane == pane_id` → `route.to_role == normalized role` → no route / topic-scope = environmental claim by any idle agent in the namespace. need-help rows addressed one-link-up are out of scope for the digest (existing nQ rails own those).
- If matches: ONE `sc.verified_prompt(pane_id, digest)` where the digest names each open work item (scent, from, payload_ref, how to claim: `bun ~/.tower/cli.mjs emit work-claimed <topic> <payload> --ref <id> --evidence <path>`). Cap at 5 items, oldest first.
- Pacing: 60s per pane_id, JSON state at `~/.tower/scent-digest-pace.json` (env override `SPINE_SCENT_DIGEST_PACE_PATH`), load/save tolerant-of-corruption exactly like 16-parent-wake:57-87. Dropped-by-pacing is logged, never silent.
- Board record: every digest event (prompted or paced-out) appends ONE board note via `sc.board_append("note", body, "spine-daemon", "herdr-spine/scent-digest")` naming the pane, match count, and whether a prompt was delivered.
- Suppression: never prompt a bridge-exempt pane (`~/.tower/bridge-exempt`, same read pattern as 16-parent-wake) or the operator's focused pane (`sc.find_focused`).
- No fabrication: the digest surfaces only rows already carrying evidence; the handler mints no pheromones.

Verify via `cursor-fleet make` (herdr-spine is a git repo — real bifurcation). Tests (test-maker, from this brief): synthetic `HERDR_PLUGIN_EVENT_JSON` idle event + fixture CLI (a shell script emitting canned field JSON) + temp pace path → asserts prompt issued on match, no prompt on empty field, pacing suppresses second event within 60s, bridge-exempt suppressed, non-idle status no-op, exit 0 on garbage JSON. Handler test runner: python3, exits 0.

**Done-when:** handler executable in place; tests green via the Verify beat; herdr-spine commit gated by YOU (explicit path).

### U4 — end-to-end evidence  → `.done/impl-u4.done`

ORCH-run (no new code): from a real repo cwd, emit a `work-available` pheromone routed `to_role` matching a worker role; spawn a tiny `researcher --headless` one-shot (or observe a natural fleet idle-flip) and capture a REAL idle-flip producing a digest: the handler's board note under `herdr-spine/scent-digest` + (if the flipped pane is promptable) the delivered prompt. Then emit `work-claimed` and `work-done` against the pheromone id and show `field`/`scan` transitions. Post the full evidence chain to the board with a provenance block (`date -u`, `pwd -P`, shasum of every touched ~/.tower file).

**Done-when:** the evidence chain is on the board and reproducible from the posted commands.

## 6. Comms + report-back

- Findings: board topic `constellation-zg/tower-stigmergy`, from `orch-tower-impl`, posted from a real repo cwd (~/herdr-spine or ~/constellation-zg). One finding per unit collection (what landed, evidence, hashes).
- Provenance blocks on load-bearing evidence: `date -u`; `pwd -P`; `shasum -a 256` before/after for every ~/.tower file edit.
- `.done` marker per unit at collection: `~/agent-core/briefs/tower-stigmergy/.done/impl-uN.done` containing what shipped + evidence pointers.
- Operator mail: NONE from you or your workers. Genuine external forks go to ME (board, this topic) — I decide what climbs.
- nQ: resolve against the design doc and this brief first; a question for me climbs via board note tagged `Q:` on this topic. Budget 3.

## 7. Reaping law

Workers reaped at collection (done = gone). Your final act before your own report: `cursor-spine reap --done`. You (ORCH) stay until I collect your final report.
