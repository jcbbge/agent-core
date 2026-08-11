const std = @import("std");

var process_io: std.Io = undefined;
var io_ready = false;

pub fn setProcessIo(io_instance: std.Io) void {
    process_io = io_instance;
    io_ready = true;
}

pub fn io() std.Io {
    if (!io_ready) @panic("vein: process io not set");
    return process_io;
}

pub fn openAbs(path: []const u8) !std.Io.File {
    if (std.fs.path.isAbsolute(path)) {
        return std.Io.Dir.openFileAbsolute(io(), path, .{});
    }
    return std.Io.Dir.cwd().openFile(io(), path, .{});
}

pub fn createAbs(path: []const u8, flags: std.Io.Dir.CreateFileOptions) !std.Io.File {
    if (std.fs.path.isAbsolute(path)) {
        return std.Io.Dir.createFileAbsolute(io(), path, flags);
    }
    return std.Io.Dir.cwd().createFile(io(), path, flags);
}

pub fn openDirAbs(path: []const u8) !std.Io.Dir {
    if (std.fs.path.isAbsolute(path)) {
        return std.Io.Dir.openDirAbsolute(io(), path, .{ .iterate = true });
    }
    return std.Io.Dir.cwd().openDir(io(), path, .{ .iterate = true });
}

pub fn createDirPath(path: []const u8) !void {
    return std.Io.Dir.createDirPath(.cwd(), io(), path);
}

pub fn writeFileAbs(path: []const u8, data: []const u8) !void {
    const file = try createAbs(path, .{ .read = false, .truncate = true });
    defer file.close(io());
    try std.Io.File.writeStreamingAll(file, io(), data);
}

pub fn fileMtime(path: []const u8) !i128 {
    const file = try openAbs(path);
    defer file.close(io());
    const st = try file.stat(io());
    return @intCast(st.mtime.nanoseconds);
}

/// Read one line into `line_buf` (without delimiter). Returns false at EOF.
/// Uses takeDelimiter (advances reader). Falls back to streamDelimiterLimit for lines
/// longer than the reader buffer — streamDelimiter alone does NOT consume delimiters.
pub fn readLineInto(allocator: std.mem.Allocator, reader: *std.Io.File.Reader, line_buf: *std.ArrayList(u8)) !bool {
    line_buf.clearRetainingCapacity();
    const r = &reader.interface;

    const part = r.takeDelimiter('\n') catch |err| switch (err) {
        error.ReadFailed => return error.ReadFailed,
        error.StreamTooLong => {
            var aw = std.Io.Writer.Allocating.init(allocator);
            _ = r.streamDelimiterLimit(&aw.writer, '\n', .unlimited) catch |e| switch (e) {
                error.ReadFailed, error.WriteFailed => return error.ReadFailed,
                else => return error.ReadFailed,
            };
            _ = r.discardDelimiterInclusive('\n') catch {};
            line_buf.* = aw.toArrayList();
            return line_buf.items.len > 0;
        },
    };
    if (part) |slice| {
        try line_buf.appendSlice(allocator, slice);
        return true;
    }
    return false;
}

pub fn readFileAbs(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const file = try openAbs(path);
    defer file.close(io());
    var list = std.ArrayList(u8).empty;
    var aw = std.Io.Writer.Allocating.fromArrayList(allocator, &list);
    var buf: [65536]u8 = undefined;
    while (true) {
        const n = file.readStreaming(io(), &.{&buf}) catch |err| switch (err) {
            error.EndOfStream => break,
            else => |e| return e,
        };
        if (n == 0) break;
        try aw.writer.writeAll(buf[0..n]);
    }
    const content = aw.toArrayList();
    return try allocator.dupe(u8, content.items);
}

pub fn deleteTreeAbs(path: []const u8) !void {
    return std.Io.Dir.deleteTree(.cwd(), io(), path);
}

pub fn accessAbs(path: []const u8) !void {
    return std.Io.Dir.accessAbsolute(io(), path, .{});
}

var test_runtime: ?std.Io.Threaded = null;

pub fn ensureTestIo(allocator: std.mem.Allocator) void {
    if (io_ready) return;
    test_runtime = std.Io.Threaded.init(allocator, .{});
    setProcessIo(test_runtime.?.io());
}
