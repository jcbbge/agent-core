# Criteria — AGNT-A4 doctrine law residuals

1. `rg -n 'field\.py|~/tup/|~/herdr-spine|spine-report|skill/tup|TUP_FIELD_DIR' primitives/AGENTS.md primitives/directives/` returns only (a) fallback/compat, (b) SOURCES/history that does not instruct running those paths, or (c) explicit "retired / do not call".
2. Same rg over `primitives/rules/ENFORCEMENT.md` meets that bar; the spawn-door ledger row names `muster-spawn` and `~/muster/docs/agent-spawn-sop.md`.
3. `rg -n 'herdr-spine|field\.py|~/tup/' primitives/hooks/spawn-door.sh primitives/hooks/spawn-door-pi.ts` is empty (or every hit is explicit retired / do not call).
4. The herdr-agent-start deny strings in `spawn-door.sh` and `spawn-door-pi.ts` both name `~/muster/bin/muster-spawn` and `~/muster/docs/agent-spawn-sop.md`.
