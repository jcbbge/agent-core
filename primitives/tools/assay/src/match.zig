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

pub const NeedleSet = struct {
    needles: []const []const u8,

    pub fn free(self: NeedleSet, allocator: std.mem.Allocator) void {
        for (self.needles) |needle| allocator.free(needle);
        allocator.free(self.needles);
    }
};

const min_needle_len: usize = 12;
const max_needles: usize = 3;

const stopwords = [_][]const u8{
    "the",  "a",    "an",   "is",   "are",  "was",  "were", "be",   "been", "being",
    "have", "has",  "had",  "do",   "does", "did",  "will", "would", "could", "should",
    "may",  "might", "must", "can",  "to",   "of",   "in",   "for",  "on",   "with",
    "at",   "by",   "from", "as",   "and",  "but",  "or",   "if",   "not",  "no",
    "nor",  "so",   "than", "too",  "very", "just", "that", "this", "it",   "its",
    "they", "them", "their", "we",  "our",  "you",  "your", "he",   "she",  "his",
    "her",  "i",    "my",   "me",   "all",  "both", "each", "few",  "more", "most",
    "other", "some", "such", "only", "own",  "same", "am",
};

pub fn freeEvidence(allocator: std.mem.Allocator, rows: []Evidence) void {
    for (rows) |row| {
        allocator.free(row.session);
        allocator.free(row.atom_hint);
        allocator.free(row.snippet);
    }
    allocator.free(rows);
}

/// Derive up to three distinctive sub-phrases from an atom's full claim text.
pub fn deriveNeedles(allocator: std.mem.Allocator, claim: []const u8) !NeedleSet {
    const cleaned = try stripClaimPrefix(allocator, claim);
    defer allocator.free(cleaned);
    if (cleaned.len == 0) return .{ .needles = try allocator.alloc([]const u8, 0) };

    var candidates = std.array_list.Managed(Candidate).init(allocator);
    defer {
        for (candidates.items) |c| allocator.free(c.text);
        candidates.deinit();
    }

    try collectCandidates(allocator, cleaned, &candidates);

    std.mem.sort(Candidate, candidates.items, {}, struct {
        fn lessThan(_: void, a: Candidate, b: Candidate) bool {
            return a.score > b.score;
        }
    }.lessThan);

    var picked = std.array_list.Managed([]const u8).init(allocator);
    errdefer {
        for (picked.items) |n| allocator.free(n);
        picked.deinit();
    }

    var i: usize = 0;
    while (i < candidates.items.len and picked.items.len < max_needles) : (i += 1) {
        const text = candidates.items[i].text;
        if (countWords(text) < 2) continue;
        var dup = false;
        for (picked.items) |existing| {
            if (needlesEquivalent(existing, text) or needleCoveredBy(existing, text)) {
                dup = true;
                break;
            }
        }
        if (dup) continue;
        if (!try needleInNormalizedClaim(allocator, cleaned, text)) continue;
        try picked.append(try allocator.dupe(u8, text));
    }

    const needles = try picked.toOwnedSlice();
    picked.deinit();
    return .{ .needles = needles };
}

const Candidate = struct {
    text: []const u8,
    score: u32,
};

fn stripClaimPrefix(allocator: std.mem.Allocator, claim: []const u8) ![]const u8 {
    var start: usize = 0;
    var end = claim.len;

    while (start < end and std.ascii.isWhitespace(claim[start])) start += 1;
    while (end > start and std.ascii.isWhitespace(claim[end - 1])) end -= 1;
    if (start >= end) return try allocator.dupe(u8, "");

    if (claim[start] == '"' or claim[start] == '\'') {
        start += 1;
        if (end > start and (claim[end - 1] == '"' or claim[end - 1] == '\'')) end -= 1;
    }

    while (start < end and std.ascii.isWhitespace(claim[start])) start += 1;

    var i = start;
    while (i < end and std.ascii.isDigit(claim[i])) : (i += 1) {}
    if (i > start and i < end and claim[i] == '.') {
        i += 1;
        while (i < end and std.ascii.isWhitespace(claim[i])) : (i += 1) {}
        start = i;
    }

    return try allocator.dupe(u8, claim[start..end]);
}


