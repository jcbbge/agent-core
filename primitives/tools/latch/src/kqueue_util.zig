const std = @import("std");
const c = std.c;
const common = @import("common");

pub const EVFILT_VNODE: i16 = -4;
pub const EV_ADD: u16 = 0x0001;
pub const EV_DELETE: u16 = 0x0002;
pub const EV_ENABLE: u16 = 0x0004;
pub const EV_CLEAR: u16 = 0x0020;

pub const NOTE_DELETE: u32 = 0x00000001;
pub const NOTE_WRITE: u32 = 0x00000002;
pub const NOTE_EXTEND: u32 = 0x00000004;
pub const NOTE_ATTRIB: u32 = 0x00000008;
pub const NOTE_LINK: u32 = 0x00000010;
pub const NOTE_RENAME: u32 = 0x00000020;
pub const NOTE_REVOKE: u32 = 0x00000040;

pub const KqueueError = error{
    KqueueInit,
    KeventRegister,
    KeventWait,
};

pub fn evtOnlyOpenFlags() c.O {
    return .{ .EVTONLY = true };
}

pub fn evtOnlyCreateFlags() c.O {
    return .{ .CREAT = true, .EVTONLY = true };
}

pub fn openKqueue() KqueueError!c_int {
    const kq_fd = c.kqueue();
    if (kq_fd < 0) return error.KqueueInit;
    return kq_fd;
}

pub fn registerVnode(kq_fd: c_int, fd: std.posix.fd_t, fflags: u32) KqueueError!void {
    const change = c.Kevent{
        .ident = @intCast(@as(usize, @bitCast(@as(isize, fd)))),
        .filter = EVFILT_VNODE,
        .flags = EV_ADD | EV_CLEAR,
        .fflags = fflags,
        .data = 0,
        .udata = 0,
    };
    var changes = [_]c.Kevent{change};
    var empty_events = [_]c.Kevent{};
    const rc = c.kevent(kq_fd, &changes, 1, &empty_events, 0, null);
    if (rc < 0) return error.KeventRegister;
}

pub fn waitOnce(kq_fd: c_int, remain_ms: u64) KqueueError!?c.Kevent {
    const timeout = common.timespecFromRemainingMs(remain_ms);
    var events = [_]c.Kevent{undefined};
    const empty: [*]const c.Kevent = &[_]c.Kevent{};
    const rc = c.kevent(kq_fd, empty, 0, &events, 1, &timeout);
    if (rc < 0) return error.KeventWait;
    if (rc == 0) return null;
    return events[0];
}

pub fn fdFromIdent(ident: usize) std.posix.fd_t {
    return @intCast(@as(isize, @bitCast(@as(usize, ident))));
}
