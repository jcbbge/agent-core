# COMPONENTS — the flat agent-tooling map

**Created:** 2026-08-20. Third leg of the registry docs:
`COMPONENTS.md` = **what tools exist and every surface each one owns**.
`HARNESS-SHAPE.md` = the contract a harness must satisfy.
`HARNESS-PARITY.md` = per-harness state.
`~/.agent-core/registry` = the machine form.

## Why this file exists

The registry is indexed by **primitive** — one row per file→destination. That is
the right shape for syncing and the wrong shape for *thinking about a tool*.
Circadian is a single component, but in the registry it is six unrelated
`hook/circadian-*` ids with nothing tying them together and no record at all
that it also owns a CLI, three launchd services, and a paragraph of the composed
directive. Ask the registry "what is circadian" and it cannot answer.

A component is **multi-modal**: any one tool may own a CLI, one or more lifecycle
hooks, a directive snippet, a dedicated skill, an MCP server, a background
service, and a subagent. Onboarding a harness or debugging a dead capability
needs the component view — "circadian needs four bindings plus a CLI on PATH
plus a directive paragraph", not "there is a hook somewhere".

**Surface legend.** `—` the component has no such surface, by design.
`✗ GAP` the surface exists in reality but owns no registry row, so it cannot
fail an audit — see HARNESS-SHAPE.md's law. Verify before citing: this file is
hand-maintained and drifts; `agent-core status` is the authority.

---

## The map

