const std = @import("std");
const llm = @import("llm.zig");
const belief = @import("belief.zig");
const match = @import("match.zig");
const vein = @import("vein");

pub const Label = enum {
    shaped,
    echoed,
    theme_only,
    unclassified,

    pub fn parse(text: []const u8) ?Label {
        const trimmed = std.mem.trim(u8, text, " \t\r\n");
        const line_end = std.mem.indexOfScalar(u8, trimmed, '\n') orelse trimmed.len;
        const first_line = std.mem.trim(u8, trimmed[0..line_end], " \t\r\n");
        if (std.ascii.eqlIgnoreCase(first_line, "SHAPED")) return .shaped;
        if (std.ascii.eqlIgnoreCase(first_line, "ECHOED")) return .echoed;
        if (std.ascii.eqlIgnoreCase(first_line, "THEME-ONLY") or
            std.ascii.eqlIgnoreCase(first_line, "THEME_ONLY") or
            std.ascii.eqlIgnoreCase(first_line, "THEME ONLY"))
            return .theme_only;
        return null;
    }

    pub fn jsonString(self: Label) []const u8 {
        return switch (self) {
            .shaped => "SHAPED",
            .echoed => "ECHOED",
            .theme_only => "THEME-ONLY",
            .unclassified => "UNCLASSIFIED",
        };
    }
};

pub const EvidenceHit = struct {
    session_id: []const u8,
    atom_hint: []const u8,
    line: u32,
    snippet: []const u8,
    decoy: bool = false,
};

pub const ClassifiedHit = struct {
    session_id: []const u8,
    atom_hint: []const u8,
    line: u32,
    snippet: []const u8,
    decoy: bool,
    label: Label,
};

pub const Options = struct {
    llm: llm.Config = .{},
    io: std.Io,
};

pub const Result = struct {
    hits: []ClassifiedHit,
    llm_available: bool,
};

pub fn run(allocator: std.mem.Allocator, opts: Options, evidence: []const EvidenceHit) !Result {
    var llm_up = llm.probe(allocator, opts.io, opts.llm) catch |e| blk: {
        std.debug.print("classify.probe err={s} evidence={d}\n", .{@errorName(e), evidence.len});
        break :blk false;
    };
    std.debug.print("classify.probe llm_up={} evidence={d}\n", .{llm_up, evidence.len});

    var out = std.ArrayList(ClassifiedHit).empty;
    errdefer {
        for (out.items) |h| {
            allocator.free(h.session_id);
            allocator.free(h.atom_hint);
            allocator.free(h.snippet);
        }
        out.deinit(allocator);
    }

    for (evidence) |hit| {
        const label: Label = if (!llm_up) .unclassified else blk: {
            const raw = llm.classifySnippet(allocator, opts.io, opts.llm, hit.atom_hint, hit.snippet) catch |e| {
                std.debug.print("classifySnippet err={s} atom_len={d} snip_len={d}\n", .{@errorName(e), hit.atom_hint.len, hit.snippet.len});
                llm_up = false;
                break :blk .unclassified;
            };
            defer allocator.free(raw);
            const parsed = Label.parse(raw) orelse {
                std.debug.print("classify parse miss raw={s}\n", .{raw[0..@min(raw.len, 80)]});
                break :blk .unclassified;
            };
            break :blk parsed;
        };

        try out.append(allocator, .{
            .session_id = try allocator.dupe(u8, hit.session_id),
            .atom_hint = try allocator.dupe(u8, hit.atom_hint),
            .line = hit.line,
            .snippet = try allocator.dupe(u8, hit.snippet),
            .decoy = hit.decoy,
            .label = label,
        });
    }

    return .{
        .hits = try out.toOwnedSlice(allocator),
        .llm_available = llm_up,
    };
}

/// Single-hit classify API for golden integration.
pub fn classifyHit(
    allocator: std.mem.Allocator,
    hit: match.Evidence,
    atom_text: []const u8,
) !Label {
    const io = vein.io_ctx.io();
    const raw = llm.classifySnippet(allocator, io, .{}, atom_text, hit.snippet) catch return error.LlmUnavailable;
    defer allocator.free(raw);
    return Label.parse(raw) orelse .unclassified;
}

