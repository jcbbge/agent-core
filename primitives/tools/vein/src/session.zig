const std = @import("std");
const schema = @import("schema.zig");
const io_ctx = @import("io_ctx.zig");

pub const Harness = schema.Harness;

pub const SessionRef = struct {
    session_id: []const u8,
    source_path: []const u8,
    project_key: []const u8,
    harness: Harness,
    mtime: i128,
};

fn homeDir(allocator: std.mem.Allocator) ![]const u8 {
    const home_c = std.c.getenv("HOME") orelse return error.EnvironmentVariableMissing;
    return try allocator.dupe(u8, std.mem.sliceTo(home_c, 0));
}

fn shouldSkipProject(name: []const u8) bool {
    return std.mem.indexOf(u8, name, "private-tmp") != null;
}

fn basenameStem(allocator: std.mem.Allocator, path: []const u8) ![]const u8 {
    const base = std.fs.path.basename(path);
    if (std.mem.endsWith(u8, base, ".jsonl")) {
        return try allocator.dupe(u8, base[0 .. base.len - ".jsonl".len]);
    }
    return try allocator.dupe(u8, base);
}

fn projectKeyFromPath(allocator: std.mem.Allocator, path: []const u8) ![]const u8 {
    const dir = std.fs.path.dirname(path) orelse return try allocator.dupe(u8, "");
    return try allocator.dupe(u8, std.fs.path.basename(dir));
}

fn detectHarness(path: []const u8) ?Harness {
    if (std.mem.indexOf(u8, path, "/.claude/projects/") != null) return .cc;
    if (std.mem.indexOf(u8, path, "/.pi/agent/sessions/") != null) return .pi;
    return null;
}

fn endsWithJsonl(token: []const u8) bool {
    return std.mem.endsWith(u8, token, ".jsonl");
}

fn jsonlFileExists(path: []const u8) bool {
    const file = io_ctx.openAbs(path) catch return false;
    file.close(io_ctx.io());
    return true;
}

/// True when the transcript contains at least one line matching harness shape.
fn transcriptHasValidShape(allocator: std.mem.Allocator, path: []const u8, harness: Harness) bool {
    const file = io_ctx.openAbs(path) catch return false;
    defer file.close(io_ctx.io());
    var probe_buf: [65536]u8 = undefined;
    var probe_reader = file.reader(io_ctx.io(), &probe_buf);
    var probe_line: std.ArrayList(u8) = .empty;
    defer probe_line.deinit(allocator);
    while (io_ctx.readLineInto(allocator, &probe_reader, &probe_line) catch return false) {
        if (probe_line.items.len == 0) continue;
        schema.verifyShape(probe_line.items, harness) catch continue;
        return true;
    }
    return false;
}

fn detectHarnessForPath(allocator: std.mem.Allocator, path: []const u8) Harness {
    if (detectHarness(path)) |h| return h;
    if (transcriptHasValidShape(allocator, path, .cc)) return .cc;
    if (transcriptHasValidShape(allocator, path, .pi)) return .pi;
    return .cc;
}

fn resolveJsonlTranscript(allocator: std.mem.Allocator, path: []const u8) !SessionRef {
    if (!jsonlFileExists(path)) return error.SessionNotFound;
    const harness = detectHarnessForPath(allocator, path);
    const session_id = try basenameStem(allocator, path);
    errdefer allocator.free(session_id);
    const project_key = try projectKeyFromPath(allocator, path);
    errdefer allocator.free(project_key);
    const source_path = try allocator.dupe(u8, path);
    errdefer allocator.free(source_path);
    const mtime = mtimeForPath(path) catch 0;
    return .{
        .session_id = session_id,
        .source_path = source_path,
        .project_key = project_key,
        .harness = harness,
        .mtime = mtime,
    };
}

fn tryResolveJsonlToken(allocator: std.mem.Allocator, trimmed: []const u8) !SessionRef {
    if (std.fs.path.isAbsolute(trimmed)) {
        return resolveJsonlTranscript(allocator, trimmed);
    }
    if (jsonlFileExists(trimmed)) {
        return resolveJsonlTranscript(allocator, trimmed);
    }
    return error.SessionNotFound;
}

fn mtimeForPath(path: []const u8) !i128 {
    return io_ctx.fileMtime(path);
}

