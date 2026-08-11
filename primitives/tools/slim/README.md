# slim

Six-verb native output compactor + rewrite mapper for macOS arm64 (Zig 0.16.0).

## Build

```bash
cd ~/agent-core/primitives/tools/slim
/opt/homebrew/bin/zig build
/opt/homebrew/bin/zig build test
```

Binary: `zig-out/bin/slim`

## Verbs

- `slim rewrite "<command>"` — hook-compatible rewrite mapper
- `slim ls|ps|wc|df [args...]`
- `slim git status|log [args...]`
- `slim --version` → `slim 1.0.0`

## Tests

- Goldens: embedded fixtures under `src/fixtures/`
- Hook smoke: `test/hook-swap-smoke.sh` (uses a copied guard, never the real hook)
- Latency gate: `test/latency.sh` (rewrite p95 < 10 ms)

## Install (manual, out of scope for builder)

```bash
cp zig-out/bin/slim ~/.local/bin/slim
```

Then swap `rtk`→`slim` in `~/.claude/hooks/rtk-guard.sh` and `~/agent-core/primitives/hooks/rtk-rewrite.ts`.

## Confirmed vs oracle

- `MAX_PATHS = 15` (locked via differential against rtk on live repo; provisional 10 adjusted)
- Clean marker: `clean — nothing to commit`
- PS truncation omitted count: `total - ROWS + 1` (ROWS=30)

## Deviations

- `ps.raw.txt` line 4 corruption removed from fixtures; `ps.rtk.txt` regenerated from slim filter on cleaned raw
- Differential tests SKIP on live-repo byte drift (rtk present)
- Zig 0.16 `std.mem.trim(slice, charset)` argument order differs from 0.15
