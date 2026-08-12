# COORDINATED — Harness parity bridge: wire the 2026-08-11/12 primitive wave into claude-code and pi

> Mode: COORDINATED — two harness workstreams (claude-code, pi) executable in parallel with a sequential parity join; per the v3 decision procedure, rule 1 matches first.

## 1. Executive Objective

Every primitive added or changed in the 2026-08-11/12 wave must be reachable from **both** active harnesses — claude-code and pi — in each harness's native idiom, with **identical capability shape** (not identical mechanism). Every addition ships with a runnable QA checklist and passes it with provenance-stamped evidence.

Provider- and model-agnostic by contract: capabilities are described by path and CLI, never by provider or model. The bridges are adapters of the same shape: *if a capability exists in one harness, an equivalent invocation path exists in the other.*

## 2. Background / Context

`agent-core` is the canonical primitive store (`~/agent-core/primitives/`); the `agent-core` Zig CLI diffs and deploys primitives to harness config dirs per the manifest at `~/.agent-core/registry`. Two harnesses are registered: **pi** and **claude-code** (opencode dropped 2026-08-11).

Harness idioms (the "same shape, native mechanism" contract):

| Capability type | claude-code idiom | pi idiom |
|---|---|---|
| Skills | `~/.claude/skills/<name>/SKILL.md` (directory) | `~/.pi/agent/skills/<name>/SKILL.md` (directory) |
| Hooks / event handlers | Shell scripts in `~/.claude/hooks/`, wired in `~/.claude/settings.json` | TypeScript extensions in `~/.pi/agent/extensions/` (jiti-loaded, `/reload` hot-reloads) |
| Slash commands | — | `~/.pi/agent/prompts/<name>.md` |
| Tool access | MCP (`mcp__<server>__*`) + CLI | CLI + super-search routing |
| Global doctrine | `~/.claude/CLAUDE.md` → symlink to canonical AGENTS.md | `~/.pi/agent/AGENTS.md` → symlink to canonical AGENTS.md |

Current deployment state (verified 2026-08-12, this session): `agent-core status` → **37 ok, 0 stale, 0 missing**. Everything *registered* is green. The work is the wave's **tail**: primitives that exist in the store (or deployed trees) but are unregistered, single-harness, or unwired.

## 3. Reuse / What Already Exists

**REUSE / EXTEND** (verified this session unless noted):

- Registry + CLI: `~/.agent-core/registry`, `~/agent-core/cli/zig-out/bin/agent-core` (`status`/`sync`/`--dry-run`). All additions go through registry entries — never hand-copy.
- Registered, deployed, green on both harnesses — do not touch mechanism, only verify: `skill/slim`, `skill/latch`, `skill/vein`, `skill/assay`, `skill/super-search` (registry section "Tool skills (2026-08-12 wave)"), `hook/slim-guard` (CC) with pi twin `~/.pi/agent/extensions/slim-rewrite.ts`.
- Tools (Zig, installed `~/.local/bin/`): `slim`, `latch`, `vein` (commit `3d7597e` — "latch/vein installed"). Sources: `~/agent-core/primitives/tools/{slim,latch,vein,assay}/`.
- slim test infrastructure (landed this session): `primitives/tools/slim/src/fixture_tests.zig`, `test/fixtures/build-git-repo.sh` + goldens, self-sufficient test step in `build.zig` — commits `76476f3`, `0634b9d`.
- assay: multi-needle matching + golden acceptance suite — commits `40de5cc`, `782ba36`. vein leak fix — `17167b6`.
- bigfile: `~/agent-core/primitives/tools/bigfile/` (bun/TS; README + `bigfile.md` in-tree). CC reaches it via `mcp__bigfile__*`; pi via super-search `--file` (per canonical AGENTS.md stack table).
- statem: `~/agent-core/primitives/tools/statem/` — fleet-infra display tooling (CTRL/TOWR panes), per `~/.claude/skills/herdr/SKILL.md` doc table. **No harness bridge required.**
- Doctrine propagation is automatic: `~/.claude/CLAUDE.md` and `~/.pi/agent/AGENTS.md` are symlinks to `~/agent-core/primitives/AGENTS.md` (stack table already lists slim, latch, vein, assay, bigfile, cursor-shim).

**BUILD NEW:**

