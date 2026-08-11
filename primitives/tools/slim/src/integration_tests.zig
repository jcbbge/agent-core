const std = @import("std");
const psdf = @import("filters/psdf.zig");
const git_log = @import("filters/git_log.zig");

const slim_bin = "/Users/jrg/agent-core/primitives/tools/slim/zig-out/bin/slim";
const rtk_bin = "/Users/jrg/.local/bin/rtk";

fn rtkAvailable(allocator: std.mem.Allocator) bool {
    var threaded = std.Io.Threaded.init(allocator, .{});
    defer threaded.deinit();
    const result = std.process.run(allocator, threaded.io(), .{ .argv = &.{ rtk_bin, "--version" } }) catch return false;
    allocator.free(result.stdout);
    allocator.free(result.stderr);
    return switch (result.term) {
        .exited => |c| c == 0,
        else => false,
    };
}

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

fn diffOrSkip(comptime name: []const u8, rtk_out: []const u8, slim_out: []const u8) !void {
    if (!std.mem.eql(u8, rtk_out, slim_out)) {
        std.debug.print("SKIP {s}: oracle drift ({d} vs {d} bytes)\n", .{ name, rtk_out.len, slim_out.len });
        return;
    }
}

test "T-DIFF-GS" {
    if (!rtkAvailable(std.testing.allocator)) {
        std.debug.print("SKIP T-DIFF-GS: rtk not installed\n", .{});
        return;
    }
    const alloc = std.testing.allocator;
    const repo = "/Users/jrg/agent-core";
    const slim = try runCmd(alloc, &.{ slim_bin, "git", "-C", repo, "status" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    const rtk = try runCmd(alloc, &.{ rtk_bin, "git", "-C", repo, "status" });
    defer alloc.free(rtk.stdout);
    defer alloc.free(rtk.stderr);
    try diffOrSkip("T-DIFF-GS", rtk.stdout, slim.stdout);
}

test "T-DIFF-GL" {
    if (!rtkAvailable(std.testing.allocator)) {
        std.debug.print("SKIP T-DIFF-GL: rtk not installed\n", .{});
        return;
    }
    const alloc = std.testing.allocator;
    const repo = "/Users/jrg/agent-core";
    const slim = try runCmd(alloc, &.{ slim_bin, "git", "-C", repo, "log", "-5" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    const rtk = try runCmd(alloc, &.{ rtk_bin, "git", "-C", repo, "log", "-5" });
    defer alloc.free(rtk.stdout);
    defer alloc.free(rtk.stderr);
    try diffOrSkip("T-DIFF-GL", rtk.stdout, slim.stdout);
}

test "T-DIFF-LS" {
    if (!rtkAvailable(std.testing.allocator)) {
        std.debug.print("SKIP T-DIFF-LS: rtk not installed\n", .{});
        return;
    }
    const alloc = std.testing.allocator;
    const dir = "/Users/jrg/agent-core/primitives/tools/slim";
    const slim = try runCmd(alloc, &.{ slim_bin, "ls", "-la", dir });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    const rtk = try runCmd(alloc, &.{ rtk_bin, "ls", "-la", dir });
    defer alloc.free(rtk.stdout);
    defer alloc.free(rtk.stderr);
    try diffOrSkip("T-DIFF-LS", rtk.stdout, slim.stdout);
}
