# Refiner's Fire — Full Workflow Audit
**Date:** 2026-08-11 · **Auditor:** Claude (Fable 5), coordinating 4 parallel audit agents
**Scope:** directives layer · agent-core registry/store · session start/end protocols · fleet spawn + model profiles
**Context locked in by jrg:** cursor CLI/desktop = retired (gateway stays, reached via pi) · opencode = dropped · active harnesses = Claude Code + pi · model pool = Claude Code + pi's providers · mode = report first, then fix on approval.

---

## 0. Systemic diagnosis — the three diseases

Every individual finding below is a symptom of one of three root causes:

**D1 — Migration debt.** Every migration of the last 4 months was executed on disk but never propagated to the authority layer: the store's numbered→plain dir rename (uncommitted, 40 dirty entries), cursor→pi (doctrine still says cursor is law, stamped the same day it was uninstalled), opencode drop (17 registry deploy lines remain), alembic/SurrealDB retirement (a live probe and a registered rule remain). The pattern: **reality moves, the registry/doctrine doesn't, and the next agent inherits a lie.**

**D2 — Twinned implementations with no canonical.** Six-plus lifecycle modules exist as separate CC (sh/mjs) and pi (TS) codebases in manual lockstep: flight-recorder, stop-verdict, deposit-reminder, grounding-hook, herdr-task-report, and the ledger-parsing grammar (THREE copies). The shim-to-canonical pattern that fixes this already exists and is used by exactly two modules (circadian-mind, rtk-rewrite). Divergence is already observable: the pi rtk twin silently drops rtk's deny/ask exit codes; pi's tower port deleted the SurrealDB probe while CC's kept it.

**D3 — Three sources of truth, zero agreement.** Canonical `primitives/AGENTS.md`, repo `~/agent-core/AGENTS.md` (frozen 2026-04-14), and `~/.agent-core/registry` (frozen 2026-04-14) disagree on: which harnesses exist, pi's skill format, where the commit convention lives, whether WORK.md side-ledgers are law or banned, and whether `~/.claude/AGENTS.md` may be written (registry both names it as a target and forbids it).

---

## 1. P0 — actively breaking work today

| # | Finding | Evidence | Fix |
|---|---|---|---|
| P0-1 | **rtk-rewrite corrupts commands machine-wide.** Verified live this session: `cat f1 f2 f3` → `rtk read` (accepts ONE file) → shell error; **rtk-proxied `diff` returned a false "identical" on files that differ** (epistemic hazard — a lying comparison tool); `grep -n` lost line numbers; an `echo ===` compound executed `===` and killed the chain. rtk 0.34.3; bug lives in rtk's Rust registry, no local checkout. | Session transcript + agent E1; `~/.claude/hooks/rtk-rewrite.sh`, `~/agent-core/primitives/hooks/rtk-rewrite.ts` | Disable or allowlist-narrow the rewrite hook on BOTH harnesses until rtk is fixed upstream. Never trust rtk-proxied output for evidence (extends existing fleet-liveness rule). |
| P0-2 | **Per-role fleet spawn is broken: 13 of 15 models.json slugs don't resolve in pi.** They're Cursor-CLI IDs (`cursor-grok-4.5-high`); pi's grammar is `cursor/<id>[@ctx][:thinking\|:fast]`. `spine-spawn --kind pi --profile <role>` passes a dead slug. Only `composer-2.5` and `kimi-k2.7-code` survive. | Agent D report §B; `profiles/models.json` | Rebuild models.json with pi-resolvable IDs (§4 below). |
| P0-3 | **`agent-core sync` is unsafe to run.** All 3 harness profiles stale; pi's `inline_agents` strategy would write rule sections THROUGH the `~/.pi/agent/AGENTS.md` symlink INTO the canonical AGENTS.md, propagating to all harnesses — including registered-but-banned `rule/alembic`. 18/23 sources missing. | Agent B §T1; `~/.agent-core/registry` | Standing order: do not run sync until registry is rebuilt (Phase 2). Defuse now by deleting `agents` fields + inline_agents strategy from harness profiles. |
| P0-4 | **Dead operator entry points.** `herdr cursor` (`~/bin/herdr:37-39`) and `hc` (`~/bin/hc:4`) exec the uninstalled `cursor-agent`. No `herdr pi` equivalent exists. | Agent D §A | Replace with `herdr pi [profile]` recipe; delete the cursor branch + `hc`. |
| P0-5 | **Doctrine commands the dead path as law.** Canonical AGENTS.md:210-223 (cursor deltas, "Defaults are law 2026-08-11" — stamped the day of the uninstall) and herdr SKILL.md:156-171 (mandatory cursor-kind spawn block) instruct every future agent to run dead binaries. | Agents A #1, D §D | Rewrite both blocks: "cursor = gateway via pi", spawn kind = pi. |

