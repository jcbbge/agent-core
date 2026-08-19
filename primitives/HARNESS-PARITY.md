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

**Current: 340 ok / 0 stale / 0 missing** (2026-08-16, after utensil-guard
HOOK: `utensil-guard.mjs` bound on CC PreToolUse `Read|Grep`+`Bash` and cursor
preToolUse `Read|Grep|Shell`; pi/prime extension shims; directive/core
recomposed. Super-search remains retired.)

The 2026-08-14 stale-binary paragraph is struck: live `agent-core status`
this session reports 0 stale. Re-run the binary before citing a count.

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
| **cursor-shim spawn doors (retired)** | n/a | n/a | `cursor-fleet` / `cursor-spine` retired 2026-08-18 — live door is `spine-spawn` (row below) | n/a — historical only |
| **slim guard** (rewrite adapter) | extension shim `~/.pi/agent/extensions/slim-rewrite.ts` → canonical `primitives/hooks/slim-rewrite.ts` | PreToolUse `hook/slim-guard` (managed) | `hooks.json` preToolUse `hook/slim-guard` (managed, hooks-json adapter) | `agent-core status` → hook/slim-guard, hook/slim-guard-wiring, hook/slim-rewrite-pi |
| **utensil guard** (pantry use) | extension shim `~/.pi/agent/extensions/utensil-guard.ts` → `primitives/hooks/utensil-guard-pi.ts` | PreToolUse `Read\|Grep` + `Bash` → store `utensil-guard.mjs` | `hooks.json` preToolUse matcher `Read\|Grep\|Shell` → same mjs (`hook/utensil-guard`) | `agent-core status` → hook/utensil-guard{,-pi,-prime} |
| **Write-gate** (the model to copy — FULL) | `write-gate-pi.ts` via ext shim | `~/.tower/hooks/write-gate.mjs` (Stop) | `write-gate-cursor.sh` (stop) | `agent-core status` → hook/write-gate{,-cursor,-pi} |
| **Spawn-door** (FULL) | `spawn-door-pi.ts` via ext shim | `spawn-door.sh`, store path invoked directly | `spawn-door.sh`, store path invoked directly | `agent-core status` → hook/spawn-door{,-pi} |
| **Grounding hook** | `grounding-hook.ts` (body in extensions dir) | `~/.claude/hooks/grounding-hook.mjs`, 3 bindings | **none** — parity gap | `agent-core status` → hook/grounding{,-pi} |
| **credential-guard** (git-level, per REPO not per harness) | agnostic | ← | ← | `agent-core status` → hook/credential-guard |
| **bigfile** | MCP or library; no router | MCP `mcp__bigfile__*` | MCP `bigfile` (`~/.cursor/mcp.json`) | `python3 -c "import json;print(list(json.load(open('$HOME/.cursor/mcp.json'))['mcpServers']))"` |
| **Tower hook farm** (11 hooks: session-start, stop-guard, stop-verdict, prompt-inject, enforce-brief, ask-bridge, odometer, odometer-stop, deposit-reminder, flight-recorder, write-gate) | n/a — pi reaches Tower via `tower-auto.ts` + CLI | `~/.tower/hooks/*.mjs` symlinks → `primitives/mcps/tower/hooks/`, bound in `settings.json` | n/a — MCP + CLI | `agent-core status` → hook/tower-* (link + check per hook) |
| **Tower read (carry-over at wake)** | `tower-auto.ts` before_agent_start | `~/.tower/hooks/session-start.mjs` | `session-boundary-cursor.sh` leg 1 | `agent-core status` → hook/tower-session-start, hook/session-boundary-cursor |
| **Tower write (mail/board)** | `tower` CLI on PATH — parity by construction, no MCP registration | ← | ← | `command -v tower && tower stat` |
| **Tower capture (flight, legs 5-6)** | `tower-lifecycle.ts` | PreCompact + SessionEnd (`flight-recorder`) | `hooks.json` sessionEnd + preCompact → `session-capture-cursor.mjs` | `agent-core status` → hook/tower-flight-recorder, hook/session-capture-cursor |
| **Session boundary legs 2-3 (handoff + flight ptr)** | `session-boundary-pi.ts` ext shim | `session-start.mjs` | `session-boundary-cursor.sh` legs 2-3 | `agent-core status` → hook/session-boundary-{pi,cursor} |
| **Circadian (memory at wake, leg 4)** | `circadian-mind.ts` ext shim → `~/circadian` | SessionStart hook `wake.ts` | `session-boundary-cursor.sh` leg 4 (calls `wake.ts`) | boundary script output contains `[Circadian] WAKE` (NOT registered — see boundaries) |
| **$task report** | `herdr-task-report.ts` (orphan canonical, pi-local) | `~/.claude/hooks/herdr-task-report.sh`, 4 bindings (managed) | **none** — parity gap | `agent-core status` → hook/herdr-task-report |
| **herdr** (multiplexer ops) | herdr CLI + skill — harness-agnostic (shell/socket) | ← (+ deployed skill) | ← (+ deployed skill) | `agent-core status` → skill/herdr (also `deploy prime-agent`) |
| **muster** (durable deck / deposit door) | deployed skill | ← | ← | `agent-core status` → skill/muster (pi + claude-code + cursor + prime-agent) |
| **herdr agent state** | `herdr-agent-state.ts` | `herdr-agent-state.sh` | `herdr-agent-state.sh` | herdr's own estate — `herdr integration install <harness>` (NOT registered) |
| **muster-spawn (fleet spawn)** | `muster-spawn … --kind pi --profile <p>` | `muster-spawn … --kind claude --profile <p>` | `muster-spawn … --kind cursor --profile <p>` — proven live 2026-08-16 (pane `w3W:p3`, `agent=cursor`, `source=herdr:cursor`, status `working`) | `command -v muster-spawn && muster-spawn --help` (forwarder `~/bin/spine-spawn` OK) |
| **Fleet-spawn model resolution** | gateway slug passed through as-is | `models.json` → `kind_models.claude` | `CURSOR_MODEL_MAP` in `muster-spawn` translates the profile's gateway slug to a cursor-agent id; unknown slug → best-effort de-slug; nothing resolvable → `auto` + WARN | live: spawn log line `model=composer-2.5-fast` from `--profile researcher` |
| **Resource claim** (herdr tokens) | herdr pane metadata | ← | ← | ← — **run by a cursor agent itself** 2026-08-16; claim token visible via `herdr pane report-metadata` from another pane. Engine-blind by construction (`$HERDR_PANE_ID`, `herdr pane report-metadata`) | `herdr pane report-metadata <pane> --token claim=…` |
| **Workspace door** (`spine-workspace`) | works unmodified | works unmodified | works unmodified — no pane or engine concept at all; a cursor pane and a claude pane produced byte-identical output and the same exit code | `grep -c 'herdr workspace' ~/muster/bin/spine-workspace` → pure herdr calls (historical herdr-spine path retired) |
| **Ruling deposit** | `muster-deposit --kind report` | ← | ← | ← — durable log, not a separate spine-ruling bin | `muster-deposit deposit --from … --to concierge --kind report --body "…"` |
| **Fleet observation** | herdr snapshot / pane tokens | ← | ← | ← — **no source filter of any kind**, so a cursor pane is observed like any other | `herdr api snapshot` |
| **Session duration** (`ctl-fleet`) | **NOT MEASURED** — renders `—` | real duration, read from `~/.claude/projects` transcripts | **NOT MEASURED** — renders `—`. Deliberate: `thesis.md:67` rules out truth derived from exhaust, so no second transcript reader was added. A dash says "not measured here"; the blank it replaced read as a sub-minute session | `herdr pane list` — cursor rows show `—`, claude rows show a real duration where measured |
| **herdr tooling** (ctl-fleet, statem obs) | herdr-side, watches panes of any kind — agnostic | ← | ← | `herdr --help` |
| **Made Well (statem, twr)** | `bun primitives/tools/statem/{statem,twr}.ts` — agnostic; Verify beat enforced by briefs (pi/claude) | ← | ← + cursor-shim arbiter enforces Verify beat natively | `ls ~/agent-core/primitives/tools/statem/` |
| **Profiling (role identity)** | `muster-spawn --profile` reads `primitives/profiles/<role>.md` | same (`--kind claude`) | same (`--kind cursor`) | `grep -n PROFILES_DIR ~/muster/bin/muster-spawn` |
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
- **The spawn-door misdirection — RESOLVED 2026-08-16, by making the pointer
  true rather than by editing the hook.** `primitives/hooks/spawn-door.sh:39-40`
  denies any command containing `herdr agent start`, on every harness, with no
  harness branch, and its deny text points at one destination:
  `~/bin/spine-spawn`. That row is recorded FULL on cursor above, and the hook
  genuinely did fire on cursor — but until today the destination it named
  refused cursor at `spine-spawn:1470-1475`, and `~/bin/herdr:83` writes
  `cursor` into `~/.config/herdr/desk-harness`, which `spine-spawn:1459-1468`
  reads as the default kind. A cursor agent that obeyed the door was therefore
  routed into a hard `sys.exit(1)`: the gate was enforcing, correctly, a path to
  nowhere. **A hook can be FULL and still be a dead end; "the guard fires" and
  "the guard helps" are separate facts, and only the first was ever verified.**
  The refusal is now deleted and cursor spawns through that exact door
  (`PROOF-cursor-spawn.md`), so the hook's single unbranched pointer is correct
  for all three harnesses. `spawn-door.sh` itself was not modified and needs no
  cursor branch. Verify: `grep -c 'cursor spawns do not go through' ~/muster/bin/muster-spawn` → `0`.

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
- **muster handlers** (`~/muster/bin/`) — a separate program with its own layout; herdr-spine retired pending operator delete.
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