- Registry entries + deploys for the unregistered wave tail (§7 R2).
- QA evidence trail: Tower board posts per feature under topic `agent-core/harness-parity`.

**DO NOT REBUILD:**

- The five registered tool skills and their deploys (green; regenerating burns tokens to arrive at what exists).
- super-search as the single search router — canonical AGENTS.md: "Extend this skill — never build a second router."
- `~/.claude/CLAUDE.md` / harness AGENTS.md files — symlink targets; never write through them (registry scope rules).
- cursor-shim verify beat (`~/cursor-shim/`) — cursor-only by design; out of scope here.

## 4. Problem Statement

The registered core is fully deployed (37/37 green), but the wave's tail is uneven:

1. **Store skills with no registry entry and no/one-sided deploy:** `cadence-protocol` (flat .md; present in `~/.claude/skills/`, absent from pi), `shipping-web-apps` (flat .md; CC only), `fix-flaky-tests/` (dir; deployed nowhere), `skill-review/` (dir; deployed nowhere).
2. **Deployed-but-unregistered hook:** `primitives/hooks/herdr-task-report.sh` exists in `~/.claude/hooks/` but has no registry entry; pi twin `herdr-task-report.ts` exists as a manually-managed extension.
3. **Store commands with no deploy target in use:** `primitives/commands/tabs.md`, `primitives/commands/tower.md`; pi's prompts dir (`~/.pi/agent/prompts/`) is empty; pi profile declares a prompts dir but no `command/*` primitives are registered.
4. **Unverified wiring:** presence in a hooks/extensions dir ≠ wired. CC hooks require `settings.json` registration; pi extensions auto-load but must survive `/reload` clean.
5. **assay binary location unverified** — canonical AGENTS.md lists no install path (unlike slim/latch/vein at `~/.local/bin/`).

Nothing currently verifies end-to-end that each new capability actually *works* from inside each harness. This brief closes that.

## 5. Scope

- Inventory the full 2026-08-11/12 wave (tools, tool skills, new skills, hooks/extensions, commands).
- For each item: decide register/deploy/leave-store-only (escalating the decision where flagged), then bridge into both harnesses in native idiom.
- A runnable QA checklist per addition, executed with provenance-stamped evidence.
- A final capability-parity matrix sign-off.

## 6. Non-Goals

- Cursor harness — parity landed in `92ccb38` (slim hook, bigfile MCP, tool skills via `~/.cursor/skills-cursor/` symlinks). Verify-only at most; do not modify.
- cursor-shim / cursor-fleet / cursor-spine — cursor-only integration; no pi/CC bridge exists or is needed.
- Retired harnesses (opencode, bb) — never reference.
- Rebuilding or reinstalling tools whose binaries are already installed and current.
- Changing doctrine files (`primitives/AGENTS.md`, rules) — store-only, read on demand.
- statem — fleet infra, no harness bridge.

## 7. Requirements

- **R1 — Inventory.** Enumerate every store primitive created/modified in the wave (git log `e16e2fc..0634b9d` plus untracked additions) and classify each: registered-green / registered-stale / unregistered / out-of-scope.
- **R2 — Registry first.** Every adopted primitive gets a `primitive` block in `~/.agent-core/registry` with explicit `deploy` lines, then `agent-core sync <id>` (dry-run first). Hand-copies are forbidden; drift is detected by `agent-core status`.
- **R3 — Native idiom per harness.** CC: directory skills + `~/.claude/hooks/` + settings.json wiring + MCP where applicable. pi: directory skills + `~/.pi/agent/extensions/` + `~/.pi/agent/prompts/`. Same capability shape; mechanism per the §2 table.
- **R4 — QA checklist per addition.** Every bridged item gets the §17 checklist treatment: runnable commands, explicit pass criteria, evidence posted to Tower board topic `agent-core/harness-parity` (kind=finding).
- **R5 — Parity matrix.** Final deliverable: capability × harness matrix with mechanism and evidence link per cell.
- **R6 — Provenance-stamped verification.** Every evidence capture includes `date -u`, `pwd -P`, and `git rev-parse HEAD` in the same frame. (Hard-won: a gate this session reported ghost SKIP lines because the repro ran against a stale worktree at an old commit, not main.)

## 8. Constraints

