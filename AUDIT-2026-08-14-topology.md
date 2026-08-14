# AUDIT 2026-08-14 — The Full Topology

**Method:** five parallel read-only sweeps (agent-core estate · herdr+spine ·
Tower+circadian · harness parity · tools/madewell/cursor-shim) over the live
machine, reconciled against this session's live probes (write-gate 2/0 in all
three harnesses, spawn-door shape tests, sync runs). Every claim below has a
path. Companion visualization: `AUDIT-2026-08-14-topology-zine.html`.

Do NOT use emojis. Provider/model-agnostic per house law.

---

# Part I — The mental model

## The organism, in one sentence

This machine runs a single made organism: **agent-core is its genome, herdr
is its body, herdr-spine is its reflex arcs, Tower is the environment it
senses and marks, the gates are its immune system, circadian is its memory
and sleep, Made Well is its habit of working, and the three harnesses are
interchangeable engines it thinks with.** The operator is the only
irreplaceable part.

## The ten planes (striations, bottom-up)

| # | Plane | What lives there | The one rule of that plane |
|---|---|---|---|
| 0 | **OPERATOR** | Josh | Names work; accepts or rejects outcomes. Never the scheduler, auditor, or API. |
| 1 | **ENGINES** | claude-code, pi, cursor (+ cursor-shim bridge) | Interchangeable inference. Context dies every window — nothing valuable may live inside an engine; it must be pushed into a lower plane. |
| 2 | **BODY** (herdr) | Server-owned terminals, panes/tabs/workspaces, agent identity+status detection, metadata tokens, notifications, plugin surface | Processes survive the operator. Tokens do NOT survive server restart; `agent start` registrations do. |
| 3 | **REFLEX ARCS** (herdr-spine) | 17 verbs (spine-spawn/claim/report/watch/workspace/ruling/…), 8 event handlers, ctl-fleet, popups (greeting, inbox) | Discipline compiled into commands so no spawn/close/report can skip a step. |
| 4 | **FIELD** (Tower) | board/ledger/pheromones/odometer/flight over append-only JSONL; 5 comms planes; MCP + CLI surfaces | Deposit, never deliver. One message, one audience, once, in full. Semantic done = successful deposit. |
| 5 | **GATES** (enforcement) | grounding-hook, slim, write-gate, spawn-door, enforce-brief, stop-guard, ask-bridge, credential-guard | Every law names its enforcer: DOOR / HOOK / DOCTRINE (`primitives/rules/ENFORCEMENT.md`). DOCTRINE = compilation bug. |
| 6 | **MEMORY** (circadian) | mind repo (constitution / SELF / USER / NOW / 427 belief atoms), wake/graze/sleep hooks, REM+doctor launchd, kill switch | Storage dumb, metabolism smart. Motion is the metric. The constitution is unwritable by experience. |
| 7 | **GENOME** (agent-core) | canonical core + per-harness deltas, 10 rules, 5 profiles, ~95 skills, registry + zig sync CLI | Edit canonical, never deployed. Sync = gene expression into engines. |
| 8 | **METHOD** (Made Well) | outer Discovery→Commit→Build→Land; inner Imagine→Plan→Make→Verify; three tiers (template `~/madewell` · lab `~/.madewell-meta` · feeder `~/Infinity/arc/.madewell`); statem | Two stop states only: Done (proof on disk) or Parked (pickup path). Diagnosis is not Land. |
| 9 | **ROLES** | concierge → CORD → ORCH → AGNT/SAGT profiles | One tier, one duty. Ranks 1–4 coordinate through the field, never peer-to-peer. |
| 10 | **INSTRUMENTS** | slim, latch, vein, assay, super-search (colgrep/coraline/pickbrain/rg/bigfile), composto | Truth-legal: exit codes propagate, truncation marked, claims settled by measurement (vein), not vibes. |

## Why it feels like a frankenstein (the mechanism, not the mood)

The organism has **two circulatory systems for its own law**, and only one of
them has eyes:

1. **The managed loop** — `~/.agent-core/registry` (49 primitives) →
   `agent-core sync/status`. It sees: the directive core, 36 skills, ONE hook
   (slim-guard), 2 commands, 10 subagents. `HARNESS-PARITY.md` proudly reports
   "214 ok / 0 stale / 0 missing" — **about this subset only.**
