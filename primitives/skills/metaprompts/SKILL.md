---
name: metaprompts
description: Access and use patterns from your personal metaprompts library. Use when you need proven prompting patterns, mental models, or structured approaches for code review, optimization, documentation, or system design.
disable-model-invocation: true
metadata:
  version: "1.0"
  category: meta-cognitive
  patterns: 22
  source: /Users/jcbbge/Documents/metaprompts
  last_updated: "2025-02-02"
---

# Metaprompts Library Skill

Access 22 proven prompting patterns organized by category.

## Quick Access

**INDEX**: `/Users/jcbbge/Documents/metaprompts/INDEX.md`  
**Quick versions**: `/Users/jcbbge/Documents/metaprompts/quick/`  
**Full versions**: `/Users/jcbbge/Documents/metaprompts/{category}/`

## Pattern Categories

### Principles (Mental Models)
- **cognitive_approaches** - Feynman, Hamming, Taoist principles
- **creative_systems_thinking** - Ted Nelson, Zig Zag structures

### Prompts (Ready-to-Use)
- **fresh_eyes_review** - Error detection with fresh perspective
- **big_brained_optimizer** - High-impact, safe optimization
- **idea_wizard** - Generate 30 ideas, winnow to top 5
- **robot_mode_maker** - Create agent-optimized CLI tooling
- **project_documentation** - FOR[yourname].md pattern
- **non_technical_async** - Background agent with simple summaries
- **opencode_ecosystem_analysis** - Multi-repo analysis
- **step_workflow** - Sequential phase workflow
- **think_critically** - Tradeoff analysis
- **repo_deep_dive_analysis** - Systematic repo analysis

### Patterns (Behavior Modifiers)
- **chat_directives** - [No artifacts], [Results only], etc.
- **timestamp_protocol** - Temporal anchoring
- **meta_agent_template** - XML agent definition

### Skills (Specialized Knowledge)
- **backend_first_security** - Zero-trust security rules
- **security_checklist** - VPS hardening guide
- **refactoring_skill** - 12-dimension code review

### Frameworks (System Architectures)
- **knowledge_graph_system** - Processing phases, slash commands

## Usage by Task

**Review or check:**
- Catch errors → fresh_eyes_review
- Security → backend_first_security, security_checklist

**Improve or optimize:**
- Performance → big_brained_optimizer
- Refactor → refactoring_skill
- Generate ideas → idea_wizard

**Plan or design:**
- System thinking → cognitive_approaches
- Documentation → project_documentation
- Tradeoffs → think_critically

**Build:**
- Agent tooling → robot_mode_maker
- Multi-agent → meta_agent_template
- Knowledge system → knowledge_graph_system

**Analyze:**
- Repo analysis → repo_deep_dive_analysis
- Ecosystem → opencode_ecosystem_analysis
- Creative thinking → creative_systems_thinking

**Communicate:**
- Non-technical → non_technical_async
- Control behavior → chat_directives

## Common Workflows

### Optimization Workflow
1. fresh_eyes_review (catch errors)
2. big_brained_optimizer (find wins)
3. refactoring_skill (implement safely)

### Planning Workflow
1. idea_wizard (30 ideas → top 5)
2. think_critically (analyze tradeoffs)
3. step_workflow (phase execution)

### Documentation Workflow
1. repo_deep_dive_analysis (understand)
2. project_documentation (write)
3. non_technical_async (explain)

### Security Workflow
1. security_checklist (server hardening)
2. backend_first_security (application)
3. chat_directives ("[Security review]")

## File Locations

All files are in `/Users/jcbbge/Documents/metaprompts/`:
- `INDEX.md` - Master catalog with trigger phrases
- `quick/` - Stripped versions for immediate use
- `principles/`, `prompts/`, `patterns/`, `skills/`, `frameworks/` - Full versions with analysis

## Integration

This skill integrates with:
- Claude Code (via symlink)
- OpenCode (native skill)
- Your AGENTS.md/claude.md configurations

For standalone use, high-value patterns are also symlinked as individual skills:
- backend-first-security
- fresh-eyes-review
- big-brained-optimizer