- **Standing order:** do not run bare `agent-core sync` (all primitives). This brief grants scoped clearance: `agent-core sync --dry-run` always; `agent-core sync <id>` only for primitive IDs this brief adds or that the operator approves in the Open Questions answers.
- Never deploy to `~/.claude/CLAUDE.md`, `~/.claude/AGENTS.md`, or `~/.pi/agent/AGENTS.md` (symlink write-through hazard; registry scope rules).
- No `rule_strategy inline_agents` anywhere. Rules are store-only.
- Zig builds require Zig 0.16.0 (`zig version`).
- Commit convention (canonical AGENTS.md): `<type>(<scope>): <summary>` + PHASE/DONE/TODO trailers; stage explicitly, never `git add -A`; commits carrying external values get a `SOURCES:` line.
- Comms law `~/.tower/COMMS-ARCH.md`: board findings to `agent-core/harness-parity`; operator mail only when `to:"operator"`.
- Epistemics: no asserted fact without a this-session source; mark unknowns, never invent CLI flags or config schemas — read the tool's README/source first.

## 9. Dependencies

- `agent-core` CLI built and current: `~/agent-core/cli/zig-out/bin/agent-core` (rebuild: `cd ~/agent-core/cli && zig build`).
- Manifest: `~/.agent-core/registry`.
- Harness config dirs: `~/.claude/{skills,hooks,settings.json}`, `~/.pi/agent/{skills,extensions,prompts}`.
- Installed tool binaries: `~/.local/bin/{slim,latch,vein}`.
- Tower CLI for evidence: `bun ~/.tower/cli.mjs post <claim|finding|note> <topic> "<body>" --from <name>` (run from a real repo cwd, not scratch — the CLI refuses /tmp).
- bigfile MCP registration (CC side) per `~/.claude.json` — verify, do not modify without operator sign-off.

## 10. Assumptions

- Both harnesses' global config dirs live at the §2 paths (verified this session).
- pi extensions auto-load via jiti and `/reload` hot-reloads them (canonical AGENTS.md).
- The four unregistered skills are *candidates* for adoption, not pre-approved — their deploy targets are Open Questions (§18), not decisions.
- `~/.claude/hooks/` contains known unwired exit-0 stubs (`agent-spawn-check.sh`, `session-start.sh`, `session-end.sh` per registry comments). Presence there proves nothing; wiring is the check.

## 11. Ambiguities / Risks

- **Ghost-output verification failure mode** (observed this session): a gate reported test SKIPs that main could not produce — the repro ran in a stale worktree at an old commit. Mitigation: R6 provenance stamping on every check; for Zig tests, virgin-cache runs (`rm -rf .zig-cache zig-out`) when the result is load-bearing.
- **Presence ≠ wired:** hook files can sit in `~/.claude/hooks/` unwired. Every hook QA must inspect `~/.claude/settings.json`, not just the file.
- **Unregistered deployed copies drift:** `herdr-task-report.sh` and the CC-only skills exist outside `agent-core status` coverage; until registered, nothing detects their drift.
- **Cache replay:** Zig caches run-step results; a green run can be a replay. Virgin-cache for load-bearing test evidence.

## 12. Workstream Decomposition

- **WS-A — claude-code bridge.** Inventory → registry entries → CC-side deploys/wiring (skills dirs, hooks + settings.json, MCP verification) → per-item QA → evidence posts.
- **WS-B — pi bridge.** Same shape in pi idiom (skills dirs, extensions, prompts) → per-item QA → evidence posts.
- **WS-C — Parity join.** Merge both evidence trails; build the capability-parity matrix; run the global checks (§17-G); flag any asymmetric cell to the operator.

## 13. Parallel vs Sequential Execution

- WS-A ∥ WS-B — fully parallel; disjoint file partitions (CC config tree vs pi config tree). Shared file: `~/.agent-core/registry` — **serialize registry edits**: whichever agent edits first posts a board claim (`cli.mjs post claim agent-core/harness-parity "editing registry" --from <agent>`); the other waits or batches its entries into one edit window. Never concurrent registry writes.
- WS-C — sequential, after both A and B report green.

## 14. Agent Responsibilities

