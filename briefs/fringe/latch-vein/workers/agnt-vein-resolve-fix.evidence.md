# agnt-vein-resolve-fix evidence

## Files touched

- `primitives/tools/vein/src/session.zig` — relative `.jsonl` resolution, `collectUnresolvable`, unit tests
- `primitives/tools/vein/src/scan.zig` — propagate resolve errors (no `catch continue`)
- `primitives/tools/vein/src/main.zig` — `ensureSessionsResolvable`, stderr + exit 3; drift preflight no longer `.skip`
- `primitives/tools/vein/README.md` — exit 3 truth law documented

## Build

```
cd ~/agent-core/primitives/tools/vein
/opt/homebrew/bin/zig build          # exit 0
/opt/homebrew/bin/zig build test     # exit 0
```

## Repro (a) bad session id

```
echo 'no-such-session-id-12345' > /tmp/badid.txt
./zig-out/bin/vein scan --sessions /tmp/badid.txt
```

- **exit:** 3
- **stderr:** `UNKNOWN: unresolvable session no-such-session-id-12345`

## Repro (b) relative schema-drift fixture

From vein root:

```
echo 'test/fixtures/schema-drift.jsonl' > /tmp/rel-drift.txt
./zig-out/bin/vein scan --sessions /tmp/rel-drift.txt
```

- **exit:** 4
- **stdout:** `UNKNOWN` (schema drift on resolved path — honest relative resolve, then drift gate)

## Repro (c) absolute schema-drift (unchanged)

```
echo "$(pwd)/test/fixtures/schema-drift.jsonl" > /tmp/abs-drift.txt
./zig-out/bin/vein scan --sessions /tmp/abs-drift.txt
```

- **exit:** 4
- **stdout:** `UNKNOWN`

## Smoke: known-good relative fixtures

```
printf '%s\n%s\n' 'test/fixtures/cc-mini.jsonl' 'test/fixtures/pi-mini.jsonl' > /tmp/good-fixtures.txt
./zig-out/bin/vein scan --sessions /tmp/good-fixtures.txt --out /tmp/good-out.csv
```

- **exit:** 0
- **csv:** 2 data rows (+ header)

## Acceptance baselines

Full pass12/pass3 byte-identical re-run is ORCH's gate; not re-run here.

## CORD pin: unresolvable → stderr (not stdout)

`exitUnresolvable` now writes via `.stderr()`; schema-drift `UNKNOWN` on stdout/exit 4 unchanged.

```
echo 'no-such-session-id-12345' > /tmp/badid.txt
./zig-out/bin/vein scan --sessions /tmp/badid.txt >/tmp/o.txt 2>/tmp/e.txt
```

- **exit:** 3
- **stdout (`/tmp/o.txt`):** empty
- **stderr (`/tmp/e.txt`):** `UNKNOWN: unresolvable session no-such-session-id-12345`
