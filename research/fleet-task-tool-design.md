# Fleet task tool — CORD/ORCH whiteboard design

**Status:** Phase 2 design (fleet-tasks mission). No implementation.  
**Audience:** CORD fleet-tasks → operator decision gates.  
**Mental model (operator, binding):** harness todo = personal notebook; this layer = whiteboard sticky notes at CORD/ORCH only.

## Provenance

```
date -u:  Wed Aug 12 16:16:41 UTC 2026
pwd -P:   /Users/jrg/agent-core
HEAD:     0634b9d459356f6a1b09c58aacfa8a6213885978
```

**Inputs this session (read, not re-derived):**
- `briefs/fleet-tasks/mission.md` §1–2 (operator directive + mental model)
- `briefs/fleet-tasks/research-cursor-tasks.md` (Phase 1 — TodoWrite ground truth; 12 sources)
- `briefs/fleet-tasks/research-plane-surfaces.md` (Phase 1 — Tower/herdr/statem/ctl-fleet APIs)
- `primitives/tools/statem/README.md`, `~/herdr-spine/docs/ctl-fleet.md`
- `research/harness-ontology-map.md` (tool-surface matrix; directives store empty)
- `primitives/profiles/{coordinator,orchestrator}.md`, `PROFILES.md`

Anything Phase 1 marked `[UNKNOWN]` stays `[UNKNOWN]` below.

---

## Placement recommendation (plain statement)

**Ship a new standalone CLI tool** (`fleet-task`, source under `primitives/tools/fleet-task/`) with a **mutable project-scoped store** (sibling to `.madewell/`, not Tower JSONL and not herdr tokens). **Compose with** Tower (optional transition findings), herdr (ownership metadata read-only), and ctl-fleet (primary operator render as a `TASKS` section in the Engine Shop CTRL pane). **Do not** put the checklist into the Tower bus, herdr `$task` tokens, or Made Well cycle files.

| Axis | Why this wins |
|------|----------------|
| **AX** (agentic) | One named verb surface for CORD/ORCH — Cursor-like merge-by-id + four states — without touching harness `TodoWrite`. Callable from any harness via PATH CLI (framework contract: path/CLI, not provider). |
| **DX** (developer) | Same pattern as slim/latch/vein/statem: Zig or bun tool, README-owned, no registry harness deploy required for v1. Profiles/directives name the CLI; no hook rewrite of personal notebooks. |
| **UX** (operator) | Checklist glyphs live where the operator already looks (CTRL in Engine Shop), with clear done/not-done/in-progress/cancelled — matching the Cursor checklist excellence Phase 1 documented — without polluting TOWR's prose findings. |

---

## 1. Data model

### 1.1 Status enum (exact)

Mirror Cursor's wire/UI enum from Phase 1 (`research-cursor-tasks.md` §1):

| Status | Meaning | Glyph (operator render) |
|--------|---------|-------------------------|
| `pending` | Not started | `○` (circle) |
| `in_progress` | Single active sticky for that owner scope | `◐` (circle-dashed analogue) |
| `completed` | Done; **kept visible** | `✓` (check-circle) |
| `cancelled` | Obsolete; first-class, not delete-only | `⊘` (slash-circle) |

Legal agent path: `pending` → `in_progress` → `completed` | `cancelled`. Direct jumps to `cancelled` from `pending` allowed (obsolete before start). Server/CLI validates **at most one `in_progress` per owner scope** (see §1.4).

### 1.2 Hierarchy

```
mission     — CORD-owned; one per project coordination cycle (or explicit mission id)
  └─ unit   — ORCH-owned; one feature/bug/chore (maps to ORCH registration / brief)
       └─ task — sticky note; the checklist row the operator sees
```

| Level | id shape (suggested) | Who writes | Who updates status |
|-------|----------------------|------------|--------------------|
| `mission` | `m-<slug>` or project-default `m-default` | CORD | CORD (open/close mission) |
| `unit` | `u-<orch-slug>` | CORD on ORCH spawn, or ORCH self-register | ORCH (rollup from tasks) + CORD (reap/close) |
| `task` | stable string id (caller-chosen, like Cursor `id`) | CORD or ORCH only | Owning plane only (AGNT does **not** write here) |

AGNT/SAGT progress enters the whiteboard **only via ORCH** (after `.done` / board DONE verification) — never by workers calling `fleet-task`. Workers keep harness TodoWrite as personal notebook.

