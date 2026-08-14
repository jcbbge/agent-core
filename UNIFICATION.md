# UNIFICATION — the complete ontology and the single rollup plan

**Date:** 2026-08-14 · **State basis:** live enumeration this session (post
green-main wave: all five repos green, pushed, mirror 250 ok / 0 stale /
0 missing). Companion: `AUDIT-2026-08-14-topology.md` (the diagnosis),
`AUDIT-2026-08-14-topology-zine.html` (the mental model rendered).

This document does two things and only two things:
**Part I** accounts for every piece, mechanism, scaffolding, and substrate
on this machine — top to bottom — each with a disposition. **Part II** is
the singular plan that rolls it all into one framework with feature parity.

## Disposition vocabulary (used in every table)

| Tag | Meaning |
|---|---|
| **CORE** | First-party code — rolls INTO the unified framework (target package named) |
| **ADAPTER** | External product the framework consumes through a defined seam — never absorbed |
| **DATA** | Private/local state — the framework reads/writes it, never ships it |
| **PROJECT** | A consumer of the framework (per-project instance) — not part of it |
| **RETIRE** | Do not port; delete or attic during rollup |

---

# PART I — THE COMPLETE ONTOLOGY

Thirteen layers, bottom-up. Every named thing on the machine appears exactly
once, in its layer. (Rev 2, same day: added L11 DIGESTION — rumen, L12
GATEWAY — strudel, the complete bin census, and the replacement lineage,
after the operator caught their omission.)

## L0 · ENGINES — interchangeable inference

| Piece | Where | Disposition |
|---|---|---|
| Claude Code CLI | harness binary | ADAPTER (gates plane wires it) |
| pi (@earendil-works/pi-coding-agent) | harness | ADAPTER |
| cursor-agent 2026.08.11 | `~/.local/bin/cursor-agent` | ADAPTER (via bridges/cursor-shim) |
| Local LLM server (MLX, Qwen3 family + embeddings) | `:10240`, launchd `com.localllm.server` | ADAPTER (mind + assay consume) |

Law of this layer: context dies every window; nothing valuable lives inside
an engine. Everything below exists to hold what engines cannot.

## L1 · BODY — herdr, the terminal substrate

| Piece | Where | Disposition |
|---|---|---|
| herdr 0.8.0 (server + TUI + CLI + socket API) | `~/.local/bin/herdr`; source checkout `~/source/herdr` + `~/source/herdr-RETROFIT-MAP.md` | ADAPTER (behind the RuntimeAdapter seam — P2 contract) |
| `~/bin/herdr` wrapper (`herdr pi [profile]` blessed fleet path) | `~/bin` | CORE → substrate/ |
| config.toml spine-managed block (sidebar rows, keybindings prefix+space / prefix+i) | `~/.config/herdr/config.toml` L19–148 | CORE → deploy/ (installer-owned block) |
| plugins.json (herdr-spine enabled: events/startup/actions/link_handlers) | `~/.config/herdr/plugins.json` | CORE → deploy/ |
| herdr integrations (agent-state reporters: claude v7, pi v8, cursor v1 — vendored by `herdr integration install`) | harness trees | ADAPTER (herdr-owned; mirror `check`s them) |

Objects herdr owns (the framework consumes, never reimplements): sessions,
workspaces, worktrees, tabs, panes (24 verbs), agents (identity + status
detection, verified submit), metadata tokens (≤80c, TTL, die on restart),
notifications, `api snapshot` + `events.subscribe`, plugin surface.

## L2 · REFLEXES — herdr-spine, discipline compiled into commands

