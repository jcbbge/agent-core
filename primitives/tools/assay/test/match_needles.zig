/// Multi-needle matcher oracle — acceptance criterion 5 (intent-derived; no impl reads).
const std = @import("std");
const assay = @import("assay");
const vein = @import("vein");

const match = assay.match;
const io_ctx = vein.io_ctx;

const multi_needle_fixture = @embedFile("fixtures/match-multi-needle.jsonl");
const stillness_fixture = @embedFile("fixtures/match-stillness-line.jsonl");

fn evidenceHasAtom(rows: []const match.Evidence, hint: []const u8) bool {
    for (rows) |row| {
        if (std.mem.eql(u8, row.atom_hint, hint)) return true;
    }
    return false;
}

fn countEvidenceForAtom(rows: []const match.Evidence, hint: []const u8) usize {
    var n: usize = 0;
    for (rows) |row| {
        if (std.mem.eql(u8, row.atom_hint, hint)) n += 1;
    }
    return n;
}

fn looseNorm(buf: []u8, text: []const u8) []const u8 {
    var len: usize = 0;
    var prev_space = false;
    for (text) |c| {
        const space = std.ascii.isWhitespace(c) or std.ascii.isPunctuation(c);
        if (space) {
            if (!prev_space and len > 0) {
                buf[len] = ' ';
                len += 1;
                prev_space = true;
            }
        } else if (len < buf.len) {
            buf[len] = std.ascii.toLower(c);
            len += 1;
            prev_space = false;
        }
    }
    while (len > 0 and buf[len - 1] == ' ') len -= 1;
    return buf[0..len];
}

fn needleAppearsInClaim(claim: []const u8, needle: []const u8) bool {
    if (std.mem.indexOf(u8, claim, needle) != null) return true;

    var claim_buf: [512]u8 = undefined;
    var needle_buf: [256]u8 = undefined;
    const norm_claim = looseNorm(&claim_buf, claim);
    const norm_needle = looseNorm(&needle_buf, needle);
    if (std.mem.indexOf(u8, norm_claim, norm_needle) != null) return true;

    var i: usize = 0;
    while (i < claim.len and std.ascii.isWhitespace(claim[i])) : (i += 1) {}
    while (i < claim.len and std.ascii.isDigit(claim[i])) : (i += 1) {}
    if (i < claim.len and claim[i] == '.') {
        i += 1;
        while (i < claim.len and std.ascii.isWhitespace(claim[i])) : (i += 1) {}
    }
    if (i < claim.len) {
        const stripped = claim[i..];
        if (std.mem.indexOf(u8, stripped, needle) != null) return true;
        const norm_stripped = looseNorm(&claim_buf, stripped);
        if (std.mem.indexOf(u8, norm_stripped, norm_needle) != null) return true;
    }
    return false;
}

// --- AC5: claim-derived needle derivation ---

test "AC5: deriveNeedles yields 2-3 distinctive sub-phrases from full claim" {
    const claim = "3. Store the fire, not the ash.";
    const set = try match.deriveNeedles(std.testing.allocator, claim);
    defer set.free(std.testing.allocator);

    try std.testing.expect(set.needles.len >= 2);
    try std.testing.expect(set.needles.len <= 3);

    for (set.needles) |needle| {
        try std.testing.expect(needle.len >= 4);
        try std.testing.expect(needleAppearsInClaim(claim, needle));
    }
}

test "AC5: needles derive from claim substance not only the leading ordinal slug" {
    const claim = "5. Motion is the metric — memory earns residence by causing change in behavior";
    const short_hint = "5. Motion is the metric — memory earns residence by causing ";

    const set = try match.deriveNeedles(std.testing.allocator, claim);
    defer set.free(std.testing.allocator);

    var found_distinctive = false;
    for (set.needles) |needle| {
        if (needle.len < 8) continue;
        const in_claim = needleAppearsInClaim(claim, needle);
        const only_in_short_hint = std.mem.indexOf(u8, short_hint, needle) != null;
        if (in_claim and !only_in_short_hint) found_distinctive = true;
    }
    try std.testing.expect(found_distinctive);
}

