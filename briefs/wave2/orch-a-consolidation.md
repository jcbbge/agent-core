# ORCH-A — one-source-of-truth consolidation (refiners-fire wave 2)

## Mission
You are an ORCHESTRATOR (2-ORCH) under the coordinator. Own wave 2 of the refiners-fire fix plan: make the agent-core store, registry, deployed skill trees, and lifecycle hooks converge on single sources of truth. You read, verify, partition, spawn AGNT workers, gate their output, integrate, and commit. You do NOT implement tasks yourself beyond trivial glue — workers implement.

## SOP pack — read these FIRST, they are law
- `~/agent-core/primitives/rules/control-flow.md` (hierarchy, naming, reaping: done = gone)
- `~/.tower/COMMS-ARCH.md` (one message, one audience, once; status is not mail)
- `~/agent-core/primitives/skills/herdr/SKILL.md` (spawn loop, stamping, fanout ≤4/tab, verified submit)
- `~/agent-core/AUDIT-2026-08-11-refiners-fire.md` (the master worklist — your scope is Phase 2 leftovers + Phase 3)
- Spawn: `python3 ~/herdr-spine/bin/spine-spawn fanout --task <t> --workspace $HERDR_WORKSPACE_ID --kind pi [--profile coder] --cwd /Users/jrg/agent-core --brief <b1> [--brief b2 …]` (max 4 briefs/call)
- Tower posting (you AND every worker brief you write): `cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/wave2 "<body>" --from <name>`
- Worker briefs MUST carry: Pre-Verified Facts (you ran every command/path yourself), file partition, done-when per task, Tower mechanism above, Report-back contract ending in a `.done` file under `~/agent-core/briefs/wave2/done/`. Workers NEVER commit; you integrate and commit.

## Pre-Verified Facts (coordinator-verified today)
- `agent-core status` = 12 ok / 1 stale / 0 missing. `agent-core sync` remains FORBIDDEN — manual copies only, status for verification.
- session-start/session-end skills are 3-way diverged: store flats `primitives/skills/starting-session.md` + `ending-session.md` vs `~/.claude/skills/session-{start,end}/SKILL.md` vs `~/.pi/agent/skills/session-{start,end}/`. They also duplicate what hooks already inject (handoff extraction, commit convention) and reference retired concepts (Nebula, WORK.md pheromones). Reconciliation verdict from the audit: make them THIN (the hooks did X automatically; the skill's job is only Y), one canonical in store, symlink/deploy out, register.
- Store rot inventory: `plugins/` carries retired alembic*/perplexity*/subagent dirs; `subagents/` carries the retired constellation fleet + `_deprecated-alembic/`; `hooks/_deprecated/`; stray `skills/atelier/SKILL.md.bak`; `mcps/` is a doc stub; `agents/` and `directives/` are EMPTY. `debugging.md` vs `debugging-discipline.md` overlap but are NOT duplicates (101 vs 138 lines) — merge into debugging-discipline.md.
- Diverged deployed skill copies (store == canonical unless noted): criticality (pi stale, 60 vs 141 lines), micro-animation-director (pi differs), atelier (cc differs + missing support/), dev-browser (store is a 614B stub, cc dir is real — adopt cc), icloud-tabs-distiller (already adopted), brief (cc-only, differs from store).
- The numbered→plain dir reorg (10_plugins→plugins etc.) is uncommitted: ~18 unstaged deletions + untracked new homes in `git -C ~/agent-core status`.
- Repo doc `~/agent-core/AGENTS.md` is a 2026-04-14 museum piece: wrong harness set (says pi/opencode/claude-code), wrong pi skill format, WORK.md doctrine the canonical bans, "Claude Opus 4" attribution, Zig 0.15.2 (installed toolchain is 0.16.0 — verified via `zig version`).
- Lifecycle twins (Phase 3): the same logic implemented separately for CC and pi — flight-recorder (`~/.tower/hooks/flight-recorder.mjs` ↔ `~/.pi/agent/extensions/tower-lifecycle.ts`), stop-verdict, deposit-reminder, grounding-hook (`~/.claude/hooks/grounding-hook.mjs` ↔ pi grounding-hook.ts), herdr-task-report (.sh ↔ .ts), and THREE copies of the ledger-parsing grammar (`~/.tower/lib.mjs`, tower-auto.ts, tower-lifecycle.ts). The proven consolidation pattern: shim-to-canonical (see `~/.pi/agent/extensions/slim-rewrite.ts` → `~/agent-core/primitives/hooks/slim-rewrite.ts`).
- LIVE-HOOK DANGER: every file above is running in real sessions. slim-guard.sh / slim-rewrite.ts are LIVE and out of scope — do not touch. Any converted hook must be pipe-tested (`echo '<payload>' | bun <hook>` with realistic stdin) before its old copy is retired. A broken settings.json or hook bricks sessions machine-wide.
- Grounding hook: consecutive Edits to one file without a fresh Read-tool load are BLOCKED. Brief your workers: Read→Edit pairs, always.

## Your partition (workers stay inside it)
`~/agent-core/**` (store, repo docs, git) · `~/.agent-core/registry` · deployed skill trees `~/.claude/skills/**` + `~/.pi/agent/skills/**` · lifecycle hook files listed above (`~/.tower/hooks/`, `~/.tower/lib.mjs`, `~/.claude/hooks/` except slim-guard.sh, `~/.pi/agent/extensions/` except slim-rewrite.ts + herdr-managed files). NOT: `~/.claude/settings.json`, `~/herdr-spine/**`, `~/circadian/**`, profiles dir, slim tool dir.

## Suggested worker split (you may re-partition; ≤4 per fanout)
- A1: session-skill reconciliation (merge → thin canonical dirs in store, deploy, register)
- A2: store purge/attic + diverged-skill sync + debugging.md merge + registry truth-up
- A3: repo AGENTS.md rewrite + stage/commit-prep of the reorg (worker prepares exact `git add` path list + commit message draft; YOU run the commit after verifying)
- A4: lifecycle consolidation — scope to: extract ONE shared ledger-grammar lib consumed by all three copies, and convert flight-recorder + stop-verdict to shim-to-canonical. Grounding + task-report only if every gate stays green; otherwise document as next-wave.

## Done when (your integration gate)
1. `agent-core status` exits 0 missing / 0 stale-unexplained; every registered source exists.
2. Every touched live hook has recorded pipe-test evidence (command + exit code) in your report.
3. `git -C ~/agent-core status --short` shows a clean tree after your integration commits (commit convention from the canonical AGENTS.md §Work tracking; stage explicitly, never `git add -A`; Co-Authored-By your actual model).
4. Every worker reaped (done = gone), every worker's `.done` present under `briefs/wave2/done/`.
5. Board carries your claim, per-worker findings, and a final `DONE ORCH-A:` finding on `agent-core/wave2`.

## Report back with
Final message: per-worker outcome table (scope, done-when evidence, deviations), the integration commit hashes, the pipe-test evidence list, anything deferred with reasons. LAST action: `touch ~/agent-core/briefs/wave2/done/orch-a.done`.
