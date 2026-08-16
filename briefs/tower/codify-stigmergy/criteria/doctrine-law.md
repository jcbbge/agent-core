# Acceptance criteria — AGNT doctrine-law
1. `rg -n 'nQ=0 before' ~/agent-core/primitives/mcps/tower/COMMS-ARCH.md` exits 0
2. `rg -n 'field expression|Field expression|nQ on the field' ~/agent-core/primitives/mcps/tower/RESPONSIBLE-PARTY-AND-NQ.md` exits 0
3. `rg -n 'ranks 1–4|ranks 1-4|pull loop|two stopping' ~/agent-core/primitives/mcps/tower/COMMS-ARCH.md ~/agent-core/primitives/rules/control-flow.md` exits 0
4. `rg -n 'concierge' ~/agent-core/primitives/mcps/tower/COMMS-ARCH.md ~/agent-core/primitives/rules/control-flow.md` shows leave-a-trace / plane 4 exception
5. orbit.zig quote still present verbatim in RESPONSIBLE-PARTY-AND-NQ.md