test "AC5: deriveNeedles ignores hint-only slug when claim carries the substance" {
    const claim = "2. Load-bearing or dead.";
    const hint_slug = "2. Load-bearing or dead.";

    const set = try match.deriveNeedles(std.testing.allocator, claim);
    defer set.free(std.testing.allocator);

    var has_load_bearing = false;
    var has_dead = false;
    for (set.needles) |needle| {
        var buf: [128]u8 = undefined;
        const norm = looseNorm(&buf, needle);
        if (std.mem.indexOf(u8, norm, "load-bearing") != null or std.mem.indexOf(u8, norm, "load bearing") != null) {
            has_load_bearing = true;
        }
        if (std.mem.eql(u8, norm, "dead") or std.mem.endsWith(u8, norm, " dead")) {
            has_dead = true;
        }
    }
    try std.testing.expect(has_load_bearing or has_dead);
    try std.testing.expect(!std.mem.eql(u8, hint_slug, set.needles[0]) or set.needles.len > 1);
}

// --- AC5: any-of needle presence semantics ---

test "AC5: presence matches on ANY derived needle (secondary phrase only in transcript)" {
    io_ctx.ensureTestIo(std.testing.allocator);

    const claim = "1. The cliff is complexity accretion.";
    const atoms = [_]match.Atom{
        .{ .hint = claim },
    };

    const rows = try match.searchBytes(
        std.testing.allocator,
        "multi-needle-test",
        multi_needle_fixture,
        3,
        &atoms,
    );
    defer match.freeEvidence(std.testing.allocator, rows);

    try std.testing.expect(rows.len >= 1);
    try std.testing.expectEqual(@as(u32, 4), rows[0].line);
    try std.testing.expect(std.mem.indexOf(u8, rows[0].snippet, "complexity") != null);
}

test "AC5: pre-wake assistant line does not satisfy presence" {
    io_ctx.ensureTestIo(std.testing.allocator);

    const claim = "1. The cliff is complexity accretion.";
    const atoms = [_]match.Atom{
        .{ .hint = claim },
    };

    const rows = try match.searchBytes(
        std.testing.allocator,
        "multi-needle-test",
        multi_needle_fixture,
        3,
        &atoms,
    );
    defer match.freeEvidence(std.testing.allocator, rows);

    for (rows) |row| {
        try std.testing.expect(row.line != 2);
    }
}

test "AC5: atom with zero needles matched counts as absent" {
    io_ctx.ensureTestIo(std.testing.allocator);

    const claim = "9. Turn-End as Data Anchor.";
    const atoms = [_]match.Atom{
        .{ .hint = claim },
    };

    const rows = try match.searchBytes(
        std.testing.allocator,
        "multi-needle-test",
        multi_needle_fixture,
        3,
        &atoms,
    );
    defer match.freeEvidence(std.testing.allocator, rows);

    try std.testing.expect(!evidenceHasAtom(rows, atoms[0].hint));
    try std.testing.expectEqual(@as(usize, 0), countEvidenceForAtom(rows, atoms[0].hint));
}

test "AC5: searchBytes matches on ANY derived needle in assistant text" {
    const claim = "Palms open in the forest: stillness first, bird seed in hand";
    const atoms = [_]match.Atom{
        .{ .hint = claim },
    };

    const rows = try match.searchBytes(
        std.testing.allocator,
        "stillness-test",
        stillness_fixture,
        0,
        &atoms,
    );
    defer match.freeEvidence(std.testing.allocator, rows);
    try std.testing.expect(rows.len >= 1);

    const unrelated_fixture =
        \\{"type":"message","message":{"role":"assistant","content":[{"type":"text","text":"nothing distinctive appears in this assistant line"}]}}
        \\
    ;
    const rows2 = try match.searchBytes(
        std.testing.allocator,
        "stillness-test",
        unrelated_fixture,
        0,
        &atoms,
    );
    defer match.freeEvidence(std.testing.allocator, rows2);
    try std.testing.expect(rows2.len == 0);
}
