# CORD agent-core — cursor-parity mission: ontology map + cursor as third registered harness

> From: CONCIERGE (operator intake 2026-08-12). Binding. Self-contained.
> Board topic for all fleet mail: `agent-core/cursor-parity`. `.done` markers: `briefs/cursor-parity/.done/<unit>.done`.

## 1. Mission

The operator's framework (agent-core primitives: skills, rules, hooks, commands/prompts, subagents, directives, profiles, tools) is provider/model-agnostic by design and must reach **three** harness runtimes — claude-code, pi, cursor — with identical capability shape and harness-native mechanisms. Two gaps exist today: (a) there is no canonical map of the ontology × harness adapter surface, and (b) cursor wiring is hand-maintained (symlinks, hand-ported hook, hand-edited JSON) while claude-code/pi deploy through the agent-core CLI. Close both **without modifying the core primitives** — adapters translate at the harness edge.

## 2. Operator decisions (authority, 2026-08-12)

1. **Cursor becomes a third REGISTERED harness** in the agent-core CLI: registry profile + `agent-core status/sync` coverage, adapters in the Zig CLI. This supersedes `briefs/harness-parity-bridge.md` §6 ("Cursor harness … do not modify") — that brief's cursor non-goal is void; its §17 verification format, R6 provenance stamping, and registry edit protocol are adopted by reference.
2. **Full fan-out now** — all four units (§5) briefed immediately; dependencies noted, not staged.
3. **Fleet models: cursor-subscription paths only.** All spawns `--kind pi --profile <role>` (profiles resolve to `cursor/*` gateway IDs — verified below). cursor-shim (`cursor-fleet`/`cursor-spine`) only if a cursor kind is specifically required. No direct API-key burn.

## 3. Pre-verified facts (this session, 2026-08-12 ~15:25 UTC, by CONCIERGE)

- **Registry** `~/.agent-core/registry` (read in full): harnesses `pi` + `claude-code` only. Comment at the "Tool skills (2026-08-12 wave)" section states verbatim: "cursor is not an agent-core harness, no deploy lines for it here." Prior brief reports `agent-core status` = 37 ok / 0 stale / 0 missing — re-verify before editing.
- **CLI build is BROKEN** (reproduced): `cd ~/agent-core/cli && zig build` → `src/main.zig:34:23: error: root source file struct 'heap' has no member named 'GeneralPurposeAllocator'` (Zig 0.16.0; GPA removed). The cli submodule has **uncommitted `build.zig` + `build.zig.zon` modifications in flight** — inspect before touching; they may be a partial migration. The installed binary `cli/zig-out/bin/agent-core` works (performed 5 skill syncs earlier today).
- **Cursor surface** (read this session): `~/.cursor/hooks.json` = sessionStart → `~/.cursor/herdr-agent-state.sh`; preToolUse (matcher `Shell`) → `~/agent-core/primitives/hooks/slim-guard-cursor.sh`. `~/.cursor/mcp.json` = `tower`, `arc`, `bigfile`. `~/.cursor/skills-cursor/` = 24 entries; 7 are symlinks into `primitives/skills/` (herdr, super-search, navigating-big-files, slim, latch, vein, assay). `~/AGENTS.md` symlinks to canonical `primitives/AGENTS.md` (cursor loads it). **`~/.cursor/commands/` DOES NOT EXIST** — yet a `/tower` cursor command executed in the concierge session today; cursor's command home is UNKNOWN (Unit A resolves: check project `.cursor/commands/`, cli-config.json, cursor docs).
- **claude-code surface**: `~/.claude/skills/`, `~/.claude/hooks/`, `~/.claude/commands/tower.md` exists, wiring in `~/.claude/settings.json`. **pi surface**: `~/.pi/agent/{skills,prompts,extensions}`; prompts dir empty.
- **Profiles** (`primitives/profiles/models.json`, read this session): coordinator default `cursor/kimi-k3:high`; orchestrator `cursor/grok-4.5:high`; coder `cursor/composer-2.5`; researcher `cursor/composer-2.5:fast`. All resolve through pi's cursor provider (inference gateway). spine-spawn: `~/bin/spine-spawn` (python3 — NEVER bun); `--kind pi --profile <name[:option]>`; thinking via separate `--thinking` flag, never stacked with `:fast`.
- **herdr**: 0.8.0, protocol 19. Live panes at intake: w29:p2 CONCIERGE (cursor), w2A:p2 `cord-slim-fixtures-2` (status done — reap-eligible per board; its unit landed @ 0634b9d). `cord-agent-core` name is free.
- **cursor-shim** (`~/cursor-shim/`): sanctioned bridge for cursor-agent tiers; qa-verify 76/76 per operator's session report. In scope for the map; DO NOT modify.

