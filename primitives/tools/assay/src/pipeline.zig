const std = @import("std");
const wake = @import("wake.zig");
const match = @import("match.zig");
const classify = @import("classify.zig");
const aggregate = @import("aggregate.zig");
const propose = @import("propose.zig");
const belief = @import("belief.zig");
const llm = @import("llm.zig");

const ExitCode = enum(u8) {
    ok = 0,
    usage = 2,
    io = 3,
    schema_unknown = 4,
    llm_unavailable = 5,
};

pub const RunInput = struct {
    evidence: []const classify.EvidenceHit,
    sessions: []const aggregate.SessionMeta,
    atom_keys: []const aggregate.AtomKey,
};

pub const RunOptions = struct {
    out_dir: []const u8,
    mind_dir: []const u8,
    decoys: u32 = 0,
    llm: llm.Config = .{},
    io: std.Io,
    aggregate: aggregate.Options = .{},
    propose: propose.Options,
};

pub const RunOutcome = struct {
    exit_code: ExitCode,
    classified_path: []const u8,
    aggregate_path: []const u8,
    llm_available: bool,
};

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

pub fn runClassifyStage(
    allocator: std.mem.Allocator,
    opts: RunOptions,
    evidence: []const classify.EvidenceHit,
) !struct { result: classify.Result, path: []const u8 } {
    const result = try classify.run(allocator, .{
        .llm = opts.llm,
        .io = opts.io,
    }, evidence);

    try ensureDirAll(opts.out_dir);
    const path = try std.fs.path.join(allocator, &[_][]const u8{ opts.out_dir, "classified.jsonl" });
    try classify.writeJsonl(allocator, path, result.hits);
    return .{ .result = result, .path = path };
}

pub fn runAggregateStage(
    allocator: std.mem.Allocator,
    opts: RunOptions,
    sessions: []const aggregate.SessionMeta,
    classified: []const classify.ClassifiedHit,
    atom_keys: []const aggregate.AtomKey,
) !struct { result: aggregate.Result, path: []const u8 } {
    const result = try aggregate.run(allocator, opts.aggregate, sessions, classified, atom_keys);

    const path = try std.fs.path.join(allocator, &[_][]const u8{ opts.out_dir, "aggregate.jsonl" });
    try aggregate.writeJsonl(allocator, path, result);
    return .{ .result = result, .path = path };
}

pub fn runProposeStage(
    allocator: std.mem.Allocator,
    opts: RunOptions,
    agg: aggregate.Result,
) ![]propose.Proposal {
    var propose_opts = opts.propose;
    propose_opts.out_dir = opts.out_dir;
    propose_opts.propagation_floor = opts.aggregate.propagation_floor;
    propose_opts.min_injections_for_retire = opts.aggregate.min_injections_for_retire;
    propose_opts.flood_threshold = opts.aggregate.flood_threshold;

    const proposals = try propose.run(allocator, propose_opts, agg);
    try propose.writeOutputs(allocator, propose_opts, agg, proposals);
    return proposals;
}

/// Orchestrate classify -> aggregate -> propose for assay run.
/// Wake/match stages are peer-owned; callers pass their evidence rows here.
pub fn run(allocator: std.mem.Allocator, opts: RunOptions, input: RunInput) !RunOutcome {
    _ = wake;
    _ = match;

    const classify_out = try runClassifyStage(allocator, opts, input.evidence);
    defer classify.freeResult(allocator, &classify_out.result);

    const aggregate_out = try runAggregateStage(
        allocator,
        opts,
        input.sessions,
        classify_out.result.hits,
        input.atom_keys,
    );
    defer {
        for (aggregate_out.result.stats) |st| {
            allocator.free(st.key);
            if (st.belief_id) |id| allocator.free(id);
        }
        allocator.free(aggregate_out.result.stats);
    }

    const proposals = try runProposeStage(allocator, opts, aggregate_out.result);
    defer propose.freeProposals(allocator, proposals);

    const exit: ExitCode = if (classify_out.result.llm_available) .ok else .llm_unavailable;

    return .{
        .exit_code = exit,
        .classified_path = classify_out.path,
        .aggregate_path = aggregate_out.path,
        .llm_available = classify_out.result.llm_available,
    };
}

/// Resolve belief ids for atom claims (read-only mind dir).
pub fn resolveAtomKeys(
    allocator: std.mem.Allocator,
    mind_dir: []const u8,
    claims: []const []const u8,
    decoy_flags: []const bool,
) ![]aggregate.AtomKey {
    var out = std.ArrayList(aggregate.AtomKey).empty;
    errdefer out.deinit(allocator);

    for (claims, decoy_flags) |claim, is_decoy| {
        const resolved = try belief.resolve(allocator, mind_dir, claim);
        defer {
            if (resolved.id) |id| allocator.free(id);
            allocator.free(resolved.normalized_claim);
            if (resolved.claim_from_file) |c| allocator.free(c);
        }
        const key = try allocator.dupe(u8, resolved.normalized_claim);
        try out.append(allocator, .{
            .key = key,
            .belief_id = if (resolved.resolved and resolved.id != null)
                try allocator.dupe(u8, resolved.id.?)
            else
                null,
            .decoy = is_decoy,
        });
    }
    return try out.toOwnedSlice(allocator);
}

test "pipeline run with LLM-down yields exit 5 path" {
    const tmp = "/tmp/assay-classify-pipeline-test";
    std.posix.rmdir(tmp) catch {};
    std.posix.rmdir("/tmp/assay-classify-pipeline-test") catch {};
    try ensureDirAll(tmp);

    const evidence = [_]classify.EvidenceHit{
        .{
            .session_id = "sess",
            .atom_hint = "Motion is the metric.",
            .line = 10,
            .snippet = "assistant echoed motion is the metric",
            .decoy = false,
        },
    };
    const sessions = [_]aggregate.SessionMeta{.{
        .session_id = "sess",
        .cwd = "/Users/jrg/agent-core",
    }};
    const keys = [_]aggregate.AtomKey{.{
        .key = "Motion is the metric.",
        .belief_id = null,
        .decoy = false,
    }};

    const outcome = try run(std.testing.allocator, .{
        .out_dir = tmp,
        .mind_dir = "/nonexistent",
        .io = std.testing.io,
        .llm = .{ .base_url = "http://127.0.0.1:1/v1", .probe_timeout_ms = 100 },
        .propose = .{ .out_dir = tmp },
    }, .{
        .evidence = &evidence,
        .sessions = &sessions,
        .atom_keys = &keys,
    });
    defer {
        std.testing.allocator.free(outcome.classified_path);
        std.testing.allocator.free(outcome.aggregate_path);
    }

    try std.testing.expect(outcome.exit_code == .llm_unavailable);
    try std.testing.expect(!outcome.llm_available);
}
