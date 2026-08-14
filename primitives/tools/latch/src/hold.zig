const std = @import("std");
const common = @import("common");
const wait_file = @import("wait_file");

pub const HoldError = error{
    InvalidGate,
    MissingHome,
    OutOfMemory,
};

pub const HoldResult = struct {
    outcome: common.Outcome,
    gate: []const u8,
    elapsed_ms: u64,
};

pub const Options = struct {
    gate: []const u8,
    timeout_ms: u64,
    gates_dir: []const u8,
};

pub fn isValidGateName(name: []const u8) bool {
    if (name.len == 0) return false;
    if (std.mem.indexOfAny(u8, name, &[_]u8{ '/', '\\' }) != null) return false;
    if (std.mem.eql(u8, name, ".") or std.mem.eql(u8, name, "..")) return false;
    if (std.mem.indexOf(u8, name, "..") != null) return false;
    return true;
}

pub fn resolveGatesDir(allocator: std.mem.Allocator, environ: ?*const std.process.Environ.Map) HoldError![]const u8 {
    const home = (environ orelse return error.MissingHome).get("HOME") orelse return error.MissingHome;
    return std.fmt.allocPrint(allocator, "{s}/.fleet/gates", .{home}) catch return error.OutOfMemory;
}

pub fn gatePath(allocator: std.mem.Allocator, gates_dir: []const u8, gate: []const u8) HoldError![]const u8 {
    return std.fs.path.join(allocator, &[_][]const u8{ gates_dir, gate }) catch return error.OutOfMemory;
}

pub fn hold(allocator: std.mem.Allocator, io: std.Io, opts: Options) HoldError!HoldResult {
    if (!isValidGateName(opts.gate)) return error.InvalidGate;

    common.ensureDir(opts.gates_dir) catch return error.InvalidGate;

    const path = gatePath(allocator, opts.gates_dir, opts.gate) catch return error.OutOfMemory;
    defer allocator.free(path);

    const file_result = wait_file.waitFile(allocator, io, .{
        .path = path,
        .timeout_ms = opts.timeout_ms,
    }) catch return error.InvalidGate;

    return HoldResult{
        .outcome = file_result.outcome,
        .gate = opts.gate,
        .elapsed_ms = file_result.elapsed_ms,
    };
}

pub fn formatResult(allocator: std.mem.Allocator, result: HoldResult) ![]const u8 {
    return switch (result.outcome) {
        .matched => try std.fmt.allocPrint(
            allocator,
            "latch: gate {s} stamped ({d}ms)\n",
            .{ result.gate, result.elapsed_ms },
        ),
        .timeout => try std.fmt.allocPrint(allocator, "latch: timeout\n", .{}),
        .vanished => try std.fmt.allocPrint(
            allocator,
            "latch: gate {s} vanished\n",
            .{result.gate},
        ),
    };
}
