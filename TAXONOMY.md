# Agent-Core Taxonomy
**Updated:** 2026-06-28

Single source of truth for agent primitives. Harness-agnostic. Project-specific primitives live in their respective repos.

---

## Summary

| Category | Count | Description |
|----------|-------|-------------|
| 01_directives | 0 | Standing instructions (project-specific moved out) |
| 02_commands | 2 | Slash commands |
| 03_skills | 68 | Loadable skill files |
| 04_hooks | 2 | Shell hooks for lifecycle events |
| 06_rules | 10 | Always-on constraints |
| 08_subagents | 13 | Specialist agent definitions |
| 10_plugins | 13 | Pi extensions |
| **TOTAL** | **108** | |

---

## 01_directives (0)

Empty. Project-specific directives live in project repos.

---

## 02_commands (2)

| Command | Purpose |
|---------|---------|
| `tabs.md` | iCloud tabs export, categorize, distill |
| `tower.md` | Fleet orchestration control panel |

---

## 04_hooks (2)

| Hook | Purpose |
|------|---------|
| `agent-spawn-check.sh` | Pre-spawn validation |
| `rtk-rewrite.sh` | RTK command rewriting |

---

## 06_rules (10)

| Rule | Purpose |
|------|---------|
| `alembic.md` | Memory substrate usage |
| `backend-first-security.md` | Zero-trust, frontend is view only |
| `commit-convention.md` | PHASE/DONE/TODO commit format |
| `debugging-discipline.md` | Post-outage hard rules (Bento incident) |
| `debugging.md` | Root cause first, cascade errors |
| `git.md` | Never force-push, explicit staging |
| `long-running-processes.md` | If you start it, you own teardown |
| `secrets.md` | Never inline secrets in any config |
| `tower-orchestration.md` | Fleet message bus protocol |
| `work-file-format.md` | WORK.md structure |

---

## 08_subagents (13)

| Subagent | Model | Purpose |
|----------|-------|---------|
| `architect` | minimax-m2.5-free | System design, tradeoffs |
| `coder` | gpt-5.4 | Implementation tasks |
| `debugger` | minimax-m2.5-free | Root cause analysis |
| `diamond-refraction` | gpt-5.1 | Alembic dual-lens extraction |
| `fix-archimedes` | gpt-5.1 | Debug Archimedes reflex |
| `llm-synthesis` | gpt-5.1 | Alembic dream daemon synthesis |
| `peer-grok` | grok-4-1-fast | Heavyweight thought partner |
| `reviewer` | minimax-m2.5-free | Code review |
| `scout` | (default) | Pre-flight verification |
| `sigil-distiller` | minimax-m2.5-free | Process sigil inbox |
| `tabs-processor` | claude-sonnet-4 | iCloud tabs → primitives |
| `test-writer` | minimax-m2.5-free | Write tests |
| `worker` | claude-sonnet-4-6 | General purpose |

---

## 10_plugins (13)

### Directories (7)
| Plugin | Purpose |
|--------|---------|
| `alembic/` | Memory substrate tools |
| `alembic-boot/` | Auto-reconstitute on session start |
| `alembic-ingest/` | Auto-emit shards on patterns |
| `perplexity/` | Perplexity provider |
| `subagent/` | Delegate to specialists |
| `voice-report/` | TTS reports |

### Standalone (7)
| Plugin | Purpose |
|--------|---------|
| `alembic-telemetry.ts` | SurrealDB health widget |
| `composto.ts` | Code-to-IR compression |
| `peer-session.ts` | Multi-agent coordination |
| `perplexity-search.ts` | Web search tool |
| `propose-extension.ts` | Autophagic tool builder |
| `rtk-rewrite.ts` | RTK command rewriting |
| `smart-search.ts` | 4-layer search routing |

---

## 03_skills (68)

### Session & Workflow (6)
| Skill | Purpose |
|-------|---------|
| `starting-session` | Orient at session start |
| `ending-session` | Close session, commit, handoff |
| `background-boot` | Async agent init |
| `retro` | Session retrospective |
| `step-workflow` | Step-by-step execution |
| `delegate` | Task delegation |

### Debugging (4)
| Skill | Purpose |
|-------|---------|
| `debug-hypothesis` | Scientific debugging loop |
| `debugging-async` | Async/concurrent debugging |
| `debugging-with-logs` | Log-based debugging |
| `big-brained-optimizer` | Performance optimization |

### SolidJS (2)
| Skill | Purpose |
|-------|---------|
| `building-with-solidjs` | Core SolidJS patterns |
| `building-with-solidstart` | SolidStart meta-framework |

### Documents (6)
| Skill | Purpose |
|-------|---------|
| `docx` | Word document generation |
| `pdf` | PDF generation |
| `pptx` | PowerPoint generation |
| `xlsx` | Excel generation |
| `atelier` | Editorial presentations |
| `editorial-magazine` | Magazine-style layouts |

