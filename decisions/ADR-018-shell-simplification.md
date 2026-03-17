# ADR-018: Shell Configuration Simplification — No Wrappers, No Interference

**Status:** Accepted  
**Date:** 2026-03-16  
**Deciders:** jcbbge (human), Claude (agent)

---

## Context

The shell configuration had accumulated multiple wrapper functions around core tools:
- `omp()` wrapper that called `_mcp_nuke` before every execution
- `auggie()` wrapper with same pattern
- `hs()` wrapper with conditional `_mcp_nuke`
- `alias claude='claude --dangerously-skip-permissions'`

These wrappers caused:
1. `omp update` to fail — interpreted as message, not subcommand
2. Global MCP server killing on every shell launch — blast radius too broad
3. Hidden complexity that agents couldn't predict

## Decision

**Remove all wrapper functions and aliases. Execute commands directly.**

- No `omp()` function — use `alias omp='omp --allow-home'` only if needed
- No `claude` alias with `--dangerously-skip-permissions`
- No `_mcp_nuke` in shell startup path
- No `aider` functions (unused tool)

## Consequences

### Positive
- Commands execute exactly as typed — predictable behavior
- `omp update` works as native subcommand
- No unintended side effects from shell initialization
- Simpler mental model: shell provides PATH, tools provide commands

### Negative
- Must manually manage MCP server lifecycle if needed
- `--allow-home` must be explicitly added if desired (user chose to keep this alias)

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Keep wrappers, fix argument parsing | Still creates unpredictable blast radius; complexity not worth benefit |
| Narrow `_mcp_nuke` to specific TTY | Still runs on every shell launch; over-engineered |
| Create `omp-safe` alternative command | Fragmented interface; agents would need to know which to use |

## Validation

```bash
# After change
$ type omp
omp is aliased to `omp --allow-home'

$ omp update
# Executes native update command successfully
```

## Related

- ADR-003: MCP servers always stay local (reaffirms local-only constraint)
- Removes anti-pattern from ADR-015 era (scripts eliminated)
