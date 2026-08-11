const std = @import("std");
const Row = @import("lib.zig").Row;

pub const ClassifyResult = struct {
    first_token: []const u8,
    verb: []const u8,
    subcommand: []const u8,
    compound: bool,
    pipe: bool,
    heredoc: bool,
    substitution: bool,
    machine_format: bool,
    command_norm_sha256: []const u8,
};

pub const ResultMetrics = struct {
    result_bytes: ?u64,
    result_lines: ?u32,
    result_nonempty_lines: ?u32,
    result_unique_lines: ?u32,
    result_max_line_bytes: ?u32,
    result_sha256: []const u8,
};

pub const Selected = struct {
    session_id: []const u8,
    project_key: []const u8,
    path: []const u8,
};

const subcommand_verbs = std.StaticStringMap(void).initComptime(&.{
    .{ "git", {} },
    .{ "npm", {} },
    .{ "pnpm", {} },
    .{ "yarn", {} },
    .{ "bun", {} },
    .{ "npx", {} },
    .{ "python", {} },
    .{ "python3", {} },
    .{ "pytest", {} },
    .{ "cargo", {} },
    .{ "docker", {} },
    .{ "gh", {} },
    .{ "herdr", {} },
    .{ "rtk", {} },
});

const git_options_with_value = std.StaticStringMap(void).initComptime(&.{
    .{ "-C", {} },
    .{ "-c", {} },
    .{ "--git-dir", {} },
    .{ "--work-tree", {} },
    .{ "--namespace", {} },
    .{ "--exec-path", {} },
    .{ "--config-env", {} },
});

const bun_subcommands = std.StaticStringMap(void).initComptime(&.{
    .{ "add", {} },
    .{ "build", {} },
    .{ "create", {} },
    .{ "install", {} },
    .{ "link", {} },
    .{ "outdated", {} },
    .{ "pm", {} },
    .{ "publish", {} },
    .{ "remove", {} },
    .{ "run", {} },
    .{ "test", {} },
    .{ "unlink", {} },
    .{ "update", {} },
    .{ "upgrade", {} },
    .{ "x", {} },
});

const compound_breakers = [_][]const u8{ "&&", "||", ";", "|" };

pub fn sha256Hex(allocator: std.mem.Allocator, data: []const u8) ![]const u8 {
    var digest: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(data, &digest, .{});
    const hex = std.fmt.bytesToHex(&digest, .lower);
    return try allocator.dupe(u8, &hex);
}

