# Agent Core Primitives — Research Overview

**Status:** Draft v0.1  
**Date:** 2026-04-14  
**Author:** Research scaffold — for blog post / open-source documentation  
**Audience:** Builders, tinkerers, framework authors, harness engineers

---

## Purpose

This research directory maps the nine core primitives of AI coding agents — the foundational building blocks that every major platform, harness, and provider uses in some form — plus emerging primitives that are reshaping agentic workflows in 2026.

The goal is to produce a provider-agnostic, model-agnostic reference that any developer building, testing, or extending AI agent systems can use.

---

## Contents

| File | Topic |
|------|-------|
| `01-directives.md` | Always-on context injection (CLAUDE.md, AGENTS.md patterns) |
| `02-slash-commands.md` | User-invoked prompt shortcuts |
| `03-skills.md` | Reusable on-demand knowledge/workflow modules |
| `04-tools.md` | Built-in and custom function execution |
| `05-mcp-servers.md` | External tool connectivity via protocol (MCP, JSON-RPC) |
| `06-plugins.md` | Bundled, distributable capability packs |
| `07-hooks.md` | Deterministic event-driven automation |
| `08-rules.md` | Always-on policies and safety enforcement |
| `09-agents-subagents.md` | Delegated agent contexts and multi-agent teams |
| `10-emerging-primitives.md` | Memory, evaluators, planners, routers, state, and beyond |
| `11-harness-engineering.md` | The evolution: prompts → context → harness |

---

## The Thesis

AI coding agents across every major provider share a common architecture. Whether you are using a CLI harness, an IDE extension, a cloud-hosted platform, or a self-hosted runtime, the same nine primitives appear — sometimes under different names, sometimes composed differently, but always present.

These nine primitives compose into a **layered agentic loop**:

```
GATHER → PLAN → ACT → VERIFY
  ↑                         |
  └─────── (repeat) ────────┘
```

Each primitive plugs into this loop at a precise point:

- **Directives** → shape the entire loop before it starts
- **Rules** → enforce invariants at every loop phase
- **Skills** → inject expertise at the GATHER phase
- **Slash Commands** → trigger the loop manually from outside
- **Tools** → power the ACT phase
- **MCP Servers** → extend the ACT phase to external systems
- **Hooks** → fire deterministically at loop phase boundaries
- **Plugins** → bundle and distribute any of the above
- **Agents/Subagents** → spawn parallel or child loops

---

## The Three Eras of Agentic Development

Research from 2026 identifies three clear epochs:

| Era | Years | Focus | What was optimized |
|-----|-------|-------|-------------------|
| **Prompt Engineering** | 2022–2024 | The message | Token phrasing, few-shot examples |
| **Context Engineering** | 2025 | The window | What goes in, when, at what cost |
| **Harness Engineering** | 2026+ | The environment | Runtime, lifecycle, orchestration |

This document set lives at the intersection of all three — with particular attention to the harness layer, where the primitives are now becoming first-class runtime concerns.

---

## How to Use This Research

Each primitive document follows the same structure:

- **What it is** — definition and mental model
- **Who uses it** — actor(s) in the agentic system
- **Where it lives** — filesystem, config, runtime
- **When it fires** — load point in the agentic loop
- **Why it exists** — the problem it solves
- **How to implement it** — implementation pattern (provider-agnostic)
- **Context cost** — token/resource implications
- **Composition** — how it interacts with other primitives
- **Research citations** — sources and further reading
