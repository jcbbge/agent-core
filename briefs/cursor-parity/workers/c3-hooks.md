# MAKE brief — c3-hooks (Unit C3 slice 3/3)

> From: orch-c3-parity, 2026-08-12. Binding. Parent: `briefs/cursor-parity/unit-c3-parity-expansions.md`.
> Board: `agent-core/cursor-parity`. Make slug: `c3-hooks`.
> SPAWN: under `cursor-fleet make` — coder OR test-maker only. No emojis.

Port hook primitives to cursor via a hooks.json MERGE strategy. Design already posted (orch-c3-parity finding) — implement that design; do not reinvent.

## Pre-Verified Facts

- Live `~/.cursor/hooks.json` (read this session):
  ```json
  {"hooks":{"sessionStart":[{"command":"bash '/Users/jrg/.cursor/herdr-agent-state.sh' session"}],"preToolUse":[{"command":"bash '/Users/jrg/agent-core/primitives/hooks/slim-guard-cursor.sh'","matcher":"Shell"}]},"version":1}
  ```
- Hand-maintained sessionStart herdr line MUST survive every sync.
- Store: `hook/slim-guard` → source `primitives/hooks/slim-guard.sh`, deploy claude-code only today. Cursor-adapted twin exists at `primitives/hooks/slim-guard-cursor.sh` (hand port; adaptation belongs in port engine — canonical slim-guard.sh stays untouched).
- create-hook skill (this session): user hooks = `~/.cursor/hooks.json` + `~/.cursor/hooks/*`; rewrite uses `preToolUse` + `updated_input` (beforeShellExecution cannot rewrite).
- Unit A translate: SessionStart→sessionStart; PreToolUse/Bash→preToolUse/Shell; updatedInput→updated_input.
- Current `resolveDeployPath` for hooks appends `.sh` under `profile.hooks` dir — insufficient alone for JSON merge.
- Design (binding):
  1. cursor profile: `hooks ~/.cursor/hooks` (script dir) + new field `hooks_json ~/.cursor/hooks.json`.
  2. Sync (hook, cursor): write ported script to hooks dir; read/upsert/write hooks_json with marker `"agent_core":"hook/<name>"`; never delete unmarked entries.
  3. Status: expected = merge(current_json, managed_entry); digest compare so unmanaged drift does not stale.
  4. v1: only hook/slim-guard → cursor (+ keep CC). Other store hooks (ts/mjs) out of scope — note on board.
- c3-commands + c3-subagents land first — build atop their CLI HEAD; do not revert.

## Parallel Work Notice

- Own: port.zig / sync.zig / status.zig / registry.zig hooks_json path + tests. Registry claim via orch.
- Do not touch command/ or agents/ primitives except to avoid merge conflicts in registry.zig.

## Tower

- Topic `agent-core/cursor-parity`. from=`agnt-c3-hooks-coder` / `agnt-c3-hooks-testmaker`.
- MUST post before/after hooks.json diff as finding after sync.

## Tasks — IMPLEMENTER (coder)

1. Schema: parse `hooks_json <path>` on harness profiles; store on HarnessProfile.
2. port(hook, cursor): produce cursor-protocol script bytes equivalent in behavior to slim-guard-cursor.sh (from slim-guard.sh source — transform in port engine). For other hooks without a known transform, identity is OK but v1 only registers slim-guard for cursor.
3. sync/status special path when harness=cursor and hooks_json set:
   - Write script to resolveDeployPath (hooks dir).
   - Merge hooks.json: upsert entry `{command: "bash '<abs-script>'", matcher: "Shell", agent_core: "hook/slim-guard"}` under `preToolUse` (replace any prior object with same agent_core id). Preserve all unmarked entries including sessionStart herdr.
4. Registry: add cursor `hooks` + `hooks_json` fields; add `deploy cursor` to `hook/slim-guard`.
5. Virgin-cache build; dry-run board post; scoped `agent-core sync hook/slim-guard`.
6. Capture before/after hooks.json; prove herdr sessionStart survived; prove managed slim entry points at `~/.cursor/hooks/slim-guard.sh` (copied script).
7. status 0 stale 0 missing. Submodule commit. `.done/c3-hooks-coder.done` + provenance report.

## Tasks — TEST-MAKER

Author `cli/test/integration/c3_hooks_acceptance.sh` (+ fixtures with a sample hooks.json containing an unmarked entry) proving:

| ID | Criterion |
|----|-----------|
| T-C3-HK-MERGE-UPSERT | Sync adds managed entry; unmarked entries preserved. |
| T-C3-HK-MERGE-UPDATE | Second sync updates managed entry in place; still preserves unmarked. |
| T-C3-HK-STATUS-OK | After sync, status ok for hook/slim-guard on cursor. |
| T-C3-HK-STATUS-STALE-MANAGED | Corrupt managed command path → stale. |
| T-C3-HK-STATUS-UNMANAGED-OK | Changing unmarked sessionStart command does NOT stale (merge-from-current semantics). |
| T-C3-HK-SCRIPT-DEPLOYED | Script file written under hooks dir; checksum matches port output. |
| T-C3-HK-CC-UNCHANGED | claude-code slim-guard still copy_file to hooks dir (regression). |

`.done/c3-hooks-testmaker.done` + board criterion list.

## Constraints

- Canonical `slim-guard.sh` not modified to fit cursor — transform in port.zig.
- Never delete unmarked hooks.json entries.
- No bare sync. No outer commit. No cursor-shim edits.

## Done-when

Merge strategy demonstrated with before/after diff on board; tests green; status green; submodule commit; `.done` markers.

## Report-back

Board finding → orch-c3-parity (include hooks.json diff).
