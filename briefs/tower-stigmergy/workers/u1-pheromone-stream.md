Implement Tower pheromone stream (design §4.1/§4.2/§4.4): emitPheromone + pheromoneField in tower-ledger.mjs, CLI verbs emit/field/scan, MCP tools pheromone_emit/pheromone_field. Do NOT use emojis anywhere. Workers never commit.

## Pre-Verified Facts (ORCH verified 2026-08-12 ~16:48 UTC)
- Design authority: `~/constellation-zg/docs/TOWER_STIGMERGY_DESIGN_0812.md` §4.1 stream, §4.2 row schema, §4.4 evaporation derivation. Operator rulings mission.md §5a: D1 dedicated pheromones.jsonl · D4 read-time evaporation · D5 TTLs · D6 NO git-init ~/.tower · D7 never touch constellation-zg src/.
- `~/.tower/lib.mjs:6` re-exports `~/agent-core/primitives/hooks/tower-ledger.mjs` — additions there are live for free.
- `tower-ledger.mjs`: TOWER/LEDGER/BOARD consts :22-27 · `normCwd` :35 · `id()` :64 (`t-<base36>-<rand>`) · `append` :65 · `readAllFull` :81 · `boardFor` :285 · `_test` :301. Keep pure functions, no listeners.
- Test exemplar: `~/agent-core/primitives/hooks/tower-ledger-diff.test.mjs` — bun script, dynamic import, assertEq. MUST NOT write live streams — use `TOWER_PHEROMONES_PATH` env override.
- `~/.tower/cli.mjs`: verb on argv[2] :18 · `post` :74-103 (scratch refusal :88) · usage :172.
- `~/.tower/server.mjs`: TOOLS :35-150 · callTool :152-249 · board_post scratch refusal :210-212 · CWD fixed at start :32.
- Baseline shasums (pre-edit): cli.mjs `b8c75410162b9295dfc3821583176bef6a0b680b49b4e5c524ff4c92e6df6c1b` · server.mjs `9b12b00642f7567fc3339d843560391bc6e88d3a4fd60afcb92a3a0741edb59c` · tower-ledger.mjs `544e974a3b70b99dab1d89a5dd5dfd941cbe307addccb8d2d16c54481eb15bb8`.
- Activation: server.mjs is MCP stdio per session — no restart needed after edits.
- Board topic: `constellation-zg/tower-stigmergy`. Post from real repo cwd only.

## Parallel Work Notice
Parallel missions OWN and you MUST NOT touch: `~/herdr-spine/bin/ctl-fleet*` (fleet-tasks), `~/agent-core/cli/`, `~/.agent-core/registry` (cursor-parity), constellation-zg `src/`, any other handler, any harness config. Ignore uncommitted work in those paths. U2 owns COMMS-ARCH.md only — do not edit it. Post claims/findings to Tower topic `constellation-zg/tower-stigmergy` from `orch-tower-impl` workers with from= your role.

## Tower (mid-run communication)
- Findings: board topic `constellation-zg/tower-stigmergy` (MCP board_post or `bun ~/.tower/cli.mjs post finding constellation-zg/tower-stigmergy "..."` from real repo cwd).
- Operator mail: NONE. No send_to_user deliverable/alert.
- spine-report task/verdict at unit start/end if on Herdr.
- Claim resources with spine-claim if contested; partition is declared.

## Tasks

### Shared acceptance (both profiles implement against THIS plan)
Row schema verbatim: `{id, ts, cwd, topic, from, scent, route:{to_role,to_pane,reply_to}, ref, payload_ref, evidence, ttl_s}`. id = `ph-<base36 ms>-<4 rand base36>`.

SCENT_TTL_DEFAULTS: work-available 1800 · work-claimed 30 · work-done 86400 · need-help 3600.

Derivation (§4.4): work-available is open / claimed / done / evaporated as specified. work-claimed/work-done/need-help live iff within own TTL. pheromoneField returns `{open, claimed, done, evaporated, help}`.

### For test-maker ONLY (author from THIS brief — NEVER read implementation files)
1. Write `~/agent-core/primitives/hooks/tower-pheromone.test.mjs` covering:
   - emit validation: evidence required; scent enum; ref required for work-claimed/work-done; payload_ref required for work-available/work-done
   - field derivation: open→claimed→done; evaporation at ttl boundary via synthetic `now`; expired claim re-opens
   - cwd scoping: two cwds isolated
   - TTL defaults applied
   - `TOWER_PHEROMONES_PATH` env override honored (tmpdir — never write live `~/.tower/pheromones.jsonl`)
   - Drive pure derivation helper via `_test` export with synthetic rows + synthetic now
2. Write criteria notes to `~/agent-core/briefs/tower-stigmergy/workers/u1-criteria.md` listing each assert by name.
3. Done when: test file exists; criteria.md exists; post board finding with paths; do NOT run against missing impl (tests may fail until coder lands — that is expected). Touch marker file `~/agent-core/briefs/tower-stigmergy/workers/u1-test-maker.done` with paths shipped.

### For coder ONLY (NEVER read any `*.test.mjs`)
1. **Backup law before EVERY ~/.tower edit:** `cp <file> <file>.bak-$(date -u +%Y%m%dT%H%M%SZ)` then `shasum -a 256 <file>` — post before/after hashes on the board.
2. Edit `~/agent-core/primitives/hooks/tower-ledger.mjs` by ABSOLUTE PATH:
   - `export const PHEROMONES = process.env.TOWER_PHEROMONES_PATH || join(TOWER, 'pheromones.jsonl')`
   - `SCENT_TTL_DEFAULTS` as above
   - `emitPheromone(cwd, {...})` with validation; append one row; return row
   - `pheromoneField(cwd, {topic, now} = {})` scoped via normCwd like boardFor; full-file read OK (comment that cursor can come later)
   - Split derivation into a pure function; export it on `_test`
3. Edit `~/.tower/cli.mjs` (backup first): verbs `emit`, `field`, `scan` per orch-impl §U1; update usage line.
4. Edit `~/.tower/server.mjs` (backup first): MCP tools `pheromone_emit` (scratch refusal like board_post; from required in schema) and `pheromone_field`.
5. Done when: board finding with before/after shasums for cli.mjs + server.mjs; list of exports added; touch `~/agent-core/briefs/tower-stigmergy/workers/u1-coder.done`. Do NOT commit. Do NOT create/edit the test file.

## Constraints
- Touch ONLY: `~/agent-core/primitives/hooks/tower-ledger.mjs`, `~/agent-core/primitives/hooks/tower-pheromone.test.mjs` (test-maker only), `~/.tower/cli.mjs`, `~/.tower/server.mjs`, brief worker markers under `briefs/tower-stigmergy/workers/`. Do not commit.
- Append-only: never rewrite/truncate pheromones.jsonl.
- Testing: no mocks of fs beyond tmpdir path override; real append/read against tmp files.
- Verification commands (ORCH/tester runs these — coder does not need green tests in their pane):
  - `bun ~/agent-core/primitives/hooks/tower-pheromone.test.mjs` exits 0
  - `bun ~/agent-core/primitives/hooks/tower-ledger-diff.test.mjs` stays green
  - From real repo cwd: `bun ~/.tower/cli.mjs emit work-available constellation-zg/tower-stigmergy <path> --evidence <path>` mints id; `field` shows open; claim then field shows claimed.

## Report back with
- Per-file diff summary (paths + what changed)
- Before/after shasums for every ~/.tower file touched
- Paths of .done markers written
- Deviations with reasons
- Explicit: DID NOT COMMIT
