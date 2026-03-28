# Executor Primitive Routing — Implementation Guide

## Overview

The **executor** has been extended from a tool gateway (MCP/OpenAPI/GraphQL) to a **universal primitive gateway** that routes to all 9 agentic core primitive types from `~/Documents/_agents/schema/`.

### The 9 Primitives

| # | Primitive | Status | Route Pattern | Implementation |
|---|-----------|--------|---------------|----------------|
| 1 | **skills** | ✅ **COMPLETE** | `executor.skill[name]` | `packages/control-plane/src/runtime/skills.ts` |
| 2 | **rules** | ✅ **COMPLETE** | `executor.rule[name]` | `packages/control-plane/src/runtime/rules.ts` |
| 3 | **subagents** | ✅ **COMPLETE** | `executor.subagent[name]` | `packages/control-plane/src/runtime/subagents.ts` |
| 4 | **commands** | ✅ **COMPLETE** | `executor.command[name]` | `packages/control-plane/src/runtime/commands.ts` |
| 5 | **hooks** | ✅ **COMPLETE** | `executor.hook[name]` | `packages/control-plane/src/runtime/hooks.ts` |
| 6 | **integrations** | ✅ **COMPLETE** | `executor.integration[name]` | `packages/control-plane/src/runtime/integrations.ts` |
| 7 | **plugins** | ✅ **COMPLETE** | `executor.plugin[name]` | `packages/control-plane/src/runtime/plugins.ts` |
| 8 | **agent-file** | ✅ **COMPLETE** | `executor.agentFile[name]` | `packages/control-plane/src/runtime/agent-file.ts` |
| 9 | **mcp** | ✅ **EXISTS** | Via sources system | Already integrated |

---

## Architecture

### Core Design Decisions

1. **Filesystem-First**: Primitives live in `~/Documents/_agents/schema/` as files. No SQL persistence needed — the filesystem IS the store.

2. **Lazy Loading**: Primitives are discovered by directory scan but content is loaded on demand. Metadata (from YAML frontmatter) is cached.

3. **Operation Per Primitive**: Different primitives support different operations:
   - **skills**: load, list
   - **rules**: load, list
   - **subagents**: load, list, delegate (calls subagent-mcp)
   - **commands**: load, list, run
   - **hooks**: load, list
   - **integrations**: load, list
   - **plugins**: load, list
   - **agent-file**: load, list (AGENTS.md itself)

4. **Namespace Routing**: `executor.primitiveType.operation()` pattern

5. **Path Configurable**: `AGENTS_SCHEMA_PATH` env var overrides default (`~/Documents/_agents/schema`)

### File Structure

```
~/Documents/_agents/schema/
├── skills/           # YAML frontmatter + markdown
│   ├── starting-session/
│   │   └── SKILL.md
│   └── .../
├── rules/            # Markdown with frontmatter
│   ├── git.md
│   ├── solidjs.md
│   └── .../
├── subagents/        # Agent definitions
│   ├── architect.md
│   └── .../
├── commands/         # Slash command definitions
│   └── .../
├── hooks/            # Lifecycle hooks
│   └── .../
├── integrations/     # Integration configs
│   └── .../
├── plugins/          # Plugin definitions
│   └── .../
└── agent-file/       # AGENTS.md (source of truth)
    └── AGENTS.md
```

---

## Phase 1: Skills (COMPLETE)

### Implementation Files

**1. Core Service** (`packages/control-plane/src/runtime/skills.ts`)
- `createSkillLoader(config?)` — factory function
- `SkillLoader` interface: `load(name)`, `list()`, `exists(name)`
- YAML frontmatter parser
- Path resolution with `AGENTS_SCHEMA_PATH` support

**2. Tool Registration** (`packages/control-plane/src/runtime/executor-tools.ts`)
- Added `executor.skill.load` tool
- Added `executor.skill.list` tool
- Effect-based error handling

