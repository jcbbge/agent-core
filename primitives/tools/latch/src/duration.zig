const std = @import("std");

pub const ParseError = error{
    Empty,
    InvalidSuffix,
    InvalidNumber,
    Overflow,
};

/// Parse duration strings like `30s`, `10m`, `1h` into milliseconds.
pub fn parseMs(text: []const u8) ParseError!u64 {
    if (text.len == 0) return error.Empty;

    var suffix: u8 = 0;
    var num_part = text;
    const last = text[text.len - 1];
    if (last == 's' or last == 'm' or last == 'h') {
        suffix = last;
        num_part = text[0 .. text.len - 1];
    }
    if (num_part.len == 0) return error.InvalidNumber;

    const value = std.fmt.parseInt(u64, num_part, 10) catch return error.InvalidNumber;

    const ms_per: u64 = switch (suffix) {
        0, 's' => 1_000,
        'm' => 60_000,
        'h' => 3_600_000,
        else => return error.InvalidSuffix,
    };

    const total = std.math.mul(u64, value, ms_per) catch return error.Overflow;
    return total;
}

pub fn defaultTimeoutMs() u64 {
    return parseMs("30m") catch 1_800_000;
}
