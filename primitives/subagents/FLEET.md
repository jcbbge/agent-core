# Agent Fleet — Constellation Taxonomy

**Updated:** 2026-07-07 (open-weight refresh)
**Provider:** OpenRouter (open-weight models) · Perplexity direct (Pulsar only) · xAI via OpenRouter (peer only)
**Total agents:** 14 constellation stars (this doc) + functional agents in `08_subagents/`

> Model assignments here mirror the `model:`/`alternate:` frontmatter in the profile `.md` files, which remain the authoritative source. Models are the latest open-weight leaders (OpenRouter, June-2026), chosen by role — see the change log at the bottom for the palette and rationale.

---

## 🌌 Constellation Fleet — Software Development Lifecycle

The canonical six-star fleet (plus the persistent Quasar-of-orchestration, Markarian) for the SDLC: ideation → architecture → implementation → testing → verification.

| Star | Role | House | Primary Model | Alternate | When to Use |
|------|------|-------|---------------|-----------|-------------|
| **Markarian** | Orchestrator (persistent) | persistent | `openrouter/moonshotai/kimi-k2.6` | `openrouter/z-ai/glm-5.2` | Multi-phase work, fleet dispatch, user-facing coordination |
| **Vega** | Brainstorm partner (Dawn) | Dawn | `openrouter/moonshotai/kimi-k2.6` | `openrouter/z-ai/glm-5.2` | Pre-architecture ideation, ≥8 divergent options, contrarian angles |
| **Cassiopeia** | Systems thinker (Meridian) | Meridian | `openrouter/z-ai/glm-5.2` | `openrouter/deepseek/deepseek-v4-pro` | Interface design, invariants, ownership, blast-radius analysis |
| **Sirius** | Coder (Descent) | Descent | `openrouter/deepseek/deepseek-v4-pro` | `openrouter/qwen/qwen3.6-plus` | Implementation with commit discipline (design already settled) |
| **Orion** | Test-maker (Descent) | Descent | `openrouter/z-ai/glm-5.2` | `openrouter/deepseek/deepseek-v4-pro` | Test strategy, coverage matrix, property tests, regression tests |
| **Aldebaran** | Strict tester (Night) | Night | `openrouter/z-ai/glm-5.2` | `openrouter/deepseek/deepseek-v4-pro` | Adversarial verification, counter-example hunting, acceptance gating |

---

## 🔧 Development-Workflow Fleet — Alembic / General Tasks

Specialized agents for memory-substrate work and general delegation outside the SDLC.

| Agent | Role | Primary Model | Alternate | When to Use |
|-------|------|---------------|-----------|-------------|
| **Procyon** | General-task workhorse | `openrouter/deepseek/deepseek-v4-flash` | `openrouter/z-ai/glm-5.2` | Well-defined task, no specialist fits |
| **Lyra** | LLM synthesis (emergence) | `openrouter/z-ai/glm-5.2` | `openrouter/moonshotai/kimi-k2.6` | Emergence from memory shards (Alembic dreaming mind) |
| **Spectra** | Diamond refraction | `openrouter/z-ai/glm-5.2` | `openrouter/moonshotai/kimi-k2.6` | Dual-facet extraction on new shard creation |
| **Corvus** | Debugger | `openrouter/z-ai/glm-5.2` | `openrouter/deepseek/deepseek-v4-pro` | Mystery bugs, substrate-level repair, root-cause investigation |

---

## 🔭 Web-Search Fleet — Research & Information Retrieval

Tiered research agents. **Pulsar is the one Perplexity Sonar agent** (`sonar-deep-research`, the strongest variant); everyone else uses open-weight tool-calling models.

| Agent | Role | Primary Model | Alternate | When to Use |
|-------|------|---------------|-----------|-------------|
| **Pulsar** | Web search + deep research | `perplexity/sonar-deep-research` | `openrouter/z-ai/glm-5.2` | Live web research, current events, long-form investigation with grounding |
| **Nebula** | Search synthesis | `openrouter/z-ai/glm-5.2` | `openrouter/qwen/qwen3.6-plus` | Multi-source synthesis, reconciling competing sources |
| **Atlas** | Search worker (structured) | `openrouter/deepseek/deepseek-v4-flash` | `openrouter/qwen/qwen3.6-plus` | Structured research tasks, tabular outputs, mid-weight investigation |
| **Quasar** | Cheap search | `openrouter/deepseek/deepseek-v4-flash` | `openrouter/qwen/qwen3.6-plus` | Bulk routine lookups, version checks, name disambiguation |

**Removed since previous version:** `Nova` — the deep-research role folded into Pulsar (sonar-deep-research), since one Sonar-based agent is enough for web search and Nova's scope overlapped with Pulsar's.

---

## 🧭 Dispatch Cheat Sheet

### "I have an idea but don't know if it's a good one"
→ **Vega** (8+ alternatives) → then **Cassiopeia** (structure the chosen one)

### "I need to build feature X"
→ **Cassiopeia** (design) → **Sirius** (implement) → **Orion** (tests) → **Aldebaran** (verify)

### "Something is broken and I don't know why"
→ **Corvus** (find root cause) → **Sirius** (apply fix) → **Aldebaran** (verify)

### "Vague task that doesn't fit a specialist"
→ **Procyon**

### "I need current information from the web"
- Live search, current events, or deep multi-pass investigation → **Pulsar**
- Multiple sources to reconcile → **Nebula**
- Structured data to extract into tables → **Atlas**
- Cheap bulk lookups → **Quasar**

### "I need to think across many memory shards"
→ **Lyra** (synthesis) or **Spectra** (per-shard refraction)