**3. Export** (`packages/control-plane/src/runtime/index.ts`)
- Added `export * from "./skills"`

**4. Tests** (`packages/control-plane/src/runtime/skills.test.ts`)
- 5 tests covering: list, load, exists, not-exists, frontmatter parsing

### Usage

```typescript
// In executor TypeScript execution:
const skill = await tools.executor.skill.load({ name: "starting-session" });
// Returns: { name, metadata: {...}, content: "# Starting Session...", path: "..." }

const skills = await tools.executor.skill.list();
// Returns: [{ name, description, version, license }, ...]
```

### Configuration

```bash
# Default path
~/Documents/_agents/schema/skills/{name}/SKILL.md

# Override via environment
export AGENTS_SCHEMA_PATH=/custom/path
# Loads from: /custom/path/skills/{name}/SKILL.md
```

---

## Phase 2-8: Remaining Primitives (TODO)

### Implementation Pattern

For each primitive, follow this exact pattern:

#### Step 1: Create Loader Module

**File**: `packages/control-plane/src/runtime/{primitive}.ts`

```typescript
// Template structure:
export interface {Primitive}Metadata { ... }
export interface {Primitive} { ... }
export interface {Primitive}LoaderConfig { ... }
export interface {Primitive}Loader {
  load: (name: string) => Effect.Effect<{Primitive}, Error>;
  list: () => Effect.Effect<{Primitive}Metadata[], Error>;
  exists: (name: string) => Effect.Effect<boolean, Error>;
}
export const create{Primitive}Loader = (config?: {Primitive}LoaderConfig): {Primitive}Loader => { ... }
```

#### Step 2: Add Tool Registration

**File**: `packages/control-plane/src/runtime/executor-tools.ts`

```typescript
// 1. Import the loader
import { create{Primitive}Loader } from "./{primitive}.js";

// 2. Define schemas (after line 39)
const {Primitive}LoadInputSchema = Schema.Struct({ name: Schema.String });
const {Primitive}ListInputSchema = Schema.Struct({});
const {Primitive}MetadataSchema = Schema.Struct({ ... });
const {Primitive}OutputSchema = Schema.Struct({ ... });

// 3. Add tools to createExecutorToolMap (after line 429)
"executor.{primitive}.load": toTool({ ... }),
"executor.{primitive}.list": toTool({ ... }),
```

#### Step 3: Add Export

**File**: `packages/control-plane/src/runtime/index.ts`

```typescript
export * from "./{primitive}";
```

#### Step 4: Write Tests

**File**: `packages/control-plane/src/runtime/{primitive}.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import { create{Primitive}Loader } from "./{primitive}";

describe("{primitive} loader", () => {
  const loader = create{Primitive}Loader();
  
  it("should list {primitive}s from filesystem", async () => { ... });
  it("should load a specific {primitive}", async () => { ... });
  it("should detect existing {primitive}s", async () => { ... });
  it("should detect non-existing {primitive}s", async () => { ... });
});
```

#### Step 5: Verify

```bash
cd /Users/jcbbge/executor/packages/control-plane
bun run typecheck
bun run test {primitive}.test.ts
```

---

## Primitive-Specific Details

### Rules (`~/Documents/_agents/schema/rules/*.md`)

- **Format**: Markdown files with YAML frontmatter
- **Location**: `rules/{name}.md` (flat, no subdirectories)
- **Operations**: load, list
- **Example**: `rules/git.md`, `rules/solidjs.md`

### Subagents (`~/Documents/_agents/schema/subagents/*.md`)

- **Format**: Markdown agent definitions
- **Location**: `subagents/{name}.md`
- **Operations**: load, list, **delegate**
- **Special**: `delegate()` calls subagent-mcp server (port 3096)
- **Example**: `subagents/architect.md`

### Commands (`~/Documents/_agents/schema/commands/*.md`)

- **Format**: Markdown command definitions
- **Location**: `commands/{name}.md`
- **Operations**: load, list, **run**
- **Example**: `commands/kota.md`

