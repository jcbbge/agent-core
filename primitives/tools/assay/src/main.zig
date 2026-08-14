const std = @import("std");
const assay = @import("assay");
const vein = @import("vein");

fn writeStdout(io: std.Io, bytes: []const u8) !void {
    try std.Io.File.writeStreamingAll(.stdout(), io, bytes);
}

fn writeStderr(io: std.Io, bytes: []const u8) !void {
    try std.Io.File.writeStreamingAll(.stderr(), io, bytes);
}

fn printHelp(io: std.Io) !void {
    const help =
        \\assay run     --sessions <path> | --last N | --session <path>
        \\              [--decoys N] [--out-dir <dir>] [--mind-dir ~/circadian/mind]
        \\assay golden  --labels-dir <path> [--sessions <path>] [--out <report.md>]
        \\              [--mind-dir ~/circadian/mind] [--no-classify]
        \\              (ASSAY_SKIP_CLASSIFY=1 also skips classify HTTP)
        \\assay --help
        \\
    ;
    try writeStdout(io, help);
}

fn collectArgs(allocator: std.mem.Allocator, init: std.process.Init) ![][]const u8 {
    var list = std.array_list.Managed([]const u8).init(allocator);
    var iter = try std.process.Args.Iterator.initAllocator(init.minimal.args, allocator);
    defer iter.deinit();
    while (iter.next()) |arg| {
        try list.append(try allocator.dupe(u8, arg));
    }
    return try list.toOwnedSlice();
}

const GoldenArgs = struct {
    labels_dir: ?[]const u8 = null,
    sessions_file: ?[]const u8 = null,
    out_path: ?[]const u8 = null,
    mind_dir: ?[]const u8 = null,
    skip_classify: bool = false,
};

fn envSkipClassify() bool {
    const val = std.c.getenv("ASSAY_SKIP_CLASSIFY") orelse return false;
    return std.mem.eql(u8, std.mem.span(val), "1") or std.mem.eql(u8, std.mem.span(val), "true");
}

fn parseGoldenArgs(allocator: std.mem.Allocator, args: [][]const u8) GoldenArgs {
    _ = allocator;
    var opts = GoldenArgs{};
    if (envSkipClassify()) opts.skip_classify = true;

    var i: usize = 2;
    while (i < args.len) {
        if (std.mem.eql(u8, args[i], "--labels-dir") and i + 1 < args.len) {
            opts.labels_dir = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--sessions") and i + 1 < args.len) {
            opts.sessions_file = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--out") and i + 1 < args.len) {
            opts.out_path = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--mind-dir") and i + 1 < args.len) {
            opts.mind_dir = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--no-classify")) {
            opts.skip_classify = true;
            i += 1;
        } else {
            i += 1;
        }
    }
    return opts;
}

fn defaultSessionsPath(allocator: std.mem.Allocator) ![]const u8 {
    return try allocator.dupe(u8, "/Users/jrg/agent-core/primitives/tools/assay/test/golden-sessions.txt");
}

pub fn main(init: std.process.Init) !void {
    const allocator = init.arena.allocator();
    const io = init.io;
    vein.io_ctx.setProcessIo(io);

    const args = try collectArgs(allocator, init);

    if (args.len < 2) {
        try printHelp(io);
        std.process.exit(@intFromEnum(assay.ExitCode.usage));
    }

    if (std.mem.eql(u8, args[1], "--help") or std.mem.eql(u8, args[1], "-h")) {
        try printHelp(io);
        return;
    }

    if (std.mem.eql(u8, args[1], "run")) {
        try writeStderr(io, "assay run: not implemented\n");
        std.process.exit(@intFromEnum(assay.ExitCode.usage));
    }

    if (std.mem.eql(u8, args[1], "golden")) {
        const gopts = parseGoldenArgs(allocator, args);
        const labels_dir = gopts.labels_dir orelse {
            try writeStderr(io, "assay golden: --labels-dir required\n");
            std.process.exit(@intFromEnum(assay.ExitCode.usage));
        };

        const sessions_file = gopts.sessions_file orelse try defaultSessionsPath(allocator);

        const exit = assay.golden.run(allocator, .{
            .labels_dir = labels_dir,
            .sessions_file = sessions_file,
            .out_path = gopts.out_path,
            .mind_dir = gopts.mind_dir,
            .skip_classify = gopts.skip_classify,
            .io = io,
        }) catch |err| {
            const code: assay.ExitCode = switch (err) {
                error.SchemaUnknown => .schema_unknown,
                else => .io,
            };
            try writeStderr(io, "assay golden: error\n");
            std.process.exit(@intFromEnum(code));
        };

        std.process.exit(@intFromEnum(exit));
    }

    try writeStderr(io, "usage: assay run | golden | --help\n");
    std.process.exit(@intFromEnum(assay.ExitCode.usage));
}
