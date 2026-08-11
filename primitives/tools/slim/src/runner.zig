const std = @import("std");
const rules = @import("rules.zig");
const ls = @import("filters/ls.zig");
const psdf = @import("filters/psdf.zig");
const wc = @import("filters/wc.zig");
const git_status = @import("filters/git_status.zig");
const git_log = @import("filters/git_log.zig");

pub const Verb = enum {
    ls,
    ps,
    wc,
    df,
    git_status,
    git_log,
};

pub fn run(io: std.Io, allocator: std.mem.Allocator, verb: Verb, user_argv: []const []const u8, native_path: []const u8) !u8 {
    var argv = std.array_list.Managed([]const u8).init(allocator);
    defer argv.deinit();
    try argv.append(native_path);
    try argv.appendSlice(user_argv);
    return runWithArgv(io, allocator, verb, user_argv, argv.items);
}

pub fn runWithArgv(
    io: std.Io,
    allocator: std.mem.Allocator,
    verb: Verb,
    filter_argv: []const []const u8,
    spawn_argv: []const []const u8,
) !u8 {
    var child = try std.process.spawn(io, .{
        .argv = spawn_argv,
        .stdin = .inherit,
        .stdout = .pipe,
        .stderr = .inherit,
    });
    defer child.kill(io);

    var raw: std.ArrayList(u8) = .empty;
    defer raw.deinit(allocator);
    var hit_cap = false;

    if (child.stdout) |stdout_file| {
        var read_buf: [8192]u8 = undefined;
        var file_reader = stdout_file.readerStreaming(io, &read_buf);
        while (true) {
            var chunk: [4096]u8 = undefined;
            const n = file_reader.interface.readSliceShort(&chunk) catch break;
            if (n == 0) break;
            if (raw.items.len + n > rules.stdout_cap) {
                hit_cap = true;
                try raw.appendSlice(allocator, chunk[0..n]);
                _ = file_reader.interface.discardRemaining() catch {};
                break;
            }
            try raw.appendSlice(allocator, chunk[0..n]);
        }
    }

    const term = try child.wait(io);
    const code: u8 = switch (term) {
        .exited => |c| c,
        else => 1,
    };

    const stdout = try allocator.dupe(u8, raw.items);
    defer allocator.free(stdout);

    if (code != 0 or hit_cap) {
        try std.Io.File.writeStreamingAll(.stdout(), io, stdout);
        return code;
    }

    const compact = filter(allocator, verb, filter_argv, stdout) catch try allocator.dupe(u8, stdout);
    defer allocator.free(compact);
    try std.Io.File.writeStreamingAll(.stdout(), io, compact);
    return code;
}

fn filter(allocator: std.mem.Allocator, verb: Verb, argv: []const []const u8, raw: []const u8) ![]u8 {
    return switch (verb) {
        .ls => ls.filter(allocator, raw),
        .ps => psdf.filterPs(allocator, raw, rules.ps_width, rules.ps_rows),
        .df => psdf.filterDf(allocator, raw, rules.df_width, rules.df_rows),
        .wc => wc.filter(allocator, argv, raw),
        .git_status => git_status.filter(allocator, raw),
        .git_log => git_log.filter(allocator, raw, git_log.bodyWidth(argv)),
    };
}

pub fn buildGitStatusArgv(allocator: std.mem.Allocator, user_argv: []const []const u8) ![][]const u8 {
    var args = std.array_list.Managed([]const u8).init(allocator);
    errdefer args.deinit();
    try args.append("/usr/bin/git");

    var has_porcelain = false;
    for (user_argv) |a| {
        if (std.mem.eql(u8, a, "--porcelain") or std.mem.eql(u8, a, "-s") or std.mem.eql(u8, a, "--short")) {
            has_porcelain = true;
        }
        try args.append(a);
    }
    if (!has_porcelain) {
        try args.append("--porcelain");
        try args.append("-b");
    }
    return args.toOwnedSlice();
}

pub fn buildGitLogArgv(allocator: std.mem.Allocator, user_argv: []const []const u8) ![][]const u8 {
    var args = std.array_list.Managed([]const u8).init(allocator);
    errdefer args.deinit();
    try args.append("/usr/bin/git");

    var i: usize = 0;
    while (i < user_argv.len) : (i += 1) {
        const a = user_argv[i];
        if (std.mem.eql(u8, a, "-C") and i + 1 < user_argv.len) {
            try args.append("-C");
            try args.append(user_argv[i + 1]);
            i += 1;
            continue;
        }
        break;
    }

    try args.append("log");
    i = 0;
    while (i < user_argv.len) : (i += 1) {
        const a = user_argv[i];
        if (std.mem.eql(u8, a, "log")) continue;
        if (std.mem.eql(u8, a, "-C") and i + 1 < user_argv.len) {
            i += 1;
            continue;
        }
        try args.append(a);
    }

    try args.append("--no-merges");
    try args.append("--pretty=format:%h %s (%ar) <%an>%n%b%n---END---");

    if (git_log.parseCount(user_argv) == null) {
        try args.append("-n");
        try args.append("10");
    }

    return args.toOwnedSlice();
}
