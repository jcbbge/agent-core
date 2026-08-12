const std = @import("std");
const psdf = @import("filters/psdf.zig");
const git_log = @import("filters/git_log.zig");

const slim_bin = "zig-out/bin/slim";
const ls_golden = @embedFile("fixtures/ls-fixture.golden.txt");

fn fixturePath(alloc: std.mem.Allocator, subpath: []const u8) ![]const u8 {
    return std.fs.path.join(alloc, &.{ "test", "fixtures", subpath });
}

fn runCmd(allocator: std.mem.Allocator, argv: []const []const u8) !std.process.RunResult {
    var threaded = std.Io.Threaded.init(allocator, .{});
    defer threaded.deinit();
    return try std.process.run(allocator, threaded.io(), .{ .argv = argv });
}

fn expectExited(result: std.process.RunResult) u8 {
    return switch (result.term) {
        .exited => |c| c,
        else => 1,
    };
}

test "T-EXIT-NONZERO" {
    const alloc = std.testing.allocator;
    const ls = try runCmd(alloc, &.{ "/bin/ls", "/no/such/path" });
    defer alloc.free(ls.stdout);
    defer alloc.free(ls.stderr);
    const slim = try runCmd(alloc, &.{ slim_bin, "ls", "/no/such/path" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    const ls_code = expectExited(ls);
    const slim_code = expectExited(slim);
    try std.testing.expect(ls_code != 0);
    try std.testing.expectEqual(ls_code, slim_code);
    try std.testing.expect(slim.stderr.len > 0);
}

test "T-EXIT-GIT" {
    const alloc = std.testing.allocator;
    const git = try runCmd(alloc, &.{ "/usr/bin/git", "-C", "/no/such/repo", "status" });
    defer alloc.free(git.stdout);
    defer alloc.free(git.stderr);
    const slim = try runCmd(alloc, &.{ slim_bin, "git", "-C", "/no/such/repo", "status" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    const git_code = expectExited(git);
    const slim_code = expectExited(slim);
    try std.testing.expect(git_code != 0);
    try std.testing.expectEqual(git_code, slim_code);
}

test "T-TRUNC-MARK-PS" {
    const alloc = std.testing.allocator;
    var raw = std.array_list.Managed(u8).init(alloc);
    defer raw.deinit();
    var i: usize = 0;
    while (i < 35) : (i += 1) {
        try raw.appendSlice("line\n");
    }
    const got = try psdf.filterPs(alloc, raw.items, 120, 30);
    defer alloc.free(got);
    try std.testing.expect(std.mem.indexOf(u8, got, "... (6 lines truncated)") != null);
}

test "T-TRUNC-MARK-GL" {
    const alloc = std.testing.allocator;
    const input =
        \\abc123 subject (2 days ago) <me>
        \\line1
        \\line2
        \\line3
        \\line4
        \\line5
        \\---END---
        \\
    ;
    const got = try git_log.filter(alloc, input, 80);
    defer alloc.free(got);
    try std.testing.expect(std.mem.indexOf(u8, got, "[+2 lines omitted]") != null);
}

test "T-GL-PARSE" {
    const alloc = std.testing.allocator;
    const input =
        \\abc123 subject (2 days ago) <me>
        \\Signed-off-by: x
        \\visible body
        \\---END---
        \\
    ;
    const got = try git_log.filter(alloc, input, 80);
    defer alloc.free(got);
    try std.testing.expect(std.mem.indexOf(u8, got, "Signed-off-by:") == null);
    try std.testing.expect(std.mem.indexOf(u8, got, "visible body") != null);
}

// T-FIX-GS / T-FIX-GL are owned by the independent oracle suite (fixture_tests.zig),
// which rebuilds the deterministic fixture at test time and judges slim's output
// against intent-derived goldens. Duplicates here were dropped at integration.

test "T-FIX-LS" {
    const alloc = std.testing.allocator;
    const dir = try fixturePath(alloc, "ls-dir");
    defer alloc.free(dir);
    const slim = try runCmd(alloc, &.{ slim_bin, "ls", "-la", dir });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    try std.testing.expectEqual(@as(u8, 0), expectExited(slim));
    try std.testing.expectEqualStrings(ls_golden, slim.stdout);
}

test {
    _ = @import("fixture_tests.zig");
}
