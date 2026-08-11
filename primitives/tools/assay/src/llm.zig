const std = @import("std");

pub const LlmUnavailable = error{
    LlmUnavailable,
    OutOfMemory,
};

pub const Config = struct {
    base_url: []const u8 = "http://127.0.0.1:10240/v1",
    model: ?[]const u8 = null,
    probe_timeout_ms: u32 = 5000,
    chat_timeout_ms: u32 = 60000,
};

pub const AttributionRule =
    \\evidence must match THE ATOM'S OWN claim language, not merely its theme.
;

pub fn probe(allocator: std.mem.Allocator, io: std.Io, config: Config) LlmUnavailable!bool {
    const url = try std.fmt.allocPrint(allocator, "{s}/models", .{config.base_url});
    defer allocator.free(url);

    var body = std.ArrayList(u8).empty;
    defer body.deinit(allocator);
    var writer = std.Io.Writer.fromArrayList(&body);

    var client: std.http.Client = .{ .allocator = allocator, .io = io };
    defer client.deinit();

    const result = client.fetch(.{
        .location = .{ .url = url },
        .response_writer = &writer,
        .keep_alive = false,
    }) catch return error.LlmUnavailable;

    if (result.status != .ok) return error.LlmUnavailable;
    if (body.items.len == 0) return false;

    const model = pickModel(allocator, io, config) catch return false;
    defer allocator.free(model);

    return probeChat(allocator, io, config, model);
}

fn probeChat(allocator: std.mem.Allocator, io: std.Io, config: Config, model: []const u8) LlmUnavailable!bool {
    const payload = try buildChatPayload(allocator, model, "Reply OK.", "ping");
    defer allocator.free(payload);

    const url = try std.fmt.allocPrint(allocator, "{s}/chat/completions", .{config.base_url});
    defer allocator.free(url);

    var body = std.ArrayList(u8).empty;
    defer body.deinit(allocator);
    var writer = std.Io.Writer.fromArrayList(&body);

    var client: std.http.Client = .{ .allocator = allocator, .io = io };
    defer client.deinit();

    const headers = [_]std.http.Header{
        .{ .name = "Content-Type", .value = "application/json" },
    };

    const result = client.fetch(.{
        .location = .{ .url = url },
        .method = .POST,
        .payload = payload,
        .extra_headers = &headers,
        .response_writer = &writer,
        .keep_alive = false,
    }) catch return false;

    return result.status == .ok;
}

pub fn pickModel(allocator: std.mem.Allocator, io: std.Io, config: Config) LlmUnavailable![]const u8 {
    if (config.model) |m| return try allocator.dupe(u8, m);

    const url = try std.fmt.allocPrint(allocator, "{s}/models", .{config.base_url});
    defer allocator.free(url);

    var body = std.ArrayList(u8).empty;
    defer body.deinit(allocator);
    var writer = std.Io.Writer.fromArrayList(&body);

    var client: std.http.Client = .{ .allocator = allocator, .io = io };
    defer client.deinit();

    const result = client.fetch(.{
        .location = .{ .url = url },
        .response_writer = &writer,
        .keep_alive = false,
    }) catch return error.LlmUnavailable;
    if (result.status != .ok) return error.LlmUnavailable;

    // Minimal parse: first "id":"model-name"
    const needle = "\"id\":\"";
    if (std.mem.indexOf(u8, body.items, needle)) |start| {
        const rest = body.items[start + needle.len ..];
        if (std.mem.indexOf(u8, rest, "\"")) |end| {
            return try allocator.dupe(u8, rest[0..end]);
        }
    }
    return error.LlmUnavailable;
}

