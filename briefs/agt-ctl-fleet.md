# Brief: AGT ctl-fleet — the control-plane execution pane renderer
Date: 2026-08-10
Parent: OCH herdr-qol (pane w1A:p6). Report to it, not to the operator.
Status: ready

## What This Is
Build ONE file: a bun script that renders the ENTIRE agent control plane —
every agent in flight machine-wide — grouped by the control-flow hierarchy,
for a single always-on herdr pane the operator glances at.

Operator mandate, verbatim: "simplest, easiest, minimal, barebones." Hard
ceiling ~250 lines, zero dependencies beyond the bun stdlib. No frameworks,
no TUI library, no config file, no service. If you are tempted to add a
feature, don't.

## Your file partition (you own these, nothing else)
- CREATE `/Users/jrg/herdr-spine/bin/ctl-fleet` (bun, `#!/usr/bin/env bun`,
  chmod +x; TypeScript is fine — bun runs .ts directly, but the file has no
  extension so add nothing that needs a tsconfig)
- CREATE `/Users/jrg/herdr-spine/docs/ctl-fleet.md` (short — what it is, how
  to run it, the hierarchy rules, the event/reconcile model, ~60 lines max)

Do NOT touch: `/Users/jrg/herdr-spine/docs/spawn.md` (AGT naming-lever owns
it, working in parallel right now), `/Users/jrg/source/herdr` (read-only
reference — never modify herdr itself), the `future` repo.

## Pre-Verified Facts (OCH herdr-qol, verified live this session, herdr 0.8.0)

### Socket
- Unix socket: `/Users/jrg/.config/herdr/herdr.sock` (confirmed via lsof on
  pid of `/Users/jrg/.local/bin/herdr server`).
- Framing: newline-delimited JSON, request and response both.
- Request envelope: `{"id":"<any string>","method":"<method>","params":{...}}`
- `bun` connects with `Bun.connect({unix: path, socket: {data(sock, buf){}}})`.

### Snapshot (verified round-trip)
`{"id":"x","method":"session.snapshot","params":{}}` →
`{"id":"x","result":{"type":..., "snapshot":{...}}}`

`snapshot` top-level keys: `agents`, `panes`, `tabs`, `workspaces`, `layouts`,
`focused_pane_id`, `focused_tab_id`, `focused_workspace_id`, `protocol`,
`version`.

- `snapshot.panes[]` — THE source of truth. Fields you need:
  `pane_id`, `label` (the human rename; ABSENT on never-renamed panes),
  `agent` (e.g. "claude", "pi"; ABSENT if no agent), `agent_status`
  (`"working" | "done" | "blocked" | "idle" | "unknown"` — treat any
  unexpected value as unknown), `cwd`, `tab_id`, `workspace_id`,
  `terminal_title_stripped`, optional `display_agent` and `title`
  (operator-set display overrides), and `tokens` — an object that may carry
  `task` (current activity preview, e.g. `"run herdr agent wait"`),
  `verdict` (last output preview), `q`, `project` (a slug stamped by
  spine-spawn via `herdr pane report-metadata --token project=<slug>`), and
  `role` (`1-CRD`/`2-OCH`/`3-AGT`/`4-SUB`). The last two are present only on
  recently stamped panes — you MUST fall back.
- **Tokens do NOT survive a herdr server restart** (verified,
  `persist/restore.rs:541,546-648`); pane `label` and agent registration name
  DO. This is why your classification below reads `label` first and treats
  `tokens.role` as an optional accelerant, never a dependency. Do not build
  anything that breaks when every token is empty.
- `snapshot.workspaces[]`: `workspace_id`, `label`, `number`, `agent_status`,
  and optional `worktree` = `{repo_name, repo_root, checkout_path,
  is_linked_worktree}`.
- `snapshot.tabs[]`: `tab_id`, `label`, `workspace_id`, `agent_status`,
  `pane_count`.

