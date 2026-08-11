# Brief: AGNT ctl-work-planes — the two WORK planes in CTRL
Date: 2026-08-10
Spawner: ORCH ctl-planes (pane w1A:pR). Do NOT use emojis anywhere.

You are implementing operator mandate (A) from
`~/agent-core/primitives/rules/control-flow.md` §Two-plane CTRL: the fractal
applied to WORK. One file of code, one doc. Repo `~/herdr-spine`.

Same grammar, two focal depths:
- **Machine plane** (CTRL fleet, default mode): per project — committed task
  items and WHICH ORCH owns each, plus the discovery count.
- **Project plane** (new `--project <root>` mode): that project's ORCHs and
  their delegated item breakdown with states, and ONLY that project's agents.

## Pre-Verified Facts (ORCH verified every one of these personally, 2026-08-10)

Code you are extending:
- `~/herdr-spine/bin/ctl-fleet` is 338 lines and runs clean headless:
  `cd ~/herdr-spine && timeout 4 bun bin/ctl-fleet | sed -E 's/\x1b\[[0-9;?]*[a-zA-Z]//g' | head -40`
  rendered the live fleet at 17:04 today (16 agents, projects `circadian` and
  `future`). Use exactly that command shape for every capture below.
- `~/herdr-spine/docs/ctl-fleet.md` is 156 lines; line 143 records "this
  file's 340-line cap". **The cap is RAISED to 470 for this work** (ORCH
  ruling, on the two-plane mandate). Record the raise and its reason in the
  doc. Do not exceed 470.
- REUSE these, do not reimplement:
  - `loadCycle(path)` :188 — mtime-cached read of a cycle file, returns
    `Map<item id, title>` from `imagine[]`, title already cut at the first
    `:` or ` (`.
  - `madewellNameOf(cwd, raw)` :202 — carries the worktree→main-repo fallback
    regex (`^(.+)/\.herdr/worktrees/([^/]+)/[^/]+$`) and the
    `existsSync(root + "/.madewell")` root test. Factor the ROOT RESOLUTION
    out of it if you need it standalone; do not copy the regex twice.
  - `projectOf(p)` :252 — the project grouping key. The WORK section MUST use
    this same key so the two sections of one render never disagree.
  - `rankOf(p)` :159 / `roleLabelOf(p)` :168 (rank 0=CORD 1=ORCH 2=AGNT
    3=SAGT), `humanNameOf(p)` :210, `primaryCandidate(p)` :175,
    `truncate()` :280, `GLYPH`/`COLOR`/`STATUS_ORDER`/`DIM`/`RESET` :285-289.
  - `refreshSlow()` :236 — **the only place disk I/O is allowed** (the 5s
    tick). `render()` must stay pure over cached state. Every `.madewell`
    read you add goes in refreshSlow with an mtime or once-only cache.
- statem's glyph vocabulary, keep byte-identical to
  `~/agent-core/primitives/tools/statem/statem.ts` :13-14 and :100:
  `OUTER = ["discovery","commit","build","land"]`,
  `INNER = ["imagine","plan","make","verify"]`,
  `glyphs = (v, en) => "▰".repeat(en.indexOf(v) + 1).padEnd(4, "▱")`
  (an unknown value gives `▱▱▱▱`). Copying these three lines is correct —
  statem is a separate repo and a separate process.
- The GLYPHS-ONLY rule (control-flow.md §Observability) is scoped to **tab
  titles** only. Words are allowed in CTRL rows.

Data shapes, verified by reading the live files:
- `/Users/jrg/future/.madewell/madewell.json`: `stage` = `"build"`;
  `discovery` = 12 entries (ids d002 d003 d004 d005 d006 d007 d009 d010 d012
  d013 d014 d015); `active` = `[{"id":"d017","cycle":".madewell/cycles/c004.json"},
  {"id":"d016","cycle":".madewell/cycles/c004.json"}]` (both point at ONE
  cycle file — dedupe by cycle when reading, mirror statem.ts :45-47);
  `blocked` = `[]`.
- `/Users/jrg/future/.madewell/cycles/c004.json`: `{id:"c004",
  parent:"d017", phase:"verify", imagine:[i001..i005]}`; every item carries
  its own `status`, all five are `"done"`; there are NO `done[]`/`active[]`
  arrays.
- `/Users/jrg/future/.madewell/cycles/c001.json`: `{id:"c001", phase:"imagine",
  imagine:[], active:[], done:[]}` — the OTHER shape (state from bare id
  arrays). Not in `active[]` so it will not render, but your item-state
  reader must tolerate both shapes. Mirror statem.ts :52-58 exactly:
  `it.status ?? (done.includes(it.id) ? "done" : act.includes(it.id) ? "active" : "absent")`.
