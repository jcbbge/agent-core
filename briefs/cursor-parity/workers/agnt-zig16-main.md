# AGNT — Zig 0.16 main.zig allocator fix

> From: orch-zig16-build-fix, 2026-08-12. Binding.
> Board: `agent-core/cursor-parity`. Your `.done`: `briefs/cursor-parity/.done/agnt-zig16-main.done`.
> You edit; ORCH verifies virgin-cache build + status parity + commits the submodule. **Do not commit.**

## Mission

Fix `~/agent-core/cli` so `zig build` succeeds on Zig 0.16.0. Minimal build-fix only.

## Pre-verified facts (ORCH this session)

- `zig version` = 0.16.0. Failure: `src/main.zig:34` — `std.heap.GeneralPurposeAllocator` removed.
- House idiom (siblings `primitives/tools/{slim,latch,vein,assay}/src/main.zig`):
  `pub fn main(init: std.process.Init) !void { const allocator = init.arena.allocator(); … }`
  Drop-in alternative if Init cascades: `var gpa = std.heap.DebugAllocator(.{}){};` (Zig 0.16 GPA replacement). Prefer house idiom; if cascade >5 compile sites, stop and board-report the full error list to orch-zig16-build-fix — do NOT modernize the whole CLI.
- In-flight `build.zig` / `build.zig.zon` are comment-stripping only — KEEP them. Leave `*.bak` untracked. Do not restore bak.
- Pre-build status refs already captured by ORCH at `/tmp/agent-core-status-pre.txt` (+ `-pi`, `-cc`). Do not overwrite `zig-out` until your fix compiles; ORCH will virgin-cache verify.
- Preserve registry-arena design in `status.zig`/`sync.zig`/`inline.zig` (GPA/alloc param unused by design).
- No `agent-core sync`. No outer-repo edits. No commits.

## Tasks

1. CLAIM on board `agent-core/cursor-parity`: you own `cli/src/main.zig` (and only further `.zig` files if compile forces ≤5 sites).
2. Apply the allocator fix. Prefer `std.process.Init` house style; fall back to `DebugAllocator` if Init forces a cascade.
3. Run `cd /Users/jrg/agent-core/cli && zig build` (may use existing cache). Fix further 0.16 errors only as they surface, minimally.
4. Post finding: which idiom you chose, files touched, build exit code, error list if any remaining.
5. Last action: `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/agnt-zig16-main.done`

## File partition

- Own: `/Users/jrg/agent-core/cli/src/*.zig` only (prefer just `main.zig`).
- Do not touch: `build.zig` / `build.zig.zon` (already reconciled), outer repo, registry, primitives, harness configs.
- Do not commit. Do not `rm -rf .zig-cache zig-out` (ORCH owns virgin-cache verify).

## Done-when

1. `zig build` in `cli/` exits 0 (any cache ok for your local check).
2. Board finding posted with idiom choice + file list.
3. `.done` marker written.
