const std = @import("std");
const assay = @import("assay");

const llm = assay.llm;
const classify = assay.classify;

/// Live local-LLM endpoint from plan pre-verified facts. Tests skip when down.
const local_endpoint = llm.Config{
    .base_url = "http://127.0.0.1:10240/v1",
    .model = "local",
    .probe_timeout_ms = 5000,
    .chat_timeout_ms = 60000,
};

const discover_model_cfg = llm.Config{
    .base_url = "http://127.0.0.1:10240/v1",
    .probe_timeout_ms = 5000,
};

test "AC2: llm module exports probe pickModel classifySnippet for zig build test" {
    _ = llm.probe;
    _ = llm.pickModel;
    _ = llm.classifySnippet;
    _ = llm.Config;
    _ = llm.LlmUnavailable;
}

test "AC1: probe completes models and chat round-trip when local LLM up" {
    const available = llm.probe(std.testing.allocator, std.testing.io, local_endpoint) catch |err| switch (err) {
        error.LlmUnavailable => return error.SkipZigTest,
        else => return err,
    };
    try std.testing.expect(available);
}

test "AC1: pickModel discovers local model id from /v1/models when endpoint up" {
    const model = llm.pickModel(std.testing.allocator, std.testing.io, discover_model_cfg) catch |err| switch (err) {
        error.LlmUnavailable => return error.SkipZigTest,
        else => return err,
    };
    defer std.testing.allocator.free(model);
    try std.testing.expectEqualStrings("local", model);
}

test "AC3: classifySnippet returns non-empty parseable label for model local" {
    const raw = llm.classifySnippet(
        std.testing.allocator,
        std.testing.io,
        local_endpoint,
        "Motion is the metric.",
        "assistant: I decided to prioritize motion as the metric for this sprint.",
    ) catch |err| switch (err) {
        error.LlmUnavailable => return error.SkipZigTest,
        else => return err,
    };
    defer std.testing.allocator.free(raw);
    try std.testing.expect(raw.len > 0);

    const label = classify.Label.parse(raw) orelse {
        std.debug.print("AC3: unparseable classify label: {s}\n", .{raw});
        return error.TestExpectedEqual;
    };
    try std.testing.expect(label != .unclassified);
}
