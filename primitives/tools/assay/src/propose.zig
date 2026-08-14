const std = @import("std");
const aggregate = @import("aggregate.zig");

fn ensureDirAll(path: []const u8) !void {
    if (path.len == 0) return error.InvalidPath;
    var buf: [512]u8 = undefined;
    if (path.len >= buf.len) return error.NameTooLong;
    @memcpy(buf[0..path.len], path);
    var i: usize = 1;
    while (i <= path.len) : (i += 1) {
        if (i == path.len or path[i] == '/') {
            buf[i] = 0;
            if (i > 1) std.posix.mkdir(buf[0..i :0], 0o755) catch |err| switch (err) {
                error.PathAlreadyExists => {},
                else => |e| return e,
            };
        }
    }
}

pub const Kind = enum {
    retire,
    promote,
    flood_warning,

    pub fn jsonString(self: Kind) []const u8 {
        return switch (self) {
            .retire => "PROPOSE_RETIRE",
            .promote => "PROPOSE_PROMOTE",
            .flood_warning => "FLOOD_WARNING",
        };
    }
};

pub const Proposal = struct {
    kind: Kind,
    atom: []const u8,
    belief_id: ?[]const u8,
    branching_ratio: f64,
    injections: u32,
    reason: []const u8,
};

pub const Options = struct {
    propagation_floor: f64 = 0.15,
    min_injections_for_retire: u32 = 5,
    promote_floor: f64 = 0.35,
    flood_threshold: f64 = 0.85,
    out_dir: []const u8,
};

pub fn run(allocator: std.mem.Allocator, opts: Options, agg: aggregate.Result) ![]Proposal {
    var list = std.ArrayList(Proposal).empty;
    errdefer {
        for (list.items) |p| {
            allocator.free(p.atom);
            if (p.belief_id) |id| allocator.free(id);
            allocator.free(p.reason);
        }
        list.deinit(allocator);
    }

    for (agg.stats) |st| {
        if (st.decoy) continue;

        if (st.injections >= opts.min_injections_for_retire and
            st.branching_ratio < opts.propagation_floor)
        {
            try list.append(allocator, .{
                .kind = .retire,
                .atom = try allocator.dupe(u8, st.key),
                .belief_id = if (st.belief_id) |id| try allocator.dupe(u8, id) else null,
                .branching_ratio = st.branching_ratio,
                .injections = st.injections,
                .reason = try std.fmt.allocPrint(
                    allocator,
                    "branching_ratio {d:.4} below floor {d:.4} over {d} injections",
                    .{ st.branching_ratio, opts.propagation_floor, st.injections },
                ),
            });
        }

        if (st.injections >= opts.min_injections_for_retire and
            st.branching_ratio >= opts.promote_floor)
        {
            try list.append(allocator, .{
                .kind = .promote,
                .atom = try allocator.dupe(u8, st.key),
                .belief_id = if (st.belief_id) |id| try allocator.dupe(u8, id) else null,
                .branching_ratio = st.branching_ratio,
                .injections = st.injections,
                .reason = try std.fmt.allocPrint(
                    allocator,
                    "branching_ratio {d:.4} at or above promote floor {d:.4}",
                    .{ st.branching_ratio, opts.promote_floor },
                ),
            });
        }

        if (st.injections >= 3 and st.branching_ratio >= opts.flood_threshold) {
            try list.append(allocator, .{
                .kind = .flood_warning,
                .atom = try allocator.dupe(u8, st.key),
                .belief_id = if (st.belief_id) |id| try allocator.dupe(u8, id) else null,
                .branching_ratio = st.branching_ratio,
                .injections = st.injections,
                .reason = try std.fmt.allocPrint(
                    allocator,
                    "near-universal propagation {d:.4} — possible flood",
                    .{st.branching_ratio},
                ),
            });
        }
    }

    return try list.toOwnedSlice(allocator);
}

