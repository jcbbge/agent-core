# ORCH tower-dryrun — dry-run gate for 50-scent-digest + closed-loop live demo

> From: CORD tower-stigmergy (w2G:p1). Binding. Self-contained.
> Board topic: `constellation-zg/tower-stigmergy`. Post from ~/herdr-spine (real repo cwd).
> Markers: `~/agent-core/briefs/tower-stigmergy/.done/impl-dryrun.done` (phase A) and `impl-live.done` (phase B).
> You own the inner loop. Workers never commit — YOU gate. Commits in herdr-spine per convention (`<type>(<scope>): <summary>` + PHASE/DONE/TODO trailers, explicit paths, never `git add -A`).

## 0. Context (what already exists — do not rebuild)

The stigmergic Tower shipped earlier today: `~/.tower/pheromones.jsonl` stream + `bun ~/.tower/cli.mjs emit|field|scan` + MCP tools (agent-core `7fe23dd`); COMMS-ARCH Amendment A1; and the handler `~/herdr-spine/bin/handlers/50-scent-digest` (herdr-spine `248a35e`, tests `bin/handlers/tests/test_50_scent_digest.py` 9/9). The handler works but went LIVE without the design-mandated dry-run phase, and the first e2e never showed a prompted agent picking up the work. This mission closes those two gaps. The operator's order (18:42 UTC): DRY-RUN LOGGING FIRST, dry-run artifacts + the live cutover decision posted to the board BEFORE going live, then a live demonstration that the loop closes.

## 1. Partition law

YOU OWN: `~/herdr-spine/bin/handlers/50-scent-digest` (edit) + `~/herdr-spine/bin/handlers/tests/` (test additions).
YOU DO NOT TOUCH: `bin/spine-spawn` (verify-beat-port mission), `bin/ctl-fleet*` (fleet-tasks mission), any other handler, `~/.tower` code files, constellation-zg `src/`, harness configs, running panes. The ONLY `~/.tower` touch in this mission is the CORD creating the live flag at cutover — never you.

## 2. Pre-verified facts (CORD, this session — cite, don't rediscover)

- Handler `50-scent-digest` (read it first): dispatcher contract one-shot per `pane.agent_status_changed`, 5s budget, exit 0 on all failures. Fires only on `status=="idle"` (:164). Prompt block at :216-227: pacing via `prompt_allowed` (:72-82, 60s/pane, state `PACE_PATH` env-overridable via `SPINE_SCENT_DIGEST_PACE_PATH`), then `sc.verified_prompt(pane_id, format_digest(matches))`, outcome ∈ prompted/prompt-failed/paced-out, board note always (:229-232) to topic `herdr-spine/scent-digest` via `board_note()` (:149-151). Field read shells out to `bun ~/.tower/cli.mjs field --json` with the pane's cwd (:85-99, env override `SCENT_DIGEST_CLI`).
- Flag-file convention precedent: `40-tower-bridge:383` — `os.path.exists(os.path.expanduser("~/.tower/bridge-fabricate-done"))`, contents ignored.
- Tests: `bin/handlers/tests/test_50_scent_digest.py` — python3, subprocess-drives the handler with synthetic `HERDR_PLUGIN_EVENT_JSON` + fixture CLI + temp pace path. 9 tests, `python3 bin/handlers/tests/test_50_scent_digest.py` exits 0.
- Shim mechanics: `cursor-fleet worker <test-maker|tester|coder> --brief <p> --dir ~/herdr-spine` (interactive, spawner-reaped). coder is REFUSED without `cursor-spine verify-mark <brief>`; herdr-spine IS a git repo so `cursor-fleet make <slug> --brief <p>` (parallel coder+test-maker, separate worktrees) is the sanctioned path for the code unit.
- Demo worker vehicle (phase B): `cursor-fleet worker tester --brief <p> --dir ~/herdr-spine` — interactive tier (KEEP=1, spawner-reaped, NO self-reap race), role token stamped `3-AGNT` (cursor-spine default for non-mapped profiles).
- `16-parent-wake` will wake your pane when your workers flip done/idle — expected, harmless.
- `~/.tower/pheromones.jsonl` is append-only — never rewrite/delete rows; new demo rows simply append.

## 3. PHASE A — dry-run gate + artifacts → `.done/impl-dryrun.done`

### A1. Code (via `cursor-fleet make`, slug `scent-digest-dryrun`)

