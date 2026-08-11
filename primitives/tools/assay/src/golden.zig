/// golden: diff instrument output vs hand labels in labels-dir.
const std = @import("std");
const vein = @import("vein");
const wake = @import("wake.zig");
const match = @import("match.zig");
const classify = @import("classify.zig");

const json = std.json;
const io_ctx = vein.io_ctx;
const ExitCode = @import("lib.zig").ExitCode;

pub const HandLabel = enum {
    p3,
    p2,
    p0,

    pub fn parse(text: []const u8) ?HandLabel {
        if (std.mem.eql(u8, text, "P3")) return .p3;
        if (std.mem.eql(u8, text, "P2")) return .p2;
        if (std.mem.eql(u8, text, "P0")) return .p0;
        return null;
    }

    pub fn tag(self: HandLabel) []const u8 {
        return switch (self) {
            .p3 => "P3",
            .p2 => "P2",
            .p0 => "P0",
        };
    }
};

pub const InstrumentClass = enum {
    shaped,
    echoed,
    theme_only,
    unclassified,
    unknown,

    pub fn tag(self: InstrumentClass) []const u8 {
        return switch (self) {
            .shaped => "SHAPED",
            .echoed => "ECHOED",
            .theme_only => "THEME-ONLY",
            .unclassified => "UNCLASSIFIED",
            .unknown => "UNKNOWN",
        };
    }

    pub fn isShaped(self: InstrumentClass) bool {
        return self == .shaped;
    }
};

pub const LabelRow = struct {
    atom: []const u8,
    decoy: bool,
    present: bool,
    label: HandLabel,
    evidence: []const u8,
};

pub const Options = struct {
    labels_dir: []const u8,
    sessions_file: []const u8,
    out_path: ?[]const u8 = null,
    mind_dir: ?[]const u8 = null,
    /// When true, never call classify HTTP; all hits stay UNCLASSIFIED (exit 5).
    skip_classify: bool = false,
    io: std.Io,
};

pub const PresenceMetrics = struct {
    tp: u32,
    fp: u32,
    missed: u32,
    tn: u32,

    pub fn precision(self: PresenceMetrics) f64 {
        const denom = self.tp + self.fp;
        if (denom == 0) return 0;
        return @as(f64, @floatFromInt(self.tp)) / @as(f64, @floatFromInt(denom));
    }

    pub fn recall(self: PresenceMetrics) f64 {
        const denom = self.tp + self.missed;
        if (denom == 0) return 0;
        return @as(f64, @floatFromInt(self.tp)) / @as(f64, @floatFromInt(denom));
    }
};

pub const ShapedMetrics = struct {
    hand_p3: u32,
    instrument_shaped_on_p3: u32,
    unique_shaped_on_p3: u32,
    false_shaped: u32,
    unclassified_hits: u32,
    classify_degraded: bool,
};

pub const SessionReport = struct {
    id: []const u8,
    session_path: []const u8,
    dark: bool,
    label_rows: u32,
    presence: PresenceMetrics,
    shaped: ShapedMetrics,
    decoy_false_shaped: u32,
};

pub const CorpusReport = struct {
    sessions: []SessionReport,
    total_decoys: u32,
    decoy_false_shaped: u32,
    dark_sessions: u32,
    classify_degraded: bool,
    llm_exit: ExitCode,
    skip_labels: u32,
};

