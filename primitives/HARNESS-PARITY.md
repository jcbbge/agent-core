# HARNESS PARITY — the checklist (2026-08-12; enforcement layer absorbed 2026-08-14)

Operator mandate: no unknowns, no guessing. Every stack component has a named
mechanism per harness and a command that proves it. **The registry + `agent-core
status` is the living audit for everything registered; this file adds the
mechanisms that live outside the registry.** If a row's verify command fails,
work is not done — fix it or fix this file, never leave the two disagreeing.

Registering a new harness = fill every row of this table for it. A blank cell
is a NO, and NO means: name what it needs (copy, shim, port, or adapter) and
build it before calling the harness registered.

## The audit command

```bash
~/agent-core/cli/zig-out/bin/agent-core status            # every primitive
~/agent-core/cli/zig-out/bin/agent-core status --harness machine   # tool binaries, git hooks
```

**Current: 250 ok / 3 stale / 0 missing** (2026-08-14).

The three stale rows are real and named: `tool/slim`, `tool/latch`, and
`tool/vein` are installed at `~/.local/bin/` from builds that predate the last
edit under each tool's `src/`. `zig build` + reinstall clears them. They are
listed here rather than rounded away — a green number bought by not looking is
the failure mode this file exists to prevent.

**On the number 214.** Until 2026-08-14 this file claimed "214 ok / 0 stale /
0 missing", and that was true of the *registered subset* while being false of
the estate. The registry knew nothing of write-gate, spawn-door, the grounding
hook, credential-guard, the eleven Tower hooks, or any Zig binary — every one
of them live, load-bearing, and hand-wired. Topology audit P1-7 named the
blindness; Unit 3 closed it by teaching the registry three check-only verbs
(below). The count rose to 250 because the estate came into view, not because
anything was deployed.

## What `agent-core status` now owns

| Verb | Meaning | Managed? |
|---|---|---|
| `deploy` | agent-core owns the destination bytes | **yes** — `sync` writes |
| `link` | destination must be a symlink → the canonical source | no — check only |
| `check` | destination config must MENTION the wiring path (or an explicit `#needle`) | no — check only |
| `binary` | destination must be executable and no older than the tool's `src/` | no — check only |

