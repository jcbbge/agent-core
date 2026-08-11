# Brief: AGT statem-core — the gen_statem tracker for Made Well state
Date: 2026-08-10
Orchestrator: OCH statem-tower (pane w1A:p5, board topic "statem")
Status: ready

## What This Is
ONE small bun script that watches a project's `.madewell/` state, derives the
Made Well outer stage and inner phase(s) as EXPLICIT states, and on EVERY
transition appends ONE row to the Tower board and updates the orchestrator tab
title with progress glyphs. Modelled on Erlang gen_statem
(https://www.erlang.org/doc/system/statem.html): explicit state enums, explicit
logged transitions, nothing implicit.

The operator's sizing words are BINDING: "the simplest, easiest, minimal,
barebones answer." A clever version of this is a failed version.

## PARALLEL WORK NOTICE
AGT twr-view is live at the same time, building the read-side viewer
(`twr.ts`) in the SAME directory. Your partition is `statem.ts`, its README
section, and the tabs config. DO NOT create, edit, or delete `twr.ts`. If you
think twr.ts needs to change, board-post it on topic "statem" and let the
orchestrator route it.

## Your file partition (exclusive; touch nothing else)
- `~/agent-core/primitives/tools/statem/statem.ts`   (NEW — the whole deliverable)
- `~/agent-core/primitives/tools/statem/README.md`   (NEW — short; twr-view will
  append its own section later, so keep yours under a `## statem` heading and do
  not restructure the file)
- `~/.tower/statem-tabs.json`                        (NEW — seed config, see §Tab config)

## Pre-Verified Facts (orchestrator, verified this session — do not re-derive)
- `~/.bun/bin/bun` is 1.3.14. `~/agent-core` IS a git repo; `primitives/tools/`
  exists (contains `bigfile/`, `_deprecated/`, `README.md`). Create
  `primitives/tools/statem/` yourself.
- **Canonical state enums**, from the project's own law
  `/Users/jrg/future/.madewell/guides/STATE-SHAPE.md:13` and `:41`:
  - outer `stage`: `discovery | commit | build | land`
  - inner `phase`: `imagine | plan | make | verify`
  Use these verbatim. Do not invent states.
- `/Users/jrg/future/.madewell/madewell.json` top-level keys:
  `project, profile, stage, updated, context, discovery, active, blocked`.
  - `stage` is currently `"build"`.
  - `active` is `[{"id":"d017","cycle":".madewell/cycles/c004.json"},
    {"id":"d016","cycle":".madewell/cycles/c004.json"}]` — note the SAME cycle
    path appears twice (two parent d-items, one cycle). You MUST dedupe by
    cycle path or you will emit duplicate rows for every c004 transition.
  - `discovery` items carry only `id, item, scope, striation` — NO status field.
    Do not try to derive item states from the discovery queue.
- Cycle files have **TWO shapes in the wild**. Tolerate both:
  - `/Users/jrg/future/.madewell/cycles/c004.json`: `{id, parent, created, phase,
    brief, imagine:[{id, item, status, dependsOn, files, done}]}` — per-item
    `status` values observed: `"done"`, `"pending"`.
  - `/Users/jrg/future/.madewell/cycles/c001.json`: `{id, parent, phase, active:[],
    done:[], created}` — NO `imagine` array; item ids live in bare `active`/`done`
    string arrays.
  Rule: if `imagine[]` exists, item state = each item's `status`. Else, ids in
  `done[]` are state `done`, ids in `active[]` are state `active`. Missing/absent
  item = state `absent`.
- **Tower board** is append-only JSONL at `~/.tower/board.jsonl`. Row shape
  (verified against live rows): `{"id","ts","cwd","type","from","topic","body"}`.
- **`~/.tower/ledger.jsonl` IS OPERATOR MAIL. NEVER WRITE TO IT.** Verified:
  `inboxState()` at `~/.tower/lib.mjs:95-110` reads LEDGER only, so board rows
  can never become operator mail — that is exactly why we use the board.
  `~/.tower/COMMS-ARCH.md` §"Four planes" item 1 names board `finding` lines as
  the STATUS plane. So: `type: "finding"`, topic `"statem"`.
- `herdr tab rename <TAB_ID> <LABEL>...` exists and works from any shell
  (verified). `herdr tab list` returns JSON `{result:{tabs:[{tab_id, label,
  workspace_id, agent_status, ...}]}}` — that is how you verify a rename landed.
- Board `cwd` scoping is normalized by `normCwd()` in `~/.tower/lib.mjs` (realpath
  + git-common-dir collapse, so worktrees share the main repo's scope). Set your
  row's `cwd` to the project root you were given, realpath'd. Do not reimplement
  normCwd — just write the realpath'd project root.

## Tasks

### 1. `statem.ts` — the tracker
CLI: `bun statem.ts <project-root> [options]`
```
--interval <ms>   poll interval, default 2000 (a 2s poll is explicitly fine)
--once            derive state, print it, log any transitions, exit
--board <path>    board file to append to, default ~/.tower/board.jsonl
--tabs <path>     tabs config, default ~/.tower/statem-tabs.json
--no-tabs         skip all herdr tab rename calls
--baseline <path> snapshot cache, default ~/.tower/statem-<slug>.json
```

**Structure it as a gen_statem, visibly:**
- Two `const` state enums (`OUTER`, `INNER`) exactly as listed above.
- `readState(root) -> {outer, cycles: {c004: {phase, items: {i001: "done", ...}}}}`
  — pure read, no side effects.
- `transitions(prev, next) -> TransitionRecord[]` — a PURE function. This is the
  heart of the thing; it must be readable as "the transition table."
- Everything else (poll loop, board append, tab rename) is plumbing around those.

**Transitions to emit** (one board row EACH, body format exact):
| Change | body |
|---|---|
| outer stage changed | `<project> OUTER build→land` |
| a cycle's phase changed | `<project> INNER c004 plan→make` |
| an item's status changed | `<project> INNER c004 pending→done (i002)` |
| a cycle appeared in `active[]` | `<project> INNER c004 absent→plan (opened)` |
| a cycle left `active[]` | `<project> INNER c004 make→absent (closed)` |

`<project>` is the basename of the project root (e.g. `future`).
`from` is `statem@<project>`. `topic` is `statem`. `type` is `finding`.
`id`: `statem-` + a short unique suffix (e.g. `Date.now().toString(36)` plus 4
random base36 chars) — must not collide across rapid appends.
`ts`: ISO 8601 UTC. `cwd`: realpath'd project root.

**No boot spam.** The first observation after a cold start is NOT a transition:
seed the baseline and print the derived state to stdout only. Persist the
snapshot to `--baseline` after every poll so a restart resumes from the last
known state instead of silently swallowing a transition that happened while
statem was down.

**Robustness, minimal:** a missing/malformed `madewell.json` or cycle file is a
skipped poll with a one-line stderr note, not a crash. A state value outside the
enum is logged as-is (do not silently normalize) and flagged with a `?` prefix in
the stdout line. A failing `herdr tab rename` prints one stderr line and the loop
continues.

**stdout is the trace.** Every poll that produces transitions prints them, one
per line, timestamped and readable — this pane's scrollback IS the local record.
Quiet polls print nothing.

### 2. Tab glyphs
On any transition, for each config entry matching the project (see §Tab config),
run:
```
herdr tab rename <tab_id> <label> <glyphs> <Phase> <items>
```
- Glyphs are a 4-wide filled/empty progression by phase:
  `imagine ▰▱▱▱` · `plan ▰▰▱▱` · `make ▰▰▰▱` · `verify ▰▰▰▰`
- `<Phase>` is the phase capitalized (`Make`).
- `<items>` is `●<done count>◐<not-done count>`, omitted entirely when the cycle
  has no items.
- Example result: `OCH c004-ux ▰▰▱▱ Plan ●2◐3`
- If a config entry's `cycle` is `"*"` or absent, use the OUTER stage instead,
  with the same 4-wide progression over `discovery|commit|build|land` and the
  stage capitalized, no item counts.

### 2b. Pane tokens — CONSIDERED AND REJECTED, do not build
The herdr retrofit research offered `herdr pane report-metadata <pane_id>
--source ID --token task=...` as a way to put glyphs in the sidebar row too
(`~/source/herdr-RETROFIT-MAP.md:118-123`). The orchestrator checked and ruled
NO. Recorded here so you do not "helpfully" add it:
- `$task` is an operator convention already wired into every agent sidebar row
  (`~/.config/herdr/config.toml:93-99`) — and it is ALREADY BEING WRITTEN by the
  agent hooks. A live `herdr api snapshot` this session shows
  `tokens.task = "run herdr pane rename"` on an OCH pane. The token store is
  last-write-wins per key, so stamping `task` would clobber the harness's own
  task line and the two writers would fight forever.
- A custom key (`--token mw=...`) would not render at all without editing the
  operator's sidebar `rows` — a config change outside this work's scope.
- Tokens also die on herdr server restart (`restore.rs:421`, RETROFIT-MAP.md
  :55-57), which invites a re-stamper we are not building.
Tab rename is verified sufficient for the glyph requirement. That is the whole
surface. No `pane_id` field in the config, no `report-metadata` call in
`statem.ts`.

### 3. Tab config — `~/.tower/statem-tabs.json`
Shape (keep it this dumb; do not add a schema, loader library, or validation
layer):
```json
{
  "/Users/jrg/future": [
    { "tab_id": "w1A:tSELFTEST", "label": "OCH c004-ux", "cycle": "c004" }
  ]
}
```
Three keys per entry. No `pane_id` (see §2b), no fourth key.
Seed the file with the `/Users/jrg/future` key and an **empty array** `[]`, plus
a `"_comment"` sibling key explaining the entry shape. The orchestrator is
waiting on a coordinator ruling for which real tab carries c004's glyphs and
will fill the entry in. **DO NOT put a real live tab id in the committed config
and DO NOT rename any pre-existing tab.** Renaming another agent's chrome
without the ruling is out of bounds — the live tabs w1A:t3 (`c003-chrome`),
w1A:t5 (me, your orchestrator), w1A:t6 (`herdr-qol`) and w1C:t2
(`c004-workers`) are all off limits.

### 4. Self-test (real files, real herdr, no mocks)
Do this yourself and paste the evidence in your report.
1. `mkdir -p /tmp/statem-selftest/.madewell/cycles`, then COPY
   `/Users/jrg/future/.madewell/madewell.json` and `cycles/c004.json` into it.
   **Never edit the real `/Users/jrg/future/.madewell/` files.** `git init` the
   temp project so the cwd-scoping path is exercised like a real one.
2. Create a THROWAWAY tab for the rename test:
   `herdr tab create --workspace w1A --label statem-selftest --no-focus`
   Read the returned `tab_id` from the JSON. Point a temp tabs config at it.
   **Close it when you are done** (`herdr tab close <tab_id>`) and confirm it is
   gone from `herdr tab list`.
3. Run `bun statem.ts /tmp/statem-selftest --board /tmp/statem-selftest/board.jsonl
   --tabs <temp tabs config> --baseline /tmp/statem-selftest/baseline.json` in the
   background.
4. Edit the temp `madewell.json` `stage` from `build` to `land`. Within 2s: exactly
   ONE new row in the temp board file with body `statem-selftest OUTER build→land`,
   and the throwaway tab's label in `herdr tab list` now carries glyphs.
5. Edit the temp `cycles/c004.json`: `phase` `plan`→`make` AND one item's `status`
   `pending`→`done` in the same write. Expect TWO rows, not one, not three.
6. Restart-safety check: kill statem, change `stage` while it is down, restart it,
   confirm the transition is emitted on the first poll (the baseline earned its
   keep) and that restarting with NO change emits nothing.
7. Confirm `~/.tower/ledger.jsonl` mtime and line count are UNCHANGED across the
   whole self-test. Report both numbers.
8. Clean up `/tmp/statem-selftest`.

## Hard budget
`statem.ts` ≤ 190 lines. Zero new dependencies (bun stdlib + `herdr` CLI only).
No server, no port, no launchagent, no daemon. If you find yourself adding a
dependency or a server, stop and board-post instead.

**Explicitly rejected, do not build** (from `~/source/herdr-RETROFIT-MAP.md`,
landed 2026-08-10; the orchestrator has already ruled): registering statem as a
herdr plugin `[[startup]]` daemon (it IS live at 0.8.0 —
`RETROFIT-MAP.md:140-144` — but a pane process is fewer moving parts AND its
stdout is a visible trace, which is the whole point; a hidden daemon is
anti-stigmergic); a token re-stamper for server restarts; anything using
`workspace.report_metadata`. If you believe one of these is genuinely simpler
than what this brief specifies, board-post the argument — do not just build it.

## Out of scope
The viewer (`twr.ts`, AGT twr-view owns it). Anything in `/Users/jrg/future`
(read-only reference; the ONE exception is nothing — you copy, you never edit).
herdr source. Dashboards. HTTP/websocket. Committing to git — leave your changes
uncommitted in `~/agent-core`; the coordinator decides when that lands.

## How We'll Know It's Done
- [ ] `statem.ts` exists, ≤180 lines, explicit `OUTER`/`INNER` enums and a pure
      `transitions()` function a reader can check by eye
- [ ] Self-test steps 4, 5, 6 pass with pasted evidence (the actual board rows and
      the actual `herdr tab list` label, before and after)
- [ ] Throwaway tab created AND closed; no pre-existing tab renamed
- [ ] `~/.tower/ledger.jsonl` untouched (mtime + line count reported)
- [ ] `~/.tower/statem-tabs.json` seeded with an EMPTY array for `/Users/jrg/future`
- [ ] Both shapes of cycle file parse (c004-style `imagine[]` and c001-style
      `active[]`/`done[]`) — show the derived state for the real
      `/Users/jrg/future` via `--once --no-tabs --board /dev/null`

## Report back
Board post, topic `statem`, from `AGT statem-core`: file paths + line counts, the
self-test evidence verbatim (board rows, tab label before/after, ledger
mtime/count), the `--once` derived state for the real future project, and
deviations or "none". Then say DONE in your pane so your orchestrator's wake
signal fires.
