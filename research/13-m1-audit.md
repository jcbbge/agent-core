# M1 Audit — ~/Documents/_agents/schema
**Date:** 2026-04-14  
**Source:** M1 MacBook (m1 @ 10.0.0.199), `/Users/jcbbge/Documents/_agents/schema/`  
**Status:** Audit complete — action items classified

---

## What Exists on M1

The schema directory is a mature, well-structured primitive store. Far more organized than the M5 currently. Key sections:

| Directory | Contents | Count |
|-----------|----------|-------|
| `skills/` | Full SKILL.md packages, many with references/ and scripts/ | ~45 skills |
| `rules/` | Modular rule files (one concern per file) | 8 rules |
| `commands/` | Slash command prompts | ~20 commands |
| `hooks/` | Hook definitions + README | 5 hooks |
| `subagents/` | Specialized subagent definitions | 7 subagents |
| `tools/` | Tool implementations (smart-search, etc.) | 2 tools |
| `integrations/` | Harness integration profile template | 1 template |
| `mcp/` | MCP registry and agent config | 2 files |

---

## Deprecated / Tainted — Do Not Port

These reference removed services (Executor, Anima, Dev-Brain, SurrealDB):

| File | Issue |
|------|-------|
| `skills/anima/SKILL.md` | Entire skill is for the Anima service — REMOVED |
| `skills/ending-session/SKILL.md` | References Executor + SurrealDB observe hooks |
| `skills/starting-session/SKILL.md` | References Executor gateway (:8788) |
| `hooks/observe-mcp.sh` | Writes to SurrealDB — dead |
| `hooks/observe-rule.sh` | Writes to SurrealDB — dead |
| `hooks/observe-skill.sh` | Writes to SurrealDB — dead |
| `hooks/observe-subagent.sh` | Writes to SurrealDB — dead |
| `rules/infrastructure.md` | References Executor/brain-layer ports |
| `subagents/peer-gemini.md` | May reference old tooling — needs check |

**Also skip:** `skills/bento-do-query/` — project-specific to old Bento system, not Arc.

---

## M1-Path Tainted — Needs Path Neutralization Before Port

These are good skills but contain hardcoded M1 paths (`/Users/jcbbge/`):

| File | Issue |
|------|-------|
| `skills/ending-session/SKILL.md` | Has M1 paths + deprecated refs (double-skip) |
| `skills/metaprompts/SKILL.md` | References `~/Documents/_agents/` M1 path |
| `skills/metaprompt-process/SKILL.md` | Same |
| `skills/jcbbge-tweet/SKILL.md` | Personal voice — M1 username in path |
| `skills/jcbbge-blog/SKILL.md` | Same |
| `skills/jcbbge-video-script/SKILL.md` | Same |

---

## HIGH VALUE — Port Immediately

Skills with no deprecated refs, solid content, broadly applicable:

| Skill | Why it's valuable |
|-------|------------------|
| `backend-first-security/` | Security principles, RLS, server-side access. Arc-relevant. |
| `building-with-solidjs/` | SolidJS reactive patterns, avoiding React traps. Arc critical. |
| `building-with-solidstart/` | SolidStart routing, data loading, server functions. Arc critical. |
| `solidjs-2.0/` | SolidJS 2.0 specifics. Arc uses SolidJS 2.0. |
| `designing-apis/` | REST API design patterns. Generic and solid. |
| `refactor/` | Surgical refactoring skill. Good across all projects. |
| `delegate/` | Agent handoff/PRD spec generator. Highly useful. |
| `debug-hypothesis/` | Already on M5 ✓ |
| `challenging-assumptions/` | Pre-mortem, assumption testing. Strong thinking skill. |
| `detecting-blind-spots/` | Related to above — good pair. |
| `reframing-problems/` | General problem decomposition. |
| `synthesizing-insights/` | Dense summarization + insight extraction. |
| `thinking-systemically/` | Systems thinking with archetypes + leverage points. |
| `exploring-possibilities/` | Adjacent possibilities mapping. |
| `mapping-adjacent-possibilities/` | Practical expansion of exploring-possibilities. |
| `evaluating-product-ideas/` | Product evaluation frameworks. |
| `evaluating-business-strategy/` | Strategy frameworks (check for deprecated refs in references/) |
| `repo-deep-dive-analysis/` | Codebase analysis methodology. |
| `project-documentation/` | Documentation generation. |
| `prd/` | Product requirements document skill. |
| `self-hosting-vps-ubuntu/` | Server setup, security audit scripts. Generic infra skill. |
| `debugging-with-logs/` | Structured logging + wide events debugging. Generic. |
| `dense-summarization/` | Useful compression skill. |
| `fresh-eyes-review/` | Code/design review with fresh perspective. |
| `step-workflow/` | Step-by-step workflow execution. |
| `think-critically/` | Critical analysis framework. |
| `cognitive-approaches/` | Reasoning strategies. |
| `design-intelligence/` | Design reasoning and evaluation. |
| `creative-systems-thinking/` | Creative + systems thinking hybrid. |
| `big-brained-optimizer/` | Optimization reasoning. |
| `learning-opportunities/` | Learning extraction from work. |

