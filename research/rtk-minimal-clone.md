# rtk minimal clone: mechanism autopsy and design

Date: 2026-08-11  
Target studied: installed `rtk 0.34.3`, macOS arm64  
Decision: build a closed, six-verb Zig replacement; do not clone the rtk platform.

## Executive verdict

The useful part of rtk is small. For the six allowlisted forms it is a native-command runner followed by six deterministic text transforms:

- `ls`: discard long-list metadata, group directories before files, retain names and humanized file sizes.
- `ps`: retain the first 30 rows and truncate every row to 120 characters.
- `git status`: ask Git for porcelain-with-branch output, count status classes, and show bounded file lists.
- `git log`: ask Git for a purpose-built format, retain a compact header and at most three body lines per commit.
- `wc`: remove alignment and redundant file paths; label full-mode counts.
- `df`: retain the first 20 rows and truncate every row to 80 characters.

That does not justify a 60-verb registry, SQLite gain ledger, telemetry, trust/integrity subsystem, configuration language, or the known-corrupt wrappers. A macOS-first Zig binary with a literal rewrite table should retain essentially all measured savings from the allowlist in roughly 550–750 implementation LOC plus tests. The bounded version is about 8–12 hours; keeping it to one day requires rejecting generic shell parsing, cross-platform behavior, telemetry, and configuration.

There is also an immediate operational reason to own the narrow path: the installed binary currently refuses normal wrapped commands because the audited allowlist changed `~/.claude/hooks/rtk-rewrite.sh`, so rtk's stored integrity hash no longer matches. The isolated measurements below required a scratch-only `HOME`; no installed hook, config, or binary was changed.

## What rtk does under the hood

The CLI does not compress a command string. `rtk rewrite "<shell command>"` only chooses a wrapper. The selected wrapper then executes the native command, captures stdout, applies a command-specific filter, emits compact stdout, and records the raw/filtered pair for its gain ledger. The installed executable is 6.9 MiB.

The measurements below reran both forms on this machine. The raw and compact captures are under the brief-authorized scratch directory `.../scratchpad/w5/`. Process counts are inherently time-dependent; the transform itself is confirmed against the pinned v0.34.3 sources.

### Per-verb mechanism table

| Verb and probe | Raw → rtk | Observed output shape | Actual compaction algorithm | Caps, reordering, and semantic notes |
|---|---:|---|---|---|
| `ls -la /Users/jrg` | 9,462 B / 158 lines → 2,053 B / 155 lines (78.3%) | Directories become `name/`; regular files and symlinks become `name size` | Runs native `ls -la`, parses whitespace columns, drops `total`, `.`, `..`, permissions, links, owner/group, date, and time; joins column 9 onward as the name; humanizes byte size; emits directories first, then files | No row cap. It deliberately changes ordering. Without `-a`, known noise directories are removed; with `-a`, as tested, they remain. Interactive summary is suppressed when stdout is piped. Fixed-column parsing is the main fragility. |
| `ps aux` | 159,608 B / 854 lines → 3,222 B / 31 lines (98.0%) | Native header and rows remain recognizable; long command fields end in `...`; final line reports omitted rows | Generic TOML filter: strip ANSI, truncate each row at 120 characters, retain the first 30 rows, append an omission count | No column parsing, aggregation, deduplication, or CPU grouping. It is head-plus-width-truncation. The snapshot retained the busiest first rows because macOS `ps aux` happened to produce that order; the filter itself does not sort. |
| `git status` in Arc | 306 B / 9 lines → 116 B / 5 lines (62.1%; earlier audit sample was 305→61 B) | `* branch...upstream [ahead/behind]`, then `+ Staged`, `~ Modified`, `? Untracked`, conflicts or clean marker, with bounded paths | For no-arg status, runs `git status --porcelain -b`; parses the two status columns; counts staged, modified, untracked, and conflicts; emits configured maxima of paths and `... +N more` | It is a semantic re-render, not line deletion. Porcelain may enumerate files hidden by raw status's directory summary, so byte savings vary with repository state. Explicit status flags take a different minimal-filter path; the local hook correctly blocks `--porcelain`. |
| `git log -5` in Arc | 4,809 B / 93 lines → 1,858 B / 25 lines (61.4%) | `short-hash subject (relative-date) <author>`, followed by up to three indented body lines and `[+N lines omitted]` | Unless the user supplies a format, injects `%h %s (%ar) <%an>%n%b%n---END---`; defaults to 10 commits, adds `--no-merges`, respects explicit `-N`; splits commit blocks; removes empty, `Signed-off-by:`, and `Co-authored-by:` body lines; keeps three body lines | Explicit `-5` means five commits and a 120-character per-line cap. Without an explicit count the cap is 10 commits and 80 characters. A user-supplied `--oneline`/`--pretty`/`--format` uses simple line truncation instead; the hook blocks machine-format flags. |
| `wc -l PRODUCT.md` | 44 B / 1 line → 4 B / 1 line (90.9%) | `     110 /long/path` becomes `110` | Detects requested count mode. For a single file with one requested count, emits only the first number. Full mode emits `NL NW NB`; multi-file mode strips the common directory prefix and emits a `Σ` total | No truncation cap. This is formatting-only. The v0.34.3 implementation does not explicitly inherit stdin in its runner, so the clone should either support stdin deliberately or refuse the no-file form. |
| `df -h` | 1,089 B / 12 lines → 961 B / 12 lines (11.8%) | Same rows and columns; mount paths wider than the budget end in `...` | Generic TOML filter: strip ANSI, truncate each row at 80 characters, retain at most 20 rows | No parsing, aggregation, deduplication, or filesystem selection. Savings are small and information beyond column 80 is lost. This verb should remain only because today's corpus deemed that loss acceptable. |

