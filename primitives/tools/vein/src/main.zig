const std = @import("std");
const vein = @import("vein");

fn collectArgs(allocator: std.mem.Allocator, init: std.process.Init) ![][]const u8 {
    var list = std.array_list.Managed([]const u8).init(allocator);
    var iter = try std.process.Args.Iterator.initAllocator(init.minimal.args, allocator);
    defer iter.deinit();
    while (iter.next()) |arg| {
        try list.append(try allocator.dupe(u8, arg));
    }
    return try list.toOwnedSlice();
}

fn writeAll(io: std.Io, bytes: []const u8) !void {
    try std.Io.File.writeStreamingAll(.stdout(), io, bytes);
}

fn printHelp(io: std.Io) !void {
    const usage =
        \\vein — session transcript mining CLI
        \\
        \\Usage:
        \\  vein scan --sessions <path> [--out <commands.csv>]
        \\  vein scan --last N [--out <commands.csv>]
        \\  vein report --sessions <path> [--out-dir <dir>]
        \\  vein report --last N [--out-dir <dir>]
        \\  vein report --csv <commands.csv> [--out-dir <dir>]
        \\
        \\Flags:
        \\  --sessions <path>   Text file: one session id or absolute transcript path per line
        \\  --last N            Select newest N transcripts (CC + pi, metadata-first)
        \\  --out <path>        Scan output CSV (default: commands.csv)
        \\  --out-dir <dir>     Report output directory (default: .)
        \\  --csv <path>        Existing commands.csv for report mode
        \\  --help              Print usage (exit 0)
        \\
        \\Exit codes:
        \\  0 success  2 usage/args  3 I/O  4 schema-UNKNOWN
        \\
    ;
    try writeAll(io, usage);
}

const ScanArgs = struct {
    sessions_file: ?[]const u8 = null,
    last_n: ?u32 = null,
    out_path: []const u8 = "commands.csv",
};

const ReportArgs = struct {
    sessions_file: ?[]const u8 = null,
    last_n: ?u32 = null,
    csv_path: ?[]const u8 = null,
    out_dir: []const u8 = ".",
};

fn parseScanArgs(args: [][]const u8) ScanArgs {
    var opts = ScanArgs{};
    var i: usize = 2;
    while (i < args.len) {
        if (std.mem.eql(u8, args[i], "--sessions") and i + 1 < args.len) {
            opts.sessions_file = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--last") and i + 1 < args.len) {
            opts.last_n = std.fmt.parseInt(u32, args[i + 1], 10) catch null;
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--out") and i + 1 < args.len) {
            opts.out_path = args[i + 1];
            i += 2;
        } else {
            i += 1;
        }
    }
    return opts;
}

fn parseReportArgs(args: [][]const u8) ReportArgs {
    var opts = ReportArgs{};
    var i: usize = 2;
    while (i < args.len) {
        if (std.mem.eql(u8, args[i], "--sessions") and i + 1 < args.len) {
            opts.sessions_file = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--last") and i + 1 < args.len) {
            opts.last_n = std.fmt.parseInt(u32, args[i + 1], 10) catch null;
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--csv") and i + 1 < args.len) {
            opts.csv_path = args[i + 1];
            i += 2;
        } else if (std.mem.eql(u8, args[i], "--out-dir") and i + 1 < args.len) {
            opts.out_dir = args[i + 1];
            i += 2;
        } else {
            i += 1;
        }
    }
    return opts;
}

fn validateScanArgs(opts: ScanArgs) bool {
    const has_sessions = opts.sessions_file != null;
    const has_last = opts.last_n != null;
    return has_sessions != has_last;
}

fn validateReportArgs(opts: ReportArgs) bool {
    const source_count = @as(u8, @intFromBool(opts.sessions_file != null)) +
        @as(u8, @intFromBool(opts.last_n != null)) +
        @as(u8, @intFromBool(opts.csv_path != null));
    return source_count == 1;
}

fn detectHarness(path: []const u8) ?vein.schema.Harness {
    if (std.mem.indexOf(u8, path, "/.claude/projects/") != null) return .cc;
    if (std.mem.indexOf(u8, path, "/.pi/agent/sessions/") != null) return .pi;
    return null;
}

