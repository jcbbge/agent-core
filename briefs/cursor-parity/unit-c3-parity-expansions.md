# Unit C3 — Parity expansions: commands, subagents, hooks coverage (ORCH brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md` (read it first, including amended §7b). Operator ruling 4 (full-parity mandate, ~15:57 UTC) + Unit A escalation candidates are incorporated here.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-c3.done`.
> SPAWN SUBSTRATE (§7b): all spawns kind=cursor via `~/cursor-shim/cursor-fleet` — `worker <profile>[:opt]` for AGNTs, `fanout` for parallel workers. Shim DEFAULT profiles/models, NO overrides. NEVER spine-spawn. ALL implementation goes through `cursor-fleet make <slug> --brief <p>` (enforced Verify beat: bifurcated coder/test-maker worktrees, tester, arbiter, nQ≤3).
> The cli is a GIT SUBMODULE — commits land in `/Users/jrg/agent-core/cli`. Outer-repo commits (primitives/) are gated by CORD — stage and propose, CORD commits. Registry edits serialized: board `claim` first.

## Operator rulings that bind this unit

4. "the core is that shared registry across all of the harnesses… the primitives are all the same. agent core is the standing registry. if its in core its in X harness." Where a harness lacks a native mechanism, the ADAPTER is built in the CLI — divergence is the bug.
1. No symlinks the CLI manages; copies/ports only; drift = status checksums of TRANSFORMED bytes (C1 port engine).

## Pre-verified facts (this session, 2026-08-12)

- C1 landed: `harness cursor` profile (skills `~/.cursor/skills-cursor` directory-format, commands `~/.cursor/commands`), port engine `cli/src/port.zig` with transformed-bytes checksums, symlink-is-stale. `agent-core status`: 57 ok / 0 stale / 0 missing.
- C2 landed (pending tester verdict at brief-writing time — VERIFY `briefs/cursor-parity/.done/unit-c2.done` and the tester finding before starting): `delta <path>` profile field, `directive/core` primitive, composition transform in the port engine, three entrypoints deployed as composed files.
- Unit A map (`research/harness-ontology-map.md`) is the reference for what exists where. Key cells this unit fixes:
  - **commands/prompts**: claude-code PRESENT-MANUAL (`~/.claude/commands/tower.md`); pi MISSING (`~/.pi/agent/prompts/` empty); cursor MISSING (documented native dirs `~/.cursor/commands/` + project `.cursor/commands/`, absent on disk). Store: `primitives/commands/` (check contents this session).
  - **subagents**: store `primitives/subagents/` has 10 files, deployed NOWHERE; cursor has a parallel hand-maintained `.cursor/agents/{concierge,coordinator,orchestrator,coder,researcher}.md` (project-level, in the agent-core repo); claude-code has `~/.claude/agents/` mechanism (verify what exists on disk); pi = N/A (herdr/profiles).
  - **hooks**: claude-code has `~/.claude/hooks/*.sh` + `settings.json` wiring (broad PascalCase event set); cursor has `~/.cursor/hooks.json` (sessionStart + preToolUse/Shell only); pi uses TS extensions. Store: `primitives/hooks/`. Translation table (Unit A): `SessionStart→sessionStart`, `PreToolUse/Bash→preToolUse/Shell`, `hookSpecificOutput.updatedInput→updated_input`; cursor `beforeShellExecution` cannot rewrite (slim uses preToolUse).

## Tasks

1. Verify C2 collected (`.done` + tester finding on board). If absent, STOP and report to cord-agent-core.
2. Board `claim` the registry edit.
3. **Commands**: register the store's command primitives with deploy lines to all harnesses that have a native mechanism (claude-code `~/.claude/commands/`, pi `~/.pi/agent/prompts/`, cursor `~/.cursor/commands/`). Profile fields exist (`commands`); pi's field is `prompts` — check `cli/src/registry.zig` for the exact grammar and extend minimally if a harness needs a new path field (schema additions authorized under ruling 4; flag on board). Port transforms: identity unless a harness's command format differs (READ each harness's own docs/skill files before assuming — epistemics).
4. **Subagents**: register `agents/` primitives (grammar has `agents` profile field + `resolveDeployPath` support). Deploy to claude-code (`~/.claude/agents/`) and cursor (user-level `~/.cursor/agents/` — verify cursor's documented user-level agents home this session; Unit A found only project-level `.cursor/agents/`). Reconciliation question for the board, decided by YOU with evidence: the 5 hand-maintained `.cursor/agents/*.md` role files vs the 10 store subagents — overlap, disjoint, or merge? Post a finding with your reconciliation and its rationale BEFORE syncing.
5. **Hooks coverage**: port the store's hook primitives to cursor via the port engine — a `(hook, cursor)` transform that emits/updates `~/.cursor/hooks.json` entries with translated event names and payload shapes per the Unit A table. This is the hard one: hooks.json is a JSON FILE, not a dir — the deploy model may need a merge-strategy (read existing hooks.json, upsert managed entries under a recognizable key/marker, never clobber unmanaged entries). Design constraint: hand-maintained entries (the existing sessionStart herdr-agent-state.sh line) must survive syncs. Post the merge design to the board before implementing.
6. All CLI implementation through `cursor-fleet make` — one make per separable concern (suggest: c3-commands, c3-subagents, c3-hooks) with acceptance criteria derived from THIS brief, or a single c3 make if you judge the surface small enough; say which and why on the board.
7. Scoped syncs only (per-id, dry-run preview posted first). No bare `agent-core sync`.
8. Verification: virgin-cache `zig build` exit 0; `agent-core status` 0 stale 0 missing across three harnesses including the new primitives; provenance block to the board.
9. Commits: submodule per convention (PHASE/DONE/TODO); outer-repo staged + proposed message to CORD; registry not in git.

## File partition

- You own: `cli/` submodule, `~/.agent-core/registry` (claim first), `primitives/commands/`, `primitives/subagents/`, `primitives/hooks/` (read-mostly; edits only if a port requires a source-side fix — flag any such edit on the board).
- You never touch: `primitives/AGENTS.md`, `primitives/directives/` (C2's, landed), `~/cursor-shim/`, `.cursor/agents/` in the repo until your reconciliation finding is posted.
- Parallel: none expected. C2 is done before you start.

## Doctrine constraints (bind you)

- Epistemics: no asserted fact without a this-session source; never invent config schemas — read harness docs/files first.
- Adaptation lives in the port engine; canonical primitives are never modified to fit a harness.
- Comms law `~/.tower/COMMS-ARCH.md`: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board; never operator; status is not mail.
- Verify beat: tester is not the implementer; arbiter on Qs, nQ≤3, then escalate to CORD.

## Done-when

1. Commands, subagents, hooks primitives registered and deployed per the parity matrix; `agent-core status` 0 stale 0 missing across all three harnesses.
2. Hooks.json merge strategy demonstrated: sync adds/updates managed cursor hook entries, hand-maintained entries survive (evidence: before/after hooks.json diff posted).
3. Subagent reconciliation finding posted and acted on.
4. All implementation passed the Verify beat (tester green, arbiter log if any Qs).
5. Submodule commits exist; outer-repo staged with proposed message; registry trail on board.
6. Final report to cord-agent-core on the board; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-c3.done`.

## Report-back

Board post to `agent-core/cursor-parity`, from `orch-c3-parity`, addressed to cord-agent-core. Then the `.done` marker. You will be reaped on collection.
