# Brief: AGNT ctrl-pane — CTRL spawns into tab 1, new prefixes, 10X row UX
Date: 2026-08-10
Status: ready
Parent: ORCH ctl-tweaks (pane w1A:pF) · brief ~/agent-core/briefs/och-ctl-tweaks.md
Authority: ~/agent-core/primitives/rules/control-flow.md §Observability,
§Reaping, §"Prefix renames + CTRL-pane UX" — READ IT FIRST (95 lines). The
rule is the law; this brief is only the execution plan.

## What This Is

The machine-wide control-plane pane (`bin/ctl-fleet`) gets three
operator-mandated changes at once, plus the docs that make them stick.

## Your partition — the ONLY files you may write

- `/Users/jrg/herdr-spine/bin/ctl-fleet` (250 lines today)
- `/Users/jrg/herdr-spine/docs/ctl-fleet.md` (64 lines)
- `/Users/jrg/herdr-spine/docs/spawn.md` (127 lines)

A sibling worker, **AGNT statem-names**, is editing
`~/agent-core/primitives/tools/statem/{statem.ts,twr.ts,README.md}` in
PARALLEL right now. Do not touch `~/agent-core` — not even to read-and-fix.
Do not touch `/Users/jrg/future` or `/Users/jrg/.herdr/worktrees/` (a whole
other orchestrator's fleet is live in there).

## Pre-Verified Facts (verified live by your parent, 2026-08-10)

### Live topology
- `w1A:p1` — `CORD future`, the coordinator, tab `w1A:t1`, currently the
  FOCUSED pane (label verified live 2026-08-10: the coordinator has already
  restamped itself from `CRD` to the new `CORD` prefix). Untouchable; focus
  must survive your work.
- `w1A:pD` — the current CTRL pane (`label: "CTL fleet"`, cwd
  `/Users/jrg/herdr-spine`, tokens `role=0-CTL`,
  `task=machine-wide control plane — live`). It already sits in `w1A:t1`
  beside `w1A:p1` — placed BY HAND. The code has no spawn path at all; that
  is the gap you close. This is the pane you kill and respawn.
- Other live panes belong to other agents: `w1A:pE` (`OCH c004-ux-2`),
  `w1A:pF` (your parent), and `w1C:p5..p9` (`AGT c004-*` workers). Never
  close, focus, rename or send keys to any of them.
- Live labels still use the OLD prefixes (`OCH`, `AGT`). They are not being
  renamed under you — so your rank map must keep understanding them.

### herdr CLI (verified this session)
- `herdr pane split [PANE_ID] --direction right|down --ratio <f> --cwd <p> --no-focus`
- `herdr pane run <PANE_ID> <COMMAND>...` · `herdr pane rename <PANE_ID> [LABEL]...`
- `herdr pane close <PANE_ID>` · `herdr pane read <PANE_ID>`
- `herdr pane list` / `herdr tab list` — each emits ONE JSON line;
  `.result.panes` / `.result.tabs`.
- `herdr pane report-metadata <PANE_ID> --source <ID> [--display-agent TEXT]
  [--title TEXT] [--token K=V]` — how identity/tokens get stamped.
- The field name `pane split` returns for the new pane is NOT pre-verified.
  Run it once and READ the output before depending on it.

### Live pane fields ctl-fleet can actually see (from `herdr pane list`)
`label`, `display_agent`, `terminal_title`, `terminal_title_stripped`,
`agent_status` (`working`/`idle`/`done`/`unknown`), `tokens` (observed keys in
the wild: `role` e.g. `2-OCH`, `task` e.g. `edit mod.rs`, `verdict`, `q`,
`project`), `cwd`, `tab_id`, `pane_id`, `workspace_id`. Observed terminal
titles carry spinner/notification junk: `"⠂ Execute agent brief c004-i005"`,
`"✳ Debug unexpected future terminal output"`.

## Tasks

### Task 1 — spawn path: CTRL is a SPLIT of tab 1, never its own tab

Operator rule (§Observability): *"a SPLIT of tab 1 beside the concierge/
coordinator pane — never an isolated tab; any CTRL an orchestrator creates
splits into tab 1."*

Put the placement in CODE so no future spawner can get it wrong. Suggested
shape — verify every call live before trusting it:

```
bun bin/ctl-fleet --spawn [workspace_id]
```
When `--spawn` is in argv: read `herdr pane list`; pick the workspace (the
arg, else the focused pane's workspace); find tab `<ws>:t1`; pick the host
pane in it — label starting `CORD` (case-insensitive; accept legacy `CRD`
too), else the first pane in that tab — and exit non-zero with a clear
message if that tab has no pane;
`herdr pane split <host> --direction right --ratio 0.62 --no-focus --cwd <spine dir>`;
rename the new pane `CTRL fleet`; `herdr pane run <new> bun <this file>`;
print the new pane id; exit 0 WITHOUT falling through into the renderer.

Deviate if live behavior demands it — the binding part is the END STATE: one
command places CTRL as a split of tab 1 beside the coordinator, ~0.62 ratio,
no focus theft, no new tab.

**Done when** (verified by doing it live, once):
- `herdr pane close w1A:pD`, then your spawn command brings CTRL back.
- `herdr pane list` shows the new CTRL pane with `tab_id: w1A:t1` and
  `label: "CTRL fleet"`.
- `CORD future` (`w1A:p1`) is still in `w1A:t1` and still `"focused":true`
  (capture that line before AND after).
- No tab was created: `herdr tab list` shows the same w1A tab set as before,
  and `w1A:t1` still has `pane_count: 2`.
- `herdr pane read <new id>` shows the fleet rendering — not a shell prompt,
  not a stack trace.

### Task 2 — prefix renames

New prefixes (§"Prefix renames", plus the operator's 2026-08-10 correction
`CRD→CORD` — the full set is `CORD · ORCH · AGNT · SAGT · CTRL · TOWR`):
`CRD→CORD`, `CTL→CTRL`, `TWR→TOWR`, `OCH→ORCH`, `AGT→AGNT`, `SUB→SAGT`;
lowercase registration forms `orch-`, `agnt-`, `sagt-`. In your partition
that means:
- `ctl-fleet`'s `RANK` map and its `tokens.role` / registration-name
  fallbacks speak the NEW prefixes canonically, and STILL rank the legacy
  ones (`crd`/`och`/`agt`/`sub`, `2-OCH` etc.) — live panes are labeled with
  the old prefixes right now and must not go blind mid-flight. One alias
  line, not a second code path.
- `docs/ctl-fleet.md` §"Hierarchy rules" and `docs/spawn.md` lines ~79-81,
  ~90-94, ~109, ~123-124 carry the old prefixes. Update them all, including
  the `role=1-CRD|2-OCH|3-AGT|4-SUB` token example → the new forms.
- Verify with `grep -nE '\b(CRD|CTL|TWR|OCH|AGT|SUB)\b|och-|agt-|sub-'` over
  your three files: zero hits except where a line is explicitly documenting
  the legacy-alias compatibility.

### Task 3 — the 10X CTRL row

Operator (§"Prefix renames + CTRL-pane UX"): *"memorable and lovable"*;
opaque ids like `c004-i005` and pane/tab ids are NOISE.

- Row shape: `status glyph · role prefix · HUMAN WORK NAME · plain-language
  activity`. Target: `● AGNT scroll-ui   reading mod.rs`.
- **NO pane ids, NO tab ids** in the default view. Drop the trailing id
  column entirely. (Ops read ids from the snapshot; if you want an escape
  hatch, `--ids` may re-enable them — optional, only if it costs ~2 lines.)
- **Human work name**: the title the spawner stamped at birth. Resolution
  order — verify which of these actually exist live before coding them:
  a stamped title/name token → `display_agent` → `label`, each with the role
  prefix stripped off. If what remains still looks like a raw item id
  (e.g. `c004-i005`, `c004-td-i005`), that pane was spawned wrong: fall back
  to a humanized short headline from its activity text rather than printing
  the id. Never print a bare item id as the name.
- **Activity text, humanized**: strip ANSI (already done), strip spinner and
  notification fragments (`⠂ ⠐ ✳ ⣾`-class glyphs, `[Pasted text`, `**`,
  backticks, `Execute agent brief …`-style harness boilerplate), prefer verb
  phrasing (`edit mod.rs` → `editing mod.rs`; a small verb→verb-ing map of
  the handful you actually observe is enough — do not build a conjugator),
  collapse whitespace, hard-cap to the room available with a clean `…`.
- **Sort**: live (`working`, then `blocked`) above finished/idle (`done`,
  `idle`, `unknown`); within a status band keep rank order, then name.
  Project grouping stays (a project name is a human name, not an opaque id).
- Keep the header summary line and the `-- reconnecting --` behavior.
- Keep the event/snapshot architecture EXACTLY as is. This is a
  presentation-layer change; do not touch the socket logic.

### Task 4 — docs: spawners must stamp a human work name

The 10X row only works if the name exists at birth. In `docs/spawn.md`
(the naming/stamping section, ~lines 79-124) make it a MANDATE, not a
suggestion: every spawn stamps a human, readable work name — the item's
TITLE, not its id — into the agent's identity when the pane is created,
alongside the prefixed role label. Show the exact commands in the existing
style. Mirror one sentence into `docs/ctl-fleet.md` §Row format explaining
that CTRL renders that stamped name and that unstamped agents degrade to a
headline.

### Task 5 — budget, commit

- `bin/ctl-fleet` may grow to **300 lines maximum** (operator raised it for
  this work). Report `wc -l` before → after.
- Commit in `~/herdr-spine` ONLY, staging ONLY your three files
  (`git add -A` is banned; the repo has unrelated dirty files from other
  agents). Format from `~/.claude/CLAUDE.md`:
  ```
  fix(spine): <summary>

  PHASE: Implement
  DONE: <what landed>
  TODO: <handoff, or —>
  ```

## Epistemics

Every fact you state comes from a file you read, a command you ran, or this
brief. If `pane split`'s JSON lacks the field you expected — look at the real
output; do not guess a field name. If a step can't be done as written, stop
and report what you saw rather than improvising around an operator rule.

## Report back with (exact completion contract)

One message in your pane, nothing else:
1. `wc -l bin/ctl-fleet` before → after (cap 300).
2. The exact spawn command, the respawned CTRL pane id + its `tab_id`, and
   the `herdr pane list` evidence that `CORD future` is still in `w1A:t1` and
   focused (before and after).
3. 6-10 lines of `herdr pane read <new CTRL pane>` showing the new rows —
   your live proof of the 10X format and of no pane/tab ids.
4. The `grep -nE '\b(CTL|TWR|OCH|AGT|SUB)\b'` result over your three files.
5. The commit SHA.
6. Anything you could not do, stated plainly.

Then stop. Do not start new work. Your parent reaps your pane.
