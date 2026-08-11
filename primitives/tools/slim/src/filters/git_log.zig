const std = @import("std");
const common = @import("common.zig");
const rules = @import("../rules.zig");
const Allocator = std.mem.Allocator;

fn dropBodyLine(line: []const u8) bool {
    const trimmed = std.mem.trim(u8, line, &[_]u8{' ', '\t'});
    if (trimmed.len == 0) return true;
    if (std.mem.startsWith(u8, trimmed, "Signed-off-by:")) return true;
    if (std.mem.startsWith(u8, trimmed, "Co-authored-by:")) return true;
    return false;
}

pub fn filter(allocator: Allocator, raw: []const u8, body_width: usize) ![]u8 {
    var blocks = std.array_list.Managed([]const u8).init(allocator);
    defer blocks.deinit();

    var iter = std.mem.splitSequence(u8, raw, rules.git_log_end_marker);
    while (iter.next()) |block| {
        const trimmed = std.mem.trim(u8, block, &[_]u8{ '\n', '\r' });
        if (trimmed.len == 0) continue;
        try blocks.append(trimmed);
    }

    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();

    for (blocks.items, 0..) |block, bi| {
        const lines = try common.splitLines(allocator, block);
        defer allocator.free(lines);
        if (lines.len == 0) continue;

        try out.appendSlice(lines[0]);
        try out.append('\n');

        var body_lines = std.array_list.Managed([]const u8).init(allocator);
        defer body_lines.deinit();
        for (lines[1..]) |line| {
            if (!dropBodyLine(line)) try body_lines.append(line);
        }

        const show = @min(body_lines.items.len, rules.git_log_body_lines);
        var i: usize = 0;
        while (i < show) : (i += 1) {
            const truncated = try common.truncateWidth(allocator, body_lines.items[i], body_width);
            defer allocator.free(truncated);
            try out.appendSlice("  ");
            try out.appendSlice(truncated);
            try out.append('\n');
        }

        if (body_lines.items.len > rules.git_log_body_lines) {
            const omitted = body_lines.items.len - rules.git_log_body_lines;
            var line_buf: [64]u8 = undefined;
            const line = try std.fmt.bufPrint(&line_buf, "  [+{d} lines omitted]\n", .{omitted});
            try out.appendSlice(line);
        }

        _ = bi;
    }

    return out.toOwnedSlice();
}

pub fn hasExplicitCount(argv: []const []const u8) bool {
    return parseCount(argv) != null;
}

pub fn parseCount(argv: []const []const u8) ?usize {
    var i: usize = 0;
    while (i < argv.len) : (i += 1) {
        const arg = argv[i];
        if (std.mem.eql(u8, arg, "--")) return null;
        if (arg.len >= 2 and arg[0] == '-' and std.ascii.isDigit(arg[1])) {
            return std.fmt.parseInt(usize, arg[1..], 10) catch null;
        }
        if (std.mem.eql(u8, arg, "-n") and i + 1 < argv.len) {
            return std.fmt.parseInt(usize, argv[i + 1], 10) catch null;
        }
        if (std.mem.startsWith(u8, arg, "--max-count=")) {
            return std.fmt.parseInt(usize, arg["--max-count=".len..], 10) catch null;
        }
    }
    return null;
}

pub fn hasMachineFormat(argv: []const []const u8) bool {
    for (argv) |arg| {
        for (rules.blocked_git_flags) |flag| {
            if (std.mem.eql(u8, arg, flag) or std.mem.startsWith(u8, arg, flag)) return true;
        }
        if (std.mem.startsWith(u8, arg, "--pretty=")) return true;
        if (std.mem.startsWith(u8, arg, "--format=")) return true;
    }
    return false;
}

pub fn bodyWidth(argv: []const []const u8) usize {
    if (parseCount(argv) != null) return rules.git_log_explicit_body_width;
    return rules.git_log_default_body_width;
}
