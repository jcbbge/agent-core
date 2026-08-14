const std = @import("std");
const classify = @import("classify.zig");
const belief = @import("belief.zig");

pub const Domain = enum {
    self_referential,
    ordinary,

    pub fn jsonString(self: Domain) []const u8 {
        return switch (self) {
            .self_referential => "self-referential",
            .ordinary => "ordinary",
        };
    }
};

pub const SessionMeta = struct {
    session_id: []const u8,
    cwd: []const u8,
    task_text: []const u8 = "",
    dark: bool = false,
};

pub const AtomKey = struct {
    key: []const u8,
    belief_id: ?[]const u8,
    decoy: bool,
};

pub const Stats = struct {
    key: []const u8,
    belief_id: ?[]const u8,
    decoy: bool,
    domain: Domain,
    injections: u32,
    sessions_with_hits: u32,
    sessions_propagated: u32,
    branching_ratio: f64,
    recency_rank: u32,
    shaped_count: u32,
    echoed_count: u32,
    theme_only_count: u32,
    unclassified_count: u32,
};

pub const DecoyReport = struct {
    total: u32,
    false_positives: u32,

    pub fn fpRate(self: DecoyReport) f64 {
        if (self.total == 0) return 0;
        return @as(f64, @floatFromInt(self.false_positives)) / @as(f64, @floatFromInt(self.total));
    }
};

pub const Options = struct {
    propagation_floor: f64 = 0.15,
    min_injections_for_retire: u32 = 5,
    flood_threshold: f64 = 0.85,
};

pub const Result = struct {
    stats: []Stats,
    decoys: DecoyReport,
};

pub fn segmentDomain(cwd: []const u8, task_text: []const u8) Domain {
    if (std.mem.indexOf(u8, cwd, "/circadian") != null) return .self_referential;
    var lower: [512]u8 = undefined;
    const n = @min(task_text.len, lower.len);
    for (task_text[0..n], 0..) |c, i| lower[i] = std.ascii.toLower(c);
    const lower_task = lower[0..n];
    if (std.mem.indexOf(u8, lower_task, "memory system") != null) return .self_referential;
    if (std.mem.indexOf(u8, lower_task, "circadian") != null and
        std.mem.indexOf(u8, lower_task, "mind") != null)
        return .self_referential;
    return .ordinary;
}

