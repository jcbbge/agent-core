# Agent Fleet — Constellation Taxonomy

**Updated:** 2026-06-30 (post-Round-4)  
**Provider:** OpenRouter (global) + Perplexity direct (Pulsar only)  
**Total agents:** 14 across 3 fleets

> ⚠️ **Model assignments refreshed 2026-07-07** to the latest open-weight models (OpenRouter June-2026 leaders). The authoritative primary/alternate for each agent is the `model:`/`alternate:` frontmatter in the profile `.md` files. The Primary/Alternate columns and the per-family prompt-style notes in this doc are from Round 4 and are pending a rewrite — see the change log at the bottom for the current palette.

---

## 🌌 Constellation Fleet — Software Development Lifecycle

The canonical six-star fleet (plus the persistent Quasar-of-orchestration, Markarian) for the SDLC: ideation → architecture → implementation → testing → verification.

| Star | Role | House | Primary Model | Alternate | When to Use |
|------|------|-------|---------------|-----------|-------------|
| **Markarian** | Orchestrator (persistent) | persistent | `openrouter/openai/gpt-5.5-pro` | `openrouter/qwen/qwen3-next-80b-a3b-thinking` | Multi-phase work, fleet dispatch, user-facing coordination |
| **Vega** | Brainstorm partner (Dawn) | Dawn | `openrouter/moonshotai/kimi-k2.5` | `openrouter/deepseek/deepseek-r1` | Pre-architecture ideation, ≥8 divergent options, contrarian angles |
| **Cassiopeia** | Systems thinker (Meridian) | Meridian | `openrouter/deepseek/deepseek-r1` | `openrouter/qwen/qwen3-next-80b-a3b-thinking` | Interface design, invariants, ownership, blast-radius analysis |
| **Sirius** | Coder (Descent) | Descent | `openrouter/moonshotai/kimi-k2.7-code` | `openrouter/qwen/qwen3-coder-plus` | Implementation with commit discipline (design already settled) |
| **Orion** | Test-maker (Descent) | Descent | `openrouter/deepseek/deepseek-r1` | `openrouter/qwen/qwen3-next-80b-a3b-thinking` | Test strategy, coverage matrix, property tests, regression tests |
| **Aldebaran** | Strict tester (Night) | Night | `openrouter/deepseek/deepseek-r1` | `openrouter/z-ai/glm-4.5` | Adversarial verification, counter-example hunting, acceptance gating |

---

## 🔧 Development-Workflow Fleet — Alembic / General Tasks

Specialized agents for memory-substrate work and general delegation outside the SDLC.

| Agent | Role | Primary Model | Alternate | When to Use |
|-------|------|---------------|-----------|-------------|
| **Procyon** | General-task workhorse | `openrouter/moonshotai/kimi-k2.5` | `openrouter/z-ai/glm-4.5` | Well-defined task, no specialist fits |
| **Lyra** | LLM synthesis (emergence) | `openrouter/deepseek/deepseek-r1` | `openrouter/z-ai/glm-4.5` | Emergence from memory shards (Alembic dreaming mind) |
| **Spectra** | Diamond refraction | `openrouter/deepseek/deepseek-r1` | `openrouter/z-ai/glm-4.5` | Dual-facet extraction on new shard creation |
| **Corvus** | Debugger | `openrouter/moonshotai/kimi-k2.5` | `openrouter/deepseek/deepseek-r1` | Mystery bugs, substrate-level repair, root-cause investigation |

---

## 🔭 Web-Search Fleet — Research & Information Retrieval

Tiered research agents. **Pulsar is the one Perplexity Sonar agent** (upgraded to `sonar-deep-research`, the strongest variant); everyone else uses tool-calling models.

| Agent | Role | Primary Model | Alternate | When to Use |
|-------|------|---------------|-----------|-------------|
| **Pulsar** | Web search + deep research | `perplexity/sonar-deep-research` | `openrouter/openai/gpt-5.5-pro` | Live web research, current events, long-form investigation with grounding |
| **Nebula** | Search synthesis | `openrouter/openai/gpt-5.5-pro` | `openrouter/google/gemini-2.5-pro` | Multi-source synthesis, reconciling competing sources |
| **Atlas** | Search worker (structured) | `openrouter/deepseek/deepseek-r1` | `openrouter/mistralai/mistral-small-24b-instruct` | Structured research tasks, tabular outputs, mid-weight investigation |
| **Quasar** | Cheap search | `openrouter/mistralai/mistral-small-24b-instruct` | `openrouter/deepseek/deepseek-r1` | Bulk routine lookups, version checks, name disambiguation |