### Hooks (`~/Documents/_agents/schema/hooks/`)

- **Format**: Shell scripts or JSON configs
- **Location**: `hooks/{name}.sh` or `hooks/{name}.json`
- **Operations**: load, list
- **Example**: `hooks/chain.sh`

### Integrations (`~/Documents/_agents/schema/integrations/`)

- **Format**: Markdown or YAML configs
- **Location**: `integrations/{name}.md`
- **Operations**: load, list
- **Example**: `integrations/rtk.md`

### Plugins (`~/Documents/_agents/schema/plugins/`)

- **Format**: Markdown plugin definitions
- **Location**: `plugins/{name}.md`
- **Operations**: load, list
- **Example**: `plugins/scratchpad.md`

### Agent-File (`~/Documents/_agents/schema/agent-file/AGENTS.md`)

- **Format**: Single AGENTS.md file
- **Location**: `agent-file/AGENTS.md`
- **Operations**: load (returns the AGENTS.md content)
- **Special**: This is the source of truth for agent identity

---

## Configuration Updates (COMPLETE)

### Updated Files

1. `~/.claude/CLAUDE.md` — Added Executor Skills section
2. `~/.config/opencode/AGENTS.md` — Added Executor Skills section
3. `~/.omp/agent/AGENTS.md` — Added Executor Skills section
4. `~/Documents/_agents/schema/agent-file/AGENTS.md` — Added Executor Skills section (source of truth)

### Removed Legacy Directories

```bash
# These directories have been removed (skills now served via executor):
~/.claude/skills/          # ❌ REMOVED
~/.config/opencode/skills/ # ❌ REMOVED  
~/.omp/agent/skills/       # ❌ REMOVED
```

Skills are now loaded **exclusively** from `~/Documents/_agents/schema/skills/` via executor.

---

## Testing Strategy

### Unit Tests (Per Primitive)

Each primitive gets its own test file with these minimum tests:

```typescript
// {primitive}.test.ts pattern:
1. should list {primitive}s from filesystem
2. should load a specific {primitive}
3. should detect existing {primitive}s  
4. should detect non-existing {primitive}s
5. should parse metadata correctly (if applicable)
```

### Integration Tests (Executor Tools)

Each primitive gets integration tests in `executor-tools.test.ts`:

```typescript
// Verify tool is registered:
1. should have executor.{primitive}.load tool
2. should have executor.{primitive}.list tool
3. should load {primitive}s through the tool
4. should list {primitive}s through the tool
```

### Full Suite Verification

```bash
# Run before declaring complete:
cd /Users/jcbbge/executor/packages/control-plane
bun run typecheck        # Must pass
bun run test             # Must pass (currently 45 tests)
```

---

## Rollout Checklist

### Phase 1: Skills ✅
- [x] skills.ts loader implementation
- [x] Tool registration in executor-tools.ts
- [x] Export from index.ts
- [x] Unit tests (5 tests)
- [x] Integration tests (6 tests)
- [x] AGENTS.md documentation updated
- [x] Global skills directories removed

### Phase 2: Rules ✅
- [x] rules.ts loader implementation
- [x] Tool registration
- [x] Export from index.ts
- [x] Unit tests (7 tests)
- [x] Integration tests
- [x] Verify with actual rule files

### Phase 3: Subagents ✅
- [x] subagents.ts loader implementation
- [x] Tool registration
- [x] **Delegate operation** (calls subagent-mcp on port 3096)
- [x] Export from index.ts
- [x] Unit tests (7 tests)
- [x] Integration tests (1 skipped - SSE refinement pending)

### Phase 4: Commands ✅
- [x] commands.ts loader implementation
- [x] Tool registration
- [x] Export from index.ts
- [x] Unit tests (4 tests)

### Phase 5: Hooks ✅
- [x] hooks.ts loader implementation
- [x] Tool registration
- [x] Export from index.ts
- [x] Unit tests (4 tests)

