# Global Agent Context
**Updated:** 2026-08-16

Loaded by every harness — claude, pi, prime, cursor. CANONICAL CORE:
`~/agent-core/primitives/AGENTS.md` (git-tracked). Deployed entrypoints are
composed at sync time (`~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`,
`~/AGENTS.md`); prime's own global (`~/.prime/agent/AGENTS.md`) opens by
directing every session to read this file.
Edit the canonical core and per-harness deltas in `primitives/directives/`,
not deployed entrypoints. PROVIDER/MODEL-AGNOSTIC by contract:
no provider names outside per-harness delta files; capabilities are
described by path and CLI, never by model. FACTUAL reference (what exists, how to
reach it). Tool-preference doctrine lives in skills and agent definitions —
this file is also injected into eval-harness arms, and preference language
here contaminates control arms.

## Stack

| Tool | Status | Access |
|---|---|---|
| Herdr | active — live multiplexer (panes, detection, CLI + socket) | `~/agent-core/primitives/skills/herdr/SKILL.md` — fleet agents invoke when operating panes. The operator does not. |
| Muster | active — durable Lisp runtime; herdr is the pane seam | `~/.claude/skills/muster/SKILL.md` — concierge/CORD invoke for findings, spawn-door law, supervisor, mirror, durable comms. Wired runtime today = herdr. |
| Coraline | active | CLI `coraline` — symbol graph, callers, impact; any repo after `init`+`index`; 33 languages; no MCP |
| colgrep | active | CLI `colgrep` — semantic grep of the working tree |
| pickbrain | active | CLI `pickbrain` — semantic search of past agent sessions, not source |
| Composto | active | CLI `composto` — IR compression; TS/JS/Python/Go/Rust, NOT Swift/Zig |
| slim | active (2026-08-11) | 6-verb output compactor (`~/.local/bin/slim`; source `~/agent-core/primitives/tools/slim/`, Zig) — compacts ls/ps/wc/df/git status/git log only; truth law: child exit codes propagate, unparseable output passes raw, truncation always marked. CC: PreToolUse `slim-guard.sh` · pi: `slim-rewrite` extension · harness deltas deploy `slim-guard-cursor.sh` where applicable |
| latch | active (2026-08-11) | blocking wait/hold primitive (`~/.local/bin/latch`; source `primitives/tools/latch/`, Zig) — wait on pane state/files/board/gates with distinct exit codes; replaces polling loops |
| vein | active (2026-08-11) | transcript-corpus miner (`~/.local/bin/vein`; source `primitives/tools/vein/`, Zig) — the acceptance instrument for "did agents actually run X" |
| assay | active (2026-08-11) | memory-propagation instrument (source `primitives/tools/assay/`, Zig) — cohort tool, proposes only; golden set = 5 hand-labeled sessions, decoy-FP 0/25 is the standing honesty metric |
| Bigfile | active | MCP on CC (`mcp__bigfile__*`) and harness MCP where registered; CLI/library `~/agent-core/primitives/tools/bigfile/`. Never Read a 3k+ PHP/JS/TS/TSX file. |

## Utensils — call them by name

No search router. Super-search was retired 2026-08-16 (unused; its auto-route
only woke Coraline for two repo names). Every harness deploys a skill per
utensil. Call the binary or MCP. Do not invent a second router.

HOOK (`utensil-guard.mjs` / `utensil-guard-pi.ts`, 2026-08-16): native Read of
a 3k+ PHP/JS/TS/TSX file, natural-language Grep, bare `sleep` / sleep-poll,
and transcript-dir greps are denied and pointed at the utensil. Bypass:
`UTENSIL_GUARD=off`. coraline and composto remain skill-only (no safe matcher).

