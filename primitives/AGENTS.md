# Global Agent Context
**Updated:** 2026-08-12

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
| Herdr | active — THE substrate (control-flow.md) | `~/agent-core/primitives/skills/herdr/SKILL.md` (canonical; `~/.claude/skills/herdr` + `~/.pi/agent/skills/herdr` symlink to it) — invoke ambiently when spawning, naming, or observing agents |
| Tower | active | MCP `mcp__tower__*` (CC) · `~/.tower/cli.mjs` + `board.jsonl` (everywhere) — see below |
| Coraline | active | CLI `coraline` (33 languages) — no MCP registration |
| Composto | active | CLI `composto` — IR compression; TS/JS/Python/Go/Rust, NOT Swift/Zig |
| slim | active (2026-08-11) | 6-verb output compactor (`~/.local/bin/slim`; source `~/agent-core/primitives/tools/slim/`, Zig) — compacts ls/ps/wc/df/git status/git log only; truth law: child exit codes propagate, unparseable output passes raw, truncation always marked. CC: PreToolUse `slim-guard.sh` · pi: `slim-rewrite` extension · cursor: preToolUse `slim-guard-cursor.sh` (`~/.cursor/hooks.json`). Pipes/compounds/machine-format flags never rewritten |
| latch | active (2026-08-11) | blocking wait/hold primitive (`~/.local/bin/latch`; source `primitives/tools/latch/`, Zig) — wait on pane state/files/board/gates with distinct exit codes; replaces polling loops |
| vein | active (2026-08-11) | transcript-corpus miner (`~/.local/bin/vein`; source `primitives/tools/vein/`, Zig) — reproduces the session-mining studies in seconds; the acceptance instrument for tooling decisions |
| assay | active (2026-08-11) | memory-propagation instrument (source `primitives/tools/assay/`, Zig) — cohort tool, proposes only; golden set = 5 hand-labeled sessions, decoy-FP 0/25 is the standing honesty metric |
| cursor-shim | active (2026-08-11, operator-sanctioned reversal of the same-day CLI retirement) | `~/cursor-shim/` — self-contained, rip-out-able bridge running `cursor-agent` tiers inside herdr+Tower topology; spawn via `cursor-fleet` / `cursor-spine` ONLY (spine-spawn still refuses cursor kinds and points there); enforces the Made Well Verify beat (bifurcated test/impl worktrees, arbiter, nQ≤3). Docs: `~/cursor-shim/docs/inner-loop-verify.md`; rules: `~/cursor-shim/rules/cursor-fleet.md`; proof: `docs/qa-verify.sh` (71/71). Delete the dir = integration gone |
| Bigfile | active | pi: via super-search `--file` · CC: `mcp__bigfile__*` · cursor: MCP `bigfile` (`~/.cursor/mcp.json` → `bun run primitives/tools/bigfile/src/server.ts`) |

## Tower — the message bus (orchestration convention)

Tower is how deliverables, questions, and findings move between the user, the
coordinator, and every worker. Agents live in the terminal substrate; Tower
is the bus (how their output reaches the user).

- **Server:** MCP stdio (CC registration `mcp__tower__*` runs
  `~/.tower/server.mjs`; canonical home + state: `~/.tower/`).
- **State:** append-only JSONL — `board.jsonl` (claims/findings),
  `ledger.jsonl` (messages/questions/acks), `odometer.jsonl` (token burn),
  `deliverables/`, `flight/`. Any harness can append via `bun ~/.tower/cli.mjs`.
- **Tools:** `send_to_user` · `ask_user` · `reply` · `check_inbox` ·
  `mark_relayed` · `board_post` · `board_read`.
- **Verbatim guarantee (COMMS-ARCH routing, 2026-08-10):** only
  operator-addressed mail blocks turn-end — `alert`s, `deliverable`s carrying
  `to:"operator"`, and open `question`s. Status flips are board-only
  (done-fabrication OFF by default); fleet mail flows up the hierarchy and is
  never relayed verbatim to the user. Full law: `~/.tower/COMMS-ARCH.md`.
- **Doorbell (hard rule):** anything the USER must see goes to the Tower bus
  AND a desktop notification (mechanism per the herdr skill:
  `herdr notification show "<title>" --body "<one line>" --sound request`)
  in the same breath. A prompt to a pane isn't delivered until its
  `agent_status` flips to `working`.
- Full protocol: `~/agent-core/primitives/rules/tower-orchestration.md`.

## Search — one canonical router

Every harness: `bun ~/agent-core/primitives/skills/super-search/search.ts
"<query>" [--pattern] [--repo] [--file] [--scope] [--limit]` (CC + cursor:
also the `super-search` skill wrapper).
Canonical home: `~/agent-core/primitives/skills/super-search/` —
`~/.claude/skills/super-search` and `~/.cursor/skills-cursor/super-search`
symlink to it.
Layers: colgrep (project) · coraline (`~/source`) · pickbrain (memory) ·
ripgrep (exact) · bigfile (>3k-line files).
Extend this skill — never build a second router.

