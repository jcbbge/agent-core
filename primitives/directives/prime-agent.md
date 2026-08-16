- **prime-agent:** pi-fork RLM runtime · composed entry at `~/.prime/agent/AGENTS.md`
  (core+delta via `agent-core sync directive/core`) · `/reload` hot-reload · skills
  under `~/.prime/agent/skills/` · prompts under `~/.prime/agent/prompts/` ·
  extensions under `~/.prime/agent/extensions/` (pi adapter pattern: 3-line shims →
  `~/agent-core/primitives/hooks/*`) · daily entry = `prime-agent` (coordinator) ·
  children via `rlm(...)` in the IPython kernel (`rlmMaxDepth`: 3 in settings) ·
  prime-spine package at `~/prime-spine` (`packages` in settings) · peer sessions via
  `/peer` ·   herdr panes: `herdr prime` (desk door; herdr has no `--kind prime-agent` —
  the wrapper runs `prime-agent` in the pane)

**Updated:** 2026-08-16

FACTUAL reference: what exists, how to reach it. The tier models below are **open-source
only** (open-weight, HuggingFace-published) and were chosen by a live bake-off on the
Bento Bench eval suite (`~/evals`, 2026-08-06) balancing capability, faithfulness, and
cost — not by reputation. The coordinator was settled by a 3-way finals (deepseek-v4-pro
vs glm-5.2 vs kimi-k3, C3+C4, n=27/model, with the faithfulness-scorer bug fixed): all
three tied on faithfulness (~0.70), so glm-5.2 won on capability (59% pass, 0.87 on hard
C4 synthesis, fastest); kimi-k3 (AA-Index #1 on paper) was worst on the real workload —
44% pass, 21× the cost — and was rejected. The orchestrator was settled by its own 3-way
finals (deepseek-v4-pro vs glm-5.2 vs glm-4.5-air, C3+C4, n=27/model, fixed scorer):
deepseek-v4-pro won every axis — faith 0.65, apr 0.87, 51% pass, cheapest ($0.040/run) —
while glm-4.5-air (the prior pick) came last on faithfulness (0.56) and collapsed on C4
synthesis (0.26), so it was dropped. All selectors were verified against the live
OpenRouter catalog the same day. **For `rlm(...)` spawns the selector
must be provider-prefixed** (`openrouter/...`) — the bare catalog id fails loudly at spawn
time ("unavailable, unauthenticated, or expired"). Verify any uncertain selector with
`rlm.find_models()`; on failure the spawn fails hard (never a silent fallback), so keep
these current. Alternates for quick swap-in are listed under each tier.

## The default topology — coordinator → orchestrator → agent → subagent

Prime Agent spawns children programmatically from the IPython kernel with `rlm(...)`.
Every session starts as the **coordinator**. The coordinator delegates a block of work
to one or more **orchestrators**; each orchestrator spawns **coding agents** and their
**subagents**. This is a four-level tree — depth 3 — which is why
`~/.prime/agent/settings.json` sets `"rlmMaxDepth": 3` (the built-in default is 1, i.e.
root-makes-children-only). Verify with `/rlm-max-depth`; raise per-chat with
`/rlm-max-depth 3 --global` if a session reports depth 1.

| Tier | Role | `rlm(...)` spawn selector (open-source) | Alternate | Spawned by |
|---|---|---|---|---|
| 0 | **Coordinator** (session default) | `openrouter/z-ai/glm-5.2` | `openrouter/deepseek/deepseek-v4-pro` | you start it (`prime-agent`) |
| 1 | **Orchestrator** (nOrchestrator) | `openrouter/deepseek/deepseek-v4-pro` | `openrouter/z-ai/glm-5.2` | coordinator |
| 2 | **Agent** — coding (nAgent) | `openrouter/qwen/qwen3-coder-next` | `openrouter/qwen/qwen3-coder` | an orchestrator |
| 3 | **SubAgent** (nSubAgent) | `openrouter/deepseek/deepseek-v4-flash` | `openrouter/qwen/qwen3-30b-a3b-instruct-2507` | a coding agent |

The coordinator model is set in settings.json as `defaultProvider: openrouter` +
`defaultModel: z-ai/glm-5.2` (settings split the prefix into two fields), so a bare
`prime-agent` launches on GLM-5.2. But `rlm(...)` spawns take a SINGLE fused
selector and require the `openrouter/` prefix (verified live 2026-08-05). Every child
inherits the parent model unless the `rlm(...)` call passes an explicit `model=` — so each
tier MUST name its child's prefixed selector on every spawn, or the child silently
inherits the wrong one.

**Swapping tiers:** to change a tier's model, edit its `model=` in the spawn calls (and
`defaultModel` in settings.json for the coordinator). Alternates above are pre-vetted
open-weight swaps.

