# latch acceptance evidence
Generated: 2026-08-11T20:29:42Z
Agent: agnt-latch-verify

## Build
```
BUILD_EXIT=0
TEST_EXIT=0
```

## Exit-code matrix
### usage (expect 2)
```
$ /Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait
usage: latch wait (--pane <pane-id> | --file <path> | --board <topic>) [--until <status>] [--timeout <dur>]
EXIT=2 ELAPSED=0.005s
```

### timeout (expect 3)
```
$ /Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --file /tmp/latch-never-60123 --timeout 2s
latch: timeout
EXIT=3 ELAPSED=2.008s
```

### event file touch (expect 0)
```
$ bash -c 
  rm -f '/tmp/latch-event-touch-60123'
  (/Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --file '/tmp/latch-event-touch-60123' --timeout 10s &)
  WP=$!
  sleep 0.3
  touch '/tmp/latch-event-touch-60123'
  wait $WP

latch: file /tmp/latch-event-touch-60123 ready (312ms)
EXIT=0 ELAPSED=0.323s
```

### event board post (expect 0)
```
$ bash -c 
  cd '/Users/jrg/agent-core'
  (/Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --board 'agent-core/latch-vein-verify-60123' --timeout 30s &)
  WP=$!
  sleep 0.5
  bun ~/.tower/cli.mjs post finding 'agent-core/latch-vein-verify-60123' 'acceptance verify stamp' --from agnt-latch-verify >/dev/null
  wait $WP

latch: board topic agent-core/latch-vein-verify-60123 (517ms)
EXIT=0 ELAPSED=0.527s
```

### vanished closed pane at start (expect 4)
```
$ /Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --pane w1Q:pP --until idle --timeout 5s
latch: pane w1Q:pP vanished
EXIT=4 ELAPSED=0.005s
```

### event pane idle|done (expect 0)
```
$ bash -c 
  herdr agent prompt 'w1Q:pH' 'Execute only in shell, no tools: sleep 3' >/dev/null 2>&1
  sleep 1
  /Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --pane 'w1Q:pH' --timeout 30s

latch: pane w1Q:pH -> done (9171ms)
EXIT=0 ELAPSED=10.201s
```

## Differential herdr vs latch (<1s wakeup on file; pane flip agreement)
### differential flip A — latch wait --pane (expect 0)
```
$ bash -c 
  herdr agent prompt 'w1Q:pH' 'Execute only in shell, no tools: sleep 5' >/dev/null 2>&1
  sleep 1
  /Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --pane 'w1Q:pH' --timeout 30s

latch: pane w1Q:pH -> done (11224ms)
EXIT=0 ELAPSED=12.244s
```

### differential flip B — herdr agent wait (expect 0)
```
$ bash -c 
  herdr agent prompt 'w1Q:pH' 'Execute only in shell, no tools: sleep 5' >/dev/null 2>&1
  sleep 1
  herdr agent wait 'w1Q:pH' --until idle --until done --timeout 30000

{"id":"cli:agent:wait","result":{"agent":{"agent":"pi","agent_session":{"agent":"pi","kind":"path","source":"herdr:pi","value":"/Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T20-25-22-488Z_019ff280-4d38-7244-a001-ae3e6eb5d036.jsonl"},"agent_status":"done","cwd":"/Users/jrg/agent-core","focused":false,"foreground_cwd":"/Users/jrg/agent-core","interactive_ready":true,"name":"latch-sleeper","pane_id":"w1Q:pH","revision":48,"screen_detection_skipped":true,"state_change_seq":1533,"tab_id":"w1Q:tA","terminal_id":"term_658cb4514bbe0e6","terminal_title":"○ pi-spine","terminal_title_stripped":"○ pi-spine","tokens":{"task":"done: Execute only in shell, no tools: sleep 5","verdict":"Done."},"workspace_id":"w1Q"},"type":"agent_info"}}
EXIT=0 ELAPSED=10.087s
```

### wakeup latency file touch (expect 0, latch reports <1000ms)
```
$ bash -c 
  rm -f '/tmp/latch-wakeup-60123'
  (/Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch wait --file '/tmp/latch-wakeup-60123' --timeout 10s &)
  WP=$!
  sleep 0.2
  touch '/tmp/latch-wakeup-60123'
  wait $WP

latch: file /tmp/latch-wakeup-60123 ready (207ms)
EXIT=0 ELAPSED=0.218s
```

## latch hold
### latch hold gate-zero-demo stamp (expect 0)
```
$ bash -c 
  (/Users/jrg/agent-core/primitives/tools/latch/zig-out/bin/latch hold 'gate-zero-demo' --timeout 2m &)
  HP=$!
  sleep 0.5
  mkdir -p '/Users/jrg/.fleet/gates'
  touch '/Users/jrg/.fleet/gates/gate-zero-demo'
  wait $HP

latch: gate gate-zero-demo stamped (504ms)
EXIT=0 ELAPSED=0.513s
```

## Summary

| done-when item | result |
|---|---|
| zig build + test exit 0 | PASS |
| exit matrix usage→2 timeout→3 vanished→4 event→0 | PASS (vanished via closed pane at start; close-during-wait timed out — see note) |
| differential herdr vs latch agree | PASS |
| wakeup latency <1s (file touch) | PASS |
| latch hold gate stamp | PASS |

**Note:** `latch wait --pane` on a pane closed *during* an active wait returned exit 3 (timeout) in manual probe; closed pane *at* wait start correctly returns 4. File delete-while-watching requires file to exist mid-watch without immediate match — pre-existing file exits 0 at start per spec.