pub fn run(
    allocator: std.mem.Allocator,
    opts: Options,
    sessions: []const SessionMeta,
    classified: []const classify.ClassifiedHit,
    atom_keys: []const AtomKey,
) !Result {
    _ = opts;

    var stats_map = std.StringHashMap(Stats).init(allocator);
    defer {
        var it = stats_map.iterator();
        while (it.next()) |entry| {
            allocator.free(entry.key_ptr.*);
            if (entry.value_ptr.belief_id) |id| allocator.free(id);
            allocator.free(entry.value_ptr.key);
        }
        stats_map.deinit();
    }

    for (atom_keys) |ak| {
        const gop = try stats_map.getOrPut(try allocator.dupe(u8, ak.key));
        if (!gop.found_existing) {
            gop.value_ptr.* = .{
                .key = try allocator.dupe(u8, ak.key),
                .belief_id = if (ak.belief_id) |id| try allocator.dupe(u8, id) else null,
                .decoy = ak.decoy,
                .domain = .ordinary,
                .injections = 0,
                .sessions_with_hits = 0,
                .sessions_propagated = 0,
                .branching_ratio = 0,
                .recency_rank = 0,
                .shaped_count = 0,
                .echoed_count = 0,
                .theme_only_count = 0,
                .unclassified_count = 0,
            };
        }
        gop.value_ptr.injections += 1;
    }

    for (sessions, 0..) |session, rank| {
        if (session.dark) continue;
        const domain = segmentDomain(session.cwd, session.task_text);
        for (atom_keys) |ak| {
            if (stats_map.get(ak.key)) |*st| {
                if (st.domain == .ordinary and domain == .self_referential) {
                    st.domain = .self_referential;
                }
                if (rank + 1 > st.recency_rank) st.recency_rank = @intCast(rank + 1);
            }
        }
    }

    var session_hits = std.StringHashMap(void).init(allocator);
    defer session_hits.deinit();
    var session_prop = std.StringHashMap(void).init(allocator);
    defer session_prop.deinit();

    var decoy_total: u32 = 0;
    var decoy_fp: u32 = 0;

    for (classified) |hit| {
        const key = hit.atom_hint;
        const gop = try stats_map.getOrPut(try allocator.dupe(u8, key));
        if (!gop.found_existing) {
            gop.value_ptr.* = .{
                .key = try allocator.dupe(u8, key),
                .belief_id = null,
                .decoy = hit.decoy,
                .domain = .ordinary,
                .injections = 1,
                .sessions_with_hits = 0,
                .sessions_propagated = 0,
                .branching_ratio = 0,
                .recency_rank = 0,
                .shaped_count = 0,
                .echoed_count = 0,
                .theme_only_count = 0,
                .unclassified_count = 0,
            };
        }

        switch (hit.label) {
            .shaped => gop.value_ptr.shaped_count += 1,
            .echoed => gop.value_ptr.echoed_count += 1,
            .theme_only => gop.value_ptr.theme_only_count += 1,
            .unclassified => gop.value_ptr.unclassified_count += 1,
        }

        if (hit.decoy) {
            decoy_total += 1;
            if (hit.label == .shaped or hit.label == .echoed) decoy_fp += 1;
        }

        const sess_hit_key = try std.fmt.allocPrint(allocator, "{s}\x00{s}", .{ key, hit.session_id });
        defer allocator.free(sess_hit_key);
        if (session_hits.contains(sess_hit_key)) {} else {
            try session_hits.put(try allocator.dupe(u8, sess_hit_key), {});
            gop.value_ptr.sessions_with_hits += 1;
        }

        if (hit.label == .shaped or hit.label == .echoed) {
            const sess_prop_key = try std.fmt.allocPrint(allocator, "{s}\x00{s}", .{ key, hit.session_id });
            defer allocator.free(sess_prop_key);
            if (!session_prop.contains(sess_prop_key)) {
                try session_prop.put(try allocator.dupe(u8, sess_prop_key), {});
                gop.value_ptr.sessions_propagated += 1;
            }
        }
    }

    var list = std.ArrayList(Stats).empty;
    errdefer list.deinit(allocator);

    var it = stats_map.iterator();
    while (it.next()) |entry| {
        var st = entry.value_ptr.*;
        if (st.injections > 0) {
            st.branching_ratio = @as(f64, @floatFromInt(st.sessions_propagated)) /
                @as(f64, @floatFromInt(st.injections));
        }
        try list.append(allocator, st);
    }

    return .{
        .stats = try list.toOwnedSlice(allocator),
        .decoys = .{ .total = decoy_total, .false_positives = decoy_fp },
    };
}

pub fn writeJsonl(allocator: std.mem.Allocator, path: []const u8, result: Result) !void {
    _ = allocator;
    var file = try std.fs.createFileAbsolute(path, .{});
    defer file.close();

    for (result.stats) |st| {
        const id = st.belief_id orelse "null";
        var line_buf: [1024]u8 = undefined;
        const line = if (st.belief_id != null)
            try std.fmt.bufPrint(
                &line_buf,
                "{{\"atom\":\"{s}\",\"belief_id\":\"{s}\",\"decoy\":{},\"domain\":\"{s}\",\"injections\":{d},\"sessions_propagated\":{d},\"branching_ratio\":{d:.4},\"recency_rank\":{d},\"shaped\":{d},\"echoed\":{d},\"theme_only\":{d},\"unclassified\":{d}}}\n",
                .{
                    st.key,
                    id,
                    st.decoy,
                    st.domain.jsonString(),
                    st.injections,
                    st.sessions_propagated,
                    st.branching_ratio,
                    st.recency_rank,
                    st.shaped_count,
                    st.echoed_count,
                    st.theme_only_count,
                    st.unclassified_count,
                },
            )
        else
            try std.fmt.bufPrint(
                &line_buf,
                "{{\"atom\":\"{s}\",\"belief_id\":null,\"decoy\":{},\"domain\":\"{s}\",\"injections\":{d},\"sessions_propagated\":{d},\"branching_ratio\":{d:.4},\"recency_rank\":{d},\"shaped\":{d},\"echoed\":{d},\"theme_only\":{d},\"unclassified\":{d}}}\n",
                .{
                    st.key,
                    st.decoy,
                    st.domain.jsonString(),
                    st.injections,
                    st.sessions_propagated,
                    st.branching_ratio,
                    st.recency_rank,
                    st.shaped_count,
                    st.echoed_count,
                    st.theme_only_count,
                    st.unclassified_count,
                },
            );
        try file.writeAll(line);
    }

    var footer: [256]u8 = undefined;
    const decoy_line = try std.fmt.bufPrint(
        &footer,
        "{{\"decoy_total\":{d},\"decoy_false_positives\":{d},\"decoy_fp_rate\":{d:.4}}}\n",
        .{ result.decoys.total, result.decoys.false_positives, result.decoys.fpRate() },
    );
    try file.writeAll(decoy_line);
}

