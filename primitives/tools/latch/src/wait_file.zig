const std = @import("std");
const c = std.c;
const common = @import("common");
const kq = @import("kqueue_util");

pub const FileResult = struct {
    outcome: common.Outcome,
    path: []const u8,
    elapsed_ms: u64,
};

pub const Options = struct {
    path: []const u8,
    timeout_ms: u64,
};

pub fn waitFile(allocator: std.mem.Allocator, io: std.Io, opts: Options) !FileResult {
    const abs_path = try common.resolveInputPath(allocator, opts.path);
    defer allocator.free(abs_path);

    const clock: std.Io.Clock = .awake;
    const started = std.Io.Clock.Timestamp.now(io, clock);
    const deadline = started.addDuration(.{
        .raw = std.Io.Duration.fromMilliseconds(@intCast(opts.timeout_ms)),
        .clock = clock,
    });

    var observed_exists = common.pathExists(abs_path);

    if (observed_exists) {
        return FileResult{
            .outcome = .matched,
            .path = abs_path,
            .elapsed_ms = common.elapsedMs(started, io),
        };
    }

    const kqueue_fd = try kq.openKqueue();
    defer _ = c.close(kqueue_fd);

    var watch_fd: ?std.posix.fd_t = null;
    var watch_parent = false;
    var parent_path: ?[]const u8 = null;
    defer {
        if (watch_fd) |fd| _ = c.close(fd);
        if (parent_path) |p| allocator.free(p);
    }

    try setupWatch(allocator, abs_path, kqueue_fd, &watch_fd, &watch_parent, &parent_path);

    while (true) {
        const remain = common.remainMs(deadline, io, clock);
        if (remain == 0) {
            return FileResult{
                .outcome = .timeout,
                .path = abs_path,
                .elapsed_ms = common.elapsedMs(started, io),
            };
        }

        if (common.pathExists(abs_path)) {
            if (!observed_exists) {
                return FileResult{
                    .outcome = .matched,
                    .path = abs_path,
                    .elapsed_ms = common.elapsedMs(started, io),
                };
            }
        }

        const poll_ms = @min(remain, 200);
        const event_opt = try kq.waitOnce(kqueue_fd, poll_ms);
        if (event_opt == null) continue;

        const event = event_opt.?;

        if (event.fflags & kq.NOTE_DELETE != 0 or event.fflags & kq.NOTE_REVOKE != 0) {
            if (observed_exists and !common.pathExists(abs_path)) {
                return FileResult{
                    .outcome = .vanished,
                    .path = abs_path,
                    .elapsed_ms = common.elapsedMs(started, io),
                };
            }
        }

        if (watch_parent) {
            if (common.pathExists(abs_path)) {
                return FileResult{
                    .outcome = .matched,
                    .path = abs_path,
                    .elapsed_ms = common.elapsedMs(started, io),
                };
            }
        } else {
            if (common.pathExists(abs_path)) {
                observed_exists = true;
                if (event.fflags & (kq.NOTE_WRITE | kq.NOTE_EXTEND | kq.NOTE_ATTRIB | kq.NOTE_RENAME) != 0) {
                    return FileResult{
                        .outcome = .matched,
                        .path = abs_path,
                        .elapsed_ms = common.elapsedMs(started, io),
                    };
                }
            } else if (observed_exists) {
                return FileResult{
                    .outcome = .vanished,
                    .path = abs_path,
                    .elapsed_ms = common.elapsedMs(started, io),
                };
            }
        }
    }
}

fn openEvtOnly(allocator: std.mem.Allocator, path: []const u8) !std.posix.fd_t {
    const path_z = try std.fmt.allocPrintSentinel(allocator, "{s}", .{path}, 0);
    defer allocator.free(path_z);
    const fd = c.open(path_z.ptr, kq.evtOnlyOpenFlags(), @as(c.mode_t, 0));
    if (fd < 0) return error.AccessDenied;
    return fd;
}

fn setupWatch(
    allocator: std.mem.Allocator,
    abs_path: []const u8,
    kqueue_fd: c_int,
    watch_fd: *?std.posix.fd_t,
    watch_parent: *bool,
    parent_path: *?[]const u8,
) !void {
    if (watch_fd.*) |fd| _ = c.close(fd);
    watch_fd.* = null;
    if (parent_path.*) |p| allocator.free(p);
    parent_path.* = null;

    if (common.pathExists(abs_path)) {
        const fd = try openEvtOnly(allocator, abs_path);
        watch_fd.* = fd;
        watch_parent.* = false;
        try kq.registerVnode(
            kqueue_fd,
            fd,
            kq.NOTE_WRITE | kq.NOTE_EXTEND | kq.NOTE_ATTRIB | kq.NOTE_DELETE | kq.NOTE_RENAME | kq.NOTE_REVOKE,
        );
        return;
    }

    const parent = std.fs.path.dirname(abs_path) orelse return error.AccessDenied;
    const parent_abs = try common.realpathAlloc(allocator, parent);
    parent_path.* = parent_abs;

    const fd = try openEvtOnly(allocator, parent_abs);
    watch_fd.* = fd;
    watch_parent.* = true;
    try kq.registerVnode(
        kqueue_fd,
        fd,
        kq.NOTE_WRITE | kq.NOTE_LINK | kq.NOTE_RENAME | kq.NOTE_ATTRIB,
    );
}

pub fn formatResult(allocator: std.mem.Allocator, result: FileResult) ![]const u8 {
    return switch (result.outcome) {
        .matched => try std.fmt.allocPrint(
            allocator,
            "latch: file {s} ready ({d}ms)\n",
            .{ result.path, result.elapsed_ms },
        ),
        .timeout => try std.fmt.allocPrint(allocator, "latch: timeout\n", .{}),
        .vanished => try std.fmt.allocPrint(
            allocator,
            "latch: file {s} vanished\n",
            .{result.path},
        ),
    };
}
