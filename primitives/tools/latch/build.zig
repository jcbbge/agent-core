const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.resolveTargetQuery(.{
        .cpu_arch = .aarch64,
        .os_tag = .macos,
        .abi = .none,
    });
    const optimize = b.option(std.builtin.OptimizeMode, "optimize", "Optimization mode") orelse .ReleaseFast;

    const duration_mod = b.createModule(.{
        .root_source_file = b.path("src/duration.zig"),
        .target = target,
        .optimize = optimize,
    });

    const common_mod = b.createModule(.{
        .root_source_file = b.path("src/common.zig"),
        .target = target,
        .optimize = optimize,
    });

    const kqueue_util_mod = b.createModule(.{
        .root_source_file = b.path("src/kqueue_util.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "common", .module = common_mod },
        },
    });

    const wait_mod = b.createModule(.{
        .root_source_file = b.path("src/wait.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "common", .module = common_mod },
            .{ .name = "duration", .module = duration_mod },
        },
    });

    const wait_file_mod = b.createModule(.{
        .root_source_file = b.path("src/wait_file.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "common", .module = common_mod },
            .{ .name = "kqueue_util", .module = kqueue_util_mod },
        },
    });

    const wait_board_mod = b.createModule(.{
        .root_source_file = b.path("src/wait_board.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "common", .module = common_mod },
            .{ .name = "kqueue_util", .module = kqueue_util_mod },
        },
    });

    const hold_mod = b.createModule(.{
        .root_source_file = b.path("src/hold.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "common", .module = common_mod },
            .{ .name = "wait_file", .module = wait_file_mod },
        },
    });

    const argv_mod = b.createModule(.{
        .root_source_file = b.path("src/argv.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "duration", .module = duration_mod },
        },
    });

    const lib_mod = b.createModule(.{
        .root_source_file = b.path("src/lib.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "argv", .module = argv_mod },
            .{ .name = "common", .module = common_mod },
            .{ .name = "duration", .module = duration_mod },
            .{ .name = "hold", .module = hold_mod },
            .{ .name = "kqueue_util", .module = kqueue_util_mod },
            .{ .name = "wait", .module = wait_mod },
            .{ .name = "wait_board", .module = wait_board_mod },
            .{ .name = "wait_file", .module = wait_file_mod },
        },
    });

    const exe_mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "latch", .module = lib_mod },
        },
    });

    const exe = b.addExecutable(.{
        .name = "latch",
        .root_module = exe_mod,
    });
    b.installArtifact(exe);

    const test_mod = b.createModule(.{
        .root_source_file = b.path("test/root.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "argv", .module = argv_mod },
            .{ .name = "duration", .module = duration_mod },
            .{ .name = "hold", .module = hold_mod },
            .{ .name = "wait", .module = wait_mod },
            .{ .name = "wait_board", .module = wait_board_mod },
        },
    });

    const tests = b.addTest(.{ .root_module = test_mod });
    const run_tests = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run latch tests");
    test_step.dependOn(&run_tests.step);
}