### "I need a hard adversarial second opinion"
→ **peer** (adversarial peer; truth-seeking, refutation, blind-spot hunting)

---

## 🎯 Model-Family Prompt Style (per model)

Each agent's prompt is tuned to its underlying model. These are **starting heuristics based on model type** — not yet re-validated against the new open-weight roster (the prior Round-1–4 tuning was for the retired DeepSeek-R1 / Qwen-thinking / Kimi-K2.5 / GPT-5.5 roster). Re-tune empirically as eval evidence accrues.

| Model Family | Prompt Style | Agents Using It |
|--------------|--------------|-----------------|
| **GLM-5.2** (reasoning/planning) | Single clear mandate, reasoning room, minimal over-structure; suited to long-horizon plans | Cassiopeia, Orion, Aldebaran, Lyra, Spectra, Corvus, Nebula |
| **DeepSeek-V4-Pro** (coding) | Concrete task spec, explicit done-conditions, file paths; expects to land changes on disk | Sirius |
| **DeepSeek-V4-Flash** (cheap/agentic) | Tight scope, structured output, bounded steps; cheap bulk + workhorse | Procyon, Atlas, Quasar |
| **Kimi-K2.6** (orchestration/ideation) | Rich examples, concrete worked cases, tight output spec; strong at fan-out/dialectic | Markarian, Vega |
| **Qwen3.6-Plus** (coding, 1M ctx) | Can hold large context; explicit coverage/acceptance targets | (alternate on Sirius, Nebula, Atlas, Quasar) |
| **Perplexity Sonar Deep Research** | Search-native, no user tool-use. **Only inside Pulsar.** | Pulsar |
| **Grok-4.20** (adversarial) | High temperature, minimal constraint; invite pushback, refutation, contrarian angles | peer |

---

## 📁 File Locations

- **Canonical:** `/Users/jrg/agent-core/primitives/08_subagents/<name>.md`
- **Runtime:** `~/.pi/agent/agents/<name>.md`
- **Project overrides:** `<project>/.pi/agents/<name>.md`

Each `.md` file has YAML frontmatter with: `name`, `role`, `description`, `model`, `alternate`, `provider`, `tools`.

**All agents currently have `tools: strudel_search, strudel_prep, strudel_bake`** — the strudel-only surface locked in Round 3.

---

## 🔄 Fleet Change Log

**2026-07-07 (open-weight refresh):** Model profiling retired; models chosen from OpenRouter's June-2026 open-weight leaders and hardcoded as opinionated defaults across all subagent profiles. Palette by role:
- reasoning / architecture / verification / synthesis / debugging → `openrouter/z-ai/glm-5.2` (top open-weight Intelligence Index; long-horizon)
- implementation / coding / review → `openrouter/deepseek/deepseek-v4-pro` (top open SWE-bench, 80.6%)
- cheap workhorse / bulk / distill → `openrouter/deepseek/deepseek-v4-flash` (~150× cheaper, ~79% SWE)
- orchestration / ideation → `openrouter/moonshotai/kimi-k2.6` (multi-agent orchestration)
- test authoring → `openrouter/qwen/qwen3.6-plus` (strongest agentic coding, 1M ctx)
- Pulsar keeps `perplexity/sonar-deep-research` (search-native; deliberate non-open exception; open fallback = glm-5.2)
- `peer-grok` renamed `peer` (adversarial peer; Grok naming removed), model `openrouter/x-ai/grok-4.20` (largest grok reasoning; second deliberate non-open exception)

All slugs resolve-verified against the live OpenRouter model list. Decided against `openrouter/fusion` (ensemble, ~4–5× cost, tool-passthrough unconfirmed) and `openrouter/auto` (constrained auto-routing) — sticking with single hardcoded models per role.

**2026-06-30 (Round 4):**
- **Nova removed.** Deep-research role folded into Pulsar (sonar-deep-research).
- **Pulsar upgraded** from `sonar-reasoning` to `sonar-deep-research`.
- **Orion primary swapped:** Qwen-thinking → DeepSeek-R1. Reason: Qwen failed to write any file on Task 08, emitting prose tool-call representations instead.
- **Atlas primary swapped:** Qwen-thinking → DeepSeek-R1. Reason: Qwen produced a plausible-looking but fabricated recipe catalog on Task 09.
- **Lyra alt swapped:** Qwen-thinking → GLM-4.5. Reason: Qwen unreliability confirmed across 4 rounds.
- **Corvus primary swapped:** Perplexity Sonar → Kimi K2.5. Reason: Sonar does not support user tool-use.
- **Spectra primary swapped:** Perplexity Sonar → DeepSeek-R1. Same reason as Corvus.
- **Quasar primary swapped:** Qwen-thinking → Mistral 24b. Reason: Qwen unreliability; Mistral is cheaper and appropriate for the role.
- **All alternate slots deduplicated** so no agent has the same primary and alternate.

**2026-06-30 (Round 3):**
- All agents constrained to `tools: strudel_search, strudel_prep, strudel_bake`.
- All model slugs prefixed with `openrouter/` where routed via OpenRouter (silent-fail fix).
- Cassiopeia primary swapped: Qwen-thinking → DeepSeek-R1.
- Vega alt swapped: Qwen-thinking → DeepSeek-R1.
- Aldebaran alt swapped: Qwen-thinking → GLM-4.5.

**2026-06-30 (Round 1–2):** Initial fleet established with Kimi/Qwen/DeepSeek/Perplexity mix. Baseline evaluations performed. See `EVAL-REPORT.md`.
