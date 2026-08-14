const std = @import("std");
const latch = @import("latch");
const argv = latch.argv;
const duration = latch.duration;
const hold = latch.hold;
const wait = latch.wait;
const wait_board = latch.wait_board;
const wait_file = latch.wait_file;

fn collectArgs(allocator: std.mem.Allocator, init: std.process.Init) ![][]const u8 {
    var list = std.array_list.Managed([]const u8).init(allocator);
    var iter = try std.process.Args.Iterator.initAllocator(init.minimal.args, allocator);
    defer iter.deinit();
    while (iter.next()) |arg| {
        try list.append(try allocator.dupe(u8, arg));
    }
    return try list.toOwnedSlice();
}

pub fn main(init: std.process.Init) !void {
    const allocator = init.arena.allocator();
    const io = init.io;
    const args = try collectArgs(allocator, init);

    if (args.len < 2) {
        try printHelp(io);
        std.process.exit(2);
    }

    if (isHelpArg(args[1])) {
        try printHelp(io);
        return;
    }

    if (std.mem.eql(u8, args[1], "wait")) {
        try runWait(allocator, io, init, args[2..]);
        return;
    }

    if (std.mem.eql(u8, args[1], "hold")) {
        try runHold(allocator, io, init, args[2..]);
        return;
    }

    try writeAll(io, try std.fmt.allocPrint(allocator, "unknown subcommand: {s}\n", .{args[1]}));
    std.process.exit(2);
}

fn runWait(allocator: std.mem.Allocator, io: std.Io, init: std.process.Init, args: []const []const u8) !void {
    const parsed = argv.parseWaitArgs(args) catch |err| {
        const msg: []const u8 = switch (err) {
            error.InvalidTimeout => "latch: invalid --timeout duration\n",
            error.MultipleTargets => "latch: specify exactly one of --pane, --file, or --board\n",
            error.MissingTarget => argv.waitUsageMessage(),
            error.InvalidGate => argv.waitUsageMessage(),
        };
        try writeAll(io, msg);
        std.process.exit(2);
    };

    switch (parsed.target) {
        .pane => {
            const pane_id = parsed.pane_id orelse {
                try writeAll(io, argv.waitUsageMessage());
                std.process.exit(2);
            };
            const socket_path = wait.resolveSocketPath(allocator, init.environ_map) catch {
                try writeAll(io, "latch: cannot resolve herdr socket path\n");
                std.process.exit(2);
            };
            const result = wait.wait(allocator, io, .{
                .pane_id = pane_id,
                .until = parsed.until[0..parsed.until_count],
                .timeout_ms = parsed.timeout_ms,
                .socket_path = socket_path,
            }) catch {
                try writeAll(io, "latch: socket error\n");
                std.process.exit(2);
            };
            try writeAll(io, try wait.formatResult(allocator, result));
            std.process.exit(outcomeCode(result.outcome));
        },
        .file => {
            const path = parsed.file_path orelse {
                try writeAll(io, argv.waitUsageMessage());
                std.process.exit(2);
            };
            const result = wait_file.waitFile(allocator, io, .{
                .path = path,
                .timeout_ms = parsed.timeout_ms,
            }) catch {
                try writeAll(io, "latch: file error\n");
                std.process.exit(2);
            };
            try writeAll(io, try wait_file.formatResult(allocator, result));
            std.process.exit(outcomeCode(result.outcome));
        },
        .board => {
            const topic = parsed.board_topic orelse {
                try writeAll(io, argv.waitUsageMessage());
                std.process.exit(2);
            };
            const board_path = wait_board.resolveBoardPath(allocator, init.environ_map) catch {
                try writeAll(io, "latch: cannot resolve board path\n");
                std.process.exit(2);
            };
            const result = wait_board.waitBoard(allocator, io, .{
                .topic = topic,
                .timeout_ms = parsed.timeout_ms,
                .board_path = board_path,
            }) catch {
                try writeAll(io, "latch: board error\n");
                std.process.exit(2);
            };
            try writeAll(io, try wait_board.formatResult(allocator, result));
            std.process.exit(outcomeCode(result.outcome));
        },
    }
}

fn runHold(allocator: std.mem.Allocator, io: std.Io, init: std.process.Init, args: []const []const u8) !void {
    const parsed = argv.parseHoldArgs(args) catch |err| {
        const msg: []const u8 = switch (err) {
            error.InvalidTimeout => "latch: invalid --timeout duration\n",
            error.InvalidGate => "latch: invalid gate name\n",
            error.MissingTarget => argv.holdUsageMessage(),
            error.MultipleTargets => argv.holdUsageMessage(),
        };
        try writeAll(io, msg);
        std.process.exit(2);
    };

    if (!hold.isValidGateName(parsed.gate)) {
        try writeAll(io, "latch: invalid gate name\n");
        std.process.exit(2);
    }

    const gates_dir = hold.resolveGatesDir(allocator, init.environ_map) catch {
        try writeAll(io, "latch: cannot resolve gates directory\n");
        std.process.exit(2);
    };

    const result = hold.hold(allocator, io, .{
        .gate = parsed.gate,
        .timeout_ms = parsed.timeout_ms,
        .gates_dir = gates_dir,
    }) catch {
        try writeAll(io, "latch: hold error\n");
        std.process.exit(2);
    };

    try writeAll(io, try hold.formatResult(allocator, result));
    std.process.exit(outcomeCode(result.outcome));
}

fn outcomeCode(outcome: latch.common.Outcome) u8 {
    return switch (outcome) {
        .matched => 0,
        .timeout => 3,
        .vanished => 4,
    };
}

fn isHelpArg(arg: []const u8) bool {
    return std.mem.eql(u8, arg, "--help") or std.mem.eql(u8, arg, "-h") or std.mem.eql(u8, arg, "help");
}

fn writeAll(io: std.Io, bytes: []const u8) !void {
    try std.Io.File.writeStreamingAll(.stdout(), io, bytes);
}

fn printHelp(io: std.Io) !void {
    const help =
        \\latch — blocking wait/hold primitive for herdr, files, Tower, and gates
        \\
        \\usage:
        \\  latch wait --pane <pane-id> [--until <status>]... [--timeout <dur>]
        \\  latch wait --file <path> [--timeout <dur>]
        \\  latch wait --board <topic> [--timeout <dur>]
        \\  latch hold <gate> [--timeout <dur>]
        \\  latch --help
        \\
        \\wait options:
        \\  --pane <pane-id>   herdr pane agent status (default until: idle or done)
        \\  --file <path>      path exists or changes (kqueue EVFILT_VNODE)
        \\  --board <topic>    new Tower board row with topic (append-only tail scan)
        \\  --until <status>   pane only — match one status (repeatable, any-of)
        \\  --timeout <dur>    30s / 10m / 1h (default: 30m)
        \\
        \\hold:
        \\  <gate>             block until ~/.fleet/gates/<gate> is stamped (created/touched)
        \\
        \\exit codes:
        \\  0 event matched · 2 usage/error · 3 timeout · 4 target vanished
        \\
        \\paths:
        \\  herdr socket: $HERDR_SOCKET_PATH or ~/.config/herdr/herdr.sock
        \\  board file:   $TOWER_HOME/board.jsonl or ~/.tower/board.jsonl
        \\  gate stamp:     ~/.fleet/gates/<gate>
        \\
    ;
    try writeAll(io, help);
}
