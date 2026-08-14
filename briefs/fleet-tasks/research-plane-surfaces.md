# SAGT plane surfaces — code-level ground truth

**Provenance:** `2026-08-12T16:14:39Z` · `/Users/jrg/agent-core`  
**Researcher pane:** `w2E:p4` · **Board topic:** `agent-core/fleet-tasks`

Read-only pass over Tower (`~/.tower/`), herdr metadata API, statem/twr, and ctl-fleet WORK section. Does not re-summarize CORD-supplied docs.

---

## 1. Tower board / ledger schema

Canonical grammar lives in `~/agent-core/primitives/hooks/tower-ledger.mjs` (re-exported by `~/.tower/lib.mjs`). Storage paths: `~/.tower/board.jsonl`, `~/.tower/ledger.jsonl`, `~/.tower/odometer.jsonl` (separate from ledger).

### 1.1 `board.jsonl` row shape (MCP + CLI)

**Writer:** `board_post` in `~/.tower/server.mjs:208-215`; CLI fallback `cli.mjs post` at `~/.tower/cli.mjs:74-103`.

| Field | Required | Type / values | Notes |
|-------|----------|---------------|-------|
| `id` | yes | string | MCP: `t-${Date.now().toString(36)}-${random}` (`tower-ledger.mjs:64`). CLI: `cli-${crypto.randomUUID()}` (`cli.mjs:94`) |
| `ts` | yes | ISO8601 string | UTC, `new Date().toISOString()` |
| `cwd` | yes | string | Server's `normCwd(process.cwd())` at write time (`server.mjs:32`, `213`) |
| `topic` | yes | string | Thread key, e.g. `agent-core/fleet-tasks` |
| `type` | yes (default `note`) | `claim` \| `finding` \| `note` | MCP enum (`server.mjs:109`); historical rows also carry `done`, `alert`, `deliverable` (legacy hand-rolls) |
| `from` | no | string | Agent role / pane id |
| `body` | yes | string | Self-contained claim/finding/note text |

**No `to` field on board rows.** Operator routing is ledger-only.

### 1.2 `ledger.jsonl` row shapes

**Writers:** `send_to_user`, `ask_user`, `reply`, `mark_relayed`, `relay_inbox` in `server.mjs:155-245`; spine-spawn adds `kind:"lineage"` rows; herdr `40-tower-bridge` adds `question`/`answer`/`deliverable`.

Common envelope: `{ id, ts, cwd, kind, ... }`. `id` format same as board (`tower-ledger.mjs:64`).

| kind | Required fields | Optional | Blocking semantics (`inboxState`, `tower-ledger.mjs:259-267`) |
|------|-----------------|----------|----------------------------------------------------------------|
| `deliverable` | `message` | `title`, `from`, **`to:"operator"`** | Blocks turn-end only when `to === "operator"` |
| `alert` | `message` | `title`, `from`, `to` | Blocks when `to` absent or `to === "operator"` |
| `progress` | `message` | `title`, `from` | Never blocks |
| `question` | `message` | `from`, `options[]`, **`to:"operator"`** | Open until an `answer` row with matching `ref` |
| `answer` | `ref` (question id), `message` | `from` | Closes question |
| `ack` | `ids[]` (message ids) | — | Clears unrelayed guard for listed ids |
| `lineage` | `pane`, `parent`, `role`, `from` | — | Not inbox-guarded (observed in live ledger) |

**Sample rows (live ledger head):**

```json
{"id":"t-mq8ln48f-r475","ts":"2026-06-10T21:47:10.767Z","cwd":"/private/tmp","kind":"deliverable","title":"Test Deliverable","from":"selftest","message":"..."}
{"id":"t-mq8ln48f-2lwe","ts":"2026-06-10T21:47:10.767Z","cwd":"/private/tmp","kind":"question","from":"selftest","message":"TEST question?"}
{"id":"t-mq8lqnkd-zk4v","ts":"2026-06-10T21:49:55.789Z","cwd":"/private/tmp","kind":"ack","ids":["t-mq8ln48f-r475"]}
{"id":"t-mq8lqnke-7fq0","ts":"2026-06-10T21:49:55.790Z","cwd":"/private/tmp","kind":"answer","ref":"t-mq8ln48f-2lwe","message":"TEST answer from user"}
```

Operator questions carry `"to":"operator"` (e.g. ledger row `t-mso1xe1g-0h2l`).

### 1.3 MCP tool schemas and guards

**`board_post`** (`server.mjs:101-113`, handler `208-215`):