2. **The hand-wired loop** — everything the organism actually evolved since
   ~08-12: every enforcement hook (write-gate, spawn-door, credential-guard,
   flight-recorder, stop-verdict, session-boundary ×3, session-capture,
   herdr-task-report), the entire Tower deploy (`~/.tower/` symlinks), all
   four Zig instruments, the spine plugin wiring, the pi extension shims, the
   cursor hooks.json entries. Registry hits for these: **zero.** Drift here is
   policed by scattered per-component checkers (drift-check.mjs,
   server-drift.test.mjs, `herdr integration status`) or by nothing.

Every "what is this piece / why is it here / is it even on?" moment you have
is a piece living in loop 2. The monster is not the number of parts — it is
that **the mirror only reflects the parts that stopped moving.** The registry
was built when the estate was skills+directives; the estate grew an immune
system, a nervous system, and a memory, and none of them were ever put in
front of the mirror.

## The codification path (toward the singular entity)

The wrap you want is not a rewrite. It is finishing the mirror, in order:

1. **Registry absorbs loop 2.** New primitive kinds in the registry grammar:
   `hook/*` per harness surface (the zig CLI already has `hooks_json` merge
   machinery — generalize `cursorHookEvent()` beyond slim-guard, add a
   settings.json merge for CC and an extensions-shim writer for pi), `tool/*`
   (binary + install path), `service/*` (tower deploy, launchd agents).
   Definition of done: `grep write-gate ~/.agent-core/registry` is non-empty.
2. **One honest mirror.** `agent-core status` becomes the ONLY parity
   instrument: it subsumes HARNESS-PARITY.md (generated, not hand-kept),
   `herdr integration status`, tower drift-check, and `component-verify
   --coverage`. A blank cell is a NO. The Part III matrix below is the seed
   data.
3. **VERIFY law enforced.** Every registered component carries a VERIFY.toml
   (today: 5 of ~30). `component-verify --coverage` gating the registry is
   the same write-gate pattern applied to the genome itself.
4. **Then the wrap.** Once one registry describes everything and one command
   audits everything, "the singular entity" is a directory + an installer +
   a name. Made Well's SPEC.md (ledger-and-door contract, Rule 1 portability)
   is the closest existing skeleton for that final shape — the organism
   becomes a cartridge.

Rule of thumb going forward (deposited as a ruling pattern already): **a new
capability that isn't in the registry is a loop-2 organ — invisible, and
therefore already rotting.**

---

# Part II — Plane-by-plane inventory (condensed; sweeps hold the detail)

## Body — herdr 0.8.0
Server owns all PTYs (`herdr.sock` JSON API + client sock). Objects:
session / workspace / worktree / tab / pane (24 verbs) / agent (identity +
Idle/Working/Blocked detection, 21 known kinds, `agent prompt --wait` =
native verified submit) / metadata tokens (≤32 keys/pane, value ≤80c, TTL ≤24h,
**die on restart**) / notifications / `api snapshot` + `events.subscribe` /
plugin surface (events, startup, actions, link_handlers; no permission
scoping). Integrations: claude v7 current · cursor v1 current · **pi v5 <
v8 OUTDATED**.

## Reflex arcs — herdr-spine
Verbs: spine-spawn (the spawn door; `--kind cursor` refused → cursor-shim),
spine-claim (advisory `claim_<slug>` tokens, NOT a mutex), spine-report
($task/$verdict/$q), spine-watch (event-driven, TTL expiry is SILENT),
spine-workspace + spine-ruling (typed doors, 08-14), spine-inbox (prefix+i),
spine-greeting (prefix+space), spine-lab (guarded experiments + tripwire),
spine-agent/sigil (synthetic agents — library-only today), spine-fleet /
spine-wave (manual-only), ctl-fleet (CTRL pane), spine-startup / spine-hook /
spine-wormhole (plugin-wired, live). Handlers: 10-notify (toast law) ·
15-restore-view · 16-parent-wake · 17-field-pull · 20-reflex (**dry-run,
never fired**) · 30-choreo (**flag-disabled**) · 40-tower-bridge (ledger
plane) · 50-scent-digest (**overlaps 17** — both live).