- **d016 and d017 have NO title anywhere in the store** — promoting a
  discovery item into `active[]` removes it from `discovery[]`, and
  `active[]` entries carry only `{id, cycle}`. Verified. Do not go hunting in
  DECISIONS.md, do not synthesise a title. The committed item's id IS its
  identity on the machine plane (see the render spec).
- `/Users/jrg/circadian` has **no `.madewell` directory** (verified). It has a
  `WORK.md`; do NOT read it and do NOT invent items from it. A project with
  no Made Well store renders as `(no Made Well store)` and nothing else.
- Live herdr state (`herdr api snapshot`): workspaces `w1A` label "future"
  (worktree.repo_name "future"), `w1B` "c003-fractal-chrome" (repo future),
  `w1C` "c004-ux" (repo future), `w1E` "circadian" (repo_name **null**, label
  "circadian"). `workspaces[].worktree.path` is **null** on all of them —
  pane `cwd` is the only usable root source. ORCH-rank panes live: `w1A:pE`
  label `OCH c004-ux-2` (cwd /Users/jrg/future), `w1A:pR` label
  `ORCH ctl-planes` (that is your spawner; cwd /Users/jrg/future).
- `~/herdr-spine` git is dirty from other sessions: `bin/handlers/40-tower-bridge`
  is modified and there are many untracked `research/*` files. Ignore them —
  do not investigate, revert, or stage them.

## Render spec — machine plane (default mode)

A new WORK section, rendered ABOVE the per-project agent groups, after the
counts header:

```
WORK
  future                       build ▰▰▰▱ · 12 in discovery
    d017   c004 verify  ●5◐0   ORCH c004-ux-2
    d016   c004 verify  ●5◐0   ORCH c004-ux-2
  circadian                    (no Made Well store)
```

- Projects: every group key `projectOf()` produces for the panes CTRL already
  renders, sorted the same way (localeCompare), so the WORK list and the
  agent list name the same projects in the same order.
- Root resolution: the first pane cwd in that group whose worktree-collapsed
  root contains `.madewell`. None → `(no Made Well store)`, and skip the rest
  of that project's WORK rows. Never fabricate.
- Project header: `<stage word> <stage glyphs> · <N> in discovery`, plus
  ` · <N> blocked` ONLY when `blocked[]` is non-empty.
