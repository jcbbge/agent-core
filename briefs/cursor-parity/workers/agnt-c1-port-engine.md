# AGNT — Port engine + status/sync wire (Unit C1)

> From: orch-c1-port-engine, 2026-08-12. Binding.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/agnt-c1-port-engine.done`.
> You are a coder AGNT. You do NOT commit. You do NOT edit `~/.agent-core/registry`. Report findings to the board; ORCH integrates, syncs, and commits.

## Mission

Land the port-engine pipeline in the agent-core CLI submodule so status/sync checksum **transformed** bytes and treat symlink destinations as stale.

## Pre-verified facts (ORCH this session)

- Submodule HEAD: `3cc7943` (`fix(cli): zig 0.16 allocator idiom`). Zig 0.16.0.
- Sources: `cli/src/{main,registry,status,sync,inline,checksum,io_ctx}.zig`. House idiom: `std.process.Init`, `init.arena.allocator()`, status/sync/inline use `reg.allocator()`.
- `io_ctx.zig` already has `readFileAbs`, `writeFileAbs`, `copyFileAbsolute`, `createDirPath`.
- Sync today: checksums raw source vs dest, then `io_ctx.copyFileAbsolute(prim.source, dest)` — **unsafe for symlinks** (would write through into the store). Must unlink/replace symlink first.
- Status today: same raw-source checksum compare; no symlink detection.
- Registry grammar already supports `skills` / `skill_format` / `commands` — **do not change registry.zig parser** unless you discover a real gap; post the gap to the board instead of inventing fields.
- Cursor skills dir has 7 live symlinks: herdr, super-search, navigating-big-files, slim, latch, vein, assay → `~/agent-core/primitives/skills/...`.
- Operator ruling (2026-08-12): no symlinks/deploy_link; CLI copies AND ports; drift = status checksums.

## Tasks

1. **Add `cli/src/port.zig`** — pure transform:
   ```zig
   /// port(allocator, prim_type, harness, src_bytes) -> owned dest_bytes
   pub fn port(allocator: std.mem.Allocator, prim_type: []const u8, harness: []const u8, src: []const u8) ![]u8
   ```
   v1: **identity** for all types/harnesses (return `try allocator.dupe(u8, src)`). Document that C2/C3 will add real transforms. Include a small `test` that identity round-trips.

2. **Wire into `status.zig` and `sync.zig`:**
   - After reading source, `const dest_bytes = try port.port(reg.allocator(), prim_type, dep.harness, src_contents)`.
   - Checksum **dest_bytes** (not raw source) and compare to dest file digest.
   - Inline-agents rule path can keep using raw `src_contents` for section compare (no port yet) — or port then compare; either is fine for v1 identity.
   - Sync: write **ported bytes** via `io_ctx.writeFileAbs(dest, dest_bytes)`, NOT `copyFileAbsolute` from source (so future non-identity transforms work).

3. **De-symlink rule:**
   - Add `io_ctx.isSymlinkAbsolute(path) bool` (use Zig 0.16 `std.fs.readLinkAbsolute` / equivalent — if not a symlink, return false; do not follow).
   - Add `io_ctx.removeAbsolute(path)` (or unlink) so sync can replace a symlink with a regular file without writing through.
   - **status:** if dest exists and is a symlink → report stale with the word `symlink` visible on the line (e.g. `✗ cursor … symlink`); count as stale.
   - **sync:** if dest is a symlink OR digest mismatch → remove dest (if present), ensure parent dir, write ported bytes. Dry-run must still report would-sync for symlinks.

4. **Build:** `cd /Users/jrg/agent-core/cli && zig build` must exit 0. Prefer also `zig build test` if your port test is wired (exe_tests via main module imports).

## File partition (STRICT)

- You MAY edit: `cli/src/port.zig` (new), `cli/src/status.zig`, `cli/src/sync.zig`, `cli/src/io_ctx.zig` only.
- You MUST NOT edit: `registry.zig`, `main.zig`, `build.zig`, `~/.agent-core/registry`, `primitives/`, outer repo, harness config trees, any commit.

## Done-when

1. `zig build` exit 0 from `cli/`.
2. Port pipeline + transformed-byte checksums + symlink-is-stale + sync replaces symlinks with written bytes — all in the files above.
3. Board finding posted to `agent-core/cursor-parity` summarizing what landed (paths + any API choices for symlink detect).
4. Final action: `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/agnt-c1-port-engine.done`.

## Report-back

Board finding from `agnt-c1-port-engine` → orch-c1-port-engine. No commit. Questions up the board to orch-c1-port-engine, never operator.