pub fn freeLabelRows(allocator: std.mem.Allocator, rows: []LabelRow) void {
    for (rows) |row| {
        allocator.free(row.atom);
        allocator.free(row.evidence);
    }
    allocator.free(rows);
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

fn getStringField(obj: json.ObjectMap, key: []const u8) ?[]const u8 {
    const val = obj.get(key) orelse return null;
    return switch (val) {
        .string => |s| s,
        else => null,
    };
}

fn getBoolField(obj: json.ObjectMap, key: []const u8) ?bool {
    const val = obj.get(key) orelse return null;
    return switch (val) {
        .bool => |b| b,
        else => null,
    };
}

pub fn loadLabelsFile(allocator: std.mem.Allocator, path: []const u8) ![]LabelRow {
    const content = try readFileAlloc(allocator, path);
    defer allocator.free(content);

    var list = std.array_list.Managed(LabelRow).init(allocator);
    errdefer {
        for (list.items) |row| {
            allocator.free(row.atom);
            allocator.free(row.evidence);
        }
        list.deinit();
    }

    var iter = std.mem.splitScalar(u8, content, '\n');
    while (iter.next()) |line| {
        if (line.len == 0) continue;
        var parsed = json.parseFromSlice(json.Value, allocator, line, .{}) catch return error.SchemaUnknown;
        defer parsed.deinit();
        if (parsed.value != .object) return error.SchemaUnknown;
        const obj = parsed.value.object;

        const atom_raw = getStringField(obj, "atom") orelse return error.SchemaUnknown;
        const label_raw = getStringField(obj, "label") orelse return error.SchemaUnknown;
        const hand = HandLabel.parse(label_raw) orelse return error.SchemaUnknown;
        const decoy = getBoolField(obj, "decoy") orelse false;
        const present = getBoolField(obj, "present") orelse return error.SchemaUnknown;
        const evidence_raw = getStringField(obj, "evidence") orelse "";

        try list.append(.{
            .atom = try allocator.dupe(u8, atom_raw),
            .decoy = decoy,
            .present = present,
            .label = hand,
            .evidence = try allocator.dupe(u8, evidence_raw),
        });
    }

    return try list.toOwnedSlice();
}

pub fn loadSessionsFile(allocator: std.mem.Allocator, path: []const u8) ![][]const u8 {
    const content = try readFileAlloc(allocator, path);
    defer allocator.free(content);

    var list = std.array_list.Managed([]const u8).init(allocator);
    errdefer {
        for (list.items) |p| allocator.free(p);
        list.deinit();
    }

    var iter = std.mem.splitScalar(u8, content, '\n');
    while (iter.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");
        if (trimmed.len == 0 or trimmed[0] == '#') continue;
        try list.append(try allocator.dupe(u8, trimmed));
    }

    if (list.items.len == 0) return error.SchemaUnknown;
    return try list.toOwnedSlice();
}

fn findWakeLine(allocator: std.mem.Allocator, transcript_path: []const u8) !?u32 {
    const file = try io_ctx.openAbs(transcript_path);
    defer file.close(io_ctx.io());

    var buf: [65536]u8 = undefined;
    var reader = file.reader(io_ctx.io(), &buf);
    var line_buf: std.ArrayList(u8) = .empty;
    defer line_buf.deinit(allocator);

    var line_no: u32 = 0;
    while (try io_ctx.readLineInto(allocator, &reader, &line_buf)) {
        if (line_buf.items.len == 0) continue;
        line_no += 1;

        var parsed = json.parseFromSlice(json.Value, allocator, line_buf.items, .{}) catch continue;
        defer parsed.deinit();
        if (parsed.value != .object) continue;
        const root = parsed.value.object;

        const typ_val = root.get("type") orelse continue;
        const typ = switch (typ_val) {
            .string => |s| s,
            else => continue,
        };
        if (!std.mem.eql(u8, typ, "custom_message")) continue;
        const custom_val = root.get("customType") orelse continue;
        const custom = switch (custom_val) {
            .string => |s| s,
            else => continue,
        };
        if (std.mem.eql(u8, custom, "circadian-wake")) return line_no;
    }
    return null;
}

fn atomHintsAlign(allocator: std.mem.Allocator, labels: []const LabelRow) ![]match.Atom {
    var out = try allocator.alloc(match.Atom, labels.len);
    errdefer allocator.free(out);
    for (labels, 0..) |row, i| {
        out[i] = .{ .hint = row.atom };
    }
    return out;
}

fn hintMatchesRow(hint: []const u8, row_atom: []const u8) bool {
    if (std.mem.startsWith(u8, row_atom, hint)) return true;
    if (std.mem.startsWith(u8, hint, row_atom)) return true;
    const n = @min(hint.len, row_atom.len);
    return n > 0 and std.mem.eql(u8, hint[0..n], row_atom[0..n]);
}

fn labelToInstrument(label: classify.Label) InstrumentClass {
    return switch (label) {
        .shaped => .shaped,
        .echoed => .echoed,
        .theme_only => .theme_only,
        .unclassified => .unclassified,
    };
}

fn dedupeEvidence(allocator: std.mem.Allocator, items: []const classify.EvidenceHit) ![]classify.EvidenceHit {
    var out = std.array_list.Managed(classify.EvidenceHit).init(allocator);
    errdefer out.deinit();

    for (items) |hit| {
        var seen = false;
        for (out.items) |existing| {
            if (std.mem.eql(u8, existing.atom_hint, hit.atom_hint)) {
                seen = true;
                break;
            }
        }
        if (!seen) try out.append(hit);
    }
    return try out.toOwnedSlice();
}

fn evaluateSession(
    allocator: std.mem.Allocator,
    io: std.Io,
    skip_classify: bool,
    session_id: []const u8,
    session_path: []const u8,
    labels: []const LabelRow,
    mind_dir: ?[]const u8,
    llm_down: *bool,
) !SessionReport {
    const extract = try wake.extractFromPath(allocator, session_path, mind_dir);
    defer wake.freeExtractResult(allocator, extract);

    const dark = extract.session_class == .dark;

    var presence = PresenceMetrics{
        .tp = 0,
        .fp = 0,
        .missed = 0,
        .tn = 0,
    };

    var shaped = ShapedMetrics{
        .hand_p3 = 0,
        .instrument_shaped_on_p3 = 0,
        .unique_shaped_on_p3 = 0,
        .false_shaped = 0,
        .unclassified_hits = 0,
        .classify_degraded = false,
    };

    var decoy_false_shaped: u32 = 0;

    if (dark) {
        return .{
            .id = session_id,
            .session_path = try allocator.dupe(u8, session_path),
            .dark = true,
            .label_rows = @intCast(labels.len),
            .presence = presence,
            .shaped = shaped,
            .decoy_false_shaped = 0,
        };
    }

    const wake_line = findWakeLine(allocator, session_path) catch null orelse {
        return .{
            .id = session_id,
            .session_path = try allocator.dupe(u8, session_path),
            .dark = true,
            .label_rows = @intCast(labels.len),
            .presence = presence,
            .shaped = shaped,
            .decoy_false_shaped = 0,
        };
    };

    const atoms = try atomHintsAlign(allocator, labels);
    defer allocator.free(atoms);

    const hits = try match.searchTranscript(allocator, session_id, session_path, wake_line, atoms);
    defer match.freeEvidence(allocator, hits);

    var evidence = std.array_list.Managed(classify.EvidenceHit).init(allocator);
    defer evidence.deinit();

    for (labels) |row| {
        for (hits) |hit| {
            if (!hintMatchesRow(hit.atom_hint, row.atom)) continue;
            try evidence.append(.{
                .session_id = session_id,
                .atom_hint = row.atom,
                .line = hit.line,
                .snippet = hit.snippet,
                .decoy = row.decoy,
            });
            break;
        }
    }

    var classified: classify.Result = .{ .hits = &.{}, .llm_available = false };
    if (skip_classify) {
        llm_down.* = true;
        shaped.classify_degraded = true;

        if (evidence.items.len > 0) {
            const unique_evidence = try dedupeEvidence(allocator, evidence.items);
            defer allocator.free(unique_evidence);

            shaped.unclassified_hits = @intCast(unique_evidence.len);

            var synth = std.array_list.Managed(classify.ClassifiedHit).init(allocator);
            errdefer {
                for (synth.items) |h| {
                    allocator.free(h.session_id);
                    allocator.free(h.atom_hint);
                    allocator.free(h.snippet);
                }
                synth.deinit();
            }
            for (unique_evidence) |ev| {
                try synth.append(.{
                    .session_id = try allocator.dupe(u8, ev.session_id),
                    .atom_hint = try allocator.dupe(u8, ev.atom_hint),
                    .line = ev.line,
                    .snippet = try allocator.dupe(u8, ev.snippet),
                    .decoy = ev.decoy,
                    .label = .unclassified,
                });
            }
            classified = .{
                .hits = try synth.toOwnedSlice(),
                .llm_available = false,
            };
        }
    } else if (evidence.items.len > 0) {
        const unique_evidence = try dedupeEvidence(allocator, evidence.items);
        defer allocator.free(unique_evidence);
        classified = try classify.run(allocator, .{ .io = io }, unique_evidence);
        if (!classified.llm_available) llm_down.* = true;
    }
    defer classify.freeResult(allocator, &classified);

    var unique_shaped = std.array_list.Managed([]const u8).init(allocator);
    defer {
        for (unique_shaped.items) |claim| allocator.free(claim);
        unique_shaped.deinit();
    }

    for (labels) |row| {
        var instrument_present = false;
        var inst_class: InstrumentClass = .unknown;

        for (hits) |hit| {
            if (hintMatchesRow(hit.atom_hint, row.atom)) {
                instrument_present = true;
                break;
            }
        }

        if (instrument_present) {
            for (classified.hits) |ch| {
                if (hintMatchesRow(ch.atom_hint, row.atom)) {
                    inst_class = labelToInstrument(ch.label);
                    break;
                }
            }
            if (inst_class == .unknown) inst_class = .unclassified;
        }

        if (inst_class == .unclassified and instrument_present and !skip_classify) {
            shaped.classify_degraded = true;
            shaped.unclassified_hits += 1;
        }

        const hand_present = row.present;
        if (hand_present and instrument_present) {
            presence.tp += 1;
        } else if (!hand_present and instrument_present) {
            presence.fp += 1;
        } else if (hand_present and !instrument_present) {
            presence.missed += 1;
        } else {
            presence.tn += 1;
        }

        if (row.label == .p3) shaped.hand_p3 += 1;

        if (inst_class.isShaped()) {
            if (row.label == .p3) {
                shaped.instrument_shaped_on_p3 += 1;
                const norm = try wake.normalizeClaim(allocator, row.atom);
                defer allocator.free(norm);
                var seen = false;
                for (unique_shaped.items) |existing| {
                    if (std.mem.eql(u8, existing, norm)) {
                        seen = true;
                        break;
                    }
                }
                if (!seen) {
                    try unique_shaped.append(try allocator.dupe(u8, norm));
                    shaped.unique_shaped_on_p3 += 1;
                }
            } else {
                shaped.false_shaped += 1;
                if (row.decoy) decoy_false_shaped += 1;
            }
        }
    }

    return .{
        .id = session_id,
        .session_path = try allocator.dupe(u8, session_path),
        .dark = false,
        .label_rows = @intCast(labels.len),
        .presence = presence,
        .shaped = shaped,
        .decoy_false_shaped = decoy_false_shaped,
    };
}

fn labelsPathForSession(allocator: std.mem.Allocator, labels_dir: []const u8, index: usize) ![]const u8 {
    const name = try std.fmt.allocPrint(allocator, "s{d}.labels.jsonl", .{index + 1});
    defer allocator.free(name);
    return std.fs.path.join(allocator, &.{ labels_dir, name });
}

fn sessionIdFromIndex(index: usize) []const u8 {
    const ids = [_][]const u8{ "s1", "s2", "s3", "s4", "s5" };
    return ids[index];
}

pub fn evaluateCorpus(
    allocator: std.mem.Allocator,
    io: std.Io,
    skip_classify: bool,
    labels_dir: []const u8,
    session_paths: []const []const u8,
    mind_dir: ?[]const u8,
) !CorpusReport {
    if (session_paths.len == 0) return error.SchemaUnknown;

    var llm_down = false;

    var reports = std.array_list.Managed(SessionReport).init(allocator);
    errdefer {
        for (reports.items) |rep| allocator.free(rep.session_path);
        reports.deinit();
    }

    var skip_labels: u32 = 0;
    var total_decoys: u32 = 0;
    var decoy_false_shaped: u32 = 0;
    var dark_sessions: u32 = 0;
    var classify_degraded = skip_classify or llm_down;

    const count = @min(session_paths.len, 5);
    var i: usize = 0;
    while (i < count) : (i += 1) {
        const labels_path = try labelsPathForSession(allocator, labels_dir, i);
        defer allocator.free(labels_path);

        const labels = loadLabelsFile(allocator, labels_path) catch {
            skip_labels += 1;
            continue;
        };
        defer freeLabelRows(allocator, labels);

        for (labels) |row| {
            if (row.decoy) total_decoys += 1;
        }

        const sid = sessionIdFromIndex(i);
        const report = try evaluateSession(allocator, io, skip_classify, sid, session_paths[i], labels, mind_dir, &llm_down);
        if (report.dark) dark_sessions += 1;
        if (report.shaped.classify_degraded) classify_degraded = true;
        decoy_false_shaped += report.decoy_false_shaped;
        try reports.append(report);
    }

    const llm_exit: ExitCode = if (classify_degraded) .llm_unavailable else .ok;

    return .{
        .sessions = try reports.toOwnedSlice(),
        .total_decoys = total_decoys,
        .decoy_false_shaped = decoy_false_shaped,
        .dark_sessions = dark_sessions,
        .classify_degraded = classify_degraded,
        .llm_exit = llm_exit,
        .skip_labels = skip_labels,
    };
}

fn appendPrint(
    list: *std.array_list.Managed(u8),
    allocator: std.mem.Allocator,
    comptime fmt: []const u8,
    args: anytype,
) !void {
    const line = try std.fmt.allocPrint(allocator, fmt, args);
    defer allocator.free(line);
    try list.appendSlice(line);
}

fn formatFloatManaged(buf: *std.array_list.Managed(u8), value: f64) !void {
    var tmp: [32]u8 = undefined;
    const s = try std.fmt.bufPrint(&tmp, "{d:.3}", .{value});
    try buf.appendSlice(s);
}

pub fn formatReport(allocator: std.mem.Allocator, corpus: CorpusReport) ![]const u8 {
    var out = std.array_list.Managed(u8).init(allocator);
    errdefer out.deinit();

    try out.appendSlice("# assay golden report\n\n");
    try out.appendSlice("Generated by `assay golden` — instrument vs hand labels.\n\n");

    if (corpus.classify_degraded) {
        try out.appendSlice("**Classify status:** DEGRADED — hits scored UNCLASSIFIED; SHAPED agreement not measurable until classify+LLM available.\n");
        try out.appendSlice("**Exit code:** 5 (LLM unavailable) — presence metrics are valid; SHAPED floors marked UNKNOWN.\n\n");
    } else {
        try out.appendSlice("**Classify status:** OK\n\n");
    }

    try appendPrint(&out, allocator, "Dark sessions: {d}/{d}\n", .{ corpus.dark_sessions, corpus.sessions.len });
    try appendPrint(&out, allocator, "Decoy false-SHAPED: {d}/{d}\n", .{ corpus.decoy_false_shaped, corpus.total_decoys });
    try appendPrint(&out, allocator, "Skipped label files: {d}\n\n", .{corpus.skip_labels});

    for (corpus.sessions) |session| {
        try appendPrint(&out, allocator, "## {s}\n\n", .{session.id});
        try appendPrint(&out, allocator, "- session: `{s}`\n", .{session.session_path});
        try appendPrint(&out, allocator, "- dark: {}\n", .{session.dark});
        try appendPrint(&out, allocator, "- label rows: {d}\n", .{session.label_rows});

        if (session.dark) {
            try out.appendSlice("- propagation stats: SKIPPED (dark)\n\n");
            continue;
        }

        try out.appendSlice("- presence TP/FP/FN/TN: ");
        try appendPrint(&out, allocator, "{d}/{d}/{d}/{d}\n", .{
            session.presence.tp,
            session.presence.fp,
            session.presence.missed,
            session.presence.tn,
        });

        try out.appendSlice("- presence precision: ");
        try formatFloatManaged(&out, session.presence.precision());
        try out.appendSlice(", recall: ");
        try formatFloatManaged(&out, session.presence.recall());
        try out.appendSlice("\n");

        try appendPrint(&out, allocator, "- hand P3 count: {d}\n", .{session.shaped.hand_p3});
        try appendPrint(&out, allocator, "- instrument SHAPED on hand P3 rows: {d}\n", .{session.shaped.instrument_shaped_on_p3});
        try appendPrint(&out, allocator, "- unique SHAPED on P3: {d}\n", .{session.shaped.unique_shaped_on_p3});
        try appendPrint(&out, allocator, "- false SHAPED (non-P3 or decoy): {d}\n", .{session.shaped.false_shaped});
        try appendPrint(&out, allocator, "- UNCLASSIFIED hits: {d}\n", .{session.shaped.unclassified_hits});

        const floor_ok = switch (session.id[1]) {
            '1' => session.shaped.unique_shaped_on_p3 >= 8,
            '2' => session.shaped.unique_shaped_on_p3 >= 3,
            '4' => session.shaped.unique_shaped_on_p3 >= 1,
            '3', '5' => session.shaped.false_shaped == 0,
            else => true,
        };
        try appendPrint(&out, allocator, "- acceptance floor met: {}\n\n", .{floor_ok and !corpus.classify_degraded});
    }

    try out.appendSlice("## Acceptance summary\n\n");
    try out.appendSlice("| Session | Presence exact | SHAPED floor | Notes |\n");
    try out.appendSlice("|---------|----------------|--------------|-------|\n");
    for (corpus.sessions) |session| {
        const presence_exact = session.presence.fp == 0 and session.presence.missed == 0;
        const floor_note = if (corpus.classify_degraded) "UNCLASSIFIED (degraded)" else "evaluated";
        const floor_met = if (corpus.classify_degraded) "UNKNOWN" else switch (session.id[1]) {
            '1' => if (session.shaped.unique_shaped_on_p3 >= 8) "PASS" else "FAIL",
            '2' => if (session.shaped.unique_shaped_on_p3 >= 3) "PASS" else "FAIL",
            '4' => if (session.shaped.unique_shaped_on_p3 >= 1) "PASS" else "FAIL",
            '3', '5' => if (session.shaped.false_shaped == 0) "PASS" else "FAIL",
            else => "n/a",
        };
        try appendPrint(&out, allocator, "| {s} | {} | {s} | {s} |\n", .{
            session.id,
            presence_exact,
            floor_met,
            floor_note,
        });
    }

    try appendPrint(&out, allocator, "\nCorpus decoy false-SHAPED: {d}/{d}\n", .{
        corpus.decoy_false_shaped,
        corpus.total_decoys,
    });

    return try out.toOwnedSlice();
}

pub fn run(allocator: std.mem.Allocator, opts: Options) !ExitCode {
    io_ctx.setProcessIo(opts.io);

    const sessions = try loadSessionsFile(allocator, opts.sessions_file);
    defer {
        for (sessions) |p| allocator.free(p);
        allocator.free(sessions);
    }

    const corpus = try evaluateCorpus(allocator, opts.io, opts.skip_classify, opts.labels_dir, sessions, opts.mind_dir);
    defer {
        for (corpus.sessions) |s| allocator.free(s.session_path);
        allocator.free(corpus.sessions);
    }

    const report = try formatReport(allocator, corpus);
    defer allocator.free(report);

    if (opts.out_path) |out_path| {
        try io_ctx.writeFileAbs(out_path, report);
        try std.Io.File.writeStreamingAll(.stderr(), opts.io, "golden report: ");
        try std.Io.File.writeStreamingAll(.stderr(), opts.io, out_path);
        try std.Io.File.writeStreamingAll(.stderr(), opts.io, "\n");
    } else {
        try std.Io.File.writeStreamingAll(.stdout(), opts.io, report);
    }

    return corpus.llm_exit;
}

// --- tests ---

const golden_labels_dir = "/Users/jrg/agent-core/briefs/fringe/assay-labels";

test "load s1 labels schema" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const path = golden_labels_dir ++ "/s1.labels.jsonl";
    const rows = try loadLabelsFile(std.testing.allocator, path);
    defer freeLabelRows(std.testing.allocator, rows);
    try std.testing.expect(rows.len >= 50);
    try std.testing.expectEqual(HandLabel.p3, rows[0].label);
}

