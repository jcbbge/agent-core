# U1 test criteria — tower-pheromone.test.mjs

Authored by test-maker from plan only (design §4.2 / §4.4 + brief shared acceptance).
Each assert maps to an acceptance criterion.

## Emit validation (P3 no-fabrication + schema)

| Assert name | Criterion |
|-------------|-----------|
| `emit rejects missing evidence` | `evidence` required (non-empty) for every scent |
| `emit rejects invalid scent` | `scent` must be one of: work-available, work-claimed, work-done, need-help |
| `emit work-claimed requires ref` | `ref` required for work-claimed |
| `emit work-done requires ref` | `ref` required for work-done |
| `emit work-available requires payload_ref` | `payload_ref` required for work-available |
| `emit work-done requires payload_ref` | `payload_ref` required for work-done |

## Path override (D1 dedicated stream, test isolation)

| Assert name | Criterion |
|-------------|-----------|
| `PHEROMONES honors env override` | `TOWER_PHEROMONES_PATH` env selects append path |
| `emit writes to tmp path` | emissions land on override path, not live `~/.tower/pheromones.jsonl` |
| `emit appends row to tmp file` | append-only write contains minted row |
| `ph id format` | id matches `ph-<base36 ms>-<4 rand base36>` |

## TTL defaults (D5)

| Assert name | Criterion |
|-------------|-----------|
| `SCENT_TTL_DEFAULTS work-available` | default 1800 |
| `SCENT_TTL_DEFAULTS work-claimed` | default 30 |
| `SCENT_TTL_DEFAULTS work-done` | default 86400 |
| `SCENT_TTL_DEFAULTS need-help` | default 3600 |
| `emit applies work-available ttl default` | omitted `ttl_s` on emit uses scent default |
| `emit applies work-claimed ttl default` | omitted `ttl_s` on emit uses scent default |

## Field derivation — pure helper `_test.pheromoneFieldFromRows` (§4.4 D4)

| Assert name | Criterion |
|-------------|-----------|
| `derive open work-available` | fresh work-available within TTL → `open` |
| `derive empty claimed` | no claim → `claimed` empty |
| `derive empty done` | no done → `done` empty |
| `derive empty evaporated` | within TTL, unclaimed → not evaporated |
| `derive claimed after live claim` | live work-claimed `ref` → availability in `claimed` |
| `derive open empty when claimed` | claimed availability not in `open` |
| `derive done after work-done` | work-done `ref` → availability in `done` |
| `derive not open when done` | done availability not in `open` |
| `derive not claimed when done` | done availability not in `claimed` |
| `derive evaporated at ttl boundary` | TTL lapsed while open → `evaporated` |
| `derive not open when evaporated` | evaporated availability not in `open` |
| `derive re-open after expired claim` | expired claim, availability still within TTL → back to `open` |
| `derive claimed empty after claim expiry` | expired claim not holding availability |
| `derive help live within ttl` | need-help within TTL → `help` |
| `derive help empty after ttl` | need-help past TTL → not in `help` |

## Cwd scoping (project isolation)

| Assert name | Criterion |
|-------------|-----------|
| `derive cwd B does not see cwd A row` | `normCwd` scoping on pure helper |
| `derive cwd A sees own row` | same cwd sees own rows |
| `pheromoneField cwd isolation on live file` | `pheromoneField` scoped like `boardFor` |

## Integration — emit + pheromoneField (real append/read)

| Assert name | Criterion |
|-------------|-----------|
| `pheromoneField open after emit` | open→claimed→done: start open |
| `pheromoneField claimed after claim emit` | claim transitions field to claimed |
| `pheromoneField open empty when claimed` | claimed row not duplicated in open |
| `pheromoneField done after done emit` | done transitions field to done |

## Required exports (coder contract)

- `PHEROMONES`, `SCENT_TTL_DEFAULTS`, `emitPheromone`, `pheromoneField`
- `_test.pheromoneFieldFromRows(cwd, rows, { topic, now })` — pure §4.4 derivation

## Run command (tester, not test-maker)

```bash
bun ~/agent-core/primitives/hooks/tower-pheromone.test.mjs
```
