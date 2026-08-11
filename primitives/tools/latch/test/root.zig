const std = @import("std");
const argv = @import("argv");
const duration = @import("duration");
const hold = @import("hold");
const wait = @import("wait");
const wait_board = @import("wait_board");

test "duration parse seconds" {
    try std.testing.expectEqual(@as(u64, 30_000), try duration.parseMs("30s"));
}

test "duration parse minutes" {
    try std.testing.expectEqual(@as(u64, 600_000), try duration.parseMs("10m"));
}

test "duration parse hours" {
    try std.testing.expectEqual(@as(u64, 3_600_000), try duration.parseMs("1h"));
}

test "duration default timeout" {
    try std.testing.expectEqual(@as(u64, 1_800_000), duration.defaultTimeoutMs());
}

test "duration invalid suffix" {
    try std.testing.expectError(error.InvalidNumber, duration.parseMs("5d"));
}

test "status match default until" {
    try std.testing.expect(wait.statusMatches(null, "idle"));
    try std.testing.expect(wait.statusMatches(null, "done"));
    try std.testing.expect(!wait.statusMatches(null, "working"));
}

test "status match explicit until" {
    try std.testing.expect(wait.statusMatches("working", "working"));
    try std.testing.expect(!wait.statusMatches("working", "idle"));
}

test "extract agent_status from event json" {
    const line =
        \\{"event":"pane.agent_status_changed","data":{"pane_id":"w1Q:p5","agent_status":"idle","agent":"pi"}}
    ;
    const status = wait.extractAgentStatus(line).?;
    try std.testing.expectEqualStrings("idle", status);
}

test "extract pane_id from closed event" {
    const line = "{\"event\":\"pane.closed\",\"data\":{\"pane_id\":\"w1Q:p9\",\"workspace_id\":\"w1Q\"}}";
    const pid = wait.extractPaneId(line).?;
    try std.testing.expectEqualStrings("w1Q:p9", pid);
}

test "isPaneClosed matches live herdr pane_closed event" {
    const line =
        \\{"data":{"pane_id":"w1Q:pR","type":"pane_closed","workspace_id":"w1Q"},"event":"pane_closed"}
    ;
    try std.testing.expect(wait.isPaneClosed(line, "w1Q:pR"));
    try std.testing.expect(!wait.isPaneClosed(line, "w1Q:p9"));
}

test "isPaneClosed matches legacy dotted pane.closed event" {
    const line = "{\"event\":\"pane.closed\",\"data\":{\"pane_id\":\"w1Q:p9\",\"workspace_id\":\"w1Q\"}}";
    try std.testing.expect(wait.isPaneClosed(line, "w1Q:p9"));
    try std.testing.expect(!wait.isPaneClosed(line, "w1Q:pR"));
}

test "wait argv requires exactly one target" {
    try std.testing.expectError(error.MissingTarget, argv.parseWaitArgs(&.{}));
    try std.testing.expectError(error.MultipleTargets, argv.parseWaitArgs(&.{ "--pane", "p1", "--file", "/tmp/x" }));
}

test "wait argv parses pane" {
    const parsed = try argv.parseWaitArgs(&.{ "--pane", "w1Q:p1", "--timeout", "5s" });
    try std.testing.expectEqual(argv.WaitTarget.pane, parsed.target);
    try std.testing.expectEqualStrings("w1Q:p1", parsed.pane_id.?);
    try std.testing.expectEqual(@as(u64, 5_000), parsed.timeout_ms);
}

test "wait argv parses file" {
    const parsed = try argv.parseWaitArgs(&.{ "--file", "/tmp/test" });
    try std.testing.expectEqual(argv.WaitTarget.file, parsed.target);
    try std.testing.expectEqualStrings("/tmp/test", parsed.file_path.?);
}

test "wait argv parses board" {
    const parsed = try argv.parseWaitArgs(&.{ "--board", "agent-core/latch-vein" });
    try std.testing.expectEqual(argv.WaitTarget.board, parsed.target);
    try std.testing.expectEqualStrings("agent-core/latch-vein", parsed.board_topic.?);
}

test "hold argv parses gate" {
    const parsed = try argv.parseHoldArgs(&.{ "migration-live", "--timeout", "10s" });
    try std.testing.expectEqualStrings("migration-live", parsed.gate);
    try std.testing.expectEqual(@as(u64, 10_000), parsed.timeout_ms);
}

test "gate name rejection" {
    try std.testing.expect(!hold.isValidGateName(""));
    try std.testing.expect(!hold.isValidGateName(".."));
    try std.testing.expect(!hold.isValidGateName("a/b"));
    try std.testing.expect(!hold.isValidGateName("a\\b"));
    try std.testing.expect(!hold.isValidGateName("bad..gate"));
    try std.testing.expect(hold.isValidGateName("migration-live"));
}

test "board topic match helper" {
    const line = "{\"topic\":\"agent-core/latch-vein\",\"type\":\"finding\",\"body\":\"ok\"}";
    try std.testing.expect(wait_board.boardTopicMatches(line, "agent-core/latch-vein"));
    try std.testing.expect(!wait_board.boardTopicMatches(line, "other/topic"));
}
