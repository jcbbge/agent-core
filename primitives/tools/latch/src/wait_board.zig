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
    db_path: []const u8,
};

const QueryError = error{
    SqliteUnavailable,
    QueryFailed,
};

/// Topics come from the command line and go into SQL. Hex-encoding the bytes
/// and casting back to TEXT leaves no quote to escape and no injection surface.
pub fn sqlTextLiteral(allocator: std.mem.Allocator, s: []const u8) ![]const u8 {
    const digits = "0123456789abcdef";
    const hex = try allocator.alloc(u8, s.len * 2);
    defer allocator.free(hex);
    for (s, 0..) |b, i| {
        hex[i * 2] = digits[b >> 4];
        hex[i * 2 + 1] = digits[b & 0x0f];
    }
    return try std.fmt.allocPrint(allocator, "CAST(x'{s}' AS TEXT)", .{hex});
}

/// $TOWER_DB, else $TOWER_HOME/tower.db, else ~/.tower/tower.db — the same
/// precedence primitives/tower/tower.mjs uses.
pub fn resolveBoardPath(allocator: std.mem.Allocator, environ: ?*const std.process.Environ.Map) ![]const u8 {
    if (environ) |env| {
        if (env.get("TOWER_DB")) |db| {
            return try allocator.dupe(u8, db);
        }
        if (env.get("TOWER_HOME")) |tower_home| {
            return try std.fmt.allocPrint(allocator, "{s}/tower.db", .{tower_home});
        }
        if (env.get("HOME")) |home| {
            return try std.fmt.allocPrint(allocator, "{s}/.tower/tower.db", .{home});
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

    const topic_literal = try sqlTextLiteral(allocator, opts.topic);

    // The byte offset the JSONL board used is a row id here: only messages
    // committed after the wait began may satisfy it.
    const baseline = try baselineMaxId(allocator, io, opts.db_path);

    // One check before blocking, to catch a commit that raced the start.
    var scratch = std.heap.ArenaAllocator.init(allocator);
    defer scratch.deinit();

    if (try matchedSince(scratch.allocator(), io, opts.db_path, baseline, topic_literal)) {
        return BoardResult{
            .outcome = .matched,
            .topic = opts.topic,
            .elapsed_ms = common.elapsedMs(started, io),
        };
    }

    const kqueue_fd = try kq.openKqueue();
    defer _ = c.close(kqueue_fd);

    // The store runs in WAL mode, so a commit can land in tower.db-wal without
    // touching tower.db. Both are watched, both best-effort: the watch is only
    // a latency optimisation and the 200ms poll floor below is what guarantees
    // correctness.
    var watch_fds: [2]?std.posix.fd_t = .{ null, null };
    defer {
        for (watch_fds) |maybe_fd| {
            if (maybe_fd) |fd| _ = c.close(fd);
        }
    }
    watchBestEffort(allocator, kqueue_fd, opts.db_path, &watch_fds[0]);
    const wal_path = try std.fmt.allocPrint(allocator, "{s}-wal", .{opts.db_path});
    watchBestEffort(allocator, kqueue_fd, wal_path, &watch_fds[1]);

    while (true) {
        const remain = common.remainMs(deadline, io, clock);
        if (remain == 0) {
            return BoardResult{
                .outcome = .timeout,
                .topic = opts.topic,
                .elapsed_ms = common.elapsedMs(started, io),
            };
        }

        _ = scratch.reset(.retain_capacity);
        if (try matchedSince(scratch.allocator(), io, opts.db_path, baseline, topic_literal)) {
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

fn baselineMaxId(allocator: std.mem.Allocator, io: std.Io, db_path: []const u8) !i64 {
    // A store that does not exist yet has no rows; everything sent from now on
    // is new. Still prove sqlite3 is reachable, so a missing CLI surfaces as an
    // error now instead of a silent timeout later.
    if (!common.pathExists(db_path)) {
        try probeSqlite(allocator, io);
        return 0;
    }

    const out = runQuery(allocator, io, db_path, "SELECT COALESCE(MAX(id),0) FROM msg;") catch |err| switch (err) {
        error.SqliteUnavailable => return err,
        // File present but no msg table yet (fresh TOWER_HOME): baseline is 0.
        else => return 0,
    };
    return std.fmt.parseInt(i64, out, 10) catch 0;
}

fn matchedSince(
    allocator: std.mem.Allocator,
    io: std.Io,
    db_path: []const u8,
    baseline: i64,
    topic_literal: []const u8,
) !bool {
    if (!common.pathExists(db_path)) return false;

    const sql = try std.fmt.allocPrint(
        allocator,
        "SELECT 1 FROM msg WHERE id > {d} AND topic = {s} LIMIT 1;",
        .{ baseline, topic_literal },
    );

    const out = runQuery(allocator, io, db_path, sql) catch |err| switch (err) {
        error.SqliteUnavailable => return err,
        else => return false,
    };
    return std.mem.eql(u8, out, "1");
}

fn probeSqlite(allocator: std.mem.Allocator, io: std.Io) QueryError!void {
    const result = std.process.run(allocator, io, .{
        .argv = &[_][]const u8{ "sqlite3", "-version" },
    }) catch return error.SqliteUnavailable;
    _ = result;
}

/// Zig has no SQLite driver and needs none: one query per poll through the
/// sqlite3 CLI, spawned with an argv (no shell), keeps this dependency-free.
fn runQuery(allocator: std.mem.Allocator, io: std.Io, db_path: []const u8, sql: []const u8) QueryError![]const u8 {
    const result = std.process.run(allocator, io, .{
        .argv = &[_][]const u8{ "sqlite3", "-batch", "-noheader", db_path, sql },
    }) catch |err| switch (err) {
        error.FileNotFound => return error.SqliteUnavailable,
        else => return error.QueryFailed,
    };

    switch (result.term) {
        .exited => |code| if (code != 0) return error.QueryFailed,
        else => return error.QueryFailed,
    }
    return std.mem.trim(u8, result.stdout, " \t\r\n");
}

fn watchBestEffort(
    allocator: std.mem.Allocator,
    kqueue_fd: c_int,
    path: []const u8,
    slot: *?std.posix.fd_t,
) void {
    const path_z = std.fmt.allocPrintSentinel(allocator, "{s}", .{path}, 0) catch return;
    defer allocator.free(path_z);

    const fd = c.open(path_z.ptr, kq.evtOnlyOpenFlags(), @as(c.mode_t, 0));
    if (fd < 0) return;

    kq.registerVnode(kqueue_fd, fd, kq.NOTE_WRITE | kq.NOTE_EXTEND | kq.NOTE_ATTRIB) catch {
        _ = c.close(fd);
        return;
    };
    slot.* = fd;
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