test "load golden sessions file" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const sessions_path = "/Users/jrg/agent-core/primitives/tools/assay/test/golden-sessions.txt";
    const paths = try loadSessionsFile(std.testing.allocator, sessions_path);
    defer {
        for (paths) |p| std.testing.allocator.free(p);
        std.testing.allocator.free(paths);
    }
    try std.testing.expectEqual(@as(usize, 5), paths.len);
}

test "golden corpus evaluation smoke" {
    io_ctx.ensureTestIo(std.testing.allocator);
    const sessions_path = "/Users/jrg/agent-core/primitives/tools/assay/test/golden-sessions.txt";
    const session_paths = try loadSessionsFile(std.testing.allocator, sessions_path);
    defer {
        for (session_paths) |p| std.testing.allocator.free(p);
        std.testing.allocator.free(session_paths);
    }

    const corpus = try evaluateCorpus(std.testing.allocator, std.testing.io, true, golden_labels_dir, session_paths, null);
    defer {
        for (corpus.sessions) |s| std.testing.allocator.free(s.session_path);
        std.testing.allocator.free(corpus.sessions);
    }

    try std.testing.expectEqual(@as(usize, 5), corpus.sessions.len);
    try std.testing.expect(corpus.total_decoys >= 25);

    for (corpus.sessions) |session| {
        if (!session.dark) {
            const total = session.presence.tp + session.presence.fp + session.presence.missed + session.presence.tn;
            try std.testing.expectEqual(session.label_rows, total);
        }
    }

    std.debug.print("golden smoke: dark={d} decoy_fp={d}/{d} classify_degraded={}\n", .{
        corpus.dark_sessions,
        corpus.decoy_false_shaped,
        corpus.total_decoys,
        corpus.classify_degraded,
    });
}