## 4. Doctrine constraints (bind every unit)

- Never modify canonical primitives to fit a harness — adapters/bindings live at the harness edge (CLI deploy strategies, registry profile, harness config).
- Never write through AGENTS.md symlinks; no `rule_strategy inline_agents` anywhere; rules stay store-only unless the operator rules otherwise.
- Registry edits serialized: board `claim` on `agent-core/cursor-parity` before editing, one editor at a time.
- Scoped sync clearance: `agent-core sync --dry-run` always; `agent-core sync <id>` only for IDs carrying cursor deploy lines added by this mission. No bare `agent-core sync`.
- The cli is a **git submodule** (`~/agent-core/cli` is its own repo) — cli changes commit there per the commit convention (`<type>(<scope>): <summary>` + PHASE/DONE/TODO; stage explicitly, never `git add -A`).
- Epistemics: no asserted fact without a this-session source; mark `[UNKNOWN]`; never invent config schemas — read the harness's own docs/source first.
- Evidence: provenance block (`date -u`; `pwd -P`; `git rev-parse HEAD`) on every load-bearing capture; virgin-cache (`rm -rf .zig-cache zig-out`) for load-bearing Zig test runs.
- Comms law `~/.tower/COMMS-ARCH.md`: findings to `agent-core/cursor-parity`; operator mail only for genuine decision forks (§7); status is not mail.

## 5. Units (fan out now)

### Unit A — Ontology map + parity matrix (START NOW; read-only)
SAGT-grade research under an ORCH or direct CORD supervision. Deliverable: new doc `research/harness-ontology-map.md` + matrix posted to board.
- Enumerate every primitive TYPE in the store (skills, rules, hooks, commands/prompts, subagents, directives, profiles, plugins, tools) × the three harnesses.
- Per cell classify: PRESENT-REGISTERED (CLI-deployed) / PRESENT-MANUAL (symlink/hand-edit) / ADAPTED (format translation — precedent: `slim-guard.sh` → `slim-guard-cursor.sh`) / MISSING / N/A-with-reason.
- Resolve the cursor-command-home UNKNOWN and cursor's rules/subagents surfaces (what cursor actually loads: skills-cursor, hooks.json events, mcp.json, `.cursor/rules/`, AGENTS.md).
- No writes except the deliverable doc and board posts.

### Unit B — CLI Zig 0.16 build fix (START NOW; blocks C)
ORCH + AGNT (coder profile). Fix `main.zig:34` (GPA removed in 0.16 — use the 0.16 allocator idiom; check how `primitives/tools/*/src` sibling Zig 0.16 projects allocate). First inspect the uncommitted `build.zig`/`build.zig.zon` changes in the submodule — reconcile, don't blindly overwrite. Done-when: `zig build` exit 0, `zig-out/bin/agent-core status` runs and matches the installed binary's output, committed in the submodule.

### Unit C — Cursor harness registration + adapters (AFTER A + B)
ORCH + AGNTs. Add `harness cursor` profile support to the CLI (registry parser + resolveDeployPath + status/sync) and registry entries with `deploy cursor` lines. Adapter surface per Unit A's matrix: skills dir (`~/.cursor/skills-cursor`, directory format), hooks (cursor `hooks.json` event names/payloads differ from CC — `slim-guard-cursor.sh` is the hand-written precedent), MCP/commands/rules strategy per matrix findings.
- **Known design fork — escalate to operator via CONCIERGE before implementing:** current cursor skill deploys are *symlinks*; the CLI's `copy_file` strategy would replace them with copies. Recommend symlink-aware strategy or ratify copies.