## 2. P1 — corrupting truth / blocking the fix

| # | Finding | Fix |
|---|---|---|
| P1-1 | **session-start / session-end skills are 3-way diverged** (store flat `starting-session.md`/`ending-session.md` ≠ `~/.claude/skills/` ≠ `~/.pi/agent/skills/`, no identifiable canonical) AND duplicate what hooks already inject (handoff extraction, commit convention) AND reference retired concepts (Nebula, WORK.md pheromones, STATUS). | Reconcile: fold any unique value into the hooks/one canonical skill, delete the duplication. Recommend: skills become thin ("the hooks did X automatically; your job is only Y"). |
| P1-2 | **Dead SurrealDB probe on every CC session start** (`~/.tower/hooks/session-start.mjs:48-71`, POSTs to retired :6000 with 1.5s timeout; would inject retired-alembic tool advice if the port ever binds). pi's port already deleted this. | Delete lines ~47-71. |
| P1-3 | **Live infrastructure is git-untracked** in the "repo is truth" repo: `profiles/`, `tools/bigfile/`, `skills/bb/`, `harnesses/`, `briefs/fleet-smoke/`; 40 uncommitted entries incl. the whole dir-rename; cli repo frozen at 3 commits (pre-dates store reorg). | Commit the reorg; track live dirs (gitignore node_modules/zig-cache). |
| P1-4 | **Registry rebuild needed**: 6 opencode-only entries, 9 opencode deploy lines, 8 renamed-not-retargeted sources, 2 orphaned canonicals living only in `~/.claude/skills/` (install, icloud-tabs-distiller), retired entries (alembic, solidjs-2.0, commit-convention). | Rewrite `~/.agent-core/registry` against the actual store (worklist in Agent B §T2). |
| P1-5 | **pi rtk twin drops the permission protocol** (`rtk-rewrite.ts:26` treats deny(2)/ask(3) as "no rewrite"; allow-rewrites apply with no ask semantics). | Port the 4-exit-code handling from rtk-rewrite.sh:50-71. |
| P1-6 | **enforce-brief gate regex is stricter than its error message**: rejects `Done-when:`/`done-when` (hyphen); cost 3 spawn rounds this session. `Explore`/`scout` exempt (undocumented). | `enforce-brief.mjs:36`: add `done[- ]when`; say the accepted phrasings in the error. |
| P1-7 | **Symlink contract violations**: `~/.pi/agent/skills/herdr` is a real dir copy (claimed symlink; identical today, will drift); `~/.claude/skills/navigating-big-files` → dangling (`03_skills/` gone). 8 skill pairs are diverged copies (criticality pi stale, micro-animation-director, atelier, brief, dev-browser, icloud-tabs-distiller store-stale, tldraw). | Symlink where shared; reconcile diverged (worklist in Agent B §T3). |
| P1-8 | **spine-spawn special-cases the dead kind**: cursor gets flags+model plumbing (:207-229), pi gets a warning (:356-358). No thinking-level carrier for pi models. | Invert: pi = blessed kind; pass `--thinking` or encode in ID; delete/gate CURSOR_AGENT_FLAGS. |

## 3. P2 — friction, cost, rot

