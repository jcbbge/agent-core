const std = @import("std");
const json = std.json;

pub const SchemaDrift = error{
    SchemaDrift,
};

pub const Harness = enum { cc, pi };

/// Emit literal UNKNOWN for aggregates when JSONL shape is unrecognized.
pub fn unknownLiteral() []const u8 {
    return "UNKNOWN";
}

/// Return true when a field path is absent or unrecognized in the transcript shape.
pub fn isUnknown(value: ?[]const u8) bool {
    if (value) |v| {
        return std.mem.eql(u8, v, "UNKNOWN") or v.len == 0;
    }
    return true;
}

/// CC assistant tool_use field paths (config for drift checks).
pub const cc_paths = struct {
    pub const message = "message";
    pub const message_content = "message.content";
    pub const tool_use_type = "message.content[].type";
    pub const tool_use_name = "message.content[].name";
    pub const tool_use_id = "message.content[].id";
    pub const tool_use_input_command = "message.content[].input.command";
    pub const tool_result_type = "message.content[].type";
    pub const tool_result_id = "message.content[].tool_use_id";
    pub const tool_use_result = "toolUseResult";
    pub const cwd = "cwd";
};

/// Pi assistant toolCall field paths (config for drift checks).
pub const pi_paths = struct {
    pub const row_type = "type";
    pub const session_cwd = "cwd";
    pub const message = "message";
    pub const message_role = "message.role";
    pub const message_content = "message.content";
    pub const tool_call_type = "message.content[].type";
    pub const tool_call_name = "message.content[].name";
    pub const tool_call_id = "message.content[].id";
    pub const tool_call_command = "message.content[].arguments.command";
    pub const tool_result_role = "message.role";
    pub const tool_result_tool_name = "message.toolName";
    pub const tool_result_id = "message.toolCallId";
    pub const tool_result_is_error = "message.isError";
    pub const tool_result_details = "message.details";
};

pub fn getObjectField(obj: json.Value, key: []const u8) ?json.Value {
    if (obj != .object) return null;
    return obj.object.get(key);
}

pub fn getString(value: json.Value) ?[]const u8 {
    return switch (value) {
        .string => |s| s,
        else => null,
    };
}

pub fn getBool(value: json.Value) ?bool {
    return switch (value) {
        .bool => |b| b,
        else => null,
    };
}

pub fn getI64(value: json.Value) ?i64 {
    return switch (value) {
        .integer => |i| i,
        .float => |f| @intFromFloat(f),
        else => null,
    };
}

/// Port of mining_common.text_content.
pub fn textContent(value: ?json.Value) []const u8 {
    const v = value orelse return "";
    return switch (v) {
        .string => |s| s,
        .null => "",
        .array => |arr| blk: {
            var parts = std.array_list.Managed([]const u8).init(arr.allocator);
            defer parts.deinit();
            for (arr.items) |item| {
                switch (item) {
                    .string => |s| parts.append(s) catch {},
                    .object => |obj| {
                        if (obj.get("text")) |text_val| {
                            if (getString(text_val)) |text| parts.append(text) catch {};
                        }
                    },
                    else => {},
                }
            }
            if (parts.items.len == 0) return "";
            break :blk std.mem.join(arr.allocator, "\n", parts.items) catch "";
        },
        else => "",
    };
}

/// Port of mining_common.exit_code_from — structured JSON first, then regex on result text.
pub fn exitCodeFrom(result: []const u8, structured: ?json.Value) ?i32 {
    if (structured) |s| {
        if (s == .object) {
            inline for (.{ "exitCode", "exit_code", "code" }) |key| {
                if (s.object.get(key)) |val| {
                    if (getI64(val)) |code| return @intCast(code);
                }
            }
            if (s.object.get("isError")) |val| {
                if (getBool(val)) |is_err| if (is_err) return 1;
            }
            if (s.object.get("error")) |val| {
                if (val != .null) return 1;
            }
        }
    }

    const prefixes = [_][]const u8{
        "Exit code:",
        "Process exited with code ",
        "Command failed with exit code ",
    };
    for (prefixes) |prefix| {
        if (parseExitCodeAfterPrefix(result, prefix)) |code| return code;
    }
    return null;
}

fn parseExitCodeAfterPrefix(text: []const u8, prefix: []const u8) ?i32 {
    var search_from: usize = 0;
    while (search_from < text.len) {
        const rel = std.mem.indexOfPos(u8, text, search_from, prefix) orelse break;
        var i = rel + prefix.len;
        while (i < text.len and std.ascii.isWhitespace(text[i])) : (i += 1) {}
        var end = i;
        if (end < text.len and text[end] == '-') {
            end += 1;
        }
        const start_digits = end;
        while (end < text.len and std.ascii.isDigit(text[end])) : (end += 1) {}
        if (end > start_digits) {
            const slice = text[i..end];
            if (std.fmt.parseInt(i32, slice, 10)) |code| return code else |_| {}
        }
        search_from = rel + 1;
    }
    return null;
}

pub fn contentItems(content_val: ?json.Value) ?[]json.Value {
    const content = content_val orelse return null;
    return switch (content) {
        .array => |arr| arr.items,
        .object, .string => null,
        else => null,
    };
}

pub fn contentItemsSingle(content_val: ?json.Value) struct { items: []const json.Value, single: bool } {
    const content = content_val orelse return .{ .items = &.{}, .single = false };
    return switch (content) {
        .array => |arr| .{ .items = arr.items, .single = false },
        .object => |obj| .{ .items = &[_]json.Value{json.Value{ .object = obj }}, .single = true },
        .string => |s| .{ .items = &[_]json.Value{json.Value{ .string = s }}, .single = true },
        else => .{ .items = &.{}, .single = false },
    };
}

/// Lightweight shape probe on the first substantive line of a transcript.
pub fn verifyShape(sample_line: []const u8, harness: Harness) SchemaDrift!void {
    var parsed = json.parseFromSlice(json.Value, std.heap.page_allocator, sample_line, .{}) catch {
        return error.SchemaDrift;
    };
    defer parsed.deinit();

    const root = parsed.value;
    if (root != .object) return error.SchemaDrift;

    switch (harness) {
        .cc => {
            if (getObjectField(root, cc_paths.message) == null and getObjectField(root, cc_paths.cwd) == null) {
                return error.SchemaDrift;
            }
        },
        .pi => {
            const row_type = getObjectField(root, pi_paths.row_type);
            if (row_type == null and getObjectField(root, pi_paths.message) == null) {
                return error.SchemaDrift;
            }
            if (row_type) |t| {
                if (getString(t)) |s| {
                    if (!std.mem.eql(u8, s, "session") and !std.mem.eql(u8, s, "message") and !std.mem.eql(u8, s, "model_change")) {
                        return error.SchemaDrift;
                    }
                }
            }
        },
    }
}

test "textContent string" {
    const v = json.Value{ .string = "hello" };
    try std.testing.expectEqualStrings("hello", textContent(v));
}

test "exitCodeFrom structured" {
    var obj = json.ObjectMap.empty;
    try obj.put(std.testing.allocator, "exitCode", json.Value{ .integer = 42 });
    defer obj.deinit(std.testing.allocator);
    const code = exitCodeFrom("", json.Value{ .object = obj });
    try std.testing.expectEqual(@as(?i32, 42), code);
}

test "exitCodeFrom text" {
    const result = "something\nExit code: 7\nmore";
    try std.testing.expectEqual(@as(?i32, 7), exitCodeFrom(result, null));
}