| Agent | Workstream | Inputs | Outputs | Done-when |
|---|---|---|---|---|
| claude agent | WS-A | This brief; registry; `~/.claude/` tree | Registry diff (CC deploy lines); wired hooks/skills; QA evidence on board | Every WS-A checklist item PASS with provenance-stamped evidence |
| pi agent | WS-B | This brief; registry; `~/.pi/agent/` tree | Registry diff (pi deploy lines); extensions/prompts wired; QA evidence on board | Every WS-B checklist item PASS with provenance-stamped evidence |
| Either (first done) | WS-C | Both evidence trails | Parity matrix posted to board; asymmetries flagged to operator | §16 acceptance all checked |

## 15. Input / Output Contracts

- **Input:** this brief; `~/.agent-core/registry`; `~/agent-core/primitives/`; harness config trees. No other context is required.
- **Output (board):** one `finding` per QA checklist completed, topic `agent-core/harness-parity`, body = checklist results with pass/fail per item + provenance block.
- **Output (files):** registry edits; deployed primitives via `agent-core sync <id>` only; harness wiring edits (settings.json / extension files) as needed.
- **Output (final):** parity matrix (§17-F format) + `agent-core status` tail showing `0 stale 0 missing`.

## 16. Acceptance Criteria

- [ ] Every wave primitive classified (R1) and either registered+deployed or explicitly deferred with operator-visible rationale.
- [ ] `agent-core status` → `0 stale 0 missing` after all registry changes.
- [ ] Every §17 checklist passes on both harnesses, evidence on the board with provenance blocks.
- [ ] Parity matrix posted; every capability cell filled for both harnesses or marked `N/A — <reason>`.
- [ ] No hand-copied primitives (all deploys via registry); no writes through AGENTS.md symlinks; no bare `agent-core sync`.
- [ ] All §18 Open Questions either answered by operator or carried as explicit `[UNKNOWN]` in the matrix — never silently resolved.

## 17. Verification / Review Criteria

**Provenance block (prepend to every evidence capture):**

```bash
date -u +%Y-%m-%dT%H:%M:%SZ; pwd -P; git -C ~/agent-core rev-parse HEAD
```

### 17-A Tool binaries (both harnesses — these are harness-agnostic CLIs)

| # | Check | Pass criteria |
|---|---|---|
| A1 | `~/.local/bin/slim --help` | exit 0, usage prints |
| A2 | `cd ~/agent-core/primitives/tools/slim && rm -rf .zig-cache zig-out && zig build test` | exit 0; **zero `SKIP` lines in output** (virgin cache; the done-when that was gate-challenged this session) |
| A3 | `~/.local/bin/latch --help` | exit 0 |
| A4 | `~/.local/bin/vein --help` | exit 0 |
| A5 | assay: locate the binary (`which assay`; else `cd ~/agent-core/primitives/tools/assay && zig build` and note output path) | binary runs `--help`, exit 0; if no install convention exists, record `[UNKNOWN — needs input: assay install location]` instead of inventing one |
| A6 | For each tool: run the README quickstart command (`primitives/tools/<tool>/README.md`) | quickstart succeeds as documented |

### 17-B Skills (per harness)

| # | Check | Pass criteria |
|---|---|---|
| B1 | `agent-core status --harness <h>` | `0 stale 0 missing` |
| B2 | For each of slim/latch/vein/assay/super-search: skill dir exists in the harness skills tree and content matches store (status covers this) | ✓ per B1 |
| B3 | In a live session of each harness: the skill is discoverable (CC: skills list; pi: skills dir + invocation) | agent can name the skill's trigger conditions from its own SKILL.md |
| B4 | super-search router smoke: `bun ~/.claude/skills/super-search/search.ts "slim compactor" --limit 3` | exit 0, results returned; no second router created anywhere |

### 17-C Hooks / extensions (native idiom per harness)

| # | Check | Pass criteria |
|---|---|---|
| C1 | CC: `slim-guard.sh` present in `~/.claude/hooks/` **and** wired in `~/.claude/settings.json` (PreToolUse) | file + settings entry both exist |
| C2 | pi: `slim-rewrite.ts` present in `~/.pi/agent/extensions/`; `/reload` completes without errors | extension loads clean |
| C3 | herdr-task-report: registry entry added; CC deploy via `agent-core sync hook/herdr-task-report`; pi twin `herdr-task-report.ts` confirmed loaded | `agent-core status` green for the new ID; pi `/reload` clean |
| C4 | No unwired stubs mistaken for wired: each hook claimed as "bridged" cites its settings.json entry or pi extension load | every claim has a wiring citation |

