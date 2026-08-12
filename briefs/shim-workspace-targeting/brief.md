# UNIT shim-workspace-targeting — cursor-fleet make/worker must not split the caller's tab

> Filed by: CONCIERGE 2026-08-12 (operator pain, twice: "why the fuck are you splitting panes in the engine shop concierge tab"). NOT yet scheduled — pick up as a cursor-shim unit when the operator calls it.

## Problem

`cursor-fleet make` / `cursor-fleet worker` / `cursor-spine <profile>` spawn workers by splitting the CALLER's current tab (default `--pane $HERDR_PANE_ID`). When the concierge (or any control-plane pane) runs a make, AGNT panes open in the caller's workspace — today that was the Engine Shop, violating the topology doctrine (Engine Shop = one tab, three panes: Concierge, CTRL, TOWR; task work lives in task workspaces).

## Fix direction

- `--workspace <id>` (and/or `--new-workspace <label>`) flag on `cursor-fleet make`, `cursor-fleet worker`, and `cursor-spine`: spawn the unit's panes into the target workspace (create tab there via `herdr tab new --workspace`), instead of splitting the caller's tab.
- Default behavior change to consider: when the caller's pane carries role token `0-CONCIERGE`/`1-CORD`/`2-ORCH` (i.e., a control plane), refuse or warn on same-tab worker splits unless `--pane` is explicit. Doctrine: control planes don't host workers.
- `cursor-fleet up` already creates scoped workspaces correctly — this unit is about everything BELOW up.

## Acceptance

- AC1: `cursor-fleet make <slug> --workspace <id>` opens coder/test-maker panes in workspace `<id>`, never the caller's tab.
- AC2: same for `cursor-spine <profile> --workspace <id>`.
- AC3: control-plane caller without targeting flags gets a loud warning (or refusal) before any same-tab split.
- AC4: `bash docs/qa-verify.sh` green + new cases (dry-run level; NO live spawns — cf. 78fa55c).

## Context

- Repo: `~/cursor-shim` (git). Suite: `docs/qa-verify.sh` (90/90 as of 6c85350).
- Prior art for targeting: `cursor-spine --tab`, `--pane`; herdr `tab new --workspace`, `pane split --pane`.
- Related commits: 508b3ba (non-repo worktree guard), 78fa55c + 6c85350 (suite spawn-leak fixes).
