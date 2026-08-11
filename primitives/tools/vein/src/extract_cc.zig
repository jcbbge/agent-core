const std = @import("std");
const Row = @import("lib.zig").Row;
const schema = @import("schema.zig");
const classify = @import("classify.zig");
const io_ctx = @import("io_ctx.zig");

const Call = struct {
    id: []const u8,
    command: []const u8,
    cwd: []const u8,
};

const Result = struct {
    text: []const u8,
    structured: ?std.json.Value,
    is_error: bool,
};

const json = std.json;

fn makeRow(
    allocator: std.mem.Allocator,
    session_id: []const u8,
    project_key: []const u8,
    source_path: []const u8,
    call: Call,
    ordinal: u32,
    matched: ?Result,
) !Row {
    const result_text = if (matched) |m| m.text else "";
    const exit_code = schema.exitCodeFrom(result_text, if (matched) |m| m.structured else null);
    var is_error = if (matched) |m| m.is_error else false;
    if (exit_code) |code| {
        if (code != 0) is_error = true;
    }

    return classify.makeRow(
        allocator,
        "cc",
        "0",
        .{
            .session_id = session_id,
            .project_key = project_key,
            .path = source_path,
        },
        call.id,
        ordinal,
        call.command,
        result_text,
        exit_code,
        is_error,
        matched == null,
        call.cwd,
    );
}

fn sessionIdFromPath(allocator: std.mem.Allocator, path: []const u8) ![]const u8 {
    const base = std.fs.path.basename(path);
    if (std.mem.endsWith(u8, base, ".jsonl")) {
        return try allocator.dupe(u8, base[0 .. base.len - ".jsonl".len]);
    }
    return try allocator.dupe(u8, base);
}