| Need | Utensil |
|---|---|
| Meaning-search this working tree | `colgrep "<query>"` (hook-denied NL Grep) |
| Symbol / callers / impact (any indexed repo) | `coraline query` / `callers` / `impact` |
| Exact string or regex | `rg` or the harness Grep tool |
| One 3k+ PHP/JS/TS/TSX file | bigfile MCP (`load` → `symbols`/`grep`/`peek`) (hook-denied Read) |
| Map of a file, not the body | `composto ir <file> L1` |
| What did we decide last session | `pickbrain "<recall>"` (hook-denied transcript-dir grep) |
| Noisy `ls`/`ps`/`git status`/`git log` | slim (hook-enforced on the six verbs) |
| Wait, don't poll | `latch wait --pane\|--file\|--board` (hook-denied sleep-poll) |
| Did agents actually use the pantry | `vein report --last N` |
| Did wake-memory change behavior | `assay` |

## Comms — durable fleet mail (muster skill)

Deliverables, questions, and findings move between the user, the coordinator,
and every worker through the **muster skill**
(`~/.claude/skills/muster/SKILL.md`) — deposit, pending, collect,
status. Pane observation uses the **herdr skill**. Comms law:
`~/agent-core/primitives/rules/comms-arch.md` and
`~/agent-core/primitives/rules/control-flow.md` §Communications.

- **Fleet mail:** `~/muster/bin/muster-deposit --from <role> --to <parent> --kind
  report|done|need-help|question --body "<...>"`. Read inbox:
  `read the inbox via the runtime`. Full verbs: muster skill.
- **Verbatim guarantee:** only operator-addressed mail blocks turn-end — see
  comms-arch.md plane routing.
- **Doorbell (hard rule):** anything the USER must see gets a desktop
  notification (herdr skill:
  `herdr notification show "<title>" --body "<one line>" --sound request`)
  in the same breath. A prompt to a pane isn't delivered until its
  `agent_status` flips to `working`.

## Bigfile — huge-file navigation

Parse once with tree-sitter (PHP/JS/TS/TSX, files >~3,000 lines), then bounded
queries: `load → stats → symbols/grep → peek → edit`. peek/slice cap 400
lines, grep caps 200 hits; no verb returns the file body. Symbol refs accept
`.` `::` `\`. Code: `~/agent-core/primitives/tools/bigfile/`.

## Composto — code-to-IR

`composto ir <file> L0|L1` · `composto context <dir> --budget 4000` ·
`composto scan <dir>`. IR strips strings/comments — raw read before edits.

## System services (always-on; never provision your own)

| Need | Endpoint | Reference |
|---|---|---|
| Local LLM (embeddings, chat, light reasoning) | `http://127.0.0.1:10240/v1` (OpenAI-compatible) | `~/dotfiles/launchagents/com.localllm.server.plist` |

Index `~/dotfiles/UTILITIES.md` · ports `~/dotfiles/PORTS.md`.
Project-specific services are NOT cross-project.

## Rules (runtime, per-harness config)

Canonical store: `~/agent-core/primitives/rules/` (debugging-discipline,
long-running-processes, comms-arch, git, worktree-lifecycle, secrets,
backend-first-security, work-file-format). The commit convention lives inline
in this file (Work tracking), not in the rule store. Project rules surface
per harness (CC: `.claude/rules` + `@`-imports; pi: `~/.pi/agent/rules/`).
Read on demand — not auto-inlined here.