---

## MEDIUM VALUE — Port After Review

Skills that are good but need a read-through before committing:

| Skill | Notes |
|-------|-------|
| `creating-skills/` | Meta-skill for building skills. Has scripts. Check Python deps. |
| `knowledge-graph-system/` | May reference old tooling — quick check needed. |
| `processing-sigils/` | Needs content read — unclear without seeing it |
| `meta-agent-template/` | Subagent template — check for deprecated MCP refs |
| `robot-mode-maker/` | Unclear purpose without reading |
| `non-technical-async/` | Communication skill — probably clean |
| `idea-wizard/` | Brainstorm facilitation — probably clean |
| `luck/` | Unusual name — needs read |
| `ending-session/` | Deprecated refs — but good underlying pattern worth salvaging |
| `starting-session/` | Same — good pattern, strip the old tooling refs |

---

## SPECIALTY SKILLS — Port If Relevant

File manipulation skills with Python scripts and XSD schemas. Broadly useful but heavy:

| Skill | What it is |
|-------|-----------|
| `docx/` | Word document manipulation with Python scripts + schema |
| `pptx/` | PowerPoint manipulation with Python scripts + schema |
| `xlsx/` | Excel manipulation with Python scripts + schema |
| `pdf/` | PDF form filling with Python scripts |
| `canvas-design/` | Canvas/image generation with bundled fonts (~30 TTF files) |
| `algorithmic-art/` | Has deprecated refs in templates — clean SKILL.md, check templates |

---

## RULES — Port These (All Clean Except Infrastructure)

| Rule | Status | Port? |
|------|--------|-------|
| `backend-first-security.md` | Clean | YES |
| `debugging.md` | Clean | YES |
| `git.md` | Clean | YES |
| `secrets.md` | Clean | YES |
| `solidjs.md` | Clean | YES |
| `timestamp-protocol.md` | Clean | YES |
| `chat-directives.md` | Read first | MAYBE |
| `scratchpad.md` | Read first | MAYBE |
| `bento.md` | Old project | SKIP |
| `infrastructure.md` | Deprecated refs | SKIP / rewrite |

---

## SUBAGENTS — Port After Content Check

| Subagent | Notes |
|----------|-------|
| `architect.md` | Likely clean — architecture review specialist |
| `debugger.md` | Likely clean — debugging specialist |
| `reviewer.md` | Likely clean — code review specialist |
| `test-writer.md` | Likely clean — test generation specialist |
| `sigil-distiller.md` | Check for old tooling refs |
| `peer-grok.md` | Peer session — probably clean, check MCP refs |
| `peer-gemini.md` | Check for old tooling refs |

---

## HOOKS — The Chain Hook is Worth Keeping

| Hook | Status | Notes |
|------|--------|-------|
| `chain.sh` | CHECK | May be clean — chain execution pattern |
| `learning-opportunity-hook.sh` | CHECK | May reference SurrealDB — check body |
| `observe-*.sh` (4 files) | DEAD | All write to SurrealDB — do not port |
| `claude-code.json` | CHECK | Hook config — may have good patterns |

---

## NEW CONCEPTS FROM M1 NOT ON M5

Things the M1 schema has that M5 doesn't and should:

1. **Rules as a directory** (`~/.claude/rules/`) — M1 figured this out. M5 has rules inline in CLAUDE.md. Port the structure, not just the content. **This is an important registry change — `rule/` type needs its own harness profile field.**

2. **Subagents as primitives** — M1 has `~/.claude/agents/` as a primitive type. M5 registry has no `agents/` type yet.

3. **Integration Profile Template** (`integrations/INTEGRATION-PROFILE-TEMPLATE.md`) — This is the early version of what we're calling the harness profile. Worth reading carefully — it may have solved problems we haven't hit yet.

4. **Solid-2-*.md flat files** — Several SolidJS 2.0 reference docs stored as flat skills (not in SKILL.md directory format). These are reference docs, not skill packages. Need a new type: `reference/` or `docs/`.

5. **The `delegate` skill** — Handoff document generator for async agent delegation. Not on M5, should be.

---

## PORT PLAN