/// True when the transcript contains at least one line matching harness shape.
fn transcriptHasValidShape(allocator: std.mem.Allocator, path: []const u8, harness: vein.schema.Harness) !bool {
    const file = vein.io_ctx.openAbs(path) catch return false;
    defer file.close(vein.io_ctx.io());
    var probe_buf: [65536]u8 = undefined;
    var probe_reader = file.reader(vein.io_ctx.io(), &probe_buf);
    var probe_line: std.ArrayList(u8) = .empty;
    defer probe_line.deinit(allocator);
    while (try vein.io_ctx.readLineInto(allocator, &probe_reader, &probe_line)) {
        if (probe_line.items.len == 0) continue;
        vein.schema.verifyShape(probe_line.items, harness) catch continue;
        return true;
    }
    return false;
}

fn exitUnresolvable(io: std.Io, tokens: []const []const u8) noreturn {
    for (tokens) |token| {
        var buf: [4096]u8 = undefined;
        const msg = std.fmt.bufPrint(&buf, "UNKNOWN: unresolvable session {s}\n", .{token}) catch continue;
        std.Io.File.writeStreamingAll(.stderr(), io, msg) catch {};
    }
    std.process.exit(@intFromEnum(vein.ExitCode.io));
}

fn ensureSessionsResolvable(allocator: std.mem.Allocator, io: std.Io, sessions_file: []const u8) !void {
    const tokens = try vein.session.parseSessionsFile(allocator, sessions_file);
    defer {
        for (tokens) |t| allocator.free(t);
        allocator.free(tokens);
    }
    const failures = try vein.session.collectUnresolvable(allocator, tokens);
    defer {
        for (failures) |t| allocator.free(t);
        allocator.free(failures);
    }
    if (failures.len > 0) exitUnresolvable(io, failures);
}

fn sessionPathDrifts(
    allocator: std.mem.Allocator,
    token: []const u8,
    catalog: *?[]vein.session.SessionRef,
) !enum { ok, drift } {
    const trimmed = std.mem.trim(u8, token, " \t\r\n");
    if (trimmed.len == 0) return .ok;

    var owned: struct {
        session_id: ?[]const u8 = null,
        source_path: ?[]const u8 = null,
        project_key: ?[]const u8 = null,
    } = .{};

    defer {
        if (owned.session_id) |s| allocator.free(s);
        if (owned.source_path) |s| allocator.free(s);
        if (owned.project_key) |s| allocator.free(s);
    }

    const path: []const u8 = blk: {
        if (std.mem.endsWith(u8, trimmed, ".jsonl")) {
            if (std.fs.path.isAbsolute(trimmed)) {
                if (!jsonlExists(trimmed)) return error.SessionNotFound;
                break :blk trimmed;
            }
            if (!jsonlExists(trimmed)) return error.SessionNotFound;
            break :blk trimmed;
        }
        const info = try vein.session.resolveRefWithCatalog(allocator, trimmed, catalog);
        owned.session_id = info.session_id;
        owned.source_path = info.source_path;
        owned.project_key = info.project_key;
        break :blk info.source_path;
    };

    const harness = detectHarness(path);
    if (harness) |h| {
        if (!try transcriptHasValidShape(allocator, path, h)) return .drift;
        return .ok;
    }
    if (try transcriptHasValidShape(allocator, path, .cc)) return .ok;
    if (try transcriptHasValidShape(allocator, path, .pi)) return .ok;
    return .drift;
}

fn jsonlExists(path: []const u8) bool {
    const file = vein.io_ctx.openAbs(path) catch return false;
    file.close(vein.io_ctx.io());
    return true;
}

fn allSessionsSchemaDrift(allocator: std.mem.Allocator, sessions_file: []const u8) !bool {
    const tokens = try vein.session.parseSessionsFile(allocator, sessions_file);
    defer {
        for (tokens) |t| allocator.free(t);
        allocator.free(tokens);
    }
    if (tokens.len == 0) return false;

    var catalog: ?[]vein.session.SessionRef = null;
    defer if (catalog) |all| {
        for (all) |s| {
            allocator.free(s.session_id);
            allocator.free(s.source_path);
            allocator.free(s.project_key);
        }
        allocator.free(all);
    };

    var checked: usize = 0;
    var drift_count: usize = 0;
    for (tokens) |token| {
        switch (try sessionPathDrifts(allocator, token, &catalog)) {
            .ok => checked += 1,
            .drift => {
                checked += 1;
                drift_count += 1;
            },
        }
    }
    return checked > 0 and drift_count == checked;
}

