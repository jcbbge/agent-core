# AGNT U1 — rewrite docs/spawn.md Spawn-path doctrine (corrected law)

Model tier: cursor-shim defaults, no overrides. Do NOT use emojis anywhere.

Mission: In `~/herdr-spine`, rewrite `docs/spawn.md` §Spawn-path doctrine so it
carries the operator's actual law. Commit `63e1010` wrongly framed cursor-shim
as universal fleet spawn law; this unit corrects that framing only. Topology
(Engine Shop / task workspaces, commit `7778575`) stays untouched. Docs-only.
Workers never commit — ORCH integrates and commits from the main checkout.

## Pre-Verified Facts (ORCH verified all of these personally, 2026-08-12)

- Repo: `~/herdr-spine`, HEAD `4838882f7ff8881fd8476e5af39e2ec7302e46c3`.
  Working tree has only pre-existing untracked paths (`.future/`,
  `bin/spine-wave`, `briefs/cabinet/`, `research/*`) — ignore them; never
  stage them. Ignore any uncommitted changes under `bin/` (U2 owns those).
- `docs/spawn.md` line 21 stale comment:
  `# Fleet work: --kind pi superseded — see §Spawn-path doctrine (cursor-shim).`
- `docs/spawn.md` lines 129–164 are `## Spawn-path doctrine` (incl.
  `### Prior art: CTRL/TOWR singletons` and
  `### Structural delta (gap to reconcile)`). Wrong framing to replace:
  "All NEW fleet spawns are kind=cursor via the cursor-shim" and
  "`~/bin/spine-spawn --kind pi --profile …` is superseded for fleet work".
- `docs/spawn.md` lines 207–208 acceptance-evidence bullet ends
  `(historical; superseded for fleet work — see §Spawn-path doctrine)` —
  must be reframed as historical evidence for the pi path, not superseded.
- Independent ORCH grep of `docs/ctl-fleet.md` for
  `cursor|spawn-path|superseded`: zero matches (exit 1). Do NOT amend
  ctl-fleet.md unless your own re-run finds a hit; report the result either way.
- `bin/spine-spawn` lines 671–676 refuse `--kind cursor` and route to
  cursor-shim ("spine-spawn owns pi/claude kinds only"). CORRECT under the
  new law — partition boundary between per-harness paths, not a harness
  preference. Document it; do not touch `bin/`.
- Shim default model table (current lines 140–146) is cursor-shim house
  config only — may be cited as the shim's own defaults, never as fleet-wide
  doctrine.
