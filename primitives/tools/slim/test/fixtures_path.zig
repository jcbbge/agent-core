const std = @import("std");

pub fn read(comptime name: []const u8) []const u8 {
    return @embedFile("fixtures/" ++ name);
}
