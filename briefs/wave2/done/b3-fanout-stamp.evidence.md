# B3 fanout self-stamp — evidence

AGNT B3 under orch-phase4-automation. Closed the spine-spawn fanout naming
gap: fanout now derives `AGNT <headline>` (+ name/role tokens) from each
brief's H1 and applies it at spawn. No manual re-stamp required.

## Files touched (partition only)
- `~/herdr-spine/bin/spine-spawn`
- `~/herdr-spine/docs/spawn.md` (naming-gap section)
- `~/agent-core/briefs/wave2/workers/b3-echo-test.md` (ephemeral test brief)

## Code changes
- Added `import re`.
- Added `brief_headline(brief_path, max_len=80)`: first `^#\s+...` H1 only
  (`##`+ skipped); strips `#`, markdown emphasis/inline-code (`* _ \``), and a
  leading control-flow word (`AGNT`/`ORCH`/`CORD`/`SAGT`, case-insensitive) so
  the spawner's re-added prefix does not double; collapses whitespace;
  truncates to 80 chars on a word boundary. Returns `None` (caller falls back
  to the `<task>-wN` slug) on unreadable/absent H1 — never raises.
- `control_flow_display(role, args, headline_override=None)`: override wins
  over the slug-derived headline. `orch`/`worker` unchanged (no override).
- `spawn_into_pane(..., headline=None)`: threads the override into
  `control_flow_display`.
- `cmd_fanout`: `headline = brief_headline(brief) or role` per worker, passed
  as `headline=` to `spawn_into_pane`. Registration name for `agent start`
  stays the unique lowercase-kebab `<task>-wN` slug.

## Compile
```
$ python3 -m py_compile ~/herdr-spine/bin/spine-spawn
COMPILE_OK   (exit 0)
```

## Unit checks (brief_headline + display mapping)
```
'# AGNT echo stamp probe'   -> 'echo stamp probe'
'# AGNT fanout self-stamp'  -> 'fanout self-stamp'
'# ORCH: wire the thing'    -> 'wire the thing'
'# plain headline no prefix'-> 'plain headline no prefix'
'##' (H2 skipped) + H1      -> H1 text
no H1                       -> None
unreadable path            -> None
80-char word-boundary trunc-> ok
control_flow_display('b3stamp-w1', fanout, 'echo stamp probe')
   -> ('AGNT echo stamp probe', '3-AGNT', 'echo stamp probe')
```

## Before / after (display doubling caught + fixed live)
BEFORE prefix-strip (first live run, brief H1 `# AGNT echo stamp probe`):
```
display_agent = "AGNT AGNT echo stamp probe"   # doubled
tokens.name   = "AGNT echo stamp probe"
```
AFTER prefix-strip (second live run, same brief):
```
display_agent = "AGNT echo stamp probe"
label         = "AGNT echo stamp probe"
tokens.name   = "echo stamp probe"
tokens.role   = "3-AGNT"
tokens.project= "herdr-spine"
```

## Live fanout (workspace w1M, kind pi)
```
$ python3 ~/herdr-spine/bin/spine-spawn fanout --task b3stamp --workspace w1M \
    --kind pi --cwd /Users/jrg/herdr-spine \
    --brief ~/agent-core/briefs/wave2/workers/b3-echo-test.md
spine-spawn: tab w1M:tD (b3stamp-workers) created, root pane w1M:pT
spine-spawn: w1M:pT: stamped AGNT echo stamp probe role=3-AGNT
spine-spawn: w1M:pT: pi started and ready as b3stamp-w1
spine-spawn: w1M:pT: prompt submitted, status flip observed (now working)
spine-spawn: all 1 workers spawned and verified in tab b3stamp-workers
{"role": "b3stamp-w1", "display": "AGNT echo stamp probe", "pane_id": "w1M:pT",
 "tab_id": "w1M:tD", "workspace_id": "w1M", "kind": "pi", "project": "herdr-spine",
 "agent_status": "working", "submitted": true,
 "brief": ".../b3-echo-test.md"}
```

## Stamp verification (`herdr pane get w1M:pT`)
```
"display_agent":"AGNT echo stamp probe",
"label":"AGNT echo stamp probe",
"tokens":{
  "name":"echo stamp probe",
  "project":"herdr-spine",
  "role":"3-AGNT",
  "task":"You are b3stamp-w1. Read and execute your brief at…"   # herdr live-owned
}
```
Echo worker hit its done-condition: board finding
`agnt-b3-echo @ herdr-spine/phase4: echo stamp probe alive; self-stamp works`
and daemon line `pi done on AGNT echo stamp probe` (H1-derived name flows
end-to-end); `~/agent-core/briefs/wave2/done/b3-echo-test.done` written.

## Reap
```
$ herdr pane close w1M:pT   -> {"type":"ok"}
$ herdr tab get w1M:tD      -> {"error":{"code":"tab_not_found",...}}   # empty tab auto-removed
```

## Residual (honest)
The `task` token is stamped to the headline at spawn, but herdr's live agent
monitor overwrites it with the delivered prompt once the agent starts working
(`task="You are <role>. Read and execute your brief at…"`). That is
herdr-owned live state, not the spine stamp, and was equally unavoidable under
the old manual re-stamp. Stable spine-owned carriers are `display_agent`,
`label`, `name`, and `role`. No remaining manual step for fanout naming.
