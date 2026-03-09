# Harness Onboarding Protocol

**Purpose:** Provision a new AI harness with all 9 agent-core primitives from `/Users/jcbbge/Documents/_agents/primitives/`.

---

## NON-NEGOTIABLE RULES

Read these before executing anything else.

**NEVER guess a file format or config structure.** If you don't know, follow the Source-of-Truth Hierarchy below. If the hierarchy fails, STOP and ask. Guessing and being wrong wastes user time.

**NEVER declare a phase complete without running the harness.** "Looks correct" is not verification. The harness must start without errors.

**NEVER provision all 9 primitives at once then validate.** Provision one, run harness, confirm, proceed to next.

**NEVER retry a failed config more than once with a different guess.** If your second attempt fails, STOP and surface the error to the user.

**NEVER use "should", "may", or "probably".** Either you have verified it or you have not.

---

## Source-of-Truth Hierarchy

When you need to know a file format, config structure, or field name:

```
1. Fetch the $schema URL from the config file — read the relevant section
2. Official documentation (fetch the actual page, find the working example)
3. GitHub source code (find the config type definitions or test fixtures)
4. Existing working configs on the machine (grep for similar configs)
─────────────────────────────────────────────────────────────────────────
STOP → If none of the above yield a verified example, report to the user.
       Do not proceed. Do not guess.
```

**Required evidence:** For every config file you write, you MUST record:
- Where you found the format (URL, file path, or source)
- The actual schema section or working example you used (pasted verbatim, not paraphrased)

---

## The 9 Primitives

| # | Primitive | Description |
|---|-----------|-------------|
| 1 | **Rules** | Global instructions, persona, constraints (AGENTS.md or equivalent) |
| 2 | **Config** | System settings, model selection, feature flags |
| 3 | **MCP Servers** | Model Context Protocol integration (HTTP & stdio) |
| 4 | **Skills** | Modular knowledge units, reusable procedures |
| 5 | **Commands** | Slash commands, CLI shortcuts, user-invocable actions |
| 6 | **Hooks** | Background automation, scheduled tasks, event triggers |
| 7 | **Sub-agents** | Parallel independent agents, delegation, ensemble |
| 8 | **Tools** | Action verbs (web, files, terminal, vision, etc.) |
| 9 | **Memory** | Persistent context across sessions |

Source primitives live in: `/Users/jcbbge/Documents/_agents/primitives/`

---

## Execution Flow

```
User: "I'm adding a new harness: [NAME]"
  ↓
PHASE 1: RESEARCH
  ↓ (gate: structured output produced, working examples pasted)
PHASE 2: VERIFY BASELINE
  ↓ (gate: harness starts clean before any provisioning)
PHASE 3: PROVISION (one primitive at a time)
  ↓ (gate: harness starts after each primitive)
PHASE 4: END-TO-END TEST
  ↓ (gate: integration test passes)
DELIVER: HARNESS.md + status report
```

---

## Phase 1: Research (3 Parallel Subagents)

Spawn 3 subagents simultaneously. Each MUST return the structured output below — not freeform prose.

---

### Subagent 1: Config & Architecture

**Find:**
- Installation path and directory structure
- Main config file location and format
- Environment file location and format
- How the harness bootstraps

**MUST return this exact table:**

```
HARNESS: [name]
INSTALL PATH: [path]
CONFIG DIR: [path]
MAIN CONFIG FILE: [path] | FORMAT: [JSONC/YAML/TOML/etc]
SCHEMA URL: [url or "none found"]
ENV FILE: [path or "none"]
PROJECT OVERRIDE: [path/mechanism or "none"]
BOOTSTRAP COMMAND: [command to start the harness]
VALIDATION COMMAND: [command to check config validity, or "none"]
```

**For the config format, paste verbatim:**
```
[Paste the MCP server config section from the schema or a real working example.
 If no example found after checking schema URL + official docs + GitHub source, write: NOT FOUND]
```

---

### Subagent 2: Skills, Tools, Commands

**Find:**
- Where skills/tools are stored and their file format
- How they are discovered (filesystem scan, registry, manifest)
- How commands are registered and invoked
- Whether symlinks are supported for skill directories

**MUST return this exact table:**

