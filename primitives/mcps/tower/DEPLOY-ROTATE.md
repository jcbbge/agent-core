# Deploying `rotate.mjs`

## What it does

`rotate.mjs` keeps Tower's append-only JSONL/dir stores (`board.jsonl`,
`ledger.jsonl`, `odometer.jsonl`, `flight/`, `deliverables/`) from growing
without bound, WITHOUT violating the append-only invariant ruled on in
`briefs/tower/bus-data/CONCIERGE-RULING-compaction.md`.

- **Phase 1 (default, additive-only):** copies the oldest eligible prefix of
  a store to a timestamped file under `~/.tower/archive/<store>/`, verifies
  it with a sha256, and records the move in `~/.tower/archive/manifest.jsonl`.
  **The live file is never truncated or rewritten in Phase 1** — nothing is
  removed, only copied. This is rotation, not compaction: the CONCIERGE
  ruling banned "physical rewrite or truncation of `board.jsonl` to remove
  bad lines"; Phase 1 removes nothing and touches no bad lines, it archives
  well-formed aged/oversized history.
- **Phase 2 (truncation, gated):** after Phase 1 has archived a prefix,
  Phase 2 can drop that same prefix from the live file. It is refused unless
  `TOWER_ROTATE_PHASE2_OK=1` is set in the environment AND (per the code
  comment at `rotate.mjs:111` and the ruling's own guidance) concierge/CORD
  sign-off has been obtained for that run — i.e. an operator-called
  maintenance window, exactly as the ruling prescribes for any eventual
  destructive step. **The scheduled job below only ever runs Phase 1** —
  it does not set `TOWER_ROTATE_PHASE2_OK`.
- Triggers per store (size / line-count / age) are configured in
  `STORE_CONFIG` at the top of `rotate.mjs`. `pheromones` is deferred
  entirely per policy.
- Rotation takes an flock-style lock (`~/.tower/cursors/rotate.lock`) so it
  cannot race a concurrent rotation run.

## Cadence

Daily, off-hours: **03:30 local**. Chosen to avoid overlapping active
fleet hours; matches the house convention of `com.circadian.rem` running
scheduled off-peak passes.

## How it's scheduled

`~/dotfiles/launchagents/com.tower.rotate.plist`, loaded via
`launchctl bootstrap gui/$UID <plist>` (see that file's `_Metadata` block
for exactly what it runs). It invokes:

```
bun ~/agent-core/primitives/mcps/tower/rotate.mjs --store all --apply
```

Phase defaults to 1 (see `parseArgs` in `rotate.mjs`) — no `--phase 2`, no
`TOWER_ROTATE_PHASE2_OK` — so the scheduled job can only ever archive, never
truncate. Logs go to `~/.tower/logs/rotate.log` /
`~/.tower/logs/rotate.error.log`.

## Verifying

```
launchctl list | grep tower.rotate
```

To dry-run manually against a COPY (never the live board) before trusting a
config change:

```
TMP=$(mktemp -d)
cp ~/.tower/board.jsonl "$TMP/board.jsonl"
bun ~/agent-core/primitives/mcps/tower/rotate.mjs --store board --tower-home "$TMP" --dry-run
bun ~/agent-core/primitives/mcps/tower/rotate.mjs --store board --tower-home "$TMP" --apply --evidence-dir "$TMP/evidence"
wc -l "$TMP/board.jsonl"   # must equal the pre-apply count — Phase 1 never truncates
```

Deployed 2026-08-14 (agnt-infra-green, green-main wave).
