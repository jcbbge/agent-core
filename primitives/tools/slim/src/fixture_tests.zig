const std = @import("std");

const git_bin = "/usr/bin/git";
const slim_bin = "zig-out/bin/slim";

/// Project root = cwd (build.zig sets test cwd to the slim package root).
fn relPath(alloc: std.mem.Allocator, parts: []const []const u8) ![]const u8 {
    return std.fs.path.join(alloc, parts);
}

fn readGolden(alloc: std.mem.Allocator, name: []const u8) ![]const u8 {
    var threaded = std.Io.Threaded.init(alloc, .{});
    defer threaded.deinit();
    const io = threaded.io();

    const path = try relPath(alloc, &.{ "test", "fixtures", name });
    defer alloc.free(path);

    const file = try std.Io.Dir.openFileAbsolute(io, path, .{});
    defer file.close(io);
    const stat = try file.stat(io);
    const size: usize = @intCast(stat.size);
    var buf: [8192]u8 = undefined;
    var reader = file.reader(io, &buf);
    return try reader.interface.readAlloc(alloc, size);
}

fn runCmd(allocator: std.mem.Allocator, argv: []const []const u8) !std.process.RunResult {
    var threaded = std.Io.Threaded.init(allocator, .{});
    defer threaded.deinit();
    return try std.process.run(allocator, threaded.io(), .{ .argv = argv });
}

fn buildGitFixture(alloc: std.mem.Allocator, dest: []const u8) !void {
    const script = try relPath(alloc, &.{ "test", "fixtures", "build-git-repo.sh" });
    defer alloc.free(script);
    const result = try runCmd(alloc, &.{ "/bin/bash", script, dest });
    defer alloc.free(result.stdout);
    defer alloc.free(result.stderr);
    try std.testing.expectEqual(@as(u8, 0), switch (result.term) {
        .exited => |c| c,
        else => 1,
    });
}

fn revListFingerprint(alloc: std.mem.Allocator, repo: []const u8) ![]const u8 {
    const result = try runCmd(alloc, &.{ git_bin, "-C", repo, "rev-list", "--all" });
    defer alloc.free(result.stderr);
    try std.testing.expectEqual(@as(u8, 0), switch (result.term) {
        .exited => |c| c,
        else => 1,
    });
    return result.stdout;
}

// Criterion: fixture builds deterministically twice with identical commit graph.
test "T-FIX-DET deterministic fixture" {
    const alloc = std.testing.allocator;
    var threaded = std.Io.Threaded.init(alloc, .{});
    defer threaded.deinit();
    const io = threaded.io();

    const path1 = "/tmp/slim-fixture-det-1";
    const path2 = "/tmp/slim-fixture-det-2";

    std.Io.Dir.createDirAbsolute(io, path1, .default_dir) catch |err| switch (err) {
        error.PathAlreadyExists => {},
        else => |e| return e,
    };
    std.Io.Dir.createDirAbsolute(io, path2, .default_dir) catch |err| switch (err) {
        error.PathAlreadyExists => {},
        else => |e| return e,
    };

    try buildGitFixture(alloc, path1);
    try buildGitFixture(alloc, path2);

    const revs1 = try revListFingerprint(alloc, path1);
    defer alloc.free(revs1);
    const revs2 = try revListFingerprint(alloc, path2);
    defer alloc.free(revs2);
    try std.testing.expectEqualStrings(revs1, revs2);
}

// Criterion: frozen git status golden — counts match fixture (1 staged, 1 modified, 2 untracked).
test "T-FIX-GS" {
    const alloc = std.testing.allocator;
    const repo = try relPath(alloc, &.{ "test", "fixtures", "git-repo" });
    defer alloc.free(repo);
    try buildGitFixture(alloc, repo);

    const slim = try runCmd(alloc, &.{ slim_bin, "git", "-C", repo, "status" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    try std.testing.expectEqual(@as(u8, 0), switch (slim.term) {
        .exited => |c| c,
        else => 1,
    });

    const golden = try readGolden(alloc, "git-repo-status.golden.txt");
    defer alloc.free(golden);
    try std.testing.expectEqualStrings(golden, slim.stdout);

    // Truth-law review anchors: known fixture counts
    try std.testing.expect(std.mem.indexOf(u8, slim.stdout, "+ Staged: 1 files") != null);
    try std.testing.expect(std.mem.indexOf(u8, slim.stdout, "~ Modified: 1 files") != null);
    try std.testing.expect(std.mem.indexOf(u8, slim.stdout, "? Untracked: 2 files") != null);
}

// Criterion: frozen git log golden — truncation marker present on long-body commit.
test "T-FIX-GL" {
    const alloc = std.testing.allocator;
    const repo = try relPath(alloc, &.{ "test", "fixtures", "git-repo" });
    defer alloc.free(repo);
    try buildGitFixture(alloc, repo);

    const slim = try runCmd(alloc, &.{ slim_bin, "git", "-C", repo, "log", "-5" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);
    try std.testing.expectEqual(@as(u8, 0), switch (slim.term) {
        .exited => |c| c,
        else => 1,
    });

    const golden = try readGolden(alloc, "git-repo-log.golden.txt");
    defer alloc.free(golden);
    try std.testing.expectEqualStrings(golden, slim.stdout);

    try std.testing.expect(std.mem.indexOf(u8, slim.stdout, "[+5 lines omitted]") != null);
}

// Criterion: truth-law exit-code propagation on nonzero-exit git call.
test "T-EXIT-GIT" {
    const alloc = std.testing.allocator;
    const git = try runCmd(alloc, &.{ git_bin, "-C", "/no/such/slim-fixture-repo", "status" });
    defer alloc.free(git.stdout);
    defer alloc.free(git.stderr);
    const slim = try runCmd(alloc, &.{ slim_bin, "git", "-C", "/no/such/slim-fixture-repo", "status" });
    defer alloc.free(slim.stdout);
    defer alloc.free(slim.stderr);

    const git_code: u8 = switch (git.term) {
        .exited => |c| c,
        else => 1,
    };
    const slim_code: u8 = switch (slim.term) {
        .exited => |c| c,
        else => 1,
    };
    try std.testing.expect(git_code != 0);
    try std.testing.expectEqual(git_code, slim_code);
    try std.testing.expect(slim.stderr.len > 0);
}
