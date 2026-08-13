# W3 prove-planes — test plan (not landed)

Per unit constraints: do **not** land failing tests on main without CORD authorize. No production fix this unit → document only.

## Candidates (mechanical locks)

| ID | Assertion | Suggested home | Depends on |
|---|---|---|---|
| T-F9 | `cli board <topic>` returns only rows with that topic (or errors on unused argv) | `primitives/mcps/tower/cli.test.mjs` | CORD authorize-fix for `cli.mjs` topic parse **or** authorize red lock |
| T-F1 | `send_to_user({kind:"deliverable"})` yields ledger row with `to:"operator"` (or schema requires explicit `to`) | `server-drift.test.mjs` or new `inbox-routing.test.mjs` | CORD authorize-fix for `server.mjs` |
| T-F4 | `mark_relayed` on unknown id returns 0 acknowledged / throws | server tests | CORD authorize |
| T-ISO | `boardFor(cwdA)` excludes rows whose `normCwd(cwd)` is cwdB | `tower-ledger` unit test | none (helper already pure) — safe green lock |
| T-NORM | spine worktree + cursor worktree paths collapse to project root | `normCwd` tests | optional extend for `~/.cursor/worktrees/` |
| T-F11 | document truncation contract: CLI preview ≤100; MCP full body | docs + optional snapshot | product decision |

## Recommendation to CORD

1. Authorize **T-ISO** (green) immediately — locks proven isolation helper without claiming F1/F9 fixed.
2. Authorize fix+lock for **F1** before calling bus fully operational (highest severity).
3. Authorize fix+lock for **F9** (medium; CLI footgun).
4. Defer red-only locks unless CORD wants a visible red main as accountability.

Surfaces worker also noted unguarded `appendFileSync` (audit F7) — bus-data lane owns write-path; out of W3 fence.