- Required: `topic`, `body`
- Optional: `type` (`claim|finding|note`, default `note`), `from`
- **Scratch-cwd refusal:** rejects when `CWD` matches `/^\/(private\/)?tmp\//` or contains `/scratchpad/` (`server.mjs:210-212`)

**`board_read`** (`server.mjs:116-125`, handler `217-220`):

- Optional: `topic`, `limit` (default 50)
- Returns formatted lines: `[ts] (type) from @ topic: body`
- Scoped to server's `normCwd(process.cwd())` via `boardFor(CWD, …)`

**CLI `post` guard differs slightly:** also rejects `/var/folders` (`cli.mjs:88-90`).

### 1.4 Scoping — `normCwd` / `boardFor`

**`normCwd(p)`** (`tower-ledger.mjs:35-62`):

1. `realpathSync(p)` (macOS `/tmp` ↔ `/private/tmp` collapse)
2. If inside git: `git -C <real> rev-parse --path-format=absolute --git-common-dir` → `realpathSync(dirname(commonDir))` — **worktrees collapse to main repo root**
3. Cached in `normCwdCache`

**`boardFor(cwd, { topic, limit })`** (`tower-ledger.mjs:285-292`):

- Filters `cursor.byCwd[normCwd(cwd)]` (or full-file parse when `TOWER_LEDGER_NO_CURSOR=1`)
- Optional `topic` exact match; returns last `limit ?? 50` rows, newest last
- **No global/unscoped board read in MCP** — always scoped to caller cwd. `inboxState(null)` can derive across all cwds (`tower-ledger.mjs:272-276`) but `board_read` never passes falsy cwd.

**Raw unscoped read:** only via `readAllFull(BOARD)` / direct file read — not exposed as a tool.

### 1.5 `cli.mjs` verbs

| Verb | Behavior | Source |
|------|----------|--------|
| `status` | Counts for **this cwd**: unrelayed deliverables/alerts, open questions, last 3 progress beacons; today's odometer burn summary | `cli.mjs:52-65` |
| `inbox` | Full verbatim pending deliverables/alerts + open questions via `renderMessage` | `cli.mjs:66-69` |
| `board` | All board rows for this cwd (default limit ∞ via `boardFor(cwd)`) | `cli.mjs:70-73` |
| `post` | Append board row (same schema as MCP); `--from` override | `cli.mjs:74-103` |
| `burn` | Odometer rollup: spawns/tokens by day (last 7 days) + today's per-spawn detail | `cli.mjs:104-123` |
| `all` | Every cwd with unrelayed/open-question traffic | `cli.mjs:124-134` |
| `projects` | "File cabinet": scan `~/` + `~/infinity/` for `.madewell/` or `.rumen/`; merge live ledger cwds with inbox counts; sort `build` stage first | `cli.mjs:135-170` |

---

## 2. Herdr metadata / token API

Authority: `herdr pane report-metadata --help` (this session), `herdr api schema --json` (protocol 19), live `herdr pane list` JSON, `~/agent-core/primitives/skills/herdr/SKILL.md:77-91`.

### 2.1 `herdr pane report-metadata`

CLI maps to socket method `pane.report_metadata`. **Required:** `pane_id`, `--source <ID>`. All other fields optional.

| Flag | Socket field | Semantics |
|------|--------------|-----------|
| `--display-agent <TEXT>` | `display_agent` | Human prefixed name shown in sidebar/CTRL (`SKILL.md:84`) |
| `--token <NAME=VALUE>` | `tokens.{name}` | Flat string KV; names match `^[A-Za-z0-9_-]{1,32}$`, max **16** token keys per report (`PaneReportMetadataParams`) |
| `--clear-token <NAME>` | `tokens.{name}: null` | Remove one token |
| `--state-label <STATUS=TEXT>` | `state_labels.{status}` | Per-status activity text (e.g. `working=deep in the mines`) |
| `--clear-state-labels` | clears all | |
| `--title`, `--clear-title` | `title` | Separate from label |
| `--agent`, `--applies-to-source` | scopes metadata to agent integration | |
| `--seq <N>` | monotonic seq for merge | |
| `--ttl-ms <N>` | 1–86400000 | Ephemeral metadata; evaporates after TTL |

**Observed live pane shape** (`herdr pane list`, pane `w2E:p4`):

```json
"tokens": {"name":"...", "parent":"w2E:p2", "project":"agent-core", "role":"3-AGNT", "task":"..."},
"display_agent": "AGNT internal plane surfaces — Tower / herdr / statem API ground truth"
```

### 2.2 `herdr tab rename`