fn appendSession(
    allocator: std.mem.Allocator,
    list: *std.array_list.Managed(SessionRef),
    harness: Harness,
    path: []const u8,
) !void {
    const session_id = try basenameStem(allocator, path);
    errdefer allocator.free(session_id);
    const project_key = try projectKeyFromPath(allocator, path);
    errdefer allocator.free(project_key);
    const source_path = try allocator.dupe(u8, path);
    errdefer allocator.free(source_path);
    const mtime = mtimeForPath(path) catch 0;
    try list.append(.{
        .session_id = session_id,
        .source_path = source_path,
        .project_key = project_key,
        .harness = harness,
        .mtime = mtime,
    });
}

fn walkHarnessRoot(
    allocator: std.mem.Allocator,
    list: *std.array_list.Managed(SessionRef),
    harness: Harness,
    root_path: []const u8,
) !void {
    var root = io_ctx.openDirAbs(root_path) catch return;
    defer root.close(io_ctx.io());

    var projects = root.iterate();
    while (try projects.next(io_ctx.io())) |proj| {
        if (proj.kind != .directory) continue;
        if (shouldSkipProject(proj.name)) continue;
        var project_dir = root.openDir(io_ctx.io(), proj.name, .{ .iterate = true }) catch continue;
        defer project_dir.close(io_ctx.io());

        var files = project_dir.iterate();
        while (try files.next(io_ctx.io())) |file| {
            if (file.kind != .file) continue;
            if (!std.mem.endsWith(u8, file.name, ".jsonl")) continue;
            const path = try std.fs.path.join(allocator, &.{ root_path, proj.name, file.name });
            try appendSession(allocator, list, harness, path);
        }
    }
}

pub fn discoverAll(allocator: std.mem.Allocator) ![]SessionRef {
    const home = try homeDir(allocator);
    defer allocator.free(home);

    var list = std.array_list.Managed(SessionRef).init(allocator);
    errdefer {
        for (list.items) |s| {
            allocator.free(s.session_id);
            allocator.free(s.source_path);
            allocator.free(s.project_key);
        }
        list.deinit();
    }

    const cc_root = try std.fs.path.join(allocator, &.{ home, ".claude/projects" });
    defer allocator.free(cc_root);
    try walkHarnessRoot(allocator, &list, .cc, cc_root);

    const pi_root = try std.fs.path.join(allocator, &.{ home, ".pi/agent/sessions" });
    defer allocator.free(pi_root);
    try walkHarnessRoot(allocator, &list, .pi, pi_root);

    return try list.toOwnedSlice();
}

fn cmpSessionByMtimeDesc(_: void, a: SessionRef, b: SessionRef) bool {
    return a.mtime > b.mtime;
}

/// Metadata-first selection of newest N transcripts across CC + pi harnesses.
pub fn selectLastN(allocator: std.mem.Allocator, n: u32) ![]SessionRef {
    var all = try discoverAll(allocator);
    std.mem.sort(SessionRef, all, {}, cmpSessionByMtimeDesc);
    if (all.len <= n) return all;
    for (all[n..], 0..) |s, i| {
        _ = s;
        const idx = n + i;
        allocator.free(all[idx].session_id);
        allocator.free(all[idx].source_path);
        allocator.free(all[idx].project_key);
    }
    return try allocator.realloc(all, n);
}

/// Resolve with optional discoverAll cache (one walk for many id lookups).
pub fn resolveRefWithCatalog(
    allocator: std.mem.Allocator,
    token: []const u8,
    catalog: *?[]SessionRef,
) !SessionRef {
    const trimmed = std.mem.trim(u8, token, " \t\r\n");
    if (trimmed.len == 0) return error.InvalidSession;

    if (endsWithJsonl(trimmed)) {
        return tryResolveJsonlToken(allocator, trimmed);
    }

    if (catalog.* == null) catalog.* = try discoverAll(allocator);
    for (catalog.*.?) |s| {
        if (std.mem.eql(u8, s.session_id, trimmed)) {
            return .{
                .session_id = try allocator.dupe(u8, s.session_id),
                .source_path = try allocator.dupe(u8, s.source_path),
                .project_key = try allocator.dupe(u8, s.project_key),
                .harness = s.harness,
                .mtime = s.mtime,
            };
        }
    }
    return error.SessionNotFound;
}

