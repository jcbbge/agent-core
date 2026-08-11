const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.resolveTargetQuery(.{
        .cpu_arch = .aarch64,
        .os_tag = .macos,
        .abi = .none,
    });
    const optimize = b.option(std.builtin.OptimizeMode, "optimize", "Optimization mode") orelse .ReleaseFast;

    const vein_mod = b.createModule(.{
        .root_source_file = b.path("../vein/src/lib.zig"),
        .target = target,
        .optimize = optimize,
    });

    const lib_mod = b.createModule(.{
        .root_source_file = b.path("src/lib.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "vein", .module = vein_mod },
        },
    });

    const exe_mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "assay", .module = lib_mod },
            .{ .name = "vein", .module = vein_mod },
        },
    });

    const exe = b.addExecutable(.{
        .name = "assay",
        .root_module = exe_mod,
    });
    b.installArtifact(exe);

    const tests = b.addTest(.{ .root_module = lib_mod });
    const run_tests = b.addRunArtifact(tests);

    const smoke_mod = b.createModule(.{
        .root_source_file = b.path("test/smoke.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "vein", .module = vein_mod },
        },
    });
    const smoke_tests = b.addTest(.{ .root_module = smoke_mod });
    const run_smoke_tests = b.addRunArtifact(smoke_tests);

    const test_step = b.step("test", "Run assay tests");
    test_step.dependOn(&run_tests.step);
    test_step.dependOn(&run_smoke_tests.step);
}