### Phase 6: Integrations ✅
- [x] integrations.ts loader implementation
- [x] Tool registration
- [x] Export from index.ts
- [x] Unit tests (4 tests)

### Phase 7: Plugins ✅
- [x] plugins.ts loader implementation
- [x] Tool registration
- [x] Export from index.ts
- [x] Unit tests (4 tests)

### Phase 8: Agent-File ✅
- [x] agent-file.ts loader implementation
- [x] Tool registration (single file: AGENTS.md)
- [x] Export from index.ts
- [x] Unit tests (1 test)

### Phase 9: Integration & Documentation ✅
- [x] AGENTS.md documentation updated for all 3 harnesses
- [x] Implementation guide updated
- [x] All 9 primitives documented
- [ ] Add primitives to `tools.discover()` results
- [ ] Update all harness HARNESS.md files
- [ ] Document all 9 primitives in AGENTS.md
- [ ] Migration guide for users

---

## Key Files Reference

### Source Schema (Filesystem)
```
~/Documents/_agents/schema/
├── agent-file/AGENTS.md          # Source of truth for AGENTS.md
├── skills/*/
│   └── SKILL.md
├── rules/*.md
├── subagents/*.md
├── commands/*.md
├── hooks/*.{sh,json}
├── integrations/*.md
└── plugins/*.md
```

### Executor Implementation
```
/Users/jcbbge/executor/packages/control-plane/src/runtime/
├── skills.ts                    # ✅ Phase 1 complete
├── skills.test.ts               # ✅ Phase 1 complete
├── executor-tools.ts            # ✅ Updated with skills
├── executor-tools.test.ts       # ✅ Integration tests
├── index.ts                     # ✅ Exports skills
├── {primitive}.ts              # ⏳ Implement for each
└── {primitive}.test.ts         # ⏳ Implement for each
```

### Configuration (Updated)
```
~/.claude/CLAUDE.md              # ✅ Updated
~/.config/opencode/AGENTS.md     # ✅ Updated
~/.omp/agent/AGENTS.md           # ✅ Updated
~/Documents/_agents/schema/agent-file/AGENTS.md  # ✅ Source updated
```

---

## Usage Examples (Target State)

```typescript
// Skills (COMPLETE)
const skill = await tools.executor.skill.load({ name: "starting-session" });
const skills = await tools.executor.skill.list();

// Rules (TODO)
const rule = await tools.executor.rule.load({ name: "solidjs" });
const rules = await tools.executor.rule.list();

// Subagents (TODO)
const subagent = await tools.executor.subagent.load({ name: "architect" });
const result = await tools.executor.subagent.delegate({ 
  name: "architect", 
  input: { task: "Design API" }
});

// Commands (TODO)
const command = await tools.executor.command.load({ name: "kota" });

// Hooks (TODO)
const hook = await tools.executor.hook.load({ name: "chain" });

// Integrations (TODO)
const integration = await tools.executor.integration.load({ name: "rtk" });

// Plugins (TODO)
const plugin = await tools.executor.plugin.load({ name: "scratchpad" });

// Agent-File (TODO)
const agents = await tools.executor.agentFile.load();
```

---

## Notes

- **MCP primitive** is already implemented via the sources system — no new work needed there.
- **Subagent delegation** is the most complex remaining task (requires calling subagent-mcp on port 3096).
- **AGENTS.md** is special — it's a single file, not a directory of files.
- All primitives should follow the **Effect** pattern for async operations.
- Maintain **backward compatibility** — existing `tools.*` and `executor.sources.*` APIs unchanged.

---

## Next Action

Pick the next primitive and implement following the **Implementation Pattern** section above. Recommended order:

1. **Rules** (simplest — similar to skills, flat files)
2. **Subagents** (complex — adds delegate operation)
3. **Commands** (medium — may add run operation)
4. Remaining primitives (hooks, integrations, plugins, agent-file)
