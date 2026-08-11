const common = @import("common.zig");
const std = @import("std");
const Allocator = std.mem.Allocator;

pub fn filterPs(allocator: Allocator, raw: []const u8, width: usize, rows: usize) ![]u8 {
    return common.rowCapFilter(allocator, raw, width, rows);
}

pub fn filterDf(allocator: Allocator, raw: []const u8, width: usize, rows: usize) ![]u8 {
    return common.rowCapFilter(allocator, raw, width, rows);
}