`sync` reports check-only rows and writes nothing: an operator ruling
(2026-08-12) forbids agent-core from planting symlinks, and the rest of that
estate is installed by its own tools (Tower's installer, the harnesses,
`zig build`). Registering it buys **visibility, not ownership**. Semantics:
`cli/src/presence.zig`; proof: `cli/test/integration/presence_acceptance.sh`
(14 cases, including "sync leaves every check-only target byte-for-byte
unchanged").

**Why `check` reads config files instead of stat-ing scripts:** a hook script
sitting on disk enforces nothing. The load-bearing fact is the BINDING — the
harness config naming it on an event. An unwired gate reports ✗, not ✓.

## The matrix

| Component | pi | claude-code | cursor | Verify |
|---|---|---|---|---|
| **Directive entrypoint** (composed core + delta) | `~/.pi/agent/AGENTS.md` | `~/.claude/CLAUDE.md` | `~/AGENTS.md` | `agent-core status` → directive/core ✓×3 |
| **Skills** (full dirs incl. support/) | `~/.pi/agent/skills/` | `~/.claude/skills/` | `~/.cursor/skills-cursor/` | `agent-core status`; spot: `ls <dir>/atelier/support/` |
| **Rules** | store-only, read on demand (`primitives/rules/`) — same for all three BY DESIGN; no deploy | ← | ← | `ls ~/agent-core/primitives/rules/` |
| **Tools/bins** (slim, latch, vein, assay) | `~/.local/bin/` on PATH — harness-agnostic | ← | ← | `agent-core status --harness machine` → tool/* |
| **cursor-fleet / cursor-spine** | n/a | n/a | `~/cursor-shim/` (rip-out-able; not agent-core estate) | `command -v cursor-fleet` |
| **slim guard** (rewrite adapter) | extension shim `~/.pi/agent/extensions/slim-rewrite.ts` → canonical `primitives/hooks/slim-rewrite.ts` | PreToolUse `hook/slim-guard` (managed) | `hooks.json` preToolUse `hook/slim-guard` (managed, hooks-json adapter) | `agent-core status` → hook/slim-guard, hook/slim-guard-wiring, hook/slim-rewrite-pi |
| **Write-gate** (the model to copy — FULL) | `write-gate-pi.ts` via ext shim | `~/.tower/hooks/write-gate.mjs` (Stop) | `write-gate-cursor.sh` (stop) | `agent-core status` → hook/write-gate{,-cursor,-pi} |
| **Spawn-door** (FULL) | `spawn-door-pi.ts` via ext shim | `spawn-door.sh`, store path invoked directly | `spawn-door.sh`, store path invoked directly | `agent-core status` → hook/spawn-door{,-pi} |
| **Grounding hook** | `grounding-hook.ts` (body in extensions dir) | `~/.claude/hooks/grounding-hook.mjs`, 3 bindings | **none** — parity gap | `agent-core status` → hook/grounding{,-pi} |
| **credential-guard** (git-level, per REPO not per harness) | agnostic | ← | ← | `agent-core status` → hook/credential-guard |
| **bigfile** | via super-search `--file` | MCP `mcp__bigfile__*` | MCP `bigfile` (`~/.cursor/mcp.json`) | `python3 -c "import json;print(list(json.load(open('$HOME/.cursor/mcp.json'))['mcpServers']))"` |
| **Tower hook farm** (11 hooks: session-start, stop-guard, stop-verdict, prompt-inject, enforce-brief, ask-bridge, odometer, odometer-stop, deposit-reminder, flight-recorder, write-gate) | n/a — pi reaches Tower via `tower-auto.ts` + CLI | `~/.tower/hooks/*.mjs` symlinks → `primitives/mcps/tower/hooks/`, bound in `settings.json` | n/a — MCP + CLI | `agent-core status` → hook/tower-* (link + check per hook) |
| **Tower read (carry-over at wake)** | `tower-auto.ts` before_agent_start | `~/.tower/hooks/session-start.mjs` | `session-boundary-cursor.sh` leg 1 | `agent-core status` → hook/tower-session-start, hook/session-boundary-cursor |
| **Tower write (mail/board)** | `tower-auto` tools + `bun ~/.tower/cli.mjs` | MCP `mcp__tower__*` | MCP `tower` (`~/.cursor/mcp.json`) + `bun ~/.tower/cli.mjs` | mcp.json check above; `bun ~/.tower/cli.mjs status` |
| **Tower capture (flight, legs 5-6)** | `tower-lifecycle.ts` | PreCompact + SessionEnd (`flight-recorder`) | `hooks.json` sessionEnd + preCompact → `session-capture-cursor.mjs` | `agent-core status` → hook/tower-flight-recorder, hook/session-capture-cursor |
| **Session boundary legs 2-3 (handoff + flight ptr)** | `session-boundary-pi.ts` ext shim | `session-start.mjs` | `session-boundary-cursor.sh` legs 2-3 | `agent-core status` → hook/session-boundary-{pi,cursor} |
| **Circadian (memory at wake, leg 4)** | `circadian-mind.ts` ext shim → `~/circadian` | SessionStart hook `wake.ts` | `session-boundary-cursor.sh` leg 4 (calls `wake.ts`) | boundary script output contains `[Circadian] WAKE` (NOT registered — see boundaries) |
| **$task report** | `herdr-task-report.ts` (orphan canonical, pi-local) | `~/.claude/hooks/herdr-task-report.sh`, 4 bindings (managed) | **none** — parity gap | `agent-core status` → hook/herdr-task-report |
| **herdr** (multiplexer ops) | herdr CLI + skill — harness-agnostic (shell/socket) | ← (+ deployed skill) | ← (+ deployed skill) | `agent-core status` → skill/herdr (also `deploy prime-agent`) |
| **tup** (durable deck / `socket/` seam) | deployed skill | ← | ← | `agent-core status` → skill/tup (pi + claude-code + cursor + prime-agent) |
| **herdr agent state** | `herdr-agent-state.ts` | `herdr-agent-state.sh` | `herdr-agent-state.sh` | herdr's own estate — `herdr integration install <harness>` (NOT registered) |
| **herdr-spine (fleet spawn)** | `spine-spawn … --kind pi --profile <p>` | `spine-spawn … --kind claude --profile <p>` | `cursor-fleet up\|orch\|worker\|make` (cursor-shim; spine refuses cursor kinds and points there) | `~/bin/spine-spawn --help`; `command -v cursor-fleet` |
| **herdr tooling** (ctl-fleet, handlers, statem obs) | herdr-side, watches panes of any kind — agnostic | ← | ← | `ls ~/herdr-spine/bin/handlers/` |
| **Made Well (statem, twr)** | `bun primitives/tools/statem/{statem,twr}.ts` — agnostic; Verify beat enforced by briefs (pi/claude) | ← | ← + cursor-shim arbiter enforces Verify beat natively | `ls ~/agent-core/primitives/tools/statem/` |
| **Profiling (role identity)** | `spine-spawn --profile` reads `primitives/profiles/<role>.md` | same (`--kind claude`) | `cursor-spine <profile>` reads the same dir (`cursor-spine:52,393`) | `grep -n PROFILES_DIR ~/cursor-shim/cursor-spine` |
| **Role-loader skills** (concierge/coordinator/orchestrator) | deployed ✓ | deployed ✓ | deployed ✓ | `agent-core status` → skill/concierge etc. |
| **Agent definitions** (`agents/*`) | N/A BY ARCHITECTURE — pi's agents are herdr panes with profiles (row above) | `~/.claude/agents/` | `~/.cursor/agents/` | `agent-core status` → agents/* ✓ (claude-code, cursor) |

## Doctrine

- **Contract over copies:** the Session Boundary Contract
  (`primitives/rules/session-lifecycle.md`) defines what every harness owes;
  each harness satisfies it through its native surface (CC hooks, pi
  extensions, cursor hooks.json). Same data authorities everywhere (law 3).
- **The pi adapter pattern:** canonical TypeScript in `primitives/hooks/`,
  3-line re-export shim in `~/.pi/agent/extensions/` (precedents:
  slim-rewrite, session-boundary, spawn-door, write-gate).
- **The cursor adapter pattern:** scripts in `primitives/hooks/` wired via
  `~/.cursor/hooks.json` (sessionStart injects `additional_context` — proven
  by marker control test 2026-08-12; sessionEnd/preCompact capture).
- **One capability, several bodies:** write-gate and spawn-door are FULL on all
  three harnesses via three DIFFERENT bodies each. `source` in the registry
  means "the canonical body", so each body is its own primitive; the capability
  is what this table tracks, the body is what the registry tracks.
- **agent-core registers what agent-core authors, plus the wiring that proves
  an authored thing is live.** It does not claim another program's files —
  herdr's integrations, circadian's hooks, and spine's handlers stay theirs.
- **New component = manifest + oracles BEFORE registration:** every component
  carries a `VERIFY.toml` (contract lines + index-matched oracles) runnable by
  `component-verify` (`primitives/tools/component-verify/`); registering a
  primitive without one is drift, visible via `component-verify --coverage`
  (burn-down: `briefs/component-verify.coverage.txt`).
- **A cell marked N/A must name why** (architecture, not omission). The only
  N/A today: pi agent definitions (profiles are pi's agents), cursor
  circadian *write-side* (wake reads are wired; sleep/REM run machine-side in
  the circadian repo, not per-harness).

## Known boundaries (disclosed, not routed)

Enforcement estate deliberately left OUT of the registry, each for a stated
reason (the reasons live beside the blocks in `~/.agent-core/registry`):

- **herdr-agent-state** (×3 harnesses) — installed and versioned by
  `herdr integration install <harness>`; the three deployed bodies differ from
  each other and from `primitives/hooks/herdr-agent-state.ts`. Registering them
  would assert an ownership agent-core does not have.
- **circadian wake/graze/sleep/status** (6 claude-code bindings) — another
  repo's product with its own installer.
- **superset `notify.sh`** — bound through `$SUPERSET_HOME_DIR`, an env-var
  indirection this grammar cannot resolve; a `check` would report a false ✗.
- **spine handlers** (`~/herdr-spine`) — a separate program with its own layout.
- **Orphan canonicals** whose body lives in a harness tree rather than the
  store: `grounding-hook.mjs` / `grounding-hook.ts` (registered against where
  the body actually is, so the wiring is visible; adoption pending) and pi's
  `herdr-task-report.ts` (not registered).
- **Matcher shape is not checked.** `check` proves a hook is bound, not that it
  is bound widely enough — e.g. `enforce-brief` binds `Agent` only, so
  `Task|Workflow` spawns bypass it (topology audit P0-6) while its row reads ✓.
  Matcher-shape checking is a grammar extension nobody has asked for yet.
- CLI `port.zig` / `hooks_json.zig` unit tests need a test-mode Io injection to
  run under `zig build test` (pre-existing); `skilldir.zig`, `registry.zig`, and
  `presence.zig` tests ARE wired and green, plus 53 integration oracles across
  six scripts.
- The port engine does not prune a deployed support file whose canonical was
  deleted (no such orphans exist; deletion inside harness dirs holding
  unregistered user skills needs an explicit blast-radius rule first).

SOURCES: rows unchanged from 2026-08-12 were verified by running the listed
commands in the session that wrote this file (cli 4ad4285; component-verify
--all 16/16 oracles PASS, 6 components). Everything dated 2026-08-14 —
the 250/3/0 count, the three stale binaries, the check-only verb table, the
enforcement-layer matrix rows, and the boundaries list — was verified in the
Unit 3 session by running `agent-core status`, `agent-core sync --dry-run`
(no writes proposed), `zig build test` (10/10), and the six integration
scripts (53/53).