/// Pair assistant tool_use name Bash to tool_result.tool_use_id.
/// `source_path` absolute transcript path; `project_key` parent project directory name.
pub fn extractFromTranscript(allocator: std.mem.Allocator, source_path: []const u8, project_key: []const u8) ![]Row {
    const session_id = try sessionIdFromPath(allocator, source_path);
    defer allocator.free(session_id);

    const file = try io_ctx.openAbs(source_path);
    defer file.close(io_ctx.io());

    var calls = std.array_list.Managed(Call).init(allocator);
    defer {
        for (calls.items) |c| {
            allocator.free(c.id);
            allocator.free(c.command);
            allocator.free(c.cwd);
        }
        calls.deinit();
    }

    var results = std.StringArrayHashMapUnmanaged(Result).empty;
    defer {
        var it = results.iterator();
        while (it.next()) |entry| {
            allocator.free(entry.key_ptr.*);
            allocator.free(entry.value_ptr.text);
        }
        results.deinit(allocator);
    }

    var current_cwd = try allocator.dupe(u8, project_key);
    defer allocator.free(current_cwd);

    var buf: [65536]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    var line_buf: std.ArrayList(u8) = .empty;
    defer line_buf.deinit(allocator);

    var drift_reported = false;

    while (try io_ctx.readLineInto(allocator, &reader, &line_buf)) {
        if (line_buf.items.len == 0) continue;

        var parsed = json.parseFromSlice(json.Value, allocator, line_buf.items, .{}) catch continue;
        defer parsed.deinit();
        const root = parsed.value;
        if (root != .object) continue;

        if (schema.getObjectField(root, schema.cc_paths.cwd)) |cwd_val| {
            if (schema.getString(cwd_val)) |cwd| {
                allocator.free(current_cwd);
                current_cwd = try allocator.dupe(u8, cwd);
            }
        }

        const message_val = schema.getObjectField(root, schema.cc_paths.message) orelse continue;
        if (message_val != .object) continue;
        const message = message_val.object;

        const content_val = message.get("content");
        const wrapped = schema.contentItemsSingle(if (content_val) |cv| cv else null);

        for (wrapped.items) |item| {
            if (item != .object) continue;
            const obj = item.object;

            if (obj.get("type")) |type_val| {
                if (schema.getString(type_val)) |typ| {
                    if (std.mem.eql(u8, typ, "tool_use")) {
                        if (obj.get("name")) |name_val| {
                            if (schema.getString(name_val)) |name| {
                                if (!std.mem.eql(u8, name, "Bash")) continue;
                                const id = if (obj.get("id")) |id_val| schema.getString(id_val) orelse "" else "";
                                const input = obj.get("input");
                                var command: ?[]const u8 = null;
                                if (input) |inp| {
                                    if (inp == .object) {
                                        if (inp.object.get("command")) |cmd_val| {
                                            command = schema.getString(cmd_val);
                                        }
                                    }
                                }
                                if (command) |cmd| {
                                    try calls.append(.{
                                        .id = try allocator.dupe(u8, id),
                                        .command = try allocator.dupe(u8, cmd),
                                        .cwd = try allocator.dupe(u8, current_cwd),
                                    });
                                } else if (!drift_reported) {
                                    drift_reported = true;
                                }
                            }
                        }
                    } else if (std.mem.eql(u8, typ, "tool_result")) {
                        const call_id = if (obj.get("tool_use_id")) |id_val| schema.getString(id_val) orelse "" else "";
                        const structured = schema.getObjectField(root, schema.cc_paths.tool_use_result);
                        var result_text = schema.textContent(obj.get("content"));
                        if (result_text.len == 0 and structured != null) {
                            if (structured.? == .object) {
                                var parts = std.array_list.Managed([]const u8).init(allocator);
                                defer parts.deinit();
                                for (&[_][]const u8{ "stdout", "stderr" }) |key| {
                                    if (structured.?.object.get(key)) |part| {
                                        const text = schema.textContent(part);
                                        if (text.len > 0) try parts.append(text);
                                    }
                                }
                                if (parts.items.len > 0) {
                                    result_text = try std.mem.join(allocator, "\n", parts.items);
                                }
                            }
                        }
                        var is_error = if (obj.get("is_error")) |e| schema.getBool(e) orelse false else false;
                        if (structured) |s| {
                            if (s == .object) {
                                if (s.object.get("isError")) |e| {
                                    if (schema.getBool(e) orelse false) is_error = true;
                                }
                                if (s.object.get("error")) |e| {
                                    if (e != .null) is_error = true;
                                }
                            }
                        }
                        const owned_text = try allocator.dupe(u8, result_text);
                        try results.put(allocator, try allocator.dupe(u8, call_id), .{
                            .text = owned_text,
                            .structured = structured,
                            .is_error = is_error,
                        });
                    }
                }
            }
        }
    }

    var rows = std.array_list.Managed(Row).init(allocator);
    errdefer {
        for (rows.items) |r| freeRow(allocator, r);
        rows.deinit();
    }

    for (calls.items, 0..) |call, idx| {
        const matched = results.get(call.id);
        try rows.append(try makeRow(
            allocator,
            session_id,
            project_key,
            source_path,
            call,
            @intCast(idx + 1),
            if (matched) |m| m else null,
        ));
    }

    return try rows.toOwnedSlice();
}

pub fn freeRow(allocator: std.mem.Allocator, row: Row) void {
    allocator.free(row.harness);
    allocator.free(row.batch);
    allocator.free(row.session_id);
    allocator.free(row.cwd);
    allocator.free(row.project_key);
    allocator.free(row.source_path);
    allocator.free(row.call_id);
    allocator.free(row.command);
    allocator.free(row.command_safe);
    allocator.free(row.command_sha256);
    allocator.free(row.command_norm_sha256);
    allocator.free(row.first_token);
    allocator.free(row.verb);
    allocator.free(row.subcommand);
    allocator.free(row.result_sha256);
}

test "extract cc sample session" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const path = "/Users/jrg/.claude/projects/-Users-jrg-future/6a214495-e55e-4441-9e0e-634f410f7d96.jsonl";
    const file = io_ctx.openAbs(path) catch return;
    file.close(io_ctx.io());

    const rows = try extractFromTranscript(std.testing.allocator, path, "-Users-jrg-future");
    defer {
        for (rows) |r| freeRow(std.testing.allocator, r);
        std.testing.allocator.free(rows);
    }
    try std.testing.expectEqual(@as(usize, 431), rows.len);
}