### Immediate (today) — pull via rsync
```bash
# High-value skills with no deprecated refs
rsync -av m1:~/Documents/_agents/schema/skills/backend-first-security/ ~/agent-core/primitives/skills/backend-first-security/
rsync -av m1:~/Documents/_agents/schema/skills/designing-apis/ ~/agent-core/primitives/skills/designing-apis/
rsync -av m1:~/Documents/_agents/schema/skills/refactor/ ~/agent-core/primitives/skills/refactor/
rsync -av m1:~/Documents/_agents/schema/skills/delegate/ ~/agent-core/primitives/skills/delegate/
rsync -av m1:~/Documents/_agents/schema/skills/prd/ ~/agent-core/primitives/skills/prd/
rsync -av m1:~/Documents/_agents/schema/skills/repo-deep-dive-analysis/ ~/agent-core/primitives/skills/repo-deep-dive-analysis/
rsync -av m1:~/Documents/_agents/schema/skills/debugging-with-logs/ ~/agent-core/primitives/skills/debugging-with-logs/
rsync -av m1:~/Documents/_agents/schema/skills/dense-summarization/ ~/agent-core/primitives/skills/dense-summarization/
rsync -av m1:~/Documents/_agents/schema/skills/project-documentation/ ~/agent-core/primitives/skills/project-documentation/
rsync -av m1:~/Documents/_agents/schema/skills/fresh-eyes-review/ ~/agent-core/primitives/skills/fresh-eyes-review/
rsync -av m1:~/Documents/_agents/schema/skills/think-critically/ ~/agent-core/primitives/skills/think-critically/
rsync -av m1:~/Documents/_agents/schema/skills/step-workflow/ ~/agent-core/primitives/skills/step-workflow/
rsync -av m1:~/Documents/_agents/schema/skills/challenging-assumptions/ ~/agent-core/primitives/skills/challenging-assumptions/
rsync -av m1:~/Documents/_agents/schema/skills/detecting-blind-spots/ ~/agent-core/primitives/skills/detecting-blind-spots/
rsync -av m1:~/Documents/_agents/schema/skills/reframing-problems/ ~/agent-core/primitives/skills/reframing-problems/
rsync -av m1:~/Documents/_agents/schema/skills/synthesizing-insights/ ~/agent-core/primitives/skills/synthesizing-insights/
rsync -av m1:~/Documents/_agents/schema/skills/thinking-systemically/ ~/agent-core/primitives/skills/thinking-systemically/
rsync -av m1:~/Documents/_agents/schema/skills/evaluating-product-ideas/ ~/agent-core/primitives/skills/evaluating-product-ideas/
rsync -av m1:~/Documents/_agents/schema/skills/self-hosting-vps-ubuntu/ ~/agent-core/primitives/skills/self-hosting-vps-ubuntu/
rsync -av m1:~/Documents/_agents/schema/skills/cognitive-approaches/ ~/agent-core/primitives/skills/cognitive-approaches/
rsync -av m1:~/Documents/_agents/schema/skills/creative-systems-thinking/ ~/agent-core/primitives/skills/creative-systems-thinking/
rsync -av m1:~/Documents/_agents/schema/skills/design-intelligence/ ~/agent-core/primitives/skills/design-intelligence/

# Arc-specific skills — port to project registry later
rsync -av m1:~/Documents/_agents/schema/skills/building-with-solidjs/ ~/agent-core/primitives/skills/building-with-solidjs/
rsync -av m1:~/Documents/_agents/schema/skills/building-with-solidstart/ ~/agent-core/primitives/skills/building-with-solidstart/
rsync -av m1:~/Documents/_agents/schema/skills/solidjs-2.0/ ~/agent-core/primitives/skills/solidjs-2.0/

# Rules
rsync -av m1:~/Documents/_agents/schema/rules/backend-first-security.md ~/agent-core/primitives/rules/backend-first-security.md
rsync -av m1:~/Documents/_agents/schema/rules/debugging.md ~/agent-core/primitives/rules/debugging.md
rsync -av m1:~/Documents/_agents/schema/rules/git.md ~/agent-core/primitives/rules/git.md
rsync -av m1:~/Documents/_agents/schema/rules/secrets.md ~/agent-core/primitives/rules/secrets.md
rsync -av m1:~/Documents/_agents/schema/rules/solidjs.md ~/agent-core/primitives/rules/solidjs.md
rsync -av m1:~/Documents/_agents/schema/rules/timestamp-protocol.md ~/agent-core/primitives/rules/timestamp-protocol.md

# Integration profile template
rsync -av m1:~/Documents/_agents/schema/integrations/INTEGRATION-PROFILE-TEMPLATE.md ~/agent-core/primitives/meta/integration-profile-template.md
```

### Requires review first
- `evaluating-business-strategy/` — check references/ for deprecated content
- `creating-skills/` — check Python script deps
- `starting-session/` + `ending-session/` — salvage pattern, strip old tooling
- Subagents (all 7) — read for MCP refs before porting

### Skip entirely
- `anima/` — removed service
- `bento-do-query/` — dead project
- `observe-*.sh` hooks — dead SurrealDB writes
- `rules/bento.md`, `rules/infrastructure.md`

---

## Registry Changes Needed (From M1 Learnings)

1. Add `rule` type to harness profiles:
   - claude-code: `~/.claude/rules/` directory (NOT inline in CLAUDE.md)
   - pi: inline in AGENTS.md (no rules dir)
   - opencode: inline in AGENTS.md (no rules dir)

2. Add `agents` type to harness profiles:
   - claude-code: `~/.claude/agents/` directory
   - pi/opencode: not supported

3. Read `INTEGRATION-PROFILE-TEMPLATE.md` before next registry design pass — may already have solved the harness scoping question.