### Source confirmation

Pinned v0.34.3 sources:

- [`src/cmds/system/ls.rs`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/cmds/system/ls.rs): native `ls -la`, column parsing, directory/file regrouping, humanized sizes, noise filtering, and TTY-only summary.
- [`src/cmds/system/wc_cmd.rs`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/cmds/system/wc_cmd.rs): mode detection, single-value rendering, common-prefix stripping, and `Σ` totals.
- [`src/cmds/git/git.rs`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/cmds/git/git.rs): porcelain status rendering and formatted log block truncation.
- [`src/filters/ps.toml`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/filters/ps.toml): 120-character rows, 30-row cap.
- [`src/filters/df.toml`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/filters/df.toml): 80-character rows, 20-row cap.
- [`src/discover/registry.rs`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/discover/registry.rs) and [`rules.rs`](https://github.com/rtk-ai/rtk/blob/v0.34.3/src/discover/rules.rs): rewrite classifier, shell segmentation, ignored commands, regex registry, and prefix replacement.

Current `develop` retains the same core model—rewrite rules select native-command filters—even though the registry and shell parser have grown substantially.

## `rtk rewrite` mapper

In 0.34.3, the mapper:

1. Trims the command and refuses empty strings, heredocs (`<<`), and arithmetic expansion (`$((`).
2. Tokenizes compound operators. It rewrites supported segments around `&&`, `||`, `;`, and background `&`. For a pipeline, it rewrites only the first stage and leaves the downstream filter raw; `find`/`fd` are explicitly not rewritten in pipelines.
3. Separates trailing redirects, classifies the command, then reattaches redirects.
4. Strips recognized `sudo`, `env`, and `NAME=value` prefixes for matching and restores them before `rtk`.
5. Uses an anchored regex registry plus ordered literal `rewrite_prefixes`; unsupported and ignored commands return no rewrite.
6. Returns an already-`rtk` command unchanged. `RTK_DISABLED=1` forces no rewrite.

Observed boundaries from the installed binary:

| Input | Result |
|---|---|
| `ls`, `ps aux`, `wc`, `df -h` | Prefix with the corresponding `rtk` wrapper |
| `git -C /tmp status` | `rtk git -C /tmp status` |
| `sudo ls -la` | `sudo rtk ls -la` |
| `FOO=1 wc -l file` | `FOO=1 rtk wc -l file` |
| `ls \| wc -l` | `rtk ls \| wc -l` |
| `ps aux && df -h` | Both segments rewritten |
| `git status --porcelain`, `git log --format=%H -1` | Rewritten by rtk itself; rejected later by the local allowlist guard |
| `/bin/ls -la /tmp`, `sed ...`, unknown command, heredoc | No rewrite, exit 1 |

The distinction matters: rtk's registry is broad and permissive; the audited hook is the safety boundary. The minimal clone should collapse both layers into one closed table and never produce a rewrite that its own runner will not safely honor.

## Minimal-clone scope

### In

| Surface | Accepted forms | Behavior |
|---|---|---|
| `clone rewrite "<command>"` | One flat command only; literal first-word match for `ls`, `ps`, `wc`, `df`; `git status` and `git log`; optional leading `git -C <path>` | Print the wrapped command on match; exit 1 with no stdout on no-match. Reject pipes, compounds, substitutions, backticks, machine-format Git flags, and unsupported absolute executable paths. |
| `clone ls [args...]` | The audited `ls` forms | Spawn `/bin/ls`, compact with the pinned algorithm. |
| `clone ps [args...]` | The audited `ps aux` form initially | Spawn `/bin/ps`, apply 120×30 filter. |
| `clone git status [args...]` | No-arg human status only, plus global `-C` | Spawn `/usr/bin/git status --porcelain -b`, render bounded categories. |
| `clone git log [args...]` | Human log with optional count and safe revision/path arguments; reject format flags | Spawn `/usr/bin/git log` with the compact format, apply commit/body caps. |
| `clone wc [args...]` | `-l`, `-w`, `-c`, `-m`, combinations and file operands | Spawn `/usr/bin/wc`, render compact counts. Deliberately test or refuse stdin. |
| `clone df [args...]` | The audited `df -h` form initially | Spawn `/bin/df`, apply 80×20 filter. |

Every formatter should be a pure `argv + captured stdout -> compact stdout` function. Only the runner owns process execution and exit-code/stderr propagation. Failed native commands pass their stderr and exit code through without attempting to reinterpret success.

### Out

| Deliberately omitted | Reason |
|---|---|
| The rest of the roughly 60-verb registry | No measured benefit here; several wrappers corrupt output. |
| `cat`/read, grep/rg, find, diff, head/tail, tree, du, curl, Docker/Kubernetes, package managers, test runners, npx and ecosystem adapters | Outside the proven allowlist; some are the known failure surface. |
| SQLite `gain` ledger and self-reported savings | Measurement was unreliable and adds writes, schema, locks, and tracking code to every command. |
| Telemetry | No operational value for the local clone; default is off because the feature does not exist. |
| Config files, TOML filters, trust store, hook-integrity hashes, update checks | The behavior is intentionally compiled and reviewable. |
| Deny/ask policy rules | Permission policy belongs to the harness, not an output filter. |
| Generic shell parser, multiline rewriting, transparent wrappers, arbitrary compounds/pipelines | The local hook already rejects these. Reimplementing shell syntax is the fastest route back to rtk's complexity and corruption risk. |
| Cross-platform command discovery in v1 | macOS arm64 is the actual target. Use fixed native paths and make portability a later explicit decision. |

## Language decision

“Static” on macOS should mean one self-contained application executable with no package/runtime dependency; the OS's normal system-library linkage remains.

| Criterion | Rust | Zig | Go |
|---|---|---|---|
| Single native executable | Yes | Yes | Yes |
| Stdlib-only fit | Process spawning and parsing are straightforward, but regex/CLI ergonomics often pull crates; avoid them for this scope | Strong fit: process, filesystem, allocation, and manual token scanning are enough; no regex is needed for six literal rules | Strongest batteries-included fit: `os/exec`, `regexp`, testing |
| Estimated implementation LOC, excluding tests | 650–900 | 550–750 | 500–700 |
| Local maintainability | Some exposure; new Cargo surface | Best: agent-core is already owned in Zig 0.15.2 | New language/toolchain in this repo |
| Startup target | Installed Rust `rtk rewrite` measured 5.707 ms median / 5.950 ms p95; wrapper `wc` was 4.889 ms median versus raw `wc` 1.534 ms | Expected to be viable, but acceptance must be a measured p95 below 10 ms; no runtime initialization or regex engine is required | Likely viable, but binary/runtime startup and size should be benchmark-gated rather than assumed |
| Main risk | Recreating upstream's crate-heavy shape | Zig stdlib API churn; manual parsing requires disciplined bounds/error handling | Lowest implementation friction, but adds an otherwise unowned stack and usually a larger binary |

### Recommendation: Zig

Zig wins because the minimal design does not need regex, async I/O, a database, or a framework, while jrg already owns and builds Zig 0.15.2 in this repository. Go is the fastest throwaway prototype choice; Rust is the easiest language in which to drift back toward upstream. For a durable local tool, ownership is more important than saving roughly 50–100 LOC.

### Architecture and size

| Module | Responsibility | Rough LOC |
|---|---|---:|
| `main.zig` | Parse subcommand, dispatch, stable exit codes | 50–70 |
| `rules.zig` | Data-only six-rule table, blocked-token/flag lists | 40–60 |
| `rewrite.zig` | Leading-token scan, optional env and `git -C`, refuse unsafe syntax, render rewrite | 80–110 |
| `runner.zig` | Spawn fixed native path, capture stdout, preserve stderr/exit, size guard | 80–110 |
| `filters/common.zig` | ANSI stripping if retained, UTF-8-safe line truncation, row cap and omission message | 40–60 |
| `filters/ls.zig` | Pinned long-list transform | 80–110 |
| `filters/ps_df.zig` | Parameterized width/row filter | 15–30 |
| `filters/wc.zig` | Mode detection and single/multi rendering | 50–80 |
| `filters/git_status.zig` | Porcelain parser and bounded category renderer | 70–100 |
| `filters/git_log.zig` | Safe arg classification, format injection, block/body truncation | 85–120 |
| Total implementation |  | **550–750** |
| Unit, golden, and differential tests | Corpus fixtures, adversarial rewrite cases, native-command comparisons | **350–500** |

No dynamic plugins, reflection, configuration loading, persistence, network calls, or background work.

### Effort and one-day cut line

- Core implementation and unit tests: 6–8 hours.
- Differential corpus, exit/stderr tests, malformed UTF-8/long-line tests, and latency measurement: 2–4 hours.
- Total: 8–12 hours.

That can exceed a normal day. The cut is not to drop a proven verb; it is to keep the acceptance grammar exact: flat commands only, macOS only, no env-prefix generality beyond the forms the hook actually emits, no pipelines/compounds, no config, and no ledger. If that boundary is not acceptable, do not build the clone.

## Build versus keep

| Dimension | Keep allowlisted rtk 0.34.3 | Build the six-verb clone |
|---|---|---|
| Token savings | Proven for the six forms, but currently unavailable in the normal HOME while the hook hash is mismatched | Same transforms can retain the measured 11.8–98.0% byte reductions; golden differential tests make this an acceptance fact |
| Corruption risk | Hook guard narrows exposure, but the broad mapper and all wrapper code remain in the binary; guard and upstream integrity policy currently conflict | Closed grammar cannot route to the known-corrupt verbs; remaining risk is visible in six small filters |
| Maintenance | Upstream fixes are available, but 0.45.0 still has the cited open corruption issues and upgrades require full re-audit | Local ownership of roughly 550–750 LOC; macOS output changes and Git porcelain behavior require a small fixture suite |
| Telemetry and state | Telemetry defaults on; SQLite gain ledger writes local state | Neither exists |
| Upgrade path | Upgrade upstream and repeat the entire audit | Keep rtk installed as a comparison oracle; periodically differential-test a candidate release, then explicitly widen or replace behavior |
| Startup | Measured rewrite p95 5.950 ms; wrapped `wc` p95 5.257 ms in the isolated run | Must pass rewrite p95 <10 ms and keep wrapper overhead in the same range before hook cutover |

**Verdict: build it, but only as the closed six-verb Zig replacement described here.** Do not create a general “better rtk.” Proceed only if the implementation is held to four gates: (1) the preserved corpus is byte/meaning equivalent for all six accepted shapes, (2) every rejected shape exits with no rewrite, (3) p95 rewrite latency is below 10 ms, and (4) the binary has no telemetry, persistence, config, or network path. If the work crosses 12 hours or needs a general shell parser, stop and instead restore/rebaseline the pinned rtk installation; that would mean the scope boundary failed.

## Acceptance test outline

1. Golden fixtures for each raw/compact pair captured in `scratchpad/w5/`.
2. Differential tests against isolated rtk 0.34.3 for all accepted forms.
3. Rejection table for pipes, `&&`, `;`, substitutions, backticks, heredocs, absolute tool paths, Git porcelain/format flags, unsupported verbs, and malformed argument sequences.
4. Native failure tests: missing path, non-repository Git directory, invalid flag, and nonzero exit must preserve diagnostic and status.
5. UTF-8-safe width tests for `ps`/`df` and filenames with spaces/symlinks for `ls`.
6. Warm 100-run latency gate: `rewrite` p95 <10 ms on this machine.