### Design & UI (7)
| Skill | Purpose |
|-------|---------|
| `aesthethic-interface-protocol` | Interface aesthetics |
| `algorithmic-art` | Generative art |
| `canvas-design` | Canvas-based design |
| `design-intelligence` | Design thinking |
| `emil-design-eng` | Emil Kowalski patterns |
| `make-interfaces-feel-better` | UI polish |
| `micro-animation-director` | Spring animations |

### Thinking & Analysis (13)
| Skill | Purpose |
|-------|---------|
| `challenging-assumptions` | Question assumptions |
| `cognitive-approaches` | Mental models |
| `creative-systems-thinking` | Systems creativity |
| `criticality` | Edge of chaos |
| `detecting-blind-spots` | Find blind spots |
| `evaluating-business-strategy` | Business evaluation |
| `evaluating-product-ideas` | Product evaluation |
| `exploring-possibilities` | Possibility space |
| `mapping-adjacent-possibilities` | Adjacent possible |
| `reframing-problems` | Problem reframing |
| `synthesizing-insights` | Insight synthesis |
| `think-critically` | Critical thinking |
| `thinking-systemically` | Systems thinking |

### Development (10)
| Skill | Purpose |
|-------|---------|
| `backend-first-security` | Security patterns |
| `designing-apis` | API design |
| `dev-browser` | Browser automation |
| `enforcer` | Code quality enforcement |
| `fresh-eyes-review` | Fresh perspective review |
| `refactor` | Refactoring patterns |
| `repo-deep-dive-analysis` | Codebase analysis |
| `self-hosting-vps-ubuntu` | VPS setup |
| `thermo-nuclear-code-quality-review` | Strict code review |
| `robot-mode-maker` | Automation scripts |

### Content & Voice (5)
| Skill | Purpose |
|-------|---------|
| `jcbbge-blog` | Blog voice |
| `jcbbge-tweet` | Tweet voice |
| `jcbbge-video-script` | Video script voice |
| `dense-summarization` | Dense summaries |
| `video-transcribe` | Video transcription |

### Agent & Meta (7)
| Skill | Purpose |
|-------|---------|
| `brief` | Task briefs |
| `creating-skills` | Skill authoring |
| `meta-agent-template` | Agent templates |
| `metaprompt-process` | Metaprompt design |
| `metaprompts` | Metaprompt library |
| `non-technical-async` | Async for non-devs |
| `prd` | PRD generation |

### Knowledge & Inbox (6)
| Skill | Purpose |
|-------|---------|
| `tabs-distiller` | iCloud tabs processing |
| `knowledge-graph-system` | Knowledge graphs |
| `opencode-ecosystem-analysis` | OpenCode analysis |
| `processing-sigils` | Sigil inbox |
| `project-documentation` | Project docs |
| `idea-wizard` | Idea generation |

### Misc (2)
| Skill | Purpose |
|-------|---------|
| `luck` | Luck surface area |
| `learning-opportunities` | Learning paths |

---

## Project-Specific Primitives

These were moved out of agent-core to their respective projects:

### Arc (`~/infinity/arc/.claude/skills/`) — 27 skills
- Session: `session-start`, `session-end`
- Solid 2.0: `solidjs-2.0`, `solid-2-*` (9 skills), `solid-ref`, `solid-verify`, `solid-2`
- Audit: `thermo-nuclear-arc-*` (6 skills)
- Domain: `galley-api`, `hubspot`, `arc-ui`, `impeccable`, `rams`, `icon-author`, `tiptap`, `delegate`

### Bento (`~/infinity/bento/.claude/skills/`) — 1 skill
- `bento-do-query` — Direct Bento PostgreSQL queries

---

## Deprecated / Removed

| Primitive | Reason |
|-----------|--------|
| `install.md` (command) | Overengineered, hardcoded paths |
| `install` (skill) | Command deprecated |
| `solidjs.md` (rule) | Too narrow for global rule |
| `timestamp-protocol.md` (rule) | Niche, unused |
| `superset-hooks.ts` (plugin) | Superset terminal not used |
| `uptime.ts` (plugin) | Not useful |
| `marketplaces/` (plugin) | Claude plugins not used |
| `solid-import-updater` (skill) | Migration complete |
| `solid-version-detector` (skill) | Migration complete |
| `arc-conventions.md` (directive) | Moved to Arc |
| `tab-*` commands (4) | Consolidated to `tabs.md` |

---

## Sync Status

Agent-core is the source of truth. Harnesses should sync from here:

| Harness | Location | Sync Method |
|---------|----------|-------------|
| Pi | `~/.pi/agent/` | Manual or symlink |
| Claude Code | `~/.claude/` | Manual or symlink |
| Project-local | `.claude/` in repo | Project-specific only |