/// Resolve a session id or absolute transcript path to session metadata.
pub fn resolveRef(allocator: std.mem.Allocator, token: []const u8) !SessionRef {
    const trimmed = std.mem.trim(u8, token, " \t\r\n");
    if (trimmed.len == 0) return error.InvalidSession;

    if (endsWithJsonl(trimmed)) {
        return tryResolveJsonlToken(allocator, trimmed);
    }

    const all = try discoverAll(allocator);
    defer {
        for (all) |s| {
            allocator.free(s.session_id);
            allocator.free(s.source_path);
            allocator.free(s.project_key);
        }
        allocator.free(all);
    }

    for (all) |s| {
        if (std.mem.eql(u8, s.session_id, trimmed)) {
            return .{
                .session_id = try allocator.dupe(u8, s.session_id),
                .source_path = try allocator.dupe(u8, s.source_path),
                .project_key = try allocator.dupe(u8, s.project_key),
                .harness = s.harness,
                .mtime = s.mtime,
            };
        }
    }
    return error.SessionNotFound;
}

/// Resolve a session id or absolute transcript path to a readable file path.
pub fn resolve(allocator: std.mem.Allocator, token: []const u8) ![]const u8 {
    const info = try resolveRef(allocator, token);
    return info.source_path;
}

/// Parse sessions list file: one id or absolute path per line; skip # comments and blanks.
pub fn parseSessionsFile(allocator: std.mem.Allocator, path: []const u8) ![][]const u8 {
    const file = try io_ctx.openAbs(path);
    defer file.close(io_ctx.io());

    var list = std.array_list.Managed([]const u8).init(allocator);
    errdefer list.deinit();

    var buf: [8192]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    var line_buf: std.ArrayList(u8) = .empty;
    defer line_buf.deinit(allocator);

    while (try io_ctx.readLineInto(allocator, &reader, &line_buf)) {
        const line = std.mem.trim(u8, line_buf.items, " \t\r\n");
        if (line.len == 0) continue;
        if (std.mem.startsWith(u8, line, "#")) continue;
        try list.append(try allocator.dupe(u8, line));
    }
    return try list.toOwnedSlice();
}

/// Return duplicated tokens from the list that cannot be resolved (caller frees slice + each token).
pub fn collectUnresolvable(
    allocator: std.mem.Allocator,
    tokens: []const []const u8,
) ![][]const u8 {
    var catalog: ?[]SessionRef = null;
    defer if (catalog) |all| {
        for (all) |s| {
            allocator.free(s.session_id);
            allocator.free(s.source_path);
            allocator.free(s.project_key);
        }
        allocator.free(all);
    };

    var failures = std.array_list.Managed([]const u8).init(allocator);
    errdefer {
        for (failures.items) |t| allocator.free(t);
        failures.deinit();
    }

    for (tokens) |token| {
        const info = resolveRefWithCatalog(allocator, token, &catalog) catch {
            try failures.append(try allocator.dupe(u8, token));
            continue;
        };
        allocator.free(info.session_id);
        allocator.free(info.source_path);
        allocator.free(info.project_key);
    }
    return try failures.toOwnedSlice();
}

test "relative jsonl path resolves when file exists" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const ref = try resolveRef(std.testing.allocator, "test/fixtures/cc-mini.jsonl");
    defer {
        std.testing.allocator.free(ref.session_id);
        std.testing.allocator.free(ref.source_path);
        std.testing.allocator.free(ref.project_key);
    }
    try std.testing.expectEqualStrings("cc-mini-fixture", ref.session_id);
    try std.testing.expect(ref.harness == .cc);
}

test "missing jsonl path is unresolvable not catalog lookup" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const result = resolveRef(std.testing.allocator, "no-such-file-99999.jsonl");
    try std.testing.expectError(error.SessionNotFound, result);
}

test "bare session id not in catalog is unresolvable" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const result = resolveRef(std.testing.allocator, "no-such-session-id-12345");
    try std.testing.expectError(error.SessionNotFound, result);
}

test "parseSessionsFile skips comments" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const tmp = "/tmp/vein-session-parse-test.txt";
    try io_ctx.writeFileAbs(tmp, "# comment\n\nabc\n/Users/j/x.jsonl\n");
    const lines = try parseSessionsFile(std.testing.allocator, tmp);
    defer {
        for (lines) |l| std.testing.allocator.free(l);
        std.testing.allocator.free(lines);
    }
    try std.testing.expectEqual(@as(usize, 2), lines.len);
}
