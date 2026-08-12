const std = @import("std");
const duration = @import("duration");
const common = @import("common");
const c = std.c;

pub const WaitError = error{
    SocketConnect,
    SocketWrite,
    SocketRead,
    InvalidResponse,
    PaneVanished,
};

pub const Outcome = common.Outcome;

pub const WaitResult = struct {
    outcome: Outcome,
    pane_id: []const u8,
    status: []const u8,
    elapsed_ms: u64,
};

pub const Options = struct {
    pane_id: []const u8,
    /// Empty slice: match idle or done.
    until: []const []const u8,
    timeout_ms: u64,
    socket_path: []const u8,
};

pub fn statusMatches(until: []const []const u8, status: []const u8) bool {
    if (until.len == 0) {
        return std.mem.eql(u8, status, "idle") or std.mem.eql(u8, status, "done");
    }
    for (until) |wanted| {
        if (std.mem.eql(u8, wanted, status)) return true;
    }
    return false;
}

pub fn wait(_: std.mem.Allocator, io: std.Io, opts: Options) WaitError!WaitResult {
    const clock: std.Io.Clock = .awake;
    const started = std.Io.Clock.Timestamp.now(io, clock);
    const timeout_duration = std.Io.Clock.Duration{
        .raw = std.Io.Duration.fromMilliseconds(@intCast(opts.timeout_ms)),
        .clock = clock,
    };
    const deadline = started.addDuration(timeout_duration);

    const current = paneGetStatus(io, opts.socket_path, opts.pane_id) catch |err| switch (err) {
        error.PaneVanished => return WaitResult{
            .outcome = .vanished,
            .pane_id = opts.pane_id,
            .status = "",
            .elapsed_ms = elapsedMs(started, io),
        },
        else => return err,
    };
    if (statusMatches(opts.until, current)) {
        return WaitResult{
            .outcome = .matched,
            .pane_id = opts.pane_id,
            .status = current,
            .elapsed_ms = elapsedMs(started, io),
        };
    }

    const unix_addr = std.Io.net.UnixAddress.init(opts.socket_path) catch return error.SocketConnect;
    var stream = unix_addr.connect(io) catch return error.SocketConnect;
    defer stream.close(io);

    var subscribe_buf: [512]u8 = undefined;
    const subscribe = std.fmt.bufPrint(
        &subscribe_buf,
        "{{\"id\":\"latch1\",\"method\":\"events.subscribe\",\"params\":{{\"subscriptions\":[{{\"type\":\"pane.agent_status_changed\",\"pane_id\":\"{s}\"}},{{\"type\":\"pane.closed\"}}]}}}}",
        .{opts.pane_id},
    ) catch return error.SocketWrite;

    var w_buf: [4096]u8 = undefined;
    var net_writer = stream.writer(io, &w_buf);
    net_writer.interface.writeAll(subscribe) catch return error.SocketWrite;
    net_writer.interface.writeAll("\n") catch return error.SocketWrite;
    net_writer.interface.flush() catch return error.SocketWrite;

    var r_buf: [65536]u8 = undefined;
    var net_reader = stream.reader(io, &r_buf);
    const reader = &net_reader.interface;

    const ack = try readLineWithDeadline(io, reader, stream, deadline, clock) orelse {
        return WaitResult{
            .outcome = .timeout,
            .pane_id = opts.pane_id,
            .status = "",
            .elapsed_ms = elapsedMs(started, io),
        };
    };

    if (std.mem.indexOf(u8, ack, "\"error\"") != null) {
        return WaitResult{
            .outcome = .vanished,
            .pane_id = opts.pane_id,
            .status = "",
            .elapsed_ms = elapsedMs(started, io),
        };
    }
    if (std.mem.indexOf(u8, ack, "subscription_started") == null) {
        return error.InvalidResponse;
    }

    while (true) {
        const now = std.Io.Clock.Timestamp.now(io, clock);
        if (std.Io.Clock.Timestamp.compare(now, .gte, deadline)) {
            return WaitResult{
                .outcome = .timeout,
                .pane_id = opts.pane_id,
                .status = "",
                .elapsed_ms = elapsedMs(started, io),
            };
        }

        const event = try readLineWithDeadline(io, reader, stream, deadline, clock) orelse {
            return WaitResult{
                .outcome = .timeout,
                .pane_id = opts.pane_id,
                .status = "",
                .elapsed_ms = elapsedMs(started, io),
            };
        };

        if (isPaneClosed(event, opts.pane_id)) {
            return WaitResult{
                .outcome = .vanished,
                .pane_id = opts.pane_id,
                .status = "",
                .elapsed_ms = elapsedMs(started, io),
            };
        }

        const status = extractAgentStatus(event) orelse continue;
        const event_pane = extractPaneId(event) orelse continue;
        if (!std.mem.eql(u8, event_pane, opts.pane_id)) continue;

        if (statusMatches(opts.until, status)) {
            return WaitResult{
                .outcome = .matched,
                .pane_id = opts.pane_id,
                .status = status,
                .elapsed_ms = elapsedMs(started, io),
            };
        }
    }
}