**Removed since previous version:** `Nova` — the deep-research role folded into Pulsar (sonar-deep-research), since one Sonar-based agent is enough for web search and Nova’s scope overlapped with Pulsar’s.

---

## 🧭 Dispatch Cheat Sheet

### “I have an idea but don’t know if it’s a good one”
→ **Vega** (8+ alternatives) → then **Cassiopeia** (structure the chosen one)

### “I need to build feature X”
→ **Cassiopeia** (design) → **Sirius** (implement) → **Orion** (tests) → **Aldebaran** (verify)

### “Something is broken and I don’t know why”
→ **Corvus** (find root cause) → **Sirius** (apply fix) → **Aldebaran** (verify)

### “Vague task that doesn’t fit a specialist”
→ **Procyon**

### “I need current information from the web”
- Live search, current events, or deep multi-pass investigation → **Pulsar**
- Multiple sources to reconcile → **Nebula**
- Structured data to extract into tables → **Atlas**
- Cheap bulk lookups → **Quasar**

### “I need to think across many memory shards”
→ **Lyra** (synthesis) or **Spectra** (per-shard refraction)

---

## 🎯 Model-Family Prompt Style (per model)

Each agent’s prompt is tuned to its underlying model:

| Model Family | Prompt Style | Agents Using It |
|--------------|--------------|-----------------|
| **DeepSeek-R1** | Sparse, single mandate, reasoning-room, no over-structure | Aldebaran, Cassiopeia, Orion, Lyra, Atlas, Spectra |
| **Qwen3-next-thinking** | Explicit “think first” preamble, structured output. **Do not use as primary where files must land on disk** (Rounds 1–4 confirmed hallucination). | Kept only as alternate on Cassiopeia, Markarian, Orion |
| **Kimi K2.5 / K2.7-Code** | Rich examples, concrete worked cases, tight output spec | Vega, Procyon, Sirius, Corvus |
| **GPT-5.5-pro** | Routing rubrics, tool inventories, decision tables | Markarian (primary), Nebula, Pulsar/Atlas/Quasar (fallbacks) |
| **Perplexity Sonar Deep Research** | Search-native, no user tool-use. **Only used inside Pulsar.** | Pulsar |
| **Mistral Small 24b** | Cheap bulk work, structured extraction | Quasar (primary), Atlas (alternate) |
| **GLM-4.5** | Solid general fallback | Aldebaran alt, Procyon alt, Lyra alt, Spectra alt |

---

## 📁 File Locations

- **Canonical:** `/Users/jrg/agent-core/primitives/08_subagents/<name>.md`
- **Runtime:** `~/.pi/agent/agents/<name>.md`
- **Project overrides:** `<project>/.pi/agents/<name>.md`

Each `.md` file has YAML frontmatter with: `name`, `fleet`, `role`, `description`, `model`, `alternate`, `tools`.

**All agents currently have `tools: strudel_search, strudel_prep, strudel_bake`** — the strudel-only surface locked in Round 3.

---

## 🔄 Fleet Change Log

**2026-07-07 (open-weight refresh):** Model profiling retired; models chosen from OpenRouter's June-2026 open-weight leaders and hardcoded as opinionated defaults across all 26 subagent profiles. Palette by role:
- reasoning / planning / verification / synthesis / debugging → `openrouter/z-ai/glm-5.2` (top open-weight Intelligence Index; long-horizon)
- implementation / coding / review → `openrouter/deepseek/deepseek-v4-pro` (top open SWE-bench, 80.6%)
- cheap workhorse / bulk / distill → `openrouter/deepseek/deepseek-v4-flash` (~150× cheaper, ~79% SWE)
- orchestration / ideation → `openrouter/moonshotai/kimi-k2.6` (multi-agent orchestration)
- test authoring → `openrouter/qwen/qwen3.6-plus` (strongest agentic coding, 1M ctx)
- peer-diversity slot → `openrouter/openai/gpt-oss-120b` (peer-grok switched from Perplexity/grok → OpenRouter/open)
- Pulsar keeps `perplexity/sonar-deep-research` (search-native; the one deliberate non-open exception; open fallback = glm-5.2)

Tables above pending rewrite to match.

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