```
SKILLS:
  LOCATION: [path]
  FORMAT: [SKILL.md / YAML / Python / etc]
  DISCOVERY: [filesystem scan / registry / manifest]
  SYMLINKS SUPPORTED: [yes/no — tested or assumed?]
  EXAMPLE: [paste 5-line minimal skill definition verbatim]

COMMANDS:
  MECHANISM: [slash commands / embedded in skills / CLI / etc]
  REGISTRATION: [auto / manual / manifest]
  LOCATION: [path or "embedded"]

TOOLS:
  BUILTIN COUNT: [number]
  CUSTOM TOOLS: [supported yes/no] | LOCATION: [path] | FORMAT: [format]
```

---

### Subagent 3: MCP, Hooks, Sub-agents

**Find:**
- MCP support and transport types (HTTP, stdio, both)
- EXACT config format for adding an MCP server — paste from schema or source
- Hook/scheduling mechanism
- Sub-agent support

**CRITICAL: Do not describe the MCP config format. Paste it.**

Steps required before returning output:
1. Fetch the config file's `$schema` URL → find the MCP section → paste it
2. If no schema: fetch official docs → find a working MCP config example → paste it
3. If no docs: search GitHub source for the config type definition → paste it
4. If none found: return `MCP CONFIG FORMAT: NOT FOUND — do not attempt to provision`

**MUST return this exact table:**

```
MCP:
  SUPPORTED: [yes/no]
  TRANSPORT: [HTTP / stdio / both]
  CONFIG LOCATION: [path within main config or separate file]
  FORMAT SOURCE: [URL or file path where the following was found]
  VERIFIED FORMAT:
    [paste the exact schema/example here — minimum: field names, types, valid values]

HOOKS:
  MECHANISM: [cron / event-driven / plugins / none]
  FORMAT: [TypeScript / YAML / Python / etc]
  LOCATION: [path]

SUB-AGENTS:
  SUPPORTED: [yes/no]
  MECHANISM: [native / via MCP / plugin]
  LOCATION: [path or "native"]
```

---

### Research Gate

**Before proceeding to Phase 2, confirm:**

- [ ] All 3 subagents returned structured output (not freeform)
- [ ] MCP config format is PASTED (not described) — or explicitly marked NOT FOUND
- [ ] Bootstrap command is known
- [ ] Config file location is known

If any are missing: re-run the relevant subagent. Do not proceed with gaps.

---

## Phase 2: Verify Baseline

**Before provisioning anything, confirm the harness works in a clean state.**

```bash
# 1. Run the harness bootstrap command (from subagent 1 output)
[BOOTSTRAP COMMAND]

# Expected: harness starts without errors
# If config errors appear: DO NOT PROVISION. Fix the base install first.
```

**Gate: Paste the terminal output confirming clean startup.**

If the harness does not start cleanly, stop here and report the error. Do not begin provisioning on a broken baseline.

---

## Phase 3: Provision (One Primitive at a Time)

Provision in this order. After each primitive, run the harness. Confirm it starts. Then proceed.

---

### Primitive 1: Rules

Deploy the global rules/persona file.

```
SOURCE:  /Users/jcbbge/Documents/_agents/primitives/rules/
TARGET:  [rules equivalent in harness — from subagent 1/2 output]
FORMAT:  [AGENTS.md / SOUL.md / system prompt / etc]
ACTION:  Create or symlink
```

**Verification:**
```bash
[BOOTSTRAP COMMAND]
# Confirm: harness starts, no errors
# Paste output:
```

---

### Primitive 2: Config

Populate harness config with model, memory, and other settings.

**REQUIRED before writing:**
- [ ] You have the verified config format from Phase 1 research
- [ ] You have the MCP format pasted (or marked NOT FOUND)

Write the minimal valid config first (model + logging only). Run harness. Confirm it starts.

```bash
[BOOTSTRAP COMMAND]
# Gate: must start without config validation errors
# If validation errors appear: check format against schema — do NOT guess a fix
# Paste output:
```

---

### Primitive 3: MCP Servers

**Only proceed if MCP CONFIG FORMAT was found in Phase 1.**

If `MCP CONFIG FORMAT: NOT FOUND` was returned → skip this primitive, note it in HARNESS.md.

Add ONE server first. Run harness. Confirm it starts.

