const std = @import("std");
const Row = @import("lib.zig").Row;

/// Exact FIELDS order from session-mining-verbs.md Method / mining_common.FIELDS.
pub const field_names = [_][]const u8{
    "harness",
    "batch",
    "session_id",
    "cwd",
    "project_key",
    "source_path",
    "call_id",
    "ordinal",
    "command",
    "command_safe",
    "command_sha256",
    "command_norm_sha256",
    "first_token",
    "verb",
    "subcommand",
    "compound",
    "pipe",
    "heredoc",
    "substitution",
    "machine_format",
    "result_bytes",
    "result_lines",
    "result_nonempty_lines",
    "result_unique_lines",
    "result_max_line_bytes",
    "result_sha256",
    "exit_code",
    "is_error",
    "result_missing",
};

fn writeCsvField(writer: std.Io.Writer, field: []const u8) !void {
    const needs_quote = std.mem.indexOfAny(u8, field, ",\r\n\"") != null;
    if (!needs_quote) {
        try writer.writeAll(field);
        return;
    }
    try writer.writeByte('"');
    for (field) |c| {
        if (c == '"') {
            try writer.writeAll("\"\"");
        } else {
            try writer.writeByte(c);
        }
    }
    try writer.writeByte('"');
}

fn boolField(value: bool) []const u8 {
    return if (value) "1" else "0";
}

fn appendField(buf: *std.ArrayList(u8), allocator: std.mem.Allocator, field: []const u8) !void {
    if (buf.items.len > 0) try buf.append(allocator, ',');
    const needs_quote = std.mem.indexOfAny(u8, field, ",\r\n\"") != null;
    if (!needs_quote) {
        try buf.appendSlice(allocator, field);
        return;
    }
    try buf.append(allocator, '"');
    for (field) |c| {
        if (c == '"') {
            try buf.appendSlice(allocator, "\"\"");
        } else {
            try buf.append(allocator, c);
        }
    }
    try buf.append(allocator, '"');
}

fn formatOptionalU64(value: ?u64, scratch: *[32]u8) []const u8 {
    if (value) |v| return std.fmt.bufPrint(scratch, "{d}", .{v}) catch "";
    return "";
}

fn formatOptionalU32(value: ?u32, scratch: *[32]u8) []const u8 {
    if (value) |v| return std.fmt.bufPrint(scratch, "{d}", .{v}) catch "";
    return "";
}

fn formatOptionalI32(value: ?i32, scratch: *[32]u8) []const u8 {
    if (value) |v| return std.fmt.bufPrint(scratch, "{d}", .{v}) catch "";
    return "";
}

fn formatOrdinal(value: u32, scratch: *[32]u8) []const u8 {
    return std.fmt.bufPrint(scratch, "{d}", .{value}) catch "0";
}

fn rowToFields(row: Row, scratch64: *[32]u8, scratch32: *[32]u8) [field_names.len][]const u8 {
    return .{
        row.harness,
        row.batch,
        row.session_id,
        row.cwd,
        row.project_key,
        row.source_path,
        row.call_id,
        formatOrdinal(row.ordinal, scratch64),
        row.command,
        row.command_safe,
        row.command_sha256,
        row.command_norm_sha256,
        row.first_token,
        row.verb,
        row.subcommand,
        boolField(row.compound),
        boolField(row.pipe),
        boolField(row.heredoc),
        boolField(row.substitution),
        boolField(row.machine_format),
        formatOptionalU64(row.result_bytes, scratch64),
        formatOptionalU32(row.result_lines, scratch32),
        formatOptionalU32(row.result_nonempty_lines, scratch32),
        formatOptionalU32(row.result_unique_lines, scratch32),
        formatOptionalU32(row.result_max_line_bytes, scratch32),
        row.result_sha256,
        formatOptionalI32(row.exit_code, scratch32),
        boolField(row.is_error),
        boolField(row.result_missing),
    };
}

pub fn writeRows(allocator: std.mem.Allocator, writer: *std.Io.Writer, rows: []const Row) !void {
    var header: std.ArrayList(u8) = .empty;
    defer header.deinit(allocator);
    for (field_names, 0..) |name, idx| {
        if (idx > 0) try header.append(allocator, ',');
        try header.appendSlice(allocator, name);
    }
    try header.append(allocator, '\n');
    try writer.writeAll(header.items);

    var scratch64: [32]u8 = undefined;
    var scratch32: [32]u8 = undefined;
    for (rows) |row| {
        const fields = rowToFields(row, &scratch64, &scratch32);
        var line: std.ArrayList(u8) = .empty;
        defer line.deinit(allocator);
        for (fields) |field| try appendField(&line, allocator, field);
        try line.append(allocator, '\n');
        try writer.writeAll(line.items);
    }
}

