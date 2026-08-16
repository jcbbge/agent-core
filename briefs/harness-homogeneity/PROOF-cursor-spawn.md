# PROOF — a real cursor agent spawned through `spine-spawn`

Unit 3 task 1 (ORCH-1 `spine-routes-cursor`, T2). Captured 2026-08-16 by
`ORCH [spine-routes-cursor]` (pane `w3R:p1E`). No mocks: every line below is
verbatim terminal output from a real spawn of a real `cursor-agent` process.

`~/herdr-spine` was at the landed state of edits A-D when this ran (patch
applied to `main`'s working tree, suites green: acceptance 30/30,
`ctl-fleet-tasks.sh` 7/7, `worktree-lifecycle.sh` 14/14).

## The workspace, created for this test

```
$ ~/herdr-spine/bin/spine-workspace create --label cursor-parity --cwd /Users/jrg/herdr-spine
[workspace] created w3W label=cursor-parity cwd=/Users/jrg/herdr-spine
```

## Attempt 1 — refused, and NOT by the cursor route

Recorded because it is a real pre-existing defect this unit uncovered, and
because it is the run that proves the routing works even while the spawn fails.

```
$ cd ~/herdr-spine && ~/bin/spine-spawn orch --task "cursor verb parity probe" \
    --workspace w3W --kind cursor --profile researcher \
    --brief /Users/jrg/agent-core/briefs/harness-homogeneity/SAGT-cursor-verb-parity.md \
    --cwd /Users/jrg/herdr-spine

spine-spawn: workspace w3W: stamped pwd=/Users/jrg/herdr-spine
spine-spawn: tab w3W:t2 (cursor verb parity probe) created, root pane w3W:p2
spine-spawn: w3W:p2: stamped ORCH cursor verb parity probe role=2-ORCH
spine-spawn: w3W:p2: lineage orchestrator parent=w3R:p1E
spine-spawn: FAIL: `herdr agent start orch-cursor verb parity probe --kind cursor --pane w3W:p2 --timeout 30000 -- --force --trust --model composer-2.5-fast` failed (exit 1): {"error":{"code":"invalid_agent_name","message":"agent name must start with a lowercase letter and contain only lowercase letters, digits, '-' or '_' (1-32 characters)"},"id":"cli:agent:start"}
```

**Read the failed command line — it is itself the proof of edits A, B and C.**
`spine-spawn` composed `--kind cursor ... -- --force --trust --model
composer-2.5-fast`. The refusal at `:1470-1475` is gone (edit A), the gateway
slug resolved (edit B), and the cursor flags are in the `--` passthrough
(edit C). The spawn failed for an unrelated reason: `cmd_orch:1018-1022`
interpolates `--task` into the registration name raw
(`f"orch-{args.task}"`), so a task string containing spaces produces an
illegal agent name. **That defect is kind-independent and pre-existing** — it
would fail identically for `--kind claude` — and it is recorded as a finding,
not fixed here, because it is outside this unit's partition of work.

## Attempt 2 — the spawn, with a slug-safe task

```
$ cd ~/herdr-spine && ~/bin/spine-spawn orch --task "cursor-verb-parity" \
    --workspace w3W --kind cursor --profile researcher \
    --brief /Users/jrg/agent-core/briefs/harness-homogeneity/SAGT-cursor-verb-parity.md \
    --cwd /Users/jrg/herdr-spine

spine-spawn: workspace w3W: stamped pwd=/Users/jrg/herdr-spine
spine-spawn: tab w3W:t3 (cursor-verb-parity) created, root pane w3W:p3
spine-spawn: w3W:p3: stamped ORCH cursor-verb-parity role=2-ORCH
spine-spawn: w3W:p3: lineage orchestrator parent=w3R:p1E
spine-spawn: w3W:p3: cursor started and ready as orch-cursor-verb-parity model=composer-2.5-fast
spine-spawn: w3W:p3: prompt submitted, status flip observed (now working)
spine-spawn: workspace w3W: stamped pwd=/Users/jrg/herdr-spine
{"role": "orch-cursor-verb-parity", "display": "ORCH cursor-verb-parity", "pane_id": "w3W:p3", "tab_id": "w3W:t3", "workspace_id": "w3W", "kind": "cursor", "project": "herdr-spine", "profile": "researcher", "model": "composer-2.5-fast", "agent_status": "working", "submitted": true, "brief": "/Users/jrg/agent-core/briefs/harness-homogeneity/SAGT-cursor-verb-parity.md"}
```

## The independent `herdr agent list` record

Read from herdr, not from `spine-spawn`'s own output:

```json
{
  "agent": "cursor",
  "agent_session": {
    "agent": "cursor",
    "kind": "id",
    "source": "herdr:cursor",
    "value": "d7c6cf5c-f7a8-4427-84b0-28bb669fb139"
  },
  "agent_status": "working",
  "cwd": "/Users/jrg/herdr-spine",
  "display_agent": "ORCH cursor-verb-parity",
  "interactive_ready": true,
  "name": "orch-cursor-verb-parity",
  "pane_id": "w3W:p3",
  "tab_id": "w3W:t3",
  "terminal_title": "Researcher SAGT",
  "tokens": {
    "name": "cursor-verb-parity",
    "parent": "w3R:p1E",
    "project": "herdr-spine",
    "role": "2-ORCH",
    "task": "cursor-verb-parity"
  },
  "workspace_id": "w3W"
}
```

`"agent": "cursor"` · `agent_session.source == "herdr:cursor"` ·
`agent_status == "working"`. All three required by the done-when.

## The model landed, and it is not `auto`

- The spawn log line reads
  `w3W:p3: cursor started and ready as orch-cursor-verb-parity model=composer-2.5-fast`.
- `--profile researcher` resolves through `profile-model` to the gateway slug
  `cursor/composer-2.5:fast` (run this session:
  `~/agent-core/primitives/profiles/profile-model get researcher` ->
  `cursor/composer-2.5:fast`).
- `CURSOR_MODEL_MAP` translates that to `composer-2.5-fast`, which is exactly
  what the spawn passed and what herdr forwarded.
- **Third, independent confirmation:** the cursor-agent TUI's own status bar in
  pane `w3W:p3` reads `Composer 2.5 Fast · 23.1%`. The agent is running the
  model the operator's profile chose, reported by the agent's own process
  rather than by the spawner.

Before edit B this spawn would have passed no `--model` at all and the agent
would have silently inherited cursor-agent's default.

## Teardown

Pane `w3W:p3`, the orphaned pane `w3W:p2` from attempt 1, and workspace `w3W`
are reaped through the sanctioned door; see the closing record in the ORCH
report. Done = gone.
