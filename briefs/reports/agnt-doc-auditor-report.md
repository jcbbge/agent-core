# AGNT doc-auditor — audit report

Registration: agnt-doc-auditor. Pane w1A:p11. cwd /Users/jrg/agent-core.
Date: 2026-08-10. Every row below reflects a command run or a file read
THIS session — no claim carried over from a prior doc's own "verified"
label without independent re-check.

Files edited (all within the five-file partition):
- `~/agent-core/primitives/rules/control-flow.md`
- `~/.tower/COMMS-ARCH.md`
- `~/herdr-spine/docs/spawn.md`
- `~/herdr-spine/docs/ctl-fleet.md` (read in full, no fix needed — see below)
- `~/agent-core/primitives/rules/tower-orchestration.md`

No file outside the five was modified. Nothing committed, nothing staged.

---

## Headline finding

**The verbatim-relay guarantee is currently broken for `deliverable`
messages, fleet-wide.** `~/.tower/server.mjs`'s `send_to_user` tool never
sets a `to` field on any ledger row it writes (checked its `inputSchema`
and the `callTool` literal — no `to` anywhere). `lib.mjs`'s `inboxState()` —
the single function backing `stop-guard.mjs`, `check_inbox`, and the
prompt-injector — only treats a `deliverable` as unrelayed when
`r.to === 'operator'` exactly. Undefined fails that check. Net effect: a
`deliverable` sent through the documented tool can never trigger the
Stop-hook guard. `alert` still works (its row qualifies when `to` is
undefined OR `"operator"`). This is precisely why COMMS-ARCH.md's migration
item 4 ("mint `to` on every new row") is correctly still unmarked — and
tower-orchestration.md's "verbatim guarantee" section was overstating
current behavior until this pass. Both docs are now fixed; the code gap is
queued below.

---

## Audit table

### control-flow.md

