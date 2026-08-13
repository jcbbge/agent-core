# make sidebar-dashboard — herdr sidebar as operator dashboard

> From: CONCIERGE (operator intake 2026-08-12 ~21:46 UTC, "ship it"). Binding.
> Repo: `/Users/jrg/herdr-spine` (git — worktree wall applies, full bifurcation).

## Operator intent (verbatim anchors)

"it just doesnt have any real meaning" · "i would much rather know the pwd" ·
"its single line so its all crammed anyway" · "this is effectively a dashboard
view to give me insight, status, updates across the full spectrum" ·
approved design: agents grouped under project workspaces, every row
self-describing, no ids.

## Pre-verified facts (CONCIERGE, this session, from `herdr --default-config` + live config)

- **Config is spine-managed:** `~/.config/herdr/config.toml` lines 19–140 are the
  spine block — DO NOT hand-edit. Edit `~/herdr-spine/config/spine.fragment.toml`
  and re-run `install.sh` (it treats ANY reload diagnostic as fatal and rolls
  back — that is the safety net; verify this behavior still holds).
- **Grouping:** `agent_panel_sort = "spaces"` groups agents under workspace
  headings ("workspaces" is an alias). Current live value: `"priority"` — the
  flat attention queue the operator finds chaotic. CHANGE to `"spaces"`.
- **Agent row built-ins:** `state_icon, state_text, workspace, tab, pane, agent,
  terminal_title, terminal_title_stripped` + `$name` pane-metadata tokens.
- **Space row built-ins:** `state_icon, state_text, workspace, branch,
  git_status` + `$name` workspace-metadata tokens via `herdr workspace
  report-metadata` (verb confirmed in `herdr workspace --help`).
- **Inline token styling (new since the 2026-07-24 config notes):**
  `{ token = "workspace", fg = "#89b4fa", bold = true, dim = false }` — strict
  #RGB/#RRGGBB + bold/dim. Use this; do NOT rely on the unresolved
  state→color-token mapping. Palette tokens already in config: blue #89b4fa,
  green #a6e3a1, overlay0 #6c7086, subtext0 #a6adc8, mauve #cba6f7.
- **View rename:** `~/herdr-spine/config/agent-view.default.json` label
  `tower-auto-attention` → `needs-you`. Also update the seeded copy at
  `$HERDR_PLUGIN_STATE_DIR/agent-view.json` and re-apply via the
  `agent.view.set` RPC (see `bin/spine-startup`, `bin/handlers/15-restore-view`).
- **$pwd stamping:** `cursor-fleet up` (`~/cursor-shim/cursor-fleet`, workspace
  create ~line 117) and `spine-spawn` (`~/herdr-spine/bin/spine-spawn`) must
  stamp `herdr workspace report-metadata <ws> ... $pwd=<cwd>` at creation.
  NOTE: cursor-fleet is a DIFFERENT repo (`~/cursor-shim`) — if the make's
  worktree is herdr-spine-only, land the spine side and file the cursor-shim
  stamping as a follow-up brief at `~/agent-core/briefs/shim-pwd-stamp/brief.md`
  rather than mixing repos.
- **Existing live rows (preserve $verdict for claude):** agents
  `[["state_icon","state_text","agent","workspace"],["$task","$claim"]]`;
  claude gets a third `["$verdict"]` line.

## Target layout (approved)

```
▼ agent-core  ●                          ← space L1: workspace bold + state_icon
  ~/agent-core  main ±2                  ← space L2: $pwd dim, branch, git_status
  ● working  AGNT tsks-render coder      ← agent L1: state_icon state_text agent
    render rework impl                   ← agent L2: $task dim (+$claim)
```

- Agent rows DROP the `workspace` token (redundant under spaces grouping).
- Keep `rows_by_agent` only where it adds (claude $verdict line).
- All timestamps/noise out; glyphs + words carry state.

## Done-when

- Fragment edited; `install.sh` runs clean (zero diagnostics, no rollback);
  `herdr server reload-config` green.
- Live sidebar evidence: `herdr api snapshot` shows agents grouped by space;
  workspace rows carry `$pwd`; view label reads `needs-you`.
- $pwd stamping live in spine-spawn (and cursor-fleet follow-up brief filed if
  split).
- Committed to herdr-spine main per make protocol. Report-back: config diff
  summary + snapshot evidence + any token that failed to render (say so
  plainly — silent-ignore is herdr's known failure mode for unknown tokens).
