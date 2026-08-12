# MAKE brief — c3-subagents (Unit C3 slice 2/3)

> From: orch-c3-parity, 2026-08-12. Binding. Parent: `briefs/cursor-parity/unit-c3-parity-expansions.md`.
> Board: `agent-core/cursor-parity`. Make slug: `c3-subagents`.
> SPAWN: under `cursor-fleet make` — coder OR test-maker only. No further spawns. No emojis.

Deploy the 10 store subagent definitions to claude-code and cursor user-level agent homes. Reconciliation already decided (board finding orch-c3-parity): DISJOINT from project `.cursor/agents/` role stubs — do not merge; do not touch project agents.

## Pre-Verified Facts (orch verified this session)

- Store: `~/agent-core/primitives/subagents/{architect,coder,debugger,peer,reviewer,scout,sigil-distiller,tabs-processor,test-writer,worker}.md` (10 files).
- User `~/.cursor/agents/`: ABSENT. `~/.claude/agents/`: ABSENT. Project `/Users/jrg/agent-core/.cursor/agents/` has 5 role files — DO NOT TOUCH.
- Unit A + create-hook/docs: cursor user-level agents home = `~/.cursor/agents/*.md` (lower priority than project).
- Grammar (`cli/src/registry.zig`): harness field `agents` exists; `resolveDeployPath` for prim_type `agents` currently returns `profile.agents` as a SINGLE FILE path (legacy AGENTS.md). C2 moved entrypoints to `directive/core` — no harness profile currently sets `agents`.
- ORCH decision (posted): reinterpret `agents` as a DIRECTORY; resolve to `{dir}/{filename}.md`.
- pi = N/A for subagents (herdr/profiles) — no deploy pi lines.
- Port: identity (store .md files deploy as-is). Do not strip frontmatter.
- c3-commands may have already edited `registry.zig` (command→prompts fallback). Rebase/merge carefully; do not revert commands work.
- Registry claim: orch-c3-parity. Post dry-run before sync.

## Parallel Work Notice

- c3-commands may still be finishing or just landed — read board + `git -C cli log -3` before editing. If commands CLI commit exists, build on that HEAD.
- Do not touch hooks.json, command primitives, primitives/AGENTS.md, directives/, project `.cursor/agents/`.

## Tower

- Topic `agent-core/cursor-parity`. from=`agnt-c3-subagents-coder` / `agnt-c3-subagents-testmaker`.

## Tasks — IMPLEMENTER (coder)

1. CLI: change `resolveDeployPath` for `agents` so it joins `profile.agents` dir + `/{filename}.md` (same pattern as command/prompt). Update grammar comment: agents dir, not single file.
2. Registry:
   - `harness claude-code`: add `agents ~/.claude/agents`
   - `harness cursor`: add `agents ~/.cursor/agents`
   - Register all 10:
     ```
     primitive agents/<name>
       source ~/agent-core/primitives/subagents/<name>.md
       deploy claude-code
       deploy cursor
     end
     ```
3. Virgin-cache `zig build` exit 0.
4. Dry-run each id (or a representative pair + note batch) → board finding.
5. Scoped sync all 10 agents/* ids only (no bare sync).
6. Verify `~/.claude/agents/*.md` and `~/.cursor/agents/*.md` are regular files; project `.cursor/agents/` unchanged (diff before/after).
7. `agent-core status` 0 stale 0 missing.
8. Submodule commit. No outer-repo commit. Touch `.done/c3-subagents-coder.done` + board report with provenance.

## Tasks — TEST-MAKER

Author `cli/test/integration/c3_subagents_acceptance.sh` (+ fixtures) proving criteria below from this brief only. `.done/c3-subagents-testmaker.done` + board criterion list.

## Acceptance criteria

| ID | Criterion |
|----|-----------|
| T-C3-AG-RESOLVE | agents/foo resolves to `{agents_dir}/foo.md` for cc + cursor fixtures. |
| T-C3-AG-NO-PI | agents/foo with only pi deploy and no agents field → skip/no mapping (or omit pi). |
| T-C3-AG-STATUS-OK | Matching bytes → status ok. |
| T-C3-AG-STATUS-MISSING | Absent dest → missing. |
| T-C3-AG-IDENTITY | port(agents,*) identity. |
| T-C3-AG-LIVE-COUNT | Live (AGENT_CORE_LIVE=1): 10 files each under ~/.claude/agents and ~/.cursor/agents; project .cursor/agents basename set unchanged. |

## Constraints

- Touch ONLY: `cli/src/registry.zig` (+ tests/fixtures), `~/.agent-core/registry`, `.done` markers.
- NEVER modify project `.cursor/agents/` or store subagent sources unless a port bug forces it (flag board first).
- No bare sync. No outer commit.

## Done-when

Coder synced 10×2 deploys; test-maker oracle landed; status green; submodule commit; `.done` markers.

## Report-back

Board finding → orch-c3-parity.