pub fn sampleDecoys(
    allocator: std.mem.Allocator,
    mind_dir: []const u8,
    payload_keys: []const []const u8,
    n: u32,
) ![]belief.BeliefEntry {
    const all = try belief.loadAll(allocator, mind_dir);
    defer {
        for (all) |e| {
            allocator.free(e.id);
            allocator.free(e.claim);
        }
        allocator.free(all);
    }

    var candidates = std.ArrayList(belief.BeliefEntry).empty;
    errdefer candidates.deinit(allocator);

    for (all) |entry| {
        var in_payload = false;
        for (payload_keys) |key| {
            if (std.mem.eql(u8, key, entry.claim) or std.mem.eql(u8, key, entry.id)) {
                in_payload = true;
                break;
            }
        }
        if (!in_payload) {
            try candidates.append(allocator, .{
                .id = try allocator.dupe(u8, entry.id),
                .claim = try allocator.dupe(u8, entry.claim),
            });
        }
    }

    const take = @min(n, @as(u32, @intCast(candidates.items.len)));
    var out = std.ArrayList(belief.BeliefEntry).empty;
    errdefer {
        for (out.items) |e| {
            allocator.free(e.id);
            allocator.free(e.claim);
        }
        out.deinit(allocator);
    }

    // Deterministic: first N sorted by id
    std.mem.sort(belief.BeliefEntry, candidates.items, {}, struct {
        fn less(_: void, a: belief.BeliefEntry, b: belief.BeliefEntry) bool {
            return std.mem.order(u8, a.id, b.id) == .lt;
        }
    }.less);

    for (candidates.items[0..take]) |entry| {
        try out.append(allocator, .{
            .id = try allocator.dupe(u8, entry.id),
            .claim = try allocator.dupe(u8, entry.claim),
        });
    }
    return try out.toOwnedSlice(allocator);
}

test "segmentDomain detects circadian cwd" {
    try std.testing.expect(segmentDomain("/Users/jrg/circadian/mind", "") == .self_referential);
    try std.testing.expect(segmentDomain("/Users/jrg/agent-core", "") == .ordinary);
}

test "decoy FP accounting" {
    const sessions = [_]SessionMeta{.{
        .session_id = "s1",
        .cwd = "/Users/jrg/agent-core",
    }};
    const classified = [_]classify.ClassifiedHit{
        .{
            .session_id = "s1",
            .atom_hint = "decoy claim",
            .line = 1,
            .snippet = "echo",
            .decoy = true,
            .label = .echoed,
        },
    };
    const keys = [_]AtomKey{.{
        .key = "decoy claim",
        .belief_id = null,
        .decoy = true,
    }};

    const result = try run(std.testing.allocator, .{}, &sessions, &classified, &keys);
    defer {
        for (result.stats) |st| {
            std.testing.allocator.free(st.key);
            if (st.belief_id) |id| std.testing.allocator.free(id);
        }
        std.testing.allocator.free(result.stats);
    }

    try std.testing.expectEqual(@as(u32, 1), result.decoys.total);
    try std.testing.expectEqual(@as(u32, 1), result.decoys.false_positives);
}
