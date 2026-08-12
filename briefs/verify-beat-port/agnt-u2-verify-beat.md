# AGNT verify-beat-port — port Made Well Verify beat into spine-spawn

Repo: `/Users/jrg/herdr-spine`. Stack: Python 3 stdlib-only `bin/spine-spawn`. Port the Plan→Implementation wall from `~/cursor-shim/cursor-spine` so `--kind pi` and `--kind claude` refuse unmarked coder spawns, force worktree isolation, expose verify-mark/status/make, and audit break-glass to Tower. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-12)

- Reference gate: `~/cursor-shim/cursor-spine:344-386` (VERIFY GATE + forced `--worktree` for coder); verify-mark/status at `:267-294`; unit key `:143-148` = `sha1(realpath(brief))[:16]`.
- Reference make: `~/cursor-shim/cursor-fleet:217-265` — verify-mark then IMPLEMENTER ∥ TEST-MAKER, each `--worktree`.
- Standing order: `~/cursor-shim/docs/inner-loop-verify.md` §3a.
- Target: `~/herdr-spine/bin/spine-spawn` (685 lines, stdlib only). Choke point historically `spawn_into_pane` `:439-471`, but gate MUST run BEFORE `create_tab`/`split_pane` (fail-before-topology). Modes: orch/worker/fanout/prompt; main `:631-682`.
- `--kind cursor` refuse stays (`:671-676`). Module docstring lines 17-18 say "cursor CLI uninstalled" — stale; correct in passing.
- `resolve_profile()` `:181-207` — `--profile name[:option]`; implementer role is `coder`.
- Tower ledger append pattern: `stamp_lineage` `:296-345` → `~/.tower/ledger.jsonl`. Reuse for `verify-gate-bypass`.
- Worktree evidence: `herdr worktree create` = create AND open a herdr workspace (`herdr worktree create --help`; `~/source/herdr/src/cli/worktree.rs`; api opens workspace). Too heavy. Use plain `git worktree add` + existing `--cwd`.
- agent-core profiles have NO `test-maker.md` (only concierge/coordinator/orchestrator/coder/researcher). Spine `make` test side is ungated (no `--profile coder`).
- Partition: ONLY `bin/spine-spawn`, new `docs/verify-beat.md`, and `.gitignore` entries for `.verify/` if needed. NEVER touch `docs/spawn.md`, `docs/ctl-fleet.md`, `bin/handlers/`, `bin/ctl-fleet*`, agent-core sources, `~/.tower/` configs.
- Untracked pre-existing (ignore): `.future/`, `bin/spine-wave`, `briefs/cabinet/`, `research/*`.
- Invoke as `python3 ~/herdr-spine/bin/spine-spawn` or `~/bin/spine-spawn` — NEVER bun.
- DESIGN locked on board `herdr-spine/verify-beat-port` `[U2] DESIGN` (proceeded; no CONCIERGE hold).

## Locked design (do not re-litigate)

1. Gate trigger: profile base == `coder` (any `coder[:option]`).
2. Unit key: `hashlib.sha1(os.path.realpath(brief).encode()).hexdigest()[:16]`.
3. Marker store: `~/herdr-spine/.verify/<key>/.authored` (+ optional `criteria.md` copy).
4. Break-glass: `SPINE_VERIFY_GATE=off` — loud stderr WARN + append ledger row `kind=verify-gate-bypass`, fields: id, ts, via=`spine-spawn`, brief, kind (agent kind), pane (`HERDR_PANE_ID`), profile. Default ON.
5. Forced isolation: when gating coder and gate not bypassed, `git worktree add` under `~/.spine/worktrees/<repo>/<slug>/` on branch `spine/<slug>`, set `args.cwd` to that path before topology. Lifted only by same break-glass.
6. Subcommands: `verify-mark <brief> [--criteria <file>]`, `verify-status <brief>` (exit 0/1), `make <slug> --kind <k> --brief <p> [--pane] [--cwd] [--workspace] [--direction]` — mark then bifurcate coder∥test-maker (labels `agnt-<slug>` / `agnt-<slug>-test`), separate worktrees, same brief. Test-maker: NO `--profile coder`.
7. Refusal message must name fix (`spine-spawn make <slug> --kind <k> --brief …` or `verify-mark` after independent test path) and law: test agent is NOT the implementation agent; criteria BEFORE code.
8. Coder without `--brief` REFUSED (no unit to gate).
9. Non-coder spawns byte-for-byte behaviorally unchanged.
10. Style: `log()` stderr, JSON stdout, exit 0/1/2.

## Parallel Work Notice

U1 owns `docs/spawn.md` only. Others own `bin/handlers/`, `bin/ctl-fleet*`, agent-core, `~/.tower/`. Ignore uncommitted changes outside your partition. Board topic `herdr-spine/verify-beat-port` — read before claiming; prefix posts `[U2]`.

## Tower (mid-run communication)

- CLAIM on `herdr-spine/verify-beat-port` first (`board_post` type=claim, from your role).
- Findings during work; no operator mail.
- `.done` last: Implementer writes `~/agent-core/briefs/verify-beat-port/.done/agnt-u2-implementer.done`; Test-Maker writes `…/agnt-u2-test-maker.done`.
- Workers NEVER commit.

## Tasks

### For the Implementer (coder profile — this half of the brief)

1. Implement verify-mark / verify-status / make / gate / forced worktree / break-glass audit / docs/verify-beat.md / docstring fix / .gitignore as locked above — done when: unmarked `worker --kind pi --profile coder --brief <unmarked>` and `--kind claude` equivalent refuse BEFORE pane create; verify-mark/status work; make bifurcates; break-glass warns + ledger row; `docs/verify-beat.md` exists summarizing the spine wall.
2. Report back paths changed + how to reproduce gate refuse — done when: `.done` file lists changed paths and sample commands.

### For the Test-Maker (test-maker profile — this half of the brief)

1. From THIS PLAN ONLY (do not read `bin/spine-spawn` implementation), author an executable acceptance suite at `~/agent-core/briefs/verify-beat-port/qa/u2-verify-beat-checks.sh` covering Done-when (a)/(b)/(c) shapes: unmarked coder refuse for pi+claude; verify-mark then status 0; make creates two distinct cwd checkouts (may smoke with `--dry` topology checks if full agent launch is heavy — but prefer real refuse evidence); break-glass warns + ledger grep. Suite must be runnable with `bash u2-verify-beat-checks.sh` from any cwd, using absolute paths — done when: script exists, is executable, documents expected exit codes, and does not import or scrape implementation source for expected strings beyond the public CLI contract in this brief.
2. Write `.done` with the suite path and what each check asserts.

## Constraints

- Touch ONLY the partition listed above (implementer). Test-maker touches ONLY `qa/u2-verify-beat-checks.sh` (+ own `.done`).
- No mocks. No commits.
- spine-spawn stays Python 3 stdlib-only.
- Gate fails before any herdr topology mutation.

## Report back with

- Changed file list (implementer) or suite path (test-maker).
- How you verified locally (commands + exit codes).
- Deviations + reasons.
- Provenance: `date -u`; `pwd -P`; `git rev-parse HEAD` (worktree HEAD ok).
