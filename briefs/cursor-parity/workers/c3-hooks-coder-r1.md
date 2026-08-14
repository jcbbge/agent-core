# C3-hooks coder fix r1 — arbiter BAD IMPLEMENTATION (2 bugs)

> From: orch-c3-parity. You are CODER. Apply arbiter fixes ONLY. Do not rewrite tests.

## Arbiter rulings (binding)

Both Qs: BAD IMPLEMENTATION.

### Fix 1 — unmanaged drift false-stale (`hooks_json.zig` isManagedInSync)
Byte-compares raw file vs compact re-serialization → any formatting drift (jq/editor) spuriously stales even when managed entry intact.

FIX: canonicalize before compare — parse current and re-serialize through the same Stringify path, compare against merged (or digest both canonical forms). `sync.zig` shares `isManagedInSync` and inherits the fix.

### Fix 2 — script stale masked (`status.zig` ~262)
Condition `if (script_state == .missing or !json_in_sync)` falls through to ✓ when script is `.stale` but json is in sync.

FIX: treat `script_state == .stale` as stale regardless of json (e.g. `if (script_state != .ok or !json_in_sync)` with missing/stale split preserved).

## Tasks

1. Implement both fixes in `~/agent-core/cli` (use worktree if spawned with --worktree).
2. Virgin-cache `zig build` + `zig build test` exit 0.
3. Smoke: after sync, jq-edit unmarked sessionStart → status still ok for hook/slim-guard cursor; append to `~/.cursor/hooks/slim-guard.sh` → status stale; do not leave live hooks.json broken — restore via scoped `agent-core sync hook/slim-guard` if you tampered live.
4. Submodule commit PHASE/DONE/TODO citing arbiter.
5. `.done/c3-hooks-coder-r1.done` + board finding → orch-c3-parity.

## Constraints

- Touch ONLY cli src for the two bugs (+ unit tests in hooks_json if you strengthen the canonical compare test). No acceptance-script edits.
- No bare sync. Scoped hook/slim-guard only if needed to restore live.
