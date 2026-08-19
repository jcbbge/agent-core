# Criteria — AGNT-B3 isolation docs

1. `field/field.lisp` and `durable/cli.lisp` read MUSTER_* first, then TUP_*, then the existing default.
2. `/Users/jrg/muster/bin/run-tests.sh` still GREEN FAIL 0 (TUP_* fallback; that runner is unmodified).
3. `docs/agent-spawn-sop.md`, `docs/DRIVING.md`, and `AGENTS.md` spawn/isolation lines teach `~/muster/bin/muster-spawn` (or `~/bin/spine-spawn` as forwarder) and MUSTER_* as primary.
4. `rg TUP_FIELD_DIR` on those three docs shows only fallback/compat wording if any.
5. Those docs do not teach `~/tup/socket/spawn.py` or `~/herdr-spine/bin/spine-spawn` as live.
