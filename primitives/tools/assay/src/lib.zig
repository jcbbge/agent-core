pub const wake = @import("wake.zig");
pub const match = @import("match.zig");
pub const classify = @import("classify.zig");
pub const aggregate = @import("aggregate.zig");
pub const propose = @import("propose.zig");
pub const belief = @import("belief.zig");
pub const llm = @import("llm.zig");
pub const golden = @import("golden.zig");
pub const pipeline = @import("pipeline.zig");

/// Truth-legal exit codes shared by CLI and library callers.
pub const ExitCode = enum(u8) {
    ok = 0,
    usage = 2,
    io = 3,
    schema_unknown = 4,
    llm_unavailable = 5,
};

const std = @import("std");

test "ExitCode values" {
    try std.testing.expectEqual(@as(u8, 0), @intFromEnum(ExitCode.ok));
    try std.testing.expectEqual(@as(u8, 2), @intFromEnum(ExitCode.usage));
    try std.testing.expectEqual(@as(u8, 3), @intFromEnum(ExitCode.io));
    try std.testing.expectEqual(@as(u8, 4), @intFromEnum(ExitCode.schema_unknown));
    try std.testing.expectEqual(@as(u8, 5), @intFromEnum(ExitCode.llm_unavailable));
}