## Field — Tower
Canonical `primitives/mcps/tower/`; `~/.tower/` = symlinks + state (board
6.4MB · ledger 1.2MB · pheromones 333KB · odometer 288KB · flight 813 files ·
deliverables 452). 10 MCP tools; CLI verbs status/inbox/board/post/emit/
field/scan/burn/all/projects (`post` = the only sanctioned non-MCP write).
11 hooks — write-gate is the ONLY one on all three harnesses; odometer(+stop),
prompt-inject, enforce-brief, ask-bridge (4 bindings), stop-guard are CC-only.
Doctrine: COMMS-ARCH (design of record), RESPONSIBLE-PARTY-AND-NQ (nQ),
DEPLOYMENT. `rotate.mjs` deployed, **never scheduled**. `dead-letter.jsonl`
**specified in three docs, written by no code**.

## Gates — the enforcement layer
Ledger: `primitives/rules/ENFORCEMENT.md`. Live DOORs/HOOKs: grounding
(CC+pi), slim (×3), write-gate (×3, one canonical body), spawn-door (×3),
spine-workspace/--why, spine-ruling/--scope, credential-guard (git-level),
enforce-brief (CC, `Agent` matcher ONLY — `Task|Workflow` bypass), stop-guard
(CC). DOCTRINE queue: brief-lint (provider/model names), epistemics SOURCES
check, statem-gated reaping.

## Memory — circadian
wake/graze/sleep/status hooks (CC full · pi full via circadian-mind.ts ·
**cursor reads but NEVER writes** — no sleep, no graze: cursor sessions are
invisible to REM). REM (launchd 09:00/21:00) is the only mind-repo committer;
doctor 09:05/21:05. Mind: constitution (unwritable) · SELF 5326/6000 ·
USER 1576/2000 · NOW 248/3000 · 427 atoms. **KILL SWITCH ACTIVE — see P0-1.**

## Genome — agent-core
Canonical core + 3 deltas → composed entrypoints (`~/.claude/CLAUDE.md`,
`~/.pi/agent/AGENTS.md`, `~/AGENTS.md`). 10 rules (read-on-demand), 5
profiles + models.json/profile-model/selection.json, ~40 registered skills of
~95 in store (55 unregistered), 10 subagents (CC+cursor), zig sync CLI with
golden-file tests. Registry mtime 08-12 — predates the entire enforcement
wave.

## Method — Made Well
Template `~/madewell` (SPEC v1: ledger-and-door, RFC-2119, no-databases) ·
lab `~/.madewell-meta` (module board, 9-cell rubric) · feeder
`~/Infinity/arc/.madewell` (stage build, cycle d-ws-c live). **Two different
`mw` binaries**: `~/.local/bin/mw` → lab; Arc's vendored `bin/mw` → Arc.
statem + twr make the loops observable.

## Instruments
slim (486K) · latch (435K) · vein (791K) — installed, truth-legal. **assay:
source+skill+tests, NO BINARY (never `zig build`).** super-search 6 layers:
colgrep ok · coraline ok · pickbrain ok · **kotadb DEAD (retired 08-06, still
dialed)** · rg ok · **bigfile layer BROKEN (dead `05_tools/` path in canonical
AND deployed copy)**. bigfile MCP itself healthy (CC + cursor). composto
(Homebrew). Local LLM :10240 live (assay/circadian consumer).

## Bridge — cursor-shim
Rip-out-able (`~/cursor-shim/`, delete = gone). cursor-spine (spawn primitive,
profile+model resolved from agent-core) · cursor-fleet (up/orch/make/fanout/
down; refuses outside herdr). The verify beat: `make` = HARD bifurcation —
coder and test-maker in separate worktrees from the same plan; arbiter
triages. Heavily exercised (693 instr entries), not shelfware.

---

# Part III — The parity matrix (master, 2026-08-14)

FULL = same semantics everywhere. Adapter differences are fine; missing
capability is not.

