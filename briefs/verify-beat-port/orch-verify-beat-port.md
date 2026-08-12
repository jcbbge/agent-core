# ORCH verify-beat-port — port the Verify beat to spine-spawn (pi + claude kinds)

Model tier: cursor-shim defaults, no overrides (desk card, 2026-08-12). Do NOT use emojis anywhere.

Mission: the enforced Plan→Implementation wall (the Made Well Verify beat) lives only in `~/cursor-shim/cursor-spine` today. pi and claude fleets have profile discipline only — no enforcement. The operator has ruled the Verify beat is a Made Well feature that applies across the board, every harness. You own the port: make `~/herdr-spine/bin/spine-spawn … --kind pi` and `--kind claude` enforce the same beat — no forked test path → implementation spawn REFUSED; break-glass loud + audited to Tower. You run one inner cycle: Imagine (study) → Plan (design post) → Make (bifurcated implementation) → Verify (evidence below). Workers never commit; you integrate and commit; CORD gates independently.

## Operator law (binding context)

- **"IM AGNOSTIC BY DESIGN"** — nothing in any repo may codify a harness preference. The ported wall must be harness-agnostic in mechanism; only the agent-launch specifics are per-harness.
- Fleets are harness-homogeneous: the root spawn's harness defines every downstream agent.
- The Verify beat: the test agent is NOT the implementation agent; criteria come BEFORE code; bifurcated worktrees from the same plan; tester/arbiter; nQ ≤ 3.

## Pre-Verified Facts (CORD verified all of these personally, 2026-08-12 ~18:25 UTC, by reading the sources cited)

The cursor-shim wall (the reference implementation):

