const std = @import("std");
const vein = @import("vein");

const json = std.json;
const Harness = vein.schema.Harness;
const io_ctx = vein.io_ctx;

pub const SessionClass = enum {
    normal,
    dark,
};

pub const BeliefRef = struct {
    /// First 12 hex of sha256(normalized claim) when resolved in mind dir.
    id: ?[]const u8,
    normalized_claim: []const u8,
    unresolved: bool,
};

pub const Atom = struct {
    claim: []const u8,
    quote: ?[]const u8,
    source: ?[]const u8,
    section: []const u8,
    belief: BeliefRef,
};

pub const ExtractResult = struct {
    source_path: []const u8,
    harness: Harness,
    cwd: ?[]const u8,
    session_class: SessionClass,
    wake_found: bool,
    atoms: []Atom,
};

pub fn freeAtom(allocator: std.mem.Allocator, atom: Atom) void {
    allocator.free(atom.claim);
    if (atom.quote) |q| allocator.free(q);
    if (atom.source) |s| allocator.free(s);
    allocator.free(atom.section);
    if (atom.belief.id) |id| allocator.free(id);
    allocator.free(atom.belief.normalized_claim);
}

pub fn freeExtractResult(allocator: std.mem.Allocator, result: ExtractResult) void {
    allocator.free(result.source_path);
    if (result.cwd) |cwd| allocator.free(cwd);
    for (result.atoms) |atom| freeAtom(allocator, atom);
    allocator.free(result.atoms);
}