### 17-D bigfile (asymmetric mechanism, same shape)

| # | Check | Pass criteria |
|---|---|---|
| D1 | CC: `mcp__bigfile__*` tools respond — load a >3,000-line file, run `stats` | stats returns symbol/line counts |
| D2 | pi: `bun ~/.claude/skills/super-search/search.ts "<symbol>" --file <same-file>` | routes to bigfile layer, bounded results |
| D3 | Same file, both harnesses | equivalent answers (same shape) |

### 17-E Commands / prompts (pi only — pending §18 Q3)

| # | Check | Pass criteria |
|---|---|---|
| E1 | If Q3 approved: `command/tabs` + `command/tower` registered with `deploy pi` | `~/.pi/agent/prompts/{tabs,tower}.md` exist post-sync; status green |
| E2 | If Q3 declined: record `store-only — operator decision` in the matrix | matrix cell filled, no deploy |

### 17-F Parity matrix (WS-C deliverable format)

| Capability | claude-code mechanism | pi mechanism | Evidence (board post id) |
|---|---|---|---|
| Output compaction (slim) | | | |
| Blocking waits (latch) | | | |
| Transcript mining (vein) | | | |
| Memory propagation (assay) | | | |
| Huge-file nav (bigfile) | | | |
| Unified search (super-search) | | | |
| Task report (herdr-task-report) | | | |
| Session lifecycle (session-start/end) | | | |
| <each adopted skill from §18> | | | |

### 17-G Global checks (WS-C, after A+B)

| # | Check | Pass criteria |
|---|---|---|
| G1 | `agent-core status` (both harnesses) | `0 stale 0 missing` |
| G2 | `readlink ~/.claude/CLAUDE.md ~/.pi/agent/AGENTS.md` | both resolve to `~/agent-core/primitives/AGENTS.md` |
| G3 | `git -C ~/agent-core status --porcelain` shows only intended changes | no stray edits outside this brief's scope |

## 18. Open Questions

Escalate to operator before acting on any of these — do not silently resolve:

1. **Q1 — CC-only skills:** `cadence-protocol` and `shipping-web-apps` are deployed to claude-code but not pi, and unregistered. Adopt into registry with `deploy pi` added (parity), or register CC-only (ratify current asymmetry)?
2. **Q2 — Orphan skills:** `fix-flaky-tests/` and `skill-review/` exist in the store, deployed nowhere. Register + deploy both harnesses, or leave store-only?
3. **Q3 — pi prompts:** `commands/tabs.md` and `commands/tower.md` have no deploy target in use; pi's prompts dir is empty. Register as pi prompts, or store-only? (Registry comments say the tab commands were opencode-only historically — needs a fresh decision.)
4. **Q4 — tower-ledger / flight-recorder / stop-verdict:** `primitives/hooks/{tower-ledger.mjs,tower-ledger-diff.test.mjs,flight-recorder.mjs,stop-verdict.mjs}` — pi has the `tower-lifecycle.ts` port (per canonical AGENTS.md); CC wiring is unverified. [UNKNOWN — needs input: what is the intended CC-side wiring, if any?]
5. **Q5 — assay install:** no install path convention recorded (slim/latch/vein use `~/.local/bin/`). [UNKNOWN — needs input: install assay to `~/.local/bin/` for parity?]

## 19. Handoff Notes

- This brief is self-contained; the executing agents need no session history. Canonical doctrine lives in `~/agent-core/primitives/AGENTS.md` (auto-loaded via symlink in both harnesses) and `~/agent-core/AGENTS.md` (repo/CLI guide).
- Registry edit protocol: read current file → append/edit blocks → `agent-core status` (expect `?`/missing for new IDs) → `agent-core sync <id>` per ID → `status` green. Serialize edits per §13.
- If a QA check fails and the fix is ambiguous, post a board `note` with the failure verbatim and stop that item — do not guess-fix config schemas.
- Evidence tone: findings are facts with provenance; interpretations are labeled as such.

## 20. Clarification Check

Are there questions to clarify? Do you understand the intent and purpose — same capability shape in both harnesses, native mechanisms, every addition QA-proven with provenance-stamped evidence? What ambiguous details remain? The known unknowns are enumerated in §18 (Q1–Q5); anything beyond those should be surfaced to the operator before acting, not resolved by assumption.
