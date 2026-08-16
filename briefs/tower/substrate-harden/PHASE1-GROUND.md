# Tower Substrate Harden — Phase 1 GROUND

**Author:** CORD [Tower] (`cord-tower`, pane `cord-coordinator-w34-p1`)  
**Date:** 2026-08-14  
**Scope:** Discovery only. No schema changes. No Phase 2 prescribe beyond Next Actions.  
**Sources this session:** `primitives/hooks/tower-ledger.mjs`, `primitives/mcps/tower/server.mjs`, `cli.mjs`, hooks under `mcps/tower/hooks/`, `COMMS-ARCH.md`, `briefs/tower-bus-audit-FINDINGS.md`, `briefs/tower/codify-stigmergy.done`, `herdr-spine/bin/handlers/{17-field-pull,40-tower-bridge,_spine_common.py}`, `herdr-spine/bin/spine-claim`, live `~/.tower/{board,ledger,pheromones}.jsonl`.

Do NOT use emojis anywhere.

---

## Verdict (after ground)

**Gate-and-schema-harden-shaped, not rewrite-shaped.**

The append path, scent enum validation, flocked JSONL writes, MCP/CLI surfaces, and read-time field derivation all work. The failure mode is enforcement and identity discipline: finishing is still prompt-optional for the stigmergic deposit; lifecycle signals (Herdr status, `$verdict`, `.done` files, Made Well verify-mark/tax) can flip without a typed `work-done`; doctrine and field derivation disagree on what `work-done.ref` points at. Codify-stigmergy (2026-08-14) landed doctrine in markdown/profiles only — runtime did not follow.

---

## 1. Write entrypoints (map)

