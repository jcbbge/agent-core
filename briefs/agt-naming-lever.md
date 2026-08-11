# Brief: AGT naming-lever — make the herdr sidebar say who/what/where
Date: 2026-08-10
Parent: OCH herdr-qol (pane w1A:p6). Report to it, not to the operator.
Status: ready

## What This Is
The operator cannot tell who an agent is from the herdr sidebar. Rows read
`done · c004-td-i004 · c004-ux / Done. Wrote /Users/jrg/...`. Fix it with the
levers herdr 0.8.0 already ships — no fork, no new service, no config
rewrite. Then codify the discipline where spawners read it.

Operator mandate, verbatim: "simplest, easiest, minimal, barebones." This is
a docs section plus a short set of verified CLI calls. No new tooling.

## Your file partition (you own these, nothing else)
- EDIT `/Users/jrg/herdr-spine/docs/spawn.md` — append ONE section (~50
  lines, hard ceiling 70)
- Live `pane rename` / `report-metadata` / `agent.view.set` calls per Tasks

Do NOT touch: `/Users/jrg/herdr-spine/bin/ctl-fleet` and
`docs/ctl-fleet.md` (AGT ctl-fleet owns those, working in parallel RIGHT
NOW), `/Users/jrg/source/herdr` (read-only reference — never modify herdr),
`~/.config/herdr/config.toml` (operator-owned; propose, never edit), the
`future` repo. Do NOT modify `bin/spine-spawn` — that change is a PROPOSAL in
your report, not an edit.

## Pre-Verified Facts (OCH herdr-qol, verified live, herdr 0.8.0)
Two sources, both authoritative: live probes run this session, and the
codebase research report at `/Users/jrg/source/herdr-RETROFIT-MAP.md` (read
lines 215-250 and 285-292 before you start — they carry the file:line
citations behind everything below).

### THE KEY FACT — what the sidebar actually renders
Operator config `~/.config/herdr/config.toml:93-99`:
```toml
rows = [["state_icon","state_text","agent","workspace"], ["$task","$claim"]]
[ui.sidebar.agents.rows_by_agent]
claude = [["state_icon","state_text","agent","workspace"],["$task","$claim"],["$verdict"]]
```
The name in the row is the **`agent` token = the agent registration name**,
NOT the pane label. This is why `pane rename` alone did not fix legibility,
and why rows read `c004-td-i004`. Three carriers exist:

1. **`herdr agent start <name>`** — `<name>` IS what the `agent` token shows,
   and it **persists across server restarts** (`persist/restore.rs:546-548`).
   CONSTRAINT, verified live today: at 0.8.0 names are **lowercase-kebab
   only** — `"OCH statem-tower"` returns `invalid_agent_name`. So names carry
   the prefix as `crd-` / `och-` / `agt-` / `sub-`.
2. **`herdr pane report-metadata <id> --source <src> --display-agent "AGT
   td-i004"`** — overrides the *displayed* name without touching the
   registration name (`schema/panes.rs:360`), so it accepts spaces and case.
   This is how you get true display case in the sidebar.
3. **`herdr pane rename <id> "<label>"`** — feeds the `pane` token, which is
   NOT in the operator's current rows. Display-only, immediate, reversible,
   and it IS what `herdr api snapshot → panes[].label` returns (so the
   CTL fleet pane reads it). Keep it correct; just don't expect the sidebar
   to show it.

### `$task` is ours to set — the "what they're working on" line
```
herdr pane report-metadata <PANE_ID> --source <ID> --token task="wire OAuth callback"
```
(`cli/pane.rs:1295`). Renders via `$task` because `Custom(name)` reads
`entry.tokens` (`ui/sidebar/tokens.rs:76-80`). Full flag list, verified from
`--help`: `--source <ID>` (REQUIRED), `--agent`, `--title`, `--clear-title`,
`--display-agent`, `--clear-display-agent`, `--state-label <STATUS=TEXT>`,
`--clear-state-labels`, `--token <NAME=VALUE>`, `--clear-token <NAME>`,
`--seq <N>`, `--ttl-ms <N>`.

Caps and lifetime, all verified: **80-char values**, ≤16 keys/request, ≤32
keys/pane, TTL 1ms–24h. **Omit `--ttl-ms`** — the token then lives until
cleared or until the server restarts. (The 15-minute "amnesia" in the current
spine setup is a self-inflicted TTL, not a herdr limit.) **Tokens do NOT
survive a server restart** (`restore.rs:541,546-648`) — agent names do. Say
this plainly in the docs; it is the trap.

spine-spawn already uses this lever: `stamp_project()` at
`bin/spine-spawn:217-238` stamps `--token project=<slug>`.

### Hierarchy ordering of the whole panel
`agent.view.set` (`src/api/schema/agents.rs:50-161`, apply
`src/app/agent_view.rs:26-78`) installs a filter + multi-key sort over the
agents panel, on builtin fields OR **any custom token** (`{"token":"role"}`),
and labels it in the panel header (`src/ui/sidebar.rs:106-110`). So: stamp
`--token role=...` per pane, then sort the panel by `role` and the sidebar
itself renders CRD > OCH > AGT/SUB order. Use a sortable value (e.g.
`1-CRD`, `2-OCH`, `3-AGT`, `4-SUB`) since the sort is over the token string.
There is no `herdr agent view` CLI verified — reach `agent.view.set` over the
socket (see "Socket" below) and report the exact request you sent.

### Socket (verified round-trip this session)
Path `/Users/jrg/.config/herdr/herdr.sock`, newline-delimited JSON,
envelope `{"id":"x","method":"<method>","params":{...}}`. Example that works:
`{"id":"s","method":"session.snapshot","params":{}}` →
`{"id":"s","result":{"type":...,"snapshot":{...}}}`. Read the exact param
shape for `agent.view.set` from `herdr api schema --json` before sending.