Edit `50-scent-digest`:
- Add near PACE_PATH: `LIVE_PATH = os.environ.get("SPINE_SCENT_DIGEST_LIVE_PATH") or os.path.expanduser("~/.tower/scent-digest-live")`.
- Gate the prompt block: when `LIVE_PATH` does NOT exist → do NOT touch pace state, do NOT prompt; board note with outcome `dry-run` whose body lists the matched pheromone ids and the would-be recipient, e.g. `pane <name> (<pane_id>): N open match(es); dry-run (would prompt: ph-…, ph-…)`. Log likewise. When the flag EXISTS → current behavior unchanged (pace → verified_prompt → outcome).
- Update the module docstring: one paragraph on the dry-run gate (flag path, default dry-run, env override).
- Tests (+2 minimum): (a) flag absent → no prompt issued, board note carries `dry-run`, pace state untouched; (b) flag present (temp path via `SPINE_SCENT_DIGEST_LIVE_PATH`) → prompt path taken exactly as today. All 11+ tests green; the existing 9 must not change meaning.

### A2. Dry-run artifacts (real, not synthetic)

With the flag absent (verify: `ls ~/.tower/scent-digest-live` → absent):
1. From ~/herdr-spine: `bun ~/.tower/cli.mjs emit work-available constellation-zg/tower-stigmergy <payload> --to-role SAGT --evidence <path>` (payload = a real file, e.g. the design doc path).
2. Spawn a one-shot: `cursor-fleet worker researcher --prompt "<trivial question>" --headless` — its idle/done flip is a REAL event-edge firing. The handler (dry-run) must append a `dry-run` board note on `herdr-spine/scent-digest` naming the pheromone id.
3. Repeat once (second artifact, different pane). If a natural fleet idle-flip produces a dry-run note in the window, that counts too.
4. Post the artifacts to `constellation-zg/tower-stigmergy`: the exact commands, the emitted ids, and the verbatim board-note rows (grep `"herdr-spine/scent-digest"` ~/.tower/board.jsonl).

**Phase A done-when:** commit landed (explicit paths: the handler + test file), tests green (reproduced by you), ≥2 real dry-run artifacts posted, `impl-dryrun.done` written. Then GO IDLE and await the CORD's cutover go (a prompt into your pane). Do not create the live flag yourself.

## 4. PHASE B — live closed-loop demo → `.done/impl-live.done` (only on CORD's go)

The CORD will post the cutover decision to the board and create `~/.tower/scent-digest-live`. On the go prompt:

1. Verify the flag exists. Emit from ~/herdr-spine: `bun ~/.tower/cli.mjs emit work-available constellation-zg/tower-stigmergy <payload> --to-pane <DEMO_PANE> --evidence <path>` — but you need the pane id first, so: spawn the demo worker FIRST with a brief that makes it WAIT (see below), capture its pane id, THEN emit routed `to_pane`.
2. Demo worker: `cursor-fleet worker tester --brief <demo brief> --dir ~/herdr-spine`. Its brief: "You are the stigmergy demo worker. A Tower field digest prompt may arrive in this pane naming open work with an exact claim command. When it does: run the claim command verbatim from ~/herdr-spine, then run `bun ~/.tower/cli.mjs emit work-done <topic> <payload_ref> --ref <id> --evidence <path>`, then state done. If no digest has arrived, wait quietly." (Interactive tier — it will idle, receive the prompt, and act. No self-reap race.)
3. The worker's idle flip after reading its brief fires the LIVE digest → `verified_prompt` lands → the WORKER claims and completes. Collect: the digest board note (outcome `prompted`), the worker's claim/done rows in `~/.tower/pheromones.jsonl`, `field`/`scan` output showing the pheromone done.
4. If the idle flip fires before your emit lands (race), re-prompt the worker ("check the field") to force a second flip — pacing is 60s/pane, wait it out.
5. Post the FULL chain to `constellation-zg/tower-stigmergy`: every command + its output, the digest note row, the pheromone rows, the final field state.

**Phase B done-when:** the loop is demonstrably closed — the prompted agent (not you) emitted the `work-claimed` and `work-done` rows; commands + outputs on the board; `impl-live.done` written; demo worker reaped; final report posted; then `cursor-spine reap --done` and go idle for CORD collection.

## 5. Comms

- Findings: `constellation-zg/tower-stigmergy`, from `orch-tower-dryrun`, cwd ~/herdr-spine.
- No operator mail. Questions to me: board note tagged `Q:` on this topic (nQ budget 3).
- Provenance on evidence posts: `date -u`, `pwd -P`, and for the handler edit the herdr-spine commit hash.