| doc:line | claim | evidence | verdict |
|---|---|---|---|
| 17-23 | Prefix table (CORD/ORCH/AGNT/SAGT) matches spawn.md:76-82 and ctl-fleet's RANK_LABEL | Read all three; identical role names/scopes | VERIFIED |
| 84-85 | 0.8.0 rejects spaces/uppercase agent names (`invalid_agent_name`) | Ran `herdr agent start "Bad Name" --kind claude --pane w1A:p999` live → `{"error":{"code":"invalid_agent_name",...}}` — fired before pane-existence check | VERIFIED |
| 85 | "Lowercase registration forms: orch- agnt- sagt-" (omits cord-) | Live snapshot showed panes named `orch-skill-audit`, `agnt-skill-writer`, `agnt-doc-auditor`, none `cord-*`; CORD panes are typically the operator's own already-open session (screen-detected, not `agent start`-registered) | UNVERIFIABLE as an error — plausible by design, no live counter-evidence either way |
| 58-63 | ctl-fleet `--spawn` produces a SPLIT of tab 1, never an isolated tab | Read `bin/ctl-fleet` `runSpawn()`: finds `${ws}:t1`, splits the CORD/CRD host pane (or tab's first pane) at ratio 0.62, `--no-focus` | VERIFIED |
| 54-57 | CTRL row: glyph · role prefix · human work name · activity, second line, no pane/tab ids, live sorts above done | Read `bin/ctl-fleet` `render()`: exact format, `STATUS_ORDER` puts working/blocked above done/idle/unknown, no `pane_id`/`tab_id` ever printed | VERIFIED |
| 54-58 | statem.ts renames tabs GLYPHS ONLY (no phase/agent/task text) via `herdr tab rename` | Read `statem/statem.ts` `renameTabs()`: `Bun.spawnSync(["herdr","tab","rename",...glyphs])`, no text tokens | VERIFIED |
| 118-120 | statem reads `.madewell/cycles/*.json`; twr.ts one pane per project, reads through `boardFor` | Read `statem.ts` (`readState()` loads `entry.cycle` under `.madewell/`), inspected real `~/future/.madewell/madewell.json`+`cycles/c004.json`; read `twr.ts` (`boardFor(root,...)`, one `root` argv per invocation) | VERIFIED |
| 107-120 | §Two-plane CTRL: WORK section is implemented in ctl-fleet, not aspirational | Read `bin/ctl-fleet` `renderWorkMachine`/`renderWorkProject`, called unconditionally from `render()` | VERIFIED (implemented, doc was already accurate) |
| 97-105 (pre-fix) | DURATION "derivable from the board CLAIM timestamp or pane birth" | Enumerated every key across all `session.snapshot` agent entries this session — no timestamp field exists anywhere; `ctl-fleet.md` itself documents board-CLAIM as "investigated, rejected" | **FIXED** — corrected to describe the actual mechanism (Claude-transcript first-timestamp proxy, claude-only) |
| 71-79 | Reaping policy (spawner reaps own agents, infra panes excepted) | Operator directive, not independently disk-checkable; consistent with ctl-fleet's "done=gone" framing and no code path that keeps closed panes alive | VERIFIED as policy (not a code-checkable claim) |

### COMMS-ARCH.md

| doc:line | claim | evidence | verdict |
|---|---|---|---|
| 72 | Migration 1 DONE: bridge-exempt | Read `40-tower-bridge` and `10-notify` `main()`: both read `~/.tower/bridge-exempt`, skip listed panes entirely | VERIFIED |
| 73 | Migration 2 DONE: fabrication off by default | Read `40-tower-bridge` `on_done()`: returns immediately unless `~/.tower/bridge-fabricate-done` exists | VERIFIED |
| 74-76 | Migration 3 DONE: `inboxState` admits only to:operator deliverables + alerts + open questions | Read `lib.mjs` `inboxState()`: `unrelayed` filter is exactly `(alert && (to undefined||operator)) || (deliverable && to===operator)`; `openQuestions` unfiltered by `to` | VERIFIED |
| 77-78 | Migration 4: ledger writers mint `to`; blocked questions get `to:"operator"` | Read `40-tower-bridge` `on_blocked()`: entry literal has `"to": "operator"`. Read `server.mjs` `send_to_user`/`ask_user`/`reply`: none ever set `to` | **FIXED** — marked PARTIAL with the specific gap (send_to_user) named; see headline finding |
| 79-80 | Migration 5: amend TOWER-AUTO-CONTRACT.md, delete §9 fabrication clause | Grepped the contract file for "§9\|COMMS-ARCH\|fabricat" → 0 matches; read its actual §9 ("WS-2 handler specifics"), step 5 still specifies unconditional deliverable-on-done+verdict | **FIXED** — confirmed still open, added the specific evidence |
| 81-83 | Migration 6: no surviving path stores a preview token as body | Read `40-tower-bridge` `on_done()`: when fabrication is re-enabled via the documented flag, `"message": verdict` is the RAW token, unsanitized — unlike `10-notify`'s board line for the same event (`distill_outcome()`) | **FIXED** — confirmed still open, named the surviving path and the fix shape |
| 85-102 | Notifications rubric (T1-T6): completion-only, AGNT/SAGT suppression, 60s pacing, no mid-word fragments | Read `10-notify` in full: `classify_pane()` suppresses AGNT/AGT/SAGT/SUB; `toast_allowed()` is a strict 60s/(pane,kind) window; `_sentence_or_word_cut()` never cuts mid-word; only blocked/done ever notify | VERIFIED (one deliberate divergence noted below, not an error) |
| 126-132 | `board_post` refuses scratch/temp cwds; documented pi-fallback raw-append is the one open hole | Read `server.mjs` `board_post`: regex refuses `/tmp/`, `/private/tmp/`, any path containing `/scratchpad/`. Grepped `~/.claude/skills/brief/SKILL.md:55` — the raw-append fallback line exists exactly as cited | VERIFIED |
| 119-124 | `boardFor`/`inboxState` are the only sanctioned scoped readers; `twr.ts` reads through `boardFor` | Read `lib.mjs` and `twr.ts` — confirmed, no second scoping implementation found | VERIFIED |

**Noted, not flagged as an error:** T1's "unclassifiable panes toast by
default" is a deliberate fail-open beyond COMMS-ARCH's literal "notify ONLY
for..." wording (an unlabeled pane that isn't actually ORCH-tier still
toasts). The code's own docstring justifies this explicitly and the
practical effect is small in a fleet where roles are labeled correctly — I
did not change either doc for this.

