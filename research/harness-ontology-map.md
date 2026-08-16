# Harness ontology map — agent-core primitives × three runtimes

**Status:** Unit A deliverable (cursor-parity mission)  
**Scope:** Map only. No registry/CLI/harness-config edits.  
**Harnesses:** claude-code · pi · cursor  
**cursor-shim** (`~/cursor-shim/`): in-scope for the map; not modified.

## Provenance

```
date -u:  Wed Aug 12 15:38:18 UTC 2026
pwd -P:   /Users/jrg/agent-core
HEAD:     0634b9d459356f6a1b09c58aacfa8a6213885978
```

Sources this session: `~/.agent-core/registry` (full read); `cli/zig-out/bin/agent-core status` → **37 ok / 0 stale / 0 missing**; on-disk harness trees under `~/.claude/`, `~/.pi/agent/`, `~/.cursor/`, project `.cursor/`; Cursor skill docs `~/.cursor/skills-cursor/{migrate-to-skills,create-skill,create-rule,create-subagent,create-hook}/SKILL.md`; store under `primitives/`.

---

## 1. Store ontology (what exists under `primitives/`)

| Type | Store path | Count (this session) | Registered in `~/.agent-core/registry`? |
|------|------------|----------------------|----------------------------------------|
| **skills** | `primitives/skills/` | 83 entries (excl. `_attic`/README; includes flats + dirs) | **19** `skill/*` primitives (plus 1 `hook/*`) |
| **rules** | `primitives/rules/` | 8 `.md` | None — store-only by doctrine |
| **hooks** | `primitives/hooks/` | 10 (sh/ts/mjs + `tower/`) | **1**: `hook/slim-guard` → claude-code only |
| **commands** | `primitives/commands/` | 2 (`tabs.md`, `tower.md`) | None |
| **subagents** | `primitives/subagents/` | 10 `.md` | None |
| **directives** | `primitives/directives/` | **0** (empty) | None |
| **profiles** | `primitives/profiles/` | role `.md` + `models.json` + `profile-model` | None (consumed by spine-spawn / pi, not agent-core sync) |
| **plugins** | `primitives/plugins/` | 4 `.ts` (+ `_docs`) | None (pi extensions path; not agent-core synced) |
| **tools** | `primitives/tools/` | slim, latch, vein, assay, bigfile, statem (+ `_deprecated`) | None (standalone CLIs / MCP servers) |

**Registry harness profiles (only):** `pi` (skills + prompts dirs, `skill_format directory`) and `claude-code` (skills + hooks dirs). Verbatim registry comment (Tool skills section): *"cursor is not an agent-core harness, no deploy lines for it here."*

**Notable unregistered-but-live skills:** `herdr` is in the store and symlinked/deployed on all three harness trees, but has **no** `primitive skill/herdr` registry line.

---

## 2. Parity matrix — primitive type × harness

Cell legend:

| Class | Meaning |
|-------|---------|
| **PRESENT-REGISTERED** | Deployed / tracked via agent-core CLI (`status` green) |
| **PRESENT-MANUAL** | Live on disk via symlink, hand copy, or hand-edited harness config — not registry-deployed |
| **ADAPTED** | Same capability, format/protocol translated at the harness edge |
| **MISSING** | Store (or peer harness) has a capability this harness lacks in practice |
| **N/A — reason** | Type does not apply to that harness / deliberately out of band |

### 2.1 Matrix (type-level)

