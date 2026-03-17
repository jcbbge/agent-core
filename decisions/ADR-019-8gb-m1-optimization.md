# ADR-019: 8GB M1 Memory Optimization — Constraint the Big Wolves

**Status:** Accepted  
**Date:** 2026-03-16  
**Deciders:** jcbbge (human), Claude (agent)

---

## Context

Running agent-core infrastructure (7 services + Ollama + dev tools) on 8GB M1 MacBook Air. Previous configuration had no memory governors, leading to:
- Ollama loading unlimited models (swap death)
- Node/Bun builds consuming unlimited heap
- SurrealDB assumed to need `--memory-limit` (false)

Current footprint before optimization:
- Ollama: 2+ models, unbounded growth
- Node builds: >4GB heap on complex SolidStart projects
- System hitting swap routinely

## Decision

**Implement layered memory constraints targeting the "Big Wolves":**

### Layer 1: Manual dev processes (~/.zshenv)
```bash
export NODE_OPTIONS="--max-old-space-size=2560"     # 2.56GB max
export BUN_JSC_forceRAMSize=2500000000              # 2.5GB max
export VITE_MAX_WORKERS=2                          # Limit parallel workers
```

### Layer 2: AI service flags (~/.zshenv + plists)
```bash
export OLLAMA_MAX_LOADED_MODELS=2                   # Both embedding + LLM
export OLLAMA_MAX_LOADED_MODELS=1                 # Single model only (rejected)
export OLLAMA_NUM_PARALLEL=1                      # Per-model concurrency
export OLLAMA_KEEP_ALIVE=5m                       # Unload idle after 5min
export KOTADB_MAX_INSTANCES=4                     # Connection pool limit
```

**Critical correction during implementation:** Changed `OLLAMA_MAX_LOADED_MODELS` from 1 to 2 because user requires BOTH:
- `nomic-embed-text:latest` — embeddings for Anima
- `qwen2.5:0.5b` — summarization/categorization for Flux

Total Ollama resident memory: ~1.3GB (within 2GB target)

### Layer 3: What we DON'T constrain
- **SurrealDB**: No memory limit flag exists in 3.0.0; currently using healthy 164MB baseline
- **KotaDB/Anima/Executor**: Small footprint services; constrain only if they misbehave

## Telemetry Governor

Added `core nt` command for proactive monitoring:
```bash
cmd_notify() {
  # macOS notification when processes >20% RAM
  osascript -e "display notification ..."
}
```

## Consequences

### Positive
- Ollama: 2 models resident, no swap pressure from model thrashing
- Node builds: Bounded at 2.56GB, prevents OOM kills
- Total brain core: ~230MB + Ollama 1.3GB = ~1.5GB baseline
- Leaves 5GB+ for browser, VS Code, SolidStart before swap

### Negative
- Cannot load 3+ models simultaneously in Ollama
- Build processes may be slower with only 2 Vite workers
- SurrealDB unconstrained (accepted risk — well-behaved at 164MB)

## Key Correction During Implementation

| Initial Plan | Corrected | Reason |
|--------------|-----------|--------|
| `OLLAMA_MAX_LOADED_MODELS=1` | `=2` | User needs both embedding and LLM models simultaneously |
| `--memory-limit 1GB` for SurrealDB | Removed | SurrealDB 3.0.0 doesn't support this flag; causes startup failure |

## Current Baseline

| Service | Memory | Constrained? |
|---------|--------|--------------|
| SurrealDB 3.0.0 | ~164MB | No (healthy baseline) |
| KotaDB | ~51MB | Yes (max_instances=4) |
| Ollama (2 models) | ~1.3GB | Yes (max_loaded_models=2) |
| Anima worker | ~19MB | No |
| **Total Brain Core** | **~1.5GB** | — |

## Validation

```bash
$ curl http://localhost:8001/api/ps
Models in memory: 2
  - qwen2.5:0.5b: 730MB VRAM
  - nomic-embed-text:latest: 578MB VRAM

$ core nt
✓ No high-risk processes detected
```

## Related

- ADR-017: PROGRAM.md generation revealed service relationships
- Uses ADR-003 constraint: MCP servers local-only