- Operator law (bind exactly; keep quoted strings verbatim):
  - **"IM AGNOSTIC BY DESIGN"** — provider/model/harness/platform/vendor-
    agnostic; nothing in any repo may codify a harness preference.
  - Harness selection is an **operator intake decision per mission/session,
    cost-determined** (operator: pi for personal projects, claude-code for
    client projects, cursor currently for subscription subsidization,
    possibly an API gateway like openrouter later — "effectively this is a
    cost determined situation").
  - **Fleets are harness-homogeneous:** root spawn's harness defines every
    downstream agent. pi root → pi fleet. claude-code root → claude fleet.
    cursor root → cursor fleet.
  - pi's sole distinction: open-source + inference-gateway capable.
  - Per-harness spawn paths: `spine-spawn --kind pi|claude` and
    `cursor-fleet` / `cursor-spine` for cursor.
  - Preserve §Structural delta content (operator tab2=ORCH / tab3=workers
    law vs shim per-ORCH-tab gap) — topology, not spawn-path framing.
  - §Prior art may stay if consistent with corrected framing.

## Parallel Work Notice

U2 (ORCH verify-beat-port) owns `bin/spine-spawn` + new sibling spawn-path
files in the SAME repo; it will not touch `docs/`. Ignore uncommitted
`bin/` changes — do not investigate, revert, or fix. Other missions own
`bin/handlers/`, `bin/ctl-fleet*`, and `~/agent-core/` — not yours. Board:
`herdr-spine/verify-beat-port` (prefix findings `[U1]`); history on
`herdr-spine/topology-doctrine`.

## Tower (mid-run communication)

- Post CLAIM first on topic `herdr-spine/verify-beat-port` (prefix `[U1]`),
  then findings during, `.done` last.
- Harnesses with Tower MCP: `board_post` / `board_read`. Else append one
  JSONL line to `~/.tower/board.jsonl` with `cwd` = real repo cwd and
  topic `herdr-spine/verify-beat-port`.
- On Herdr: `spine-report task "..."` at start, `spine-report verdict "..."`
  when done.
- `.done` marker (coder): write
  `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-coder.done` when your
  edit is complete (not before).
- `.done` marker (test-maker): write
  `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-test-maker.done` when
  the acceptance-check artifact is written.
- Do NOT commit. Do NOT touch files outside your partition.

## Tasks

### For the Implementer (coder) — edit docs only

1. Rewrite `docs/spawn.md` `## Spawn-path doctrine` (currently lines 129–164)
   so the section states ALL of:
   (a) fleets are harness-homogeneous (root spawn's harness defines every
       downstream agent; include pi / claude-code / cursor examples);
   (b) per-harness spawn paths are `spine-spawn --kind pi|claude` and
       `cursor-fleet`/`cursor-spine` for cursor;
   (c) harness choice is the operator's per-mission intake decision, driven
       by cost;
   (d) pi's sole distinction is open-source + inference-gateway capable;
   (e) the agnostic-by-design principle (no repo may codify a harness
       preference) — keep the operator quote **"IM AGNOSTIC BY DESIGN"**
       exact inside quotation marks;
   (f) the `spine-spawn` cursor-refusal (`bin/spine-spawn` 671–676)
       documented as the partition boundary between per-harness paths;
   (g) §Structural delta content preserved (operator tab2=ORCH/tab3=workers
       vs shim per-ORCH-tab gap).
   Done when: all seven points (a–g) are present in the rewritten section;
   wrong universal-cursor framing is gone; topology content outside this
   section is untouched.
2. Fix line ~21 comment — done when it no longer says `--kind pi` is
   superseded (it is a live per-harness path). Suggested framing: comment
   that points at §Spawn-path doctrine for per-harness paths, without
   calling any path superseded.
3. Fix lines ~207–208 acceptance-evidence note — done when it no longer
   frames pi as superseded; reframe as historical evidence for the pi path.
4. Grep self-check before reporting — run:
   `rg -n -i 'superseded|THE (fleet )?spawn path|cursor-shim is' docs/spawn.md`
   Done when: nothing in the output frames one harness as universal law.
   Include the full grep output in the report.
5. Re-run ctl-fleet grep:
   `rg -n -i 'cursor|spawn-path|superseded' docs/ctl-fleet.md`
   Done when: report includes exit code + output; amend ctl-fleet.md ONLY
   if this grep finds a hit that frames harness preference (ORCH already
   saw zero — expect zero).

### For the Test-Maker — acceptance checks from this brief ONLY

Do NOT read the implementation. Author a shell acceptance script (or
checklist of exact commands + expected outcomes) derived solely from this
brief's done-when criteria. Place it at:
`~/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh`
(create `qa/` if needed). The script must exit nonzero on any failure and
cover at minimum:
- Presence of harness-homogeneous language + pi/claude/cursor examples.
- Presence of both spawn-path families (`spine-spawn --kind pi|claude` and
  `cursor-fleet`/`cursor-spine`).
- Presence of cost-determined / operator intake language.
- Presence of open-source + inference-gateway for pi.
- Presence of agnostic-by-design / no harness preference (and the exact
  quote if asserted).
- Presence of spine-spawn cursor-refusal / partition-boundary language.
- Presence of Structural delta / tab2-ORCH / tab3-workers content.
- Absence of framing that one harness is THE universal fleet spawn path
  (the rg in task 4 must be clean of universal-law framing).
- Line ~21 and ~207–208 no longer say `--kind pi` is superseded for fleet
  work.
- Diff touches only `docs/spawn.md` (and ctl-fleet.md only if justified).

## Constraints

- Touch ONLY: `docs/spawn.md` (conditionally `docs/ctl-fleet.md` if your
  grep justifies it). Do not commit.
- Do not delete verified-recipes or topology content; surgical correction
  of spawn-path framing only.
- Keep operator verbatim quotes exact inside quotation marks.
- Work from your assigned worktree; ORCH will integrate to main.
- Testing: NO MOCKS. Verification commands are the greps and the
  acceptance script above, run against the edited file.

## Report back with

- Per-file diff summary (lines +/-) for every file you created or modified,
  including any qa/config/dotfiles.
- Full output of the task-3/4 rg over `docs/spawn.md`.
- Full output + exit code of the ctl-fleet.md grep.
- Confirmation you did not commit.
- Path of `.done` marker written.
- Any deviation from this brief, with reasons.
- Provenance: `date -u`; `pwd -P`; `git rev-parse HEAD` (worktree).
