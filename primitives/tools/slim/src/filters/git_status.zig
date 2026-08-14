const std = @import("std");
const common = @import("common.zig");
const rules = @import("../rules.zig");
const Allocator = std.mem.Allocator;

pub fn filter(allocator: Allocator, raw: []const u8) ![]u8 {
    const lines = try common.splitLines(allocator, raw);
    defer allocator.free(lines);

    var branch_line: ?[]const u8 = null;
    var staged = std.array_list.Managed([]const u8).init(allocator);
    defer {
        for (staged.items) |p| allocator.free(p);
        staged.deinit();
    }
    var modified = std.array_list.Managed([]const u8).init(allocator);
    defer {
        for (modified.items) |p| allocator.free(p);
        modified.deinit();
    }
    var untracked = std.array_list.Managed([]const u8).init(allocator);
    defer {
        for (untracked.items) |p| allocator.free(p);
        untracked.deinit();
    }
    var conflicts = std.array_list.Managed([]const u8).init(allocator);
    defer {
        for (conflicts.items) |p| allocator.free(p);
        conflicts.deinit();
    }

    for (lines) |line| {
        if (line.len == 0) continue;
        if (std.mem.startsWith(u8, line, "##")) {
            const rest = std.mem.trim(u8, line[2..], &[_]u8{' ', '\t'});
            branch_line = try std.fmt.allocPrint(allocator, "* {s}", .{rest});
            continue;
        }
        if (line.len < 3 or line[2] != ' ') return error.ParseFailed;
        const x = line[0];
        const y = line[1];
        const path = try allocator.dupe(u8, std.mem.trim(u8, line[3..], &[_]u8{' ', '\t'}));

        if (x == '?' and y == '?') {
            try untracked.append(path);
            continue;
        }

        const conflict = (x == 'U' or y == 'U' or
            (x == 'D' and y == 'D') or
            (x == 'A' and y == 'A'));
        if (conflict) {
            try conflicts.append(path);
            continue;
        }

        if (isStaged(x, y)) try staged.append(try allocator.dupe(u8, path));
        if (isModified(x, y)) try modified.append(try allocator.dupe(u8, path));
        allocator.free(path);
    }

    if (branch_line == null) return error.ParseFailed;

    defer if (branch_line) |bl| allocator.free(bl);

    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();
    try out.appendSlice(branch_line.?);
    try out.append('\n');

    const has_changes = staged.items.len + modified.items.len + untracked.items.len + conflicts.items.len > 0;

    if (!has_changes) {
        try out.appendSlice(rules.git_status_clean_marker);
        try out.append('\n');
        return out.toOwnedSlice();
    }

    try renderCategory(&out, "+ Staged", staged.items, rules.git_status_max_paths);
    try renderCategory(&out, "~ Modified", modified.items, rules.git_status_max_paths);
    try renderCategory(&out, "? Untracked", untracked.items, rules.git_status_max_paths);
    try renderCategory(&out, "! Conflicts", conflicts.items, rules.git_status_max_paths);

    return out.toOwnedSlice();
}

fn isStaged(x: u8, y: u8) bool {
    if (x == 'U' or y == 'U') return false;
    if ((x == 'D' and y == 'D') or (x == 'A' and y == 'A')) return false;
    return x == 'M' or x == 'A' or x == 'D' or x == 'R' or x == 'C';
}

fn isModified(x: u8, y: u8) bool {
    if (x == 'U' or y == 'U') return false;
    if ((x == 'D' and y == 'D') or (x == 'A' and y == 'A')) return false;
    return y == 'M' or y == 'D';
}

fn renderCategory(out: *std.array_list.Managed(u8), header_prefix: []const u8, paths: []const []const u8, max_paths: usize) !void {
    if (paths.len == 0) return;
    var header_buf: [64]u8 = undefined;
    const header = try std.fmt.bufPrint(&header_buf, "{s}: {d} files\n", .{ header_prefix, paths.len });
    try out.appendSlice(header);
    const show = @min(paths.len, max_paths);
    var i: usize = 0;
    while (i < show) : (i += 1) {
        try out.appendSlice("   ");
        try out.appendSlice(paths[i]);
        try out.append('\n');
    }
    if (paths.len > max_paths) {
        var more_buf: [32]u8 = undefined;
        const more = try std.fmt.bufPrint(&more_buf, "   ... +{d} more\n", .{paths.len - max_paths});
        try out.appendSlice(more);
    }
}