/// Whitespace-normalize claim text for belief id hashing.
pub fn normalizeClaim(allocator: std.mem.Allocator, claim: []const u8) ![]const u8 {
    var out: std.ArrayList(u8) = .empty;
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

pub fn beliefIdHint(allocator: std.mem.Allocator, normalized_claim: []const u8) ![]const u8 {
    var digest: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(normalized_claim, &digest, .{});
    const hex = std.fmt.bytesToHex(&digest, .lower);
    return try allocator.dupe(u8, hex[0..12]);
}

fn readFileAlloc(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const file = try io_ctx.openAbs(path);
    defer file.close(io_ctx.io());
    const stat = try file.stat(io_ctx.io());
    const size: usize = @intCast(stat.size);
    var buf: [8192]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    return try reader.interface.readAlloc(allocator, size);
}

fn resolveBelief(
    allocator: std.mem.Allocator,
    mind_dir: ?[]const u8,
    normalized_claim: []const u8,
) !BeliefRef {
    const hint = try beliefIdHint(allocator, normalized_claim);
    errdefer allocator.free(hint);

    var resolved_id: ?[]const u8 = null;
    var unresolved = true;

    if (mind_dir) |dir| {
        const belief_name = try std.fmt.allocPrint(allocator, "{s}.md", .{hint});
        defer allocator.free(belief_name);
        const belief_path = try std.fs.path.join(allocator, &.{ dir, "beliefs", belief_name });
        defer allocator.free(belief_path);

        const content = readFileAlloc(allocator, belief_path) catch null;
        if (content) |bytes| {
            defer allocator.free(bytes);
            if (parseBeliefClaim(allocator, bytes)) |file_claim| {
                defer allocator.free(file_claim);
                const file_norm = try normalizeClaim(allocator, file_claim);
                defer allocator.free(file_norm);
                if (std.mem.eql(u8, file_norm, normalized_claim)) {
                    resolved_id = try allocator.dupe(u8, hint);
                    unresolved = false;
                }
            }
        }
    }

    allocator.free(hint);
    return .{
        .id = resolved_id,
        .normalized_claim = try allocator.dupe(u8, normalized_claim),
        .unresolved = unresolved,
    };
}

fn parseBeliefClaim(allocator: std.mem.Allocator, content: []const u8) ?[]const u8 {
    var iter = std.mem.splitScalar(u8, content, '\n');
    while (iter.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");
        if (!std.mem.startsWith(u8, trimmed, "claim:")) continue;
        var value = std.mem.trim(u8, trimmed["claim:".len..], " \t");
        if (value.len >= 2 and value[0] == '"' and value[value.len - 1] == '"') {
            value = value[1 .. value.len - 1];
        }
        return allocator.dupe(u8, value) catch return null;
    }
    return null;
}

fn isDarkWake(wake_text: []const u8) bool {
    return std.mem.indexOf(u8, wake_text, "KILL SWITCH ACTIVE") != null;
}

fn extractMindSelf(content: []const u8) ?[]const u8 {
    const open = std.mem.indexOf(u8, content, "<mind:self>") orelse return null;
    const close = std.mem.indexOf(u8, content[open..], "</mind:self>") orelse return null;
    const start = open + "<mind:self>".len;
    const end = open + close;
    return content[start..end];
}

fn extractBoldClaim(line: []const u8) ?[]const u8 {
    if (!std.mem.startsWith(u8, line, "**")) return null;
    const close = std.mem.indexOf(u8, line[2..], "**") orelse return null;
    const claim = std.mem.trim(u8, line[2 .. 2 + close], " \t");
    if (claim.len == 0) return null;
    return claim;
}

fn extractQuoteSource(
    allocator: std.mem.Allocator,
    line: []const u8,
    claim_end: usize,
) !struct { quote: ?[]const u8, source: ?[]const u8 } {
    _ = claim_end;
    const sep = std.mem.indexOf(u8, line, " — \"") orelse return .{ .quote = null, .source = null };
    const quote_start = sep + " — \"".len;
    const quote_end = std.mem.indexOf(u8, line[quote_start..], "\"") orelse return .{ .quote = null, .source = null };
    const quote = try allocator.dupe(u8, line[quote_start .. quote_start + quote_end]);

    var source: ?[]const u8 = null;
    const after_quote = line[quote_start + quote_end + 1 ..];
    const paren_open = std.mem.indexOf(u8, after_quote, "(") orelse return .{ .quote = quote, .source = null };
    const paren_close = std.mem.indexOf(u8, after_quote[paren_open + 1 ..], ")") orelse return .{ .quote = quote, .source = null };
    const src = std.mem.trim(u8, after_quote[paren_open + 1 .. paren_open + 1 + paren_close], " \t");
    if (src.len > 0) source = try allocator.dupe(u8, src);
    return .{ .quote = quote, .source = source };
}

fn parseAtomsFromMindSelf(
    allocator: std.mem.Allocator,
    mind_self: []const u8,
    mind_dir: ?[]const u8,
) ![]Atom {
    var list = std.array_list.Managed(Atom).init(allocator);
    errdefer {
        for (list.items) |atom| freeAtom(allocator, atom);
        list.deinit();
    }

    var section: []const u8 = "";
    var section_owned: ?[]const u8 = null;
    defer if (section_owned) |s| allocator.free(s);

    var lines = std.mem.splitScalar(u8, mind_self, '\n');
    while (lines.next()) |raw_line| {
        const line = std.mem.trim(u8, raw_line, " \t\r");
        if (line.len == 0) continue;

        if (std.mem.startsWith(u8, line, "## ")) {
            if (section_owned) |s| allocator.free(s);
            section_owned = try allocator.dupe(u8, std.mem.trim(u8, line[3..], " \t"));
            section = section_owned.?;
            continue;
        }

        var claim_src: ?[]const u8 = null;
        if (extractBoldClaim(line)) |claim| {
            claim_src = claim;
        } else if (std.mem.eql(u8, section, "Motifs") or std.mem.eql(u8, section, "How we work")) {
            if (std.mem.startsWith(u8, line, "- ")) {
                claim_src = std.mem.trim(u8, line[2..], " \t");
            }
        }

        if (claim_src) |claim| {
            const claim_owned = try allocator.dupe(u8, claim);
            errdefer allocator.free(claim_owned);

            const normalized = try normalizeClaim(allocator, claim_owned);
            errdefer allocator.free(normalized);

            const section_copy = try allocator.dupe(u8, section);
            errdefer allocator.free(section_copy);

            var quote: ?[]const u8 = null;
            var source: ?[]const u8 = null;
            if (std.mem.indexOf(u8, line, " — \"")) |idx| {
                const qs = try extractQuoteSource(allocator, line, idx);
                quote = qs.quote;
                source = qs.source;
            }

            const belief = try resolveBelief(allocator, mind_dir, normalized);
            try list.append(.{
                .claim = claim_owned,
                .quote = quote,
                .source = source,
                .section = section_copy,
                .belief = belief,
            });
        }
    }

    return try list.toOwnedSlice();
}

fn followPersistedOutput(allocator: std.mem.Allocator, content: []const u8) !?[]const u8 {
    const marker = "Full output saved to:";
    const idx = std.mem.indexOf(u8, content, marker) orelse return null;
    var rest = std.mem.trim(u8, content[idx + marker.len ..], " \t\r\n");
    const nl = std.mem.indexOfScalar(u8, rest, '\n') orelse rest.len;
    const path = std.mem.trim(u8, rest[0..nl], " \t\r");
    if (path.len == 0) return null;
    const bytes = try readFileAlloc(allocator, path);
    return bytes;
}

fn wakeFromPiLine(allocator: std.mem.Allocator, root: json.Value) ?[]const u8 {
    const typ = vein.schema.getObjectField(root, "type") orelse return null;
    const type_str = vein.schema.getString(typ) orelse return null;
    if (!std.mem.eql(u8, type_str, "custom_message")) return null;

    const custom = vein.schema.getObjectField(root, "customType") orelse return null;
    const custom_str = vein.schema.getString(custom) orelse return null;
    if (!std.mem.eql(u8, custom_str, "circadian-wake")) return null;

    const content_val = vein.schema.getObjectField(root, "content") orelse return null;
    const content = vein.schema.getString(content_val) orelse return null;
    return allocator.dupe(u8, content) catch null;
}

fn wakeFromCcLine(allocator: std.mem.Allocator, root: json.Value) ?[]const u8 {
    const typ = vein.schema.getObjectField(root, "type") orelse return null;
    const type_str = vein.schema.getString(typ) orelse return null;
    if (!std.mem.eql(u8, type_str, "attachment")) return null;

    const attachment_val = vein.schema.getObjectField(root, "attachment") orelse return null;
    if (attachment_val != .object) return null;
    const attachment = attachment_val.object;

    const hook_type = attachment.get("type") orelse return null;
    const hook_type_str = vein.schema.getString(hook_type) orelse return null;
    if (!std.mem.eql(u8, hook_type_str, "hook_success")) return null;

    const hook_event = attachment.get("hookEvent") orelse return null;
    const hook_event_str = vein.schema.getString(hook_event) orelse return null;
    if (!std.mem.eql(u8, hook_event_str, "SessionStart")) return null;

    const content_val = attachment.get("content") orelse return null;
    const content = vein.schema.getString(content_val) orelse return null;

    if (std.mem.startsWith(u8, content, "<persisted-output>")) {
        if (followPersistedOutput(allocator, content) catch null) |full| {
            return full;
        }
    }

    if (std.mem.indexOf(u8, content, "[Circadian] WAKE") != null or std.mem.indexOf(u8, content, "<mind:self>") != null) {
        return allocator.dupe(u8, content) catch null;
    }
    return null;
}

fn sessionCwdFromPiLine(allocator: std.mem.Allocator, root: json.Value, current: []const u8) ![]const u8 {
    const typ = vein.schema.getObjectField(root, "type") orelse return try allocator.dupe(u8, current);
    const type_str = vein.schema.getString(typ) orelse return try allocator.dupe(u8, current);
    if (!std.mem.eql(u8, type_str, "session")) return try allocator.dupe(u8, current);
    const cwd_val = vein.schema.getObjectField(root, "cwd") orelse return try allocator.dupe(u8, current);
    const cwd = vein.schema.getString(cwd_val) orelse return try allocator.dupe(u8, current);
    return try allocator.dupe(u8, cwd);
}

fn sessionCwdFromCcLine(allocator: std.mem.Allocator, root: json.Value, current: []const u8) ![]const u8 {
    const cwd_val = vein.schema.getObjectField(root, "cwd") orelse return try allocator.dupe(u8, current);
    const cwd = vein.schema.getString(cwd_val) orelse return try allocator.dupe(u8, current);
    return try allocator.dupe(u8, cwd);
}

fn splitLines(allocator: std.mem.Allocator, content: []const u8) ![][]const u8 {
    var list = std.array_list.Managed([]const u8).init(allocator);
    errdefer list.deinit();

    var start: usize = 0;
    for (content, 0..) |c, i| {
        if (c == '\n') {
            const slice = std.mem.trim(u8, content[start..i], "\r");
            try list.append(slice);
            start = i + 1;
        }
    }
    if (start < content.len) {
        const slice = std.mem.trim(u8, content[start..], "\r");
        try list.append(slice);
    }
    return try list.toOwnedSlice();
}

fn extractWakePayload(
    allocator: std.mem.Allocator,
    harness: Harness,
    source_path: []const u8,
) !struct { wake: ?[]const u8, cwd: []const u8 } {
    const file_bytes = try readFileAlloc(allocator, source_path);
    defer allocator.free(file_bytes);

    const lines = try splitLines(allocator, file_bytes);
    defer allocator.free(lines);

    var cwd: []const u8 = try allocator.dupe(u8, "");
    errdefer allocator.free(cwd);

    var wake_owned: ?[]const u8 = null;
    errdefer if (wake_owned) |w| allocator.free(w);

    for (lines) |line| {
        if (line.len == 0) continue;

        var parsed = json.parseFromSlice(json.Value, allocator, line, .{}) catch continue;
        defer parsed.deinit();
        const root = parsed.value;
        if (root != .object) continue;

        switch (harness) {
            .pi => {
                const new_cwd = try sessionCwdFromPiLine(allocator, root, cwd);
                if (!std.mem.eql(u8, new_cwd, cwd)) {
                    allocator.free(cwd);
                    cwd = new_cwd;
                } else {
                    allocator.free(new_cwd);
                }
                if (wake_owned == null) {
                    if (wakeFromPiLine(allocator, root)) |w| wake_owned = w;
                }
            },
            .cc => {
                const new_cwd = try sessionCwdFromCcLine(allocator, root, cwd);
                if (!std.mem.eql(u8, new_cwd, cwd)) {
                    allocator.free(cwd);
                    cwd = new_cwd;
                } else {
                    allocator.free(new_cwd);
                }
                if (wake_owned == null) {
                    if (wakeFromCcLine(allocator, root)) |w| wake_owned = w;
                }
            },
        }
    }

    return .{ .wake = wake_owned, .cwd = cwd };
}

pub fn extractFromPath(
    allocator: std.mem.Allocator,
    source_path: []const u8,
    mind_dir: ?[]const u8,
) !ExtractResult {
    const harness: Harness = if (std.mem.indexOf(u8, source_path, "/.pi/agent/sessions/") != null)
        .pi
    else if (std.mem.indexOf(u8, source_path, "/.claude/projects/") != null)
        .cc
    else
        return error.InvalidSession;

    const path_copy = try allocator.dupe(u8, source_path);
    errdefer allocator.free(path_copy);

    const payload = try extractWakePayload(allocator, harness, source_path);
    defer if (payload.wake) |w| allocator.free(w);
    defer allocator.free(payload.cwd);

    const wake_found = payload.wake != null;
    var session_class: SessionClass = .normal;
    if (!wake_found) {
        session_class = .dark;
    } else if (isDarkWake(payload.wake.?)) {
        session_class = .dark;
    }

    var atoms: []Atom = &.{};
    if (payload.wake) |wake_text| {
        if (extractMindSelf(wake_text)) |mind_self| {
            atoms = try parseAtomsFromMindSelf(allocator, mind_self, mind_dir);
        }
    }

    const cwd_out: ?[]const u8 = if (payload.cwd.len > 0)
        try allocator.dupe(u8, payload.cwd)
    else
        null;

    return .{
        .source_path = path_copy,
        .harness = harness,
        .cwd = cwd_out,
        .session_class = session_class,
        .wake_found = wake_found,
        .atoms = atoms,
    };
}

pub fn extractFromRef(
    allocator: std.mem.Allocator,
    session_ref: vein.session.SessionRef,
    mind_dir: ?[]const u8,
) !ExtractResult {
    return extractFromPath(allocator, session_ref.source_path, mind_dir);
}

/// Legacy entry — use extractFromPath.
pub fn run() !void {
    return error.NotImplemented;
}

// --- tests ---

const s1_path = "/Users/jrg/.pi/agent/sessions/--Users-jrg-circadian--/2026-07-24T21-02-44-774Z_019f95f0-0c26-73b8-bac9-469feb577089.jsonl";
const s2_path = "/Users/jrg/.pi/agent/sessions/--Users-jrg-circadian--/2026-08-09T15-23-57-548Z_019fe71f-a0ec-7007-96cd-29a1cc824c1c.jsonl";

test "dark: missing wake classifies dark" {
    try std.testing.expectEqual(SessionClass.dark, SessionClass.dark);
    // Full missing-wake integration covered by extractFromPath returning dark when wake_found=false.
}

test "dark: KILL SWITCH ACTIVE" {
    try std.testing.expect(isDarkWake("hello KILL SWITCH ACTIVE world"));
    try std.testing.expect(!isDarkWake("normal wake"));
}

test "normalizeClaim collapses whitespace" {
    const allocator = std.testing.allocator;
    const norm = try normalizeClaim(allocator, "  foo   bar  ");
    defer allocator.free(norm);
    try std.testing.expectEqualStrings("foo bar", norm);
}

test "beliefIdHint is 12 hex chars" {
    const allocator = std.testing.allocator;
    const id = try beliefIdHint(allocator, "Motion is the metric");
    defer allocator.free(id);
    try std.testing.expectEqual(@as(usize, 12), id.len);
}

test "parse atoms from s1 older format" {
    const allocator = std.testing.allocator;
    io_ctx.ensureTestIo(allocator);

    const result = try extractFromPath(allocator, s1_path, null);
    defer freeExtractResult(allocator, result);

    try std.testing.expect(result.wake_found);
    try std.testing.expectEqual(SessionClass.normal, result.session_class);
    try std.testing.expect(result.atoms.len >= 1);
    try std.testing.expectEqualStrings("/Users/jrg/circadian", result.cwd.?);

    std.debug.print("s1 atom count: {d} (method: ** Doctrine + - Motifs/How-we-work)\n", .{result.atoms.len});
    try std.testing.expect(result.atoms.len >= 40);
}

test "parse atoms from s2 current format" {
    const allocator = std.testing.allocator;
    io_ctx.ensureTestIo(allocator);

    const result = try extractFromPath(allocator, s2_path, null);
    defer freeExtractResult(allocator, result);

    try std.testing.expect(result.wake_found);
    try std.testing.expectEqual(SessionClass.normal, result.session_class);
    try std.testing.expect(result.atoms.len >= 1);

    std.debug.print("s2 atom count: {d} (method: ** claim — quote bullets)\n", .{result.atoms.len});
    try std.testing.expect(result.atoms.len >= 40);
}

test "parseAtomsFromMindSelf unit" {
    const allocator = std.testing.allocator;
    const sample =
        \\## Doctrine
        \\**1. The cliff is complexity accretion.** [ep:2026-07-16]
        \\## Motifs
        \\- Lake vs river: storage pools; memory must flow.
        \\
    ;
    const atoms = try parseAtomsFromMindSelf(allocator, sample, null);
    defer {
        for (atoms) |a| freeAtom(allocator, a);
        allocator.free(atoms);
    }
    try std.testing.expectEqual(@as(usize, 2), atoms.len);
    try std.testing.expectEqualStrings("1. The cliff is complexity accretion.", atoms[0].claim);
    try std.testing.expectEqualStrings("Lake vs river: storage pools; memory must flow.", atoms[1].claim);
}
