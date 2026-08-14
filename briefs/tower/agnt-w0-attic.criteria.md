# Test criteria — W0 / agnt-w0-attic (preserve Tower backups into git)

Authored by `orch-w0-version-control` from the plan only, BEFORE any implementation
agent was spawned. The implementation agent (`agnt-w0-attic`) did not author these.
Each assert maps to a done-when criterion in
`~/agent-core/briefs/tower/agnt-w0-attic.md`.

Unit is a preservation copy, so the criteria are dominated by two properties:
**nothing is lost** (fidelity) and **nothing is disturbed** (non-mutation).

## Fidelity — the 9 backups are preserved byte-for-byte (done-when #1)

| Assert name | Criterion |
|-------------|-----------|
| `attic holds 8 top-level backups` | `attic/` contains `cli.mjs.bak-20260812T165125Z`, `lib.mjs.bak-20260812T194500Z`, `COMMS-ARCH.md.bak-20260810T221108Z`, `COMMS-ARCH.md.bak-20260812T165025Z`, `server.mjs.bak-20260810T221108Z`, `server.mjs.bak-20260812`, `server.mjs.bak-20260812T165125Z`, `server.mjs.spine-backup-20260730T211657Z` |
| `attic holds the hooks backup in a hooks subdir` | `attic/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` is a regular file |
| `all 9 copies sha256-match their source` | For each of the 9, `shasum -a256` of the `attic/` copy equals that of its `~/.tower/` original — 9/9 match, zero mismatches |
| `no extra files smuggled into attic` | `attic/` contains exactly the 9 backups plus `README.md` and `DIFF-SUMMARY.md` — nothing else |

## Non-mutation — the live tree is undisturbed (done-when #2, prohibitions)

| Assert name | Criterion |
|-------------|-----------|
| `all 9 originals still exist` | All 9 source paths still resolve as regular files under `~/.tower/` |
| `originals unmodified` | sha256 of each of the 9 originals is unchanged from the values recorded at task start |
| `no live code file touched` | `~/.tower/{cli,server,lib}.mjs`, `~/.tower/hooks/*.mjs` sha256 unchanged |
| `no Tower state touched` | `board.jsonl` / `ledger.jsonl` / `odometer.jsonl` / `pheromones.jsonl` are either unchanged or strictly APPENDED to by other live agents — never rewritten (old sha256 still matches the corresponding line-count prefix) |
| `no mutating git command ran` | No commit/stage/branch/stash by this agent; `git log -1` in `~/agent-core` is unchanged from task start |

## Analysis quality — the diff summary answers the two traps (done-when #3)

| Assert name | Criterion |
|-------------|-----------|
| `DIFF-SUMMARY.md exists and covers all 9` | File exists with one section per backup, each carrying both sha256s, both line counts, and a diffstat |
| `server.mjs.bak-20260812 verdict is sha-based` | The summary states explicitly whether it is byte-identical to live `server.mjs` (same 16,798-byte size) based on sha256 comparison — not on size, and not on inference |
| `stop-verdict inversion is named` | The summary states that `stop-verdict.mjs.spine-backup-20260812T221423Z` is a 3-line shim while live `hooks/stop-verdict.mjs` is a 137-line implementation, i.e. the backup is the OLDER form and the hook was later inlined |
| `each diff has a read-not-guessed sentence` | Every one of the 9 entries carries a one-sentence description of what actually changed, derived from reading the diff |
| `attic/README.md explains the attic` | States these are pre-version-control point-in-time backups, that nothing imports them, that originals remain in `~/.tower/`, and that their deletion is a separate later decision (W5) |

## Reporting (done-when #4)

| Assert name | Criterion |
|-------------|-----------|
| `board CLAIM posted before writes` | `board.jsonl` has a `tower/w0-version-control` row from `agnt-w0-attic` of type claim |
| `board carries condensed diff summary` | A `tower/w0-version-control` row from `agnt-w0-attic` contains the condensed diff summary including both trap verdicts |
| `.done written last` | `~/.tower/agnt-w0-attic.done` exists and its mtime is at or after the final board post |

## Human-only

| Item | Criterion |
|------|-----------|
| `gaps stated plainly` | Report names anything that could not be proven as an explicit gap rather than a silent assumption |

## Run command (verification, by the ORCH gate — not by the implementer)

```bash
# fidelity + non-mutation spot check
for f in cli.mjs.bak-20260812T165125Z lib.mjs.bak-20260812T194500Z \
         COMMS-ARCH.md.bak-20260810T221108Z COMMS-ARCH.md.bak-20260812T165025Z \
         server.mjs.bak-20260810T221108Z server.mjs.bak-20260812 \
         server.mjs.bak-20260812T165125Z server.mjs.spine-backup-20260730T211657Z; do
  cmp -s "$HOME/.tower/$f" "$HOME/agent-core/primitives/mcps/tower/attic/$f" \
    && echo "OK   $f" || echo "FAIL $f"
done
cmp -s "$HOME/.tower/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z" \
       "$HOME/agent-core/primitives/mcps/tower/attic/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z" \
  && echo "OK   hooks backup" || echo "FAIL hooks backup"
```