pub fn writeJsonl(allocator: std.mem.Allocator, path: []const u8, hits: []const ClassifiedHit) !void {
    _ = allocator;
    var file = try std.fs.createFileAbsolute(path, .{});
    defer file.close();

    for (hits) |hit| {
        var line_buf: [4096]u8 = undefined;
        const line = try std.fmt.bufPrint(
            &line_buf,
            "{{\"session\":\"{s}\",\"atom\":\"{s}\",\"line\":{d},\"decoy\":{},\"label\":\"{s}\",\"evidence\":\"line {d}: {s}\"}}\n",
            .{
                hit.session_id,
                truncateAtom(hit.atom_hint),
                hit.line,
                hit.decoy,
                hit.label.jsonString(),
                hit.line,
                truncateSnippet(hit.snippet),
            },
        );
        try file.writeAll(line);
    }
}

fn truncateAtom(text: []const u8) []const u8 {
    if (text.len <= 60) return text;
    return text[0..60];
}

fn truncateSnippet(text: []const u8) []const u8 {
    if (text.len <= 80) return text;
    var end: usize = 80;
    while (end > 0 and !std.unicode.utf8ValidateSlice(text[0..end])) end -= 1;
    return text[0..end];
}

pub fn freeResult(allocator: std.mem.Allocator, result: *Result) void {
    for (result.hits) |h| {
        allocator.free(h.session_id);
        allocator.free(h.atom_hint);
        allocator.free(h.snippet);
    }
    allocator.free(result.hits);
    result.* = .{ .hits = &.{}, .llm_available = false };
}

test "LLM-down path yields UNCLASSIFIED without inventing labels" {
    const evidence = [_]EvidenceHit{
        .{
            .session_id = "test-session",
            .atom_hint = "Motion is the metric.",
            .line = 42,
            .snippet = "motion is the metric in assistant output",
            .decoy = false,
        },
    };

    const result = try run(std.testing.allocator, .{
        .llm = .{ .base_url = "http://127.0.0.1:1/v1", .probe_timeout_ms = 100 },
        .io = std.testing.io,
    }, &evidence);
    defer freeResult(std.testing.allocator, &result);

    try std.testing.expect(!result.llm_available);
    try std.testing.expectEqual(@as(usize, 1), result.hits.len);
    try std.testing.expect(result.hits[0].label == .unclassified);
}

test "multiple hits with dead LLM stay UNCLASSIFIED (fail-fast, no per-hit chat)" {
    const evidence = [_]EvidenceHit{
        .{ .session_id = "s", .atom_hint = "atom one", .line = 1, .snippet = "snippet one", .decoy = false },
        .{ .session_id = "s", .atom_hint = "atom two", .line = 2, .snippet = "snippet two", .decoy = false },
        .{ .session_id = "s", .atom_hint = "atom three", .line = 3, .snippet = "snippet three", .decoy = false },
    };

    const result = try run(std.testing.allocator, .{
        .llm = .{ .base_url = "http://127.0.0.1:1/v1", .probe_timeout_ms = 100 },
        .io = std.testing.io,
    }, &evidence);
    defer freeResult(std.testing.allocator, &result);

    try std.testing.expect(!result.llm_available);
    try std.testing.expectEqual(@as(usize, 3), result.hits.len);
    for (result.hits) |hit| {
        try std.testing.expect(hit.label == .unclassified);
    }
}

test "attribution rule is in llm module" {
    try std.testing.expect(std.mem.indexOf(u8, llm.AttributionRule, "THE ATOM'S OWN claim language") != null);
}

test "belief id helper links" {
    const norm = try belief.normalizeClaim(std.testing.allocator, "test claim");
    defer std.testing.allocator.free(norm);
    var id: [belief.IdLen]u8 = undefined;
    belief.beliefId(norm, &id);
    try std.testing.expectEqual(@as(usize, 12), id.len);
}
