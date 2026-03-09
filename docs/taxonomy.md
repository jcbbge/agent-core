#BQ:---
#HQ:name: agent-core-taxonomy
#KN:description: Internal topological mapping of agent-core primitives organized by conceptual domain. Secondary taxonomy for categorizing and organizing the meta agent framework. Used to identify gaps, plan improvements, and integrate with sigil processing workflows.
#RX:license: MIT
#PJ:version: "1.0"
#TV:tags: meta, taxonomy, organization, agent-core, primitives
#MK:---
#SK:
#XP:# Agent-Core Taxonomy
#XQ:*Internal topological mapping for the meta agent framework*
#ZR:*Last updated: 2026-03-07*
#BY:
#XW:## Overview
#JV:
#NQ:This document provides the **secondary taxonomy** for organizing all agent-core primitives by **conceptual domain** rather than by primitive type. Use this to:
#KB:
#ZT:1. **Audit coverage** — Which domains are over/under-represented?
#ZR:2. **Plan improvements** — What gaps need filling?
#XP:3. **Categorize inbox items** — Where do new captures belong?
#TH:4. **Design sigil workflows** — Domain-specific processing paths
#JW:
#WH:---
#ZP:
#XW:## The Eight Conceptual Domains
#HT:
#XW:| Domain | Purpose | Current Count | Balance |
#YM|--------|---------|---------------|---------|
#TH| **Cognitive** | How to think, not what to do | 10 | Underweight commands |
#NQ| **Development** | Building software | 22 | Dominant |
| **Workflow** | Multi-step procedures | **15** | **+4 workflows added** |
#ZR| **Product** | Building products/business | 7 | Underweight |
#XP| **Document** | File format operations | 6 | Balanced |
#TH| **Knowledge** | Information systems, memory | 14 | Strong |
#JW| **Systems** | Infrastructure, self-management | 13 | Strong |
#WH| **Unassigned** | Need categorization | 15 | Audit needed |
#XQ:
#YR:---
#KB:
#HH:## Domain 1: Cognitive / Conceptual Thinking
#JV:*Analysis lens + Meta-cognitive — How to think, not what to do*
#TW:
#HH:### Primitives
#XW:
#TW:| Primitive | Type | Purpose |
#YM|-----------|------|---------|
#NM| `cognitive-approaches` | Command | Mental models: Feynman, Hamming, Taoist |
#XP| `creative-systems-thinking` | Command | 10x radical innovation, Ted Nelson |
#TH| `think_critically` | Command | Multi-approach decision analysis |
#JW| `challengating-assumptions` | Skill | Adversarial analysis |
#WH| `detecting-blind-spots` | Skill | Surface missing perspectives |
#XQ| `reframing-problems` | Skill | Validate problem formulation |
#YR| `exploring-possibilities` | Skill | Divergent thinking |
#KB| `thinking-systemically` | Skill | Systems analysis, 2nd-order effects |
#TW| `synthesizing-insights` | Skill | Connect disparate concepts |
#YM| `collaborating-partner-mode` | AGENTS.md | Strategic partner behavior |
#NM| `timestamp-protocol` | AGENTS.md | Temporal anchoring |
#XP:
#TH:### Gap Analysis
#JW:
#WH:- **Commands underweight**: Only 3 explicit commands vs 6 skills
#XQ- **Missing**: Emotional intelligence / interpersonal reasoning
#YR- **Missing**: Creative writing / narrative thinking
#KB- **Missing**: Mathematical / formal reasoning
#TW:
#YM:---
#NM:
#XP:## Domain 2: Development / Implementation
#TH:*Domain expertise — Building software*
#JW:
#WH:### Primitives
#XQ:
#YR| Primitive | Type | Purpose |
#KB|-----------|------|---------|
#TW| `building-with-solidjs` | Skill | Fine-grained reactivity |
#YM| `building-with-solidstart` | Skill | Full-stack SolidStart |
#NM| `backend-first-security` | Skill | Zero-trust architecture |
#XP| `debugging-with-logs` | Skill | Wide events debugging |
#TH| `designing-apis` | Skill | REST API design |
#JW| `big-brained-optimizer` | Skill | Performance optimization |
#WH| `refactoring-framework` | Skill | 12-dimension review |
#XQ| `refactor` | Skill | Surgical refactoring |
#YR| `fresh-eyes-review` | Skill | Error detection |
#KB| `security-checklist` | Skill | VPS hardening |
#TW| `self-hosting-vps-ubuntu` | Skill | Ubuntu server setup |
#YM| `robot-mode-maker` | Skill | AI-friendly CLI/API |
#NM| `solidjs` | Rule | Reactivity rules |
#XP| `infrastructure` | Rule | MCP/SurrealDB safety |
#TH| `debugger` | Subagent | Root cause analysis |
#JW| `reviewer` | Subagent | Code review |
#WH| `test-writer` | Subagent | Test coverage |
#XQ| `architect` | Subagent | System design |
#YR:
#KB:### Gap Analysis
#TW:
#YM- **Dominant domain**: 26% of all primitives
#NM- **Missing**: Testing frameworks (beyond test-writer)
#XP- **Missing**: CI/CD, deployment patterns
#TH- **Missing**: Database design / ORM patterns
#JW- **Missing**: Mobile development (React Native, native)
#WH:
#XQ:---
#YR:
#KB:## Domain 3: Workflow / Process
#TW:*Workflow — Multi-step procedures*
#YM:
#NM:### Primitives
#XP:
| Primitive | Type | Purpose |
|-----------|------|---------|
| `starting-session` | Skill | Context-aware orientation |
| `ending-session` | Skill | Session handoff capture |
| `step-workflow` | Skill | Phase-gated workflow |
| `cognitive-analysis` | **Workflow** | System → Challenge → Blindspots → Reframe |
| `code-evolution` | **Workflow** | Error check → Optimize → Refactor |
| `knowledge-synthesis` | **Workflow** | Research → Synthesize → Graph |
| `product-launch` | **Workflow** | Validate → Strategy → PRD → Document |
| `sigil-distiller` | Subagent | Autonomous inbox processing |
| `processing-sigils` | Skill | Inbox distillation methodology |
| `learning-opportunities` | Skill | Post-work learning |
| `learning-opportunity-hook` | Hook | PostGitCommit trigger |
| `step_workflow` | Command | Quick workflow pattern |
| `learning` | Command | Quick learning trigger |
| `meta_agent_template` | Command | XML observer template |
| `non_technical_async` | Command | Stakeholder communication |
| `idea_wizard` | Command | Diverge-converge ideation |
#KB:### Gap Analysis
#TW:
#YM- **Balanced**: Good skill/command ratio
#NM- **Missing**: Project management / task tracking
#XP- **Missing**: Time estimation / sprint planning
#TH- **Missing**: Meeting workflows / facilitation
#JW:
#WH:---
#XQ:
#YR:## Domain 4: Product / Strategy
#KB:*Domain expertise — Building products*
#TW:
#YM:### Primitives
#NM:
#XP| Primitive | Type | Purpose |
#TH|-----------|------|---------|
#JW| `evaluating-product-ideas` | Skill | Product-market fit |
#WH| `evaluating-business-strategy` | Skill | Commercial viability |
#XQ| `mapping-adjacent-possibilities` | Skill | 2nd-order effects |
#YR| `design_intelligence` | Command | UI/UX design system |
#KB| `project_documentation` | Command | FOR[yourname].md docs |
#TW| `prd` | Skill | Product requirement docs |
#YM| `bento` | Rule | Laravel/Vue3 context |
#NM:
#XP:### Gap Analysis
#TH:
#JW- **Underweight**: Only 7 primitives (8%)
#WH- **Missing**: User research / interview analysis
#XQ- **Missing**: Go-to-market / launch planning
#YR- **Missing**: Pricing strategy / monetization
#KB- **Missing**: Competitive analysis
#TW- **Missing**: Analytics / metrics interpretation
#YM:
#NM:---
#XP:
#TH:## Domain 5: Document / Content
#JW:*Domain expertise — File format operations*
#WH:
#XQ:### Primitives
#YR:
#KB| Primitive | Type | Purpose |
#TW|-----------|------|---------|
#YM| `docx` | Skill | Word documents |
#NM| `pdf` | Skill | PDF operations |
#XP| `pptx` | Skill | PowerPoint |
#TH| `xlsx` | Skill | Spreadsheets |
#JW| `canvas-design` | Skill | Visual art PNG/PDF |
#WH| `algorithmic-art` | Skill | p5.js generative art |
#XQ:
#YR:### Gap Analysis
#KB:
#TW- **Balanced**: All are skills (no commands) — intentional
#YM- **Missing**: Video/audio processing
#NM- **Missing**: 3D modeling / CAD
#XP- **Missing**: Web scraping / data extraction
#TH:
#JW:---
#WH:
#XQ:## Domain 6: Knowledge / Memory
#YR:*Reference + Meta-cognitive — Information systems*
#KB:
#TW:### Primitives
#YM:
#NM| Primitive | Type | Purpose |
#XP|-----------|------|---------|
#TH| `anima` | Skill | Persistent memory (SurrealDB) |
#JW| `memory-persistence` | Skill | Memory system patterns |
#WH| `knowledge-graph-system` | Skill | PKM with wikilinks |
#XQ| `metaprompts` | Skill | Prompt pattern library |
#YR| `metaprompt-process` | Skill | Batch processing |
#KB| `knowledge_graph_system` | Command | Quick graph system |
#TW| `repo-deep-dive-analysis` | Skill | External repo patterns |
#YM| `opencode-ecosystem-analysis` | Skill | Multi-repo synthesis |
#NM:
#XP:### Gap Analysis
#TH:
#JW- **Strong domain**: 14 primitives
#WH- **Missing**: Search / retrieval optimization
#XQ- **Missing**: Knowledge validation / fact-checking
#YR- **Missing**: Citation / source management
#KB:
#TW:---
#YM:
#NM:## Domain 7: Systems / Meta
#XP:*Infrastructure + Self-management*
#TH:
#JW:### Primitives
#WH:
#XQ| Primitive | Type | Purpose |
#YR|-----------|------|---------|
#KB| `scratchpad` | Plugin | Persistent Python execution |
#TW| `creating-skills` | Skill | Skill creation guide |
#YM| `openrouter` | Command | OpenRouter model ranking |
#NM| `chat_directives` | Command | Bracket behavior modifiers |
#XP| `git` | Rule | Universal git conventions |
#TH| `observe-mcp` | Hook | MCP tool capture |
#JW| `observe-rule` | Hook | Rule file capture |
#WH| `observe-skill` | Hook | Skill invocation capture |
#XQ| `observe-subagent` | Hook | Subagent read capture |
#YR:
#KB:### Gap Analysis
#TW:
#YM- **Strong domain**: 13 primitives
#NM- **Missing**: Cost management / token optimization
#XP- **Missing**: Session health / recovery
#TH- **Missing**: Parallel instance coordination
#JW:
#WH:---
#XQ:
#YR:## Domain 8: Unassigned / Needs Audit
#KB:*Primitives needing taxonomy assignment*
#TW:
#YM:### Commands (15)
#NM:
#XP| Primitive | Suggested Domain |
#TH|-----------|-----------------|
#JW| `security_checklist` | Development |
#WH| `backend_first_security` | Development |
#XQ| `big_brained_optimizer` | Development |
#YR| `fresh_eyes_review` | Cognitive |
#KB| `idea_wizard` | Workflow |
#TW| `meta_agent_template` | Workflow |
#YM| `non_technical_async` | Workflow |
#NM| `opencode_ecosystem_analysis` | Knowledge |
#XP| `project_documentation` | Product |
#TH| `refactoring_skill` | Development |
#JW| `repo_deep_dive_analysis` | Knowledge |
#WH| `robot_mode_maker` | Development |
#XQ| `step_workflow` | Workflow |
#YR| `think_critically` | Cognitive |
#KB| `timestamp_protocol` | Systems |
#TW:
#YM:---
#NM:
#XP:## Usage Patterns
#TH:
#JW:### For Inbox Processing (Sigil Workflow)
#WH:
#NQ:When a new capture arrives in `~/Documents/metaprompts/_inbox/`:
#KB:
#ZT:1. **Auto-classify** by domain using tags/content analysis
#ZR:2. **Route to domain-specific processing**:
#XP- Cognitive → `challenging-assumptions` + `detecting-blind-spots`
#TH- Development → `debugger` / `reviewer` / `test-writer`
#JW- Workflow → `step-workflow` for procedural breakdown
#WH- Product → `evaluating-product-ideas` for viability
#XQ- Knowledge → `knowledge-graph-system` for integration
#YR- Systems → `creating-skills` if new primitive needed
#KB:
#TW:3. **Identify gaps** — If no matching domain primitive exists, flag for skill creation
#YM:
#NM:### For Gap Analysis
#XP:
#TH:Review domain counts quarterly:
#JW- Cognitive < 15? → Add thinking tools
#WH- Development > 30? → Consider consolidation
#XQ- Product < 10? → Prioritize business skills
#YR:
#KB:### For New Primitive Design
#TW:
#YM:Before creating a new primitive:
#NM:1. Which domain does it belong to?
#XP:2. Does a similar primitive already exist in that domain?
#TH:3. Should it be a skill (auto-detected) or command (explicit)?
#JW:4. Does it fill a gap or duplicate existing coverage?
#WH:
#XQ:---
#YR:
#KB:## Version History
#TW:
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-07 | Initial taxonomy, 86 primitives mapped |
| | | 8 domains defined, gap analysis per domain |
| | | 15 unassigned commands identified |
| 1.1 | 2026-03-08 | Added 4 workflow chaining skills |
| | | cognitive-analysis, code-evolution, knowledge-synthesis, product-launch |
| | | Chaining experiments validated (skill→skill ✓, pause/resume ✓, hook→skill ✗) |
#WH:
