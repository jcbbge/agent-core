const std = @import("std");
const Row = @import("lib.zig").Row;
const csv = @import("csv.zig");
const io_ctx = @import("io_ctx.zig");

pub const ReportOptions = struct {
    sessions_file: ?[]const u8 = null,
    last_n: ?u32 = null,
    csv_path: ?[]const u8 = null,
    out_dir: []const u8 = ".",
};

const SubcommandVerbs = [_][]const u8{
    "git", "npm", "pnpm", "yarn", "bun", "npx", "cargo", "docker", "gh", "herdr",
};

const MetricEntry = struct {
    command: []const u8,
    calls: usize,
    total_bytes: u64,
    median_bytes: u64,
    score: u64,
    errors: usize,
    cc_calls: usize,
    pi_calls: usize,
    compound_calls: usize,
    pipe_calls: usize,
    oversized_calls: usize,
    eligible_calls: usize,
    eligible_bytes: u64,
};

const LoopEntry = struct {
    kind: []const u8,
    harness: []const u8,
    session_id: []const u8,
    verb: []const u8,
    repeats: usize,
    errors: usize,
    total_bytes: u64,
    sample: []const u8,
};

const HookCommand = struct {
    label: []const u8,
    calls: u64,
    duration_ms: f64,
    slow_over_1s: u64,
};

const HookMetrics = struct {
    events: u64 = 0,
    prevented: u64 = 0,
    error_items: u64 = 0,
    duration_ms: f64 = 0,
    slow_over_1s: u64 = 0,
    commands: std.StringHashMap(HookCommand),

    fn init(allocator: std.mem.Allocator) HookMetrics {
        return .{ .commands = std.StringHashMap(HookCommand).init(allocator) };
    }

    fn deinit(self: *HookMetrics) void {
        self.commands.deinit();
    }

    fn recordCommand(self: *HookMetrics, label: []const u8, duration: f64) !void {
        const gop = try self.commands.getOrPut(label);
        if (!gop.found_existing) {
            gop.value_ptr.* = .{ .label = label, .calls = 0, .duration_ms = 0, .slow_over_1s = 0 };
        }
        gop.value_ptr.calls += 1;
        gop.value_ptr.duration_ms += duration;
        if (duration > 1000) gop.value_ptr.slow_over_1s += 1;
    }
};

/// Emit verbs.md, retries.md, hooks.md, failures.md under out_dir.
pub fn run(allocator: std.mem.Allocator, opts: ReportOptions) !void {
    if (opts.sessions_file != null or opts.last_n != null) return error.NotImplemented;
    const csv_path = opts.csv_path orelse return error.NotImplemented;
    const rows = try readCsvRows(allocator, csv_path);
    try fromRows(allocator, rows, opts.out_dir);
}

/// Build four markdown reports from pre-extracted rows.
pub fn fromRows(allocator: std.mem.Allocator, rows: []const Row, out_dir: []const u8) !void {
    try io_ctx.createDirPath(out_dir);
    try writeVerbsMd(allocator, rows, out_dir);
    try writeRetriesMd(allocator, rows, out_dir);
    try writeHooksMd(allocator, rows, out_dir);
    try writeFailuresMd(allocator, rows, out_dir);
}

fn hasSubcommandVerb(verb: []const u8) bool {
    for (SubcommandVerbs) |v| {
        if (std.mem.eql(u8, verb, v)) return true;
    }
    return false;
}

fn commandKey(allocator: std.mem.Allocator, row: Row) ![]const u8 {
    const verb = if (row.verb.len == 0) "[empty]" else row.verb;
    if (hasSubcommandVerb(verb) and row.subcommand.len > 0) {
        return try std.fmt.allocPrint(allocator, "{s} {s}", .{ verb, row.subcommand });
    }
    return try allocator.dupe(u8, verb);
}


fn isEligible(row: Row) bool {
    return !row.compound and !row.pipe and !row.heredoc and !row.substitution and !row.machine_format;
}

fn resultBytes(row: Row) u64 {
    return row.result_bytes orelse 0;
}

fn metricTable(allocator: std.mem.Allocator, rows: []const Row) ![]MetricEntry {
    var grouped = std.StringHashMap(std.ArrayList(usize)).init(allocator);
    defer {
        var it = grouped.iterator();
        while (it.next()) |entry| {
            allocator.free(entry.key_ptr.*);
            entry.value_ptr.deinit(allocator);
        }
        grouped.deinit();
    }

    for (rows, 0..) |row, i| {
        const k = try commandKey(allocator, row);
        const gop = try grouped.getOrPut(k);
        if (!gop.found_existing) {
            gop.key_ptr.* = try allocator.dupe(u8, k);
            gop.value_ptr.* = .empty;
        }
        allocator.free(k);
        try gop.value_ptr.append(allocator, i);
    }

    var table = std.ArrayList(MetricEntry).empty;
    errdefer table.deinit(allocator);

    var it = grouped.iterator();
    while (it.next()) |entry| {
        const indices = entry.value_ptr.items;
        var sizes = std.ArrayList(u64).empty;
        defer sizes.deinit(allocator);
        var total: u64 = 0;
        var errors: usize = 0;
        var cc_calls: usize = 0;
        var pi_calls: usize = 0;
        var compound_calls: usize = 0;
        var pipe_calls: usize = 0;
        var oversized: usize = 0;
        var eligible_calls: usize = 0;
        var eligible_bytes: u64 = 0;

        for (indices) |idx| {
            const row = rows[idx];
            const bytes = resultBytes(row);
            try sizes.append(allocator, bytes);
            total += bytes;
            if (row.is_error) errors += 1;
            if (std.mem.eql(u8, row.harness, "cc")) cc_calls += 1;
            if (std.mem.eql(u8, row.harness, "pi")) pi_calls += 1;
            if (row.compound) compound_calls += 1;
            if (row.pipe) pipe_calls += 1;
            if (bytes > 50 * 1024) oversized += 1;
            if (isEligible(row)) {
                eligible_calls += 1;
                eligible_bytes += bytes;
            }
        }

        const med = medianU64(allocator, sizes.items);
        const score = @as(u64, @intCast(indices.len)) * med;
        try table.append(allocator, .{
            .command = entry.key_ptr.*,
            .calls = indices.len,
            .total_bytes = total,
            .median_bytes = med,
            .score = score,
            .errors = errors,
            .cc_calls = cc_calls,
            .pi_calls = pi_calls,
            .compound_calls = compound_calls,
            .pipe_calls = pipe_calls,
            .oversized_calls = oversized,
            .eligible_calls = eligible_calls,
            .eligible_bytes = eligible_bytes,
        });
    }

    std.mem.sort(MetricEntry, table.items, {}, metricLess);
    return try table.toOwnedSlice(allocator);
}

fn metricLess(_: void, a: MetricEntry, b: MetricEntry) bool {
    if (a.score != b.score) return a.score > b.score;
    return a.total_bytes > b.total_bytes;
}

fn medianU64(allocator: std.mem.Allocator, values: []const u64) u64 {
    if (values.len == 0) return 0;
    const copy = allocator.alloc(u64, values.len) catch return 0;
    defer allocator.free(copy);
    @memcpy(copy, values);
    std.mem.sort(u64, copy, {}, std.sort.asc(u64));
    if (copy.len % 2 == 1) return copy[copy.len / 2];
    return (copy[copy.len / 2 - 1] + copy[copy.len / 2]) / 2;
}

fn replaceLiteral(allocator: std.mem.Allocator, buf: *std.ArrayList(u8), needle: []const u8, repl: []const u8) !void {
    const src = try allocator.dupe(u8, buf.items);
    defer allocator.free(src);
    buf.clearRetainingCapacity();
    var rest: []const u8 = src;
    while (std.mem.indexOf(u8, rest, needle)) |idx| {
        try buf.appendSlice(allocator, rest[0..idx]);
        try buf.appendSlice(allocator, repl);
        rest = rest[idx + needle.len ..];
    }
    try buf.appendSlice(allocator, rest);
}

fn replaceDigits(allocator: std.mem.Allocator, buf: *std.ArrayList(u8)) !void {
    var out = std.ArrayList(u8).empty;
    defer out.deinit(allocator);
    var i: usize = 0;
    while (i < buf.items.len) {
        if (std.ascii.isDigit(buf.items[i])) {
            const start = i;
            while (i < buf.items.len and std.ascii.isDigit(buf.items[i])) : (i += 1) {}
            _ = start;
            try out.appendSlice(allocator, "<n>");
        } else {
            try out.append(allocator, buf.items[i]);
            i += 1;
        }
    }
    buf.clearRetainingCapacity();
    try buf.appendSlice(allocator, out.items);
}

fn replaceQuoted(allocator: std.mem.Allocator, buf: *std.ArrayList(u8)) !void {
    var out = std.ArrayList(u8).empty;
    defer out.deinit(allocator);
    var i: usize = 0;
    while (i < buf.items.len) {
        const q = buf.items[i];
        if (q == '\'' or q == '"') {
            try out.appendSlice(allocator, "<quoted>");
            i += 1;
            while (i < buf.items.len and buf.items[i] != q) : (i += 1) {}
            if (i < buf.items.len) i += 1;
        } else {
            try out.append(allocator, buf.items[i]);
            i += 1;
        }
    }
    buf.clearRetainingCapacity();
    try buf.appendSlice(allocator, out.items);
}

fn collapseSpace(allocator: std.mem.Allocator, buf: *std.ArrayList(u8)) !void {
    var out = std.ArrayList(u8).empty;
    defer out.deinit(allocator);
    var prev_space = false;
    for (buf.items) |c| {
        if (std.ascii.isWhitespace(c)) {
            if (!prev_space) try out.append(allocator, ' ');
            prev_space = true;
        } else {
            try out.append(allocator, c);
            prev_space = false;
        }
    }
    buf.clearRetainingCapacity();
    try buf.appendSlice(allocator, std.mem.trim(u8, out.items, " "));
}

fn familySimple(allocator: std.mem.Allocator, command: []const u8) ![]const u8 {
    var lowered = try std.ascii.allocLowerString(allocator, command);
    defer allocator.free(lowered);
    var out = std.ArrayList(u8).empty;
    defer out.deinit(allocator);
    var i: usize = 0;
    while (i < lowered.len) {
        if (i + 36 <= lowered.len and lowered[i + 8] == '-' and std.mem.indexOf(u8, lowered[i..], "-") != null) {
            const chunk = lowered[i .. i + @min(36, lowered.len - i)];
            if (chunk.len >= 36 and chunk[8] == '-' and chunk[13] == '-' and chunk[18] == '-') {
                try out.appendSlice(allocator, "<uuid>");
                i += 36;
                continue;
            }
        }
        try out.append(allocator, lowered[i]);
        i += 1;
    }
    const tmp = try allocator.dupe(u8, out.items);
    defer allocator.free(tmp);
    var buf = std.ArrayList(u8).empty;
    defer buf.deinit(allocator);
    try buf.appendSlice(allocator, tmp);
    try replaceLiteral(allocator, &buf, "/private/tmp/", "<tmp>/");
    try replaceDigits(allocator, &buf);
    try replaceQuoted(allocator, &buf);
    try collapseSpace(allocator, &buf);
    return try allocator.dupe(u8, std.mem.trim(u8, buf.items, " "));
}

fn loopKeyExact(harness: []const u8, session: []const u8, hash: []const u8, allocator: std.mem.Allocator) ![]const u8 {
    return try std.fmt.allocPrint(allocator, "{s}\x1f{s}\x1f{s}", .{ harness, session, hash });
}

fn loopKeyNear(harness: []const u8, session: []const u8, fam: []const u8, allocator: std.mem.Allocator) ![]const u8 {
    return try std.fmt.allocPrint(allocator, "{s}\x1f{s}\x1f{s}", .{ harness, session, fam });
}

fn retryLoops(allocator: std.mem.Allocator, rows: []const Row) !struct { loops: []LoopEntry, exact_count: usize, excess: usize } {
    var exact = std.StringHashMap(std.ArrayList(usize)).init(allocator);
    defer {
        var eit = exact.iterator();
        while (eit.next()) |e| {
            allocator.free(e.key_ptr.*);
            e.value_ptr.deinit(allocator);
        }
        exact.deinit();
    }
    var near = std.StringHashMap(std.ArrayList(usize)).init(allocator);
    defer {
        var nit = near.iterator();
        while (nit.next()) |n| {
            allocator.free(n.key_ptr.*);
            n.value_ptr.deinit(allocator);
        }
        near.deinit();
    }

    for (rows, 0..) |row, i| {
        const ek = try loopKeyExact(row.harness, row.session_id, row.command_norm_sha256, allocator);
        const eg = try exact.getOrPut(ek);
        if (!eg.found_existing) {
            eg.key_ptr.* = try allocator.dupe(u8, ek);
            eg.value_ptr.* = .empty;
        }
        allocator.free(ek);
        try eg.value_ptr.append(allocator, i);

        const fam = try familySimple(allocator, row.command_safe);
        const nk = try loopKeyNear(row.harness, row.session_id, fam, allocator);
        allocator.free(fam);
        const ng = try near.getOrPut(nk);
        if (!ng.found_existing) {
            ng.key_ptr.* = try allocator.dupe(u8, nk);
            ng.value_ptr.* = .empty;
        }
        allocator.free(nk);
        try ng.value_ptr.append(allocator, i);
    }

    var loops = std.ArrayList(LoopEntry).empty;
    errdefer loops.deinit(allocator);
    var exact_count: usize = 0;
    var excess: usize = 0;

    var eit = exact.iterator();
    while (eit.next()) |entry| {
        if (entry.value_ptr.items.len < 3) continue;
        exact_count += 1;
        excess += entry.value_ptr.items.len - 1;
        try loops.append(allocator, try loopSummary(allocator, rows, "exact", entry.value_ptr.items));
    }

    var nit = near.iterator();
    while (nit.next()) |entry| {
        if (entry.value_ptr.items.len < 3) continue;
        var hashes = std.StringHashMap(void).init(allocator);
        defer hashes.deinit();
        for (entry.value_ptr.items) |idx| {
            const h = rows[idx].command_norm_sha256;
            try hashes.put(h, {});
        }
        if (hashes.count() <= 1) continue;
        try loops.append(allocator, try loopSummary(allocator, rows, "near", entry.value_ptr.items));
    }

    std.mem.sort(LoopEntry, loops.items, {}, loopLess);
    return .{ .loops = try loops.toOwnedSlice(allocator), .exact_count = exact_count, .excess = excess };
}

fn loopLess(_: void, a: LoopEntry, b: LoopEntry) bool {
    return a.repeats > b.repeats;
}

fn loopSummary(allocator: std.mem.Allocator, rows: []const Row, kind: []const u8, indices: []const usize) !LoopEntry {
    const first = rows[indices[0]];
    var total: u64 = 0;
    var errors: usize = 0;
    for (indices) |idx| {
        total += resultBytes(rows[idx]);
        if (rows[idx].is_error) errors += 1;
    }
    var sample_buf: [180]u8 = undefined;
    var sample_len: usize = 0;
    for (first.command_safe) |c| {
        if (sample_len >= sample_buf.len) break;
        sample_buf[sample_len] = if (c == '\n') ' ' else c;
        sample_len += 1;
    }
    return .{
        .kind = kind,
        .harness = first.harness,
        .session_id = first.session_id,
        .verb = try commandKey(allocator, first),
        .repeats = indices.len,
        .errors = errors,
        .total_bytes = total,
        .sample = try allocator.dupe(u8, sample_buf[0..sample_len]),
    };
}

fn failureCategory(allocator: std.mem.Allocator, result: []const u8) ![]const u8 {
    const text = std.ascii.allocLowerString(allocator, result) catch return "generic-error";
    defer allocator.free(text);

    if (containsAny(text, &.{ "command not found", "not recognized as an internal" })) return "command-not-found";
    if (containsAny(text, &.{ "no such file or directory", "cannot access", "could not open" })) return "no-such-file";
    if (containsAny(text, &.{ "permission denied", "operation not permitted", "workspace trust" })) return "permission-denied";
    if (containsAny(text, &.{ "unknown option", "unrecognized option", "invalid option", "unknown flag" })) return "unknown-option";
    if (containsAny(text, &.{ "syntax error", "unexpected token", "parse error" })) return "syntax-error";
    if (containsAny(text, &.{ "timed out", "timeout" })) return "timeout";
    if (containsAny(text, &.{ "connection refused", "could not connect", "failed to connect" })) return "connection";
    if (containsAny(text, &.{ "tests failed", "assertionerror", "expect(" })) return "test-failure";
    if (std.mem.indexOf(u8, text, " failed") != null or std.mem.indexOf(u8, text, "failed ") != null) return "test-failure";
    if (containsAny(text, &.{ "not running", "no process", "no matching process" })) return "not-running";
    return "generic-error";
}

fn containsAny(hay: []const u8, needles: []const []const u8) bool {
    for (needles) |n| {
        if (std.mem.indexOf(u8, hay, n) != null) return true;
    }
    return false;
}

fn oracleLabel(category: []const u8) []const u8 {
    if (std.mem.eql(u8, category, "generic-error")) return "generic";
    if (std.mem.eql(u8, category, "syntax-error")) return "syntax";
    if (std.mem.eql(u8, category, "timeout")) return "timeout";
    if (std.mem.eql(u8, category, "no-such-file")) return "dead-path";
    if (std.mem.eql(u8, category, "test-failure")) return "test";
    return category;
}

fn hookLabel(command: []const u8) []const u8 {
    var iter = std.mem.tokenizeAny(u8, command, " \t");
    const first = iter.next() orelse return "[unknown]";
    const base = std.fs.path.basename(first);
    if (std.mem.eql(u8, base, "node") or std.mem.eql(u8, base, "bun") or std.mem.eql(u8, base, "python") or std.mem.eql(u8, base, "python3") or std.mem.eql(u8, base, "bash") or std.mem.eql(u8, base, "zsh")) {
        while (iter.next()) |tok| {
            if (!std.mem.startsWith(u8, tok, "-")) return std.fs.path.basename(tok);
        }
    }
    return base;
}

fn isTowerLabel(label: []const u8) bool {
    if (std.ascii.eqlIgnoreCase(label, "tower:")) return true;
    if (std.mem.indexOf(u8, label, "tower") != null or std.mem.indexOf(u8, label, "Tower") != null) return true;
    return false;
}

fn scanCcTranscript(allocator: std.mem.Allocator, path: []const u8, wanted: ?*std.StringHashMap([]const u8), hooks: ?*HookMetrics) !void {
    const file = try io_ctx.openAbs(path);
    defer file.close(io_ctx.io());
    var buf: [65536]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    var line_buf = std.ArrayList(u8).empty;
    defer line_buf.deinit(allocator);

    while (try io_ctx.readLineInto(allocator, &reader, &line_buf)) {
        if (line_buf.items.len == 0) continue;
        const parsed = std.json.parseFromSlice(std.json.Value, allocator, line_buf.items, .{}) catch continue;
        defer parsed.deinit();
        const root = parsed.value;
        if (root != .object) continue;

        if (hooks) |hm| {
            const typ = root.object.get("type") orelse continue;
            if (typ != .string or !std.mem.eql(u8, typ.string, "system")) continue;
            if (root.object.get("hookCount")) |hc| {
                if (hc == .integer) hm.events += @intCast(hc.integer);
            }
            if (root.object.get("preventedContinuation")) |pc| {
                if (pc == .bool and pc.bool) hm.prevented += 1;
            }
            if (root.object.get("hookErrors")) |he| {
                if (he == .array) hm.error_items += @intCast(he.array.items.len);
            }
            if (root.object.get("hookInfos")) |hi| {
                if (hi == .array) {
                    for (hi.array.items) |info| {
                        if (info != .object) continue;
                        const dur_val = info.object.get("durationMs") orelse continue;
                        const duration: f64 = switch (dur_val) {
                            .integer => |v| @floatFromInt(v),
                            .float => |v| v,
                            else => continue,
                        };
                        const cmd_val = info.object.get("command") orelse continue;
                        const cmd_str: []const u8 = switch (cmd_val) {
                            .string => |s| s,
                            else => continue,
                        };
                        const label = hookLabel(cmd_str);
                        hm.duration_ms += duration;
                        if (duration > 1000) hm.slow_over_1s += 1;
                        try hm.recordCommand(label, duration);
                    }
                }
            }
        }

        if (wanted) |map| {
            const message_val = root.object.get("message") orelse continue;
            if (message_val != .object) continue;
            const content_val = message_val.object.get("content") orelse continue;
            const items: []const std.json.Value = switch (content_val) {
                .array => content_val.array.items,
                else => &.{content_val},
            };
            for (items) |item| {
                if (item != .object) continue;
                const item_type = item.object.get("type") orelse continue;
                if (item_type != .string or !std.mem.eql(u8, item_type.string, "tool_result")) continue;
                const call_id_val = item.object.get("tool_use_id") orelse continue;
                if (call_id_val != .string) continue;
                const call_id = call_id_val.string;
                if (map.get(call_id) == null) continue;
                const content = item.object.get("content");
                const text = jsonTextContent(content);
                try map.put(call_id, try allocator.dupe(u8, text));
            }
        }
    }
}

fn scanPiTranscript(allocator: std.mem.Allocator, path: []const u8, wanted: *std.StringHashMap([]const u8)) !void {
    const file = try io_ctx.openAbs(path);
    defer file.close(io_ctx.io());
    var buf: [65536]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    var line_buf = std.ArrayList(u8).empty;
    defer line_buf.deinit(allocator);

    while (try io_ctx.readLineInto(allocator, &reader, &line_buf)) {
        if (line_buf.items.len == 0) continue;
        const parsed = std.json.parseFromSlice(std.json.Value, allocator, line_buf.items, .{}) catch continue;
        defer parsed.deinit();
        const root = parsed.value;
        if (root != .object) continue;
        const message_val = root.object.get("message") orelse continue;
        if (message_val != .object) continue;
        const role = message_val.object.get("role") orelse continue;
        if (role != .string or !std.mem.eql(u8, role.string, "toolResult")) continue;
        const tool = message_val.object.get("toolName") orelse continue;
        if (tool != .string or !std.mem.eql(u8, tool.string, "bash")) continue;
        const call_id_val = message_val.object.get("toolCallId") orelse continue;
        if (call_id_val != .string) continue;
        const call_id = call_id_val.string;
        if (wanted.get(call_id) == null) continue;
        const content = message_val.object.get("content");
        const text = jsonTextContent(content);
        try wanted.put(call_id, try allocator.dupe(u8, text));
    }
}

fn jsonTextContent(content: ?std.json.Value) []const u8 {
    const c = content orelse return "";
    switch (c) {
        .string => |s| return s,
        .array => |arr| {
            for (arr.items) |item| {
                switch (item) {
                    .string => |s| return s,
                    .object => |o| {
                        if (o.get("text")) |t| {
                            if (t == .string) return t.string;
                        }
                    },
                    else => {},
                }
            }
            return "";
        },
        else => return "",
    }
}

fn collectSessionPaths(allocator: std.mem.Allocator, rows: []const Row) !std.StringHashMap([]const u8) {
    var map = std.StringHashMap([]const u8).init(allocator);
    for (rows) |row| {
        if (row.source_path.len == 0) continue;
        const key = try std.fmt.allocPrint(allocator, "{s}\x1f{s}", .{ row.harness, row.session_id });
        defer allocator.free(key);
        try map.put(try allocator.dupe(u8, key), try allocator.dupe(u8, row.source_path));
    }
    return map;
}

fn writeVerbsMd(allocator: std.mem.Allocator, rows: []const Row, out_dir: []const u8) !void {
    const table = try metricTable(allocator, rows);
    defer allocator.free(table);

    var eligible_total: usize = 0;
    for (rows) |row| {
        if (isEligible(row)) eligible_total += 1;
    }

    const path = try std.fs.path.join(allocator, &.{ out_dir, "verbs.md" });
    defer allocator.free(path);
    var file = try io_ctx.createAbs(path, .{ .read = false, .truncate = true });
    defer file.close(io_ctx.io());

    var aw = std.Io.Writer.Allocating.init(allocator);
    defer aw.deinit();
    const w = &aw.writer;

    try w.print("# Verb table\n\n", .{});
    try w.print("Total calls: {d}. Rewrite-eligible: {d}/{d}.\n\n", .{ rows.len, eligible_total, rows.len });
    try w.print("Ranking score = calls × median result bytes.\n\n", .{});
    try w.print("| Rank | Command | Calls | Total B | Median B | Score | Eligible |\n", .{});
    try w.print("|---:|---|---:|---:|---:|---:|---:|\n", .{});

    const limit = @min(table.len, 100);
    for (table[0..limit], 0..) |entry, rank| {
        try w.print("| {d} | `{s}` | {d} | {d} | {d} | {d} | {d} |\n", .{
            rank + 1,
            entry.command,
            entry.calls,
            entry.total_bytes,
            entry.median_bytes,
            entry.score,
            entry.eligible_calls,
        });
    }
    try std.Io.File.writeStreamingAll(file, io_ctx.io(), aw.written());
}

fn writeRetriesMd(allocator: std.mem.Allocator, rows: []const Row, out_dir: []const u8) !void {
    const result = try retryLoops(allocator, rows);
    defer {
        for (result.loops) |loop| {
            allocator.free(loop.sample);
            allocator.free(loop.verb);
        }
        allocator.free(result.loops);
    }

    const path = try std.fs.path.join(allocator, &.{ out_dir, "retries.md" });
    defer allocator.free(path);
    var file = try io_ctx.createAbs(path, .{ .read = false, .truncate = true });
    defer file.close(io_ctx.io());

    var aw = std.Io.Writer.Allocating.init(allocator);
    defer aw.deinit();
    const w = &aw.writer;

    try w.print("# Retry loops\n\n", .{});
    try w.print("Exact ≥3-repeat loops: {d}. Excess calls (beyond one per loop): {d}.\n\n", .{
        result.exact_count,
        result.excess,
    });
    try w.print("| Kind | Harness | Session | Verb | Repeats | Errors | Total B | Sample |\n", .{});
    try w.print("|---|---|---|---|---:|---:|---:|---|\n", .{});

    const limit = @min(result.loops.len, 50);
    for (result.loops[0..limit]) |loop| {
        try w.print("| {s} | {s} | `{s}` | `{s}` | {d} | {d} | {d} | `{s}` |\n", .{
            loop.kind,
            loop.harness,
            loop.session_id,
            loop.verb,
            loop.repeats,
            loop.errors,
            loop.total_bytes,
            loop.sample,
        });
    }
    try std.Io.File.writeStreamingAll(file, io_ctx.io(), aw.written());
}

fn writeHooksMd(allocator: std.mem.Allocator, rows: []const Row, out_dir: []const u8) !void {
    var session_paths = try collectSessionPaths(allocator, rows);
    defer {
        var it = session_paths.iterator();
        while (it.next()) |e| {
            allocator.free(e.key_ptr.*);
            allocator.free(e.value_ptr.*);
        }
        session_paths.deinit();
    }

    var hooks = HookMetrics.init(allocator);
    defer hooks.deinit();
    var scanned_cc: usize = 0;

    var it = session_paths.iterator();
    while (it.next()) |entry| {
        var parts = std.mem.splitScalar(u8, entry.key_ptr.*, 0x1f);
        const harness = parts.next() orelse "";
        if (!std.mem.eql(u8, harness, "cc")) continue;
        scanCcTranscript(allocator, entry.value_ptr.*, null, &hooks) catch continue;
        scanned_cc += 1;
    }

    var cmd_list = std.ArrayList(HookCommand).empty;
    defer cmd_list.deinit(allocator);
    var cit = hooks.commands.iterator();
    while (cit.next()) |c| try cmd_list.append(allocator, c.value_ptr.*);
    std.mem.sort(HookCommand, cmd_list.items, {}, hookCmdLess);

    var afplay_calls: u64 = 0;
    var afplay_ms: f64 = 0;
    var tower_calls: u64 = 0;
    var tower_ms: f64 = 0;
    for (cmd_list.items) |cmd| {
        if (std.mem.eql(u8, cmd.label, "afplay")) {
            afplay_calls = cmd.calls;
            afplay_ms = cmd.duration_ms;
        }
        if (isTowerLabel(cmd.label)) {
            tower_calls += cmd.calls;
            tower_ms += cmd.duration_ms;
        }
    }

    const path = try std.fs.path.join(allocator, &.{ out_dir, "hooks.md" });
    defer allocator.free(path);
    var file = try io_ctx.createAbs(path, .{ .read = false, .truncate = true });
    defer file.close(io_ctx.io());

    var aw = std.Io.Writer.Allocating.init(allocator);
    defer aw.deinit();
    const w = &aw.writer;

    try w.print("# Hook ledger (CC)\n\n", .{});
    if (scanned_cc == 0) {
        try w.print("No CC `source_path` values in rows — hook scan skipped. Populate `source_path` during extract.\n\n", .{});
    } else {
        const pct = if (hooks.duration_ms > 0) (afplay_ms / hooks.duration_ms) * 100 else 0;
        try w.print("Sessions scanned: {d}. Hook executions: {d}. Total duration: {d:.0} ms. Slow (>1s): {d}. Error items: {d}.\n\n", .{
            scanned_cc,
            hooks.events,
            hooks.duration_ms,
            hooks.slow_over_1s,
            hooks.error_items,
        });
        try w.print("`afplay`: {d} calls / {d:.0} ms ({d:.1}% of measured hook time).\n\n", .{
            afplay_calls,
            afplay_ms,
            pct,
        });
        try w.print("Tower-labelled hooks: {d} calls / {d:.0} ms.\n\n", .{ tower_calls, tower_ms });
        try w.print("| Command | Calls | Duration ms | Slow >1s |\n", .{});
        try w.print("|---|---:|---:|---:|\n", .{});
        const limit = @min(cmd_list.items.len, 30);
        for (cmd_list.items[0..limit]) |cmd| {
            try w.print("| `{s}` | {d} | {d:.0} | {d} |\n", .{
                cmd.label,
                cmd.calls,
                cmd.duration_ms,
                cmd.slow_over_1s,
            });
        }
    }
    try w.print("\n## Pi hooks\n\nUNKNOWN — `scan_pi` does not collect hook metrics (CC-only path per oracle).\n", .{});
    try std.Io.File.writeStreamingAll(file, io_ctx.io(), aw.written());
}

fn writeFailuresMd(allocator: std.mem.Allocator, rows: []const Row, out_dir: []const u8) !void {
    var session_paths = try collectSessionPaths(allocator, rows);
    defer {
        var it = session_paths.iterator();
        while (it.next()) |e| {
            allocator.free(e.key_ptr.*);
            allocator.free(e.value_ptr.*);
        }
        session_paths.deinit();
    }

    var wanted_by_session = std.StringHashMap(std.StringHashMap([]const u8)).init(allocator);
    defer {
        var sit = wanted_by_session.iterator();
        while (sit.next()) |se| {
            allocator.free(se.key_ptr.*);
            var wit = se.value_ptr.iterator();
            while (wit.next()) |we| allocator.free(we.key_ptr.*);
            se.value_ptr.deinit();
        }
        wanted_by_session.deinit();
    }

    for (rows) |row| {
        if (!row.is_error) continue;
        const skey = try std.fmt.allocPrint(allocator, "{s}\x1f{s}", .{ row.harness, row.session_id });
        const sg = try wanted_by_session.getOrPut(skey);
        if (!sg.found_existing) {
            sg.key_ptr.* = skey;
            sg.value_ptr.* = std.StringHashMap([]const u8).init(allocator);
        } else {
            allocator.free(skey);
        }
        try sg.value_ptr.put(try allocator.dupe(u8, row.call_id), "");
    }

    var results = std.StringHashMap([]const u8).init(allocator);
    defer {
        var rit = results.iterator();
        while (rit.next()) |r| {
            allocator.free(r.key_ptr.*);
            allocator.free(r.value_ptr.*);
        }
        results.deinit();
    }

    var sit = session_paths.iterator();
    while (sit.next()) |entry| {
        const parts = splitTwo(entry.key_ptr.*, 0x1f);
        const harness = parts[0];
        const session = parts[1];
        const skey = entry.key_ptr.*;
        var wanted = wanted_by_session.getPtr(skey) orelse continue;
        if (wanted.count() == 0) continue;
        if (std.mem.eql(u8, harness, "cc")) {
            try scanCcTranscript(allocator, entry.value_ptr.*, wanted, null);
        } else if (std.mem.eql(u8, harness, "pi")) {
            try scanPiTranscript(allocator, entry.value_ptr.*, wanted);
        }
        var wit = wanted.iterator();
        while (wit.next()) |we| {
            if (we.value_ptr.*.len == 0) continue;
            const rkey = try std.fmt.allocPrint(allocator, "{s}\x1f{s}\x1f{s}", .{ harness, session, we.key_ptr.* });
            try results.put(rkey, try allocator.dupe(u8, we.value_ptr.*));
        }
    }

    var categories = std.StringHashMap(usize).init(allocator);
    defer categories.deinit();
    var cat_verbs = std.StringHashMap(usize).init(allocator);
    defer cat_verbs.deinit();
    var error_total: usize = 0;

    for (rows) |row| {
        if (!row.is_error) continue;
        error_total += 1;
        const rkey = try std.fmt.allocPrint(allocator, "{s}\x1f{s}\x1f{s}", .{ row.harness, row.session_id, row.call_id });
        defer allocator.free(rkey);
        const result = results.get(rkey) orelse "";
        const category = try failureCategory(allocator, result);
        const g = try categories.getOrPut(category);
        if (!g.found_existing) g.value_ptr.* = 0;
        g.value_ptr.* += 1;
        const cmd = try commandKey(allocator, row);
        defer allocator.free(cmd);
        const vk = try std.fmt.allocPrint(allocator, "{s}\x1f{s}", .{ category, cmd });
        defer allocator.free(vk);
        const vg = try cat_verbs.getOrPut(vk);
        if (!vg.found_existing) vg.value_ptr.* = 0;
        vg.value_ptr.* += 1;
    }

    const path = try std.fs.path.join(allocator, &.{ out_dir, "failures.md" });
    defer allocator.free(path);
    var file = try io_ctx.createAbs(path, .{ .read = false, .truncate = true });
    defer file.close(io_ctx.io());

    var aw = std.Io.Writer.Allocating.init(allocator);
    defer aw.deinit();
    const w = &aw.writer;

    try w.print("# Failure catalog\n\n", .{});
    try w.print("Error-marked calls: {d}.\n\n", .{error_total});
    if (session_paths.count() == 0) {
        try w.print("No `source_path` in rows — categories inferred from empty result bodies (mostly generic).\n\n", .{});
    }
    try w.print("| Oracle label | Internal category | Count |\n", .{});
    try w.print("|---|---|---:|\n", .{});

    var cit = categories.iterator();
    while (cit.next()) |c| {
        try w.print("| {s} | `{s}` | {d} |\n", .{ oracleLabel(c.key_ptr.*), c.key_ptr.*, c.value_ptr.* });
    }
    try std.Io.File.writeStreamingAll(file, io_ctx.io(), aw.written());
}

fn hookCmdLess(_: void, a: HookCommand, b: HookCommand) bool {
    return a.duration_ms > b.duration_ms;
}

fn splitTwo(text: []const u8, delim: u8) struct { []const u8, []const u8 } {
    if (std.mem.indexOfScalar(u8, text, delim)) |idx| {
        return .{ text[0..idx], text[idx + 1 ..] };
    }
    return .{ text, "" };
}

fn parseBoolField(text: []const u8) bool {
    return text.len > 0 and (text[0] == '1' or text[0] == 't' or text[0] == 'T');
}

fn parseOptionalU64(text: []const u8) ?u64 {
    if (text.len == 0) return null;
    return std.fmt.parseInt(u64, text, 10) catch null;
}

fn parseOptionalU32(text: []const u8) ?u32 {
    if (text.len == 0) return null;
    return std.fmt.parseInt(u32, text, 10) catch null;
}

fn parseOptionalI32(text: []const u8) ?i32 {
    if (text.len == 0) return null;
    return std.fmt.parseInt(i32, text, 10) catch null;
}

fn readCsvRows(allocator: std.mem.Allocator, csv_path: []const u8) ![]Row {
    const data = try io_ctx.readFileAbs(allocator, csv_path);
    defer allocator.free(data);
    return try csv.readRows(allocator, data);
}

test "metric table ranks by score" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const a = std.testing.allocator;
    const rows = [_]Row{
        .{
            .harness = "cc",
            .batch = "1",
            .session_id = "s1",
            .cwd = "",
            .project_key = "",
            .source_path = "",
            .call_id = "c1",
            .ordinal = 1,
            .command = "echo hi",
            .command_safe = "echo hi",
            .command_sha256 = "a",
            .command_norm_sha256 = "a",
            .first_token = "echo",
            .verb = "echo",
            .subcommand = "",
            .compound = false,
            .pipe = false,
            .heredoc = false,
            .substitution = false,
            .machine_format = false,
            .result_bytes = 100,
            .result_lines = 1,
            .result_nonempty_lines = 1,
            .result_unique_lines = 1,
            .result_max_line_bytes = 100,
            .result_sha256 = "",
            .exit_code = 0,
            .is_error = false,
            .result_missing = false,
        },
        .{
            .harness = "cc",
            .batch = "1",
            .session_id = "s1",
            .cwd = "",
            .project_key = "",
            .source_path = "",
            .call_id = "c2",
            .ordinal = 2,
            .command = "echo there",
            .command_safe = "echo there",
            .command_sha256 = "b",
            .command_norm_sha256 = "b",
            .first_token = "echo",
            .verb = "echo",
            .subcommand = "",
            .compound = false,
            .pipe = false,
            .heredoc = false,
            .substitution = false,
            .machine_format = false,
            .result_bytes = 200,
            .result_lines = 1,
            .result_nonempty_lines = 1,
            .result_unique_lines = 1,
            .result_max_line_bytes = 200,
            .result_sha256 = "",
            .exit_code = 0,
            .is_error = false,
            .result_missing = false,
        },
    };
    const table = try metricTable(a, &rows);
    defer a.free(table);
    try std.testing.expect(table.len == 1);
    try std.testing.expectEqual(@as(usize, 2), table[0].calls);
    try std.testing.expectEqual(@as(u64, 150), table[0].median_bytes);
    try std.testing.expectEqual(@as(u64, 300), table[0].score);
}

test "exact retry loop excess" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const a = std.testing.allocator;
    var rows: [3]Row = undefined;
    for (0..3) |i| {
        rows[i] = .{
            .harness = "cc",
            .batch = "1",
            .session_id = "s1",
            .cwd = "",
            .project_key = "",
            .source_path = "",
            .call_id = "",
            .ordinal = @intCast(i + 1),
            .command = "ls",
            .command_safe = "ls",
            .command_sha256 = "x",
            .command_norm_sha256 = "same",
            .first_token = "ls",
            .verb = "ls",
            .subcommand = "",
            .compound = false,
            .pipe = false,
            .heredoc = false,
            .substitution = false,
            .machine_format = false,
            .result_bytes = 10,
            .result_lines = 1,
            .result_nonempty_lines = 1,
            .result_unique_lines = 1,
            .result_max_line_bytes = 10,
            .result_sha256 = "",
            .exit_code = 0,
            .is_error = false,
            .result_missing = false,
        };
        rows[i].call_id = try std.fmt.allocPrint(a, "c{d}", .{i + 1});
    }
    defer for (&rows) |*r| a.free(r.call_id);

    const result = try retryLoops(a, &rows);
    defer {
        for (result.loops) |l| {
            a.free(l.sample);
            a.free(l.verb);
        }
        a.free(result.loops);
    }
    try std.testing.expectEqual(@as(usize, 1), result.exact_count);
    try std.testing.expectEqual(@as(usize, 2), result.excess);
}

test "failure category maps syntax" {
    const a = std.testing.allocator;
    try std.testing.expectEqualStrings("syntax-error", try failureCategory(a, "bash: syntax error near unexpected token"));
    try std.testing.expectEqualStrings("dead-path", oracleLabel("no-such-file"));
}

test "failure category prefers dead-path over earlier timeout token in long output" {
    const a = std.testing.allocator;
    var buf: [12000]u8 = undefined;
    @memset(&buf, 'x');
    const tail = "circadian/.madewell: no such file or directory";
    const timeout_at = 6658;
    @memcpy(buf[timeout_at .. timeout_at + "killed_at_the_timeout".len], "killed_at_the_timeout");
    @memcpy(buf[buf.len - tail.len ..], tail);
    try std.testing.expectEqualStrings("no-such-file", try failureCategory(a, buf[0..]));
}

test "readCsvRows pass3 fixture count" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const rows = try readCsvRows(std.testing.allocator, "/Users/jrg/agent-core/primitives/tools/vein/test/acceptance/pass3-commands.csv");
    defer std.testing.allocator.free(rows);
    try std.testing.expectEqual(@as(usize, 988), rows.len);
}

test "fromRows writes four files" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const a = std.testing.allocator;
    const tmp = "/tmp/vein-report-test";
    io_ctx.deleteTreeAbs(tmp) catch {};
    try io_ctx.createDirPath(tmp);

    const rows = [_]Row{
        .{
            .harness = "cc",
            .batch = "1",
            .session_id = "s1",
            .cwd = "",
            .project_key = "",
            .source_path = "",
            .call_id = "c1",
            .ordinal = 1,
            .command = "grep foo",
            .command_safe = "grep foo",
            .command_sha256 = "h1",
            .command_norm_sha256 = "h1",
            .first_token = "grep",
            .verb = "grep",
            .subcommand = "",
            .compound = true,
            .pipe = false,
            .heredoc = false,
            .substitution = false,
            .machine_format = false,
            .result_bytes = 50,
            .result_lines = 1,
            .result_nonempty_lines = 1,
            .result_unique_lines = 1,
            .result_max_line_bytes = 50,
            .result_sha256 = "",
            .exit_code = 1,
            .is_error = true,
            .result_missing = false,
        },
    };
    try fromRows(a, &rows, tmp);
    try io_ctx.accessAbs(tmp ++ "/verbs.md");
    try io_ctx.accessAbs(tmp ++ "/retries.md");
    try io_ctx.accessAbs(tmp ++ "/hooks.md");
    try io_ctx.accessAbs(tmp ++ "/failures.md");
}
