# shim-pwd-stamp — cursor-fleet workspace $pwd metadata

> Follow-up from sidebar-dashboard make (2026-08-12). spine-spawn side landed
> in herdr-spine; cursor-fleet is a different repo and must be updated
> separately.

## Operator intent

Workspace sidebar L2 should show `$pwd` (dim) so the operator sees where each
project workspace lives without opening panes.

## Pre-verified facts

- `herdr workspace report-metadata <ws_id> --source <id> --token pwd=<cwd>`
  is the carrier (confirmed in `herdr workspace --help`).
- spine-spawn now stamps pwd at tab create and after every verified spawn
  (`bin/spine-spawn`, `stamp_workspace_pwd`).
- cursor-fleet workspace create lives at `~/cursor-shim/cursor-fleet` (~line
  117 in `up` / workspace create path).

## Task

In `~/cursor-shim/cursor-fleet`, when creating a workspace (or tab with
`--cwd`), call:

```
herdr workspace report-metadata <ws_id> --source cursor-fleet \
  --token pwd=<abs-cwd> --ttl-ms 86400000
```

Non-fatal on failure (log only). Match spine-spawn semantics.

## Done-when

- cursor-fleet stamps `$pwd` on workspace creation with the workspace cwd.
- Evidence: spawn via `cursor-fleet up`, `herdr api snapshot` shows `$pwd`
  on the workspace row.
