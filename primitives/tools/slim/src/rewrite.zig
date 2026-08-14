const std = @import("std");
const rules = @import("rules.zig");
const Allocator = std.mem.Allocator;

const dollar_paren: []const u8 = &[_]u8{ '$', '(' };
const dollar_double_paren_space: []const u8 = &[_]u8{ '$', '(', '(', ' ' };

fn hasBlockedMetachar(cmd: []const u8) bool {
    for (rules.blocked_metachars) |m| {
        if (std.mem.indexOf(u8, cmd, m) != null) return true;
    }
    if (std.mem.indexOf(u8, cmd, dollar_paren) != null) return true;
    if (std.mem.indexOf(u8, cmd, dollar_double_paren_space) != null) return true;
    if (std.mem.indexOfScalar(u8, cmd, '(')) |_| return true;
    if (std.mem.indexOfScalar(u8, cmd, ')')) |_| return true;
    return false;
}

fn hasBlockedGitFlag(args: []const u8) bool {
    var iter = std.mem.tokenizeScalar(u8, args, ' ');
    while (iter.next()) |tok| {
        for (rules.blocked_git_flags) |flag| {
            if (std.mem.eql(u8, tok, flag)) return true;
            if (std.mem.startsWith(u8, tok, "--pretty=")) return true;
            if (std.mem.startsWith(u8, tok, "--format=")) return true;
        }
    }
    return false;
}

fn isAssignment(tok: []const u8) bool {
    const eq = std.mem.indexOfScalar(u8, tok, '=') orelse return false;
    if (eq == 0) return false;
    if (!(std.ascii.isAlphabetic(tok[0]) or tok[0] == '_')) return false;
    for (tok[0..eq]) |c| {
        if (!(std.ascii.isAlphanumeric(c) or c == '_')) return false;
    }
    return true;
}

fn rewriteCore(allocator: Allocator, tokens: []const []const u8) !?[]u8 {
    if (tokens.len == 0) return null;
    const first = tokens[0];

    if (std.mem.eql(u8, first, "git")) {
        var idx: usize = 1;
        if (idx + 1 < tokens.len and std.mem.eql(u8, tokens[idx], "-C")) {
            idx += 2;
        }
        if (idx >= tokens.len) return null;
        const sub = tokens[idx];
        idx += 1;
        if (!std.mem.eql(u8, sub, "status") and !std.mem.eql(u8, sub, "log")) return null;
        const args = if (idx < tokens.len) try std.mem.join(allocator, " ", tokens[idx..]) else try allocator.dupe(u8, "");
        defer allocator.free(args);
        if (hasBlockedGitFlag(args)) return null;

        var git_cmd = std.array_list.Managed(u8).init(allocator);
        errdefer git_cmd.deinit();
        try git_cmd.appendSlice("git");
        if (tokens.len >= 3 and std.mem.eql(u8, tokens[1], "-C")) {
            try git_cmd.appendSlice(" -C ");
            try git_cmd.appendSlice(tokens[2]);
        }
        try git_cmd.append(' ');
        try git_cmd.appendSlice(sub);
        if (args.len > 0) {
            try git_cmd.append(' ');
            try git_cmd.appendSlice(args);
        }
        const out = try std.fmt.allocPrint(allocator, "slim {s}", .{git_cmd.items});
        git_cmd.deinit();
        return out;
    }

    if (std.mem.eql(u8, first, "ls") or std.mem.eql(u8, first, "ps") or
        std.mem.eql(u8, first, "wc") or std.mem.eql(u8, first, "df"))
    {
        const core = try std.mem.join(allocator, " ", tokens);
        defer allocator.free(core);
        return try std.fmt.allocPrint(allocator, "slim {s}", .{core});
    }
    return null;
}

pub fn rewrite(allocator: Allocator, environ: ?*const std.process.Environ.Map, cmd: []const u8) !?[]u8 {
    const trimmed = std.mem.trim(u8, cmd, &[_]u8{' ', '\t', '\n', '\r'});
    if (trimmed.len == 0) return null;
    if (hasBlockedMetachar(trimmed)) return null;

    if (environ) |map| {
        if (map.get("SLIM_DISABLED")) |val| {
            if (std.mem.eql(u8, val, "1")) return null;
        }
    }

    var token_buf: [64][]const u8 = undefined;
    var token_count: usize = 0;
    var it = std.mem.tokenizeScalar(u8, trimmed, ' ');
    while (it.next()) |tok| {
        if (token_count >= token_buf.len) return null;
        token_buf[token_count] = tok;
        token_count += 1;
    }
    if (token_count == 0) return null;

    var prefix = std.array_list.Managed(u8).init(allocator);
    defer prefix.deinit();
    var idx: usize = 0;
    while (idx < token_count) {
        const tok = token_buf[idx];
        if (std.mem.eql(u8, tok, "sudo")) {
            try prefix.appendSlice("sudo ");
            idx += 1;
            continue;
        }
        if (std.mem.eql(u8, tok, "env")) {
            try prefix.appendSlice("env ");
            idx += 1;
            continue;
        }
        if (isAssignment(tok)) {
            try prefix.appendSlice(tok);
            try prefix.append(' ');
            idx += 1;
            continue;
        }
        break;
    }
    if (idx >= token_count) return null;

    const core_tokens = token_buf[idx..token_count];
    const tail = (try rewriteCore(allocator, core_tokens)) orelse return null;
    errdefer allocator.free(tail);

    if (prefix.items.len == 0) return tail;
    const out = try std.fmt.allocPrint(allocator, "{s}{s}", .{ prefix.items, tail });
    allocator.free(tail);
    return out;
}

pub fn hasBlockedMetacharPublic(cmd: []const u8) bool {
    return hasBlockedMetachar(cmd);
}

test "hasBlocked ls false" {
    try std.testing.expect(!hasBlockedMetachar("ls"));
}

test "rewriteCore ls" {
    const a = std.testing.allocator;
    const tokens = [_][]const u8{"ls"};
    const core = try rewriteCore(a, &tokens);
    try std.testing.expect(core != null);
    defer a.free(core.?);
    try std.testing.expectEqualStrings("slim ls", core.?);
}

test "rewrite ls simple" {
    const a = std.testing.allocator;
    const r = try rewrite(a, null, "ls");
    try std.testing.expect(r != null);
    defer a.free(r.?);
    try std.testing.expectEqualStrings("slim ls", r.?);
}