### 1.3 Task record fields

```
id            string   required  — stable within unit
content       string   required  — human title (plain words; never raw item ids alone)
status        enum     required  — pending|in_progress|completed|cancelled
active_form   string   optional  — present-tense label while in_progress
                                 (Cursor host has activeForm; bundle depth [UNKNOWN]
                                  per Phase 1 — adopt as optional UX nicety)
owner_role    enum     required  — cord|orch
owner_pane    string   optional  — herdr pane_id at last write (advisory)
owner_agent   string   optional  — registration name (e.g. orch-fleet-task-design)
unit_id       string   required
mission_id    string   required
deps          string[] optional  — task ids within same unit (Cursor protobuf has
                                 dependencies[]; wire behavior [UNKNOWN] — store only)
created_at    ISO8601
updated_at    ISO8601
```

Unit and mission records carry rollup fields (derived, not hand-edited):

```
progress: { pending, in_progress, completed, cancelled, total }
rollup_status: pending | in_progress | completed | cancelled
```

### 1.4 Ownership scopes & single in_progress

- **ORCH scope:** at most one `in_progress` task among tasks owned by that ORCH unit.
- **CORD scope:** at most one `in_progress` task among CORD-owned mission-level stickies (mission hygiene), independent of ORCH scopes.
- Multiple ORCHs may each have one `in_progress` simultaneously (fleet parallelism).

### 1.5 Progress + rollup semantics

| From | To | Rule |
|------|-----|------|
| tasks → unit | Unit `rollup_status` = `completed` iff all tasks `completed` or `cancelled` and ≥1 `completed`; `cancelled` iff all cancelled; `in_progress` if any task `in_progress` or (any `completed` and any `pending`); else `pending`. |
| units → mission | Same aggregation over unit `rollup_status` values. |
| mission → Engine Shop | CTRL `TASKS` line: mission title + `✓N/◐M/○P` counts + active sticky `active_form` or `content`. |

**AGNT → ORCH:** not automatic DB fan-in. ORCH marks unit tasks `completed` when it verifies worker `.done` + board report (spawner truth). This preserves "actor is not the scorer" (constitution / control-flow).

### 1.6 Store shape (mutable, not append-only)

Path (recommended): `<project-root>/.fleet-tasks/state.json`  
(worktree collapse: resolve via git common dir — same idea as Tower `normCwd`, implement once in the CLI).

Why not Tower `board.jsonl`: append-only `claim|finding|note` cannot express merge-by-id checklist patches; twr would drown in noise.  
Why not herdr tokens: flat `Record<string,string>`, max 16 keys/report, **evaporate on server restart**, `$task` live-overwritten by agent monitor (`spawn.md` trap; plane-surfaces §2.5).  
Why not `.madewell/`: Made Well owns stage/phase/item lifecycle for product work; whiteboard is coordination sticky notes — compose side-by-side, do not overload.

Optional: append a Tower `finding` on unit/mission rollup transitions (statem-shaped), topic `<project>/fleet-tasks` — **side effect**, not source of truth.

### 1.7 Write API semantics (Cursor parity)

```
fleet-task write --merge true|false --unit <id> --json '[{id,content,status,...}]'
```

- `merge=false` — replace that owner's task list for the unit (seed / reset).
- `merge=true` — patch by `id`; omitted ids unchanged.
- Validation returns `needs_in_progress` when the plane's rules require an active sticky and none is set (Cursor's `needs_in_progress_todos` analogue).
- Completed/cancelled rows **remain** in the list until an explicit prune command (operator/CORD hygiene), matching Cursor "keep checked items visible."

---

## 2. Tool surface

Harness- and model-agnostic: **capabilities by path and CLI** (no provider names in the contract).

### 2.1 Primary — CLI

```
~/.local/bin/fleet-task          # install target (source: primitives/tools/fleet-task/)

fleet-task init [--project <root>]
fleet-task mission open|close|show …
fleet-task unit open|close|show …   # CORD/ORCH
fleet-task write --merge …          # sticky create/update (CORD/ORCH only)
fleet-task read [--unit|--mission|--status …]
fleet-task render [--unit|--mission]   # glyph checklist to stdout (twr-like, optional)
fleet-task prune --completed|--cancelled   # explicit hygiene
```

