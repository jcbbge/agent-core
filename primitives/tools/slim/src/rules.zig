pub const version = "1.0.0";

const dollar_paren: []const u8 = &[_]u8{ '$', '(' };
const dollar_double_paren_space: []const u8 = &[_]u8{ '$', '(', '(', ' ' };

pub const blocked_metachars = [_][]const u8{
    "|", "&", ";", dollar_paren, "`", "<", ">", "{", "}", "<<", dollar_double_paren_space,
};

pub const blocked_git_flags = [_][]const u8{
    "--porcelain", "-s", "--short", "--format", "--pretty", "--oneline", "-p", "--patch",
};

pub const git_status_clean_marker = "clean — nothing to commit";
pub const git_status_max_paths: usize = 15;

pub const ps_width: usize = 120;
pub const ps_rows: usize = 30;
pub const df_width: usize = 80;
pub const df_rows: usize = 20;

pub const git_log_end_marker = "---END---";
pub const git_log_body_lines: usize = 3;
pub const git_log_default_count: usize = 10;
pub const git_log_default_body_width: usize = 80;
pub const git_log_explicit_body_width: usize = 120;

pub const stdout_cap: usize = 16 * 1024 * 1024;