Layers are also callable individually: `grep` (ripgrep); `colgrep`,
`coraline`, `pickbrain`, `composto` CLIs; CC additionally has
`mcp__bigfile__*` MCP tools; cursor has the `bigfile` MCP server.

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
long-running-processes, tower-orchestration, git, secrets,
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
state), `tower-auto.ts` (ambient Tower posting), `tower-lifecycle.ts`
(flight-recorder / stop-verdict / deposit-reminder port), `slim-rewrite.ts` +
`grounding-hook.ts` (shims → `~/agent-core/primitives/hooks/`),
`write-gate.ts` + `spawn-door.ts` (2026-08-14 enforcement adapters, shims →
`primitives/hooks/write-gate-pi.ts` / `spawn-door-pi.ts` — see
`primitives/rules/ENFORCEMENT.md`). Removed 2026-08-02:
`strudel/` (parity with CC — both harnesses reach the stack via super-search
+ CLIs; strudel itself untouched at `~/strudel`). Not installed: subagent,
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
Herdr is THE substrate: workers run as herdr panes (visible, surviving),
spawned via the herdr skill — registration names lowercase-kebab, human
name + `$task` stamped at birth, reaped when done (done = gone).
Spawner pre-verifies every command, path, and endpoint; spawn prompts carry
Pre-Verified Facts / Tasks with done-when / Report-back.
Comms law: `~/.tower/COMMS-ARCH.md` — one message, one audience, once, in
full; status is not mail; fleet-mail board topics are
`<project-slug>/<topic>`; only `to:"operator"` mail reaches the operator
plane.

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
| Strudel + evals | `~/strudel/`, `~/evals/` | repo docs + session memory |

## Retired — never reference

~~opencode harness (2026-08-11; dropped from agent-core registry,
`~/.config/opencode/` targets dead)~~ **CORRECTION 2026-08-15 (operator):
retirement STALE — opencode is live again as the concierge's spawn seat for
cursor fleets (profile-model rulings). Evidence: tup finding-J. The
2026-08-11 entry stands struck-through beside this correction per kernel
law; do not re-retire without an operator ruling.** · bb agentic IDE (2026-08-11;
uninstalled — app, CLIs, `~/.bb` data all removed) ·
SurrealDB `:6000` + `com.surrealdb.*` (2026-08-02; data archived `~/surreal/`,
plists `~/dotfiles/launchagents/deprecated/`) · alembic MCP + dream-daemon +
corvus/lyra/spectra agents (`_deprecated-alembic/`) · KotaDB `:7001` +
`com.kotadb.server` launch agent + CC `kotadb` HTTP MCP (2026-08-06; launchd
agent booted out, stale `~/Library/LaunchAgents` symlink + `~/.claude.json`
registration removed — DB still at `~/.kotadb/kota.db`) · smart_search pi
extension (never installed; router = super-search) · substrate MCP / "breath
lifecycle" (never registered) · coraline MCP registration (CLI only) ·
executor `:8788`, anima `:3098`, dev-brain `:3097`, SurrealDB `:8002`,
Manifold / UHP / Mesh-OS.

## Harness deltas

Harness deltas live in `primitives/directives/<harness>.md`; deployed entrypoints are composed — edit sources, not deployed files.

- **prime:** pi-based RLM runtime; harness-specific doc at
  `~/.prime/agent/AGENTS.md` (which defers to this file for machine-wide
  context)

## Fleet spawn + comms (law, 2026-08-11; amended 2026-08-12)

- **Spawn (agnostic core):** Provider/model/harness/platform/vendor-agnostic by design —
  nothing in the canonical core expresses a harness preference. Fleets are
  harness-homogeneous: the root spawn's harness defines every downstream agent (pi
  root → pi fleet; claude root → claude fleet; cursor root → cursor fleet). Harness
  selection is the operator's per-mission intake decision, cost-driven. Per-harness
  spawn verbs, flags, and paths live in `primitives/directives/<harness>.md`.
- **Briefs (law):** Briefs name **profiles/roles only** — never provider, model,
  or `--kind`. Models via `profile-model` at spawn; spawn verbs only in harness
  directives. A brief that hardcodes harness or model is invalid.
- **Hierarchy:** CORD → ORCH → AGNT/SAGT via the harness's spawn path — see deltas.
  Briefs on disk; CLAIM-first / board findings / `.done`-last.
- **Comms:** `~/.tower/COMMS-ARCH.md`. Status (idle/done) is NOT mail and is
  NOT a summons. Fleet mail = Tower board (`<project>/<topic>`). Operator
  mail only when `to:"operator"`. Collect via board + `.done` + CTRL/TOWR —
  **never** re-prompt idle panes for status.
- **Wake:** Circadian injects memory as pure data (`<mind:greeting>` block
  included when fitness allows); it carries NO behavioral mandate and no
  role-suppression machinery (removed 2026-08-12, circadian a2a01a7 — law 1,
  `primitives/rules/session-lifecycle.md`). Speaking the greeting is the
  concierge profile's job; fleet profiles (CORD/ORCH) carry the no-greeting
  norm. Brief overrides everything at wake.
- **Contrived smoke briefs:** `~/agent-core/briefs/fleet-smoke/`