Agents invoke via Shell / bash — same as `latch`, `slim`, `herdr`. No harness-native tool name collision with `TodoWrite`.

### 2.2 Secondary — MCP (optional, later)

Thin MCP server wrapping the same CLI store (pattern: tower/bigfile). Tool names must **not** be `TodoWrite` / `todo_write`. Suggested: `fleet_task_write`, `fleet_task_read`. v1 can ship CLI-only.

### 2.3 Not in v1

- pi extension that rewrites or shadows harness todos
- PreToolUse / session hooks that intercept TodoWrite
- Encoding checklists into `herdr pane report-metadata --token`
- AGNT/SAGT access (profiles deny; CLI may warn if `role` token is `3-AGNT`/`4-SAGT`)

### 2.4 Who may call what

| Role | `write` / mission|unit open | `read` / `render` |
|------|------------------|-------------------|
| CORD | yes (mission + any unit) | yes |
| ORCH | yes (own unit tasks) | yes |
| AGNT/SAGT | no | read optional for awareness; default deny write |
| CTRL/TOWR panes | n/a (display) | render via ctl-fleet / optional `fleet-task render` |

---

## 3. Operator-facing rendering

### 3.1 Primary recommendation — `TASKS` section in CTRL (Engine Shop)

Extend `~/herdr-spine/bin/ctl-fleet` (display-only) with a **TASKS** block above or beside existing **WORK** (Made Well):

```
TASKS
  agent-core  mission m-default  ✓2 ◐1 ○3 ⊘0
    ORCH fleet-task-design  ◐ write design doc
      ✓ Phase 1 collected
      ◐ Draft design sections
      ○ Board + .done
```

**Cost model** (from plane-surfaces §4.5): same class as WORK — mtime-cached read of `.fleet-tasks/state.json` inside `refreshSlow()` (5s), pure render on 250ms dirty ticks. No extra herdr socket verbs.

**Why primary:** Operator already centralizes observability in Engine Shop (`ctl-fleet.md` doctrine 2026-08-12). Cursor excellence is the checklist in a stable chrome surface — CTRL is that surface for the fleet.

### 3.2 Rejected alternatives

| Option | Verdict | Why |
|--------|---------|-----|
| Dedicated per-workspace task pane | Reject as primary | Violates Engine Shop centralization; duplicates CTRL; reap/topology cost. Optional deep-dive `fleet-task render --watch` later, like twr. |
| TOWR section for checklist | Reject as primary | twr is prose bus (TRANSITIONS/FINDINGS/OPEN QUESTIONS). Checklist state ≠ append-only findings; would fight COMMS-ARCH planes. Optional: transition one-liners only. |
| Sidebar via `agent.view.set` | Reject for v1 | Filter algebra exists; no native task-list type; would overload Agents sidebar meant for pane attention. Revisit only if CTRL proves insufficient. |
| Pane `$task` token as checklist | Reject | Scalar, overwritten, non-durable (Phase 1 plane-surfaces + spawn.md). Keep `$task` as activity line only. |

### 3.3 UX rules (borrowed from Cursor, evidence-backed)

1. Four distinct states including cancelled.  
2. Single focus sticky per ORCH (and per CORD mission scope).  
3. Completed stay checked.  
4. Silent agent updates preferred — checklist carries state; don't narrate every patch in chat.  
5. Live refresh via ctl-fleet poll (not mid-token streaming — `[UNKNOWN]` whether we can match Cursor mid-turn IDE streaming outside the IDE; fleet refresh at ≤5s is the honest analogue).

---

## 4. Adoption path

Concrete, named files (no implementation now — landing checklist for the later mission):

