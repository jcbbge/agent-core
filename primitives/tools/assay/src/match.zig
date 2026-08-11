/// match: phrase search over assistant text after wake record.
const std = @import("std");
const vein = @import("vein");
const schema = vein.schema;
const io_ctx = vein.io_ctx;

const json = std.json;

pub const Evidence = struct {
    session: []const u8,
    atom_hint: []const u8,
    /// 1-based JSONL file line number of the matching assistant record.
    line: u32,
    snippet: []const u8,
};

pub const Atom = struct {
    hint: []const u8,
};

pub fn freeEvidence(allocator: std.mem.Allocator, rows: []Evidence) void {
    for (rows) |row| {
        allocator.free(row.session);
        allocator.free(row.atom_hint);
        allocator.free(row.snippet);
    }
    allocator.free(rows);
}

/// Search assistant messages in `transcript_path` after `wake_line` (1-based).
pub fn searchTranscript(
    allocator: std.mem.Allocator,
    session_id: []const u8,
    transcript_path: []const u8,
    wake_line: u32,
    atoms: []const Atom,
) ![]Evidence {
    const file = try io_ctx.openAbs(transcript_path);
    defer file.close(io_ctx.io());

    var buf: [65536]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    var line_buf: std.ArrayList(u8) = .empty;
    defer line_buf.deinit(allocator);

    var transcript = std.array_list.Managed(u8).init(allocator);
    defer transcript.deinit();
    while (try io_ctx.readLineInto(allocator, &reader, &line_buf)) {
        try transcript.appendSlice(line_buf.items);
        try transcript.append('\n');
    }

    return searchBytes(allocator, session_id, transcript.items, wake_line, atoms);
}

/// Search assistant messages in in-memory JSONL bytes after `wake_line` (1-based).
pub fn searchBytes(
    allocator: std.mem.Allocator,
    session_id: []const u8,
    transcript: []const u8,
    wake_line: u32,
    atoms: []const Atom,
) ![]Evidence {
    var hits = std.array_list.Managed(Evidence).init(allocator);
    errdefer {
        for (hits.items) |row| {
            allocator.free(row.session);
            allocator.free(row.atom_hint);
            allocator.free(row.snippet);
        }
        hits.deinit();
    }

    var line_no: u32 = 0;
    var iter = std.mem.splitScalar(u8, transcript, '\n');
    while (iter.next()) |line| {
        if (line.len == 0 and line_no > 0) continue;
        line_no += 1;
        if (line_no <= wake_line) continue;
        if (line.len == 0) continue;

        var parsed = json.parseFromSlice(json.Value, allocator, line, .{}) catch continue;
        defer parsed.deinit();

        const root = parsed.value;
        if (root != .object) continue;

        const type_val = schema.getObjectField(root, schema.pi_paths.row_type);
        const typ = if (type_val) |tv| schema.getString(tv) orelse "" else "";
        if (!std.mem.eql(u8, typ, "message")) continue;

        const message_val = schema.getObjectField(root, schema.pi_paths.message) orelse continue;
        if (message_val != .object) continue;
        const message = message_val.object;

        const role_val = message.get("role");
        const role = if (role_val) |rv| schema.getString(rv) orelse "" else "";
        if (!std.mem.eql(u8, role, "assistant")) continue;

        const text = try collectAssistantText(allocator, message);
        defer allocator.free(text);
        if (text.len == 0) continue;

        for (atoms) |atom| {
            if (try findMatch(allocator, text, atom.hint)) |match_pos| {
                const owned_session = try allocator.dupe(u8, session_id);
                errdefer allocator.free(owned_session);
                const owned_hint = try allocator.dupe(u8, atom.hint);
                errdefer allocator.free(owned_hint);
                const snippet = try makeSnippet(allocator, text, match_pos);
                errdefer allocator.free(snippet);
                try hits.append(.{
                    .session = owned_session,
                    .atom_hint = owned_hint,
                    .line = line_no,
                    .snippet = snippet,
                });
            }
        }
    }

    return try hits.toOwnedSlice();
}

fn collectAssistantText(allocator: std.mem.Allocator, message: json.ObjectMap) ![]u8 {
    const content_val = message.get("content");
    const wrapped = schema.contentItemsSingle(if (content_val) |cv| cv else null);

    var parts = std.array_list.Managed([]const u8).init(allocator);
    defer parts.deinit();

    for (wrapped.items) |item| {
        switch (item) {
            .string => |s| try parts.append(s),
            .object => |obj| {
                const typ = if (obj.get("type")) |tv| schema.getString(tv) orelse "" else "";
                if (std.mem.eql(u8, typ, "text")) {
                    if (obj.get("text")) |tv| {
                        if (schema.getString(tv)) |text| try parts.append(text);
                    }
                } else if (std.mem.eql(u8, typ, "thinking")) {
                    if (obj.get("thinking")) |tv| {
                        if (schema.getString(tv)) |text| try parts.append(text);
                    }
                }
            },
            else => {},
        }
    }

    if (parts.items.len == 0) return try allocator.dupe(u8, "");
    return std.mem.join(allocator, "\n", parts.items);
}

