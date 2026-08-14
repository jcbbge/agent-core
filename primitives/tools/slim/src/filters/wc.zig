const std = @import("std");
const common = @import("common.zig");
const Allocator = std.mem.Allocator;

const CountMode = struct {
    lines: bool = false,
    words: bool = false,
    bytes: bool = false,
    chars: bool = false,
};

fn detectMode(argv: []const []const u8) CountMode {
    var mode = CountMode{};
    var any = false;
    for (argv) |arg| {
        if (arg.len > 0 and arg[0] == '-') {
            for (arg[1..]) |c| {
                switch (c) {
                    'l' => {
                        mode.lines = true;
                        any = true;
                    },
                    'w' => {
                        mode.words = true;
                        any = true;
                    },
                    'c' => {
                        mode.bytes = true;
                        any = true;
                    },
                    'm' => {
                        mode.chars = true;
                        any = true;
                    },
                    else => {},
                }
            }
        }
    }
    if (!any) {
        mode.lines = true;
        mode.words = true;
        mode.bytes = true;
    }
    return mode;
}

const ParsedLine = struct {
    nums: []const []const u8,
    path: ?[]const u8,
};

fn parseLine(allocator: Allocator, line: []const u8) !ParsedLine {
    var nums = std.array_list.Managed([]const u8).init(allocator);
    errdefer nums.deinit();

    var i: usize = 0;
    while (i < line.len and line[i] == ' ') : (i += 1) {}
    while (i < line.len) {
        const start = i;
        while (i < line.len and line[i] != ' ') : (i += 1) {}
        const tok = line[start..i];
        _ = std.fmt.parseInt(u64, tok, 10) catch {
            const path = std.mem.trim(u8, line[start..], &[_]u8{' ', '\t'});
            return .{ .nums = try nums.toOwnedSlice(), .path = if (path.len > 0) path else null };
        };
        try nums.append(tok);
        while (i < line.len and line[i] == ' ') : (i += 1) {}
    }
    return .{ .nums = try nums.toOwnedSlice(), .path = null };
}

fn commonPrefix(paths: []const []const u8) ?[]const u8 {
    if (paths.len == 0) return null;
    var prefix = paths[0];
    for (paths[1..]) |p| {
        var len: usize = 0;
        while (len < prefix.len and len < p.len and prefix[len] == p[len]) : (len += 1) {}
        prefix = prefix[0..len];
        while (prefix.len > 0 and prefix[prefix.len - 1] != '/') {
            prefix = prefix[0 .. prefix.len - 1];
        }
        if (prefix.len == 0) return null;
    }
    return prefix;
}

fn activeCount(mode: CountMode) usize {
    return @intFromBool(mode.lines) + @intFromBool(mode.words) + @intFromBool(mode.bytes) + @intFromBool(mode.chars);
}

fn pickNums(mode: CountMode, nums: []const []const u8) ![]const u8 {
    if (activeCount(mode) == 1) {
        if (mode.lines and nums.len > 0) return nums[0];
        if (mode.words and nums.len > 1) return nums[1];
        if ((mode.bytes or mode.chars) and nums.len > 2) return nums[2];
        if (nums.len > 0) return nums[0];
        return error.ParseFailed;
    }
    var out = std.array_list.Managed(u8).init(std.heap.page_allocator);
    defer out.deinit();
    var first = true;
    if (mode.lines and nums.len > 0) {
        try out.appendSlice(nums[0]);
        first = false;
    }
    if (mode.words and nums.len > 1) {
        if (!first) try out.append(' ');
        try out.appendSlice(nums[1]);
        first = false;
    }
    if ((mode.bytes or mode.chars) and nums.len > 2) {
        if (!first) try out.append(' ');
        try out.appendSlice(nums[2]);
    }
    return try out.toOwnedSlice();
}

pub fn filter(allocator: Allocator, argv: []const []const u8, raw: []const u8) ![]u8 {
    const mode = detectMode(argv);
    const lines = try common.splitLines(allocator, raw);
    defer allocator.free(lines);
    if (lines.len == 0) return error.ParseFailed;

    var parsed = std.array_list.Managed(ParsedLine).init(allocator);
    defer {
        for (parsed.items) |p| allocator.free(p.nums);
        parsed.deinit();
    }

    for (lines) |line| {
        if (line.len == 0) continue;
        const p = try parseLine(allocator, line);
        try parsed.append(p);
    }
    if (parsed.items.len == 0) return error.ParseFailed;

    const last = parsed.items[parsed.items.len - 1];
    const has_total = last.path != null and std.mem.eql(u8, last.path.?, "total");
    const file_count = if (has_total) parsed.items.len - 1 else parsed.items.len;

    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();

    if (file_count == 1 and !has_total) {
        const rendered = try pickNums(mode, parsed.items[0].nums);
        defer if (activeCount(mode) != 1) allocator.free(rendered);
        try out.appendSlice(rendered);
        try out.append('\n');
        return out.toOwnedSlice();
    }

    var paths = std.array_list.Managed([]const u8).init(allocator);
    defer paths.deinit();
    for (parsed.items[0..file_count]) |item| {
        if (item.path) |p| try paths.append(p);
    }
    const prefix = if (paths.items.len > 1) commonPrefix(paths.items) else null;

    for (parsed.items[0..file_count]) |item| {
        const rendered = try pickNums(mode, item.nums);
        defer if (activeCount(mode) != 1) allocator.free(rendered);
        try out.appendSlice(rendered);
        if (item.path) |p| {
            try out.append(' ');
            const short = if (prefix) |pre| (if (p.len > pre.len) p[pre.len..] else p) else p;
            try out.appendSlice(short);
        }
        try out.append('\n');
    }

    if (has_total) {
        const rendered = try pickNums(mode, last.nums);
        defer if (activeCount(mode) != 1) allocator.free(rendered);
        try out.appendSlice("\xE2\x88\x91 ");
        try out.appendSlice(rendered);
        try out.append('\n');
    }

    return out.toOwnedSlice();
}