| Step | File / surface | Change |
|------|----------------|--------|
| 1 | `primitives/tools/fleet-task/` | New tool (CLI + README + tests). Install `~/.local/bin/fleet-task`. |
| 2 | `primitives/profiles/coordinator.md` | Mandate: CORD maintains mission whiteboard via `fleet-task`; never substitute harness TodoWrite for fleet visibility. |
| 3 | `primitives/profiles/orchestrator.md` | Mandate: ORCH seeds unit tasks at plan; patches on verify; AGNT notebooks stay harness-local. |
| 4 | `primitives/profiles/PROFILES.md` | One-line pointer to fleet-task in role table. |
| 5 | `primitives/directives/` (currently **empty** per ontology map) | Add `fleet-task-whiteboard.md` — spawn-time law text for CORD/ORCH briefs. |
| 6 | `~/herdr-spine/bin/spine-spawn` brief templates / greeting skips | Inject "Pre-Verified: fleet-task CLI on PATH; unit id = …" into orch/cord brief stubs when present. |
| 7 | `~/cursor-shim/rules/cursor-fleet.md` + cursor-shim orch path | Same mandate for kind=cursor ORCH/CORD (operator correction 2026-08-12: cursor-fleet spawns). |
| 8 | `~/herdr-spine/bin/ctl-fleet` | Read `.fleet-tasks/state.json`; render TASKS section. |
| 9 | `primitives/rules/control-flow.md` §Observability | Document whiteboard vs Made Well WORK vs Tower mail (three planes). |
| 10 | Optional | `primitives/skills/fleet-task/SKILL.md` + agent-core registry skill deploy — after CLI stabilizes. |

**Generalized spawn:** when CORD opens an ORCH, brief template includes:

```
Pre-Verified Facts:
- fleet-task binary: ~/.local/bin/fleet-task
- unit id: u-<slug>
- mission id: m-default (or …)
- You write fleet-task stickies for THIS unit only.
- Do not wrap/hook harness TodoWrite (personal notebook).
```

---

## 5. Non-interference proof

Hard requirement from operator directive (mission §1) and orch brief.

| Concern | Proof |
|---------|--------|
| **Separate store** | Harness todos live in harness session state (`[UNKNOWN]` exact Cursor persistence path — Phase 1). Fleet stickies live in `<project>/.fleet-tasks/state.json`. No shared file. |
| **Separate tool name** | Model/host tool remains `TodoWrite` (Cursor) / harness equivalents. Fleet surface is CLI `fleet-task` (and later MCP `fleet_task_*`). No alias, no shim that routes TodoWrite into the whiteboard. |
| **Separate render** | Personal notebook renders in harness UI. Whiteboard renders in CTRL `TASKS` (and optional `fleet-task render`). No injection into harness todo panel. |
| **No hooks** | Design forbids PreToolUse/PostToolUse/session hooks that read, wrap, redirect, or mirror TodoWrite. slim-guard-style rewrites are explicitly out of scope for this tool. |
| **No AGNT write path** | Profiles + CLI role guard: workers cannot update the whiteboard; ORCH scores after verify. Personal notebooks remain the only in-pane todo for AGNTs. |
| **Ontology** | harness-ontology-map places tools as PRESENT-MANUAL CLIs — fleet-task joins that class; it does not become a harness "todo" primitive type. |

If any future PR adds a TodoWrite interceptor, it **fails this design** — reject.

---

## 6. Placement detail & prior-art verdicts

### 6.1 Three-way placement

| Placement | Verdict | AX | DX | UX |
|-----------|---------|----|----|-----|
| **New standalone tool** (chosen) | **Adopt** | Clean agent verb; Cursor-like semantics under our control | Matches slim/latch/vein/statem shop | CTRL checklist chrome |
| herdr control plane as store | **Reject as store** | Tokens/API are pane metadata, not lists | Would fight herdr schema (no task array) | Evaporates on restart; `$task` trap |
| Tower bus as store | **Reject as store** | Board is mail/findings, wrong grammar | Append-only JSONL ≠ merge checklist | TOWR becomes noisy; status≠mail law |

**Compose pattern (statem precedent):** mutable truth on disk → optional Tower finding on transition → herdr only for pane identity → CTRL/twr for eyes.

### 6.2 Prior art — compose-with vs supersede

| Prior art | Verdict | Rationale |
|-----------|---------|-----------|
| **Harness TodoWrite** (Cursor etc.) | **Compose-with (non-interference)** | Personal notebook. Untouched. Design proof in §5. |
| **statem + twr** | **Compose-with** | Keep Made Well stage/phase transitions + TOWR prose. Whiteboard is orthogonal coordination checklist. Optional: emit `finding` rows on rollup like statem does for `.madewell/`. Do **not** supersede glyph tab titles. |
| **ctl-fleet WORK** | **Compose-with (extend)** | WORK stays Made Well. Add TASKS section reading `.fleet-tasks/`. Do not replace WORK rows with stickies. |
| **Tower board/ledger** | **Compose-with (bus only)** | Fleet mail, CLAIMs, DONEs, operator questions stay on Tower. Checklist state does not live in `board.jsonl`. Optional transition findings only. |
| **herdr `$task` / tokens** | **Compose-with (activity line only)** | Keep stamping title into four carriers at birth. Do **not** encode multi-task checklists in tokens. Supersede nothing — refuse the trap. |
| **`.madewell/` cycles** | **Compose-with** | Product/item lifecycle ≠ CORD/ORCH sticky whiteboard. Link by convention (`unit_id` ↔ cycle/item id) when useful; never store stickies inside cycle JSON. |