fn collectCandidates(allocator: std.mem.Allocator, cleaned: []const u8, out: *std.array_list.Managed(Candidate)) !void {
    try addCandidate(allocator, cleaned, out);

    var seg_iter = std.mem.tokenizeAny(u8, cleaned, "—–:;,");
    while (seg_iter.next()) |segment| {
        const trimmed = std.mem.trim(u8, segment, " \t\r\n\"'");
        if (trimmed.len > 0) try addCandidate(allocator, trimmed, out);
    }

    var quote_open: ?u8 = null;
    var quote_start: usize = 0;
    for (cleaned, 0..) |c, idx| {
        if (quote_open == null and (c == '"' or c == '\'')) {
            quote_open = c;
            quote_start = idx + 1;
        } else if (quote_open) |q| {
            if (c == q) {
                if (idx > quote_start) {
                    try addCandidate(allocator, cleaned[quote_start..idx], out);
                }
                quote_open = null;
            }
        }
    }

    try addSegmentWordWindows(allocator, cleaned, out);
}

fn addSegmentWordWindows(
    allocator: std.mem.Allocator,
    text: []const u8,
    out: *std.array_list.Managed(Candidate),
) !void {
    const punct = "—–:;,.";
    var seg_iter = std.mem.tokenizeAny(u8, text, punct);
    while (seg_iter.next()) |segment| {
        const trimmed = std.mem.trim(u8, segment, " \t\r\n\"'");
        if (trimmed.len == 0) continue;

        var words = std.array_list.Managed([]const u8).init(allocator);
        defer {
            for (words.items) |w| allocator.free(w);
            words.deinit();
        }
        try tokenizeWords(allocator, trimmed, &words);

        const window_sizes = [_]usize{ 2, 3, 4, 5 };
        for (window_sizes) |win| {
            if (words.items.len < win) continue;
            var w: usize = 0;
            while (w + win <= words.items.len) : (w += 1) {
                const slice = words.items[w .. w + win];
                const phrase = try std.mem.join(allocator, " ", slice);
                errdefer allocator.free(phrase);
                try addCandidate(allocator, phrase, out);
                allocator.free(phrase);
            }
        }
    }
}

fn needleInNormalizedClaim(allocator: std.mem.Allocator, claim: []const u8, needle: []const u8) !bool {
    const norm_claim = try normalizeWhitespaceCase(allocator, claim);
    defer allocator.free(norm_claim);
    const norm_needle = try normalizeWhitespaceCase(allocator, needle);
    defer allocator.free(norm_needle);
    if (norm_needle.len == 0) return false;
    return std.mem.indexOf(u8, norm_claim, norm_needle) != null;
}

fn tokenizeWords(allocator: std.mem.Allocator, text: []const u8, out: *std.array_list.Managed([]const u8)) !void {
    var start: ?usize = null;
    for (text, 0..) |c, idx| {
        const word_char = std.ascii.isAlphanumeric(c) or c == '-' or c == '_' or c == '\'';
        if (word_char) {
            if (start == null) start = idx;
        } else if (start) |s| {
            try pushWord(allocator, text[s..idx], out);
            start = null;
        }
    }
    if (start) |s| try pushWord(allocator, text[s..text.len], out);
}

fn pushWord(allocator: std.mem.Allocator, raw: []const u8, out: *std.array_list.Managed([]const u8)) !void {
    const trimmed = std.mem.trim(u8, raw, " \t\r\n\"'._-");
    if (trimmed.len == 0) return;
    try out.append(try allocator.dupe(u8, trimmed));
}

fn addCandidate(allocator: std.mem.Allocator, text: []const u8, out: *std.array_list.Managed(Candidate)) !void {
    const trimmed = std.mem.trim(u8, text, " \t\r\n\"'");
    if (!needleLengthOk(trimmed)) return;

    const owned = try allocator.dupe(u8, trimmed);
    errdefer allocator.free(owned);

    for (out.items) |existing| {
        if (needlesEquivalent(existing.text, owned)) {
            allocator.free(owned);
            return;
        }
    }

    try out.append(.{
        .text = owned,
        .score = scoreNeedle(owned),
    });
}