| Primitive type | claude-code | pi | cursor |
|----------------|-------------|----|--------|
| **skills** | PRESENT-REGISTERED (19 skills via CLI; many extra skills live under `~/.claude/skills/` outside registry) | PRESENT-REGISTERED (subset of the 19; same CLI) | PRESENT-MANUAL — 7 store skills symlinked into `~/.cursor/skills-cursor/` (herdr, super-search, navigating-big-files, slim, latch, vein, assay). **No** `harness cursor` / deploy lines. Note: Cursor docs say user skills belong in `~/.cursor/skills/` and `skills-cursor` is reserved for built-ins (`create-skill` SKILL.md) — current wiring is hand-maintained into the reserved tree. |
| **rules** | N/A — store-only (doctrine; no `~/.claude/rules`; no `inline_agents`) | N/A — store-only (`~/.pi/agent/AGENTS.md` → symlink to canonical; inline injection banned) | PRESENT-MANUAL (partial) — global context via `~/AGENTS.md` → `primitives/AGENTS.md`; project rule `agent-core/.cursor/rules/cursor-fleet.md` (`.md`, not `.mdc`). No `~/.cursor/rules/`. Store `primitives/rules/*` not deployed as cursor rules. |
| **hooks** | PRESENT-REGISTERED for `hook/slim-guard` → `~/.claude/hooks/slim-guard.sh`; **plus** large PRESENT-MANUAL surface in `~/.claude/settings.json` (`SessionStart`, `PreToolUse`, …) | ADAPTED — no shell-hook registry type; TypeScript extensions under `~/.pi/agent/extensions/` (e.g. `slim-rewrite.ts` re-exports `primitives/hooks/slim-rewrite.ts`) | ADAPTED — `~/.cursor/hooks.json`: `sessionStart` → `~/.cursor/herdr-agent-state.sh`; `preToolUse` matcher `Shell` → `primitives/hooks/slim-guard-cursor.sh` (port of CC `slim-guard.sh`) |
| **commands / prompts** | PRESENT-MANUAL — `~/.claude/commands/tower.md` exists; **not** registry-deployed. Store also has `commands/tabs.md` (undeployed). | MISSING in practice — registry maps `prompts` → `~/.pi/agent/prompts/` but directory is **empty** | MISSING deploy — harness-native dirs documented but **absent on disk** (see §3.1). Tower reaches cursor via **MCP**, not a slash-command file. |
| **subagents** | MISSING deploy — store has 10 defs; `~/.claude/agents` does not exist | N/A — pi fleet uses herdr + profiles/skills, not a `subagents/` deploy tree | PRESENT-MANUAL — project `.cursor/agents/{concierge,coordinator,orchestrator,coder,researcher}.md` (YAML frontmatter `name`/`description`/`model`). User-level `~/.cursor/agents/` absent. Not linked to `primitives/subagents/*`. |
| **directives** | N/A — store empty; no CC deploy type | N/A — store empty | N/A — store empty |
| **profiles** | N/A — CC does not consume `primitives/profiles/` | PRESENT-MANUAL — `primitives/profiles/` + `profile-model` drive `spine-spawn --kind pi --profile …` | ADAPTED (parallel surface) — cursor-shim / `.cursor/agents/*.md` `model:` fields; not agent-core sync. Map-only: `~/cursor-shim/` owns fleet launch for cursor-agent tiers. |
| **plugins / extensions** | N/A — CC uses hooks + MCP, not pi plugins | PRESENT-MANUAL — `~/.pi/agent/extensions/*.ts` (hand-maintained; some shim to store). Store `primitives/plugins/` is **not** auto-synced by agent-core | N/A — no pi-style plugin loader; closest native surfaces are hooks + MCP + skills |
| **tools** (CLIs / MCP servers) | PRESENT-MANUAL — binaries on `PATH` (`slim`, `latch`, …); bigfile/tower via MCP in CC settings | PRESENT-MANUAL — same CLIs; bigfile via super-search `--file`; extensions for tower/slim | PRESENT-MANUAL — same CLIs; MCP `tower`/`arc`/`bigfile` in `~/.cursor/mcp.json` |

### 2.2 Hook protocol differences (adapter must translate)

Evidence: `~/.claude/settings.json` hook keys vs `~/.cursor/hooks.json` + `create-hook` SKILL.md.

| Concern | claude-code | cursor |
|---------|-------------|--------|
| Event naming | PascalCase: `SessionStart`, `PreToolUse`, `PostToolUse`, `SessionEnd`, `Stop`, `SubagentStart`, `SubagentStop`, `UserPromptSubmit`, `PreCompact`, `PermissionRequest`, `PostToolUseFailure` | camelCase: documented `sessionStart`, `preToolUse`, `postToolUse`, `sessionEnd`, `stop`, `subagentStart`, `subagentStop`, `beforeShellExecution`, `beforeSubmitPrompt`, … — **live config only wires** `sessionStart` + `preToolUse` |
| Shell tool matcher | `Bash` | `Shell` (and/or `beforeShellExecution` for gate-only; **cannot rewrite** input — hence slim uses `preToolUse`) |
| Rewrite response shape | Nested `hookSpecificOutput.{hookEventName,permissionDecision,updatedInput}` (see `slim-guard.sh`) | Flat `{permission, agent_message, updated_input}` (see `slim-guard-cursor.sh`) |
| Input command path | `.tool_input.command` | `.tool_input.command // .tool_input.cmd // .command` (cursor script is defensive) |

