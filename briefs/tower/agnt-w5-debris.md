# AGNT [w5-debris] — Remove attic-matched `.bak*` from live `~/.tower/`

You are a worker under `ORCH [w5-remodel-debris]` (pane `w2Y:pW`, registration
`orch-orchestrator-w2y-pw` / role name `orch-w5-remodel-debris`). Your ORCH
reports to `CORD [Tower]` (`w2Y:p1`). Do NOT use emojis anywhere.

Mission: inventory every live `~/.tower/**/*.bak*`, prove sha256 match against
`~/agent-core/primitives/mcps/tower/attic/`, then REMOVE only matched deployed
copies. Unmatched = KEEP-WITH-NOTE. No code changes. No git commit. No push.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session — re-verify before each delete)

1. Live bak set (exactly 7; `find ~/.tower -name '*.bak*' -type f`):
   - `cli.mjs.bak-20260812T165125Z` size 8518 sha256 `b8c75410162b9295dfc3821583176bef6a0b680b49b4e5c524ff4c92e6df6c1b`
   - `COMMS-ARCH.md.bak-20260810T221108Z` size 6667 sha256 `f196768b5d9701597714135e3742d98a9fa80d30c27c755dba0cacbc4d25f083`
   - `COMMS-ARCH.md.bak-20260812T165025Z` size 10149 sha256 `0fad1d9e5e8823d0df1904df66d246bf92f9412076ba2db894c4e879b709cd13`
   - `lib.mjs.bak-20260812T194500Z` size 531 sha256 `8f465ca2b0372890792fe4533353799298cdf082d135e11ecffe4381dcb3063d`
   - `server.mjs.bak-20260810T221108Z` size 13915 sha256 `e82b43d539c19e2f837ec8be0e8ae24cc293bbd08a39cd7b73135c41343cb96b`
   - `server.mjs.bak-20260812` size 16798 sha256 `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4`
   - `server.mjs.bak-20260812T165125Z` size 14169 sha256 `9b12b00642f7567fc3339d843560391bc6e88d3a4fd60afcb92a3a0741edb59c`
2. Attic path: `/Users/jrg/agent-core/primitives/mcps/tower/attic/`. Same seven
   filenames exist there with **identical** sha256 (ORCH compared). Attic also
   has README.md, DIFF-SUMMARY.md, hooks/stop-verdict backup, and
   `server.mjs.spine-backup-20260730T211657Z` — leave all attic files alone.
3. agent-core HEAD is `a62e746` (rotate). Main checkout serves live symlinks —
   do not branch-switch it. Prefer writing evidence only under the evidence dir.
4. **Deleting attic/ or herdr-spine cc-hooks/ is OPERATOR-RESERVED. Never.**
5. Do not touch live non-bak `cli.mjs` / `server.mjs` / `lib.mjs` / hooks.
   Do not rewrite `board.jsonl` / ledger / pheromones / odometer.

## Parallel Work Notice

CORD tower (`w2Y:p1`) and other workspaces are live. Ignore unrelated board
topics and uncommitted work elsewhere. Concern yourself only with this brief.
Post claims/findings to Tower board topic `tower/w5-debris` (also note final on
`tower/fully-operational`). Read the board before claiming.

## Tower

- CLAIM first on `tower/w5-debris` with `from` = `agnt-w5-debris`.
- Findings at real checkpoints (inventory table landed; deletes finished) — no heartbeats.
- Do NOT `send_to_user`. Fleet mail only. ORCH collects.
- Stigmergy: claim pheromone `ph-msrp6pd5-y85r` (work-available on tower/w5-debris)
  via `pheromone_emit` scent `work-claimed` with `ref`, then `work-done` with same
  ref when finished. Evidence mandatory.
- Write `.done` last: `/Users/jrg/agent-core/briefs/tower/agnt-w5-debris.done`

## Tasks

1. **Backup list** — done when: file
   `/Users/jrg/agent-core/briefs/tower/w5-debris-evidence/00-bak-list-before.txt`
   contains the full `find` listing of live `.bak*` paths (absolute), one per line,
   captured BEFORE any delete.
2. **Inventory** — done when:
   `/Users/jrg/agent-core/briefs/tower/w5-debris-evidence/INVENTORY.md` is a
   markdown table with columns: live_path | size | sha256 | attic_path_or_NONE |
   verdict(REMOVE|KEEP-WITH-NOTE). Every live `.bak*` row present. Re-run
   `shasum -a 256` yourself; do not trust the ORCH table blindly.
3. **Act** — done when: for each REMOVE row, you re-compared live vs attic sha256
   in the same shell breath, then deleted ONLY the live `~/.tower/...` file.
   Unmatched rows: KEEP, write
   `/Users/jrg/agent-core/briefs/tower/w5-debris-evidence/KEEP-<basename>.NOTE`
   explaining why. Never delete attic files. Never delete unmatched bak.
4. **Post-check** — done when:
   `/Users/jrg/agent-core/briefs/tower/w5-debris-evidence/99-bak-list-after.txt`
   exists; live non-bak `cli.mjs`/`server.mjs`/`lib.mjs` still exist; attic file
   count unchanged from before (record counts in INVENTORY.md).
5. **Board + done** — done when: finding posted to `tower/w5-debris` with
   inventory summary + actions; `.done` written last.

## Constraints

- Touch ONLY: live `~/.tower/*.bak*` (deletes of matched only) and
  `/Users/jrg/agent-core/briefs/tower/w5-debris-evidence/**` plus
  `/Users/jrg/agent-core/briefs/tower/agnt-w5-debris.done`.
- If your cwd is a git worktree, still use the absolute evidence paths above
  (main tree). Do not commit. Do not push. Do not edit production JS/MD.
- Visible panes. No mocks. No emoji.

## Report back with

Full inventory table path, count REMOVE vs KEEP, residual live `.bak*` list
(should be empty if all matched), attic file count before/after, GO/NO-GO for W5
closeout from your seat (evidence-based).