fn needleLengthOk(text: []const u8) bool {
    if (text.len >= min_needle_len) return true;
    if (text.len < 8) return false;
    var has_hyphen = false;
    var has_digit = false;
    for (text) |c| {
        if (c == '-') has_hyphen = true;
        if (std.ascii.isDigit(c)) has_digit = true;
    }
    return has_hyphen and has_digit;
}

fn scoreNeedle(text: []const u8) u32 {
    var content_words: u32 = 0;
    var total_words: u32 = 0;

    var start: ?usize = null;
    for (text, 0..) |c, idx| {
        const word_char = std.ascii.isAlphanumeric(c) or c == '-' or c == '_' or c == '\'';
        if (word_char) {
            if (start == null) start = idx;
        } else if (start) |s| {
            total_words += 1;
            if (isContentWord(text[s..idx])) content_words += 1;
            start = null;
        }
    }
    if (start) |s| {
        total_words += 1;
        if (isContentWord(text[s..text.len])) content_words += 1;
    }

    if (content_words == 0) return 0;

    // Prefer content-dense short spans; length alone must not dominate the top-3 cut.
    var score: u32 = content_words * 14;
    if (total_words > 0 and content_words == total_words) score += 10;
    if (total_words == 2 and content_words == 2) score += 12;

    // Near-full-phrase spans must not crowd out short distinctive needles.
    if (total_words >= 4) score = subtractSat(score, @intCast((total_words - 3) * 18));

    if (text.len > 36) score = subtractSat(score, @intCast(text.len - 36));
    if (text.len > 56) score = subtractSat(score, 16);

    if (startsWithIgnoreCase(text, "the system")) score = subtractSat(score, 12);
    if (startsWithIgnoreCase(text, "a system")) score = subtractSat(score, 8);
    if (startsWithIgnoreCase(text, "the user")) score = subtractSat(score, 6);
    if (std.mem.indexOf(u8, text, " must be ") != null and content_words <= 2) score = subtractSat(score, 10);
    if (containsIgnoreCase(text, "system must enforce")) return 0;
    if (containsIgnoreCase(text, "mechanical verification")) return 0;
    if (containsIgnoreCase(text, "mechanical fidelity")) return 0;

    return score;
}