| Capability | claude-code | pi | cursor | Verdict |
|---|---|---|---|---|
| Directive entrypoint (composed) | CLAUDE.md | AGENTS.md | ~/AGENTS.md | FULL |
| Memory WAKE | hook | extension | boundary leg 4 | FULL |
| Memory GRAZE | 2 bindings | turn_end | **none** | MISSING-cursor |
| Memory SLEEP | hook | extension | **none** | MISSING-cursor (cursor never deposits an episode) |
| Statusline vitals | statusline | none | disabled | CC-only |
| Flight recorder | 2 events | extension | 2 events | FULL |
| Session boundary legs 1–4 | session-start.mjs | split ×2 ext | boundary.sh | FULL |
| Stop verdict → $verdict | hook | extension | **none** | MISSING-cursor |
| $task report | 4 bindings | extension | **none** | MISSING-cursor |
| Herdr agent state | v7 | **v5 < v8** | v1 | pi outdated |
| Tower inbox @ start | hook | extension | leg 1 | FULL |
| Tower inject per turn | prompt-inject | none | none | CC-only |
| Stop-guard (relay refusal) | exit 2 | inject-only | **none** | PARTIAL |
| Write-gate | exit 2 | sendUserMessage | followup_message | **FULL** (the model to copy) |
| Spawn-door | PreToolUse | tool_call block | preToolUse | **FULL** |
| Grounding hook | 3 bindings | native ext | **none** | MISSING-cursor |
| Slim | guard | rewrite ext | guard | FULL |
| Deposit reminder | hook | extension | **none** | MISSING-cursor |
| Ask-bridge ($q) | 4 bindings | inline | **none** | MISSING-cursor |
| Odometer (burn) | 2 hooks | **none** | **none** | CC-only |
| Enforce-brief | Agent matcher only | out-of-band (spine) | out-of-band (shim) | PARTIAL + matcher gap |
| Pheromone surface | MCP | CLI only | MCP | PARTIAL-pi |
| Bigfile | MCP | via router (**broken layer**) | MCP | PARTIAL |
| Skills | 42 | 35 | 54 | 35 shared; 7 CC-only; 19 cursor-native |
| Subagent defs | agents/ | n/a by design | 13 | by-design asymmetry |
| MCP servers | tower,bigfile,varlock | none by design | tower,bigfile,arc | by-design asymmetry |

**Single-harness capabilities (the parity debt, ranked by pain):**
cursor lacks the write side of memory (sleep/graze), grounding, stop-guard,
$verdict/$task, deposit-reminder, ask-bridge. pi lacks odometer and a
first-class pheromone surface. CC uniquely holds prompt-inject, statusline,
odometer, superset notify, SubagentStart inject.

---

# Part IV — Findings, ranked

## P0 — live defects (wrong behavior happening now)

1. **Circadian kill switch is active on a counting bug.** `scoreboard.jsonl`
   holds 2 verdict rows, both `ok`; the `bad×905` streak counts *windows with
   no recorded verdict* as bad verdicts. Compounding: `greeting.md`'s current
   render is three file paths, not a greeting (REM render failure) — so no
   `ok` can be earned. Result: SELF+USER (6.9k tokens of earned memory)
   withheld on every wake, machine-wide, since the streak crossed R7.
   Fix shape: verdict-absence must be neutral, not bad; repair the greeting
   render; propagation flatline (4 of last 5 REM events `propagated 0`) needs
   its own look. Blast radius = the mind repo: operator sign-off first.
2. **super-search layer 6 dead path** — `primitives/05_tools/bigfile/...` in
   canonical AND deployed `search.ts:32` (tree was flattened to `tools/`).
   Layer silently whiffs on every >3k-line file. Same dead path in bigfile's
   README install instructions.
3. **KotaDB is dead but still advertised** — layer 4 dials :7001 (nothing
   listens), the super-search skill text tells agents to prefer
   `mcp__kotadb__*` (tools do not exist), repos.json still maps Arc to a
   repositoryId. Also ~810MB reclaimable (`~/.kotadb/kota.db` + 142MB err log).
4. **Idle panes are double-prompted** — handlers `17-field-pull` (08-13,
   unconditional) and `50-scent-digest` (08-12, flag file EXISTS) are both
   live and functionally overlapping. Pick one; retire the other.
5. **`dead-letter.jsonl` is fiction** — specified in COMMS-ARCH,
   RESPONSIBLE-PARTY-AND-NQ, and listed as a DOOR in ENFORCEMENT.md; no code
   writes it. Malformed rows currently vanish.
