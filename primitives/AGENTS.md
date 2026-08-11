# Global Agent Context
**Updated:** 2026-08-11

Loaded by every harness — claude, pi, prime. CANONICAL FILE:
`~/agent-core/primitives/AGENTS.md` (git-tracked). Wiring per harness:
`~/.pi/agent/AGENTS.md`, `~/.claude/CLAUDE.md`, and
`~/AGENTS.md` are symlinks to it; prime's own global
(`~/.prime/agent/AGENTS.md`) opens by directing every session to read this
file.
Edit the canonical only. PROVIDER/MODEL-AGNOSTIC by contract:
no provider names outside the Harness deltas section; capabilities are
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
| rtk | active (allowlisted 2026-08-11) | CLI token-saver proxy (`~/.local/bin/rtk`) — rewrites restricted to measured-safe verbs (ls/ps/wc/df/git status/git log); everything else runs raw. CC: PreToolUse `rtk-guard.sh` · pi: `rtk-rewrite` extension (same guard). NEVER edit `~/.claude/hooks/rtk-rewrite.sh` — rtk integrity-pins its hash; the guard wraps it from outside. Do not trust rtk-proxied diff/find/grep output as evidence — use full binary paths |
| Bigfile | active | pi: via super-search `--file` · CC: `mcp__bigfile__*` |

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

Every harness: `bun ~/.claude/skills/super-search/search.ts "<query>"
[--pattern] [--repo] [--file] [--scope] [--limit]` (CC: also the
`super-search` skill wrapper).
Layers: colgrep (project) · coraline (`~/source`) · pickbrain (memory) ·
ripgrep (exact) · bigfile (>3k-line files).
Extend this skill — never build a second router.

Layers are also callable individually: `grep` (ripgrep); `colgrep`,
`coraline`, `pickbrain`, `composto` CLIs; CC additionally has
`mcp__bigfile__*` MCP tools.

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

## Pi extensions (pi only)

`~/.pi/agent/extensions/*.ts`, each `export default function(pi)`, jiti-loaded,
`/reload` hot-reloads. Installed: `circadian-mind.ts` (memory hooks),
`herdr-agent-state.ts` + `herdr-task-report.ts` (herdr-managed sidebar
state), `tower-auto.ts` (ambient Tower posting), `tower-lifecycle.ts`
(flight-recorder / stop-verdict / deposit-reminder port), `rtk-rewrite.ts`
(shim → `~/agent-core/primitives/hooks/rtk-rewrite.ts`). Removed 2026-08-02:
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

opencode harness (2026-08-11; dropped from agent-core registry,
`~/.config/opencode/` targets dead) · bb agentic IDE (2026-08-11;
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

## Harness deltas (the only section that differs in application)

- **Claude Code:** `TodoWrite` for 3+ step tasks · MCP names
  `mcp__<server>__<tool>`
- **pi:** `/reload` hot-reload · skills under `~/.pi/agent/skills/` ·
  gateway model IDs `cursor/<id>[@ctx][:thinking|:fast]` (inference-gateway
  provider config in `~/.pi/agent/auth.json`; thinking and `:fast` do NOT
  stack — pass `--thinking` separately, spine-spawn supports it) ·
  daily entry = `herdr` then `herdr pi [profile[:option]]` · fleet =
  `spine-spawn … --kind pi --profile <name>[:option]` (profiles:
  `~/agent-core/primitives/profiles/` + `profile-model`)
- **prime:** pi-based RLM runtime; harness-specific doc at
  `~/.prime/agent/AGENTS.md` (which defers to this file for machine-wide
  context)

## Fleet spawn + comms (law, 2026-08-11)

- **Spawn:** `~/bin/spine-spawn` only (= `python3 ~/herdr-spine/bin/spine-spawn`).
  **Never** `bun …/spine-spawn` (bun parses the Python file as JS and dies).
- **Hierarchy:** CORD → ORCH → AGNT/SAGT via `spine-spawn orch|worker|fanout`.
  Briefs on disk; CLAIM-first / board findings / `.done`-last.
- **Comms:** `~/.tower/COMMS-ARCH.md`. Status (idle/done) is NOT mail and is
  NOT a summons. Fleet mail = Tower board (`<project>/<topic>`). Operator
  mail only when `to:"operator"`. Collect via board + `.done` + CTRL/TOWR —
  **never** re-prompt idle panes for status.
- **Wake:** Circadian still injects memory for fleet panes, but
  greeting-instruction is omitted when `role` is `1-CORD|2-ORCH|3-AGNT|4-SAGT`
  (or `CIRCADIAN_SKIP_GREETING=1`). Brief overrides greeting.
- **Contrived smoke briefs:** `~/agent-core/briefs/fleet-smoke/`
