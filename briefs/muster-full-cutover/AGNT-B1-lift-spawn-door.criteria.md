# Criteria — AGNT-B1 lift spawn door

1. `/Users/jrg/muster/bin/muster-spawn` exists, is executable, shebang `#!/usr/bin/env python3`.
2. `/Users/jrg/muster/bin/muster-spawn --help` exit 0 and lists orch, worker, fanout, prompt, desk, reap, verify-mark, verify-status, verify-migrate.
3. `/Users/jrg/muster/bin/muster-spawn desk --help` exit 0.
4. Desk/orch/worker/fanout/prompt/reap have no default that opens `~/tup` or `~/herdr-spine`. Remaining herdr-spine hits (if any) are verify-migrate-only and listed in the report.
5. COMPOSE_DIRECTIVE / PROFILES_DIR / PROFILE_MODEL still point at `~/agent-core/primitives/...`.