### Starting agents and subagents

`rlm(...)` is preloaded in the kernel. A call returns immediately at admission with a
handle; it NEVER waits for or returns the child's answer. Results come back only via
`agent_message` replies or files.

```python
orch_a = await rlm("Own workstream A end to end. Spawn coding agents per the brief.",
                   name="orch-a", model="openrouter/deepseek/deepseek-v4-pro")
coder = await rlm("Implement the auth module against .madewell/specs/<brief>.md",
                  name="coder-auth", model="openrouter/qwen/qwen3-coder-next")
helper = await rlm("Write the fixtures for the auth tests; report the file paths.",
                   name="sub-fixtures", model="openrouter/deepseek/deepseek-v4-flash")
```

Spawn independent children in separate calls and end the turn — do not `await`
completion. Steer with `agent_message.send(..., receiver_role="child", receiver_name=...)`.

### Stopping / inspecting agents and subagents

- **List:** `children = await rlm.list_subagents()`
- **Stop:** `await rlm.delete_subagent(children[0])`
- **Whole tree:** `prime-agent agents`, `prime-agent attach <agent>`, `prime-agent shutdown [--force]`

### Discipline

- Each tier spawns only the tier directly below it. Do not skip levels.
- Name every child by its role (`orch-a`, `coder-auth`, `sub-fixtures`).
- The coordinator reads, plans, decomposes, dispatches, and synthesizes — it does not
  do deliverable work itself.

## Auth

OpenRouter key is read from pi as single source of truth via `!command` in
`~/.prime/agent/auth.json`:

```json
{ "openrouter": { "type": "api_key",
    "key": "!jq -r '.openrouter.key' /Users/jrg/.pi/agent/auth.json" } }
```

## Peer sessions (peer-session extension)

`/peer [kimi|opus|sonnet|grok|gemini] [--via anthropic|openrouter|perplexity]` → `/send`
open · `/rejoin` · `/return` · `/close`. State under `~/.prime/peer-inbox/` and
`~/.prime/peer-sessions/`.

## Prime Spine (pi-spine port)

`prime-spine` at `~/prime-spine` (`../../prime-spine` in settings). Prime deltas from
pi-spine: `agent_settled` → `agent_end`; gutter disabled; settings under `~/.prime/agent/`.
Working: chapter mark, now-panel, greeting, compaction adapter, overlay TOC (ctrl+q), theme.

## pi parity extensions (agent-core managed shims)

Canonical bodies in `~/agent-core/primitives/hooks/`; Prime loads via
`~/.prime/agent/extensions/` shims (same pattern as pi): `session-boundary.ts`,
`spawn-door.ts`, `write-gate.ts`, `slim-rewrite.ts`. Prime-local (not shims):
`grounding-hook.ts`, `tower-auto.ts`, `tower-lifecycle.ts`, `circadian-mind.ts`,
`herdr-agent-state.ts`, `herdr-task-report.ts`, `peer-session.ts`.

## Trust model (Prime Agent)

The IPython kernel and every child run model-generated Python and project commands with
your OS permissions. The worker/kernel isolation improves lifecycle recovery — it is
NOT a security sandbox. Use trusted repos; run untrusted code in an external sandbox.