fn isEnvAssignment(token: []const u8) bool {
    if (token.len == 0) return false;
    const c0 = token[0];
    if (!((c0 >= 'A' and c0 <= 'Z') or (c0 >= 'a' and c0 <= 'z') or c0 == '_')) return false;
    var i: usize = 1;
    while (i < token.len) : (i += 1) {
        const c = token[i];
        if (c == '=') return true;
        if (!((c >= 'A' and c <= 'Z') or (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '_')) return false;
    }
    return false;
}

fn normalizeCommand(allocator: std.mem.Allocator, command: []const u8) ![]const u8 {
    const trimmed = std.mem.trim(u8, command, " \t\r\n");
    var out: std.ArrayList(u8) = .empty;
    errdefer out.deinit(allocator);

    var in_space = false;
    for (trimmed) |c| {
        if (std.ascii.isWhitespace(c)) {
            if (!in_space) {
                try out.append(allocator, ' ');
                in_space = true;
            }
        } else {
            try out.append(allocator, c);
            in_space = false;
        }
    }
    return try out.toOwnedSlice(allocator);
}

/// POSIX-ish shlex.split; on failure falls back to whitespace split like Python.
fn shellTokens(allocator: std.mem.Allocator, command: []const u8) ![]const []const u8 {
    const parsed = shlexSplit(allocator, command) catch |err| switch (err) {
        error.InvalidShlex => {
            var list: std.ArrayList([]const u8) = .empty;
            errdefer list.deinit(allocator);
            var iter = std.mem.splitScalar(u8, std.mem.trim(u8, command, " \t\r\n"), ' ');
            while (iter.next()) |raw| {
                const tok = std.mem.trim(u8, raw, " \t\r\n");
                if (tok.len > 0) try list.append(allocator, try allocator.dupe(u8, tok));
            }
            return try list.toOwnedSlice(allocator);
        },
        else => return err,
    };
    return parsed;
}

fn shlexSplit(allocator: std.mem.Allocator, command: []const u8) ![]const []const u8 {
    var tokens: std.ArrayList([]const u8) = .empty;
    errdefer {
        for (tokens.items) |tok| allocator.free(tok);
        tokens.deinit(allocator);
    }

    var i: usize = 0;
    while (i < command.len) {
        if (std.ascii.isWhitespace(command[i])) {
            i += 1;
            continue;
        }

        var start = i;
        var end: usize = undefined;
        const c = command[i];
        if (c == '\'') {
            i += 1;
            start = i;
            while (i < command.len and command[i] != '\'') : (i += 1) {}
            if (i >= command.len) return error.InvalidShlex;
            end = i;
            i += 1;
        } else if (c == '"') {
            i += 1;
            var buf: std.ArrayList(u8) = .empty;
            errdefer buf.deinit(allocator);
            while (i < command.len) {
                if (command[i] == '"') break;
                if (command[i] == '\\' and i + 1 < command.len) {
                    i += 1;
                    try buf.append(allocator, command[i]);
                } else {
                    try buf.append(allocator, command[i]);
                }
                i += 1;
            }
            if (i >= command.len) return error.InvalidShlex;
            i += 1;
            try tokens.append(allocator, try buf.toOwnedSlice(allocator));
            continue;
        } else {
            while (i < command.len and !std.ascii.isWhitespace(command[i])) : (i += 1) {}
            end = i;
        }
        try tokens.append(allocator, try allocator.dupe(u8, command[start..end]));
    }
    return try tokens.toOwnedSlice(allocator);
}

fn detectCompound(command: []const u8) bool {
    if (std.mem.indexOfScalar(u8, command, '\n')) |_| return true;
    var i: usize = 0;
    while (i < command.len) {
        if (i + 1 < command.len and command[i] == '&' and command[i + 1] == '&') {
            if (i == 0 or (command[i - 1] != '|' and command[i - 1] != '&')) {
                const after = i + 2;
                if (after >= command.len or std.ascii.isWhitespace(command[after])) return true;
            }
        }
        if (i + 1 < command.len and command[i] == '|' and command[i + 1] == '|') {
            if (i == 0 or (command[i - 1] != '|' and command[i - 1] != '&')) {
                const after = i + 2;
                if (after >= command.len or std.ascii.isWhitespace(command[after])) return true;
            }
        }
        if (command[i] == ';') {
            if (i == 0 or (command[i - 1] != '|' and command[i - 1] != '&')) {
                const after = i + 1;
                if (after >= command.len or std.ascii.isWhitespace(command[after])) return true;
            }
        }
        i += 1;
    }
    return false;
}

fn detectPipe(command: []const u8) bool {
    var i: usize = 0;
    while (i < command.len) : (i += 1) {
        if (command[i] != '|') continue;
        if (i > 0 and command[i - 1] == '|') continue;
        if (i + 1 < command.len and command[i + 1] == '|') continue;
        return true;
    }
    return false;
}

fn tokenInList(tokens: []const []const u8, needle: []const u8) bool {
    for (tokens) |tok| {
        if (std.mem.eql(u8, tok, needle)) return true;
    }
    return false;
}

fn extractSubcommand(verb: []const u8, remaining: []const []const u8) []const u8 {
    var skip_next = false;
    for (remaining) |token| {
        for (compound_breakers) |breaker| {
            if (std.mem.eql(u8, token, breaker)) return "";
        }
        if (skip_next) {
            skip_next = false;
            continue;
        }
        if (std.mem.eql(u8, verb, "git") and git_options_with_value.has(token)) {
            skip_next = true;
            continue;
        }
        if (std.mem.startsWith(u8, token, "-")) continue;
        if (isEnvAssignment(token)) continue;
        if (std.mem.eql(u8, verb, "bun") and !bun_subcommands.has(token)) return "[script]";
        return token;
    }
    return "";
}

/// Port of mining_common.classify.
pub fn classify(allocator: std.mem.Allocator, command: []const u8) !ClassifyResult {
    const tokens = try shellTokens(allocator, command);
    defer {
        for (tokens) |tok| allocator.free(tok);
        allocator.free(tokens);
    }

    var index: usize = 0;
    while (index < tokens.len and isEnvAssignment(tokens[index])) index += 1;

    if (index < tokens.len and std.mem.eql(u8, tokens[index], "env")) {
        index += 1;
        while (index < tokens.len and (std.mem.startsWith(u8, tokens[index], "-") or isEnvAssignment(tokens[index]))) {
            index += 1;
        }
    }

    if (index < tokens.len and std.mem.eql(u8, tokens[index], "sudo")) {
        index += 1;
        while (index < tokens.len and std.mem.startsWith(u8, tokens[index], "-")) index += 1;
    }

    const first = if (index < tokens.len) tokens[index] else "";
    const verb = if (first.len > 0) std.fs.path.basename(first) else "";
    const subcommand = if (subcommand_verbs.has(verb))
        extractSubcommand(verb, if (index + 1 < tokens.len) tokens[index + 1 ..] else &[_][]const u8{})
    else
        "";

    const normalized = try normalizeCommand(allocator, command);
    defer allocator.free(normalized);

    return .{
        .first_token = try allocator.dupe(u8, first),
        .verb = try allocator.dupe(u8, verb),
        .subcommand = try allocator.dupe(u8, subcommand),
        .compound = detectCompound(command),
        .pipe = detectPipe(command),
        .heredoc = std.mem.indexOf(u8, command, "<<") != null,
        .substitution = std.mem.indexOf(u8, command, "$(") != null or std.mem.indexOfScalar(u8, command, '`') != null,
        .machine_format = blk: {
            const flags = [_][]const u8{ "--porcelain", "--format", "--json", "-0", "-c" };
            for (flags) |flag| {
                if (tokenInList(tokens, flag)) break :blk true;
            }
            break :blk false;
        },
        .command_norm_sha256 = try sha256Hex(allocator, normalized),
    };
}

fn redactKeyValue(safe: *std.ArrayList(u8), allocator: std.mem.Allocator, source: []const u8) !void {
    const keys = [_][]const u8{ "api_key", "api-key", "apikey", "token", "password", "secret", "authorization" };
    var i: usize = 0;
    while (i < source.len) {
        var matched = false;
        for (keys) |key| {
            if (i + key.len > source.len) continue;
            if (!eqAscii(source[i..][0..key.len], key)) continue;
            if (i > 0 and isWordChar(source[i - 1])) continue;
            var j = i + key.len;
            while (j < source.len and std.ascii.isWhitespace(source[j])) j += 1;
            if (j >= source.len or source[j] != '=') continue;
            j += 1;
            while (j < source.len and std.ascii.isWhitespace(source[j])) j += 1;
            try safe.appendSlice(allocator, source[i..][0..key.len]);
            try safe.appendSlice(allocator, "=[REDACTED]");
            i = j;
            while (i < source.len and !std.ascii.isWhitespace(source[i])) i += 1;
            matched = true;
            break;
        }
        if (matched) continue;
        try safe.append(allocator, source[i]);
        i += 1;
    }
}

fn eqAscii(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;
    for (a, b) |ca, cb| {
        if (std.ascii.toLower(ca) != std.ascii.toLower(cb)) return false;
    }
    return true;
}

fn isWordChar(c: u8) bool {
    return (c >= 'A' and c <= 'Z') or (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '_';
}

fn redactBearer(safe: *std.ArrayList(u8), allocator: std.mem.Allocator, source: []const u8) !void {
    var i: usize = 0;
    while (i < source.len) {
        if (i + 7 <= source.len and eqAscii(source[i..][0..7], "bearer ")) {
            try safe.appendSlice(allocator, "Bearer [REDACTED]");
            i += 7;
            while (i < source.len and !std.ascii.isWhitespace(source[i])) i += 1;
            continue;
        }
        try safe.append(allocator, source[i]);
        i += 1;
    }
}

fn redactPrefixedSecrets(safe: *std.ArrayList(u8), allocator: std.mem.Allocator, source: []const u8) !void {
    const prefixes = [_][]const u8{ "sk", "ghp", "github_pat", "xoxb", "xoxa", "xoxp", "xoxr", "xoxs" };
    var i: usize = 0;
    while (i < source.len) {
        var matched = false;
        for (prefixes) |prefix| {
            if (i + prefix.len >= source.len) continue;
            if (!std.mem.startsWith(u8, source[i..], prefix)) continue;
            if (i > 0 and isWordChar(source[i - 1])) continue;
            const sep = source[i + prefix.len];
            if (sep != '-' and sep != '_') continue;
            var j = i + prefix.len + 1;
            var tail_len: usize = 0;
            while (j < source.len) : (j += 1) {
                const c = source[j];
                if (!((c >= 'A' and c <= 'Z') or (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '_' or c == '-')) break;
                tail_len += 1;
            }
            if (tail_len < 12) continue;
            if (i > 0 and isWordChar(source[i - 1])) continue;
            try safe.appendSlice(allocator, "[REDACTED]");
            i = j;
            matched = true;
            break;
        }
        if (matched) continue;
        try safe.append(allocator, source[i]);
        i += 1;
    }
}

/// Port of mining_common.redact.
pub fn redact(allocator: std.mem.Allocator, command: []const u8) ![]const u8 {
    var stage1: std.ArrayList(u8) = .empty;
    defer stage1.deinit(allocator);
    try redactKeyValue(&stage1, allocator, command);

    var stage2: std.ArrayList(u8) = .empty;
    defer stage2.deinit(allocator);
    try redactBearer(&stage2, allocator, stage1.items);

    var stage3: std.ArrayList(u8) = .empty;
    defer stage3.deinit(allocator);
    try redactPrefixedSecrets(&stage3, allocator, stage2.items);

    const capped = if (stage3.items.len > 500) stage3.items[0..500] else stage3.items;
    return try allocator.dupe(u8, capped);
}

/// Port of mining_common.result_metrics.
pub fn resultMetrics(allocator: std.mem.Allocator, result: []const u8) !ResultMetrics {
    const encoded = result;
    var lines = std.mem.splitScalar(u8, encoded, '\n');
    var line_count: u32 = 0;
    var nonempty_count: u32 = 0;
    var max_line_bytes: u32 = 0;
    var unique = std.StringHashMap(void).init(allocator);
    defer {
        var it = unique.keyIterator();
        while (it.next()) |key| allocator.free(key.*);
        unique.deinit();
    }

    while (lines.next()) |line| {
        line_count += 1;
        const line_bytes = @as(u32, @intCast(line.len));
        if (line_bytes > max_line_bytes) max_line_bytes = line_bytes;
        if (std.mem.trim(u8, line, " \t\r").len > 0) {
            nonempty_count += 1;
            const gop = try unique.getOrPut(try allocator.dupe(u8, line));
            if (gop.found_existing) allocator.free(gop.key_ptr.*);
        }
    }

    return .{
        .result_bytes = @intCast(encoded.len),
        .result_lines = line_count,
        .result_nonempty_lines = nonempty_count,
        .result_unique_lines = @intCast(unique.count()),
        .result_max_line_bytes = max_line_bytes,
        .result_sha256 = try sha256Hex(allocator, encoded),
    };
}

fn parseExitFromStructured(structured: ?[]const u8) ?i32 {
    const s = structured orelse return null;
    const keys = [_][]const u8{ "exitCode", "exit_code", "code" };
    for (keys) |key| {
        const needle = std.fmt.allocPrint(std.heap.page_allocator, "\"{s}\"" , .{key}) catch continue;
        defer std.heap.page_allocator.free(needle);
        if (std.mem.indexOf(u8, s, needle)) |pos| {
            const tail = s[pos + needle.len ..];
            if (std.mem.indexOfScalar(u8, tail, ':')) |colon| {
                const num_start = colon + 1;
                var end = num_start;
                while (end < tail.len and (tail[end] == ' ' or tail[end] == '\t')) end += 1;
                const sign: i32 = if (end < tail.len and tail[end] == '-') blk: {
                    end += 1;
                    break :blk -1;
                } else 1;
                var value: i32 = 0;
                var got_digit = false;
                while (end < tail.len and tail[end] >= '0' and tail[end] <= '9') : (end += 1) {
                    got_digit = true;
                    value = value * 10 + (tail[end] - '0');
                }
                if (got_digit) return value * sign;
            }
        }
    }
    return null;
}

fn scanExitPattern(result: []const u8, prefix: []const u8) ?i32 {
    var search_from: usize = 0;
    while (search_from <= result.len) {
        const hay = if (search_from == 0) result else result[search_from - 1 ..];
        if (std.mem.indexOfIgnoreCase(u8, hay, prefix)) |rel| {
            const abs = if (search_from == 0) rel else search_from - 1 + rel;
            var i = abs + prefix.len;
            while (i < result.len and result[i] != '-' and (result[i] < '0' or result[i] > '9')) i += 1;
            const negative = i < result.len and result[i] == '-';
            if (negative) i += 1;
            var value: i32 = 0;
            var got = false;
            while (i < result.len and result[i] >= '0' and result[i] <= '9') {
                got = true;
                value = value * 10 + (result[i] - '0');
                i += 1;
            }
            if (got) return if (negative) -value else value;
            search_from = abs + 1;
        } else break;
    }
    return null;
}

/// Port of mining_common.exit_code_from.
pub fn exitCodeFrom(result: ?[]const u8, structured: ?[]const u8) ?i32 {
    if (parseExitFromStructured(structured)) |code| return code;
    const text = result orelse return null;
    const patterns = [_][]const u8{
        "Exit code:",
        "Process exited with code",
        "Command failed with exit code",
    };
    for (patterns) |pat| {
        if (scanExitPattern(text, pat)) |code| return code;
    }
    return null;
}

/// Port of mining_common.make_row.
pub fn makeRow(
    allocator: std.mem.Allocator,
    harness: []const u8,
    batch: []const u8,
    selected: Selected,
    call_id: []const u8,
    ordinal: u32,
    command: []const u8,
    result: []const u8,
    exit_code: ?i32,
    is_error: bool,
    result_missing: bool,
    cwd: ?[]const u8,
) !Row {
    const cls = try classify(allocator, command);
    const metrics = try resultMetrics(allocator, result);
    const safe = try redact(allocator, command);

    return .{
        .harness = try allocator.dupe(u8, harness),
        .batch = try allocator.dupe(u8, batch),
        .session_id = try allocator.dupe(u8, selected.session_id),
        .cwd = try allocator.dupe(u8, cwd orelse selected.project_key),
        .project_key = try allocator.dupe(u8, selected.project_key),
        .source_path = try allocator.dupe(u8, selected.path),
        .call_id = try allocator.dupe(u8, call_id),
        .ordinal = ordinal,
        .command = try allocator.dupe(u8, command),
        .command_safe = safe,
        .command_sha256 = try sha256Hex(allocator, command),
        .command_norm_sha256 = try allocator.dupe(u8, cls.command_norm_sha256),
        .first_token = cls.first_token,
        .verb = cls.verb,
        .subcommand = cls.subcommand,
        .compound = cls.compound,
        .pipe = cls.pipe,
        .heredoc = cls.heredoc,
        .substitution = cls.substitution,
        .machine_format = cls.machine_format,
        .result_bytes = metrics.result_bytes,
        .result_lines = metrics.result_lines,
        .result_nonempty_lines = metrics.result_nonempty_lines,
        .result_unique_lines = metrics.result_unique_lines,
        .result_max_line_bytes = metrics.result_max_line_bytes,
        .result_sha256 = metrics.result_sha256,
        .exit_code = exit_code,
        .is_error = is_error,
        .result_missing = result_missing,
    };
}

test "env and sudo stripping matches python semantics" {
    const allocator = std.testing.allocator;
    const cls = try classify(allocator, "FOO=bar git status");
    defer allocator.free(cls.first_token);
    defer allocator.free(cls.verb);
    defer allocator.free(cls.subcommand);
    defer allocator.free(cls.command_norm_sha256);
    try std.testing.expectEqualStrings("git", cls.first_token);
    try std.testing.expectEqualStrings("git", cls.verb);
    try std.testing.expectEqualStrings("status", cls.subcommand);

    const cls2 = try classify(allocator, "env -i VAR=x sudo -u root ls");
    defer allocator.free(cls2.first_token);
    defer allocator.free(cls2.verb);
    defer allocator.free(cls2.subcommand);
    defer allocator.free(cls2.command_norm_sha256);
    try std.testing.expectEqualStrings("root", cls2.first_token);
}

test "bun script subcommand" {
    const allocator = std.testing.allocator;
    const cls = try classify(allocator, "bun myscript.ts");
    defer allocator.free(cls.first_token);
    defer allocator.free(cls.verb);
    defer allocator.free(cls.subcommand);
    defer allocator.free(cls.command_norm_sha256);
    try std.testing.expectEqualStrings("[script]", cls.subcommand);

    const cls2 = try classify(allocator, "bun run dev");
    defer allocator.free(cls2.subcommand);
    defer allocator.free(cls2.first_token);
    defer allocator.free(cls2.verb);
    defer allocator.free(cls2.command_norm_sha256);
    try std.testing.expectEqualStrings("run", cls2.subcommand);
}

test "compound pipe heredoc substitution machine_format flags" {
    const allocator = std.testing.allocator;
    const c1 = try classify(allocator, "cmd1 && cmd2");
    defer freeClassify(allocator, c1);
    try std.testing.expect(c1.compound);

    const c2 = try classify(allocator, "echo a | grep b");
    defer freeClassify(allocator, c2);
    try std.testing.expect(c2.pipe);
    try std.testing.expect(!c2.compound);

    const c3 = try classify(allocator, "cat << EOF");
    defer freeClassify(allocator, c3);
    try std.testing.expect(c3.heredoc);

    const c4 = try classify(allocator, "echo $(pwd)");
    defer freeClassify(allocator, c4);
    try std.testing.expect(c4.substitution);

    const c5 = try classify(allocator, "git status --porcelain");
    defer freeClassify(allocator, c5);
    try std.testing.expect(c5.machine_format);
}

test "redact secret patterns" {
    const allocator = std.testing.allocator;
    const safe = try redact(allocator, "API_KEY=secret123 token=abc Bearer sk_live_abcdefghijkl");
    defer allocator.free(safe);
    try std.testing.expect(std.mem.indexOf(u8, safe, "[REDACTED]") != null);
    try std.testing.expect(std.mem.indexOf(u8, safe, "secret123") == null);
}

test "result metrics and exit code parsing" {
    const allocator = std.testing.allocator;
    const metrics = try resultMetrics(allocator, "a\n\nb\nb");
    defer allocator.free(metrics.result_sha256);
    try std.testing.expectEqual(@as(?u32, 4), metrics.result_lines);
    try std.testing.expectEqual(@as(?u32, 2), metrics.result_nonempty_lines);
    try std.testing.expectEqual(@as(?u32, 2), metrics.result_unique_lines);

    try std.testing.expectEqual(@as(?i32, 7), exitCodeFrom("Exit code: 7\n", null));
    try std.testing.expectEqual(@as(?i32, null), exitCodeFrom("ok", null));
}

fn freeClassify(allocator: std.mem.Allocator, cls: ClassifyResult) void {
    allocator.free(cls.first_token);
    allocator.free(cls.verb);
    allocator.free(cls.subcommand);
    allocator.free(cls.command_norm_sha256);
}
