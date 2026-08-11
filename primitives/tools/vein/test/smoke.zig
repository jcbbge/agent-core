const std = @import("std");
const vein = @import("../src/lib.zig");

test "Row type exists with expected field count via csv" {
    try std.testing.expectEqual(@as(usize, 29), vein.csv.field_names.len);
}

test "unknown literal is UNKNOWN" {
    try std.testing.expectEqualStrings("UNKNOWN", vein.schema.unknownLiteral());
}