**Investigated and dropped as a non-issue:** `bin/handlers/_spine_common.py`'s
`board_append()` (used by `10-notify`) writes board rows tagged with
`HERDR_PLUGIN_ROOT` (the spine plugin's own root, e.g. `~/herdr-spine`), not
the triggering pane's project cwd — confirmed via
`~/source/herdr/src/app/api/plugins/env.rs:20`. This looked like a
project-isolation violation at first, but `10-notify`'s topic
(`"herdr-spine"`) is a bare/unnamespaced machine-plane topic by
spawn.md's own rule, and the human-facing channel for these events is the
toast, not a per-project board read — consistent by design, not a bug.

### spawn.md

| doc:line | claim | evidence | verdict |
|---|---|---|---|
| 10-27 | 4 modes (orch/worker/fanout/prompt), exact flags per mode | Read `bin/spine-spawn` `main()` argparse setup in full — matches exactly, including fanout having no `--prompt` | VERIFIED |
| 29 | `--session` prefixes every herdr call | Read `herdr_argv()`: `if SESSION: argv += ["--session", SESSION]` | VERIFIED |
| 32 | Fanout HARD-CAPPED at 4 briefs | `FANOUT_CAP = 4`, enforced with exit 2 | VERIFIED |
| 54-56 | Exact brief-delivery sentence | `resolve_prompt()`: byte-identical string, including punctuation | VERIFIED |
| 51-52 | Result JSON shape `{role, pane_id, tab_id, workspace_id, kind, agent_status, submitted, brief}` | `spawn_into_pane()` actually returns `{..., project, ...}` too; the code's own module docstring lists `project` | **FIXED** — added `project`, and added the missing "Identity" stamping step (§What each spawn actually does) that the doc omitted entirely |
| 85-100 (pre-fix) | "The spine-spawn gap": spine-spawn passes one role string to both `pane rename`/`agent start`; fanout derives roles as `<task>-wN`, no prefix, no display-agent | Read `cmd_fanout`: `role = f"{args.task}-w{i}"`, no prefix; `spawn_into_pane()` never calls `--display-agent`/any `--token` besides `project=` | VERIFIED (doc already accurate) |
| 95-110 | Four name carriers: `agent start` name (persists, rejects spaces/case), `report-metadata --display-agent`, `pane rename` (feeds `label`), `--token name=` (checked first) | Ran `herdr agent start --help` and `herdr pane report-metadata --help` live; cross-checked `~/source/herdr-RETROFIT-MAP.md` (persist/restore.rs, aggregate.rs); read `bin/ctl-fleet` `primaryCandidate()` — checks `tokens.name` before `display_agent` before `label` | VERIFIED |
| 112-119 | $task: 80-char cap, no `--ttl-ms` needed, dies on restart | RETROFIT-MAP `api_helpers.rs:205-211` (80-char), `restore.rs:421` (tokens don't persist) | VERIFIED |
| 121-127 (pre-fix) | "THE TRAP": nothing re-stamps tokens after restart | Searched `bin/handlers/` and `~/Library/LaunchAgents/` — found `15-restore-view` (re-stamps the agent *view*, a static per-server-instance filter/sort object) and `bin/spine-startup` (unwired: `herdr-plugin.toml` has no `[[startup]]` stanza, removed 2026-08-09 on a now-stale belief; confirmed live that `RawPluginManifest` at the installed v0.8.0 DOES have a `startup` field, `manifest.rs:25,163-166`) — neither re-stamps a live pane's `$task`/`role`/`name` | **FIXED** — added the specific evidence; confirmed as an open code gap (queued below) |
| 123-131 | `agent.view.set` method name, `{"token":"role"}` sort param shape | RETROFIT-MAP `schema/agents.rs:50-161`, `agent_view.rs:26-78` — exact method + param shape | VERIFIED |
| 154-155 (pre-fix) | `project_slug()` is defined "in this file, above" | Grepped `~/.tower/lib.mjs` (0 matches, has `normCwd` instead) and `bin/spine-spawn` (3 matches, `def project_slug` at line 188) | **FIXED** — pointer corrected to `bin/spine-spawn`; also added `herdr-spine` to the reserved-bare-topics example list (confirmed live in `10-notify`'s `TOWER_TOPIC`) |
| 152-153, 158-160 | `board_post` refuses scratch cwds outright, exact path list | Matches `server.mjs` regex exactly | VERIFIED |

### ctl-fleet.md

Read `bin/ctl-fleet` (464 lines) in full and checked every documented
section line-by-line: socket connection model (persistent `events.subscribe`
+ 5s snapshot poll, server closes after `session.snapshot`), `--spawn`
mechanics, hierarchy rank map (with legacy aliases), project-grouping key
order, sort order, WORK section (both machine- and project-plane render
functions, root resolution incl. the worktree fallback, byte-identical
glyph function to `statem.ts`), row format, human-work-name resolution
ladder (all 3 steps, including the exact raw-id regex), and the Telemetry
section (duration via Claude-transcript first-timestamp — confirmed against
a real transcript file's first two lines, which are exactly the claimed
headerless `{leafUuid,sessionId,type}` shape; tokens rejected/not
implemented; board-CLAIM rejected/not implemented).

**Verdict: VERIFIED, in full — no fix needed.** This is the most
implementation-accurate of the five docs; several passages (e.g. the
worktree-fallback note, the WORK-section raw-id exception) read as if
written directly against the code, and they check out exactly.

**One code-adjacent gap found and REPORTED, not fixed (outside my
partition):** `~/herdr-spine/herdr-plugin.toml`'s inline comment
("`[[startup]]` plugin hooks do NOT exist in the installed herdr 0.7.4
binary... NO `[[startup]]` STANZA — REMOVED 2026-08-09") is now stale.
`~/source/herdr-RETROFIT-MAP.md` already flags this exact staleness, and I
independently confirmed it by grepping the installed v0.8.0 source
(`manifest.rs:25` — `RawPluginManifest` has a `startup: Vec<...>` field).
`ctl-fleet.md`'s own "Upgrade path" section already cites the corrected
RETROFIT-MAP fact, so no fix was needed there — but the plugin manifest's
own comment (a code file, `bin/handlers` sibling) still asserts the old,
false belief.

### tower-orchestration.md

| doc:line | claim | evidence | verdict |
|---|---|---|---|
| 15-22 (pre-fix) | "Fleet messages of kind `deliverable` or `alert` BLOCK the orchestrator's turn-end... until relayed" | Read `stop-guard.mjs` (uses `inboxState()`) and `server.mjs`'s `send_to_user` (never sets `to`) — deliverable rows can never satisfy `inboxState`'s `to==='operator'` filter | **FIXED** — see headline finding; section now states the actual current behavior and points to COMMS-ARCH.md for the addressing rule it depends on |
| 21 (pre-fix) | Deliverables written to `~/.claude/tower/deliverables/` | `ls -la ~/.claude/tower` → symlink to `/Users/jrg/.tower`; both paths resolve identically, confirmed by matching file listings | Not an error — clarified as a symlink in the fix, no substantive change needed |
| 27-42 | Brief gate (`enforce-brief.mjs`, 4 required sections, exemptions) | This is the doc I am currently operating under: my own brief was checked against exactly these 4 sections before I was spawned, and it has all 4 | VERIFIED (lived experience this session) |
| 44-75 | "As orchestrator" operational bullets (doorbell-on-deliverable, brief gate use, liveness doctrine) | Operational/procedural claims about orchestrator behavior, not independently disk-checkable beyond the mechanisms already verified above (send_to_user, notification.show) | VERIFIED as consistent with verified mechanisms; kept as tower-specific operational content per the reconciliation instruction (not comms law COMMS-ARCH owns) |
| 93-106 | Tokenomics: odometer hook, `bun cli.mjs burn`, `/tower` daily total | `~/.claude/tower/odometer.jsonl` (=`~/.tower/odometer.jsonl`) exists and is 265.6K, consistent with an active PostToolUse-hook-fed ledger | VERIFIED (existence/size consistent; did not execute `burn` to avoid unrelated side effects) |
| 108-114 | Flight recorder: PreCompact/SessionEnd snapshot to `~/.claude/tower/flight/`, <24h pointer | `~/.tower/flight/` exists (symlinked); this session's own SessionStart hook injected exactly such a pointer (`2026-08-10-SessionEnd-03775b43.md`) | VERIFIED (lived evidence this session) |
| 124-129 | Ledger/board APPEND-ONLY, never hand-edited; prune only by archiving | Not independently re-verifiable without deliberately violating it; consistent with `append()`/`ledger_append()`/`board_append()` all using `O_APPEND`/`appendFileSync` exclusively, no rewrite path found anywhere I read | VERIFIED (no counter-evidence; all writers use append-only primitives) |
| 131-138 | "One truth plane": board content reaches humans via herdr, not raw file reads | Consistent with 10-notify's toast+board dual-write and the isolation model in COMMS-ARCH; left as-is (tower-specific framing, not literally duplicated comms law) | VERIFIED |

Fix applied: added a top-of-file pointer to COMMS-ARCH.md as the comms-law
authority, and rewrote "The verbatim guarantee" to state the current,
verified behavior (alert-only blocking) rather than the aspirational one,
without deleting any correct operational content.

---

## (a) Queued code gaps (REPORTED — not fixed; code is out of scope this session)

1. **HIGH — `send_to_user` never mints `to` on deliverable/alert rows.**
   File: `~/.tower/server.mjs`, `callTool('send_to_user', ...)`. The entry
   literal (`{id, ts, cwd, kind, title, from, message}`) and the tool's
   `inputSchema` both omit `to` entirely. Fix: add `to: args.to ??
   'operator'` (or hardcode `'operator'` for deliverable/alert kinds) so
   `inboxState()`'s existing filter — which already correctly requires
   `to==='operator'` for deliverables — actually admits the rows it was
   designed to admit. This is the single most load-bearing gap found: it
   silently defeats the Stop-hook verbatim-relay guarantee for every
   deliverable sent since the COMMS-ARCH migration (item 3) landed.

2. **MEDIUM — `40-tower-bridge`'s `on_done()` stores the raw `$verdict`
   token as a ledger message body when fabrication is re-enabled.** File:
   `~/herdr-spine/bin/handlers/40-tower-bridge`, function `on_done()`,
   `"message": verdict`. Violates COMMS-ARCH's "no truncation / never store
   preview tokens as bodies" invariant on the one path where fabrication is
   intentionally still supported (headless fleets, via
   `~/.tower/bridge-fabricate-done`). Fix: run `verdict` through the same
   sentence/word-boundary sanitizer `10-notify`'s `distill_outcome()` uses
   (or better, the pane's own screen tail, matching `10-notify`'s solution
   to the identical problem) before writing it as the deliverable body.

3. **MEDIUM — TOWER-AUTO-CONTRACT.md §9 not amended.** File:
   `~/herdr-spine/briefs/tower-ergo/TOWER-AUTO-CONTRACT.md`, §9 "WS-2
   handler specifics", step 5. Still specifies unconditional
   deliverable-on-done+verdict with no flag gate and no reference to
   COMMS-ARCH.md. This is a documentation-only fix but the file lives
   outside my five-file partition (it's under `briefs/tower-ergo/`, not one
   of the five). Fix: add a pointer to COMMS-ARCH.md at the top of §9 and
   amend step 5 to note the flag gate.

4. **LOW — No per-pane token re-stamper survives a herdr server restart.**
   `$task`/`role`/`name`/`project` tokens (the load-bearing carriers behind
   ctl-fleet's WORK/human-name resolution and spine-spawn's grouping) are
   confirmed to die on restart (RETROFIT-MAP `restore.rs:421`) and nothing
   on disk re-derives them — `15-restore-view` only restores the static
   agent-*view* config, not per-pane content tokens, and `bin/spine-startup`
   (the tool that would have done this via `[[startup]]`) is unwired
   because `herdr-plugin.toml` has no `[[startup]]` stanza. Fix shape: since
   `[[startup]]` is confirmed live at the installed v0.8.0
   (`manifest.rs:25`, contradicting the 2026-08-09 removal rationale), the
   simplest fix is re-adding a `[[startup]]` stanza that re-derives and
   re-stamps `project=` (cheap, from cwd) — `$task`/`role`/`name` cannot be
   recovered generically since they're per-agent working content with no
   other source of truth, so those would need each spawner to re-stamp on
   its own liveness check, not a generic restart hook.

5. **LOW — stale comment in `~/herdr-spine/herdr-plugin.toml`.** Asserts
   `[[startup]]` "does NOT exist in the installed herdr 0.7.4 binary" and
   was "REMOVED 2026-08-09" on that belief. Confirmed stale this session by
   reading `~/source/herdr/src/app/api/plugins/manifest.rs:25` at the
   installed v0.8.0 tag (`RawPluginManifest` has a `startup` field).
   `~/source/herdr-RETROFIT-MAP.md` already flags this same staleness.
   Outside my partition (it's a code file's comment, not a doc). Fix: strip
   or update the comment; re-evaluate whether `15-restore-view`'s
   per-event-reapply pattern is still needed once `[[startup]]` is
   confirmed usable, or whether it should stay as defense-in-depth.

---

## (b) Cross-reference map

```
control-flow.md  --"Governed by"-->  COMMS-ARCH.md
control-flow.md  <--"hierarchy law is"--  spawn.md
control-flow.md  <--"the control-flow.md §Two-plane/§Reaping/§Observability fractal"--  ctl-fleet.md
spawn.md         --"CTRL's fleet row (ctl-fleet.md §Row format)"-->  ctl-fleet.md
ctl-fleet.md     --"mirrored byte-identical to"-->  statem/statem.ts (tool, not one of the five)
ctl-fleet.md     --"see"-->  herdr-RETROFIT-MAP.md, briefs/agnt-ctl-work-planes.md (external)
COMMS-ARCH.md    --"supersedes / gets amended to match"-->  TOWER-AUTO-CONTRACT.md (external, briefs/tower-ergo/)
COMMS-ARCH.md    --(added this session)"Consumers who defer..."-->  control-flow.md, tower-orchestration.md; notes spawn.md's independent-but-consistent restatement
tower-orchestration.md  --(added this session)"Comms law... owned by"-->  COMMS-ARCH.md
```

No surviving contradiction between any pair after this pass. The one real
contradiction found (tower-orchestration.md's blanket "deliverable blocks"
claim vs. COMMS-ARCH's `to`-gated `inboxState`) is resolved by pointer +
correction, not deletion, per the reconciliation instruction.

---

## (c) Could not verify / would need more to settle

- **CORD lowercase registration form omission** (control-flow.md:85): I
  could not find a live `cord-*` registered pane to confirm whether the
  omission is deliberate (CORD panes are operator sessions, detected not
  registered) or simply an oversight. Would settle it: ask the operator
  directly, or wait for a CORD pane to actually go through `agent start`
  and see what name it gets given.
- **`herdr agent start` NAME validation for the empty-vs-1-char boundary and
  the exact 32-char cap**: I verified the error fires for spaces/uppercase
  live, but did not fuzz the boundary conditions (`agent name must... 1-32
  characters` is the stated message; I did not test a 33-char or 0-char
  name). Low-stakes, didn't seem worth spending a live pane-mutating call on
  it given the brief's caution about not mutating operator state.
- **Whether `/tower burn` and the odometer numbers are currently accurate**:
  I confirmed the file exists and is actively growing but did not run
  `bun ~/.claude/tower/cli.mjs burn` to avoid an unrelated side-effecting
  command during a docs-only audit. Would settle it: run that command.
- **`~/tower-share/` (a second, structurally different Tower implementation
  rooted at `~/.claude/tower` internally, NOT the symlink target — it
  defines its own `TOWER = ~/.claude/tower` constant independently of
  `~/.tower/lib.mjs`)**: found during this audit, not referenced by any of
  the five docs, and not investigated further since nothing in scope cites
  it. Worth a separate look if it's live/served anywhere — I don't know its
  purpose (packaging/export copy? a divergent fork?) and didn't chase it
  since no claim in my five files depends on it.

---

## Comms

CLAIM posted at session start (topic `herdr/skill-audit`, id
`t-msnuejug-hns4`). DONE finding and `.done-agnt-doc-auditor` marker follow
this report.
