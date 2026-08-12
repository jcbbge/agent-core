# HARNESS PARITY — the checklist (2026-08-12)

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
~/agent-core/cli/zig-out/bin/agent-core status   # expect: N ok, 0 stale, 0 missing
```

Current: **214 ok / 0 stale / 0 missing** (full skill directories included —
port engine deploys the whole tree as of cli 4ad4285; config-audit
registrations of 2026-08-12 added 12 skills, and the registry's
"config-audit exclusions" block names every deliberate non-deploy:
Arc project-scoped skills, cursor's own built-ins, pi-native extensions).

## The matrix

| Component | pi | claude-code | cursor | Verify |
|---|---|---|---|---|
| **Directive entrypoint** (composed core + delta) | `~/.pi/agent/AGENTS.md` | `~/.claude/CLAUDE.md` | `~/AGENTS.md` | `agent-core status` → directive/core ✓×3 |
| **Skills** (full dirs incl. support/) | `~/.pi/agent/skills/` | `~/.claude/skills/` | `~/.cursor/skills-cursor/` | `agent-core status`; spot: `ls <dir>/atelier/support/` |
| **Rules** | store-only, read on demand (`primitives/rules/`) — same for all three BY DESIGN; no deploy | ← | ← | `ls ~/agent-core/primitives/rules/` |
| **Tools/bins** (slim, latch, vein, cursor-fleet) | `~/.local/bin/` on PATH — harness-agnostic | ← | ← | `command -v slim latch vein cursor-fleet` |
| **slim guard** (rewrite adapter) | extension shim `~/.pi/agent/extensions/slim-rewrite.ts` → canonical `primitives/hooks/slim-rewrite.ts` (registry :95-100) | PreToolUse `hook/slim-guard` (registry) | `hooks.json` preToolUse `hook/slim-guard` (registry, hooks-json adapter) | `agent-core status` → hook/slim-guard; `head -3 ~/.pi/agent/extensions/slim-rewrite.ts` |
| **bigfile** | via super-search `--file` | MCP `mcp__bigfile__*` | MCP `bigfile` (`~/.cursor/mcp.json`) | `python3 -c "import json;print(list(json.load(open('$HOME/.cursor/mcp.json'))['mcpServers']))"` |
| **Tower read (carry-over at wake)** | `tower-auto.ts` before_agent_start | `~/.tower/hooks/session-start.mjs` | `session-boundary-cursor.sh` leg 1 | leg tests below |
| **Tower write (mail/board)** | `tower-auto` tools + `bun ~/.tower/cli.mjs` | MCP `mcp__tower__*` | MCP `tower` (`~/.cursor/mcp.json`) + `bun ~/.tower/cli.mjs` | mcp.json check above; `bun ~/.tower/cli.mjs status` |
| **Tower capture (flight, legs 5-6)** | `tower-lifecycle.ts` | PreCompact + SessionEnd hooks (`flight-recorder`) | `hooks.json` sessionEnd + preCompact → `session-capture-cursor.mjs` | `echo '{"session_id":"t","hook_event_name":"sessionEnd","workspace_roots":["'$PWD'"]}' \| bun ~/agent-core/primitives/hooks/session-capture-cursor.mjs; ls -t ~/.tower/flight/ \| head -1` |
| **Session boundary legs 2-3 (handoff + flight ptr)** | `session-boundary-pi.ts` ext shim | `session-start.mjs` | `session-boundary-cursor.sh` legs 2-3 | `echo '{}' \| bash ~/agent-core/primitives/hooks/session-boundary-cursor.sh`; `bun -e "await import('$HOME/.pi/agent/extensions/session-boundary.ts')"` |
| **Circadian (memory at wake, leg 4)** | `circadian-mind.ts` ext shim → `~/circadian` | SessionStart hook `wake.ts` | `session-boundary-cursor.sh` leg 4 (calls `wake.ts`) | boundary script output contains `[Circadian] WAKE` |
| **herdr** (substrate ops) | herdr CLI + skill — harness-agnostic (shell/socket) | ← (+ deployed skill) | ← (+ deployed skill) | `agent-core status` → skill/herdr ✓×3 |
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
  slim-rewrite, session-boundary, rtk-rewrite).
- **The cursor adapter pattern:** scripts in `primitives/hooks/` wired via
  `~/.cursor/hooks.json` (sessionStart injects `additional_context` — proven
  by marker control test 2026-08-12; sessionEnd/preCompact capture).
- **New component = manifest + oracles BEFORE registration:** every component
  carries a `VERIFY.toml` (contract lines + index-matched oracles) runnable by
  `component-verify` (`primitives/tools/component-verify/`); registering a
  primitive without one is drift, visible via `component-verify --coverage`
  (burn-down: `briefs/component-verify.coverage.txt`).
- **A cell marked N/A must name why** (architecture, not omission). The only
  N/A today: pi agent definitions (profiles are pi's agents), cursor
  circadian *write-side* (wake reads are wired; sleep/REM run machine-side in
  the circadian repo, not per-harness).

## Known boundaries (zero current effect, disclosed not routed)

- CLI `port.zig`/`hooks_json.zig` unit tests need a test-mode Io injection to
  run under `zig build test` (pre-existing; `skilldir.zig` tests ARE wired
  and green, plus the 11-case integration oracle).
- The port engine does not prune a deployed support file whose canonical was
  deleted (no such orphans exist; deletion inside harness dirs holding
  unregistered user skills needs an explicit blast-radius rule first).

SOURCES: all cells verified by running the listed commands 2026-08-12 in the
session that wrote this file; cli 4ad4285; agent-core status 214/0/0;
component-verify --all 16/16 oracles PASS (6 components, run from main
post-merge 2026-08-12).
