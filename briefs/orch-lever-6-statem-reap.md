# ORCH brief — Lever 6: statem glyph titles + event-driven reap

You are the ORCH for lever 6 of the cursor-shim program. You delegate edits to
coder AGNTs (`cursor-fleet worker coder --brief <sub-brief> --dir <worktree>`);
you never write production code yourself. Workers never commit — the CORD gates
and commits.

## Worktree / branch (binding)

- Dir: `/Users/jrg/cursor-shim-lever-6-statem-reap`
- Branch: `lever-6-statem-reap` (already checked out; do not switch)
- Edit ONLY: `cursor-fleet`, `README.md`. Nothing else. Scratch/proof files go
  in `mktemp -d` dirs OUTSIDE the repo.

## Mission

(a) Wire cursor ORCH tabs into statem so Made Well outer/inner state shows as
GLYPH-ONLY tab titles. (b) Add an event-driven reap option that waits on
`agent_status_changed(done)` instead of fixed sleeps.

## Pre-verified facts (verified by CORD this session, 2026-08-11 — trust these)

- statem: `bun ~/agent-core/primitives/tools/statem/statem.ts <project-root>`
  polls `.madewell/`, derives outer stage / inner phase, appends `finding` rows
  (topic `statem`), and rewrites tab titles via `herdr tab rename <tab_id>
  <label> <glyphs...>`. Glyph mapping config: `~/.tower/statem-tabs.json`,
  keyed by REALPATH'd project root → array of `{tab_id, label, cycle}`.
  `cycle: "*"` (or absent) tracks the OUTER stage. Titles are GLYPHS ONLY —
  no phase words, no agent/task text (authority: herdr SKILL.md Observability
  spec). Useful flags: `--once`, `--no-tabs`, `--interval <ms>`.
- Minimal `.madewell/` shape statem reads (from statem.ts readState):
  - `<root>/.madewell/madewell.json`: `{"stage":"build","active":[{"cycle":".madewell/c001.json"}]}`
    (stage ∈ discovery|commit|build|land)
  - `<root>/.madewell/c001.json`: `{"id":"c001","phase":"make","done":["i001"],"active":["i002"]}`
    (phase ∈ imagine|plan|make|verify)
- Event primitive: `herdr agent wait <pane-id> --until done --timeout MS`
  (verified via `herdr agent wait --help`: repeatable `--until`, bounded by
  `--timeout`, exits non-zero on timeout). Without `--timeout` it waits
  indefinitely — ALWAYS pass a timeout in the shim.
- LEVER 1 IS NOT MERGED. Branch `lever-1-herdr-kind` has zero commits; the
  cursor agent-detector is NOT installed (`~/.config/herdr/agent-detection/`
  is empty). Consequence: cursor-shim panes (launched via `herdr pane run`)
  report `agent_status: unknown` — status events only exist for panes launched
  via `herdr agent start --kind cursor`. Therefore:
  - Build the event-driven reap behind a CAPABILITY CHECK: use the event wait
    only for panes whose `agent_status` is a real state (not `unknown`);
    fall back to today's behavior otherwise.
  - For the proof you MAY install the detector: `herdr integration install
    cursor` (idempotent; reversible via `herdr integration uninstall cursor`)
    and spawn a test pane directly with `herdr agent start <name> --kind
    cursor --pane <id> -- --force` (name must be session-unique,
    lowercase-kebab). Note this dependency in your report.
- `cursor-fleet` requires `HERDR_ENV=1` (you are inside a herdr pane — fine).
  `cursor-fleet down <project>` currently does `cursor-spine reap --done` +
  `herdr workspace close`.
- Infra panes (TOWR/CTRL in `up`) are best-effort, non-fatal, run forever,
  never reaped. statem must follow the same pattern.

## Design constraints (rubric: minimal, additive, world-class DX)

- `up`: add an OPTIONAL `--statem` flag that spawns statem for the workspace
  root (`--dir`) as an infra split in tab 1, renamed `STATEM <project>`,
  exactly like the TOWR/CTRL blocks (non-fatal, runs forever).
- `orch`: after tab create, register the new tab in
  `~/.tower/statem-tabs.json` under the realpath'd `--dir` root as
  `{tab_id, label: "ORCH <slug>", cycle: "*"}` so statem rewrites the ORCH tab
  title to glyphs. Tolerant JSON edit (python3, like the existing helpers);
  create the key/array if absent; never clobber other projects' entries;
  de-dupe on tab_id.
- `down`: add an OPTIONAL event-driven wait, e.g. `down <project>
  [--wait-done [--timeout MS]]` — for each shim-registered pane in the
  workspace whose `agent_status` is a real state, `herdr agent wait <pane>
  --until done --timeout MS` BEFORE `reap --done` + workspace close. Panes
  with `unknown` status skip the wait (capability check). Default behavior
  (no flag) is byte-identical to today.
- Keep the diff small and in the style of the file (bash, `set -euo pipefail`,
  `hj`/`json_get` helpers, `die`/`log`).

## Done-when (prove each with a real command; no mocks)

1. `bash -n cursor-fleet` passes.
2. GLYPH PROOF: create a scratch root (`mktemp -d`) with the minimal
   `.madewell/` above; `cursor-fleet up <test-project> --dir <scratch>
   --statem --prompt "<trivial>"`; `cursor-fleet orch smoke --dir <scratch>
   --prompt "reply ORCH-LIVE then stop"`; then show `herdr tab list` (or
   workspace list) output where the ORCH tab title carries statem's glyphs
   (e.g. `ORCH smoke ▰▰▰▱`). Flip `stage` in the scratch `madewell.json`
   (e.g. build→land) and show the title changes on the next poll.
3. EVENT-REAP PROOF: `herdr integration install cursor`; spawn a test
   `--kind cursor` pane with a trivial prompt; run `cursor-fleet down
   <test-project> --wait-done --timeout 120000`; show the wait returned on
   the done EVENT (not a sleep — e.g. timestamps/`time` output showing it
   returned the moment the agent went done, well under any fixed interval).
   Also show the capability fallback: a pane with `agent_status: unknown`
   is skipped by the wait and reaped by the existing path.
4. REAP THE TEST FLEET: test workspace closed, test panes gone
   (`herdr workspace list` + `cursor-spine ps` clean of test artifacts).
   Do NOT close workspace `w22` (the CORD's) or other lever workspaces.
5. Leave all edits UNCOMMITTED in the worktree. Write
   `/tmp/lever-6-orch.done` containing: exact lines changed per file, the
   proof transcripts (commands + observed output), and the Lever 1
   dependency note. Post one board finding to topic
   `cursor-shim/lever-6-statem-reap` summarizing outcome.

## Report-back

Your `.done` file + board finding are how the CORD collects. A false green is
worse than a red — if a proof fails, report the failure verbatim.