**Enforcement law (2026-08-14):** every law names its enforcer — DOOR
(sanctioned tool's only path), HOOK (mechanical refusal), or the honest
DOCTRINE label (unenforced; a compilation bug, not a rule to remember
harder). Ledger + doors (`spine-workspace`, `spine-ruling`, `spawn-door.sh`,
write-gate registration): `primitives/rules/ENFORCEMENT.md`. A new law lands
with its enforcer named or its DOCTRINE label explicit.

## Pi extensions (pi only)

`~/.pi/agent/extensions/*.ts`, each `export default function(pi)`, jiti-loaded,
`/reload` hot-reloads. Installed: `circadian-mind.ts` (memory hooks),
`herdr-agent-state.ts` + `herdr-task-report.ts` (herdr-managed sidebar
state), `slim-rewrite.ts` + `grounding-hook.ts` (shims →
`~/agent-core/primitives/hooks/`), `write-gate.ts` + `spawn-door.ts`
(2026-08-14 enforcement adapters, shims → `primitives/hooks/write-gate-pi.ts`
/ `spawn-door-pi.ts` — see `primitives/rules/ENFORCEMENT.md`). Leftover
installed filenames (dead): `tower-auto.ts`, `tower-lifecycle.ts` — retired
bus; do not call. Removed 2026-08-02:
`strudel/` (parity with CC — both harnesses reach the stack via utensil
CLIs + MCP; strudel itself untouched at `~/strudel`). Not installed: subagent,
smart-search, propose-extension, peer-session — spawn agents via the herdr
skill (invoke on demand).

## Epistemics (every session)

- A stated fact requires a source acquired THIS session (file read, command
  run, URL fetched, user's words). No "well-known" exceptions.
- Acquire before assert: for external-reality values, fetch FIRST, then write.
- No source → omit, write UNKNOWN, or ask. Guess-and-disclose is banned.
- Underspecified task → ask BEFORE work, not caveats after.
  "I don't know" is a complete answer.
- Commits carrying external values get a SOURCES: line.

## Write discipline (law, 2026-08-12)

The grounding guard (PreToolUse on Edit/Write — CC `grounding-hook.mjs`,
pi `grounding-hook.ts`) blocks a second consecutive write to the same file
with no evidence loaded between. Work WITH its contract, never bounce off it:

- **One write per file per thought.** Consecutive edits to one file are
  composed into a SINGLE Edit/Write call before firing — never a queue of
  small edits to the same target.
- Genuinely need a second write to the same file? **Read it first, by
  contract** — the read comes before the attempt, not after the refusal.
  If the door says push, do not pull first.

## Control flow (operator law, 2026-08-10)

Canonical doc: `~/agent-core/primitives/rules/control-flow.md`. The ONE
hierarchy for agentic work: Operator → Concierge → `CORD [project]` (one
coordinator per project; reads/verifies/briefs, never implements) →
`ORCH [feature/bug/chore]` → `AGNT [task]` / `SAGT [todo]`.

**Operator entry:** in Ghostty, type `herdr pi` (or `claude`, `cursor`,
`prime`). That starts herdr, that harness, and the concierge. That harness
is the desk default until you start with a different one. After that you
only talk to the concierge.

Workers run as herdr panes (visible, surviving). Spawn-door law (stamp
identity, deliver brief, verify the submit landed) lives in muster;
execution on this install is herdr + `muster-spawn` (forwarder
`~/bin/spine-spawn` OK). Registration names
lowercase-kebab, human name + `$task` stamped at birth, reaped when done
(done = gone). Spawner pre-verifies every command, path, and endpoint;
spawn prompts carry Pre-Verified Facts / Tasks with done-when / Report-back.
Comms law: invoke the **muster skill** and
`~/agent-core/primitives/rules/comms-arch.md` — one message, one audience,
once, in full; status is not mail; fleet mail via `~/muster/bin/muster-deposit` up the
hierarchy; only operator-addressed mail reaches the operator plane.

## Work tracking & commits

Repo is truth: open = `git diff`, done = `git log`. No side-ledgers.

```
<type>(<scope>): <summary>

PHASE: <Ideate | Plan | Implement | Verify>
DONE: <completed this session>
TODO: <the handoff; specific — write `TODO: —` if none>
BLOCKED: <omit if none>

Co-Authored-By: <Model Name> <noreply@provider.com>
```

Types: feat, fix, refactor, docs, test, chore, session. Stage explicitly —
never `git add -A`.

## Active projects

| Project | Path | Context lives in |
|---|---|---|
| Arc (event sales) | `~/Infinity/arc/` | repo `AGENTS.md` (invariants, delegation, testing) |

## Paused — do not surface

| Project | Path | Note |
|---|---|---|
| Strudel + evals | `~/strudel/`, `~/evals/` | Paused entirely (operator, 2026-08-16) — not in-flight, not this-week forward |

## Retired — never reference

~~opencode harness (2026-08-11; dropped from agent-core registry,
`~/.config/opencode/` targets dead)~~ **CORRECTION 2026-08-15 (operator):
retirement STALE — opencode is live again as the concierge's spawn seat for
cursor fleets (profile-model rulings). The
2026-08-11 entry stands struck-through beside this correction per kernel
law; do not re-retire without an operator ruling.** · bb agentic IDE (2026-08-11;
uninstalled — app, CLIs, `~/.bb` data all removed) ·
SurrealDB `:6000` + `com.surrealdb.*` (2026-08-02; data archived `~/surreal/`,
plists `~/dotfiles/launchagents/deprecated/`) · alembic MCP + dream-daemon +
corvus/lyra/spectra agents (`_deprecated-alembic/`) · KotaDB `:7001` +
`com.kotadb.server` launch agent + CC `kotadb` HTTP MCP (2026-08-06; launchd
agent booted out, stale `~/Library/LaunchAgents` symlink + `~/.claude.json`
registration removed — DB still at `~/.kotadb/kota.db`) · smart_search pi
extension (never installed) · **super-search router (2026-08-16; unused;
classifier only woke Coraline for two repo names — utensils are called by
name)** · substrate MCP / "breath
lifecycle" (never registered) · coraline MCP registration (CLI only) ·
executor `:8788`, anima `:3098`, dev-brain `:3097`, SurrealDB `:8002`,
Manifold / UHP / Mesh-OS.

## Harness deltas

Harness deltas live in `primitives/directives/<harness>.md`; deployed entrypoints are composed — edit sources, not deployed files.

- **prime:** pi-based RLM runtime; composed entry at `~/.prime/agent/AGENTS.md`
  (core+delta via `agent-core sync directive/core`); harness delta at
  `primitives/directives/prime-agent.md`

## Fleet spawn + comms (law, 2026-08-11; amended 2026-08-12)

- **Spawn (agnostic core):** Provider/model/harness/platform/vendor-agnostic by design —
  nothing in the canonical core expresses a harness preference. Fleets are
  harness-homogeneous: the root spawn's harness defines every downstream agent (pi
  root → pi fleet; claude root → claude fleet). Harness
  selection is the operator's per-mission intake decision, cost-driven. Per-harness
  spawn verbs, flags, and paths live in `primitives/directives/<harness>.md`.
- **Briefs (law):** Briefs name **profiles/roles only** — never provider, model,
  or `--kind`. Models via `profile-model` at spawn; spawn verbs only in harness
  directives. A brief that hardcodes harness or model is invalid.
- **Hierarchy:** Operator → Concierge → CORD → ORCH → AGNT/SAGT. CORD's parent
  is concierge unless a brief names another. CORD → ORCH → AGNT/SAGT via the
  harness's spawn path — see deltas. Briefs on disk; CLAIM-first / board
  findings / `.done`-last. CORD gates Land and `origin/main`; workers do not
  commit unless the brief orders it.
- **Comms:** invoke the **muster skill**; comms law in
  `~/agent-core/primitives/rules/comms-arch.md`. Status flip is NOT done.
  `report` is progress; `done` is Land evidence — `report` is not `done`.
  Fleet mail = `~/muster/bin/muster-deposit` up the hierarchy (muster durable log only). The runtime wakes
  the parent on a `done` deposit. Operator mail only when addressed to the
  operator (`nQ` to operator = 0 for fleet workers). Collect via
  the runtime folding the durable ledger — **never** re-prompt idle panes for status.
- **Stopping states (two only):** every done-when met with evidence, or
  `need-help` naming owner after finishing independent work. Empty inbox is not
  a stop. "I did not edit product" is not a stop. Dead claimant recovery is
  UNKNOWN — do not invent TTL or flags.
- **Wake:** Circadian injects memory as pure data (`<mind:greeting>` block
  included when fitness allows); it carries NO behavioral mandate and no
  role-suppression machinery (removed 2026-08-12, circadian a2a01a7 — law 1,
  `primitives/rules/session-lifecycle.md`). Speaking the greeting is the
  concierge profile's job; fleet profiles (CORD/ORCH) carry the no-greeting
  norm. Brief overrides everything at wake.
- **Contrived smoke briefs:** `~/agent-core/briefs/fleet-smoke/`
