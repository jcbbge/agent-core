const std = @import("std");
const Allocator = std.mem.Allocator;

pub fn stripAnsi(allocator: Allocator, input: []const u8) ![]u8 {
    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();
    var i: usize = 0;
    while (i < input.len) {
        if (input[i] == 0x1b and i + 1 < input.len and input[i + 1] == '[') {
            i += 2;
            while (i < input.len and input[i] != 'm') : (i += 1) {}
            if (i < input.len) i += 1;
            continue;
        }
        try out.append(input[i]);
        i += 1;
    }
    return out.toOwnedSlice();
}

pub fn codepointWidth(text: []const u8) usize {
    var width: usize = 0;
    var i: usize = 0;
    while (i < text.len) {
        const cp_len = std.unicode.utf8CodepointSequenceLength(text[i]) catch break;
        i += cp_len;
        width += 1;
    }
    return width;
}

pub fn truncateWidth(allocator: Allocator, text: []const u8, max_width: usize) ![]u8 {
    if (codepointWidth(text) <= max_width) return allocator.dupe(u8, text);
    const target = if (max_width >= 3) max_width - 3 else max_width;
    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();
    var width: usize = 0;
    var i: usize = 0;
    while (i < text.len and width < target) {
        const cp_len = std.unicode.utf8CodepointSequenceLength(text[i]) catch break;
        try out.appendSlice(text[i .. i + cp_len]);
        i += cp_len;
        width += 1;
    }
    if (max_width >= 3) try out.appendSlice("...");
    return out.toOwnedSlice();
}

pub fn rowCapFilter(
    allocator: Allocator,
    input: []const u8,
    width: usize,
    rows: usize,
) ![]u8 {
    const lines = try splitLines(allocator, input);
    defer allocator.free(lines);

    const total = lines.len;
    const keep = @min(total, rows);
    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();

    var idx: usize = 0;
    while (idx < keep) : (idx += 1) {
        const clean = try stripAnsi(allocator, lines[idx]);
        defer allocator.free(clean);
        const truncated = try truncateWidth(allocator, clean, width);
        defer allocator.free(truncated);
        try out.appendSlice(truncated);
        try out.append('\n');
    }

    if (total > rows) {
        const omitted = total - rows + 1;
        try out.appendSlice("... (");
        var num_buf: [32]u8 = undefined;
        const num = try std.fmt.bufPrint(&num_buf, "{d}", .{omitted});
        try out.appendSlice(num);
        try out.appendSlice(" lines truncated)");
        try out.append('\n');
    }

    return out.toOwnedSlice();
}

fn roundHalfUp1Decimal(value: f64) f64 {
    return @round(value * 10.0) / 10.0;
}

pub fn humanize(allocator: Allocator, size: u64) ![]u8 {
    if (size < 1024) return std.fmt.allocPrint(allocator, "{d}B", .{size});
    if (size < 1024 * 1024) {
        const k = roundHalfUp1Decimal(@as(f64, @floatFromInt(size)) / 1024.0);
        return std.fmt.allocPrint(allocator, "{d:.1}K", .{k});
    }
    if (size < 1024 * 1024 * 1024) {
        const m = roundHalfUp1Decimal(@as(f64, @floatFromInt(size)) / (1024.0 * 1024.0));
        return std.fmt.allocPrint(allocator, "{d:.1}M", .{m});
    }
    const g = roundHalfUp1Decimal(@as(f64, @floatFromInt(size)) / (1024.0 * 1024.0 * 1024.0));
    return std.fmt.allocPrint(allocator, "{d:.1}G", .{g});
}

pub fn splitLines(allocator: Allocator, input: []const u8) ![][]const u8 {
    var lines = std.array_list.Managed([]const u8).init(allocator);
    errdefer lines.deinit();
    var iter = std.mem.splitScalar(u8, input, '\n');
    while (iter.next()) |line| {
        const trimmed = if (line.len > 0 and line[line.len - 1] == '\r')
            line[0 .. line.len - 1]
        else
            line;
        try lines.append(trimmed);
    }
    if (input.len > 0 and input[input.len - 1] == '\n' and lines.items.len > 0) {
        const last = lines.items[lines.items.len - 1];
        if (last.len == 0) _ = lines.pop();
    }
    return lines.toOwnedSlice();
}
