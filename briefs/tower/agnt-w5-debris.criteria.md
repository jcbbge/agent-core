# Test criteria — agnt-w5-debris (ops cleanup, not code)

Authored before implementation. Judge intent only.

## Automated checks (reproducible)

1. Evidence dir exists: `/Users/jrg/agent-core/briefs/tower/w5-debris-evidence/`
2. `00-bak-list-before.txt` exists and lists at least the seven pre-verified
   basenames (cli, lib, two COMMS-ARCH, three server bak).
3. `INVENTORY.md` exists with a table covering every path that appeared in
   `00-bak-list-before.txt`, each with sha256 and REMOVE or KEEP-WITH-NOTE.
4. For every REMOVE row: that absolute live path must not exist after act.
5. For every KEEP-WITH-NOTE row: live path still exists AND a
   `KEEP-<basename>.NOTE` file exists under the evidence dir.
6. `99-bak-list-after.txt` exists (may be empty).
7. Live production files still present:
   `~/.tower/cli.mjs`, `~/.tower/server.mjs`, `~/.tower/lib.mjs`
8. Attic directory still present; no attic file deleted
   (`~/agent-core/primitives/mcps/tower/attic/` still contains the seven
   historical bak copies plus README/DIFF-SUMMARY).
9. `agnt-w5-debris.done` exists only after the board finding is posted
   (ordering verified by ORCH via board timestamp vs done mtime when possible).

## Human / ORCH gate

- ORCH re-runs `find ~/.tower -name '*.bak*' -type f` and reconciles to
  INVENTORY.md before accepting the plate.
- GO for W5 only if residual KEEP list is empty OR every residual has a NOTE.
