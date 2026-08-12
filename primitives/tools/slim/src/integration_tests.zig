const std = @import("std");
const psdf = @import("filters/psdf.zig");
const git_log = @import("filters/git_log.zig");

const slim_bin = "zig-out/bin/slim";

fn runCmd(allocator: std.mem.Allocator, argv: []const []const u8) !std.process.RunResult {
    var threaded = std.Io.Threaded.init(allocator, .{});
    defer threaded.deinit();
    return try std.process.run(allocator, threaded.io(), .{ .argv = argv });
}

test "T-EXIT-NONZERO" {
    const alloc = std.testing.allocator;
    const ls = try runCmd(alloc, &.{ "/bin/ls", "/no/such/path" });
    defer alloc.free(ls.stdout);
    defer alloc.free(ls.stderr);
    const slim = try runCmd(alloc, &.{ slim_bin, "ls", "/no/such/path" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    const ls_code: u8 = switch (ls.term) {
        .exited => |c| c,
        else => 1,
    };
    const slim_code: u8 = switch (slim.term) {
        .exited => |c| c,
        else => 1,
    };
    try std.testing.expect(ls_code != 0);
    try std.testing.expectEqual(ls_code, slim_code);
    try std.testing.expect(slim.stderr.len > 0);
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

// T-DIFF-GS/GL/LS removed — rtk oracle gone; git covered by fixture_tests, ls by T-GOLD-LS.

test {
    _ = @import("fixture_tests.zig");
}
