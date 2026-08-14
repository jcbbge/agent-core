const std = @import("std");
const c = std.c;
const common = @import("common");
const kq = @import("kqueue_util");

pub const BoardResult = struct {
    outcome: common.Outcome,
    topic: []const u8,
    elapsed_ms: u64,
};

pub const Options = struct {
    topic: []const u8,
    timeout_ms: u64,
    board_path: []const u8,
};

pub fn boardTopicMatches(line: []const u8, topic: []const u8) bool {
    const found = common.extractQuotedField(line, "topic") orelse return false;
    return std.mem.eql(u8, found, topic);
}

pub fn resolveBoardPath(allocator: std.mem.Allocator, environ: ?*const std.process.Environ.Map) ![]const u8 {
    if (environ) |env| {
        if (env.get("TOWER_HOME")) |tower_home| {
            return try std.fmt.allocPrint(allocator, "{s}/board.jsonl", .{tower_home});
        }
        if (env.get("HOME")) |home| {
            return try std.fmt.allocPrint(allocator, "{s}/.tower/board.jsonl", .{home});
        }
    }
    return error.MissingHome;
}

pub fn waitBoard(allocator: std.mem.Allocator, io: std.Io, opts: Options) !BoardResult {
    const clock: std.Io.Clock = .awake;
    const started = std.Io.Clock.Timestamp.now(io, clock);
    const deadline = started.addDuration(.{
        .raw = std.Io.Duration.fromMilliseconds(@intCast(opts.timeout_ms)),
        .clock = clock,
    });

    const subscribe_offset = fileSize(opts.board_path) catch 0;

    if (try scanFromOffset(allocator, opts.board_path, subscribe_offset, opts.topic)) {
        return BoardResult{
            .outcome = .matched,
            .topic = opts.topic,
            .elapsed_ms = common.elapsedMs(started, io),
        };
    }

    const kqueue_fd = try kq.openKqueue();
    defer _ = c.close(kqueue_fd);

    var watch_fd: ?std.posix.fd_t = null;
    defer {
        if (watch_fd) |fd| _ = c.close(fd);
    }

    try ensureBoardOpen(allocator, opts.board_path, &watch_fd);
    try kq.registerVnode(
        kqueue_fd,
        watch_fd.?,
        kq.NOTE_WRITE | kq.NOTE_EXTEND | kq.NOTE_ATTRIB,
    );

    while (true) {
        const remain = common.remainMs(deadline, io, clock);
        if (remain == 0) {
            return BoardResult{
                .outcome = .timeout,
                .topic = opts.topic,
                .elapsed_ms = common.elapsedMs(started, io),
            };
        }

        if (try scanFromOffset(allocator, opts.board_path, subscribe_offset, opts.topic)) {
            return BoardResult{
                .outcome = .matched,
                .topic = opts.topic,
                .elapsed_ms = common.elapsedMs(started, io),
            };
        }

        const poll_ms = @min(remain, 200);
        _ = try kq.waitOnce(kqueue_fd, poll_ms);
    }
}

fn fileSize(path: []const u8) !u64 {
    var path_buf: [std.posix.PATH_MAX]u8 = undefined;
    if (path.len >= path_buf.len) return error.NameTooLong;
    @memcpy(path_buf[0..path.len], path);
    path_buf[path.len] = 0;

    const fd = c.open(path_buf[0..path.len :0].ptr, .{}, @as(c.mode_t, 0));
    if (fd < 0) return error.FileNotFound;
    defer _ = c.close(fd);

    var st: c.Stat = undefined;
    if (c.fstat(fd, &st) != 0) return error.FileNotFound;
    return @intCast(st.size);
}

fn ensureBoardOpen(allocator: std.mem.Allocator, path: []const u8, watch_fd: *?std.posix.fd_t) !void {
    if (watch_fd.*) |fd| _ = c.close(fd);

    const path_z = try std.fmt.allocPrintSentinel(allocator, "{s}", .{path}, 0);
    defer allocator.free(path_z);

    var fd = c.open(path_z.ptr, kq.evtOnlyOpenFlags(), @as(c.mode_t, 0));
    if (fd < 0) {
        fd = c.open(path_z.ptr, kq.evtOnlyCreateFlags(), @as(c.mode_t, 0o644));
        if (fd < 0) return error.AccessDenied;
    }
    watch_fd.* = fd;
}

fn scanFromOffset(allocator: std.mem.Allocator, path: []const u8, offset: u64, topic: []const u8) !bool {
    var path_buf: [std.posix.PATH_MAX]u8 = undefined;
    if (path.len >= path_buf.len) return false;
    @memcpy(path_buf[0..path.len], path);
    path_buf[path.len] = 0;

    const fd = c.open(path_buf[0..path.len :0].ptr, .{}, @as(c.mode_t, 0));
    if (fd < 0) return false;
    defer _ = c.close(fd);

    const len = fileSize(path) catch return false;
    if (offset >= len) return false;

    _ = c.lseek(fd, @intCast(offset), c.SEEK.SET);

    const to_read = len - offset;
    const buf = try allocator.alloc(u8, @intCast(to_read));
    defer allocator.free(buf);

    var total: usize = 0;
    while (total < buf.len) {
        const n = c.read(fd, buf[total..].ptr, buf.len - total);
        if (n <= 0) break;
        total += @intCast(n);
    }

    var start: usize = 0;
    while (start < total) {
        const rest = buf[start..total];
        const nl = std.mem.indexOfScalar(u8, rest, '\n') orelse break;
        const line = rest[0..nl];
        if (line.len > 0 and boardTopicMatches(line, topic)) return true;
        start += nl + 1;
    }
    return false;
}

pub fn formatResult(allocator: std.mem.Allocator, result: BoardResult) ![]const u8 {
    return switch (result.outcome) {
        .matched => try std.fmt.allocPrint(
            allocator,
            "latch: board topic {s} ({d}ms)\n",
            .{ result.topic, result.elapsed_ms },
        ),
        .timeout => try std.fmt.allocPrint(allocator, "latch: timeout\n", .{}),
        .vanished => try std.fmt.allocPrint(allocator, "latch: board vanished\n", .{}),
    };
}
