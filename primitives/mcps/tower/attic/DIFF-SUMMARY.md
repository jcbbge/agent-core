# DIFF-SUMMARY — attic backups vs. live Tower code

Produced by `agnt-w0-attic`, 2026-08-13. Each backup below is compared
against the live file it backs up, as it exists today in `~/.tower/`.
sha256 computed with `shasum -a 256`; line counts with `wc -l`; deltas with
`diff`.

## 1. `cli.mjs.bak-20260812T165125Z` vs `cli.mjs`

- sha256 backup: `b8c75410162b9295dfc3821583176bef6a0b680b49b4e5c524ff4c92e6df6c1b`
- sha256 live:   `1755439f238e6442cd44b59a6066774bd784b035facadca301173a3802bf1934`
- **Not identical.**
- Lines: backup 177, live 296. Diff: +147 / -28.
- What changed: the live version added pheromone CLI subcommands (`emit`,
  `field`, `scan`), wrapped the body in a `main()` function, added flag
  parsing helpers (`parseFlags`, `ttlRemaining`, `availabilityState`), and
  formatting helpers (`preview`, `rowPreview`, `dayOf`, `timeOf`). The backup
  predates the pheromone-field feature entirely.

## 2. `lib.mjs.bak-20260812T194500Z` vs `lib.mjs`

- sha256 backup: `8f465ca2b0372890792fe4533353799298cdf082d135e11ecffe4381dcb3063d`
- sha256 live:   `7919934e522a579d97ee0ba1fb82317a0518daa1ad54600a9f32140bbeeb040a`
- **Not identical.**
- Lines: backup 10, live 61. Diff: +52 / -1.
- What changed: the backup is a thin 10-line re-export shim (`export * from
  tower-ledger.mjs` plus two `mkdirSync` side effects for `DELIVERABLES` and
  `FLIGHT`). The live file keeps that re-export but adds ~50 lines of its own
  exported functions directly in `lib.mjs`: `preview`, `rowPreview`,
  `ledgerInboxCursor`, `deriveInboxStateFromCursor`, `renderMessage`. Code
  that used to live only in `tower-ledger.mjs` (or didn't exist yet) is now
  partly inlined here.

## 3. `COMMS-ARCH.md.bak-20260810T221108Z` vs `COMMS-ARCH.md`

- sha256 backup: `f196768b5d9701597714135e3742d98a9fa80d30c27c755dba0cacbc4d25f083`
- sha256 live:   `3feda1e58034bcf24db4b142b2732e5295125fdab91a2164b8359080dd83b982`
- **Not identical.**
- Lines: backup 117, live 182. Diff: +71 / -6.
- What changed: live doc added a `## Five planes, strictly separated` section
  and a `### Reading scoped (2026-08-10)` subsection that don't exist in this
  backup — this snapshot predates that architectural clarification.

## 4. `COMMS-ARCH.md.bak-20260812T165025Z` vs `COMMS-ARCH.md`

- sha256 backup: `0fad1d9e5e8823d0df1904df66d246bf92f9412076ba2db894c4e879b709cd13`
- sha256 live:   `3feda1e58034bcf24db4b142b2732e5295125fdab91a2164b8359080dd83b982`
- **Not identical.**
- Lines: backup 168, live 182. Diff: +15 / -1.
- What changed: this is a later snapshot than #3 (already has most of the
  live content) but still predates the `## Five planes, strictly separated`
  section, which was added afterward.

## 5. `server.mjs.bak-20260810T221108Z` vs `server.mjs`

- sha256 backup: `e82b43d539c19e2f837ec8be0e8ae24cc293bbd08a39cd7b73135c41343cb96b`
- sha256 live:   `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4`
- **Not identical.**
- Lines: backup 293, live 350. Diff: +58 / -1.
- What changed: live added the `pheromone_emit` and `pheromone_field` MCP
  tool definitions and their `case` handlers in the dispatch switch; absent
  in this backup.

## 6. `server.mjs.bak-20260812` vs `server.mjs` — THE FLAGGED TRAP

- sha256 backup: `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4`
- sha256 live:   `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4`
- **Verdict: genuinely byte-identical, not a same-size coincidence.**
  Confirmed two ways: sha256 digests match exactly, and `cmp` reports no
  difference. Both files are 16,798 bytes and 350 lines. This backup is a
  pure duplicate of the current live `server.mjs` — no code drift at all
  between them, despite the informal (non-timestamped) filename suggesting
  it might be a distinct older snapshot.

