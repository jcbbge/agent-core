# Session Handoff

Date: 2026-03-16  
Mode: meta/systems

## Completed

- **Shell configuration simplification** — Removed 42 lines of wrapper complexity (omp(), auggie(), hs(), _mcp_nuke, claude alias, aider functions) that were causing command interception and unintended MCP killing. Shell now executes commands directly without interference. (ADR-018)

- **Generated PROGRAM.md for core script** — Created agent operating contract at `~/bin/PROGRAM.md` documenting the 7-service brain infrastructure, mutable/frozen surface, footguns, and command surface.

- **8GB M1 memory optimization** — Implemented layered governors: Node/Bun heap limits (2.56GB/2.5GB), Vite workers (2), Ollama constraints (2 models resident, 1 parallel, 5min keepalive), KotaDB instances (4). Critical fix: changed OLLAMA_MAX_LOADED_MODELS from 1 to 2 to support simultaneous embedding + LLM usage. Added `core nt` telemetry governor. (ADR-019)

- **Removed invalid SurrealDB flag** — `--memory-limit` doesn't exist in SurrealDB 3.0.0; removed from plist to prevent startup failure. SurrealDB running healthy at ~164MB without explicit caps.

- **Validated all 7 services** — Restarted and verified: SurrealDB, KotaDB, Anima, Executor, Dev-Brain MCP, Subagent MCP, Ollama. All responding on ports 8002, 3099, 8001.

## Decisions captured

- ADR-018: Shell configuration simplification — no wrappers, no interference
- ADR-019: 8GB M1 memory optimization — constraint the Big Wolves

## Agent-core state

- N skills: 30+ in registry  
- N rules: 8 deployed  
- 7 brain services running with memory governors  
- Ollama: 2 models resident (nomic-embed-text + qwen2.5:0.5b)  

## Open items

1. SurrealDB memory capping — if it grows beyond 164MB baseline, investigate launchctl SoftResourceLimits
2. Core script enhancements — potential `core doctor` diagnostic mode, process lineage tracking
3. Anima daily report v3.0 design — from data dump to world-class diagnostic (referenced in earlier thoughts)

## Next session focus

Continue refining the agent-core infrastructure: either enhance the `core` CLI with deeper diagnostics, or pick up the Anima daily report redesign if that becomes priority.