- **Startup is 10 manual steps; 7 automatable**: herdr server not launchd-managed; CTRL/TOWR/statem panes hand-spawned; post-restart token re-stamping manual; fanout requires a per-worker rename loop (spine-spawn should stamp roles itself). herdr 0.8.0 supports a `[[startup]]` stanza in herdr-plugin.toml — present in the manifest schema, unused. (Agent C §D — full table.)
- **Wake fan-out cost**: full ~8k-token mind payload to every pane; fleet roles skip only the greeting. 4-worker fanout ≈ 4× wake cost before work starts. Over-cap warns but never truncates (wake.ts:187-193). Fix: role-aware slimming (AGNT/SAGT get a slice, not SELF+USER+constitutions).
- **Inbox recomputed 4× per turn-cycle** (SessionStart, every UserPromptSubmit, every Stop, pi before_agent_start — full ledger.jsonl parse each).
- **Status line double-registered** (SessionStart hook + statusLine, settings.json:263 vs :384-387). 8 env-gated superset no-op rows.
- **Every Bash call spawns 3 hook processes; every Stop spawns ≥6** — latency tax multiplied across the fleet.
- **Doc rot in canonical AGENTS.md**: dead `LOCALLLM.md` ref (:111), bb provider list names cursor/opencode (:58), pi herdr symlink claim wrong (:22), rules inventory missing 2 files (:118-120), provider/model names outside Harness-deltas violate its own contract (:58 explicit provider list, :111 Qwen model names).
- **Repo AGENTS.md (2026-04-14) is a museum piece**: wrong harness set, wrong pi skill format ("verified" flat vs actual directory), wrong counts, WORK.md doctrine the canonical bans, hardcoded "Claude Opus 4" attribution.
- **Vestigial store dirs**: `agents/` + `directives/` empty; `mcps/` a doc stub; `harnesses/cursor/` orphaned; `plugins/` + `subagents/` carry retired alembic/constellation fleets; `hooks/cursor/` orphaned; stray `SKILL.md.bak`; `debugging.md` vs `debugging-discipline.md` overlapping legacy pair (NOT duplicates — merge or delete debugging.md).
- **circadian has no project directive** and is absent from the canonical's Active-projects table.
- **grounding-hook.ts** (7th pi extension) undocumented in CLAUDE.md's list of 6.
- **pi lacks**: stop-guard (verbatim guarantee unenforced on pi), enforce-brief, odometer. Decide: port or document the asymmetry as intentional.
- `pi auth check --provider cursor` returns `provider_not_found` (extension-registered providers invisible to the auth CLI) — scripts must not use it as a readiness probe.

---

## 4. The three named asks — answers

### 4.1 Directives (CLAUDE.md / AGENTS.md)
**The symlink architecture is sound and fully healthy** — all 4 symlinks verified, prime's file defers correctly. The disease is content, not plumbing. Verdict:
- Keep exactly ONE doctrine file: canonical `primitives/AGENTS.md`. Fix its stale blocks (cursor deltas → gateway-via-pi, LOCALLLM ref, bb list, herdr claim, rules inventory) and enforce its own provider-agnostic contract.
- Demote repo `~/agent-core/AGENTS.md` to a thin, factual CLI/repo doc that defers all doctrine to the canonical. Delete its "Current State", WORK.md protocol, and harness tables.
- Registry must never own agents files: remove `agents` fields + inline_agents. Rules stay store-only, read-on-demand (already the de-facto doctrine).
- `~/.cursor/AGENTS.md` symlink + `~/.cursor/` wiring: remove with the cursor purge. Add circadian to Active-projects (or an AGENTS.md in-repo).

### 4.2 Model profiles (CORD/ORCH/AGNT/SAGT) — proposed models.json
Same 5 roles, same defaults, slugs translated to pi grammar (`cursor/<id>[@ctx][:thinking|:fast]`). All base IDs verified present in pi's cursor catalog (205 models, auth ready, defaultProvider already `cursor`).

| Profile | Role | default | options |
|---|---|---|---|
| concierge | CONCIERGE | grok | grok→`cursor/grok-4.5:high` · claude→`cursor/claude-opus-5@300k:high` · open→`cursor/kimi-k3:high` |
| coordinator | CORD | open | open→`cursor/kimi-k3:high` · claude→`cursor/claude-sonnet-5@300k:high` · gpt→`cursor/gpt-5.6-sol@272k:high` |
| orchestrator | ORCH | grok | grok→`cursor/grok-4.5:high` · claude→`cursor/claude-opus-5@300k:high` · luna→`cursor/gpt-5.6-luna@272k:high` |
| coder | AGNT | composer | composer→`cursor/composer-2.5` · kimi→`cursor/kimi-k2.7-code` · luna→`cursor/gpt-5.6-luna@272k:high` |
| researcher | SAGT | fast | fast→`cursor/composer-2.5:fast` · grok→`cursor/grok-4.5:fast` · open→`cursor/kimi-k3` |