---

## 7. Decision points for the operator

Genuine forks only. Each carries a recommendation. (CORD escalates these `to:"operator"`; this ORCH posts them on the board for CORD to relay.)

| # | Fork | Options | Recommendation |
|---|------|---------|----------------|
| D1 | **Store location** | (a) `<project>/.fleet-tasks/state.json` (b) `~/.tower/fleet-tasks/<normCwd-hash>.json` | **(a)** — repo-local, survives with the project, mirrors `.madewell/`, works offline from Tower. Use normCwd-style worktree collapse inside the CLI. |
| D2 | **Primary operator chrome** | (a) CTRL TASKS section (b) dedicated watch pane (c) TOWR section | **(a)** — Engine Shop doctrine; (b) optional later; (c) rejected as primary. |
| D3 | **Implementation language** | (a) Zig (slim/latch/vein family) (b) bun/ts (statem/ctl-fleet family) | **(b) for v1** — fastest path to CTL integration and JSON mutation; revisit Zig if the verb set freezes and hot-path matters. |
| D4 | **Tower transition side-effects** | (a) emit findings on rollup (b) silent disk-only | **(a)** — one line per unit/mission rollup, topic `<project>/fleet-tasks`, `from: fleet-task@…`, so TOWR stays aware without becoming the store. |
| D5 | **MCP in v1** | (a) CLI only (b) CLI + MCP | **(a)** — AX is fine via Shell; add MCP when CORD/ORCH friction is measured. |
| D6 | **AGNT read access** | (a) deny all (b) read-only | **(b)** — workers may `fleet-task read --unit` for situational awareness; write remains CORD/ORCH. |

Non-forks (already decided by operator directive — not re-opened):
- Harness TodoWrite stays; no wrapping.
- Layer is CORD/ORCH only for writes.
- Excellence bar = Cursor checklist UX (four states, one focus, completed visible, merge-by-id).

---

## Illustrative CLI sketch (non-normative)

```bash
# CORD opens mission + unit when spawning ORCH
fleet-task mission open --id m-default --title "fleet-tasks"
fleet-task unit open --id u-design --mission m-default --title "ORCH design doc"

# ORCH seeds stickies (merge=false)
fleet-task write --unit u-design --merge false --json '[
  {"id":"t1","content":"Draft data model + tool surface","status":"in_progress","active_form":"Drafting data model"},
  {"id":"t2","content":"Placement + prior-art verdicts","status":"pending"},
  {"id":"t3","content":"Board finding + .done","status":"pending"}
]'

# ORCH patches after verify (merge=true)
fleet-task write --unit u-design --merge true --json '[
  {"id":"t1","content":"Draft data model + tool surface","status":"completed"},
  {"id":"t2","content":"Placement + prior-art verdicts","status":"in_progress","active_form":"Writing placement"}
]'
```

---

## Sources

| # | Source | Role |
|---|--------|------|
| S1 | `briefs/fleet-tasks/mission.md` | Operator directive + mental model |
| S2 | `briefs/fleet-tasks/research-cursor-tasks.md` | TodoWrite schema, states, UX, UNKNOWNs |
| S3 | `briefs/fleet-tasks/research-plane-surfaces.md` | Tower/herdr/statem/ctl-fleet APIs |
| S4 | `primitives/tools/statem/README.md` | Transition + glyph prior art |
| S5 | `~/herdr-spine/docs/ctl-fleet.md` | Engine Shop CTRL / WORK |
| S6 | `research/harness-ontology-map.md` | Tool surface class; empty directives |
| S7 | `primitives/profiles/{coordinator,orchestrator,PROFILES}.md` | Adoption injection points |

---

## Out of scope (later mission)

Implementation, ctl-fleet patch, profile text edits, MCP server, committing this file (CORD gates), operator mail delivery (CORD).