| Entrypoint | Path | Appends |
|---|---|---|
| MCP `send_to_user` | `server.mjs` → `append(LEDGER)` + optional `deliverables/*.md` | **ledger** (+ deliverable file) |
| MCP `ask_user` | `server.mjs` | **ledger** (`kind:question`) |
| MCP `reply` | `server.mjs` | **ledger** (`kind:answer`) |
| MCP `mark_relayed` | `server.mjs` | **ledger** (`kind:ack`) |
| MCP `relay_inbox` | `server.mjs` | **ledger** (ack + optional answers) |
| MCP `board_post` | `server.mjs` → `append(BOARD)` | **board** |
| MCP `pheromone_emit` | `server.mjs` → `emitPheromone` | **pheromones** |
| CLI `post` | `cli.mjs` | **board** |
| CLI `emit` | `cli.mjs` → `emitPheromone` | **pheromones** |
| Hook `odometer.mjs` / `odometer-stop.mjs` | `mcps/tower/hooks/` | **odometer.jsonl** |
| Hook `deposit-reminder.mjs` | PostToolUse on `git commit` | **none** (stderr nudge only; text still says hand-append board) |
| Hook `stop-guard.mjs` | Stop | **none** (blocks stop on unrelayed operator mail / open questions) |
| Hook `stop-verdict.mjs` | Stop | **Herdr pane tokens** (`$verdict`), not Tower pheromones |
| Hook `flight-recorder.mjs` | session end | **flight/*.md** (via canonical `primitives/hooks/`) |
| Hook `ask-bridge.mjs` | (CC ask path) | local bridge state; not pheromones |
| Spine `board_append` | `_spine_common.py` / `spine-claim` | **board** (flocked open+append; type claim/release/alert/…) |
| Spine `40-tower-bridge` | `herdr-spine/bin/handlers/40-tower-bridge` | **ledger** only if `~/.tower/bridge-fabricate-done` exists (OFF by default) |
| Spine `17-field-pull` | handler | **reads** pheromones; may prompt pane; pace file `field-pull-pace.json` |
| Spine `spine-claim` | `bin/spine-claim` | Herdr `claim_<slug>` **tokens** + board audit line — **not** `pheromones.jsonl` |
| Spine `spine-report` | `bin/spine-report` | Herdr tokens `$task` / `$verdict` / `$q` — lifecycle/sidebar |
| Made Well / cursor-shim `verify-mark` | `cursor-spine` | local gate state under shim — **outside** Tower |
| Made Well `tax.jsonl` | `cursor-finish` Land | `$GIT_ROOT/.madewell/work/tax.jsonl` — **outside** Tower |
| `.done` marker files | convention (e.g. `~/.tower/*.done`, `briefs/tower/*.done`) | filesystem markers — **outside** pheromone field |

**Official sanctioned agent writes to the three fleet stores:** MCP tools above, or `bun ~/.tower/cli.mjs post|emit`. Hand-append to JSONL is banned in COMMS-ARCH / write-path criteria.

Canonical storage layer: `primitives/hooks/tower-ledger.mjs` (re-exported by `~/.tower/lib.mjs`).

---

## 2. Hardened trace schemas (from code — not invented)

### Pheromone scent enum + TTLs

From `tower-ledger.mjs`:

```js
export const SCENT_TTL_DEFAULTS = {
  'work-available': 1800,
  'work-claimed': 30,
  'work-done': 86400,
  'need-help': 3600,
}
```

Only these four scents are valid (`SCENTS = new Set(Object.keys(SCENT_TTL_DEFAULTS))`).

### Pheromone row shape (`emitPheromone`)

Quoted fields written at emit time:

```js
{
  id,           // `ph-${Date.now().toString(36)}-…`
  ts,           // ISO
  cwd,
  topic,
  from,         // from ?? null (MCP requires from)
  scent,        // enum above
  route: { to_role, to_pane, reply_to },  // derivation hints, not addresses
  ref,          // required for work-claimed | work-done
  payload_ref,  // required for work-available | work-done
  evidence,     // mandatory non-empty string
  ttl_s,        // default from SCENT_TTL_DEFAULTS
}
```

Validation: invalid scent throws; empty evidence throws; missing `payload_ref` on available/done throws; missing `ref` on claimed/done throws.

### Field derivation identity rule (load-bearing)

`pheromoneFieldFromRows` treats a `work-available` as **done** iff some `work-done.ref === available.id`. Live claims are keyed by `work-claimed.ref` (expected = available id). Evaporation is read-time.

### Board row shape (authored MCP/CLI)

```js
{ id, ts, cwd, topic, type /* claim|finding|note */, from, body }
```

Spine `board_append` uses the same family plus other `type` strings (`release`, `alert`, …) with `id` prefix `spine-`.

### Ledger row shapes (observed + code)

Common: `{ id, ts, cwd, kind, … }`

| kind | Extra fields (typical) |
|---|---|
| `progress` / `deliverable` / `alert` | `title`, `from`, `message`; deliverable/alert: `to` |
| `question` | `from`, `message`, `options?` |
| `answer` | `ref` (question id), `message`, `from?` |
| `ack` | `ids[]` |
| also live | `lineage`, `verify-gate-bypass` (machine-plane) |

### Gap vs aspirational TraceType list

Operator aspirational: `task.claimed|started|completed|blocked|failed|observation|need|danger`.

| Aspirational | Today |
|---|---|
| task.claimed | ≈ `work-claimed` |
| task.started | **absent** |
| task.completed | ≈ `work-done` |
| task.blocked / failed | **absent** as scents (blocked ≈ Herdr status + optional board) |
| observation | **absent** (board `finding`/`note` are nearest) |
| need | ≈ `need-help` |
| danger | **absent** (ledger `alert` is mail-plane, not field) |

Vocabulary is already small (4 scents). Expanding to 8 TraceTypes would be a Phase 2 schema decision — not required to fix finish-without-deposit.

---

## 3. Current write path (typical AGNT finish)

What briefs/profiles tell the agent to do (ranks 1–4):

1. Emit/claim via `pheromone_emit` / CLI `emit` (pull loop in profiles + brief SKILL).
2. Post board claims/findings on `<project>/<topic>`.
3. On Herdr: `spine-report task` / `verdict`; optionally `spine-claim` for file resources.
4. Touch `.done` when the brief says so.
5. Emit `work-done` with `ref` + `payload_ref` + `evidence`.
6. Optionally `send_to_user` deliverable for operator-facing output.

**Tool that must be called for semantic completion in the stigmergic sense:** `pheromone_emit` with `scent=work-done` (or CLI `emit work-done …`).

**If the agent skips that call:**

| Signal | What happens |
|---|---|
| Herdr `agent_status` → idle/done | Lifecycle only. `40-tower-bridge` does **not** mint mail (fabrication OFF). `17-field-pull` may re-offer *open* work to the idle pane — it does **not** invent a `work-done`. |
| `stop-verdict` | Sets `$verdict` token only. |
| `stop-guard` | Only blocks on unrelayed `to:operator` deliverable/alert or open questions — **not** on missing pheromones. |
| `deposit-reminder` | On `git commit` only: non-blocking stderr hint (board, not pheromone). |
| Field | Parent `work-available` stays open (or evaporates after TTL) or stays "claimed" only while heartbeats continue; claim TTL **30s**. |
| Spawner "done = gone" | May reap on pane idle + `.done` file + ORCH judgment — **none of those require `work-done`**. |

Mechanism: **prompt-optional tool call with no mechanical gate.**

---

## 4. Completion signaling (lifecycle vs semantic)

| Signal | Class | Required for "done = gone" today? |
|---|---|---|
| Herdr `agent_status` idle/done | **lifecycle** | De facto yes for reaping observation; not semantic deposit |
| `spine-report` `$verdict` / `$task` | **lifecycle** (sidebar) | Common convention; not field completion |
| `.done` files | **semantic-ish marker** (filesystem) | Often required by brief; not queryable via `pheromone_field` |
| Made Well `verify-mark` | **gate** (cursor-shim verify) | Required for `coder` spawn on cursor make path; orthogonal to Tower |
| `tax.jsonl` Land row | **project tax** | Cursor-finish only; not Tower |
| Pheromone `work-done` | **semantic (stigmergic)** | Doctrine says yes; **runtime does not require it** |
| Ledger deliverable | **operator mail** | Only when deliberately sent (or fabricated — OFF) |

**Current combination for "done = gone":** spawner verifies brief done-when (artifacts + often `.done`) + pane idle, then reaps. **`work-done` is not in that mechanical chain.** Expert target ("semantic completion = successful deposit") is doctrine-ahead-of-runtime.

---

## 5. Finish-without-write mechanisms (≥3, with evidence)

1. **Prompt-optional `pheromone_emit` / no Stop gate on missing `work-done`.**  
   Evidence: no match for `work-done`/`emitPheromone` in `mcps/tower/hooks/*` Stop path; `stop-guard.mjs` only checks `inboxState` unrelayed/questions. Agent can idle after code+`.done` with zero pheromone.

2. **Claim TTL 30s + fragile heartbeat → field lies about ownership; agents abandon the loop.**  
   Evidence: `SCENT_TTL_DEFAULTS['work-claimed']=30`; `codify-stigmergy.done` Loop usability finding (heartbeat shells died mid-unit; claims returned to open). Live histogram: **518 claimed vs 146 done** (re-verified 2026-08-14) — consistent with claim spam / evaporating claims / unfinished deposit, not with a closed loop.

3. **Lifecycle bridge does not deposit stigmergy (and mail fabrication is OFF).**  
   Evidence: `40-tower-bridge` `on_done`: if `~/.tower/bridge-fabricate-done` absent, return immediately — "status is not mail". `stop-verdict` writes Herdr tokens only. Finishing the pane produces no `work-done`.

4. **(Supporting / related) Dual claim systems confuse "I finished."**  
   `spine-claim` writes board + Herdr tokens; Tower pheromone claims are a separate store. An agent can release a spine resource claim and still never emit `work-done`.

5. **(Historical mail-plane cousin, partially fixed)** Deliverables without `to:"operator"` never entered Stop-guard unrelayed set. HEAD now defaults `to` for deliverable/alert (see §Deviations). Historical ledger: **457 deliverables still missing `to`** vs 26 with `operator` (full corpus); last-30 shows mostly fixed new writes.

---

## 6. Work-item identity, agent identity, adapters

| Role | What plays it today |
|---|---|
| **work_item_id (stigmergic)** | `work-available.id` (`ph-…`). Board topic is a thread key, not a unique work id. Brief path often used as `payload_ref` / evidence. |
| **claim token (field)** | `work-claimed` rows with `ref` → available id; TTL 30s + heartbeat. |
| **claim token (spine/files)** | Herdr `claim_<slug>` via `spine-claim` — parallel system. |
| **agent_id** | `from=` string on emits/posts (convention, not validated identity); Herdr registration name (`cord-tower`, `orch-…`); pane id (`w34:p1`). No single canonical id joins all three. |
| **RuntimeAdapter** | **Does not exist** in code (search hits only this Phase 1 brief). Herdr is hard-wired via spine handlers + hooks. Fut: no local checkout; future candidate only. |

---

## 7. Sensing paths

| Path | Verdict | Evidence |
|---|---|---|
| MCP `pheromone_field` | **works** | `server.mjs` → `pheromoneField(CWD, {topic})`; exercised this session |
| CLI `field` / `scan` | **works** | `cli.mjs` verbs present |
| MCP/CLI `board_read` / `board` | **works** | cwd-scoped; empty topic message when none |
| Spine `17-field-pull` | **partial / live** | Handler present; `field-pull-pace.json` has live pane keys (`w31:p9` etc.). Compels read on idle/done. Does not enforce `work-done` on exit. |
| Spine `50-scent-digest` | **works (digest)** | Handler + tests exist; operator-facing scent digest, not CORD control loop |
| CTRL / `twr` | **partial** | `primitives/tools/statem/twr.ts` exists; `twr` not on PATH in this pane. Board viewing is tool/TUI, not field API. |
| Profile "read field before idle" | **prompt-only** | Codified in profiles; enforcement is `17-field-pull` (inject), not a hard refuse-to-idle |

Cheap sensing for CORD/ORCH: `pheromone_field` + `board_read` are enough when agents deposit. When they do not, sensing correctly reports emptiness — the bug is write discipline, not read APIs.

---

## 8. Intent vs control-flow (COMMS-ARCH plane 5)

| Plane-5 claim | Enforcement today |
|---|---|
| Deposit, never deliver (pheromones have no addressee) | **Partial** — `route` is stored as hints; field + field-pull treat as derivation. Mail planes still used heavily for coordination. |
| Read field before idle | **Partial** — `17-field-pull` injects on idle/done; profiles mandate; no universal harness Stop refuse |
| `work-claimed` ref → exact id; heartbeat ~20s | **Validated at write**; heartbeat **not** provided as first-class tool (agents shell-loop); TTL 30s is harsh |
| `work-done` ref → **the claim** (COMMS-ARCH L79) | **MISMATCH** — field derivation completes available when `work-done.ref === available.id`. Live: most dones point at available ids (125); some at claim-row ids (9); some other (12). Doctrine text and runtime semantics disagree. |
| Evidence mandatory | **Enforced** in `emitPheromone` |
| Two stopping states only | **Doctrine only** — runtime accepts idle with neither done nor need-help |
| Never relayed as operator mail | **Holds** — pheromones not in stop-guard unrelayed set |
| nQ=0 before deliverable / work-done | **Doctrine** (`RESPONSIBLE-PARTY` §6); **not** checked in `emitPheromone` |
| Codify-stigmergy followed by runtime | **No** — `codify-stigmergy.done` lists docs/profile commits only |

---

## 9. Deviations from Pre-Verified Facts

| Inherited claim | This session |
|---|---|
| board ≈ 11663 lines | **11667** at start (drift, expected) |
| pheromone histogram 518/146/109/14 | **Exact match** at start |
| Finding 1: send_to_user does not set `to` | **FIXED in HEAD** — `entry.to = args.to ?? 'operator'` for deliverable/alert. Historical corpus still 457 missing `to`. Last ~30 deliverables mostly `operator`. |
| Finding 2: CC question-close still prompt-adherence | **Not re-disproven**; no CC UserPromptSubmit closer found in tower hooks this pass (audit still stands as prior art). |
| Fut not local | **Confirmed** (no RuntimeAdapter; Fut only in briefs) |
| Codify stigmergy | Doctrine yes; **runtime enforcement no** |

---

## Next 2–4 concrete actions (Phase 2 candidates — not implementing)

1. **Write gate (highest leverage):** Add a Stop / SubagentStop (and/or spine idle handler) that, when the pane holds a live `work-claimed` for cwd/topic (or brief stamped claim id), **refuses stop/idle completion** unless a matching `work-done` exists **or** a live `need-help` is posted. Verify with a disposable topic `tower/substrate-harden-probe`. Files: new hook beside `stop-guard.mjs`; optionally extend `17-field-pull` / bridge. Success = finish-without-deposit becomes mechanically hard.

2. **Resolve `work-done.ref` semantics in one place:** Align COMMS-ARCH + profiles + `pheromoneFieldFromRows` + emit docs so `ref` always means **available id** (recommended: matches code+majority live data) *or* change derivation to accept claim id. Add a one-line assert/test in `write-path.test.mjs` / pheromone tests. Kill the 9+12 ambiguous live patterns going forward.

3. **Claim heartbeat reliability:** Raise default `work-claimed` TTL to 90–120s **or** add `pheromone_heartbeat` / latch-held claim (as named in `codify-stigmergy.done`). File: `tower-ledger.mjs` `SCENT_TTL_DEFAULTS` + MCP schema help text.

4. **Single completion identity card (docs + thin adapter later):** Document `work_item_id = work-available.id`, `agent_id = from` (registration name), `payload_ref = brief|artifact path`. Defer RuntimeAdapter; do not install Fut in this lane.

**Out of scope for those actions:** home-repo migration to `~/tower`, blank-slate rewrite, replacing Herdr, expanding TraceType enum before the write gate exists.

---

## Field / board ids (this unit)

- Board claim: `t-mst48gih-3uy9` topic `tower/substrate-harden`
- WA: `ph-mst48h09-uuxu`
- Claims/heartbeats: `ph-mst48rs0-of32`, `ph-mst492fj-dsq8`, `ph-mst49r01-vodo`, `ph-mst4a8fl-c6gw`, …
- Report path: `/Users/jrg/agent-core/briefs/tower/substrate-harden/PHASE1-GROUND.md`

---

END Phase 1 GROUND. Phase 2 prescribe awaits operator/concierge open.