fn writeCsvToFile(allocator: std.mem.Allocator, path: []const u8, rows: []const vein.Row) !void {
    var aw = std.Io.Writer.Allocating.init(allocator);
    defer aw.deinit();
    try vein.csv.writeRows(allocator, &aw.writer, rows);
    const content = try aw.toOwnedSlice();
    defer allocator.free(content);
    try vein.io_ctx.writeFileAbs(path, content);
}

fn toScanOptions(opts: ScanArgs) vein.scan.ScanOptions {
    return .{
        .sessions_file = opts.sessions_file,
        .last_n = opts.last_n,
        .out_path = opts.out_path,
    };
}

fn exitSchemaUnknown(io: std.Io) noreturn {
    writeAll(io, "UNKNOWN\n") catch {};
    std.process.exit(@intFromEnum(vein.ExitCode.schema_unknown));
}

fn dispatchScan(allocator: std.mem.Allocator, io: std.Io, opts: ScanArgs) !void {
    if (opts.sessions_file) |sessions_file| {
        try ensureSessionsResolvable(allocator, io, sessions_file);
        if (try allSessionsSchemaDrift(allocator, sessions_file)) {
            exitSchemaUnknown(io);
        }
    }

    const rows = try vein.scan.run(allocator, toScanOptions(opts));
    defer vein.scan.freeRows(allocator, rows);
    try writeCsvToFile(allocator, opts.out_path, rows);
}

fn dispatchReport(allocator: std.mem.Allocator, io: std.Io, opts: ReportArgs) !void {
    if (opts.csv_path) |csv_path| {
        try vein.report.run(allocator, .{
            .csv_path = csv_path,
            .out_dir = opts.out_dir,
        });
        return;
    }

    if (opts.sessions_file) |sessions_file| {
        try ensureSessionsResolvable(allocator, io, sessions_file);
        if (try allSessionsSchemaDrift(allocator, sessions_file)) {
            exitSchemaUnknown(io);
        }
    }

    const rows = try vein.scan.run(allocator, .{
        .sessions_file = opts.sessions_file,
        .last_n = opts.last_n,
        .out_path = "commands.csv",
    });
    defer vein.scan.freeRows(allocator, rows);
    try vein.report.fromRows(allocator, rows, opts.out_dir);
}

pub fn main(init: std.process.Init) !void {
    const allocator = init.arena.allocator();
    const io = init.io;
    vein.io_ctx.setProcessIo(io);
    const args = try collectArgs(allocator, init);

    if (args.len < 2) {
        try printHelp(io);
        std.process.exit(@intFromEnum(vein.ExitCode.usage));
    }

    if (std.mem.eql(u8, args[1], "--help") or std.mem.eql(u8, args[1], "-h")) {
        try printHelp(io);
        return;
    }

    if (std.mem.eql(u8, args[1], "scan")) {
        const opts = parseScanArgs(args);
        if (!validateScanArgs(opts)) {
            try writeAll(io, "error: scan requires exactly one of --sessions or --last\n");
            std.process.exit(@intFromEnum(vein.ExitCode.usage));
        }
        dispatchScan(allocator, io, opts) catch {
            std.process.exit(@intFromEnum(vein.ExitCode.io));
        };
        return;
    }

    if (std.mem.eql(u8, args[1], "report")) {
        const opts = parseReportArgs(args);
        if (!validateReportArgs(opts)) {
            try writeAll(io, "error: report requires exactly one of --sessions, --last, or --csv\n");
            std.process.exit(@intFromEnum(vein.ExitCode.usage));
        }
        dispatchReport(allocator, io, opts) catch {
            std.process.exit(@intFromEnum(vein.ExitCode.io));
        };
        return;
    }

    try writeAll(io, "error: unknown subcommand; expected scan or report\n");
    std.process.exit(@intFromEnum(vein.ExitCode.usage));
}