fn parseCsvRecord(allocator: std.mem.Allocator, input: []const u8, start: *usize) !?[]const u8 {
    if (start.* >= input.len) return null;
    var out: std.ArrayList(u8) = .empty;
    errdefer out.deinit(allocator);

    if (input[start.*] == '"') {
        start.* += 1;
        while (start.* < input.len) {
            const c = input[start.*];
            start.* += 1;
            if (c == '"') {
                if (start.* < input.len and input[start.*] == '"') {
                    try out.append(allocator, '"');
                    start.* += 1;
                } else break;
            } else {
                try out.append(allocator, c);
            }
        }
        if (start.* < input.len and input[start.*] == ',') start.* += 1;
        return try out.toOwnedSlice(allocator);
    }

    const field_start = start.*;
    while (start.* < input.len and input[start.*] != ',') : (start.* += 1) {}
    const field_end = start.*;
    if (start.* < input.len and input[start.*] == ',') start.* += 1;
    return try allocator.dupe(u8, input[field_start..field_end]);
}

fn parseBool(raw: []const u8) bool {
    return std.mem.eql(u8, raw, "1") or std.mem.eql(u8, raw, "true");
}

fn parseOptionalU64(raw: []const u8) ?u64 {
    if (raw.len == 0) return null;
    return std.fmt.parseInt(u64, raw, 10) catch null;
}

fn parseOptionalU32(raw: []const u8) ?u32 {
    if (raw.len == 0) return null;
    return std.fmt.parseInt(u32, raw, 10) catch null;
}

fn parseOptionalI32(raw: []const u8) ?i32 {
    if (raw.len == 0) return null;
    return std.fmt.parseInt(i32, raw, 10) catch null;
}

fn csvRecordEnd(data: []const u8, start: usize) ?usize {
    var i = start;
    var in_quotes = false;
    while (i < data.len) {
        const c = data[i];
        if (c == '"') {
            if (in_quotes and i + 1 < data.len and data[i + 1] == '"') {
                i += 2;
                continue;
            }
            in_quotes = !in_quotes;
            i += 1;
            continue;
        }
        if (!in_quotes and c == '\n') return i;
        i += 1;
    }
    if (start < data.len) return data.len;
    return null;
}

fn advancePastNewline(data: []const u8, pos: *usize) void {
    while (pos.* < data.len) {
        if (data[pos.*] == '\r') {
            pos.* += 1;
            if (pos.* < data.len and data[pos.*] == '\n') pos.* += 1;
            return;
        }
        if (data[pos.*] == '\n') {
            pos.* += 1;
            return;
        }
        break;
    }
}

