const std = @import("std");
const Row = @import("lib.zig").Row;
const session = @import("session.zig");
const extract_cc = @import("extract_cc.zig");
const extract_pi = @import("extract_pi.zig");
const io_ctx = @import("io_ctx.zig");

pub const ScanOptions = struct {
    sessions_file: ?[]const u8 = null,
    last_n: ?u32 = null,
    out_path: []const u8 = "commands.csv",
};

pub const ScanSummary = struct {
    cc_calls: usize = 0,
    pi_calls: usize = 0,
    cc_sessions: usize = 0,
    pi_sessions: usize = 0,
    schema_drift: bool = false,
};

pub fn freeRow(allocator: std.mem.Allocator, row: Row) void {
    if (std.mem.eql(u8, row.harness, "pi")) {
        extract_pi.freeRow(allocator, row);
    } else {
        extract_cc.freeRow(allocator, row);
    }
}

pub fn freeRows(allocator: std.mem.Allocator, rows: []Row) void {
    for (rows) |row| freeRow(allocator, row);
    allocator.free(rows);
}

fn extractSession(allocator: std.mem.Allocator, info: session.SessionRef) ![]Row {
    return switch (info.harness) {
        .cc => extract_cc.extractFromTranscript(allocator, info.source_path, info.project_key),
        .pi => extract_pi.extractFromTranscript(allocator, info.source_path, info.project_key),
    };
}

/// Stream JSONL transcripts, dispatch CC vs pi extractors, produce CSV rows.
pub fn run(allocator: std.mem.Allocator, opts: ScanOptions) ![]Row {
    var refs = std.array_list.Managed(session.SessionRef).init(allocator);
    defer {
        for (refs.items) |r| {
            allocator.free(r.session_id);
            allocator.free(r.source_path);
            allocator.free(r.project_key);
        }
        refs.deinit();
    }

    if (opts.sessions_file) |path| {
        const tokens = try session.parseSessionsFile(allocator, path);
        defer {
            for (tokens) |t| allocator.free(t);
            allocator.free(tokens);
        }

        var catalog: ?[]session.SessionRef = null;
        defer if (catalog) |all| {
            for (all) |s| {
                allocator.free(s.session_id);
                allocator.free(s.source_path);
                allocator.free(s.project_key);
            }
            allocator.free(all);
        };

        for (tokens) |token| {
            const info = try session.resolveRefWithCatalog(allocator, token, &catalog);
            try refs.append(info);
        }
    } else if (opts.last_n) |n| {
        const selected = try session.selectLastN(allocator, n);
        try refs.appendSlice(selected);
        allocator.free(selected);
    } else {
        return error.InvalidScanOptions;
    }

    var all = std.array_list.Managed(Row).init(allocator);
    errdefer {
        for (all.items) |row| freeRow(allocator, row);
        all.deinit();
    }

    for (refs.items) |info| {
        const rows = extractSession(allocator, info) catch continue;
        defer {
            for (rows) |row| freeRow(allocator, row);
            allocator.free(rows);
        }
        try all.appendSlice(rows);
    }

    return try all.toOwnedSlice();
}

/// Count extraction results for evidence / diagnostics.
pub fn summarize(allocator: std.mem.Allocator, rows: []const Row) ScanSummary {
    var summary = ScanSummary{};
    var cc_seen = std.StringArrayHashMapUnmanaged(void).empty;
    defer cc_seen.deinit(allocator);
    var pi_seen = std.StringArrayHashMapUnmanaged(void).empty;
    defer pi_seen.deinit(allocator);

    for (rows) |row| {
        if (std.mem.eql(u8, row.harness, "cc")) {
            summary.cc_calls += 1;
            cc_seen.put(allocator, row.session_id, {}) catch {};
        } else if (std.mem.eql(u8, row.harness, "pi")) {
            summary.pi_calls += 1;
            pi_seen.put(allocator, row.session_id, {}) catch {};
        }
    }
    summary.cc_sessions = cc_seen.count();
    summary.pi_sessions = pi_seen.count();
    return summary;
}

test "scan tiny fixture sessions file" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const fixture_dir = "test/fixtures";
    const cc = fixture_dir ++ "/cc-mini.jsonl";
    const pi = fixture_dir ++ "/pi-mini.jsonl";
    const list_path = "/tmp/vein-extract-sessions-fixture.txt";

    const content = try std.fmt.allocPrint(std.testing.allocator, "{s}\n{s}\n", .{ cc, pi });
    defer std.testing.allocator.free(content);
    try io_ctx.writeFileAbs(list_path, content);

    const rows = try run(std.testing.allocator, .{ .sessions_file = list_path });
    defer freeRows(std.testing.allocator, rows);
    const summary = summarize(std.testing.allocator, rows);
    try std.testing.expectEqual(@as(usize, 1), summary.cc_calls);
    try std.testing.expectEqual(@as(usize, 1), summary.pi_calls);
}
