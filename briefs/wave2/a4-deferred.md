# A4 deferred — next wave

## Grounding hook pair
- `~/.claude/hooks/grounding-hook.mjs`
- `~/.pi/agent/extensions/grounding-hook.ts`

Not attempted: steps 1–4 were green but grounding is a separate shim migration with Edit-without-Read semantics to preserve. Scope for next wave: move body to `~/agent-core/primitives/hooks/grounding-hook.mjs`, leave live paths as shims, pipe-test with realistic PreToolUse payloads.

## herdr-task-report pair
- `~/.claude/hooks/herdr-task-report.sh`
- `~/.pi/agent/extensions/herdr-task-report.ts`

Out of scope per brief (herdr-managed). Do not touch without explicit ORCH order — risk to herdr-agent-state.ts sidebar contract.