pi: not settings.json hooks — extension `export default function(pi)` loaded by jiti; slim twin is `slim-rewrite.ts`.

### 2.3 Skills deploy shape (Unit C fork — already escalated by CORD)

| Harness | Observed shape for tool skills (slim et al.) |
|---------|-----------------------------------------------|
| pi / claude-code | Directory with **copied** `SKILL.md` (byte content; not a symlink to store) for registry-deployed skills; some older skills (e.g. herdr) are symlinks |
| cursor | **Symlink** directory → `primitives/skills/<name>` |

---

## 3. Resolved UNKNOWNs (cursor)

### 3.1 Cursor command home

**Documented native homes** (Cursor skill `migrate-to-skills/SKILL.md`):

| Scope | Path |
|-------|------|
| User | `~/.cursor/commands/*.md` |
| Project | `{workspaceFolder}/.cursor/commands/*.md` (and nested `**/.cursor/commands/`) |

**On disk today (2026-08-12):**

- `~/.cursor/commands/` — **does not exist**
- `/Users/jrg/agent-core/.cursor/commands/` — **does not exist**
- `~/.cursor/cli-config.json` — present; **no** `commands` key (permissions/display/model only)
- No `commands` key under probed Cursor User `settings.json`

**What about `/tower` in a cursor session?**  
Chat evidence (`~/.cursor/chats/.../prompt_history.json`): the operator prompt said to use "`/herdr` skill as well as `/tower`" — slash syntax referring to capabilities, not proof of a `commands/tower.md` load. `/herdr` maps to skill `~/.cursor/skills-cursor/herdr`. There is **no** `tower` entry under `skills-cursor`, and **no** `tower.md` under any cursor commands dir. Tower on cursor is the **MCP server** in `~/.cursor/mcp.json` → `bun run ~/.tower/server.mjs`.

**Verdict:** Command *mechanism* exists (documented paths above) but is **unused** (dirs absent). Store `primitives/commands/tower.md` is **not** deployed to cursor. Classify commands cell as **MISSING** (deploy), not "no harness mechanism." Peer CC file `~/.claude/commands/tower.md` remains PRESENT-MANUAL.

### 3.2 Cursor rules surface (what loads today)

| Surface | Path | Status |
|---------|------|--------|
| Global agents/context | `~/AGENTS.md` → `~/agent-core/primitives/AGENTS.md` | PRESENT-MANUAL (symlink) |
| User rules dir | `~/.cursor/rules/` | **absent** |
| Project rules | `agent-core/.cursor/rules/cursor-fleet.md` | PRESENT-MANUAL (fleet directive; `.md`) |
| Cursor rule format (docs) | `.cursor/rules/*.mdc` with `description` / `globs` / `alwaysApply` | Documented in `create-rule` SKILL.md; agent-core’s live rule is `.md`, not `.mdc` |
| Store rules | `primitives/rules/*.md` | Store-only; not copied into `.cursor/rules/` |

### 3.3 Cursor subagents surface

**Yes — native mechanism.** Per `create-subagent` SKILL.md:

| Scope | Path | Priority |
|-------|------|----------|
| Project | `.cursor/agents/*.md` | Higher |
| User | `~/.cursor/agents/*.md` | Lower |

**On disk today:** project agents present (`concierge`, `coordinator`, `orchestrator`, `coder`, `researcher`); user `~/.cursor/agents/` absent. These are **not** sync targets for `primitives/subagents/*` and are not registry primitives.

### 3.4 cursor-shim (map only)

`~/cursor-shim/` — sanctioned bridge for cursor-agent tiers inside herdr+Tower; spawn via `cursor-fleet` / `cursor-spine` only. Carries its own `rules/cursor-fleet.md` (related to, not necessarily identical to, project `.cursor/rules/cursor-fleet.md`). **Out of agent-core sync;** relevant to Unit C only as a consumer of cursor harness behavior.

---

## 4. Registered deploy surface (CLI truth)

`agent-core status` summary: **37 ok / 0 stale / 0 missing** — all targets are **pi** and/or **claude-code** only.

