const std = @import("std");
const rewrite = @import("../src/rewrite.zig");
const ls = @import("../src/filters/ls.zig");
const psdf = @import("../src/filters/psdf.zig");
const wc = @import("../src/filters/wc.zig");
const git_status = @import("../src/filters/git_status.zig");
const git_log = @import("../src/filters/git_log.zig");
const rules = @import("../src/rules.zig");
const common = @import("../src/filters/common.zig");

const fixtures = @import("fixtures_path.zig");

fn readFixture(name: []const u8) []const u8 {
    return fixtures.read(name);
}

test "T-REW-CONTRACT ls" {
    const alloc = std.testing.allocator;
    const result = try rewrite.rewrite(alloc, null, "ls -la");
    try std.testing.expect(result != null);
    try std.testing.expectEqualStrings("slim ls -la", result.?);
}

test "T-REW-CONTRACT refuse pipe" {
    const alloc = std.testing.allocator;
    const result = try rewrite.rewrite(alloc, null, "ls | wc -l");
    try std.testing.expect(result == null);
}

test "T-GOLD-LS" {
    const alloc = std.testing.allocator;
    const raw = readFixture("ls.raw.txt");
    const expected = readFixture("ls.rtk.txt");
    const got = try ls.filter(alloc, raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(expected, got);
}

test "T-GOLD-PS" {
    const alloc = std.testing.allocator;
    const raw = readFixture("ps.raw.txt");
    const expected = readFixture("ps.rtk.txt");
    const got = try psdf.filterPs(alloc, raw, rules.ps_width, rules.ps_rows);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(expected, got);
}

test "T-GOLD-DF" {
    const alloc = std.testing.allocator;
    const raw = readFixture("df.raw.txt");
    const expected = readFixture("df.rtk.txt");
    const got = try psdf.filterDf(alloc, raw, rules.df_width, rules.df_rows);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(expected, got);
}

test "T-GOLD-WC" {
    const alloc = std.testing.allocator;
    const raw = readFixture("wc.raw.txt");
    const expected = readFixture("wc.rtk.txt");
    const argv = [_][]const u8{ "-l", "PRODUCT.md" };
    const got = try wc.filter(alloc, &argv, raw);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(expected, got);
}

test "T-GS-PARSE untracked" {
    const alloc = std.testing.allocator;
    const input =
        \\## main...origin/main [behind 3]
        \\?? .claude/settings.local.json
        \\?? .pi/
        \\?? hubspot-arc/.claude/
        \\
    ;
    const expected = readFixture("git-status.rtk.txt");
    const got = try git_status.filter(alloc, input);
    defer alloc.free(got);
    try std.testing.expectEqualStrings(expected, got);
}

test "T-TRUTH-RAWPASS ls non-long" {
    const alloc = std.testing.allocator;
    const raw = "hello\nworld\n";
    const got = ls.filter(alloc, raw) catch try alloc.dupe(u8, raw);
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

test "T-NO-VERB rewrite diff" {
    const alloc = std.testing.allocator;
    const result = try rewrite.rewrite(alloc, null, "diff a b");
    try std.testing.expect(result == null);
}