| Component | Home | CLI | Lifecycle hooks | Directive | Skill | MCP | Service | Registry ids |
|---|---|---|---|---|---|---|---|---|
| **agent-core** | `~/agent-core` | `agent-core` (`/opt/homebrew/bin`, + `cli/zig-out/bin`) | — | composes every entrypoint | `agentcore` | — | — | `directive/core`, `skill/agentcore`; binary itself ✗ GAP |
| **circadian** | `~/circadian` | 6 bins: `circadian-{wake,sleep,rem,graze,status,doctor}` | `wake`, `prompt_submit`+`post_tool` (graze), `session_end` (sleep), `status_line`; pi/prime via `circadian-mind.ts` shim | wake/memory paragraph in composed core | ✗ GAP — none | — | `com.circadian.{rem,rem-catchup,doctor}` | `hook/circadian-{wake,sleep,graze,status,mind-pi,mind-prime}` |
| **herdr** | `~/bin/herdr` | `herdr` | `wake` (agent-state), `$task` report ×4 bindings | Stack table | `herdr` | — | `com.herdr.server` | `hook/herdr-task-report`, `skill/herdr`; `herdr-agent-state` ✗ GAP (herdr's own manifest, deliberate) |
| **muster** | `~/muster` | `~/muster/bin/{muster-deposit,muster-spawn}` — **not on PATH as `muster`** | — (spawn-door guards it) | comms + spawn law | `muster` | — | — | `skill/muster` only — ✗ GAP: no binary or wiring row for the live coordination runtime |
| **tower** | `~/.tower`, `primitives/mcps/tower` | `tower` | 11-hook farm: `wake`, `prompt_submit`, `pre_tool`, `post_tool`, `stop` ×3, `session_end`, `pre_compact` | nominally retired | DEAD stub | `tower` (CC) | — | `hook/tower-*` ×11, `command/tower` |
| **slim** | `primitives/tools/slim` | `slim` | `pre_tool` (guard on CC+cursor; rewrite ext on pi/prime) | Stack table | `slim` | — | — | `tool/slim`, `skill/slim`, `hook/slim-guard`, `hook/slim-guard-wiring`, `hook/slim-rewrite-{pi,prime}` |
| **latch** | `primitives/tools/latch` | `latch` | — | Stack table | `latch` | — | — | `tool/latch`, `skill/latch` |
| **vein** | `primitives/tools/vein` | `vein` | — | Stack table | `vein` | — | — | `tool/vein`, `skill/vein` |
| **assay** | `primitives/tools/assay` | `assay` | — | Stack table | `assay` | — | — | `tool/assay`, `skill/assay` |
| **coraline** | `~/.cargo/bin` | `coraline` | — | Stack table | `coraline` | — (CLI only, by ruling) | — | `skill/coraline`; binary ✗ GAP |
| **colgrep** | `~/.cargo/bin` | `colgrep` | — | Stack table | `colgrep` | — | — | `skill/colgrep`; binary ✗ GAP |
| **pickbrain** | `~/.cargo/bin` | `pickbrain` | — | Stack table | `pickbrain` | — | — | `skill/pickbrain`; binary ✗ GAP |
| **composto** | `/opt/homebrew/bin` | `composto` | — | Stack table | `composto` | — | — | `skill/composto`; binary ✗ GAP |
| **bigfile** | `primitives/tools/bigfile` | — (MCP + library) | — | Stack table | `navigating-big-files` | `bigfile` (CC + cursor) | — | `skill/navigating-big-files`; MCP registration ✗ GAP |
| **utensil-guard** | `primitives/hooks` | — | `pre_tool` ×4 harnesses | HOOK paragraph | — | — | — | `hook/utensil-guard{,-pi,-prime}` |
| **grounding-hook** | `primitives/hooks` | — | `pre_tool` + `post_tool` + `wake` reset | Write-discipline law | — | — | — | `hook/grounding{,-pi,-prime}` |
| **write-gate** | `primitives/hooks` | — | `stop` ×4 harnesses | Enforcement law | — | — | — | `hook/write-gate{,-cursor,-pi,-prime}`, `hook/tower-write-gate-link` |
| **spawn-door** | `primitives/hooks` | — | `pre_tool` (shell) ×4 | Spawn law | — | — | — | `hook/spawn-door{,-pi,-prime}` |
| **credential-guard** | `primitives/hooks` | — | git-level, per repo | Secrets rule | — | — | — | `hook/credential-guard` |
| **session boundary** | `primitives/hooks`, tower hooks | — | `wake` legs 1–4; `session_end`+`pre_compact` legs 5–6 | Session-lifecycle law | — | — | — | `hook/session-boundary-{cursor,pi,prime}`, `hook/session-capture-cursor`, `hook/tower-session-start` |
| **superset** | `$SUPERSET_HOME_DIR` | — | `wake`, `prompt_submit`, `post_tool`, `stop`, `session_end` | — | — | — | — | ✗ GAP — env-var indirection the registry grammar cannot resolve |
| **local LLM** | `127.0.0.1:10240` | — | — | System-services table | — | — | `com.localllm.server` | ✗ GAP — circadian's sleep/REM drafting depends on it |

---

## Gaps this map exposes

Each is a capability that is real, load-bearing, and unable to fail an audit.
Listed most consequential first. None is fixed yet — they are the backlog.

1. **muster has one row.** The live coordination runtime — spawn door, durable
   fleet mail, the thing every fleet message moves through — is covered only by
   `skill/muster`. No binary row, no wiring row. If `muster-spawn` went missing
   the audit would stay green. It is also not on PATH as `muster`, so every
   caller hardcodes `~/muster/bin/…`.
2. **Five tool binaries have skills but no `tool/` row** — coraline, colgrep,
   pickbrain, composto, and agent-core's own binary. `tool/` exists for slim,
   latch, vein, and assay and checks "executable, no older than `src/`". A
   skill that documents a dead binary is worse than no skill: the agent reaches
   for it confidently and fails.
3. **circadian has no skill.** Six hooks, six bins, three services, a directive
   paragraph — and no skill telling an agent how to inspect or repair it. The
   entry point today is `circadian-doctor`, which nothing advertises. This is
   why 2026-08-20's outage was found by the operator noticing absence rather
   than by any agent.
4. **bigfile's MCP registration is unrowed** — the skill's whole premise is the
   MCP being present in `~/.claude.json` / `~/.cursor/mcp.json`.
5. **Tower's status is unresolved.** Nominally retired; in fact 11 live hook
   bindings, a live MCP, and a CLI on PATH. Retired-but-load-bearing is the
   worst state for a component to be in. Needs an operator ruling: finish the
   muster cutover, or drop the retirement.
6. **local LLM is a hard dependency with no row.** Circadian's sleep and REM
   drafting call it; if `:10240` is down, memory quietly stops consolidating.
7. **superset and herdr-agent-state** are known, deliberate exclusions —
   documented in HARNESS-PARITY.md. Left here so the count of blind spots is
   honest, not so they get registered.

## Maintaining this file

Add a row whenever a component gains a surface — a new hook binding, a CLI, an
MCP, a service. `/agentcore doctor` cross-checks it against live configs and
`agent-core status`, and reports components whose surfaces are unrowed. When a
gap is closed, delete the gap entry rather than marking it done; the registry is
the record that it is closed.
