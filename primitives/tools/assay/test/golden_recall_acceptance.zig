/// Golden corpus acceptance oracle — criteria 1-4 (intent-derived; no matcher impl reads).
const std = @import("std");
const assay = @import("assay");
const vein = @import("vein");

const golden = assay.golden;
const io_ctx = vein.io_ctx;

fn labelsDir() []const u8 {
    return "../../../briefs/fringe/assay-labels";
}

fn sessionsListPath() []const u8 {
    return "test/golden-sessions.txt";
}

fn sessionById(corpus: golden.CorpusReport, id: []const u8) ?golden.SessionReport {
    for (corpus.sessions) |session| {
        if (std.mem.eql(u8, session.id, id)) return session;
    }
    return null;
}

fn loadGoldenCorpus(allocator: std.mem.Allocator) !golden.CorpusReport {
    io_ctx.ensureTestIo(allocator);

    const labels_dir = labelsDir();
    const sessions_path = sessionsListPath();

    const session_paths = try golden.loadSessionsFile(allocator, sessions_path);
    defer {
        for (session_paths) |p| allocator.free(p);
        allocator.free(session_paths);
    }

    const corpus = try golden.evaluateCorpus(allocator, std.testing.io, true, labels_dir, session_paths, null);
    return corpus;
}

fn freeCorpus(allocator: std.mem.Allocator, corpus: golden.CorpusReport) void {
    for (corpus.sessions) |s| allocator.free(s.session_path);
    allocator.free(corpus.sessions);
}

// AC1: zig build test exit 0 — enforced by the test runner when this module compiles and passes.

test "AC2: golden s1 presence recall strictly improves above 0.300 baseline" {
    const corpus = try loadGoldenCorpus(std.testing.allocator);
    defer freeCorpus(std.testing.allocator, corpus);

    const s1 = sessionById(corpus, "s1");
    try std.testing.expect(s1 != null);
    try std.testing.expect(!s1.?.dark);
    try std.testing.expect(s1.?.presence.recall() > 0.300);
}

test "AC2: golden s2 presence recall strictly improves above 0.063 baseline" {
    const corpus = try loadGoldenCorpus(std.testing.allocator);
    defer freeCorpus(std.testing.allocator, corpus);

    const s2 = sessionById(corpus, "s2");
    try std.testing.expect(s2 != null);
    try std.testing.expect(!s2.?.dark);
    try std.testing.expect(s2.?.presence.recall() > 0.063);
}

test "AC3: golden s4 presence recall does not regress below 0.788" {
    const corpus = try loadGoldenCorpus(std.testing.allocator);
    defer freeCorpus(std.testing.allocator, corpus);

    const s4 = sessionById(corpus, "s4");
    try std.testing.expect(s4 != null);
    try std.testing.expect(!s4.?.dark);
    try std.testing.expect(s4.?.presence.recall() >= 0.788);
}

test "AC3: no invented positives — presence FP is zero on every non-dark session" {
    const corpus = try loadGoldenCorpus(std.testing.allocator);
    defer freeCorpus(std.testing.allocator, corpus);

    for (corpus.sessions) |session| {
        if (session.dark) continue;
        try std.testing.expectEqual(@as(u32, 0), session.presence.fp);
        if (session.presence.tp + session.presence.fp > 0) {
            try std.testing.expectEqual(1.0, session.presence.precision());
        }
    }
}

test "AC4: corpus decoy false-SHAPED remains exactly 0/25" {
    const corpus = try loadGoldenCorpus(std.testing.allocator);
    defer freeCorpus(std.testing.allocator, corpus);

    try std.testing.expectEqual(@as(u32, 0), corpus.decoy_false_shaped);
    try std.testing.expectEqual(@as(u32, 25), corpus.total_decoys);
}