fn paneGetStatus(io: std.Io, socket_path: []const u8, pane_id: []const u8) WaitError![]const u8 {
    const unix_addr = std.Io.net.UnixAddress.init(socket_path) catch return error.SocketConnect;
    var stream = unix_addr.connect(io) catch return error.SocketConnect;
    defer stream.close(io);

    var req_buf: [256]u8 = undefined;
    const request = std.fmt.bufPrint(
        &req_buf,
        "{{\"id\":\"latch-get\",\"method\":\"pane.get\",\"params\":{{\"pane_id\":\"{s}\"}}}}",
        .{pane_id},
    ) catch return error.SocketWrite;

    var w_buf: [4096]u8 = undefined;
    var net_writer = stream.writer(io, &w_buf);
    net_writer.interface.writeAll(request) catch return error.SocketWrite;
    net_writer.interface.writeAll("\n") catch return error.SocketWrite;
    net_writer.interface.flush() catch return error.SocketWrite;

    var r_buf: [65536]u8 = undefined;
    var net_reader = stream.reader(io, &r_buf);
    const line = net_reader.interface.takeDelimiter('\n') catch {
        return error.InvalidResponse;
    } orelse return error.InvalidResponse;

    if (std.mem.indexOf(u8, line, "\"error\"") != null) return error.PaneVanished;
    const status = extractAgentStatus(line) orelse return error.InvalidResponse;
    return status;
}


fn readLineWithDeadline(
    io: std.Io,
    reader: *std.Io.Reader,
    stream: std.Io.net.Stream,
    deadline: std.Io.Clock.Timestamp,
    clock: std.Io.Clock,
) WaitError!?[]const u8 {
    const remain = remainPollMs(deadline, io, clock);
    if (remain == 0) return null;

    const ready = pollReadable(stream.socket.handle, remain) catch return error.SocketRead;
    if (!ready) return null;

    return reader.takeDelimiter('\n') catch |err| switch (err) {
        error.ReadFailed => return error.SocketRead,
        error.StreamTooLong => return error.InvalidResponse,
    };
}

fn remainPollMs(deadline: std.Io.Clock.Timestamp, io: std.Io, clock: std.Io.Clock) c_int {
    const now = std.Io.Clock.Timestamp.now(io, clock);
    if (std.Io.Clock.Timestamp.compare(now, .gte, deadline)) return 0;
    const dur = now.durationTo(deadline);
    const ms = dur.raw.toMilliseconds();
    return @intCast(@min(@max(ms, 0), std.math.maxInt(c_int)));
}

fn pollReadable(fd: std.posix.fd_t, timeout_ms: c_int) !bool {
    var pfds = [_]c.pollfd{.{
        .fd = fd,
        .events = c.POLL.IN,
        .revents = 0,
    }};
    const rc = c.poll(&pfds, 1, timeout_ms);
    if (rc < 0) return error.SocketRead;
    if (rc == 0) return false;
    return (pfds[0].revents & c.POLL.IN) != 0;
}

fn elapsedMs(started: std.Io.Clock.Timestamp, io: std.Io) u64 {
    const dur = started.untilNow(io);
    const ms = dur.raw.toMilliseconds();
    return if (ms > 0) @intCast(ms) else 0;
}

fn isPaneClosedEvent(event: []const u8) bool {
    const dotted = [_][]const u8{
        "\"event\":\"pane.closed\"",
        "\"event\": \"pane.closed\"",
    };
    for (dotted) |needle| {
        if (std.mem.indexOf(u8, event, needle) != null) return true;
    }
    const underscored = [_][]const u8{
        "\"event\":\"pane_closed\"",
        "\"event\": \"pane_closed\"",
    };
    for (underscored) |needle| {
        if (std.mem.indexOf(u8, event, needle) != null) return true;
    }
    return false;
}

pub fn isPaneClosed(event: []const u8, pane_id: []const u8) bool {
    if (!isPaneClosedEvent(event)) return false;
    const pid = extractPaneId(event) orelse return false;
    return std.mem.eql(u8, pid, pane_id);
}

pub fn extractAgentStatus(event: []const u8) ?[]const u8 {
    return extractQuotedField(event, "agent_status");
}

pub fn extractPaneId(event: []const u8) ?[]const u8 {
    return extractQuotedField(event, "pane_id");
}

fn extractQuotedField(json: []const u8, field: []const u8) ?[]const u8 {
    var search_buf: [128]u8 = undefined;
    const needle = std.fmt.bufPrint(&search_buf, "\"{s}\":\"", .{field}) catch return null;
    const start = std.mem.indexOf(u8, json, needle) orelse return null;
    const value_start = start + needle.len;
    const value_end = std.mem.indexOfScalar(u8, json[value_start..], '"') orelse return null;
    return json[value_start .. value_start + value_end];
}

pub fn resolveSocketPath(allocator: std.mem.Allocator, environ: ?*const std.process.Environ.Map) ![]const u8 {
    if (environ) |env| {
        if (env.get("HERDR_SOCKET_PATH")) |path| {
            return try allocator.dupe(u8, path);
        }
        if (env.get("HOME")) |home| {
            return try std.fmt.allocPrint(allocator, "{s}/.config/herdr/herdr.sock", .{home});
        }
    }
    return error.SocketConnect;
}

pub fn formatResult(allocator: std.mem.Allocator, result: WaitResult) ![]const u8 {
    return switch (result.outcome) {
        .matched => try std.fmt.allocPrint(
            allocator,
            "latch: pane {s} -> {s} ({d}ms)\n",
            .{ result.pane_id, result.status, result.elapsed_ms },
        ),
        .timeout => try std.fmt.allocPrint(allocator, "latch: timeout\n", .{}),
        .vanished => try std.fmt.allocPrint(
            allocator,
            "latch: pane {s} vanished\n",
            .{result.pane_id},
        ),
    };
}
