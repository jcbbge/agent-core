const std = @import("std");

pub const IdLen = 12;

pub const ResolveResult = struct {
    id: ?[]const u8,
    normalized_claim: []const u8,
    resolved: bool,
    claim_from_file: ?[]const u8,
};

/// Collapse whitespace runs to a single space and trim ends.
pub fn normalizeClaim(allocator: std.mem.Allocator, claim: []const u8) ![]const u8 {
    var out = std.ArrayList(u8).empty;
    errdefer out.deinit(allocator);

    var prev_space = true;
    for (claim) |c| {
        if (std.ascii.isWhitespace(c)) {
            if (!prev_space) {
                try out.append(allocator, ' ');
                prev_space = true;
            }
        } else {
            try out.append(allocator, c);
            prev_space = false;
        }
    }
    while (out.items.len > 0 and out.items[out.items.len - 1] == ' ') {
        _ = out.pop();
    }
    return try out.toOwnedSlice(allocator);
}

/// sha256 hex truncated to 12 chars (mind atom id law).
pub fn beliefId(normalized_claim: []const u8, buf: *[IdLen]u8) void {
    const digest = std.crypto.hash.sha2.Sha256.hash(normalized_claim, .{});
    _ = std.fmt.bufPrint(buf, "{s}", .{std.fmt.fmtSliceHexLower(&digest[0..6])}) catch unreachable;
}

pub fn beliefIdAlloc(allocator: std.mem.Allocator, normalized_claim: []const u8) ![]const u8 {
    var buf: [IdLen]u8 = undefined;
    beliefId(normalized_claim, &buf);
    return try allocator.dupe(u8, &buf);
}

pub fn resolve(
    allocator: std.mem.Allocator,
    mind_dir: []const u8,
    claim: []const u8,
) !ResolveResult {
    const normalized = try normalizeClaim(allocator, claim);
    errdefer allocator.free(normalized);

    var id_buf: [IdLen]u8 = undefined;
    beliefId(normalized, &id_buf);
    const id_str = id_buf[0..];

    const beliefs_dir = try std.fs.path.join(allocator, &[_][]const u8{ mind_dir, "beliefs" });
    defer allocator.free(beliefs_dir);

    const belief_path = try std.fs.path.join(allocator, &[_][]const u8{ beliefs_dir, id_str ++ ".md" });
    defer allocator.free(belief_path);

    const file = std.fs.openFileAbsolute(belief_path, .{}) catch {
        return ResolveResult{
            .id = null,
            .normalized_claim = normalized,
            .resolved = false,
            .claim_from_file = null,
        };
    };
    defer file.close();

    const content = try file.readToEndAlloc(allocator, 64 * 1024);
    defer allocator.free(content);

    const claim_from_file = parseClaimField(content) orelse {
        return ResolveResult{
            .id = try allocator.dupe(u8, id_str),
            .normalized_claim = normalized,
            .resolved = false,
            .claim_from_file = null,
        };
    };

    const file_norm = try normalizeClaim(allocator, claim_from_file);
    defer allocator.free(file_norm);

    const matches = std.mem.eql(u8, normalized, file_norm);
    return ResolveResult{
        .id = try allocator.dupe(u8, id_str),
        .normalized_claim = normalized,
        .resolved = matches,
        .claim_from_file = try allocator.dupe(u8, claim_from_file),
    };
}

fn parseClaimField(content: []const u8) ?[]const u8 {
    var lines = std.mem.splitScalar(u8, content, '\n');
    while (lines.next()) |line| {
        if (std.mem.startsWith(u8, line, "claim:")) {
            const rest = std.mem.trim(u8, " \t\r", line["claim:".len..]);
            if (rest.len == 0) return null;
            if (rest[0] == '"') {
                const end = std.mem.lastIndexOf(u8, rest, "\"") orelse return null;
                if (end <= 1) return null;
                return rest[1..end];
            }
            return rest;
        }
    }
    return null;
}

pub const BeliefEntry = struct {
    id: []const u8,
    claim: []const u8,
};

/// Load all belief atoms from mind_dir/beliefs/*.md (read-only).
pub fn loadAll(allocator: std.mem.Allocator, mind_dir: []const u8) ![]BeliefEntry {
    const beliefs_dir = try std.fs.path.join(allocator, &[_][]const u8{ mind_dir, "beliefs" });
    defer allocator.free(beliefs_dir);

    var dir = try std.fs.openDirAbsolute(beliefs_dir, .{ .iterate = true });
    defer dir.close();

    var list = std.ArrayList(BeliefEntry).empty;
    errdefer {
        for (list.items) |e| {
            allocator.free(e.id);
            allocator.free(e.claim);
        }
        list.deinit(allocator);
    }

    var it = dir.iterate();
    while (try it.next()) |entry| {
        if (entry.kind != .file) continue;
        if (!std.mem.endsWith(u8, entry.name, ".md")) continue;

        const id = entry.name[0 .. entry.name.len - 3];
        const path = try std.fs.path.join(allocator, &[_][]const u8{ beliefs_dir, entry.name });
        defer allocator.free(path);

        const content = blk: {
            const file = std.fs.openFileAbsolute(path, .{}) catch |err| switch (err) {
                else => return err,
            };
            defer file.close();
            break :blk try file.readToEndAlloc(allocator, 64 * 1024);
        };
        defer allocator.free(content);

        const claim = parseClaimField(content) orelse continue;
        try list.append(allocator, .{
            .id = try allocator.dupe(u8, id),
            .claim = try allocator.dupe(u8, claim),
        });
    }
    return try list.toOwnedSlice(allocator);
}

test "normalizeClaim collapses whitespace" {
    const allocator = std.testing.allocator;
    const norm = try normalizeClaim(allocator, "  Motion   is  the metric.  ");
    defer allocator.free(norm);
    try std.testing.expectEqualStrings("Motion is the metric.", norm);
}

test "beliefId is stable 12 hex" {
    var buf: [IdLen]u8 = undefined;
    beliefId("Motion is the metric.", &buf);
    try std.testing.expectEqual(@as(usize, 12), buf.len);
    for (buf) |c| try std.testing.expect(std.ascii.isHex(c));
}

test "resolve against real mind dir when present" {
    const home = std.posix.getenv("HOME") orelse return error.SkipZigTest;
    var mind_buf: [512]u8 = undefined;
    const mind_dir = try std.fmt.bufPrint(&mind_buf, "{s}/circadian/mind", .{home});

    const result = resolve(std.testing.allocator, mind_dir, "Motion is the metric — memory earns residence by causing thoughts.") catch |err| switch (err) {
        error.FileNotFound => return,
        else => return err,
    };
    defer {
        if (result.id) |id| std.testing.allocator.free(id);
        std.testing.allocator.free(result.normalized_claim);
        if (result.claim_from_file) |c| std.testing.allocator.free(c);
    }
    try std.testing.expect(result.normalized_claim.len > 0);
}
