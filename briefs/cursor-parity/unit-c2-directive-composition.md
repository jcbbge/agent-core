# Unit C2 — Directive composition: canonical core + per-harness deltas (ORCH brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md` (read it first, including amended §7b). Operator ruling 3 of 2026-08-12 (~15:57 UTC) + operator confirmation (~16:05 UTC) ratified this design; the final concrete proposal is on board `agent-core/cursor-parity` (post t-msqa06wk-2st8) and is incorporated here.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-c2.done`.
> You orchestrate. SPAWN SUBSTRATE (operator correction §7b, supersedes all earlier spawn language): all spawns are kind=cursor via the cursor-shim — `~/cursor-shim/cursor-fleet worker <profile>[:opt] --brief <p>` for AGNTs, `cursor-fleet worker researcher --prompt` for SAGTs, `cursor-fleet fanout` for parallel workers. Shim DEFAULT profiles/models — NO model overrides. NEVER spine-spawn. The cli is a GIT SUBMODULE — commits land in `/Users/jrg/agent-core/cli` (its own repo). Outer-repo commits (primitives/) are gated by CORD — you stage and propose, CORD commits. Registry edits are serialized: board `claim` before editing `~/.agent-core/registry`.

## Operator rulings that bind this unit (verbatim authority)

3. "we have to maintain [CanonDirective.md] + [harness.md] because claude uses a claude.md file, and cursor and pi use agents.md." — RATIFIED interpretation: `primitives/AGENTS.md` remains the canonical core; per-harness delta files hold harness-specific languaging; the CLI composes core+delta at deploy time and writes each harness entrypoint as a real deployed file, replacing the symlinks. The registry scope rule "NEVER deploy to ~/.claude/CLAUDE.md" is VOID by operator override.
1. No symlinks anywhere the CLI manages — copies/ports only, drift detection via `agent-core status` checksums.

## Pre-verified facts (verified by CORD this session, 2026-08-12)

- All three entrypoints are symlinks to the canonical TODAY:
  `~/.claude/CLAUDE.md` → `primitives/AGENTS.md`; `~/.pi/agent/AGENTS.md` → same; `~/AGENTS.md` → same.
- `primitives/directives/` exists but is EMPTY — the delta files are net-new.
- The canonical `primitives/AGENTS.md` has a "Harness deltas" section (claude-code / pi / prime / cursor) — that content factors OUT into the delta files. The canonical is injected into eval-harness arms and is provider/model-agnostic BY CONTRACT: the factoring relocates bytes, it does not editorialize them.
- C1 (must be collected before you start — verify `briefs/cursor-parity/.done/unit-c1.done`) delivers: `harness cursor` profile, the port engine (`src/port.zig`) with transformed-bytes checksum semantics, and the symlink-is-stale rule. You CONSUME that engine; you do not rebuild it.
- Registry grammar has an unused `directives <dir>` profile field and a `directive/` primitive type prefix. The design adds ONE new profile field: `delta <path>` (schema addition authorized under ruling 4; already flagged on the board).
- Repo guide (`AGENTS.md`) currently states pi's `~/.pi/agent/AGENTS.md` is a symlink and inline rule injection through it is banned — that line becomes moot after this unit; the doc update is Unit D's job, NOT yours.

## Design (ratified — implement exactly this)

1. **Delta files** (new): `primitives/directives/claude-code.md`, `pi.md`, `cursor.md`. Content = the per-harness material factored out of the canonical's "Harness deltas" section, verbatim where possible. The canonical keeps everything provider-agnostic; its "Harness deltas" section is replaced by a pointer line ("Harness deltas live in primitives/directives/<harness>.md; deployed entrypoints are composed — edit sources, not deployed files").
2. **Registry**: add `delta <path>` to each harness profile (claude-code → primitives/directives/claude-code.md, etc.). ONE new primitive:
   ```
   primitive directive/core
     source primitives/AGENTS.md
     deploy claude-code ~/.claude/CLAUDE.md
     deploy pi ~/.pi/agent/AGENTS.md
     deploy cursor ~/AGENTS.md
   end
   ```
   Strike the voided "NEVER deploy to ~/.claude/CLAUDE.md" scope rule from registry comments, with a note citing the 2026-08-12 operator ruling.
3. **Composition** (in the C1 port engine): transform keyed on (directive, harness-with-delta): `composed = core bytes + banner + delta bytes`. Banner is exactly one generated line:
   `<!-- agent-core: composed from primitives/AGENTS.md + primitives/directives/<harness>.md — edit sources, not this file -->`
   No timestamps, no embedded hashes (checksum stability). `status`/`sync` checksum the COMPOSED bytes against the entrypoint dest — the C1 transformed-bytes invariant, so drift detection stays truthful.