### The law you are codifying
`~/agent-core/primitives/rules/control-flow.md` (operator law — read first):

| Prefix | Role | Scope |
|---|---|---|
| `CRD [project]` | Coordinator | one per project |
| `OCH [feature/bug/chore]` | Orchestrator | one per committed unit of work |
| `AGT [Task]` | Agent | the work at hand |
| `SUB [TODO]` | Subagent | async / deferred |

"Every spawned pane is renamed to its prefixed role BEFORE its agent starts."

### Where the discipline currently leaks
`spine-spawn` passes ONE `role` string to both `pane rename` and
`agent start` (`bin/spine-spawn:241-244`, `spawn_into_pane`), and
`cmd_fanout` derives roles as `<task>-w1`, `<task>-w2`
(`bin/spine-spawn:356`) — no prefix. That is exactly how `c004-td-i004`
reached the sidebar.

### Current live panes (verified snapshot, 2026-08-10)
```
w1A:p1  label "CRD future"        claude  working   COMPLIANT
w1A:p3  label "OCH c004-ux"       claude  done      COMPLIANT
w1A:p5  label "OCH statem-tower"  claude  working   DO NOT TOUCH (see Out of Scope)
w1A:p6  label "OCH herdr-qol"     claude  working   your parent — DO NOT TOUCH
w1C:p2  label "impl-i001"         claude  done      NON-COMPLIANT
w1C:p3  label "impl-i004"         claude  done      NON-COMPLIANT
w1C:p4  label "td-i004"           claude  done      NON-COMPLIANT
w1D:p1  (no label)                pi      working   NON-COMPLIANT, cwd /Users/jrg/madewell-meta
w1B:p16 "c003-daemon", w1B:p17 "c003-client"  — bare shells, no agent
```

## Tasks (each with its done-when)

### 1. Make four live rows legible — the demonstration
For `w1C:p2`, `w1C:p3`, `w1C:p4` and `w1D:p1`, apply all three carriers:
- `herdr pane rename <id> "AGT <task>"` (keeps `panes[].label` correct for
  the CTL fleet pane)
- `report-metadata --source ctl-naming --display-agent "AGT <task>"` (fixes
  the sidebar row itself)
- `report-metadata --source ctl-naming --token role=3-AGT --token task="<what
  it is working on, ≤80 chars>"` — derive `task` from real evidence
  (`herdr pane read <id>`, last ~30 lines, or `tokens.verdict`), do not invent
  it. No `--ttl-ms`.

For `w1D:p1` decide the prefix from evidence (`cwd` is
`/Users/jrg/madewell-meta`; read the pane). If the evidence does not clearly
say coordinator/orchestrator/agent, use `AGT madewell-meta` and say in your
report that you inferred it.

Done when a fresh `herdr api snapshot` shows, for each of the four, the new
`label`, `display_agent`, and `tokens.role`/`tokens.task`. Paste before/after
lines for all four. If `--display-agent` does not appear in the snapshot,
report the actual observed behavior — an honestly reported dud lever is a
good result; a claimed one that was not verified is not.

### 2. Hierarchy-sort the agents panel
Send `agent.view.set` over the socket with a sort on `{"token":"role"}`.
Done when you paste the exact request JSON and the exact response. If it
errors, paste the error and stop — do not retry blind, and do not fall back
to editing config.toml (operator-owned).

Note in your report: `role` tokens die on server restart, so panel sort
degrades to unsorted after a restart until a re-stamper runs. Propose the
re-stamper (`[[startup]]` daemon in the spine plugin manifest is sanctioned
at 0.8.0 per the report, `plugins/panes.rs`/manifest) — propose only, do not
build it.

### 3. Append the naming section to `docs/spawn.md`
Read the whole file first; match its voice (terse, declarative,
evidence-first). The section must state, in this order:
- The four-prefix table.
- **The three carriers and which one the sidebar shows** — this is the point
  of the section. Registration name = lowercase-kebab `och-`/`agt-` (0.8.0
  rejects spaces/case with `invalid_agent_name`); `--display-agent` for the
  pretty case in the row; `pane rename` for `panes[].label`. Exact commands.
- `$task`: how to set it, the 80-char cap, "omit `--ttl-ms`", and the
  **tokens-die-on-restart** trap versus names-persist.
- `role` token + `agent.view.set` for hierarchy ordering.
- The spine-spawn gap (`<task>-wN`, one role string for both names) and the
  interim rule: every fanout is followed by rename + display-agent. Show the
  one-liner.
- Pointer to `~/agent-core/primitives/rules/control-flow.md` as the law.

## Verification you must actually run (no claims without output)
Every done-when needs a real command and its real output pasted.
`herdr api snapshot | grep`-style extraction is fine; asserting "renamed
successfully" without a snapshot line is not.

## Out of Scope
`w1A:p5 OCH statem-tower` and any pane it owns (OCH statem-tower owns those);
your parent `w1A:p6`; `w1A:p1 CRD future`; editing `config.toml`,
`bin/spine-spawn`, or herdr source; the `future` repo; Tower/statem work;
`bin/ctl-fleet` and `docs/ctl-fleet.md`; building the re-stamper.

## Report back with (exact completion contract)
Reply in your pane with: spawn.md section summary + final `wc -l`;
before/after snapshot lines for all four panes (label, display_agent, tokens);
the `agent.view.set` request and response verbatim; your proposed
spine-spawn change and proposed re-stamper, both described not applied;
and deviations from this brief or the word "none". Do not post to the Tower
board — your parent OCH aggregates.