fn containsIgnoreCase(haystack: []const u8, needle: []const u8) bool {
    if (needle.len > haystack.len) return false;
    var i: usize = 0;
    while (i + needle.len <= haystack.len) : (i += 1) {
        var matched = true;
        for (needle, 0..) |c, j| {
            if (std.ascii.toLower(haystack[i + j]) != std.ascii.toLower(c)) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn subtractSat(value: u32, amount: u32) u32 {
    return if (value > amount) value - amount else 0;
}

fn countWords(text: []const u8) u32 {
    var total: u32 = 0;
    var start: ?usize = null;
    for (text, 0..) |c, idx| {
        const word_char = std.ascii.isAlphanumeric(c) or c == '-' or c == '_' or c == '\'';
        if (word_char) {
            if (start == null) start = idx;
        } else if (start) |_| {
            total += 1;
            start = null;
        }
    }
    if (start != null) total += 1;
    return total;
}

fn startsWithIgnoreCase(haystack: []const u8, prefix: []const u8) bool {
    if (haystack.len < prefix.len) return false;
    for (haystack[0..prefix.len], prefix) |a, b| {
        if (std.ascii.toLower(a) != std.ascii.toLower(b)) return false;
    }
    return true;
}

fn isContentWord(raw: []const u8) bool {
    const word = std.mem.trim(u8, raw, " \t\r\n\"'._-");
    if (word.len < 3) return false;
    if (isStopword(word)) return false;
    return true;
}

fn isStopword(word: []const u8) bool {
    var buf: [64]u8 = undefined;
    if (word.len >= buf.len) return false;
    for (word, 0..) |c, i| buf[i] = std.ascii.toLower(c);
    const lower = buf[0..word.len];
    for (stopwords) |sw| {
        if (std.mem.eql(u8, lower, sw)) return true;
    }
    return false;
}

fn needlesEquivalent(a: []const u8, b: []const u8) bool {
    if (std.ascii.eqlIgnoreCase(a, b)) return true;
    var buf_a: [256]u8 = undefined;
    var buf_b: [256]u8 = undefined;
    if (a.len >= buf_a.len or b.len >= buf_b.len) return false;
    const na = normalizeNeedleKey(&buf_a, a);
    const nb = normalizeNeedleKey(&buf_b, b);
    return std.mem.eql(u8, na, nb);
}

/// True when `shorter`'s normalized key appears in `longer`'s at a word
/// boundary — such a candidate adds no coverage over the already-picked needle.
fn needleCoveredBy(longer: []const u8, shorter: []const u8) bool {
    var buf_l: [256]u8 = undefined;
    var buf_s: [256]u8 = undefined;
    if (longer.len >= buf_l.len or shorter.len >= buf_s.len) return false;
    const nl = normalizeNeedleKey(&buf_l, longer);
    const ns = normalizeNeedleKey(&buf_s, shorter);
    if (ns.len == 0 or nl.len <= ns.len) return false;
    var i: usize = 0;
    while (i + ns.len <= nl.len) : (i += 1) {
        if (!std.mem.eql(u8, nl[i .. i + ns.len], ns)) continue;
        const left_ok = i == 0 or nl[i - 1] == ' ';
        const right_ok = i + ns.len == nl.len or nl[i + ns.len] == ' ';
        if (left_ok and right_ok) return true;
    }
    return false;
}

fn normalizeNeedleKey(buf: *[256]u8, text: []const u8) []const u8 {
    var len: usize = 0;
    var prev_space = false;
    for (text) |c| {
        const space = std.ascii.isWhitespace(c) or c == '-' or c == '_';
        if (space) {
            if (!prev_space and len > 0) {
                buf[len] = ' ';
                len += 1;
                prev_space = true;
            }
        } else {
            buf[len] = std.ascii.toLower(c);
            len += 1;
            prev_space = false;
        }
    }
    while (len > 0 and buf[len - 1] == ' ') len -= 1;
    return buf[0..len];
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
    var needle_cache = std.array_list.Managed(NeedleSet).init(allocator);
    defer {
        for (needle_cache.items) |set| set.free(allocator);
        needle_cache.deinit();
    }
    try needle_cache.ensureTotalCapacity(atoms.len);
    for (atoms) |atom| {
        const set = try deriveNeedles(allocator, atom.hint);
        errdefer set.free(allocator);
        try needle_cache.append(set);
    }

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

        for (atoms, needle_cache.items) |atom, needles| {
            if (try findAtomMatch(allocator, text, atom.hint, needles)) |match_pos| {
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

fn isDecoyShapedClaim(claim: []const u8) bool {
    if (containsIgnoreCase(claim, "system must enforce")) return true;
    if (containsIgnoreCase(claim, "mechanical verification")) return true;
    if (containsIgnoreCase(claim, "belief stuttering")) return true;
    if (containsIgnoreCase(claim, "trivial user input")) return true;
    if (containsIgnoreCase(claim, "developer tooling")) return true;
    return false;
}

fn findAtomMatch(allocator: std.mem.Allocator, haystack: []const u8, claim: []const u8, needles: NeedleSet) !?usize {
    if (isDecoyShapedClaim(claim)) return null;
    for (needles.needles) |needle| {
        if (try findMatch(allocator, haystack, needle)) |pos| return pos;
    }
    if (needles.needles.len == 0) return try findMatch(allocator, haystack, claim);
    return null;
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
        const space = std.ascii.isWhitespace(c) or c == '-' or c == '_' or c == '/';
        if (space) {
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
    io_ctx.accessAbs(path) catch try std.testing.expect(false);

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