4. **De-symlink**: the three entrypoint symlinks are replaced by composed real files via the C1 symlink-is-stale rule + scoped sync (below).

## Tasks

1. Verify `briefs/cursor-parity/.done/unit-c1.done` exists before touching anything. If absent, STOP and report to cord-agent-core — do not run concurrently with C1.
2. Board `claim` the registry edit. Make the registry changes (profile `delta` fields, `directive/core` primitive, strike the voided scope rule with citation).
3. Author the three delta files + factor the canonical (content-preserving). Post the before/after section structure of `primitives/AGENTS.md` to the board as a finding.
4. Implement the composition transform in the port engine + the `delta` profile field in the registry parser. This is an IMPLEMENTATION unit — per §7b it goes through `~/cursor-shim/cursor-fleet make <slug> --brief <p>`: the enforced Verify beat (bifurcated coder/test-maker worktrees from the same plan, tester, arbiter, nQ≤3). You write the plan/criteria the fork consumes; the coder never sees the tests, the test-maker never reads the code. House idiom the coder must match: Zig 0.16 `std.process.Init`, registry-arena allocations (see C1's code). Test criteria to hand the test-maker (derived from THIS design, not from code): composed output = core + banner + delta byte-exact; banner line exactly as specified; status shows ok when dest matches composed bytes, stale when it differs, stale when dest is a symlink; missing delta file = clear error, not a crash.
5. Scoped sync (clearance per mission §4): `agent-core sync --dry-run` first, post the preview to the board; then `agent-core sync directive/core` ONLY. Verify on disk: all three entrypoints are now REGULAR FILES, each = core + banner + its harness delta, byte-identical to a hand-composed reference (`cat primitives/AGENTS.md banner primitives/directives/<h>.md` comparison is acceptable evidence).
6. Verification (virgin-cache, provenance-stamped): `cd /Users/jrg/agent-core/cli && rm -rf .zig-cache zig-out && zig build` exit 0; `zig-out/bin/agent-core status` shows `directive/core` ok on all three harnesses, 0 stale 0 missing overall; post evidence (provenance: `date -u`, `pwd -P`, `git rev-parse HEAD` in submodule) to the board.
7. Commits: SUBMODULE commit(s) per the commit convention (PHASE/DONE/TODO trailers; stage explicitly). The primitives/ changes (canonical + delta files) are OUTER-REPO — stage them with `git add` of the exact paths and hand a proposed commit message to cord-agent-core in your report; CORD commits. The registry file is in neither repo — no commit for it.

## File partition

- You own: `/Users/jrg/agent-core/cli/` (submodule), `~/.agent-core/registry` (claim first), `primitives/AGENTS.md`, `primitives/directives/`.
- You never touch: other `primitives/` files, harness config files other than the three entrypoints via the CLI, `~/cursor-shim/`, `research/`, other briefs.
- Predecessor: C1 (collected). Parallel unit: C3 may spawn after you start — it owns commands/subagents/hooks registry lines and `src/port.zig` ADDITIONS for those types. Coordinate on the board if you both need the same cli file; prefer disjoint functions in `port.zig` and serialize registry claims.

## Doctrine constraints (bind you)

- Epistemics: no asserted fact without a this-session source; never invent config schemas.
- Never modify canonical primitives to fit a harness beyond the ratified factoring — adaptation lives in the port engine.
- Comms law `~/.tower/COMMS-ARCH.md`: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board; never to the operator; status is not mail.
- Topology: all spawns via `~/cursor-shim/cursor-fleet` with `--workspace w2B` (or `--dir`/`--pane` per the shim's own topology — each ORCH its own tab, workers as panes in that tab). Shim default profiles/models only.

## Done-when

1. Virgin-cache `zig build` exit 0; `agent-core status` shows `directive/core` ok on all three harnesses; 0 stale 0 missing overall.
2. All three entrypoints are composed regular files (no symlinks), byte-matching hand-composed references.
3. Canonical factored; three delta files on disk; before/after structure posted to the board.
4. Submodule commit(s) exist; outer-repo changes staged with a proposed commit message in your report; registry edit claimed-then-made with board trail; dry-run preview posted before sync.
5. Final report to cord-agent-core on the board; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-c2.done`.

## Report-back

Board post to `agent-core/cursor-parity`, from `orch-c2-directives`, addressed to cord-agent-core. Then the `.done` marker. You will be reaped on collection — durable state goes on disk and the board, never in scrollback.