All CORE → **substrate/** unless marked. Repo: `~/herdr-spine` (green, pushed).

| Piece | Role |
|---|---|
| spine-spawn (+ `~/bin/spine-spawn` python3 guard shim) | THE spawn door: topology → start → verified submit → liveness → stamps |
| spine-workspace | Workspace door: create/close with board trace + `--why` (Done/Parked) |
| spine-ruling | Typed operator corrections: `--scope` required |
| spine-claim / spine-report / spine-watch | Advisory `claim_<slug>` tokens · `$task`/`$verdict`/`$q` · event-driven token watcher |
| spine-inbox / spine-greeting | prefix+i unified triage popup · prefix+space re-entry briefing |
| spine-hook + `handlers/_spine_common.py` | The event dispatcher (fan-out to numbered handlers, failure-isolated) |
| Handlers: 10-notify · 15-restore-view · 16-parent-wake · 17-field-pull · 40-tower-bridge | Toast law · needs-you view · wake the spawner · compelled field read · ledger bridge |
| Handlers held: 20-reflex (dry-run, never fired) · 30-choreo (flag-off) | CORE, ship disabled — policy-gated auto-answer and zoom choreography |
| ctl-fleet · spine-startup | CTRL pane renderer (two-plane) · infra-pane restoration at boot |
| spine-fleet · spine-wave · spine-lab · spine-agent · spine-sigil · spine-choreo · spine-wormhole | CEO one-shot view · wave checklist rows · guarded experiment sessions · synthetic-agent wrapper · sigil grammar · choreo toggle · spine.local link router |
| docs/ (19: MANUAL, spawn, dispatcher, pheromones, sigils, reflexes, choreography, wormholes, inbox, greeting, ctl-fleet, spine-tokens, plugin, install, verify-beat, tower-bridge, synthetic-agents, 3× ACCEPTANCE) | The law + evidence of this layer |
| cc-hooks/ (server.mjs bootstrap twin + ask-bridge + stop-verdict) | Fresh-machine bootstrap fallback — stays a real file by design |
| attic/ (retired 50-scent-digest + test, spine-backups/) | RETIRE (already atticized; carries history) |

## L3 · FIELD — Tower, the coordination bus

Canonical `~/agent-core/primitives/mcps/tower/`; deployed `~/.tower/` as
symlinks + state. All code CORE → **field/**.

| Piece | Role |
|---|---|
| server.mjs (MCP: send_to_user, ask_user, reply, check_inbox, mark_relayed, relay_inbox, board_post, board_read, pheromone_emit, pheromone_field) | The bus surface for MCP harnesses |
| cli.mjs (status, inbox, board, post, emit, field, scan, burn, all, projects) | The sanctioned non-MCP surface (pi, plain shells) |
| lib.mjs + `primitives/hooks/tower-ledger.mjs` | The grammar: flocked append, tolerant parse, inboxState choke point, dead-letter, TOWER_HOME-honoring paths |
| rotate.mjs + DEPLOY-ROTATE.md + launchd `com.tower.rotate` (03:30, Phase-1 archival only) | Board/ledger growth control; truncation gated behind sign-off |
| 11 hooks: session-start, stop-guard, stop-verdict, write-gate, flight-recorder, deposit-reminder, odometer, odometer-stop, ask-bridge, prompt-inject, enforce-brief | The bus's own gates (wired per L4) |
| drift-check.mjs, 10 test suites (134 pass / 0 fail), criteria docs | Acceptance |
| Doctrine: COMMS-ARCH.md (5 planes, one-message-one-audience), RESPONSIBLE-PARTY-AND-NQ.md (nQ), DEPLOYMENT.md, compaction ruling | The law of coordination |
| State: ledger/board/pheromones/odometer/dead-letter .jsonl, flight/ (813), deliverables/ (452), archive/, cursors/, write-gate-state, ask-bridge-state, bridge-exempt, pace files | DATA (lives in `~/.tower/`, never ships) |

## L4 · GATES — enforcement, per-harness

Canonical bodies CORE → **gates/**; harness wiring CORE → **deploy/**.
Registry-mirrored: 26 hook rows. Law file: `primitives/rules/ENFORCEMENT.md`
(DOOR / HOOK / DOCTRINE — a law names its enforcer or wears the label).

| Gate | Canonical body | CC | pi | cursor |
|---|---|---|---|---|
| write-gate (completion = deposit) | tower hooks/write-gate.mjs | Stop exit-2 | write-gate-pi.ts → sendUserMessage | write-gate-cursor.sh → followup_message |
| spawn-door (raw fleet verbs refused) | spawn-door.sh / spawn-door-pi.ts | PreToolUse | tool_call block | preToolUse deny |
| slim (6-verb output compaction) | slim-guard.sh / -cursor.sh / slim-rewrite.ts | ✓ | ✓ | ✓ |
| grounding (read-before-rewrite) | bodies in harness trees (adoption pending) | ✓ | ✓ | — (DOCTRINE) |
| credential-guard (staged-secret scan) | credential-guard.sh (git pre-commit, `--install`) | git-level, any harness | | |
| session boundary/capture (legs 1–6) | session-start.mjs / session-boundary-pi.ts / -cursor.sh / session-capture-cursor.mjs | ✓ | ✓ | ✓ |
| stop-verdict + herdr-task-report ($verdict/$task) | stop-verdict.mjs / herdr-task-report.sh+.ts | ✓ | ✓ | verdict only |
| stop-guard (operator relay guarantee) / prompt-inject / ask-bridge / odometer / enforce-brief / deposit-reminder | tower hooks | ✓ | partial (tower-auto/lifecycle) | — (per parity ledger) |
| Harness wiring files | — | `~/.claude/settings.json` (9 events) + `~/.claude/hooks/` | `~/.pi/agent/extensions/` (11 .ts: 5 shims → canonical, 5 native, 1 vendored) + `~/.pi/agent/rules/work-file-format.md` | `~/.cursor/hooks.json` (5 events) + `~/.cursor/hooks/` |
| VERIFY manifests + oracles (credential-guard, session-boundary ×2; component-verify harness) | primitives/hooks/VERIFY-*.toml + test/ | CORE → gates/ (P4 expands coverage) |

## L5 · MIND — circadian, memory and sleep

Engine CORE → **mind/**; the mind repo itself is DATA (plain git, **no
remote ever**; USER.md never leaves the machine). Repo `~/circadian` (509
pass / 0 fail, doctor 14 ok / 0 fail, pushed).

| Piece | Role |
|---|---|
| Organs (hook-wired): wake.ts + wake-payload.ts · sleep.ts · graze.ts · status.ts · circadian-mind.ts (pi extension) | Boot injection (kill-switch aware) · episode deposit (pending queue + drain, fleet-packet gated) · in-flight digestion (throttled, obs-sampled) · vitals strip + verdicts · pi port |
| Metabolism (launchd): rem-popmem.ts (`com.circadian.rem` 09:00/21:00 + rem-catchup) · doctor.ts (`com.circadian.doctor` 09:05/21:05) · janitor.ts | ABSORB→judge→decay→render→greeting→commit (the ONLY mind-repo committer) · health surface · reaping |
| Population machinery: atoms, decay, ltp, render, replay (batch cat-file), stack, zoom, interfere, immune, redundancy, relindex, scorecard, obs, llm (truncation-honest), provenance (fleet-packet gate, default ALL harnesses), transcript-format (CC/pi/cursor normalizer), usermutate, migrate, backfill, gauntlet(+stub) | The belief-population engine per MIND-SPEC's five sentences + Nine Laws |
| Mind repo (DATA): MIND-SPEC.md, CONSTITUTION.md + CONSTITUTION-JOSH.md, SELF.md, USER.md, NOW.md, greeting.md, beliefs/ (427 atoms) + beliefs.jsonl, episodes/, meals/, digested.jsonl, scoreboard.jsonl, compost.md, render-manifest.json, ANATOMY.md, SELF-TALK.md | The person; unwritable constitution; kill switch (R7, judgment-unit counting) |
| CC auto-memory (`~/.claude/projects/-Users-jrg/memory/`) | DATA — harness-local operator memory; parallel organ, not circadian's |

## L6 · GENOME + MIRROR — agent-core

Repo `~/agent-core` (green, pushed). Kernel CORE → **kernel/**; the zig CLI
CORE → **mirror/** (already its own repo/submodule: `jcbbge/agent-core-cli`).

| Piece | Count / detail | Disposition |
|---|---|---|
| primitives/AGENTS.md (canonical core) + directives/{claude-code,pi,cursor}.md | composed → `~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md` | CORE → kernel/ |
| rules/ | 10: ENFORCEMENT, control-flow, session-lifecycle, tower-orchestration, debugging-discipline, long-running-processes, secrets, backend-first-security, git, work-file-format | CORE → kernel/ |
| profiles/ | concierge, coordinator, orchestrator, coder, researcher + PROFILES.md + models.json + selection.json (gitignored) + profile-model CLI | CORE → kernel/ (models.json = the ONE sanctioned model-name home) |
| skills/ | 87 in store; **34 registered** (see P5 curation debt for the 53) | CORE → kernel/skills (registered set); triage the rest |
| subagents/ (10) + commands/ (2: tabs, tower) + plugins/ (4 pi: peer-session, propose-extension, tower, uptime — unsynced by design) | | CORE → kernel/ |
| Registry `~/.agent-core/registry` — **77 primitives**: 1 directive, 34 skill, 26 hook, 4 tool, 10 agents, 2 command | | DATA (machine state; the framework ships a template) |
| cli/ (zig): registry parser, sync, status, presence (link/check/binary + machine pseudo-harness), port, hooks_json merge, skilldir, checksum; 10/10 + 53/53 tests | THE MIRROR — the single honest parity instrument | CORE → mirror/ |
| briefs/ (89 entries), research/ (28+), AUDIT-*.md, WORK/TAXONOMY/PRIMER, .verify/ (38) | working history | DATA (history rides in git; not framework code) |

## L7 · METHOD — Made Well

| Piece | Where | Disposition |
|---|---|---|
| Template (SPEC v1: ledger-and-door, RFC-2119, Rule 1 portability, no-databases; MADEWELL.md promise; install.sh; cartridges/dev pack) | `~/madewell` | CORE → method/ — **the skeleton the whole framework productizes into** |
| Lab (INDEX module board ○◐●, rubric 3×3 Craft/Beauty/Care × Maker/User/Agent, meta-prompt v3, inner/outer modules, polaroids, temporal-axis) | `~/.madewell-meta` (`~/.local/bin/mw` points here) | CORE → method/lab |
| statem (Made Well state tracker → Tower traces + tab glyphs) + twr (board tail) + fleet-task (CORD/ORCH whiteboard, `~/.fleet-tasks/state.json`) | primitives/tools/ | CORE → method/ (statem, fleet-task) · field/ (twr) |
| Instances: `~/Infinity/arc/.madewell` (vendored mw, cycles, packs), any project's `.madewell/` | projects | PROJECT |

## L8 · ROLES — the org chart

concierge → CORD → ORCH → AGNT/SAGT profiles + thin loader skills + the
control-flow hierarchy law. All CORE → kernel/ (already counted in L6).
Executed on L1 panes, coordinated through L3, gated by L4.

## L9 · INSTRUMENTS — sense organs and prosthetics

| Piece | What | Disposition |
|---|---|---|
| slim (486K zig) — the rtk replacement | 6-verb output compactor + rewrite; truth law: exit codes propagate, truncation marked | CORE → instruments/ |
| latch (zig) | blocking wait on panes/files/board/gates (`~/.fleet/gates/`); truth-legal exit codes | CORE → instruments/ |
| vein (zig) | transcript-corpus miner (CC+pi) — THE acceptance instrument for behavior claims | CORE → instruments/ |
| assay (zig) | memory-propagation instrument; golden set; decoy-FP 0/25 honesty metric | CORE → instruments/ |
| bigfile (bun + tree-sitter, MCP CC/cursor) | parse-once navigation of 10k+ line files | CORE → instruments/ |
| super-search (5-layer router skill: colgrep · coraline · pickbrain · rg · bigfile) | one search door | CORE → instruments/ |
| component-verify + boot-card | VERIFY.toml runner + boundary-contract auditor | CORE → mirror/ (they are mirror-adjacent acceptance) |
| colgrep, coraline, pickbrain (cargo) · composto (homebrew) · rg, jq, git-filter-repo, bun, zig, python3, yt-dlp/WhisperKit (video-transcribe), dev-browser CLI | external products the router/skills call | ADAPTER |
| `~/bin` extras: tabexport, tablist, get-safari-tabs(+.scpt), zig-index | personal utilities (icloud-tabs family, zig indexer) | CORE → instruments/misc (tabs trio) · zig-index: evaluate at P5 |
| `~/bin/alembic` | retired estate remnant | RETIRE (delete at P5) |
| `~/bin/arc`, `~/bin/constellation` | project CLIs | PROJECT |
| `~/.local/bin/droid`, `uv` | operator-installed products, unreferenced by doctrine | ADAPTER (leave; not estate) |

## L10 · BRIDGES — cursor-shim

All CORE → **bridges/cursor** (already rip-out-able by design — the model
for every future engine bridge). Repo `~/cursor-shim`.

cursor-spine (spawn primitive, profile+model resolved from kernel) ·
cursor-fleet (up/orch/make/fanout/down; refuses outside herdr; `make` =
hard coder/test-maker bifurcation in separate worktrees) · profiles
(coder, test-maker, tester, arbiter) · rules/cursor-fleet.md · levers/ (7 +
CONTRACT) · docs (inner-loop-verify, qa-verify.sh 71/71) · bolt-on/rip-out ·
runtime state (.instr 693, .verify 215, .spawned.jsonl — DATA).

## L11 · DIGESTION — rumen (missed in rev 1; operator-flagged)

**What it is:** "A digestive system that metabolizes any opinion-source into
a self-pruning set of **fences, judges, signs, and a lexicon** — persona-
free, stack-free, domain-free" (ENGINE-SPEC gen 9). Rumen is the
project-convention sibling of ENFORCEMENT.md: where the enforcement ledger
compiles HOUSE law into gates, rumen compiles a PROJECT's conventions into
walls an agent physically cannot ignore — without hand-authoring rules. The
Tower cabinet already recognizes it: `cli.mjs projects` treats a `.rumen/`
dir as a project drawer, peer to `.madewell/`.

| Piece | Where | Disposition |
|---|---|---|
| Engine + specs: README, ENGINE-SPEC.md (gen 9), PACK-CONTRACT.md, NOMENCLATURE.md, RISKS.md, ROADMAP.md | `~/rumen` | CORE → **rumen/** (its own package — it is a product tier, like method/) |
| metabolism/ (metabolism.mjs, harness.mjs, fixtures.mjs) | `~/rumen/metabolism` | CORE → rumen/ |
| runs/ (bolus digests 2026-06-17…, RERUN-PROTOCOL.md) | `~/rumen/runs` | DATA (run history) |
| Live instance: `.rumen/` in Arc — packs (frontend/schema/testing.json), walls/registry.json, ledger.jsonl, history.jsonl, install-hooks.sh, lab/, AGENT.md, MANIFEST.md | `~/Infinity/arc/.rumen` | PROJECT |

Unification note: rumen's fence thesis and the gates plane (L4) are the same
law at two altitudes. P2 gains a sixth contract: the **Pack contract**
(already drafted as PACK-CONTRACT.md) — how a digested convention becomes an
enforceable wall through the same DOOR/HOOK machinery.

## L12 · GATEWAY — strudel (missed in rev 1; operator-flagged)

**What it is:** the collection-scaling thesis — "each primitive kind is a
collection, and collections fail the same way at scale: the agent reverts to
a familiar few. Don't register the collection into context; **index it and
search it by intent**" (`search → prep → bake`). The runtime complement to
the mirror: mirror manages what is DEPLOYED; gateway serves what is USED.

| Piece | Where | Disposition |
|---|---|---|
| Strudel core (ARCHITECTURE.md, project-brief, docs/, bake_trace_analysis) | `~/strudel` | CORE → **gateway/** (P2 decides the mirror↔gateway relationship; until then it stays a live project) |
| **Utensils — the rewritten-replacement family** (vendored TS wrappers): batch.ts, bigfile.ts, colgrep.ts, composto.ts, diff.ts, tldraw.ts, tree.ts, undo.ts, workspace.ts + `_lib/` | `~/.strudel/utensils/` | CORE → gateway/utensils — these are the "tool/MCP rewrites" class: each wraps or replaces a raw tool/MCP with a budgeted, agent-shaped surface |
| utensils/kotadb.ts + `_retired/` | same | RETIRE (kotadb dead; retired drawer carries history) |
| evals (`~/evals`) | | PROJECT (strudel's measurement companion) |

## Replacement lineage (the "rewritten to replace X" ledger — explicit)

| Replacement | Replaced | Where the old one went |
|---|---|---|
| slim (Zig, 6 verbs + guards ×3 harnesses) | rtk pipeline (corrupted cat/diff/find/grep, integrity-pinned hook) | uninstalled 2026-08-11 |
| super-search (5-layer router skill) | pi `smart_search` extension | never installed as ext; router is the one door |
| Tower (field/) | alembic MCP + dream-daemon + corvus/lyra/spectra | `_deprecated-alembic/` attic |
| coraline+colgrep layers (in super-search) | KotaDB `:7001` cross-repo index | deleted 2026-08-14 (810MB) |
| herdr (+ spine) | bb agentic IDE · tmux-era workflows | bb uninstalled 2026-08-11 |
| pi + cursor-shim | opencode harness | dropped 2026-08-11 |
| strudel utensils (bigfile.ts, colgrep.ts, composto.ts, tldraw.ts …) | raw MCP registrations of the same tools (per-kind: MCP → intent-searched utensil) | MCPs retained only where load-bearing (tower, bigfile) |
| dead-letter + flocked append (tower-ledger) | hand-append + silent malformed rows | banned in docs, refused in code |
| `~/.zshrc.secrets` runtime load | inline secrets in tracked config | scrubbed from history 2026-08-14 |

## L13 · OPERATOR SURFACES + DEPLOY

| Piece | Disposition |
|---|---|
| Ghostty terminal → herdr TUI (sidebar, Engine Shop topology: CTRL/TOWR/TSKS + CONCIERGE pane) | ADAPTER (Ghostty) / CORE layouts via spine-startup |
| Notifications (doorbell rubric), window-title digest, greeting/inbox popups, statusline (circadian) | CORE (already counted in their layers) |
| dotfiles: launchagents/ (com.tower.rotate, com.circadian.*, com.localllm.server + deprecated/), shell/.zshrc (+ `~/.zshrc.secrets` runtime-load pattern), UTILITIES.md, PORTS.md | CORE → deploy/ (the installer's raw material) |
| **Complete bin census (rev 2 — every remaining binary accounted):** `agent` (cursor-agent alias wrapper) → bridges/ · `boot` (boot-card wrapper) → mirror/ · `dev` + dev.services (env snapshot) → instruments/misc · `sst` (speech-to-text wrapper) → instruments/misc · `mlx-serve` (LLM server launcher) → deploy/ · `future` = **Fut, the project-oriented multiplexer from the RuntimeAdapter research** → ADAPTER (candidate implementation #2 of the P2 RuntimeAdapter contract) · `tuna` (picker util) → rule at P5 · `amp`, `droid`, `headroom`, `omni`/`omnigent`, `uv`/`uvx`, `python3.11`, `cursor-agent`, `dev-browser` (homebrew, backs the dev-browser skill) → ADAPTER external products · `cursor-spine`, `cursor-fleet` (symlinks → cursor-shim; the enforced cursor spawn door + fleet verbs — bodies counted in L10) → bridges/cursor · `spine-spawn`, `herdr`, `profile-model` (~/bin wrappers/symlinks — bodies counted in L2/L6) → substrate/, kernel/ · `slim`, `latch`, `vein`, `assay`, `fleet-task`, `mw`, `component-verify` (installed binaries/symlinks — bodies counted in L9/L7) → their layers · `pi-update`, `hermes-python` broken symlinks → RETIRED (deleted 2026-08-14) · `get-safari-tabs`(+.scpt), `tabexport`, `tablist` + `~/icloud-tabs-inbox/` (DATA) → instruments/tabs · `zig-index` → rule at P5 · `alembic` → RETIRE (delete at P5) · `arc`, `constellation` → PROJECT | as listed |
| Adjacent estates NOT part of the framework: `~/content`, `~/Infinity/arc`, `~/pi-spine`, `~/source/*` checkouts | PROJECT / ADAPTER |
| Retired (never port): opencode, bb, SurrealDB:6000, alembic MCP + dream-daemon + corvus/lyra/spectra, KotaDB (deleted today), smart_search ext, substrate MCP, executor/anima/dev-brain/Manifold/UHP/Mesh-OS | RETIRE (already gone; listed so parity checklists never resurrect them) |

---

# PART II — THE SINGULAR PLAN

## The shape

One umbrella framework, working name yours to give (house-style candidates:
**loom** — the operator at the loom, every thread visible; **keel** — the
spine a whole ship mounts to; **marrow**). Layout:

```
<name>/
  kernel/       law · rules · profiles · directives · skills   (from agent-core/primitives)
  mirror/       registry + sync + status + component-verify    (from agent-core/cli — already a submodule)
  substrate/    RuntimeAdapter + reflexes                      (from herdr-spine)
  field/        the bus: server · cli · grammar · hooks · doctrine  (from primitives/mcps/tower)
  gates/        canonical enforcement bodies + VERIFY oracles  (from primitives/hooks)
  mind/         the memory ENGINE (never the mind data)        (from circadian/src)
  instruments/  slim · latch · vein · assay · bigfile · super-search · tabs
  method/       madewell template + lab + statem + fleet-task
  rumen/        the digestion engine: conventions → fences      (from ~/rumen)
  gateway/      strudel: primitives indexed + searched by intent, utensils  (from ~/strudel)
  bridges/      cursor/ (the shim, unchanged) · <future engines>/
  deploy/       installer · launchd plists · harness wiring writers · config blocks
```

Four things NEVER enter the repo: the mind data (private git, no remote),
`~/.tower` state, the registry instance, project `.madewell/`+`.rumen/`
instances. Three things stay external behind seams: the engines, the
multiplexer (herdr today; Fut/`future` is the standing candidate for
RuntimeAdapter implementation #2), and the cargo/brew tool row.

The three self-similar tiers, named so the design stays coherent: the
**mirror** knows what is deployed; the **gateway** serves what is used; the
**rumen** digests what must be enforced. One estate, three verbs — see,
reach, hold.

## The five invariants of the rollup (non-negotiable)

1. **The mirror is the gate.** `agent-core status` (→ `<name> status`) must
   read 0 stale / 0 missing after EVERY move. A move that blinds the mirror
   is reverted, not patched around.
2. **Green on main, pushed, at every step** (standing order 2026-08-14).
   No long-lived integration branch; the rollup is a sequence of small
   landed moves.
3. **Contracts before moves.** No file relocates until the seam it crosses
   has a written contract + VERIFY manifest (P2). This is your own Tower
   lesson applied to the migration itself.
4. **One canonical body per law, thin adapters per harness** (parity law).
   The rollup may never fork a gate.
5. **Behavior parity is measured, not asserted:** vein reproduces the
   command-verb and hook-fire distributions before/after each phase; assay
   proves memory propagation unchanged. The Part I tables are the checklist;
   every row gets ✓ ROLLED / ✓ SEAMED / ✓ EXCLUDED-BY-DESIGN.

## The phases

**P0 — done (today).** Estate green, pushed, mirrored (250/0/0), fully
inventoried (this document).

**P1 — the umbrella (1 sitting).** Create the repo; adopt `agent-core`,
`herdr-spine`, `circadian`, `cursor-shim`, `rumen`, `strudel` as submodules
beside the existing `cli` one. Write `bootstrap.sh`: fresh clone →
submodules → build zig tools → `deploy/install` (idempotent; today's
installers composed) → `status` green. Zero file moves; one clone now holds
the entire organism. *Acceptance:* bootstrap on a scratch $HOME passes
boot-card.

**P2 — the contracts (the real design work).** Freeze six seams as
versioned documents + VERIFY manifests in `kernel/contracts/`:
- **RuntimeAdapter** (substrate↔body): spawn / address / send / read /
  wait-for-status / lifecycle-events / tokens — herdr is implementation #1;
  Fut (`~/.local/bin/future`, already installed) is the standing candidate
  for implementation #2, which is what keeps the contract honest; your own
  stigmergy research already specified this seam.
- **Trace schema v1** (field): the four scents + board/ledger row families —
  COMMS-ARCH is 90% of it; freezing means consumers cite a version.
- **Gate surface** (gates↔engines): per-harness bind mechanics + refusal
  semantics (block / inject-continuation), the parity law as schema.
- **Law schema** (kernel): ENFORCEMENT rows become machine-readable so the
  mirror renders the ledger instead of humans maintaining it.
- **Organ API** (mind): wake/graze/sleep/rem as the only writers; provenance
  gate as the only door in.
- **Pack contract** (rumen↔gates): how a digested convention becomes an
  enforceable wall through the same DOOR/HOOK machinery — PACK-CONTRACT.md
  is the draft; freezing it also settles the mirror↔gateway↔rumen
  relationship (see, reach, hold).
*Acceptance:* component-verify runs all six manifests green.

**P3 — physical consolidation, leaf-first, mirror-gated.** Order chosen so
each move's dependents are already inside: instruments → gates → field →
substrate → method → mind engine → kernel+mirror last. Each move = relocate
into the package layout, retarget registry rows, run the layer's suite +
`status` + vein diff, land on main, push. Submodules dissolve into the
umbrella as their contents move (subtree merge preserves history).

**P4 — feature-parity gate.** Part I becomes the executable checklist: every
CORE row proven present + wired + tested in the new layout; every ADAPTER
row proven reachable through its contract; every DATA row proven untouched
(hashes); every RETIRE row proven absent. vein before/after corpus study is
the sign-off instrument. Nothing ships while a row is unchecked.

**P5 — curation debt (folded into P3, listed so it cannot vanish).**
Triage the 53 unregistered skills (register / attic / delete). Adopt the
grounding-hook bodies into gates/ (today they live in harness trees).
Delete `~/bin/alembic`; rule on `zig-index` and `tuna`; move
`utensils/kotadb.ts` into strudel's `_retired/`. Compile the DOCTRINE queue:
brief-lint (provider/model names), epistemics SOURCES check, statem-gated
reaping. Decide SubagentStop. Normalize `Infinity` path casing at the one
remaining site (cursor-shim markers). (Done already, rev 2: broken
`pi-update` + `hermes-python` symlinks deleted.)

**P6 — productization.** The Made Well SPEC is the product skeleton: one
`install.sh`, one entrypoint, the MADEWELL.md promise as the framework's
face ("you don't have to manage the system"), docs regenerated FROM the
mirror (the map is rendered, so the map cannot rot — this document is the
last hand-written inventory this machine should ever need).

## Sequencing reality

P1 is an afternoon. P2 is the thinking — run it as a Made Well Discovery →
Commit on each contract. P3 is mechanical once P2 exists and parallelizes
per layer under the invariants. P4 is a day of instrument runs. The whole
rollup is landable in small green pushes with the estate fully operational
throughout — at no point is there a "big switch."

SOURCES: live enumeration 2026-08-14 (registry grep: 77 primitives; dir
counts; launchctl list; ~/bin + ~/.local/bin listings; spine bin/handler
counts; circadian src listing), five sweep reports this session, agent-core
status 250/0/0, suite results as committed on main.