pub fn readRows(allocator: std.mem.Allocator, content: []const u8) ![]Row {
    if (content.len == 0) return error.InvalidCsv;

    var pos: usize = 0;
    const header_end = csvRecordEnd(content, pos) orelse return error.InvalidCsv;
    pos = header_end;
    advancePastNewline(content, &pos);

    var rows: std.ArrayList(Row) = .empty;
    errdefer {
        for (rows.items) |row| freeRow(allocator, row);
        rows.deinit(allocator);
    }

    while (pos < content.len) {
        if (content[pos] == '\r' or content[pos] == '\n') {
            advancePastNewline(content, &pos);
            continue;
        }
        const end = csvRecordEnd(content, pos) orelse break;

        const record = content[pos..end];
        var cursor: usize = 0;
        var fields: std.ArrayList([]const u8) = .empty;
        errdefer {
            for (fields.items) |f| allocator.free(f);
            fields.deinit(allocator);
        }
        while (cursor < record.len or fields.items.len < field_names.len) {
            const field = (try parseCsvRecord(allocator, record, &cursor)) orelse break;
            try fields.append(allocator, field);
            if (cursor >= record.len) break;
        }
        if (fields.items.len != field_names.len) {
            for (fields.items) |f| allocator.free(f);
            return error.InvalidCsv;
        }

        const ordinal = std.fmt.parseInt(u32, fields.items[7], 10) catch return error.InvalidCsv;
        const row = Row{
            .harness = fields.items[0],
            .batch = fields.items[1],
            .session_id = fields.items[2],
            .cwd = fields.items[3],
            .project_key = fields.items[4],
            .source_path = fields.items[5],
            .call_id = fields.items[6],
            .ordinal = ordinal,
            .command = fields.items[8],
            .command_safe = fields.items[9],
            .command_sha256 = fields.items[10],
            .command_norm_sha256 = fields.items[11],
            .first_token = fields.items[12],
            .verb = fields.items[13],
            .subcommand = fields.items[14],
            .compound = parseBool(fields.items[15]),
            .pipe = parseBool(fields.items[16]),
            .heredoc = parseBool(fields.items[17]),
            .substitution = parseBool(fields.items[18]),
            .machine_format = parseBool(fields.items[19]),
            .result_bytes = parseOptionalU64(fields.items[20]),
            .result_lines = parseOptionalU32(fields.items[21]),
            .result_nonempty_lines = parseOptionalU32(fields.items[22]),
            .result_unique_lines = parseOptionalU32(fields.items[23]),
            .result_max_line_bytes = parseOptionalU32(fields.items[24]),
            .result_sha256 = fields.items[25],
            .exit_code = parseOptionalI32(fields.items[26]),
            .is_error = parseBool(fields.items[27]),
            .result_missing = parseBool(fields.items[28]),
        };
        try rows.append(allocator, row);
        for ([_]usize{ 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28 }) |idx| {
            allocator.free(fields.items[idx]);
        }
        allocator.free(fields.items[7]);
        fields.deinit(allocator);

        pos = end;
        advancePastNewline(content, &pos);
    }
    return try rows.toOwnedSlice(allocator);
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

pub fn freeRows(allocator: std.mem.Allocator, rows: []Row) void {
    for (rows) |row| freeRow(allocator, row);
    allocator.free(rows);
}

test "field_names order is stable" {
    try std.testing.expectEqualStrings("harness", field_names[0]);
    try std.testing.expectEqualStrings("result_missing", field_names[field_names.len - 1]);
}

test "csv round trip preserves row fields" {
    const allocator = std.testing.allocator;
    const csv_text =
        \\harness,batch,session_id,cwd,project_key,source_path,call_id,ordinal,command,command_safe,command_sha256,command_norm_sha256,first_token,verb,subcommand,compound,pipe,heredoc,substitution,machine_format,result_bytes,result_lines,result_nonempty_lines,result_unique_lines,result_max_line_bytes,result_sha256,exit_code,is_error,result_missing
        \\pi,b1,sess-1,/tmp,agent-core,/tmp/s.json,c1,3,git status --porcelain,git status --porcelain,abc,def,git,git,status,0,0,0,0,1,10,2,1,1,5,fff,0,0,0
    ;

    const parsed = try readRows(allocator, csv_text);
    defer freeRows(allocator, parsed);
    try std.testing.expectEqual(@as(usize, 1), parsed.len);
    try std.testing.expectEqualStrings("pi", parsed[0].harness);
    try std.testing.expectEqualStrings("status", parsed[0].subcommand);
    try std.testing.expect(parsed[0].machine_format);
    try std.testing.expectEqual(@as(u32, 3), parsed[0].ordinal);
}

test "csv bool and optional field formatting" {
    try std.testing.expectEqualStrings("1", boolField(true));
    try std.testing.expectEqualStrings("0", boolField(false));
    var scratch64: [32]u8 = undefined;
    var scratch32: [32]u8 = undefined;
    const row = Row{
        .harness = "pi",
        .batch = "b1",
        .session_id = "s",
        .cwd = "/tmp",
        .project_key = "p",
        .source_path = "/tmp/s.json",
        .call_id = "c",
        .ordinal = 1,
        .command = "ls",
        .command_safe = "ls",
        .command_sha256 = "a",
        .command_norm_sha256 = "b",
        .first_token = "ls",
        .verb = "ls",
        .subcommand = "",
        .compound = true,
        .pipe = false,
        .heredoc = false,
        .substitution = false,
        .machine_format = false,
        .result_bytes = 9,
        .result_lines = 1,
        .result_nonempty_lines = 1,
        .result_unique_lines = 1,
        .result_max_line_bytes = 9,
        .result_sha256 = "c",
        .exit_code = 2,
        .is_error = true,
        .result_missing = false,
    };
    const fields = rowToFields(row, &scratch64, &scratch32);
    try std.testing.expectEqualStrings("1", fields[15]);
    try std.testing.expectEqualStrings("2", fields[26]);
    try std.testing.expectEqualStrings("1", fields[27]);
}