fn findMatch(allocator: std.mem.Allocator, haystack: []const u8, needle: []const u8) !?usize {
    if (needle.len == 0) return null;
    if (std.mem.indexOf(u8, haystack, needle)) |pos| return pos;

    const norm_hay = try normalizeWhitespaceCase(allocator, haystack);
    defer allocator.free(norm_hay);
    const norm_needle = try normalizeWhitespaceCase(allocator, needle);
    defer allocator.free(norm_needle);
    if (norm_needle.len == 0) return null;
    if (std.mem.indexOf(u8, norm_hay, norm_needle)) |pos| return pos;
    return null;
}

fn normalizeWhitespaceCase(allocator: std.mem.Allocator, text: []const u8) ![]u8 {
    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();

    var prev_space = false;
    for (text) |c| {
        if (std.ascii.isWhitespace(c)) {
            if (!prev_space and out.items.len > 0) {
                try out.append(' ');
                prev_space = true;
            }
        } else {
            try out.append(std.ascii.toLower(c));
            prev_space = false;
        }
    }

    while (out.items.len > 0 and out.items[out.items.len - 1] == ' ') _ = out.pop();
    return try out.toOwnedSlice();
}

fn makeSnippet(allocator: std.mem.Allocator, text: []const u8, match_pos: usize) ![]u8 {
    const before: usize = 40;
    const after: usize = 40;
    const start = if (match_pos > before) match_pos - before else 0;
    const end = @min(text.len, match_pos + after);
    return try allocator.dupe(u8, text[start..end]);
}

test "match-mini fixture: post-wake hit, pre-wake ignored" {
    io_ctx.ensureTestIo(std.testing.allocator);

    var path_buf: [512]u8 = undefined;
    const fixture_path = try std.fs.cwd().realpath("test/fixtures/match-mini.jsonl", &path_buf);

    const atoms = [_]Atom{
        .{ .hint = "UNIQUE_PHRASE_ALPHA" },
    };

    const rows = try searchTranscript(
        std.testing.allocator,
        "test-session-001",
        fixture_path,
        3,
        &atoms,
    );
    defer freeEvidence(std.testing.allocator, rows);

    try std.testing.expectEqual(@as(usize, 1), rows.len);
    try std.testing.expectEqual(@as(u32, 4), rows[0].line);
    try std.testing.expect(std.mem.indexOf(u8, rows[0].snippet, "UNIQUE_PHRASE_ALPHA") != null);
}

test "match-mini fixture: normalized whitespace/case match" {
    io_ctx.ensureTestIo(std.testing.allocator);

    var path_buf: [512]u8 = undefined;
    const fixture_path = try std.fs.cwd().realpath("test/fixtures/match-mini.jsonl", &path_buf);

    const atoms = [_]Atom{
        .{ .hint = "motion   IS   the   metric" },
    };

    const rows = try searchTranscript(
        std.testing.allocator,
        "test-session-001",
        fixture_path,
        3,
        &atoms,
    );
    defer freeEvidence(std.testing.allocator, rows);

    try std.testing.expectEqual(@as(usize, 1), rows.len);
    try std.testing.expectEqual(@as(u32, 5), rows[0].line);
}

test "s5 smoke: distinctive wake-only atoms have zero post-wake hits" {
    io_ctx.ensureTestIo(std.testing.allocator);

    const path = "/Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T18-32-09-386Z_019ff218-a5aa-7e53-af73-2fd5d91f14fc.jsonl";
    io_ctx.accessAbs(path) catch return;

    const atoms = [_]Atom{
        .{ .hint = "Motion is the metric" },
        .{ .hint = "Ground truth is the run log" },
        .{ .hint = "Show, never describe" },
        .{ .hint = "mechanical fidelity" },
    };

    const rows = try searchTranscript(
        std.testing.allocator,
        "019ff218-a5aa-7e53-af73-2fd5d91f14fc",
        path,
        5,
        &atoms,
    );
    defer freeEvidence(std.testing.allocator, rows);

    try std.testing.expectEqual(@as(usize, 0), rows.len);
}
