const std = @import("std");
const rewrite = @import("rewrite.zig");
const ls = @import("filters/ls.zig");
const psdf = @import("filters/psdf.zig");
const wc = @import("filters/wc.zig");
const git_status = @import("filters/git_status.zig");
const git_log = @import("filters/git_log.zig");
const rules = @import("rules.zig");
const common = @import("filters/common.zig");

const ls_raw = @embedFile("fixtures/ls.raw.txt");
const ls_rtk = @embedFile("fixtures/ls.rtk.txt");
const ps_raw = @embedFile("fixtures/ps.raw.txt");
const ps_rtk = @embedFile("fixtures/ps.rtk.txt");
const df_raw = @embedFile("fixtures/df.raw.txt");
const df_rtk = @embedFile("fixtures/df.rtk.txt");
const wc_raw = @embedFile("fixtures/wc.raw.txt");
const wc_rtk = @embedFile("fixtures/wc.rtk.txt");
const gs_rtk = @embedFile("fixtures/git-status.rtk.txt");

test "T-REW-CONTRACT ls arena" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();
    const alloc = arena.allocator();
    const result = try rewrite.rewrite(alloc, null, "ls");
    try std.testing.expect(result != null);
    try std.testing.expectEqualStrings("slim ls", result.?);
}

test "T-REW-CONTRACT ls bare" {
    const alloc = std.testing.allocator;
    const result = try rewrite.rewrite(alloc, null, "ls");
    defer if (result) |r| alloc.free(r);
    try std.testing.expect(result != null);
    try std.testing.expectEqualStrings("slim ls", result.?);
}

test "T-REW-CONTRACT ls" {
    const alloc = std.testing.allocator;
    const result = try rewrite.rewrite(alloc, null, "ls -la");
    defer if (result) |r| alloc.free(r);
    try std.testing.expect(result != null);
    try std.testing.expectEqualStrings("slim ls -la", result.?);
}

test "T-REW-CONTRACT refuse pipe" {
    const alloc = std.testing.allocator;
    try std.testing.expect((try rewrite.rewrite(alloc, null, "ls | wc -l")) == null);
}

test "T-GOLD-LS" {
    const alloc = std.testing.allocator;
    const got = try ls.filter(alloc, ls_raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(ls_rtk, got);
}

test "T-GOLD-PS" {
    const alloc = std.testing.allocator;
    const got = try psdf.filterPs(alloc, ps_raw, rules.ps_width, rules.ps_rows);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(ps_rtk, got);
}

test "T-GOLD-DF" {
    const alloc = std.testing.allocator;
    const got = try psdf.filterDf(alloc, df_raw, rules.df_width, rules.df_rows);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(df_rtk, got);
}

test "T-GOLD-WC" {
    const alloc = std.testing.allocator;
    const argv = [_][]const u8{ "-l", "PRODUCT.md" };
    const got = try wc.filter(alloc, &argv, wc_raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(wc_rtk, got);
}

test "T-GS-PARSE" {
    const alloc = std.testing.allocator;
    const input = "## main...origin/main [behind 3]\n?? .claude/settings.local.json\n?? .pi/\n?? hubspot-arc/.claude/\n";
    const got = try git_status.filter(alloc, input);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(gs_rtk, got);
}

test "T-TRUTH-RAWPASS" {
    const alloc = std.testing.allocator;
    const raw = "hello\nworld\n";
    const got = ls.filter(alloc, raw) catch try alloc.dupe(u8, raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(raw, got);
}

test "T-TRUTH-RAWPASS-GS" {
    const alloc = std.testing.allocator;
    const raw = "On branch main\nnothing to commit, working tree clean\n";
    const got = git_status.filter(alloc, raw) catch try alloc.dupe(u8, raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(raw, got);
}

// Oracle-authored variant (test-maker): noise input with no porcelain markers.
test "T-TRUTH-RAWPASS-GS-NOISE" {
    const alloc = std.testing.allocator;
    const raw =
        \\not a git status block
        \\random noise without porcelain markers
        \\
    ;
    const got = git_status.filter(alloc, raw) catch try alloc.dupe(u8, raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(raw, got);
}

test "T-UTF8-WIDTH" {
    const alloc = std.testing.allocator;
    const input = "abc🙂defghijklmnopqrstuvwxyz";
    const got = try common.truncateWidth(alloc, input, 10);
    defer alloc.free(got);
    try std.testing.expect(common.codepointWidth(got) <= 10);
}

test "T-NO-VERB" {
    const alloc = std.testing.allocator;
    try std.testing.expect((try rewrite.rewrite(alloc, null, "diff a b")) == null);
}

fn expectRewrite(alloc: std.mem.Allocator, cmd: []const u8, expected: []const u8) !void {
    const result = try rewrite.rewrite(alloc, null, cmd);
    defer if (result) |r| alloc.free(r);
    try std.testing.expect(result != null);
    try std.testing.expectEqualStrings(expected, result.?);
}

fn expectNoRewrite(alloc: std.mem.Allocator, cmd: []const u8) !void {
    try std.testing.expect((try rewrite.rewrite(alloc, null, cmd)) == null);
}

test "T-REW-CONTRACT ps aux" {
    try expectRewrite(std.testing.allocator, "ps aux", "slim ps aux");
}

test "T-REW-CONTRACT wc" {
    try expectRewrite(std.testing.allocator, "wc -l file", "slim wc -l file");
}

test "T-REW-CONTRACT df" {
    try expectRewrite(std.testing.allocator, "df -h", "slim df -h");
}

test "T-REW-CONTRACT git status" {
    try expectRewrite(std.testing.allocator, "git status", "slim git status");
}

test "T-REW-CONTRACT git -C" {
    try expectRewrite(std.testing.allocator, "git -C /tmp status", "slim git -C /tmp status");
}

test "T-REW-CONTRACT git log" {
    try expectRewrite(std.testing.allocator, "git log -5", "slim git log -5");
}

test "T-REW-CONTRACT sudo" {
    try expectRewrite(std.testing.allocator, "sudo ls -la", "sudo slim ls -la");
}

test "T-REW-CONTRACT env assignment" {
    try expectRewrite(std.testing.allocator, "FOO=1 wc -l file", "FOO=1 slim wc -l file");
}

test "T-REW-CONTRACT refuse porcelain" {
    try expectNoRewrite(std.testing.allocator, "git status --porcelain");
}

test "T-REW-CONTRACT refuse format" {
    try expectNoRewrite(std.testing.allocator, "git log --format=%H -1");
}

test "T-REW-CONTRACT refuse compound" {
    try expectNoRewrite(std.testing.allocator, "ps aux && df -h");
}

test "T-REW-CONTRACT refuse cat" {
    try expectNoRewrite(std.testing.allocator, "cat f.txt");
}

test "T-REW-CONTRACT refuse absolute" {
    try expectNoRewrite(std.testing.allocator, "/bin/ls -la /tmp");
}
