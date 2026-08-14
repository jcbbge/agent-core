# SESSION LIFECYCLE — the layer doctrine (codified 2026-08-12)

Operator mandate: too many conflicting patterns and dependencies at the
session boundary for no reason. This file is the ONE model. Each layer
answers exactly one question; a layer that answers another layer's question
is a defect, whatever it improves.

## The five layers

| Layer | The question it answers | Delivery | May contain |
|---|---|---|---|
| **Directive** (composed entrypoint: `~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md`) | *What world is this?* | always in context, composed from `primitives/AGENTS.md` + `primitives/directives/<harness>.md` | standing FACTS — what exists, how to reach it. Never rituals, never role identity |
| **Profile** (`primitives/profiles/<role>.md`) | *Who am I?* | stamped at birth by the spawn path, or loaded via its thin loader skill (`concierge`/`coordinator`/`orchestrator`) | identity + role doctrine + desk-card facts. The ONLY home for role behavior |
| **Boundary adapters** (CC hooks · pi extensions · cursor `hooks.json`) | *What happened while I was dead?* | injected deterministically at the boundary, no model in the loop | DATA only — never instructions, never behavioral mandates |
| **Ritual skills** (`starting-session` / `ending-session`) | *What is the ritual?* | invoked — slash, ambient trigger, or brief | PROCEDURE — check what injection provided, extract what it didn't, act |
| **Substrate telemetry** (herdr-agent-state, status line, grounding reset) | *(not context at all)* | hooks, but writing to the substrate, not the prompt | state reporting; exempt from this doctrine's injection rules |

Circadian is not a layer. It is a **provider to the adapter layer** — the
memory substrate that adapters inject. Same for Tower: the carry-over
provider. Providers own data; adapters deliver it; neither instructs.

## The Session Boundary Contract

Every harness owes the same legs, via its own adapter. Parity = implementing
the contract, not copying another harness's files.

**At start (inject, in this order of importance):**
1. Tower carry-over — unrelayed operator mail + open questions (provider: Tower ledger)
2. Last `TODO:` handoff (provider + authority: `git log` — repo is truth)
3. Flight snapshot pointer, <24h (provider: `~/.tower/flight/`)
4. Memory substrate (provider: circadian mind)

**At end / compact (capture):**
5. Flight snapshot written (deterministic, no model)
6. Lifecycle verdicts to the status plane (never fabricated into mail — COMMS-ARCH)

**Coverage as of 2026-08-12 (post-remediation):** claude-code 1–6 ✓
(`~/.tower/hooks/session-start.mjs`, `~/circadian/src/wake.ts`). pi 1–6 ✓ —
legs 2–3 added via `primitives/hooks/session-boundary-pi.ts` (shim
`~/.pi/agent/extensions/session-boundary.ts`; `before_agent_start` +
fired-once guard — pi's `session_start` is void and cannot inject). cursor
1–3 ✓ via `primitives/hooks/session-boundary-cursor.sh` (sessionStart
`additional_context`, proven by a marker injection control test on
cursor-agent 2026.08.11); leg 4 absent BY DESIGN (no circadian adapter;
kill switch active); **legs 5–6 still missing on cursor** (no
sessionEnd/preCompact capture adapter).

## The laws

1. **Adapters inject data, never behavior.** A behavioral mandate inside an
   injector always ends up needing suppression patches per role or per
   harness — evidence it lives in the wrong layer. (Former standing
   deviation, RESOLVED 2026-08-12: circadian's wake now emits
   `<mind:greeting>` as pure data — the greeting mandate and the
   `CIRCADIAN_SKIP_GREETING` / role-suppression machinery were removed from
   `~/circadian/src/wake.ts` + `wake-payload.ts`. The speaking behavior
   lives in `profiles/concierge.md` (Greeting desk-card entry); the
   no-greeting fleet norm lives in `profiles/coordinator.md` +
   `orchestrator.md`. The R7 fitness loop still scores what the concierge
   speaks.)
2. **Ritual skills are self-sufficient and idempotent.** They check whether a
   contract leg is already in context; extract minimally when it is not
   (starting-session v4.1 fallback); never reprint what injection provided.
   A skill must run correctly on a harness with NO adapters.
3. **One authority per datum.** Handoff = `git log` `TODO:` line. Working
   set = flight snapshot. Comms = Tower ledger/board. Identity-memory =
   circadian mind. Role identity = the profile. Adapters and skills are
   read-only views of these authorities — they never mint a second copy.
4. **Profiles are the only source of role behavior; briefs override a
   profile's default first action; ritual skills stay role-agnostic** so any
   role can run them.
5. **A new session-boundary need is added as a contract leg here first**,
   then implemented per adapter — never as a one-harness hook that skills
   quietly grow a dependency on.

## Naming

The ritual skills are gerund-named: `starting-session`, `ending-session`
(operator, 2026-08-12; formerly session-start/session-end — legacy flats in
`primitives/skills/_attic/`). The claude-code Tower hook file keeps its own
name (`session-start.mjs`) — it is an adapter, not the skill.

SOURCES: audit of ~/.claude/settings.json SessionStart hooks,
~/.cursor/hooks.json, ~/.pi/agent/extensions/*.ts, ~/.tower/hooks/
session-start.mjs, ~/circadian/src/wake.ts, registry + `agent-core status`
(all read/run 2026-08-12 this session); COMMS-ARCH.md; operator directives
2026-08-12.