Real values observed live (use as your development fixture):
```
w1A:p1  label "CRD future"        claude working  tokens.task "run herdr agent wait"
w1A:p3  label "OCH c004-ux"       claude done     tokens.verdict "**All of wave 1 settled..."
w1A:p5  label "OCH statem-tower"  claude working
w1A:p6  label "OCH herdr-qol"     claude working
w1C:p2  label "impl-i001"         claude done     (unprefixed — legacy)
w1C:p3  label "impl-i004"         claude done
w1C:p4  label "td-i004"           claude done
w1D:p1  (no label)                pi     working  cwd /Users/jrg/madewell-meta
w1B:p1, w1C:p1  no agent, status unknown  (bare shells — must be filtered out)
workspaces: w1A "future" (worktree.repo_name "future"), w1B "c003-fractal-chrome"
  (linked worktree of future), w1C "c004-ux" (linked worktree), w1D "madewell-meta"
  (NO worktree field at all — fall back to label)
```

### Events (verified: 12s live capture, 128 frames)
`{"id":"s1","method":"events.subscribe","params":{"subscriptions":[{"type":"pane.updated"},{"type":"pane.created"},{"type":"pane.closed"}]}}`
→ acks `{"id":"s1","result":{"type":"subscription_started"}}`, then pushes
frames shaped `{"event":"pane_updated","data":{"pane":{...full pane object...}}}`.

CRITICAL details, all verified:
- The pushed `event` name is snake_case (`pane_updated`, `pane_created`,
  `pane_closed`) while the SUBSCRIPTION `type` is dotted (`pane.updated`).
  They do not match. Do not assume.
- These three subscriptions are GLOBAL — no `pane_id` needed.
- `pane.agent_status_changed` and `pane.scroll_changed` REQUIRE a `pane_id`
  and are therefore useless for a machine-wide view. Subscribing to them
  without one returns
  `{"error":{"code":"invalid_request","message":"invalid request: missing field \`pane_id\`..."}}`.
  Do not use them.
- Volume is high: 115 `pane_updated` frames in 12 seconds with 4 agents live.
  You MUST coalesce — mark dirty on event, redraw on a timer, never redraw
  per frame.
- Pane event payloads carry the pane only. They do NOT carry workspace or tab
  labels. That is why you also need periodic snapshot reconcile.

## The design (follow it; it is already minimal)
1. Connect to the socket. Send `session.snapshot`, build state
   (`panes` map by pane_id, plus `workspaces` and `tabs` maps for labels).
2. Send `events.subscribe` for `pane.updated`/`pane.created`/`pane.closed` on
   the SAME connection. On each push, upsert/delete the pane in state and set
   `dirty = true`.
3. Redraw loop: every 250ms, if `dirty`, render. Independently, re-issue
   `session.snapshot` every 5s to reconcile (picks up tab/workspace renames
   and anything the event stream missed) — this doubles as the poll fallback
   the brief requires (≤2s staleness is satisfied: events are sub-second,
   reconcile is the backstop).
4. On socket error/close: print a visible `-- reconnecting --` line, retry
   with a fixed 1s delay, forever. The pane must never die.

### Classification (the hierarchy)
Rank a pane from its `label` prefix, case-insensitive, first token:
`CRD` → 0, `OCH` → 1, `AGT` → 2, `SUB` → 3, anything else → 4 (unclassified).
If `label` has no recognized prefix, fall back to `tokens.role` (values look
like `2-OCH`), then to the agent registration name's prefix
(`crd-`/`och-`/`agt-`/`sub-`). An absent `label` is rank 4; show
`display_agent` ?? `terminal_title_stripped` ?? pane_id as its name so
nothing is invisible.

A parallel worker (AGT naming-lever) is stamping `label`, `display_agent`,
`tokens.role` and `tokens.task` onto four live panes RIGHT NOW. The fixture
above is the pre-stamp state; if a row's name or rank changes under you
mid-run, that is the other worker landing, not a bug in your code.