pub fn classifySnippet(
    allocator: std.mem.Allocator,
    io: std.Io,
    config: Config,
    atom_claim: []const u8,
    evidence_snippet: []const u8,
) LlmUnavailable![]const u8 {
    const model = try pickModel(allocator, io, config);
    defer allocator.free(model);

    const system_prompt =
        \\You classify memory propagation evidence. Reply with exactly one label on its own line:
        \\SHAPED | ECHOED | THEME-ONLY
        \\Attribution rule: evidence must match THE ATOM'S OWN claim language, not merely its theme.
        \\SHAPED = atom language drove a decision or direction change.
        \\ECHOED = claim language reappears without visible behavioral consequence.
        \\THEME-ONLY = thematic overlap without the atom's own claim language.
    ;

    const user_prompt = try std.fmt.allocPrint(
        allocator,
        "Atom claim:\n{s}\n\nEvidence snippet:\n{s}\n\nLabel:",
        .{ atom_claim, evidence_snippet },
    );
    defer allocator.free(user_prompt);

    const payload = try buildChatPayload(allocator, model, system_prompt, user_prompt);
    defer allocator.free(payload);

    const url = try std.fmt.allocPrint(allocator, "{s}/chat/completions", .{config.base_url});
    defer allocator.free(url);

    var body = std.ArrayList(u8).empty;
    defer body.deinit(allocator);
    var writer = std.Io.Writer.fromArrayList(&body);

    var client: std.http.Client = .{ .allocator = allocator, .io = io };
    defer client.deinit();

    const headers = [_]std.http.Header{
        .{ .name = "Content-Type", .value = "application/json" },
    };

    const result = client.fetch(.{
        .location = .{ .url = url },
        .method = .POST,
        .payload = payload,
        .extra_headers = &headers,
        .response_writer = &writer,
        .keep_alive = false,
    }) catch return error.LlmUnavailable;

    if (result.status != .ok) return error.LlmUnavailable;

    return try extractAssistantContent(allocator, body.items);
}

fn buildChatPayload(
    allocator: std.mem.Allocator,
    model: []const u8,
    system_prompt: []const u8,
    user_prompt: []const u8,
) ![]const u8 {
    var out = std.ArrayList(u8).empty;
    errdefer out.deinit(allocator);

    try out.appendSlice(allocator, "{\"model\":\"");
    try jsonAppendEscaped(&out, allocator, model);
    try out.appendSlice(allocator, "\",\"messages\":[{\"role\":\"system\",\"content\":\"");
    try jsonAppendEscaped(&out, allocator, system_prompt);
    try out.appendSlice(allocator, "\"},{\"role\":\"user\",\"content\":\"");
    try jsonAppendEscaped(&out, allocator, user_prompt);
    try out.appendSlice(allocator, "\"}],\"temperature\":0}");
    return try out.toOwnedSlice(allocator);
}

fn jsonAppendEscaped(out: *std.ArrayList(u8), allocator: std.mem.Allocator, text: []const u8) !void {
    for (text) |c| switch (c) {
        '\\' => try out.appendSlice(allocator, "\\\\"),
        '"' => try out.appendSlice(allocator, "\\\""),
        '\n' => try out.appendSlice(allocator, "\\n"),
        '\r' => try out.appendSlice(allocator, "\\r"),
        '\t' => try out.appendSlice(allocator, "\\t"),
        else => try out.append(allocator, c),
    };
}

fn extractAssistantContent(allocator: std.mem.Allocator, response: []const u8) ![]const u8 {
    const content_key = "\"content\":\"";
    var search_from: usize = 0;
    while (std.mem.indexOfPos(u8, response, search_from, content_key)) |start| {
        const rest = response[start + content_key.len ..];
        var out = std.ArrayList(u8).empty;
        errdefer out.deinit(allocator);
        var i: usize = 0;
        while (i < rest.len) : (i += 1) {
            const c = rest[i];
            if (c == '\\' and i + 1 < rest.len) {
                const next = rest[i + 1];
                switch (next) {
                    'n' => try out.append(allocator, '\n'),
                    'r' => try out.append(allocator, '\r'),
                    't' => try out.append(allocator, '\t'),
                    '\\' => try out.append(allocator, '\\'),
                    '"' => try out.append(allocator, '"'),
                    else => try out.append(allocator, next),
                }
                i += 1;
            } else if (c == '"') {
                return try out.toOwnedSlice(allocator);
            } else {
                try out.append(allocator, c);
            }
        }
        search_from = start + 1;
    }
    return error.LlmUnavailable;
}

test "probe against bad port returns LlmUnavailable" {
    const available = probe(std.testing.allocator, std.testing.io, .{
        .base_url = "http://127.0.0.1:1/v1",
        .probe_timeout_ms = 200,
    });
    try std.testing.expectError(LlmUnavailable, available);
}