`herdr tab rename <TAB_ID> <LABEL>...` — multiple label segments become tab title parts. statem appends glyph segments: `herdr tab rename t.tab_id t.label ...extraGlyphs` (`statem.ts:122`).

### 2.3 `agent.view.set`

Socket method (no dedicated CLI subcommand in `herdr agent --help`). Installs a **transient declarative projection** for the built-in Agents sidebar — filter/sort spec, re-evaluated on agent fact changes (`herdr/docs/.../socket-api.mdx:371-375`). Params include `source`, `label`, `filter` (nested op tree), `sort`. Plugin handler `15-restore-view` calls this on every `pane.agent_status_changed` to restore fleet view after restart (`SKILL.md:244-246`).

### 2.4 `events.subscribe` frame shapes

**Transport:** newline-delimited JSON-RPC over Unix socket (`~/.config/herdr/herdr.sock`). ctl-fleet pattern (`~/herdr-spine/bin/ctl-fleet:39-90`):

**Subscribe request:**

```json
{"id":"sub","method":"events.subscribe","params":{"subscriptions":[{"type":"pane.updated"},{"type":"pane.created"},{"type":"pane.closed"}]}}
```

Subscription `type` uses **dotted** form (`pane.updated`); pushed `event` field uses **underscore** (`pane_updated`).

**Push frames (ctl-fleet handlers):**

| `event` | `data` shape |
|---------|--------------|
| `pane_updated` / `pane_created` | `{ pane: PaneInfo }` — full pane snapshot |
| `pane_closed` | `{ pane: { pane_id } }` or `{ pane_id }` |

**Plugin hook variant** (`herdr-spine/docs/plugin.md:96`): `pane.agent_status_changed` →

```json
{"event":"pane_agent_status_changed","data":{"type":"pane_agent_status_changed","pane_id":"w4:p1","workspace_id":"w4","agent_status":"blocked","agent":"claude"}}
```

**PaneInfo required fields** (schema): `pane_id`, `terminal_id`, `workspace_id`, `tab_id`, `focused`, `agent_status`, `revision`. Optional: `agent`, `agent_session`, `cwd`, `display_agent`, `label`, `tokens` (flat string map, max 32 keys in snapshot vs 16 per report), `state_labels`, scroll/title fields.

### 2.5 Per-pane task list?

**Denied.** Herdr exposes **flat** `tokens: Record<string, string>` and optional `state_labels: Record<string, string>` per pane — no native list/array of tasks. Multiple concurrent tasks would require encoding in token values or separate panes. CTRL reads `tokens.task`, `tokens.verdict`, `tokens.name`, `tokens.role`, `tokens.project` as scalar strings (`ctl-fleet:411-416`).

---

## 3. statem.ts / twr.ts mechanics

Sources: `~/agent-core/primitives/tools/statem/statem.ts`, `twr.ts`, `README.md`.

### 3.1 statem — state derivation

**Inputs:**

- `.madewell/madewell.json` → `stage` (outer), `active[]` entries with `cycle` path + item `id`
- Per-cycle JSON at paths referenced in `active[].cycle` (e.g. `.madewell/cycles/c004.json`)

**Cycle file hybrid reader** (`statem.ts:42-61`, mirrored in ctl-fleet `itemStateOf`):

- If `imagine[]` present: item status from `it.status`, else fall through to `done[]`/`active[]` id arrays
- Else: derive purely from `done[]` / `active[]`

**Derived state object:**

```typescript
{ outer: mw.stage, cycles: { [cycleId]: { phase, items: { [itemId]: status } } } }
```

Enums: outer `discovery|commit|build|land`; inner `imagine|plan|make|verify`; item `done|active|absent`.

### 3.2 Transition detection / baseline

- **Baseline file:** `~/.tower/statem-<project>.json` (override `--baseline`)
- **Cold start:** seed baseline, log once, **no transition spam** (`statem.ts:139-141`)
- **Warm poll:** pure `transitions(prev, next, project)` diff (`statem.ts:66-84`) → zero or more records `{ body, ok }`
- **Poll interval:** default 2000ms (`--interval`); `--once` exits after one poll

### 3.3 Board row format statem appends

```json
{
  "id": "statem-<base36time>-<random>",
  "ts": "<ISO>",
  "cwd": "<project-root realpath>",
  "type": "finding",
  "from": "statem@<project-basename>",
  "topic": "statem",
  "body": "<project> OUTER build→land | INNER c004 plan→make | INNER c004 pending→done (i002) | ..."
}
```

(`statem.ts:87-97`). Body patterns documented in `README.md:22-27`.

