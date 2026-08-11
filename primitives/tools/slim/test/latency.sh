#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLIM="$ROOT/zig-out/bin/slim"
CMD='ls -la'

if [[ ! -x "$SLIM" ]]; then
  echo "missing $SLIM — run zig build first" >&2
  exit 1
fi

python3 - <<PY
import subprocess, time, statistics, sys
slim = "$SLIM"
cmd = "$CMD"
samples = []
for _ in range(120):
    t0 = time.perf_counter()
    subprocess.run([slim, "rewrite", cmd], stdout=subprocess.DEVNULL, check=True)
    samples.append((time.perf_counter() - t0) * 1000)
samples.sort()
p50 = statistics.median(samples)
p95 = samples[int(len(samples) * 0.95) - 1]
print(f"rewrite samples={len(samples)} median_ms={p50:.3f} p95_ms={p95:.3f}")
if p95 >= 10:
    sys.exit(1)
PY