- One row per `active[]` entry, in file order: `<item id>`, then the cycle id
  (the cycle file's own `id`, falling back to its basename without `.json`),
  the cycle `phase` word, `●<done count>◐<not-done count>` over that cycle's
  items (omit the counts when the cycle has no items), then the owning ORCH.
- Owning ORCH: a rank-1 pane in the SAME project whose identity text contains
  the cycle id, case-insensitively. Identity text = `label`, `tokens.name`,
  `display_agent`, the agent registration name (`state.agentNames`), and its
  workspace `label` (w1C's label is `c004-ux` — that is a real carrier).
  Render `ORCH <humanNameOf(pane)>`. No match → `—`. More than one → the
  first by pane id plus `+N`.
- Item ids ARE printed here, deliberately: this is the one place the
  no-raw-ids rule does not apply, because a promoted Made Well item has no
  title in the store (verified above). Document that exception in
  docs/ctl-fleet.md §Row format so the next reader does not "fix" it.

## Render spec — project plane (`bun bin/ctl-fleet --project <root>`)

```
CTRL future · project plane      1● 0◐ 9✓  ·  12 agents  ·  updated 17:04:42
WORK  build ▰▰▰▱ · 12 in discovery
  ORCH c004-ux-2          c004 verify ▰▰▰▰   d016 d017
    ✓ i001  Focus model made explicit
    ✓ i002  The side panel must NEVER swallow a…    AGNT The side panel must…
```

- Header gains ` · project plane`; the counts/clock tail is unchanged.
- WORK covers ONLY the given root's project: its stage line, then one block
  per owning ORCH — the ORCH's human name, its cycle id, phase word, phase
  glyphs, and the committed item ids that cycle carries.
- Under each ORCH, one line per cycle item in file order: state glyph
  (`done`→`✓`, `active`→`●`, anything else→`○`), the item id, the item title
  from `loadCycle`, and the owning AGNT if one can be identified — a rank-2
  pane in this project whose identity text contains the item id, rendered
  `AGNT <humanNameOf>`; blank when there is none. Truncate to terminal width.
- An ORCH with no identifiable cycle: one line, `ORCH <name>   (no cycle)`.
- A cycle with no owning ORCH: emit the block anyway with `—` in the ORCH
  position, so no committed item is ever hidden.
- **Agent rows are filtered to this project only** — `projectOf(p)` must
  equal the project name resolved from `<root>`. This is the isolation
  requirement: a project-plane CTRL that shows another project's agents is a
  failed deliverable, not a cosmetic bug.
- Everything else — two-line rows, durations, status sorting, reconnect
  banner, the 250ms/5s tick structure — unchanged.
- A `<root>` with no `.madewell`: header and scoped agent rows still render,
  WORK shows `(no Made Well store)`, and the process must not crash.

## Spawn spec

`--spawn` keeps its current behavior and name (`CTRL fleet`, machine plane).
Add `--project <root>` as a passthrough:

    bun bin/ctl-fleet --spawn --project /Users/jrg/future w1C

splits tab 1 of the target workspace (positional workspace id, else the
focused pane's workspace) beside its CORD-or-first pane at ratio 0.62
`--no-focus`, renames the pane `CTRL <project basename>`, and runs
`bun <SELF> --project <root>`. Argument order must not matter for
`--spawn`/`--project`. Never create a tab.

## How We'll Know It's Done (paste the real output of each, not a summary)

- [ ] Machine plane: `cd ~/herdr-spine && timeout 4 bun bin/ctl-fleet | sed -E 's/\x1b\[[0-9;?]*[a-zA-Z]//g' | head -60`
      shows the WORK section with future's `build` + 12 in discovery, rows for
      d017 and d016 both reading `c004 verify ●5◐0`, an owning
      `ORCH c004-ux-2`, and circadian marked `(no Made Well store)`.
- [ ] Project plane, rich: same command with `--project /Users/jrg/future` —
      the per-ORCH block, all five i001..i005 titles with `✓`, and ZERO
      circadian rows anywhere in the output.
- [ ] Project plane, sparse: `--project /Users/jrg/circadian` — circadian's
      agents only, `(no Made Well store)`, exit clean under timeout.
- [ ] Live pane: `bun bin/ctl-fleet --spawn --project /Users/jrg/future w1C`
      prints a pane id; `herdr api snapshot` proves that pane is in `w1C:t1`,
      that no new tab was created, and that the focused pane is unchanged
      from before the spawn (capture `focused_pane_id` before and after).
      LEAVE IT RUNNING — CTRL panes are infrastructure, exempt from reaping.
- [ ] Second live pane, same command with `--project /Users/jrg/circadian w1E`.
      Same three proofs. Leave it running. If its WORK section shows any
      `future` item or any `future` agent row, stop and report — that is the
      cross-talk failure this whole mandate exists to prevent.
- [ ] `git -C ~/herdr-spine add bin/ctl-fleet docs/ctl-fleet.md` then commit
      (NEVER `git add -A`; if you hit `index.lock`, sleep 2s and retry — a
      sibling worker is committing docs/spawn.md in this same repo).
      Report the commit sha and the exact `wc -l` before/after for both files.

## Parallel Work Notice

`AGNT mail-isolation` is in flight right now, in `~/agent-core`. It owns
`~/herdr-spine/docs/spawn.md`, both copies of the brief skill, `~/.tower/COMMS-ARCH.md`,
`~/.tower/server.mjs`, and `~/agent-core/primitives/tools/statem/twr.ts`.
You own `~/herdr-spine/bin/ctl-fleet` and `~/herdr-spine/docs/ctl-fleet.md`
and nothing else. You share the herdr-spine git index with it: stage only
your two paths, by name, every time.

## Tower

Post CLAIM first and findings as you go: `mcp__tower__board_post`, topic
`herdr-spine/ctl-planes`, from `agnt-ctl-work-planes`. The namespaced topic
is deliberate — it is the new convention under
`~/.tower/COMMS-ARCH.md` §Project isolation, and your posts are its first
live use. Post from your real cwd (`~/herdr-spine`), never a scratch dir.
Self-report so the fleet sidebar reads true:
`/Users/jrg/herdr-spine/bin/spine-report task "<what I am doing>"` at each
unit of work, `spine-report verdict "<result>"` when done.

## Report back with (exact completion contract)

A final board post on topic `herdr-spine/ctl-planes` AND your final pane
message, both carrying: the commit sha; `wc -l` before/after for both files
(cap 470); the five captures above verbatim; the two live CTRL pane ids with
their tab ids and the before/after `focused_pane_id`; and deviations or
"none". If something in this brief turned out to be wrong, say so plainly —
that is a finding, not a failure.
