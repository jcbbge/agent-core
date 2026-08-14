# Hook ledger (CC)

Sessions scanned: 20. Hook executions: 1826. Total duration: 922998 ms. Slow (>1s): 355. Error items: 60.

`afplay`: 312 calls / 657476 ms (71.2% of measured hook time).

Tower-labelled hooks: 252 calls / 224052 ms.

| Command | Calls | Duration ms | Slow >1s |
|---|---:|---:|---:|
| `afplay` | 312 | 657476 | 312 |
| `Tower:` | 252 | 224052 | 43 |
| `stop-verdict.mjs` | 289 | 12268 | 0 |
| `sh` | 312 | 11781 | 0 |
| `ask-bridge.mjs` | 289 | 11392 | 0 |
| `[` | 312 | 6029 | 0 |

## Pi hooks

UNKNOWN — `scan_pi` does not collect hook metrics (CC-only path per oracle).
