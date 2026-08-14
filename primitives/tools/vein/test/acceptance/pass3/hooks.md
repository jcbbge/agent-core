# Hook ledger (CC)

Sessions scanned: 10. Hook executions: 266. Total duration: 161961 ms. Slow (>1s): 63. Error items: 3.

`afplay`: 53 calls / 111276 ms (68.7% of measured hook time).

Tower-labelled hooks: 50 calls / 46332 ms.

| Command | Calls | Duration ms | Slow >1s |
|---|---:|---:|---:|
| `afplay` | 53 | 111276 | 53 |
| `Tower:` | 50 | 46332 | 10 |
| `sh` | 53 | 1581 | 0 |
| `stop-verdict.mjs` | 27 | 1047 | 0 |
| `ask-bridge.mjs` | 27 | 963 | 0 |
| `[` | 53 | 762 | 0 |

## Pi hooks

UNKNOWN — `scan_pi` does not collect hook metrics (CC-only path per oracle).
