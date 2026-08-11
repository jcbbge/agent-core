# agnt-vein-scaffold evidence

**Agent:** agnt-vein-scaffold  
**Date:** 2026-08-11

## Files created

```
~/agent-core/primitives/tools/vein/build.zig
~/agent-core/primitives/tools/vein/README.md
~/agent-core/primitives/tools/vein/src/main.zig
~/agent-core/primitives/tools/vein/src/lib.zig
~/agent-core/primitives/tools/vein/src/schema.zig
~/agent-core/primitives/tools/vein/src/session.zig
~/agent-core/primitives/tools/vein/src/scan.zig
~/agent-core/primitives/tools/vein/src/extract_cc.zig
~/agent-core/primitives/tools/vein/src/extract_pi.zig
~/agent-core/primitives/tools/vein/src/classify.zig
~/agent-core/primitives/tools/vein/src/csv.zig
~/agent-core/primitives/tools/vein/src/report.zig
~/agent-core/primitives/tools/vein/test/smoke.zig
```

## Build evidence

```bash
cd ~/agent-core/primitives/tools/vein && /opt/homebrew/bin/zig build
# exit 0 (no output)

cd ~/agent-core/primitives/tools/vein && /opt/homebrew/bin/zig build test
# exit 0 (no output)
```

## CLI smoke

```bash
./zig-out/bin/vein
# prints usage, exit 2

./zig-out/bin/vein --help
# prints usage, exit 0
```

## CLI pin deviation

None — pinned verbs/flags match brief exactly.

## Module status

All modules stubbed with `NotImplemented` except CLI parse/dispatch and build wiring. `Row` type covers all 29 CSV fields in oracle order.