### 3.4 Tab glyph rewrite

Reads `~/.tower/statem-tabs.json`: `{ "<project-root>": [{ tab_id, label, cycle }] }`. Invokes `herdr tab rename` with glyph segments only (`statem.ts:100-125`). Outer: `▰▰▱▱` style via `glyphs(v, enum)`; inner cycles add `●<done>◐<remaining>`.

### 3.5 twr — live viewer

**Poll signature:** `${lineCount}:${lastRowId}` (`twr.ts:72-88`) — redraw only on change.

**Sections** (`twr.ts:49-68`):

1. **TRANSITIONS** — rows where `from.startsWith('statem@')`
2. **FINDINGS** — all other scoped rows (orchestrator prose, fleet mail, etc.)
3. **OPEN QUESTIONS** — heuristic: body matches `/question/i` and no later same-`topic` row matches `/ruling|answer/i`

**Scoping:** imports `boardFor` + `normCwd` from `~/.tower/lib.mjs` (`twr.ts:6-7`, `38-41`) — same worktree collapse as MCP. Default poll 2000ms. **Writes nothing.**

---

## 4. ctl-fleet WORK section

Source: `~/herdr-spine/bin/ctl-fleet` (bun, herdr 0.8.0 verified in file header).

### 4.1 Tick architecture

| Interval | Action |
|----------|--------|
| **250ms** | Re-render when `dirty` (`ctl-fleet:557`) |
| **5000ms** | `pollSnapshot()` → `session.snapshot` → `applySnapshot()` → **`refreshSlow()`** (`558`, `133`, `274-295`) |
| **60000ms** | `refreshGit()` for SHIPPED section (`559`) |
| Event stream | Persistent `events.subscribe` for pane create/update/close (`39-90`) |

**All `.madewell`/transcript disk I/O is confined to `refreshSlow()`** (comment line 190, function 274-295). Render path is pure over cached snapshots.

### 4.2 WORK data load (`loadWorkSnapshot`, `ctl-fleet:261-271`)

1. `loadJson(<root>/.madewell/madewell.json)` — mtime-cached (`jsonCache`, 249-258)
2. For each unique `active[].cycle`: load cycle JSON into `cycles` Map (dedupe by cycle path, same as `statem.ts:45-47`)
3. Worktree cwd fallback: `resolveRoot(cwd)` maps `.herdr/worktrees/...` → main repo if only main has `.madewell` (`207-209`)

### 4.3 WORK render — machine plane (`renderWorkMachine`, 433-447)

Per project with agents:

```
WORK
  <project>  <stage> ▰▰▱▱ · N in discovery · M blocked
    <entry.id>  <cycle.id> <phase> ●done◐remain  ORCH <name>
```

Uses same `glyphs()` / `OUTER`/`INNER` enums as statem (`245-248`). Cycle counts via `cycleCounts()` + `itemStateOf()` (`361-373`).

### 4.4 WORK render — project plane (`renderWorkProject`, 449-477)

Single `--project <root>` mode: stage header + per-cycle ORCH line + indented imagine items with `✓/●/○` and optional `AGNT` match via `panesMatching(2, project, itemId)`.

### 4.5 Cost model for a TASKS section

A new TASKS section would cost the same as WORK today if it reads `.madewell/` or pane tokens:

- **Amortized disk:** once per 5s tick per project root (mtime-cached — no re-read if unchanged)
- **Per-frame CPU:** pure Map lookups + string formatting on 250ms dirty renders
- **No extra herdr socket calls** beyond existing snapshot/events
- **Alternative:** derive from flat `tokens.task`/`tokens.verdict` already in pane snapshots (zero disk) — CTRL already uses this for activity lines (`activityOf`, 411-416)

---

## Open questions

1. **Board type drift:** MCP allows only `claim|finding|note`; historical `board.jsonl` contains `done`, `alert`, `deliverable`. Should a task whiteboard treat those as findings or filter them out?
2. **`board_read` vs twr OPEN QUESTIONS heuristic:** twr uses body/topic text heuristics, not ledger `question` rows — task viewer may need both planes.
3. **`agent.view.set` filter spec:** full filter algebra lives in herdr socket-api docs; not duplicated here. Designer should read `~/source/herdr/docs/versions/0.7.5/website/src/content/docs/socket-api.mdx` §Agent view queries if sidebar integration is needed.
4. **Token persistence:** SKILL.md confirms tokens evaporate on server restart; only `agent start` registration names survive — any task board keyed on tokens must re-stamp or read from disk/Tower instead.
