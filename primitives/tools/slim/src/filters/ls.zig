const std = @import("std");
const common = @import("common.zig");
const Allocator = std.mem.Allocator;

const Entry = struct {
    name: []const u8,
    size: u64,
    kind: enum { dir, file, symlink },
    order: usize,
};

pub fn filter(allocator: Allocator, raw: []const u8) ![]u8 {
    const lines = try common.splitLines(allocator, raw);
    defer allocator.free(lines);

    var entries = std.array_list.Managed(Entry).init(allocator);
    defer entries.deinit();

    var order: usize = 0;
    var saw_total = false;
    var data_lines: usize = 0;

    for (lines) |line| {
        if (line.len == 0) continue;
        if (std.mem.startsWith(u8, line, "total ")) {
            saw_total = true;
            continue;
        }

        var fields = std.array_list.Managed([]const u8).init(allocator);
        defer fields.deinit();
        var it = std.mem.tokenizeScalar(u8, line, ' ');
        while (it.next()) |f| try fields.append(f);

        if (fields.items.len < 9) {
            if (!saw_total and data_lines == 0) return allocator.dupe(u8, raw);
            return error.ParseFailed;
        }

        data_lines += 1;
        const perms = fields.items[0];
        const size_str = fields.items[4];
        const size = std.fmt.parseInt(u64, size_str, 10) catch return error.ParseFailed;

        var name_parts = std.array_list.Managed([]const u8).init(allocator);
        defer name_parts.deinit();
        for (fields.items[8..]) |part| try name_parts.append(part);
        const name = try std.mem.join(allocator, " ", name_parts.items);

        if (std.mem.eql(u8, name, ".") or std.mem.eql(u8, name, "..")) {
            allocator.free(name);
            continue;
        }

        const entry: Entry = switch (perms[0]) {
            'd' => .{ .name = name, .size = size, .kind = .dir, .order = order },
            'l' => .{ .name = name, .size = size, .kind = .symlink, .order = order },
            else => .{ .name = name, .size = size, .kind = .file, .order = order },
        };
        try entries.append(entry);
        order += 1;
    }

    if (data_lines == 0) return error.ParseFailed;

    var dirs = std.array_list.Managed(*const Entry).init(allocator);
    defer dirs.deinit();
    var others = std.array_list.Managed(*const Entry).init(allocator);
    defer others.deinit();

    for (entries.items) |*e| {
        if (e.kind == .dir) try dirs.append(e) else try others.append(e);
    }

    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();

    for (dirs.items) |e| {
        try out.appendSlice(e.name);
        try out.append('/');
        try out.append('\n');
    }

    for (others.items) |e| {
        try out.appendSlice(e.name);
        try out.appendSlice("  ");
        const hsize = try common.humanize(allocator, e.size);
        defer allocator.free(hsize);
        try out.appendSlice(hsize);
        try out.append('\n');
    }

    for (entries.items) |e| allocator.free(e.name);

    return out.toOwnedSlice();
}
