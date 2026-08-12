# ORCH brief — lever-1-herdr-kind: launch persistent tiers via `herdr agent start --kind cursor`

You are the ORCH for lever 1 of the cursor-shim program. You coordinate; spawn a
coder AGNT for the edits if you wish, but you own verification. **Do not commit.**
The CORD gates and commits.

## Worktree (edit ONLY here)

- Dir: `/Users/jrg/cursor-shim-lever-1-herdr-kind` (branch `lever-1-herdr-kind` — already checked out)
- Files you may touch: `cursor-spine`, `README.md`. NOTHING else.
- Keep the diff minimal and additive — `cursor-spine` is a shared hot file; other
  levers edit it too.

## Mission

Today `cursor-spine` launches every tier via `herdr pane run … bash run.sh` with
`cursor-agent -p` (headless). herdr therefore sees a shell command, not an agent —
no `agent_status`. Switch the PERSISTENT tiers (**coordinator, orchestrator,
coder**) to launch INTERACTIVE via `herdr agent start --kind cursor`, so the whole
herdr plane (CTRL/TOWR/statem/notify) sees them for free. Keep the existing `-p`
runner path for **researcher** (SAGT) and for `--headless`. Concierge stays on the
existing path (out of scope, minimal diff).

## Pre-verified facts (verified by CORD this session, 2026-08-11 — trust these)

1. **Detector is embedded** in the running herdr 0.8.0 binary:
   `~/source/herdr/src/detect/manifest.rs:245` → `("cursor", include_str!("manifests/cursor.toml"))`
   with rules for working/blocked/approval. `~/.config/herdr/agent-detection/`
   being empty is FINE (override dir, not the store). No detector install needed.
2. `herdr integration install cursor` was run by CORD (idempotent): installed the
   agent-state hook `~/.cursor/herdr-agent-state.sh` + hooks.json entry.
3. `herdr agent start <NAME> --kind cursor --pane <ID> [--timeout ms] -- [args]`
   — canonical exe `cursor-agent`; waits for interactive readiness (default 30s,
   max 300s); NAME must be lowercase-kebab and session-unique (`agent_name_taken`
   on collision); pane must sit at an interactive shell prompt (a freshly-split
   pane can race — retry once after ~2s on failure).
4. **Smoke test PASSED** (CORD, this session): split pane →
   `herdr agent start smoke-cursor-kind --kind cursor --pane <id> -- --force --trust --model auto`
   → returned `agent_status:"idle"`, `interactive_ready:true`, passthrough argv
   `["cursor-agent","--force","--trust","--model","auto"]` intact;
   `herdr pane get` showed `agent_status: idle`. Pane reaped.
5. `cursor-agent` interactive accepts the initial prompt as a positional arg:
   `cursor-agent [options] [prompt...]`; `--force`, `--trust`, `--model`,
   `--worktree` all valid in interactive mode. `-p` = headless print mode.
6. The detector keys on the interactive TUI's rendered strings — `-p` headless is
   invisible BY DESIGN. Persistent tiers must run interactive with `--force` so
   approvals never stall.
7. Existing shim behavior to preserve: profile prompt read, `profile-model get` →
   model map, role tokens + `report-metadata` + `pane rename` stamping,
   `tower_lineage`, `registry_add`, `--dry-run`, `reap`/`ps` subcommands,
   cleanup trap, `--into` semantics (caller owns the pane).

## Design (binding)

In `cursor-spine`, add an interactive launch branch selected when
`$BASE` ∈ {coordinator, orchestrator, coder} AND `--headless` is NOT set:

- Obtain the pane exactly as today (split / `--tab` / `--into`), stamp it exactly
  as today (rename, report-metadata, lineage, registry with mode `interactive`).
- Registration name: lowercase-kebab of the role label, made session-unique with a
  short pane-id suffix, e.g. label `ORCH orchestrator` → `orch-orchestrator-<pane>`
  (sanitize `:` → `-`). herdr rejects uppercase/spaces and duplicate names.
- Launch: `herdr agent start <name> --kind cursor --pane <pane> -- --force --trust --model "$MODEL"`
  plus `--worktree` when `--worktree` was passed. Deliver the instruction as the
  positional initial prompt (one argv element — spine invokes herdr with a real
  argv array, so no quoting mangling). If `agent start` fails on a fresh pane,
  wait ~2s and retry once before dying (and dying must still reap a pane we created).
- Interactive tiers never self-reap and never capture: no `run.sh`, no JOB_DIR
  wait loop — force KEEP semantics, print the async JSON result line with
  `"mode":"interactive"` and exit 0. The spawner (CORD/ORCH) owns reaping, as
  today for KEEP tiers.
- `--dry-run` must accurately describe the new mode per tier.
- Researcher and `--headless` keep the current `-p` runner path byte-for-byte.

In `README.md`: one line documenting the two launch modes (interactive
`herdr agent start --kind cursor` for persistent tiers; `-p` headless capture for
researcher/`--headless`).

## Done-when (ORCH reports these to CORD)

1. `bash -n cursor-spine` passes.
2. `./cursor-spine orchestrator --prompt _ --dry-run` shows the interactive
   `herdr agent start --kind cursor` launch; `./cursor-spine researcher --prompt _ --dry-run`
   (and `--headless`) still show the `-p` runner.
3. `git diff --stat` touches ONLY `cursor-spine` + `README.md`.
4. Report the exact line ranges changed (for the CORD's commit body) and paste
   dry-run output. End your final message with `ORCH-DONE`.

Do NOT run the live proof spawn — the CORD runs the done-condition at gate time.