### Unit D — Parity verification sweep (AFTER C)
ORCH + AGNT (tester). Extend harness-parity-bridge §17 to three harnesses: per-capability runnable checklist, provenance-stamped evidence to the board, final capability × harness matrix with every cell filled or `N/A — <reason>`, and `agent-core status` green across all three harnesses (0 stale 0 missing).

## 6. Topology

CORD (you) → one ORCH per unit → AGNT/SAGT under them. A ∥ B immediately; C when A+B land; D when C lands. All spawns `~/bin/spine-spawn … --kind pi --profile <coordinator|orchestrator|coder|researcher>`. Briefs on disk under `briefs/cursor-parity/`; CLAIM-first / board findings / `.done`-last; workers never commit to the main repo (cli submodule commits per Unit B done-when; integration commits are yours after verification). Reap every pane at collection — done = gone.

## 7. Escalations (batch to CONCIERGE → operator; do not silently resolve)

1. Symlink vs copy deploy strategy for cursor skills (Unit C fork above).
2. Cursor rules surface: keep "loads `~/AGENTS.md` only" or gain a `.cursor/rules/` deploy mapping?
3. Any schema change to the registry format itself (new block fields) beyond adding a harness profile.
4. Anything Unit A marks MISSING that has no harness-native mechanism at all.

## 7a. OPERATOR RULINGS (2026-08-12 ~16:05 UTC, via CONCIERGE — supersede the §7 escalation framing; relayed to CORD verbatim by verified prompt)

1. **Deploy strategy:** "remove all symlinking. this will be a process covered by the cli itself that will copy and paste and port." No `deploy_link`. The CLI copies AND ports (format-adapts at deploy time) per harness, fleet-wide — existing symlink deploys are replaced by CLI-managed copies over time. Drift detection = `agent-core status`.
2. **Cursor skills dir:** `~/.cursor/skills-cursor/` ratified.
3. **Directives — new composition model:** "we have to maintain [CanonDirective.md] + [harness.md] because claude uses a claude.md file, and cursor and pi use agents.md." Canonical core (`primitives/AGENTS.md`) + per-harness delta files composed at deploy time → harness entrypoint (`CLAUDE.md` for claude-code; `AGENTS.md` for pi/cursor). Entrypoint symlinks are REPLACED by composed deployed files; the registry scope rule "NEVER deploy to ~/.claude/CLAUDE.md" is voided by operator override. The "Harness deltas" section factors out of the canonical into per-harness files. CORD must post the design proposal to the board BEFORE implementing.
4. **Full-parity mandate:** "agent core is the standing registry. if its in core its in X harness." Unit C scope expands to ALL Unit-A escalation candidates: commands deploy, subagents unification (incl. cursor's parallel `.cursor/agents/`), herdr skill registration, hooks coverage via deploy-time translation. Where a harness lacks a native mechanism, the adapter is built in the CLI — divergence is the bug.

## 7b. OPERATOR CORRECTION (2026-08-12 ~16:20 UTC, via CONCIERGE — supersedes §2.3's pi-gateway spawn path)

All NEW spawns are **kind=cursor via the cursor-shim**: `~/cursor-shim/cursor-fleet orch|worker|fanout` (cursor-spine atomic underneath), shim DEFAULT profiles/models (grok/composer tiers on the cursor subscription) — no model overrides, no `spine-spawn --kind pi`. Implementation units go through `cursor-fleet make` (enforced Verify beat: bifurcated coder/test-maker worktrees, tester, arbiter, nQ≤3). Already-running pi panes (incl. your own) are unaffected.

## 8. Done-when (mission)

- `research/harness-ontology-map.md` landed; parity matrix on the board.
- `harness cursor` in the registry; `agent-core status` = 0 stale 0 missing across pi, claude-code, cursor.
- Unit D sweep evidence on `agent-core/cursor-parity` with provenance blocks.
- All unit `.done` markers written; all fleet panes reaped; final report posted and delivered to operator.