pub fn writeOutputs(allocator: std.mem.Allocator, opts: Options, agg: aggregate.Result, proposals: []Proposal) !void {
    try ensureDirAll(opts.out_dir);

    const md_path = try std.fs.path.join(allocator, &[_][]const u8{ opts.out_dir, "proposals.md" });
    defer allocator.free(md_path);
    const jsonl_path = try std.fs.path.join(allocator, &[_][]const u8{ opts.out_dir, "proposals.jsonl" });
    defer allocator.free(jsonl_path);

    try writeMarkdown(md_path, agg, proposals);
    try writeJsonl(jsonl_path, proposals);
}

fn writeMarkdown(path: []const u8, agg: aggregate.Result, proposals: []Proposal) !void {
    var file = try std.fs.createFileAbsolute(path, .{});
    defer file.close();

    try file.writeAll("# Assay proposals (propose-only)\n\n");
    try file.writeAll("No writes to ~/circadian. These are recommendations only.\n\n");

    try file.writeAll("## Decoy false-positive rate\n\n");
    var buf: [128]u8 = undefined;
    const decoy_line = try std.fmt.bufPrint(
        &buf,
        "total={d} false_positives={d} fp_rate={d:.4}\n\n",
        .{ agg.decoys.total, agg.decoys.false_positives, agg.decoys.fpRate() },
    );
    try file.writeAll(decoy_line);

    try file.writeAll("## Proposals\n\n");
    if (proposals.len == 0) {
        try file.writeAll("_No proposals this run._\n");
        return;
    }

    for (proposals) |p| {
        const id = p.belief_id orelse "unresolved";
        var line_buf: [512]u8 = undefined;
        const line = try std.fmt.bufPrint(
            &line_buf,
            "- **{s}** `{s}` atom=\"{s}\" ratio={d:.4} injections={d}\n  - {s}\n",
            .{ p.kind.jsonString(), id, p.atom, p.branching_ratio, p.injections, p.reason },
        );
        try file.writeAll(line);
    }
}

fn writeJsonl(path: []const u8, proposals: []Proposal) !void {
    var file = try std.fs.createFileAbsolute(path, .{});
    defer file.close();

    for (proposals) |p| {
        var line_buf: [1024]u8 = undefined;
        const line = if (p.belief_id) |id|
            try std.fmt.bufPrint(
                &line_buf,
                "{{\"kind\":\"{s}\",\"belief_id\":\"{s}\",\"atom\":\"{s}\",\"branching_ratio\":{d:.4},\"injections\":{d},\"reason\":\"{s}\"}}\n",
                .{ p.kind.jsonString(), id, p.atom, p.branching_ratio, p.injections, p.reason },
            )
        else
            try std.fmt.bufPrint(
                &line_buf,
                "{{\"kind\":\"{s}\",\"belief_id\":null,\"atom\":\"{s}\",\"branching_ratio\":{d:.4},\"injections\":{d},\"reason\":\"{s}\"}}\n",
                .{ p.kind.jsonString(), p.atom, p.branching_ratio, p.injections, p.reason },
            );
        try file.writeAll(line);
    }
}

pub fn freeProposals(allocator: std.mem.Allocator, proposals: []Proposal) void {
    for (proposals) |p| {
        allocator.free(p.atom);
        if (p.belief_id) |id| allocator.free(id);
        allocator.free(p.reason);
    }
    allocator.free(proposals);
}

test "retire proposal below floor" {
    const agg = aggregate.Result{
        .stats = &.{
            .{
                .key = "inert atom",
                .belief_id = null,
                .decoy = false,
                .domain = .ordinary,
                .injections = 10,
                .sessions_with_hits = 0,
                .sessions_propagated = 0,
                .branching_ratio = 0.05,
                .recency_rank = 1,
                .shaped_count = 0,
                .echoed_count = 0,
                .theme_only_count = 0,
                .unclassified_count = 0,
            },
        },
        .decoys = .{ .total = 0, .false_positives = 0 },
    };

    const proposals = try run(std.testing.allocator, .{ .out_dir = "/tmp" }, agg);
    defer freeProposals(std.testing.allocator, proposals);

    try std.testing.expect(proposals.len >= 1);
    try std.testing.expect(proposals[0].kind == .retire);
}