### Grouping and sort
- Project = `pane.tokens.project` ?? `workspace.worktree.repo_name` ??
  `workspace.label` ?? last path segment of `pane.cwd` ?? `workspace_id`.
- Group by project. Within a project, sort by (rank, then label).
- Indent by rank so CRD > OCH > AGT/SUB reads as a tree. Do NOT try to infer
  true parentage (which OCH owns which AGT) — herdr does not expose it and
  guessing would lie. Rank-indent only.

### Filtering
Show only panes with an `agent` field. Bare shells (w1B:p1, w1C:p1) are
noise — omit them.

### The row
`<glyph> <name>  <what it is doing>  <pane_id>`
- glyph: `●` working, `◐` blocked, `○` idle/unknown, `✓` done.
- name: the `label`, prefix included (the prefix IS the legibility).
- what it is doing: `tokens.task` when status is working, else
  `tokens.verdict`, else `terminal_title_stripped`, else `—`. Collapse
  whitespace/newlines to single spaces, strip ANSI, and truncate to fit the
  terminal width (`process.stdout.columns ?? 100`) — the row must never wrap.
- Header line: a count summary (e.g. `4● 0◐ 3✓  ·  8 agents  ·  updated
  HH:MM:SS`). Timestamps come from the render clock, not from herdr.

### Rendering mechanics
Full-screen redraw with plain ANSI: `\x1b[2J\x1b[H` then the lines, and hide
the cursor (`\x1b[?25l`) on start, restore (`\x1b[?25h`) on SIGINT/SIGTERM.
Colors: use them sparingly (status glyph + a dim project header) or not at
all. No alternate screen buffer — the pane is the screen.

## How We'll Know It's Done
- [ ] `bun /Users/jrg/herdr-spine/bin/ctl-fleet` runs in YOUR pane's shell and
      renders every live agent, correctly grouped and indented, within 1s
- [ ] It reflects a real status change within ~1s (verify: your own pane
      flips working↔done as you work; watch your own row change)
- [ ] It survives `herdr server` traffic bursts without flicker or lag
- [ ] Killing the socket connection is not fatal (test: you cannot stop the
      server — instead verify the reconnect path by code inspection and note
      it as inspected-not-executed in your report; do NOT stop herdr)
- [ ] Line count ≤ 250 for `bin/ctl-fleet` (`wc -l`)
- [ ] Zero imports outside `bun:*`/node builtins

## Verification you must actually run (no mocks, no claims without output)
1. `wc -l /Users/jrg/herdr-spine/bin/ctl-fleet`
2. Run it foreground for ~10s in your own pane, then Ctrl-C. Paste the real
   rendered output into your report.
3. Confirm every one of the 8 live agent panes listed in the fixture above
   appears, and that the two bare shells do not.

## Note the upgrade path — record it, do not build it
The codebase research report (`/Users/jrg/source/herdr-RETROFIT-MAP.md`,
§(b)1, ~lines 253-258) identifies `plugin.pane.open` — which runs an arbitrary
TUI as an overlay/split/tab pane with full socket env — as the *sanctioned*
long-term home for this renderer, and `[[startup]]` plugin daemons (live at
0.8.0) as the sanctioned way to keep it always-on. That is a herdr-spine
plugin-manifest change and it is NOT your job. Record it as the upgrade path
in two lines of `docs/ctl-fleet.md`. For now: a plain process in a plain pane.

## Out of Scope
Installing it into a herdr pane (OCH herdr-qol does that), any plugin manifest
or `plugin.pane.open` work, renaming or stamping any pane,
touching spawn.md, any herdr source change, Tower/statem integration,
interactivity (no keys, no scrolling, no input handling — it is a display).

## Report back with (exact completion contract)
Reply in your pane with: absolute file paths + `wc -l` for each, the real
pasted render output, which checkboxes passed and which did not (with the
reason), and deviations from this brief or the word "none". Do not post to
the Tower board — your parent OCH aggregates.