```
MCP SERVERS TO ADD:
  anima     → http://localhost:3098/
  kotadb    → http://localhost:3099/mcp
  dev-brain → http://localhost:3097/
```

Use the exact format from Phase 1 research. No modifications.

```bash
[BOOTSTRAP COMMAND]
# Gate: must start without MCP config errors
# If errors: DO NOT add remaining servers. Re-check schema. If still failing after ONE retry: STOP and report.
# Paste output:
```

Add remaining servers only after the first succeeds.

---

### Primitive 4: Skills

```
SOURCE:  /Users/jcbbge/Documents/_agents/primitives/skills/
TARGET:  [skills directory from subagent 2 output]
ACTION:  Symlink if supported (check subagent 2 output), otherwise copy
```

```bash
# Verify skills are discoverable
[HARNESS SKILL LIST COMMAND or equivalent]
# Gate: at least 1 skill appears in output
# Paste output:
```

---

### Primitives 5–9: Commands, Hooks, Sub-agents, Tools, Memory

For each: check subagent output for location and format. Deploy. Run harness. Confirm.

If a primitive is marked as "not supported" in research output: note it in HARNESS.md and skip.

---

### Provisioning Gate

Before moving to Phase 4, confirm:

- [ ] Harness starts cleanly with all provisioned primitives
- [ ] No config validation errors
- [ ] Skills discoverable
- [ ] MCP servers listed as available (if provisioned)

**Paste the terminal output of a clean startup.**

---

## Phase 4: End-to-End Test

Run a real task that exercises multiple primitives in a single session.

Test prompt to use inside the harness:
```
List all available skills. Then search for a file called CLAUDE.md in my home directory.
Then tell me which MCP tools you have access to.
```

**Gate:**
- [ ] Skills listed → confirms skills primitive
- [ ] File search executed → confirms tools primitive
- [ ] MCP tools listed → confirms MCP primitive
- [ ] Session completes without errors

Paste terminal output confirming the above.

---

## Deliver: HARNESS.md

Create `/Users/jcbbge/Documents/_agents/harnesses/[NAME]/HARNESS.md`:

```markdown
# Harness: [NAME]

**Version:** [version at time of provisioning]
**Date provisioned:** [date]
**Status:** active

## Primitive Support

| Primitive | Supported | Format | Deploy target | Status |
|-----------|-----------|--------|---------------|--------|
| Rules | yes/no | [format] | [path] | ✓ operational / ✗ skipped / ⚠ partial |
| Config | yes/no | [format] | [path] | |
| MCP Servers | yes/no | [format] | [path] | |
| Skills | yes/no | [format] | [path] | |
| Commands | yes/no | [format] | [path] | |
| Hooks | yes/no | [format] | [path] | |
| Sub-agents | yes/no | [format] | [path] | |
| Tools | yes/no | [format] | [path] | |
| Memory | yes/no | [format] | [path] | |

## Config Files Modified

[List every file created or modified, with path and what was changed]

## MCP Config Format (Verified)

[Paste the exact working MCP config block used — source URL included]

## Bootstrap Command

[Command to start this harness]

## Quirks and Gotchas

[Non-obvious behaviors found during provisioning]

## Verification Evidence

[Paste terminal output from Phase 4 end-to-end test]
```

---

## Anti-Patterns

**These actions are explicitly prohibited:**

| What | Why |
|------|-----|
| Writing a config structure from memory or inference | Format must come from schema, docs, or source — never memory |
| Declaring a phase complete without running the harness | "Looks correct" is not verification |
| Retrying a failed config twice with different guesses | One retry max. Then stop and report. |
| Provisioning all 9 primitives then validating | Catch failures at each primitive, not all at once |
| Symlinking without confirming symlink support | Check subagent 2 output first |
| Skipping Phase 2 baseline check | Never provision into a broken baseline |
| Using `https://` for local MCP servers | Local servers use `http://` — always check |
| Assuming the same format as Claude Code | Every harness is different — research first |

---

## Success Criteria

✓ All 9 primitives mapped (or explicitly marked not supported)
✓ Harness starts cleanly after provisioning
✓ End-to-end test passes (skills + tools + MCP exercised in one session)
✓ HARNESS.md created with evidence (not declarations)
✓ Every config format is traceable to a source URL or file
