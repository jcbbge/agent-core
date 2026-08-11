const std = @import("std");
const slim = @import("slim");
const rules = slim.rules;
const rewrite = slim.rewrite;
const runner = slim.runner;
const git_log = slim.git_log;

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

    if (std.mem.eql(u8, args[1], "--version")) {
        try writeAll(io, try std.fmt.allocPrint(allocator, "slim {s}\n", .{rules.version}));
        return;
    }
    if (std.mem.eql(u8, args[1], "--help") or std.mem.eql(u8, args[1], "-h")) {
        try printHelp(io);
        return;
    }

    if (std.mem.eql(u8, args[1], "rewrite")) {
        if (args.len < 3) {
            try writeAll(io, "usage: slim rewrite \"<command>\"\n");
            std.process.exit(2);
        }
        const cmd = args[2];
        const result = try rewrite.rewrite(allocator, init.environ_map, cmd);
        if (result) |out| {
            try writeAll(io, out);
        } else {
            std.process.exit(1);
        }
        return;
    }

    if (std.mem.eql(u8, args[1], "ls")) {
        const code = try runner.run(io, allocator, .ls, args[2..], "/bin/ls");
        std.process.exit(code);
    }

    if (std.mem.eql(u8, args[1], "ps")) {
        const code = try runner.run(io, allocator, .ps, args[2..], "/bin/ps");
        std.process.exit(code);
    }

    if (std.mem.eql(u8, args[1], "wc")) {
        const code = try runner.run(io, allocator, .wc, args[2..], "/usr/bin/wc");
        std.process.exit(code);
    }

    if (std.mem.eql(u8, args[1], "df")) {
        const code = try runner.run(io, allocator, .df, args[2..], "/bin/df");
        std.process.exit(code);
    }

    if (std.mem.eql(u8, args[1], "git")) {
        const git_args = args[2..];
        const sub_idx = findGitSubcommand(git_args) orelse {
            try writeAll(io, "unknown git subcommand\n");
            std.process.exit(2);
        };
        const sub = git_args[sub_idx];

        if (std.mem.eql(u8, sub, "status")) {
            if (hasMachinePorcelain(git_args)) {
                var argv = std.array_list.Managed([]const u8).init(allocator);
                try argv.append("/usr/bin/git");
                try argv.appendSlice(git_args);
                const code = try runner.runWithArgv(io, allocator, .git_status, git_args, argv.items);
                std.process.exit(code);
            }
            const git_argv = try runner.buildGitStatusArgv(allocator, git_args);
            const code = try runner.runWithArgv(io, allocator, .git_status, git_args, git_argv);
            std.process.exit(code);
        }

        if (std.mem.eql(u8, sub, "log")) {
            if (git_log.hasMachineFormat(git_args)) {
                var argv = std.array_list.Managed([]const u8).init(allocator);
                try argv.append("/usr/bin/git");
                try argv.appendSlice(git_args);
                const code = try runner.runWithArgv(io, allocator, .git_log, git_args, argv.items);
                std.process.exit(code);
            }
            const git_argv = try runner.buildGitLogArgv(allocator, git_args);
            const code = try runner.runWithArgv(io, allocator, .git_log, git_args, git_argv);
            std.process.exit(code);
        }

        try writeAll(io, try std.fmt.allocPrint(allocator, "unknown git subcommand: {s}\n", .{sub}));
        std.process.exit(2);
    }

    try writeAll(io, try std.fmt.allocPrint(allocator, "unknown subcommand: {s}\n", .{args[1]}));
    std.process.exit(2);
}

fn writeAll(io: std.Io, bytes: []const u8) !void {
    try std.Io.File.writeStreamingAll(.stdout(), io, bytes);
}

fn findGitSubcommand(git_args: []const []const u8) ?usize {
    var i: usize = 0;
    while (i < git_args.len) {
        if (std.mem.eql(u8, git_args[i], "-C")) {
            i += 2;
            continue;
        }
        if (std.mem.eql(u8, git_args[i], "status") or std.mem.eql(u8, git_args[i], "log")) return i;
        return null;
    }
    return null;
}

fn hasMachinePorcelain(git_args: []const []const u8) bool {
    for (git_args) |a| {
        if (std.mem.eql(u8, a, "--porcelain") or std.mem.eql(u8, a, "-s") or std.mem.eql(u8, a, "--short")) return true;
    }
    return false;
}

fn printHelp(io: std.Io) !void {
    const help =
        \\slim — six-verb native output compactor
        \\
        \\usage:
        \\  slim rewrite "<command>"
        \\  slim ls [args...]
        \\  slim ps [args...]
        \\  slim wc [args...]
        \\  slim df [args...]
        \\  slim git status [args...]
        \\  slim git log [args...]
        \\  slim --version
        \\  slim --help
        \\
    ;
    try writeAll(io, help);
}