- `~/cursor-shim/cursor-spine:344-374` — the VERIFY GATE: a `coder` spawn is REFUSED unless `$VERIFY_DIR/<unit-key>/.authored` exists; refusal message names the fix and the law; break-glass `CURSOR_VERIFY_GATE=off` logs a loud warning AND appends a `verify-gate-bypass` row to `~/.tower/board.jsonl` (cursor-spine:356-359).
- `~/cursor-shim/cursor-spine:143-148` — unit key: `sha1(os.path.realpath(brief))[:16]`, so the same brief is the same unit from any cwd.
- `~/cursor-shim/cursor-spine:267-294` — `verify-mark <brief> [--criteria <file>]` writes the marker (+ optional criteria copy); `verify-status <brief>` exits 0/1.
- `~/cursor-shim/cursor-spine:376-386` — raw-path isolation: a `coder` spawn is ALWAYS forced into its own git worktree on every path (via cursor-agent's `--worktree` flag), lifted only by the same break-glass.
- `~/cursor-shim/cursor-fleet:217-263` — `make <slug> --brief <p>`: the sanctioned transition. Calls `verify-mark`, then spawns IMPLEMENTER (coder) ∥ TEST-MAKER in parallel, each with `--worktree`, from the SAME brief.
- `~/cursor-shim/docs/inner-loop-verify.md` — the standing order (four roles, divergence-is-the-point rationale, nQ=3 ceiling, exit gate). §3a documents the gate mechanics.
- The marker store `~/cursor-shim/.verify/` is shim-local by design (the shim is rippable) — do NOT reuse that path for the spine port.

The pi/claude path (where you are building):

- `~/herdr-spine/bin/spine-spawn` — Python 3, stdlib only, 685 lines. Modes: `orch`, `worker`, `fanout`, `prompt` (main() at :631-682; subparser wiring :633-666).
- `bin/spine-spawn:671-676` — `--kind cursor` is refused and routed to the cursor-shim. Stays. (Its module docstring lines 17-18 say "cursor CLI uninstalled" — stale since the 2026-08-11 shim reinstatement; you may correct that comment in passing, in partition.)
- `bin/spine-spawn:181-207` — `resolve_profile()`: `--profile name[:option]` resolves via `~/agent-core/primitives/profiles/profile-model` and prepends the profile prompt from `~/agent-core/primitives/profiles/<name>.md`. Profiles include `coder` (the implementer role).
- `bin/spine-spawn:439-471` — `spawn_into_pane()`: rename → stamps → profile resolution → `start_agent` → `verified_prompt`. This is the single choke point every spawn path (orch/worker/fanout) flows through — the analog of where cursor-spine mounts its gate.
- `bin/spine-spawn:296-345` — Tower ledger append pattern (`stamp_lineage`): direct JSONL append to `~/.tower/ledger.jsonl` with a mirrored id scheme; non-fatal on failure. Reuse this pattern for the break-glass audit row.
- `bin/spine-spawn:518-538,554-599` — `cmd_orch`/`cmd_worker`/`cmd_fanout`: all resolve briefs to abspaths before spawning; fanout hard-caps at 4 briefs.
- `herdr worktree create` exists (`herdr worktree --help`: list/create/open/remove — "Create and open a Git worktree"). Whether it is the right mechanic for coder isolation vs plain `git worktree add` is a design question YOU must resolve with evidence (see Task 1) — `create` may open a workspace, which is heavier than the wall needs.
- `spine-spawn` is invoked as `~/bin/spine-spawn` (symlink) or `python3 ~/herdr-spine/bin/spine-spawn`. NEVER via bun (bun parses the Python as JS and dies).
- Repo: `~/herdr-spine`, HEAD `4838882f7ff8881fd8476e5af39e2ec7302e46c3` at dispatch. Pre-existing untracked paths (`.future/`, `bin/spine-wave`, `briefs/cabinet/`, `research/*`) are not yours — never stage them.
- Contrived smoke briefs for cheap live spawn tests exist at `~/agent-core/briefs/fleet-smoke/`.
- Commit convention: `<type>(<scope>): <summary>` + PHASE/DONE/TODO/BLOCKED trailers + Co-Authored-By. Stage explicitly — never `git add -A`.

## CORD rulings (forks already decided — do not re-litigate)

1. **Gate trigger:** the wall keys on the implementer ROLE, exactly like cursor-spine keys on `coder`. In spine-spawn that is `--profile coder` (any `coder[:option]` spec). Spawns without `--profile`, or with non-implementer profiles, are not gated. If your study finds a second implementer-shaped path, name it in the design post and gate it too.
2. **Unit identity:** same algorithm as cursor-spine — sha1 of the brief's canonical path, first 16 hex chars. Same brief = same unit across harnesses.
3. **Marker store:** harness-neutral, NOT under `~/cursor-shim/`. Propose the exact location in your design post (a spine-owned dir such as `~/herdr-spine/.verify/` or a Tower-adjacent path are both acceptable; justify in one sentence).
4. **Break-glass:** a spine-named env var (e.g. `SPINE_VERIFY_GATE=off`), loud on stderr AND audited to Tower (ledger row, kind `verify-gate-bypass`, naming the brief + kind + pane). Default always ON.
5. **New surface:** add `verify-mark` / `verify-status` subcommands to spine-spawn (mirroring cursor-spine's contract), the coder gate at the choke point, forced worktree isolation for gated coder spawns, and a `make`-style bifurcation path (new subcommand or composition — your design call, but Done-when (b) requires a demonstrated bifurcation per kind).
6. **This mission's own implementation workers go through `cursor-fleet make`** (cursor-kind, per the operator's current harness choice) — the wall testing its own port is encouraged.

## Parallel Work Notice

U1 (ORCH spawn-doctrine-fix) is in flight in the SAME repo, owning `docs/spawn.md` only. Other live missions own `bin/handlers/` (tower-stigmergy), `bin/ctl-fleet*` (fleet-tasks), `~/agent-core/cli/` + registry + `primitives/` (cursor-parity), `~/.tower/`. DO NOT TOUCH any of those. Your partition: `bin/spine-spawn` + new sibling spawn-path files you create (e.g. `bin/spine-verify*` or docs you add under `docs/` other than spawn.md/ctl-fleet.md — name them in the design post). Ignore uncommitted changes outside your partition. Board: `herdr-spine/verify-beat-port` — read before claiming, prefix your posts `[U2]`.

## Tower (mid-run communication)

- CLAIM this unit on `herdr-spine/verify-beat-port` before spawning workers.
- The DESIGN POST (Task 2) is a hard gate artifact: one board post, then proceed unless CONCIERGE says hold.
- Post DONE as a board finding with commit sha + the full evidence block.
- Operator mail only for a genuine external fork.
- `.done` contract: workers write `~/agent-core/briefs/verify-beat-port/.done/agnt-u2-<name>.done`; you write `orch-u2.done` after your gate passes.

## Tasks

1. Study — done when: you have read cursor-spine (gate, verify-mark/status, forced worktree), cursor-fleet `make`, inner-loop-verify.md, and spine-spawn end-to-end, and resolved the worktree mechanic for pi/claude coders WITH evidence (run `herdr worktree create --help`/inspect its behavior vs `git worktree add`; pick the lightest mechanism that gives the coder a physically separate checkout).
2. Design post — done when: ONE post to `herdr-spine/verify-beat-port` (type=finding, prefix `[U2] DESIGN:`) covering: gate trigger, unit key, marker store path, break-glass name + audit row shape, worktree mechanic, new subcommand surface, file partition (every new file named), and the test plan for Done-when (a)/(b)/(c). Then proceed unless CONCIERGE posts hold.
3. Implement — done when: `spine-spawn … --kind pi --profile coder --brief <unmarked>` and `--kind claude` equivalent are REFUSED before any pane/agent is created, with a refusal message naming the fix and the law; `verify-mark`/`verify-status` work per the cursor-spine contract; a gated coder spawn is forced into an isolated checkout; break-glass lifts the gate loudly and audits to Tower. Implementation executed via `cursor-fleet make` (coder ∥ test-maker, separate worktrees); tester runs the suite; arbiter on red; nQ ≤ 3.
4. Evidence — done when ALL of these are on the board with real command + output captures: (a) an unwalled implementation spawn REFUSED for `--kind pi` AND for `--kind claude` (exit code + stderr shown); (b) a walled make-style spawn bifurcates for EACH kind (implementer ∥ test-maker from the same brief, separate checkouts — smoke briefs from `~/agent-core/briefs/fleet-smoke/` are the sanctioned cheap targets; if a kind's CLI cannot actually launch in this environment, that is a BLOCKER to report with the exact error, never something to fake); (c) break-glass run produces the loud warning AND the Tower audit row (row shown).
5. Gate + commit — done when: the diff touches only your partition; commit(s) per convention (PHASE: Implement); HEAD sha reported.

## Constraints

- spine-spawn stays Python 3 stdlib-only. Match its existing style (log() to stderr, JSON results on stdout, exit 0/1/2).
- The gate must fail BEFORE any herdr topology mutation (no orphan panes/tabs on refusal).
- Non-implementer spawns must be byte-for-byte behaviorally unchanged (the port is additive).
- Testing: NO MOCKS. Evidence = commands + outputs, run for real.
- Workers never commit. You integrate from the main checkout and commit.

## Report back with

- The design post text (as posted).
- Per-file diff summary including every file created (config/dotfiles included), full commit message(s), HEAD sha.
- The complete evidence block for Done-when (a)/(b)/(c): exact commands, exit codes, stderr/stdout tails, the Tower audit row.
- Deviations from this brief, with reasons.
- Provenance block: `date -u`; `pwd -P`; `git -C ~/herdr-spine rev-parse HEAD`.
