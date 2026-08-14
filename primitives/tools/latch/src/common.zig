const std = @import("std");
const c = std.c;

pub const Outcome = enum {
    matched,
    timeout,
    vanished,
};

pub fn pathExists(path: []const u8) bool {
    var path_buf: [std.posix.PATH_MAX]u8 = undefined;
    if (path.len >= path_buf.len) return false;
    @memcpy(path_buf[0..path.len], path);
    path_buf[path.len] = 0;
    return c.access(path_buf[0..path.len :0].ptr, c.F_OK) == 0;
}

pub fn realpathAlloc(allocator: std.mem.Allocator, path: []const u8) ![]const u8 {
    var path_buf: [std.posix.PATH_MAX]u8 = undefined;
    if (path.len >= path_buf.len) return error.NameTooLong;
    @memcpy(path_buf[0..path.len], path);
    path_buf[path.len] = 0;

    var out_buf: [std.posix.PATH_MAX]u8 = undefined;
    const resolved = c.realpath(path_buf[0..path.len :0].ptr, &out_buf) orelse return error.PathNotFound;
    const len = std.mem.len(resolved);
    return try allocator.dupe(u8, resolved[0..len]);
}

pub fn resolveInputPath(allocator: std.mem.Allocator, path: []const u8) ![]const u8 {
    if (realpathAlloc(allocator, path)) |abs| return abs else |_| {}
    if (std.fs.path.isAbsolute(path)) return try allocator.dupe(u8, path);
    var cwd_buf: [std.posix.PATH_MAX]u8 = undefined;
    const cwd_ptr = c.getcwd(&cwd_buf, cwd_buf.len) orelse return try allocator.dupe(u8, path);
    const cwd = std.mem.sliceTo(cwd_ptr, 0);
    return std.fs.path.join(allocator, &[_][]const u8{ cwd, path });
}

pub fn ensureDir(path: []const u8) !void {
    if (pathExists(path)) return;

    var buf: [std.posix.PATH_MAX]u8 = undefined;
    if (path.len >= buf.len) return error.NameTooLong;

    var i: usize = 1;
    while (i <= path.len) : (i += 1) {
        if (i == path.len or path[i] == '/') {
            @memcpy(buf[0..i], path[0..i]);
            buf[i] = 0;
            if (i > 1) _ = c.mkdir(buf[0..i :0].ptr, 0o755);
        }
    }
    if (!pathExists(path)) return error.PathNotFound;
}

pub fn elapsedMs(started: std.Io.Clock.Timestamp, io: std.Io) u64 {
    const dur = started.untilNow(io);
    const ms = dur.raw.toMilliseconds();
    return if (ms > 0) @intCast(ms) else 0;
}

pub fn timespecFromRemainingMs(remain_ms: u64) c.timespec {
    const sec = @divFloor(remain_ms, 1000);
    const nsec: c_long = @intCast((remain_ms % 1000) * 1_000_000);
    return .{ .sec = @intCast(sec), .nsec = nsec };
}

pub fn remainMs(deadline: std.Io.Clock.Timestamp, io: std.Io, clock: std.Io.Clock) u64 {
    const now = std.Io.Clock.Timestamp.now(io, clock);
    if (std.Io.Clock.Timestamp.compare(now, .gte, deadline)) return 0;
    const dur = now.durationTo(deadline);
    const ms = dur.raw.toMilliseconds();
    return if (ms > 0) @intCast(ms) else 0;
}

pub fn extractQuotedField(json: []const u8, field: []const u8) ?[]const u8 {
    var search_buf: [128]u8 = undefined;
    const needle = std.fmt.bufPrint(&search_buf, "\"{s}\":\"", .{field}) catch return null;
    const start = std.mem.indexOf(u8, json, needle) orelse return null;
    const value_start = start + needle.len;
    const value_end = std.mem.indexOfScalar(u8, json[value_start..], '"') orelse return null;
    return json[value_start .. value_start + value_end];
}
