# Report: agnt-skill-writer — herdr SKILL.md rewrite

Pane: `w1A:p0` (registration `agnt-skill-writer`, display `AGNT rewrite herdr skill`), spawned by `orch-skill-audit` at `w1A:pZ`. File touched: `~/.claude/skills/herdr/SKILL.md` only (413 → 350 lines). `metadata.version` bumped `1.1` → `1.2`.

## KEPT (integrated, not discarded)

- Sandbox policy, `HERDR_ENV=1` gate, `herdr api snapshot` verify-once step.
- Session targeting (`--session` / `HERDR_SOCKET_PATH` vs `HERDR_SESSION`), re-verified live (see VERIFIED below).
- IDs/current-context section (colon-splitting, `--current`, no-birth-timestamp rule).
- Agent status semantics (idle vs done, corroborate non-busy readings).
- The spawn loop, the VERIFIED-SUBMIT hard rule (2026-07-27) and its Pasted-text fallback.
- Husk doctrine / restart-liveness classification (`missing`/`dead`/`alive`/`unreadable`).
- The coordinated fan-out contract (brief-on-disk, disjoint partitions, panes-not-subagents, pgrep liveness, gate).
- Signal-over-polling (`events.subscribe`, subscribe-then-snapshot ordering), `notification.show`.
- Safety and coordination rules (unchanged in substance).

## REWROTE

- **Frontmatter `description`**: was "fut(ure) is this machine's multiplexer; Herdr is a tool available for legacy and hosted operations" — contradicted `control-flow.md` §Substrate ("herdr is THE substrate... use, leverage, optimize, extend it in every way possible", dated 2026-08-10, the newer/operator-law doc). Reconciled toward control-flow.md; kept the useful mechanics (`HERDR_ENV=1`, when to invoke).
- **Topology section** ("Coordinator > Orchestrator > Agents") — replaced with the real `CORD>ORCH>AGNT/SAGT` (+`CTRL`/`TOWR`) hierarchy from control-flow.md, with the naming table and lowercase-kebab registration rule.
- **"Composition with Tower" pointer to `tower-orchestration.md` as "the message bus"** — replaced throughout with COMMS-ARCH.md as the comms law (verified `tower-orchestration.md` still exists on disk at `~/agent-core/primitives/rules/tower-orchestration.md`, but control-flow.md §Communications now explicitly defers to COMMS-ARCH.md).
- **Version stamps**: all restated 0.8.0 claims re-verified live this session (`herdr --version`, `herdr agent start --help`, `herdr pane split/read/run/report-metadata/prompt/wait --help`, `herdr tab rename --help`). `HERDR_SESSION` non-routing behavior re-verified live (see VERIFIED).
- **The plugin-agent-view-reapplied-by-spine-startup claim** — was flatly wrong at 0.8.0, not just stale. Read `~/herdr-spine/bin/spine-startup` (header: "DEPRECATED 2026-08-09. NOT A LIVE CODE PATH... herdr NEVER RUNS THIS") and `~/herdr-spine/bin/handlers/15-restore-view` (the actual live mechanism: reapplies `agent.view.set` on every `pane.agent_status_changed` event, not on server start). Rewrote under "Restart and liveness" with the corrected mechanism and both source files cited.

## ADDED (brief form + pointer only)

- **Canonical docs table** near the top (control-flow.md, COMMS-ARCH.md, spawn.md, ctl-fleet.md, statem README, herdr-RETROFIT-MAP.md) with what each owns.
- **Hierarchy and naming** section: prefix table incl. `CTRL`/`TOWR`, lowercase-kebab registration, rename-before-start rule → control-flow.md.
- **The stamping mandate**: human work name at birth, all four carriers (`agent start`, `report-metadata --display-agent`, `pane rename`, `--token name=`), `--token task=`/`--token role=`, the restart-token-death trap → spawn.md.
- **Reaping** section, verbatim-equivalent to control-flow.md §Reaping.
- **spine-spawn** as the preferred wrapper (modes, 4-brief fanout cap, `-- --model` passthrough) plus **the spine-spawn gap** interim per-worker re-stamp command, from spawn.md §The spine-spawn gap.
- **Observability infra** section: `ctl-fleet` (spawn command, `--spawn` placement as a tab-1 split, machine vs `--project` plane), `twr.ts` (one per project, what it renders), `statem.ts` (state derivation, board rows, glyph-only tab titles, mapping file) — launch commands taken verbatim from ctl-fleet.md and the statem README.
- **Comms rules that bind every agent**: COMMS-ARCH's one rule, four planes, status-is-not-mail/status-is-not-a-toast, notification rubric, `<project-slug>/<topic>` namespacing + bare-topic exception, board_post's real-cwd requirement.

## Path claims re-verified

- "skills live in `~/agent-core/primitives/skills/`" — `ls`'d this session; confirmed, and `herdr/` subdir exists there. Kept.

## UNKNOWN / not independently verified this session

- `HERDR_SOCKET_PATH` being the authoritative route "inside plugin context, where herdr injects it" — I did not run inside a herdr-spine handler process this session to observe the injected env directly. I corroborated it via `grep` over `~/herdr-spine/bin/{spine-wormhole,spine-watch,spine-greeting}`, which all document and consume `HERDR_SOCKET_PATH` from the environment herdr injects. Treated as verified-by-source-reading, cited as such in the file (not left as a bare carryover claim).
- Nothing else in the rewrite rests on an unverified claim; anything I could not confirm on disk or live this session was cut rather than restated (e.g. I did not keep the old file's unqualified "0.7.5" stamps — every version-specific claim retained is now either re-verified at 0.8.0 or explicitly tagged with its original verification date where the behavior is not version-sensitive, e.g. the 2026-07-27/2026-07-23 dated hard rules).

## Length

Final line count: **350** (brief's guidance: aim for roughly current length, do not balloon past ~320; original was 413). I made two compression passes cutting ~180 lines of duplicated/verbose prose while adding all five mandated new sections; 350 is the result after trimming as far as I could without cutting operationally load-bearing content the brief explicitly said to keep (the verify-submit hard rule, the fan-out contract, husk classification, the full four-carrier stamping mandate). Trading ~30 lines over the soft cap for keeping that content intact seemed the correct call given the brief's own tension between "keep the hard-won operational content" and "~320 lines" — flagging this trade-off explicitly rather than silently exceeding the cap.

## VERIFIED this session (commands run)

`herdr --version` → `0.8.0`; `herdr --help`; `herdr agent --help` + `herdr agent start --help`; `herdr pane --help` + `split/read/run/report-metadata/prompt/wait/send-keys --help`; `herdr tab rename --help`; `herdr api snapshot | head`; `herdr workspace list` vs `HERDR_SESSION=nonexistent-probe-session herdr workspace list` (identical output, confirming `HERDR_SESSION` is still not routing authority at 0.8.0); `ls ~/agent-core/primitives/skills/` and `ls -d .../herdr`; `ls ~/agent-core/primitives/rules/` (confirmed `tower-orchestration.md` still present, `control-flow.md` present); `grep` over control-flow.md/COMMS-ARCH.md for the tower-orchestration reference; `grep -rn "spine-startup|agent.view.set"` over `~/herdr-spine/bin/`; full reads of `~/herdr-spine/bin/spine-startup` and `~/herdr-spine/bin/handlers/15-restore-view`; `grep -rn HERDR_SOCKET_PATH ~/herdr-spine/bin/`.