VERIFY in fix phase: each ID with a live 1-prompt spawn; whether `:fast` stacks with a thinking suffix (undocumented — if not, spine-spawn passes `--thinking` separately). selection.json keys and profile-model logic need NO change. Claude Code panes (operator/concierge seats) keep their native model config — profiles govern the pi fleet. Option for later: per-option `kind` field so a role can resolve to a CC spawn.

### 4.3 Session start/end protocols
Full maps in Agent C report. Immediate deletions: SurrealDB block, duplicate status-line row, orphan session skills (after folding unique value), superset rows if retired. Consolidations: 6 twinned modules → shim-to-canonical; single ledger-grammar lib. The target end state (§5 Phase 4): cold boot → open herdr → `[[startup]]` restores server-adjacent panes (CTRL, TOWR, statem) → type the task. Nothing else.

---

## 5. Fix plan (phased; each phase independently shippable)

**Phase 0 — stop the bleeding (~30 min)**
0.1 Disable/narrow rtk-rewrite on both harnesses (P0-1). 0.2 Delete SurrealDB block (P1-2). 0.3 Defuse registry write-through: strip `agents` fields + inline_agents (P0-3). 0.4 Delete `~/bin/hc` + the `herdr cursor` branch (P0-4). 0.5 enforce-brief regex + error parity (P1-6).

**Phase 1 — fleet spawns again, pi-first (~1-2 h)**
1.1 Rewrite models.json per §4.2; smoke-test each ID. 1.2 spine-spawn: bless `--kind pi`, thinking passthrough, remove cursor plumbing (P1-8). 1.3 Add `herdr pi [profile]` operator recipe. 1.4 Rewrite doctrine: canonical AGENTS.md cursor block, herdr SKILL.md:156-171, PROFILES.md, profile-model header (P0-5). 1.5 Fix pi rtk twin exit codes (P1-5) — or moot if 0.1 disabled it.

**Phase 2 — one source of truth (~2-3 h)**
2.1 Commit the store reorg; track live dirs (P1-3). 2.2 Rebuild registry from Agent B's worklist (P1-4). 2.3 Reconcile session skills (P1-1) + 8 diverged skill pairs; symlink shared skills; fix dangling navigating-big-files (P1-7). 2.4 Purge/attic vestigial dirs, retired plugins/subagents, `hooks/cursor/`, `harnesses/cursor/`; merge debugging.md → debugging-discipline.md. 2.5 Rewrite repo AGENTS.md as thin CLI doc. 2.6 Canonical doc-rot fixes + circadian entry.

**Phase 3 — lifecycle consolidation (~2-3 h)**
3.1 Shim-to-canonical the 6 twinned modules; one ledger-grammar lib (D2). 3.2 Remove duplicate status-line row + dead superset rows. 3.3 Decide pi parity: stop-guard/enforce-brief/odometer — port or document as intentional. 3.4 Optional: inbox parse memoization.

**Phase 4 — launch-and-build (~2-4 h)**
4.1 launchd/login-item for herdr server. 4.2 `[[startup]]` stanza: CTRL, TOWR, statem panes. 4.3 spine-spawn fanout stamps role prefixes (kill manual re-stamp loop). 4.4 Role-aware wake slimming in circadian (AGNT/SAGT slice). 4.5 Rewrite the reconciled session-start/end skills against the new reality.

**Verification bar per phase:** every changed command smoke-run; every doctrine claim re-verified against disk; `agent-core status` clean after Phase 2; one full fleet spawn (CORD→ORCH→2×AGNT) end-to-end after Phase 1 and again after Phase 4.

---

## 6. Meta-findings from dogfooding this audit
- enforce-brief gate blocked 3 spawn rounds on a regex nuance (now P1-6) — the gate works, its DX doesn't.
- rtk corrupted 4 distinct command shapes during the audit itself, including a false-identical `diff` inside an audit agent — the tool taxing tokens was taxing truth.
- The herdr/tower/circadian substrate held: 4 parallel agents, ~330k tokens, all findings landed. The pattern is right; the config is what's burning.

**Source reports:** full agent outputs retained in session transcript (directives 17 findings · registry/store · session protocols · fleet/profiles). This document is the canonical worklist for the fix phases.