6. **enforce-brief matcher gap** — binds `Agent` only; `Task|Workflow`
   spawns bypass brief validation entirely (odometer already matches all
   three — copy its matcher).

## P1 — structural (the frankenstein roots)

7. **Registry blindness** (Part I mechanism) — enforcement hooks, Tower
   deploy, Zig tools, spine wiring all invisible to `agent-core sync/status`;
   HARNESS-PARITY.md's "0 missing" is false against the estate.
8. **Cursor never writes memory** — sessions read the mind and deposit
   nothing; work done in cursor is invisible to REM forever.
9. **board.jsonl unbounded** — 6.4MB, fully parsed by stop-guard +
   prompt-inject + session-start on their events; `rotate.mjs` deployed but
   never scheduled (its DEPLOY-ROTATE.md doesn't exist).
10. **cc-hooks/server.mjs twin** — a structurally duplicated Tower server in
    herdr-spine with a history of resync commits; drift-prone by design.
    TOWER-AUTO-CONTRACT.md also lives outside both tower dirs while being
    cited as authority; COMMS-ARCH says its §9 was superseded — amendment
    unverified.
11. **pi herdr integration outdated** (v5 < v8) — `herdr integration install
    pi` refreshes.
12. **assay never built** — the honesty instrument for memory propagation
    doesn't exist as a binary, during a memory incident (P0-1) it was built
    to diagnose.

## P2 — parity debt + hygiene

13. Cursor gaps: grounding, $verdict/$task, deposit-reminder, ask-bridge,
    stop-guard (see matrix). pi gaps: odometer, pheromone surface.
14. DOCTRINE queue: brief-lint (provider/model names in briefs), epistemics
    SOURCES check, statem-gated reaping. SubagentStop deliberately ungated.
15. Stale docs: spine MANUAL.md (pinned to 0.7.4/July), TAXONOMY.md (06-28),
    PRIMER.md (04-14), WORK.md (06-28, dead ACTIVE items), agent-core
    AGENTS.md deploy-targets table (no cursor; claims a pi symlink that was
    ruled out), 15-restore-view stale docstring, cli.mjs header missing
    all/projects, spawn.md + ctl-fleet.md RETIRED markers pending code.
16. Orphans: 55 unregistered store skills; backend-first-security doubled
    (rule AND skill); debugging-async is a doc masquerading as a skill; empty
    dirs (primitives/agents/, hooks/tower/, logs/, scripts/); spine-backup
    files sitting in LIVE load paths (`~/.pi/agent/extensions/*.spine-backup*`
    may be glob-loaded); `~/.cursor/hooks.json.bak-*`; cursor-shim .done/.bak
    artifacts; `droid` 109MB unreferenced; infinity/Infinity case
    inconsistency (masked by APFS, breaks on exact compare).
17. Unpushed: `feat/tower-write-gate` (agent-core) and the herdr-spine door
    commit; `models.json` default flips sitting unstaged (operator decision).
18. Two `mw` binaries resolve to different tiers (lab vs Arc vendored) —
    intentional? Document or collapse.

---

# Part V — What's left (the queue, in order)

1. Operator decision: P0-1 circadian fix (own unit, mind repo blast radius).
2. Mechanical P0s: super-search path fix + kotadb de-advertisement + handler
   17/50 dedupe + enforce-brief matcher + dead-letter implementation. Small,
   independent, all fully specified above.
3. The registry absorption (Part I codification path, step 1) — this is the
   unit that kills the frankenstein feeling, because it makes `agent-core
   status` tell the truth about the whole organism.
4. Cursor memory write-side (sleep/graze adapter) + pi integration refresh +
   assay `zig build` — parity debt paydown.
5. Doc-truth sweep (P2-15/16) — cheap, mostly deletions and one-line fixes.
6. Then the wrap: the singular entity, per the codification path.

SOURCES: five sweep reports (this session, 2026-08-14, read-only agents over
the live machine); live probes logged in ENFORCEMENT.md SOURCES; scoreboard/
status output from `bun ~/circadian/src/status.ts`; registry grep;
`herdr integration status`; cursor.com/docs/agent/hooks (fetched);
pi ExtensionAPI types (dist/core/extensions/types.d.ts).
