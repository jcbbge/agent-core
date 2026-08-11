pub const schema = @import("schema.zig");
pub const session = @import("session.zig");
pub const scan = @import("scan.zig");
pub const extract_cc = @import("extract_cc.zig");
pub const extract_pi = @import("extract_pi.zig");
pub const classify = @import("classify.zig");
pub const csv = @import("csv.zig");
pub const report = @import("report.zig");
pub const io_ctx = @import("io_ctx.zig");

/// One row of commands.csv — field order matches session-mining-verbs.md Method schema.
pub const Row = struct {
    harness: []const u8,
    batch: []const u8,
    session_id: []const u8,
    cwd: []const u8,
    project_key: []const u8,
    source_path: []const u8,
    call_id: []const u8,
    ordinal: u32,
    command: []const u8,
    command_safe: []const u8,
    command_sha256: []const u8,
    command_norm_sha256: []const u8,
    first_token: []const u8,
    verb: []const u8,
    subcommand: []const u8,
    compound: bool,
    pipe: bool,
    heredoc: bool,
    substitution: bool,
    machine_format: bool,
    result_bytes: ?u64,
    result_lines: ?u32,
    result_nonempty_lines: ?u32,
    result_unique_lines: ?u32,
    result_max_line_bytes: ?u32,
    result_sha256: []const u8,
    exit_code: ?i32,
    is_error: bool,
    result_missing: bool,
};

pub const ExitCode = enum(u8) {
    success = 0,
    usage = 2,
    io = 3,
    schema_unknown = 4,
};

const std = @import("std");

test {
    _ = @import("csv.zig");
    _ = @import("schema.zig");
}

test "csv field count matches Row contract" {
    try std.testing.expectEqual(@as(usize, 29), csv.field_names.len);
}