## 7. `server.mjs.bak-20260812T165125Z` vs `server.mjs`

- sha256 backup: `9b12b00642f7567fc3339d843560391bc6e88d3a4fd60afcb92a3a0741edb59c`
- sha256 live:   `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4`
- **Not identical.**
- Lines: backup 297, live 350. Diff: +54 / -1.
- What changed: same delta shape as #5 — live added the `pheromone_emit` /
  `pheromone_field` tool definitions and dispatch cases that this snapshot
  predates. (This snapshot is chronologically between #5 and the live file,
  per its later timestamp and closer line count.)

## 8. `server.mjs.spine-backup-20260730T211657Z` vs `server.mjs`

- sha256 backup: `63ec724d15fd8deb9d1d6feed535ca8a06463e8a5a0eb90f4836167f75ad2e1d`
- sha256 live:   `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4`
- **Not identical.**
- Lines: backup 248, live 350. Diff: +106 / -4.
- What changed: the oldest of the four server.mjs snapshots (dated 07-30).
  Live added three tools absent here: `relay_inbox`, `pheromone_emit`, and
  `pheromone_field`, plus their dispatch cases — a larger feature gap than
  the other server.mjs backups, consistent with it being the earliest.

## 9. `hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` vs `hooks/stop-verdict.mjs` — THE FLAGGED TRAP

- sha256 backup: `7f1e8d200ec2916df4a64401747964e2c830cc464c0d7f38e5c618d2ed52d33f`
- sha256 live:   `68dfa0629d7144268056c456e54d6835133b2842e4ddd80637933e6cc9042893`
- **Not identical — and not a simple diff-in-kind.**
- Lines: backup 3, live 137.
- **Confirmed finding:** the backup is not a smaller/older version of the
  same implementation — it is an entirely different architecture. Its full
  content is:
  ```
  #!/usr/bin/env bun
  // Shim: canonical body at ~/agent-core/primitives/hooks/stop-verdict.mjs
  import '/Users/jrg/agent-core/primitives/hooks/stop-verdict.mjs'
  ```
  This is a 3-line shim that delegated execution to an external canonical
  file in `agent-core`. The live `hooks/stop-verdict.mjs` (137 lines) is a
  full standalone implementation — the shim's target file content now lives
  inlined directly in `~/.tower/hooks/`. So despite the backup being
  **newer by wall-clock timestamp** (2026-08-12T22:14:23Z) than several
  server.mjs backups above, it captures an **earlier architectural stage**
  of this specific hook: shim-that-imports-from-agent-core →
  inlined-full-implementation. This is a genuine finding about how Tower's
  hooks evolved (a delegation pattern was later collapsed into the hook
  file itself), not a trivial line-count diff.

## Summary table

| # | File | Identical to live? | Backup lines | Live lines | +/- |
|---|---|---|---|---|---|
| 1 | cli.mjs.bak-20260812T165125Z | No | 177 | 296 | +147/-28 |
| 2 | lib.mjs.bak-20260812T194500Z | No | 10 | 61 | +52/-1 |
| 3 | COMMS-ARCH.md.bak-20260810T221108Z | No | 117 | 182 | +71/-6 |
| 4 | COMMS-ARCH.md.bak-20260812T165025Z | No | 168 | 182 | +15/-1 |
| 5 | server.mjs.bak-20260810T221108Z | No | 293 | 350 | +58/-1 |
| 6 | server.mjs.bak-20260812 | **Yes — byte-identical** | 350 | 350 | 0/0 |
| 7 | server.mjs.bak-20260812T165125Z | No | 297 | 350 | +54/-1 |
| 8 | server.mjs.spine-backup-20260730T211657Z | No | 248 | 350 | +106/-4 |
| 9 | hooks/stop-verdict.mjs.spine-backup-20260812T221423Z | No (shim vs. full impl) | 3 | 137 | n/a — different in kind |

## Gaps

None. All 9 sha256 comparisons (copy-vs-original) matched, all 9 diffs
against live counterparts were read directly (not guessed), and both
ORCH-flagged traps were resolved with hash/`cmp` evidence.
