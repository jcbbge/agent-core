const std = @import("std");
const duration = @import("duration");

pub const ParseError = error{
    MissingTarget,
    MultipleTargets,
    InvalidTimeout,
    InvalidGate,
};

pub const WaitTarget = enum {
    pane,
    file,
    board,
};

pub const WaitArgs = struct {
    target: WaitTarget,
    pane_id: ?[]const u8 = null,
    file_path: ?[]const u8 = null,
    board_topic: ?[]const u8 = null,
    until: ?[]const u8 = null,
    timeout_ms: u64,
};

pub const HoldArgs = struct {
    gate: []const u8,
    timeout_ms: u64,
};

pub fn parseWaitArgs(args: []const []const u8) ParseError!WaitArgs {
    var pane_id: ?[]const u8 = null;
    var file_path: ?[]const u8 = null;
    var board_topic: ?[]const u8 = null;
    var until: ?[]const u8 = null;
    var timeout_ms: u64 = duration.defaultTimeoutMs();

    var i: usize = 0;
    while (i < args.len) : (i += 1) {
        const arg = args[i];
        if (std.mem.eql(u8, arg, "--pane")) {
            i += 1;
            if (i >= args.len) return error.MissingTarget;
            pane_id = args[i];
            continue;
        }
        if (std.mem.eql(u8, arg, "--file")) {
            i += 1;
            if (i >= args.len) return error.MissingTarget;
            file_path = args[i];
            continue;
        }
        if (std.mem.eql(u8, arg, "--board")) {
            i += 1;
            if (i >= args.len) return error.MissingTarget;
            board_topic = args[i];
            continue;
        }
        if (std.mem.eql(u8, arg, "--until")) {
            i += 1;
            if (i >= args.len) return error.MissingTarget;
            until = args[i];
            continue;
        }
        if (std.mem.eql(u8, arg, "--timeout")) {
            i += 1;
            if (i >= args.len) return error.InvalidTimeout;
            timeout_ms = duration.parseMs(args[i]) catch return error.InvalidTimeout;
            continue;
        }
        return error.MissingTarget;
    }

    var target_count: u8 = 0;
    var target: WaitTarget = undefined;
    if (pane_id != null) {
        target_count += 1;
        target = .pane;
    }
    if (file_path != null) {
        target_count += 1;
        target = .file;
    }
    if (board_topic != null) {
        target_count += 1;
        target = .board;
    }

    if (target_count == 0) return error.MissingTarget;
    if (target_count > 1) return error.MultipleTargets;

    if (until != null and target != .pane) return error.MissingTarget;

    return .{
        .target = target,
        .pane_id = pane_id,
        .file_path = file_path,
        .board_topic = board_topic,
        .until = until,
        .timeout_ms = timeout_ms,
    };
}

pub fn parseHoldArgs(args: []const []const u8) ParseError!HoldArgs {
    if (args.len == 0) return error.InvalidGate;

    var gate: ?[]const u8 = null;
    var timeout_ms: u64 = duration.defaultTimeoutMs();

    var i: usize = 0;
    while (i < args.len) : (i += 1) {
        const arg = args[i];
        if (std.mem.eql(u8, arg, "--timeout")) {
            i += 1;
            if (i >= args.len) return error.InvalidTimeout;
            timeout_ms = duration.parseMs(args[i]) catch return error.InvalidTimeout;
            continue;
        }
        if (gate != null) return error.InvalidGate;
        gate = arg;
    }

    const gate_name = gate orelse return error.InvalidGate;
    return .{
        .gate = gate_name,
        .timeout_ms = timeout_ms,
    };
}

pub fn waitUsageMessage() []const u8 {
    return "usage: latch wait (--pane <pane-id> | --file <path> | --board <topic>) [--until <status>] [--timeout <dur>]\n";
}

pub fn holdUsageMessage() []const u8 {
    return "usage: latch hold <gate> [--timeout <dur>]\n";
}