| Primitive id | pi | claude-code |
|--------------|----|-------------|
| skill/debug-hypothesis | ✓ | ✓ |
| skill/debugging-async | — | ✓ |
| skill/install | — | ✓ |
| hook/slim-guard | — | ✓ |
| skill/building-with-solidjs | ✓ | ✓ |
| skill/building-with-solidstart | ✓ | ✓ |
| skill/criticality | ✓ | ✓ |
| skill/micro-animation-director | ✓ | ✓ |
| skill/atelier | ✓ | ✓ |
| skill/dev-browser | ✓ | ✓ |
| skill/brief | ✓ | ✓ |
| skill/navigating-big-files | ✓ | ✓ |
| skill/icloud-tabs-distiller | ✓ | ✓ |
| skill/session-start | ✓ | ✓ |
| skill/session-end | ✓ | ✓ |
| skill/slim | ✓ | ✓ |
| skill/latch | ✓ | ✓ |
| skill/vein | ✓ | ✓ |
| skill/assay | ✓ | ✓ |
| skill/super-search | ✓ | ✓ |

Cursor column for every row above: **not registered** (manual symlinks for the seven tool skills only).

---

## 5. MISSING / escalation candidates (no silent resolve)

Flag for CORD → CONCIERGE → operator (mission §7):

1. **Symlink vs copy** for cursor skill deploy (CORD already posted) — skills-cursor currently symlinks; CLI `copy_file` would diverge; Cursor docs also prefer `~/.cursor/skills/` over `skills-cursor`.
2. **Cursor rules mapping** — keep `~/AGENTS.md` + store-only rules, or add `.cursor/rules/` deploy? (CORD already posted.)
3. **Commands parity** — CC has hand `tower.md`; pi prompts empty; cursor commands dirs absent / Tower-via-MCP. Need policy: deploy `primitives/commands/*` → `~/.cursor/commands/`, migrate to skills (`disable-model-invocation`), or declare commands N/A on cursor in favor of MCP.
4. **Subagents store vs `.cursor/agents/`** — parallel ontologies; no adapter yet. Store `primitives/subagents/*` unused on all three harnesses.
5. **`herdr` skill** — live everywhere, unregistered (status blind spot).
6. **Hooks coverage gap on cursor** — only 2 events wired vs CC’s broad SessionStart/Stop/Tower/circadian set. Many CC hooks have **no** cursor equivalent (MISSING capability, not missing mechanism — cursor docs list `stop`, `sessionEnd`, etc.).
7. **Directives** — store empty; no escalation unless mission wants a new type.

---

## 6. Implications for Unit C (cursor registered harness)

Minimum adapter surface suggested by this map (implementation is Unit C’s job):

| Registry / CLI concern | Suggested cursor profile target |
|------------------------|---------------------------------|
| skills | Prefer documented `~/.cursor/skills/` (directory format) **or** ratify continued `skills-cursor` exception; strategy symlink vs copy is an operator fork |
| hooks | Manage `~/.cursor/hooks.json` + scripts; event/payload adapter (PascalCase/Bash/hookSpecificOutput → camelCase/Shell/updated_input) |
| commands | Optional `~/.cursor/commands/`; only if operator wants slash parity with CC `tower.md` |
| rules | Default N/A (store-only + AGENTS.md symlink); optional `.cursor/rules/` if operator expands |
| MCP | Out of current registry grammar — remains hand `mcp.json` unless schema grows (escalation §7.3) |

---

## 7. Evidence index (paths touched)

- `~/.agent-core/registry`
- `cli/zig-out/bin/agent-core status`
- `~/.cursor/hooks.json`, `mcp.json`, `cli-config.json`, `skills-cursor/`, `herdr-agent-state.sh`
- `~/AGENTS.md` symlink
- `/Users/jrg/agent-core/.cursor/agents/*.md`, `.cursor/rules/cursor-fleet.md`
- `~/.claude/settings.json` (hooks), `~/.claude/commands/tower.md`, `~/.claude/hooks/`, `~/.claude/skills/`
- `~/.pi/agent/{skills,prompts,extensions,AGENTS.md}`
- `primitives/hooks/slim-guard.sh` vs `slim-guard-cursor.sh`
- Cursor docs-as-skills: `create-skill`, `create-rule`, `create-subagent`, `create-hook`, `migrate-to-skills`
