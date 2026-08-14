# slim — build spec (the six-verb Zig replacement for rtk)

**Tool name:** `slim`
**Source dir:** `~/agent-core/primitives/tools/slim/`
**Binary install:** `~/.local/bin/slim` (on PATH; same dir where `rtk` currently lives)
**Language / toolchain:** Zig **0.16.0** (verified this session with `zig version`; the repo's `AGENTS.md` still says 0.15.2 — that is stale, pin to the installed 0.16.0). Zig **stdlib only, zero third-party dependencies.**
**Target:** macOS arm64 only.
**Status:** spec — a builder implements from this without design decisions.

Name rationale: one syllable, lowercase, says exactly what it does (slims command output), no collision on this machine's PATH (checked: `slim`/`trim`/`lean`/… all free), does not contain "rtk". Simple over clever.

---

## 0. The one law (truth over compactness)

Operator's verbatim intent: **there is no fallback — this tool must work, period.** That resolves to four structural guarantees. Every one is an *invariant the code makes impossible to violate*, not a runtime check bolted on:

1. **Raw passthrough on any parse failure.** A filter is a pure function `(argv, raw_stdout) -> compact_stdout`. If it cannot parse its input for *any* reason, it returns the raw stdout **unchanged**. There is no code path that prints a banner, an error string, or an empty result in place of output.
2. **Exit codes are always the child's.** The wrapper's exit status is *always* the spawned native command's exit status. There is no "exit 0 on error." Filtering only ever runs when the child exited 0; on any nonzero exit the raw stdout is streamed through unfiltered.
3. **stderr is never touched.** The child's stderr is inherited directly (not captured, not filtered, not reordered). This also removes any pipe-buffer deadlock risk.
4. **Every omission is visibly marked.** `... (N lines truncated)` (ps/df), `[+N lines omitted]` (git log), `... +N more` (git status). No silent drop.

The rtk bug catalog is the anti-spec and is made structurally impossible: there is **no** `diff`, `find`, `grep`, `cat`/`read`, `head`, `tail` verb at all, so false-identical diff (#3469), silent-0-result find (#1849), multi-file cat corruption (#2861), `grep -c` corruption, and short `head -N` reads (#2487) cannot occur — the closed six-verb table cannot route to them. There is no integrity/trust subsystem, so "integrity banner with exit 0" cannot occur. See §7 for the test that pins each.

---

## 1. CLI grammar

```
slim rewrite "<command>"      # rewrite mapper (string→string, no process spawn)
slim ls   [args...]           # wrap /bin/ls
slim ps   [args...]           # wrap /bin/ps
slim wc   [args...]           # wrap /usr/bin/wc
slim df   [args...]           # wrap /bin/df
slim git status [args...]     # wrap /usr/bin/git status --porcelain -b
slim git log    [args...]     # wrap /usr/bin/git log (injected format)
slim --version                # prints "slim 1.0.0"  (see §4 note: satisfies the hook version gate)
slim --help                   # one-screen usage, exit 0
```

- Unknown subcommand → exit 2, message to **stderr**, no stdout.
- `git` with any subcommand other than `status`/`log` (after an optional `-C <path>`) → exit 2 (not our surface). The rewrite mapper never produces these, but the verb dispatcher must still refuse them safely.
- Exit code map: `0` success (see §4 for `rewrite`), child's code for wrappers, `1` = rewrite-no-match, `2` = usage error.

### Flag passthrough semantics
The wrapper verbs pass **all** received args straight to the native command (with the fixed absolute binary path). The filter reads the *args* only to decide render mode (e.g. `ls` with vs. without `-l`; `wc` count flags; `git log` explicit `-N`). Args are never rewritten or dropped before the child sees them, except the two deliberate injections below:
- `git status`: `--porcelain -b` is **added** (and a user `--porcelain`/`--short`/`-s`/`-b` is already blocked upstream by the rewrite mapper and the hook; if one somehow reaches the verb, see §3.5 edge rule).
- `git log`: `--pretty=format:<fixed>` + `--no-merges` are **added**; default `-n 10` unless the user passed an explicit count.

---

## 2. The runner (process execution + truth contract)

One module owns all process execution. Every filter is pure and never spawns.

```
run(verb, argv, native_path) -> exit_code:
  child = spawn(native_path, argv)         # std.process.Child
      child.stdout = Pipe
      child.stderr = Inherit                # untouched passthrough, no deadlock
      child.stdin  = Inherit                # wc/… stdin works natively
  raw = read_all(child.stdout, cap = 16 MiB)  # read to EOF while child runs
  code = child.wait()
  if read hit the 16 MiB cap:  write(raw); return code       # size guard → raw passthrough
  if code != 0:                write(raw); return code       # nonzero → raw passthrough
  compact = filter(verb, argv, raw) catch raw                # parse fail → raw
  write(compact)
  return code
```

Rules the runner guarantees:
- **stdout** is the only stream captured/filtered. **stderr** and **stdin** are inherited.
- `filter()` returns an error union; the `catch raw` makes raw passthrough the default for *every* failure mode (bad columns, invalid UTF-8 in a structural position, allocation failure, unexpected EOF).
- Native binary paths are fixed absolute constants: `/bin/ls`, `/bin/ps`, `/usr/bin/wc`, `/bin/df`, `/usr/bin/git`. (macOS-only; no PATH search, no discovery.)
- The child's stdout is read fully into a growable buffer with a hard 16 MiB cap; exceeding the cap aborts filtering and streams raw (protects against pathological output; still correct, just uncompacted).

---

## 3. Per-verb filter algorithms (exact)

All caps below are named constants in `filters/common.zig` or the verb module so the builder can tune a single value if a golden/differential test disagrees. Where a value is marked **[CONFIRM-VS-ORACLE]** it must be locked by a differential run against installed `rtk 0.34.3` during the build (rtk stays installed as the oracle until cutover — see §9).

### 3.1 `ls` (fixture: `ls.raw.txt` → `ls.rtk.txt`, 9,462 B → 2,053 B, 78.3%)

Input: output of native `ls -la` (long list). Algorithm:
1. Drop the `total N` line, and any entry whose name is exactly `.` or `..`.
2. Parse each remaining line as long-list columns: `perms links owner group size month day time name…`. The **name is column 9 onward joined** (preserves spaces). Detect type from `perms[0]`: `d` = directory, `l` = symlink, else file.
3. Emit **directories first, in original ls order**, each as `name/`.
4. Then emit **non-directories in original ls order**:
   - regular file: `name<TWO SPACES>HSIZE`
   - symlink: the name column already contains `link -> target`; emit `link -> target<TWO SPACES>HSIZE` (HSIZE = the symlink's own size, i.e. the `size` column).
5. `HSIZE` = humanize(size_bytes), base **1024**, suffixes `B K M G`:
   - `< 1024` → `{n}B`  (e.g. `7` → `7B`, `480` → `480B`)
   - `< 1024²` → `{n/1024, 1 decimal, round-half-up}K`  (`116820` → `114.1K`, `110448` → `107.9K`)
   - `< 1024³` → `…M` ; else `…G`
   - Verify base/rounding against the golden: `471142` → `460.1K`, `49268` → `48.1K`.

Edge cases (all must raw-passthrough, never crash):
- **`ls` without `-l`** (no long columns): output is bare names, one per line/column — not parseable as long-list. Detect "not long-list" (first non-empty data line has < 9 whitespace fields and no `total`) → **return raw unchanged**. (Deliberate: without `-l` there is nothing to compact and reformatting risks loss.)
- A line that does not split into ≥ 9 fields → the whole filter returns raw (structural mismatch = don't guess).
- Names with spaces / trailing `/` from `-F` / weird chars: preserved because name = join(cols[8..]).

**Deliberate cut vs rtk:** rtk removes "known noise directories" (node_modules, .git, …) when `-a` is absent. `slim` does **not** — hiding real directory entries violates the truth law. Recorded in §10 cut-list. (With `-a`, rtk keeps them too, so the golden fixture — captured with `-la` — is unaffected.)

### 3.2 `ps` (fixture: `ps.raw.txt` → `ps.rtk.txt`, 159,608 B → 3,222 B, 98.0%)

Generic width+row filter, parameters `WIDTH=120`, `ROWS=30`:
1. Strip ANSI escape sequences from each line (defensive; ps rarely emits them).
2. Keep the **first `ROWS` lines** of output *as-is order* (this includes the header row; no sorting, no column parsing — faithful to rtk's generic filter).
3. For each kept line, if its **display width** (UTF-8 codepoint-aware, not byte count) exceeds `WIDTH`, truncate to the first `WIDTH−3` columns and append `...` (total width `WIDTH`). Never split a multibyte codepoint.
4. If the input had more than `ROWS` lines, append a final line: `... (N lines truncated)` where `N = total_lines − ROWS`. **[CONFIRM-VS-ORACLE]** the exact `N` and whether the header counts toward `ROWS` — the fixture shows 31 emitted lines ending in `... (825 lines truncated)`; lock `ROWS`, the off-by-one, and the truncation-suffix rule against `ps.rtk.txt` byte-for-byte.

Golden test is a **pure function on `ps.raw.txt`** (do not re-run `ps` — process lists are time-dependent; the captured raw→compact pair is the deterministic oracle).

### 3.3 `df` (fixture: `df.raw.txt` → `df.rtk.txt`, 1,089 B → 961 B, 11.8%)

Identical filter to `ps` with `WIDTH=80`, `ROWS=20`. Golden = pure function on `df.raw.txt` == `df.rtk.txt`. (Same `common.zig` code path, different constants — see §6 `filters/psdf.zig`.)

### 3.4 `wc` (fixture: `wc.raw.txt` `"     110 /…/PRODUCT.md"` → `wc.rtk.txt` `"110"`)

Formatting-only (no truncation cap). Mode is derived from the **argv flags**, not the output:
- Determine requested counts from flags: `-l` lines, `-w` words, `-c` bytes, `-m` chars. Combined flags allowed. **No flag ⇒ full mode** (`-l -w -c`, the native default).
- Native `wc` prints counts right-aligned then the path. Parse each output line into `[counts…] [path?]`.
- **Single file (or stdin), single requested count** → emit just that number: `110`.
- **Single file, full mode** (or multiple counts) → emit the counts space-joined, no path, no padding: `NL NW NB` (order lines, words, bytes/chars as wc prints them).
- **Multiple files** → strip the common directory prefix from each path; emit `count(s) shortname` per file; final `total` line labelled `Σ count(s)`.
- **stdin** (no file operand): `slim wc` reads stdin natively (child stdin inherited); render single/full mode with no path. **Decision:** support stdin (faithful to native `wc`); do not refuse it. (In hook context stdin only arrives via a pipe, which the rewrite mapper refuses anyway — §3.6.)

Parse failure (non-numeric leading token) → raw passthrough.

### 3.5 `git status` (fixture: human `git-status.raw.txt` → `git-status.rtk.txt`)

The filter's **actual input is `git status --porcelain -b`**, NOT human status. (So the raw human fixture is a *shape reference only*; the golden test uses porcelain input — see §7.) Native invocation: `/usr/bin/git [-C <path>] status --porcelain -b`.

Render:
1. **Branch line** from the `## ` header: `* <rest-of-header>` → `* main...origin/main [behind 3]`. Strip the leading `## `, prefix `* `. If no upstream, porcelain emits `## main` → `* main`. Ahead/behind come from porcelain verbatim (`[ahead 1]`, `[behind 3]`, `[ahead 1, behind 2]`).
2. Classify each subsequent porcelain line by its two status chars `XY` (X=index/staged, Y=worktree):
   - **Untracked**: `??`
   - **Conflict**: `X`==`U` or `Y`==`U`, or any of `DD AA` (both sides). Count as conflicts.
   - **Staged**: `X` ∈ {`M`,`A`,`D`,`R`,`C`} and not a conflict.
   - **Modified**: `Y` ∈ {`M`,`D`} and not a conflict. (A line can be both staged and modified, e.g. `MM` — count in both, faithful to git.)
3. Emit categories **in this order**, only if count > 0, each with header then up to `MAX_PATHS` paths indented **3 spaces**:
   - `+ Staged: N files`
   - `~ Modified: N files`
   - `? Untracked: N files`
   - `! Conflicts: N files`
   - path lines: the porcelain path (col 3 onward; for renames `orig -> new`, keep as given).
   - if `N > MAX_PATHS`, after the shown paths emit `   ... +M more` (M = N − MAX_PATHS).
4. **Clean repo** (no entries): emit the branch line only, then a clean marker. **[CONFIRM-VS-ORACLE]** the exact marker string and `MAX_PATHS` value — the fixture shows 3 untracked paths all listed (≤ cap) and no other category, so the cap and clean string are not observable from it. Set `MAX_PATHS = 10` provisionally and lock both against `rtk git status` in a scratch repo (§7).

Header/path indentation from fixture: header at col 0, paths at 3 spaces (`   .pi/`).

Edge: if a user status flag survives to the verb (mapper/hook should have blocked machine-format flags), and it is a `--porcelain`/`-s`/`--short` form, run it through the raw runner (do not double-inject `--porcelain`) → parse; if parse mismatches → raw passthrough. Simplest safe rule: if argv already contains a `--porcelain`/`-s`/`--short`, **do not add flags**, spawn as-is, and raw-passthrough the result (don't try to re-render an unknown shape).

### 3.6 `git log` (fixture: `git-log.raw.txt` `git log -5` → `git-log.rtk.txt`)

Actual input is a **format-injected** log. Native invocation:
`/usr/bin/git [-C <path>] log --no-merges --pretty=format:'%h %s (%ar) <%an>%n%b%n---END---' <count> <safe user args>`

Args handling:
- **Explicit count** (`-N`, `-n N`, `--max-count=N`): respect it; set per-body-line width cap `BODY_WIDTH = 120`.
- **No explicit count**: inject `-n 10`; `BODY_WIDTH = 80`.
- Reject/never-inject machine formats: if user passed `--format`/`--pretty`/`--oneline`/`-p`/`--patch` → the rewrite mapper already refuses these; if one reaches the verb, spawn raw (no injection) and raw-passthrough. Safe revision/path args (a ref, a `--`, a pathspec) pass through untouched.

Render, splitting the stream on lines equal to `---END---`:
- Each block: first line is the header `%h %s (%ar) <%an>` — emit **verbatim, never truncated** (fixture line 1 is full-length).
- Body = remaining lines of the block. Filter body lines: drop empty lines, drop lines starting with `Signed-off-by:` or `Co-authored-by:` (case-insensitive on the prefix). Keep the **first 3** surviving body lines; each indented **2 spaces** and truncated to `BODY_WIDTH` (codepoint-aware, `...` suffix as in §3.2).
- If more than 3 body lines survived filtering, append `  [+M lines omitted]` (2-space indent) where `M = surviving_body_lines − 3`. (Fixture: first commit `  [+6 lines omitted]` ⇒ 9 surviving body lines.)
- **No blank separator line between commits** (fixture packs them back-to-back).

Golden strategy: parser is unit-tested on inline format-injected strings with hand-written expected output (deterministic, no repo needed); plus one differential run against `rtk git log -5` in a scratch repo to confirm the whole pipeline (§7).

---

## 3.7 The `rewrite` mapper (closed data table)

`slim rewrite "<command>"` prints the rewritten command on stdout + exit **0** on a match; prints **nothing** + exit **1** on no match. This is the exact contract `~/.claude/hooks/rtk-guard.sh` and `~/agent-core/primitives/hooks/rtk-rewrite.ts` consume (verified this session). It **collapses rtk's broad registry + the hook allowlist into one closed table**: it only ever emits rewrites the guard would accept, so cutover is a binary-name change in the guard, nothing else.

Algorithm:
1. Trim. Empty → exit 1.
2. **Refuse outright** (exit 1, no stdout) if the command contains any shell metacharacter that implies compounding, piping, substitution, or redirection: `|  &  ;  $(  )  \`(backtick)  <  >  {  }` or a heredoc `<<` or arithmetic `$((`. This is stricter than rtk (which rewrites pipelines' first stage and compounds) and is **intentional defense-in-depth** — the hook guard rejects `| & ; $( \`` too, so a rewrite there would be discarded anyway; refusing means the raw command simply runs (no loss).
3. If `SLIM_DISABLED=1` in env → exit 1 (no rewrite). (Analogue of `RTK_DISABLED`.)
4. Strip, in order, leading tokens for classification and remember them to re-prepend: recognized `sudo`, `env`, and any `NAME=VALUE` assignments (`^[A-Za-z_][A-Za-z0-9_]*=`). Everything after is the "core."
5. Match the core's leading word(s) against the **closed table** (first-word literal match, absolute paths like `/bin/ls` do **not** match):

   | Core leading form | Emit |
   |---|---|
   | `ls` `[args]` | `slim ls [args]` |
   | `ps` `[args]` | `slim ps [args]` |
   | `wc` `[args]` | `slim wc [args]` |
   | `df` `[args]` | `slim df [args]` |
   | `git status` `[args]` | `slim git status [args]` |
   | `git log` `[args]` | `slim git log [args]` |
   | `git -C <path> status` `[args]` | `slim git -C <path> status [args]` |
   | `git -C <path> log` `[args]` | `slim git -C <path> log [args]` |
   | anything else | (exit 1) |

6. For `git status`/`git log`, additionally refuse (exit 1) if the args contain a machine-format flag: `--porcelain`, `-s`, `--short`, `--format`, `--pretty`, `--oneline`, `-p`, `--patch`. (Hook also blocks `--porcelain/--format/--pretty`; this is defense-in-depth so the emitted rewrite is always allowlist-clean.)
7. Re-prepend the stripped `sudo`/`env`/`NAME=VALUE` tokens before `slim`. Emit + exit 0.

**slim rewrite expectation table** (this is the clone's golden, and it *intentionally differs from rtk* for out-of-scope verbs — see fixtures `rewrite-corpus.txt`/`rewrite-boundaries.txt` for the rtk behavior being replaced):

| Input | slim result |
|---|---|
| `ls` | `[0] slim ls` |
| `ls -la` | `[0] slim ls -la` |
| `ls -la /tmp` | `[0] slim ls -la /tmp` |
| `ps aux` | `[0] slim ps aux` |
| `wc -l file` | `[0] slim wc -l file` |
| `wc` | `[0] slim wc` |
| `df -h` | `[0] slim df -h` |
| `git status` | `[0] slim git status` |
| `git -C /tmp status` | `[0] slim git -C /tmp status` |
| `git log -5` | `[0] slim git log -5` |
| `sudo ls -la` | `[0] sudo slim ls -la` |
| `FOO=1 wc -l file` | `[0] FOO=1 slim wc -l file` |
| `git status --porcelain` | `[1] <no rewrite>` (was `rtk git status --porcelain`) |
| `git log --format=%H -1` | `[1] <no rewrite>` |
| `ls \| wc -l` | `[1] <no rewrite>` (rtk emitted `rtk ls \| wc -l`; we refuse) |
| `ps aux && df -h` | `[1] <no rewrite>` (rtk rewrote both; we refuse) |
| `/bin/ls -la /tmp` | `[1] <no rewrite>` |
| `cat f.txt` / `find .` / `grep x` / `diff a b` / `du -sh *` / `head -20 f` / `tail -50 f` / `tree` / `curl …` / `docker ps` / `kubectl …` / `npx …` | `[1] <no rewrite>` (all were rtk rewrites; **out of scope by design**) |
| `RTK_DISABLED=1 ls` | `[0] RTK_DISABLED=1 slim ls` (harmless env prefix; use `SLIM_DISABLED=1` to disable) |
| `sed …` / `echo …` / `unknown-command` / heredoc | `[1] <no rewrite>` |

---

## 4. Version-gate note (why `--version` exists)

`rtk-guard.sh` (read this session) runs `rtk --version`, greps `[0-9]+\.[0-9]+\.[0-9]+`, and rejects `< 0.23.0`. `rtk-rewrite.ts` runs `--version` and checks exit 0. For the swap to be **binary-name-only**, `slim --version` must print a semver ≥ 0.23.0 and exit 0. Spec: `slim --version` → `slim 1.0.0` (MAJOR=1 clears the `MAJOR==0 && MINOR<23` gate). No other guard change is needed beyond replacing the binary name `rtk`→`slim` (and the warning-string paths, cosmetic).

---

## 5. Zero-dependency + startup budget

- **Zig stdlib only.** No regex engine (the six rules are literal token scans), no config parser, no SQLite, no network, no telemetry, no persistence. Process spawn via `std.process.Child`; args via `std.process.argsAlloc`; allocation via a single arena (`std.heap.ArenaAllocator` over the page allocator) freed at process exit.
- **Startup < 10 ms p95 cold** (it runs per Bash call). Met because: single static binary, no file I/O at startup, no dynamic init, `rewrite` does **zero** process spawns (pure string scan, sub-millisecond). Wrapper verbs pay exactly one `execve` for the native command (unavoidable) plus a linear pass over its stdout.
- Build `-Doptimize=ReleaseFast` for the installed binary. `build.zig` exposes an `exe` and a `test` step (`zig build test`). Install step copies `zig-out/bin/slim` → the builder then symlinks/copies to `~/.local/bin/slim` (install is a documented manual step, not run by tests).

---

## 6. Module layout + LOC estimate

| Module | Responsibility | Est. LOC |
|---|---|---:|
| `main.zig` | argv parse, subcommand dispatch, `--version`/`--help`, stable exit codes | 55 |
| `rules.zig` | the six-rule rewrite table + blocked-metachar set + machine-format flag set (data only) | 50 |
| `rewrite.zig` | trim, metachar refusal, env/sudo/`NAME=VALUE` + `git -C` strip/restore, table match, render | 100 |
| `runner.zig` | spawn fixed native path, capture stdout (16 MiB cap), inherit stderr/stdin, exit-code + raw-passthrough contract | 95 |
| `filters/common.zig` | ANSI strip, codepoint-aware width-truncate w/ `...`, row cap + `... (N lines truncated)`, `humanize(bytes)` | 55 |
| `filters/ls.zig` | long-list parse, dir-first regroup, symlink render, humanized sizes, non-long-list detect→raw | 100 |
| `filters/psdf.zig` | parameterized `(WIDTH, ROWS)` width/row filter (ps=120×30, df=80×20) | 25 |
| `filters/wc.zig` | flag→mode detection, single/full/multi render, common-prefix strip, Σ total | 70 |
| `filters/git_status.zig` | porcelain `-b` parse, XY classification, bounded category render, clean marker | 90 |
| `filters/git_log.zig` | safe-arg classify, format injection args, `---END---` block split, body filter/cap/omission | 110 |
| **Total (impl)** | | **~750** |
| Tests (unit + golden + differential + latency) | see §7 | **350–500** |

Within the design study's 550–750 impl band (top of it, because the truth-contract edge handling is explicit). If the builder comes in lighter, good.

---

## 7. Test plan (inside `zig build test` + a shell smoke script)

### 7.1 Golden fixtures (pure-function; deterministic)
Fixtures live in `~/agent-core/briefs/rtk-clone/fixtures/` (copied this session). The tool should embed copies (or read paths) under `slim/test/fixtures/`.

| Test | Feeds | Asserts |
|---|---|---|
| `T-GOLD-LS` | `ls.raw.txt` → `ls` filter (argv `ls -la`) | byte-equal `ls.rtk.txt` |
| `T-GOLD-PS` | `ps.raw.txt` → `psdf(120,30)` | byte-equal `ps.rtk.txt` |
| `T-GOLD-DF` | `df.raw.txt` → `psdf(80,20)` | byte-equal `df.rtk.txt` |
| `T-GOLD-WC` | `wc.raw.txt` → `wc` filter (argv `wc -l PRODUCT.md`) | byte-equal `wc.rtk.txt` |

(ps/df goldens feed the **captured raw**, never re-run the live command.)

### 7.2 git parser unit tests (deterministic, no repo)
| Test | Input | Asserts |
|---|---|---|
| `T-GS-PARSE` | inline porcelain-`-b` strings (untracked-only; staged+modified `MM`; conflict `UU`; clean; `>MAX_PATHS` in one category; no-upstream `## main`) | rendered output matches hand-written expected incl. `... +M more` and the branch line |
| `T-GL-PARSE` | inline format-injected log (`%h %s (%ar) <%an>%n%b%n---END---`) with: 0 body lines; ≤3 body; >3 body (→`[+M lines omitted]`); a `Signed-off-by:`/`Co-authored-by:` line dropped; an over-width body line (→`...`) | matches hand-written expected |

### 7.3 Differential vs rtk 0.34.3 (locks the [CONFIRM-VS-ORACLE] values)
Runs only while rtk is still installed (build-time oracle). A scratch git repo is scripted with a known history + a known dirty tree.
| Test | Compares | Purpose |
|---|---|---|
| `T-DIFF-GS` | `slim git status` vs `rtk git status` in scratch repo | lock `MAX_PATHS`, clean marker, category headers |
| `T-DIFF-GL` | `slim git log -5` vs `rtk git log -5` in scratch repo | confirm whole log pipeline byte-equal |
| `T-DIFF-LS` | `slim ls -la <dir>` vs `rtk ls -la <dir>` (fixed dir) | confirm ls transform in vivo |

If rtk is unavailable, these skip with a printed SKIP (never fail the suite) — the goldens in §7.1 remain the hard gate.

### 7.4 Fidelity invariants (executable checks) — mapped to the anti-spec
| Test | Check | Anti-spec bug it catches |
|---|---|---|
| `T-EXIT-NONZERO` | `slim ls /no/such/path` exits with **native ls's** nonzero code; stderr present; stdout is raw | exit-0-on-error; integrity-banner-with-exit-0 |
| `T-TRUTH-RAWPASS` | feed a filter garbage (e.g. `ls` filter on non-long-list text; `wc` filter on non-numeric) → output **byte-equal to input** | banner/empty-instead-of-output; false-identical diff class (never fabricate a result) |
| `T-STDERR-UNTOUCHED` | child stderr bytes appear on stderr unmodified & unfiltered | silent swallow |
| `T-TRUNC-MARK-PS` | ps/df output over cap contains `... (N lines truncated)` with correct N | silent drop |
| `T-TRUNC-MARK-GL` | git log over-length body contains `[+M lines omitted]` | silent drop |
| `T-UTF8-WIDTH` | ps/df/ls lines with multibyte chars truncate on codepoint boundaries (no mojibake) | corruption |
| `T-REW-CONTRACT` | every row of the §3.7 expectation table: exit code + exact stdout (empty on no-match) | wrong rewrite / rewriting out-of-scope verbs (find/diff/cat/grep/head) |
| `T-NO-VERB` | there is no `diff`/`find`/`grep`/`cat`/`read`/`head`/`tail` subcommand: `slim diff a b` → exit 2, and `slim rewrite "diff a b"` → exit 1 | #3469 diff, #1849 find, #2861 cat, grep -c, #2487 head — all structurally absent |

**Anti-spec coverage matrix** (every rtk catalog bug → ≥1 test):
- false-identical diff (#3469) → `T-NO-VERB` + `T-REW-CONTRACT` (no diff surface).
- silent 0-result find (#1849) → `T-NO-VERB` + `T-REW-CONTRACT`.
- multi-file cat→read corruption (#2861) → `T-NO-VERB`.
- grep -c corruption → `T-NO-VERB`.
- head -N short read (#2487) → `T-NO-VERB`.
- integrity banner + exit 0 → `T-EXIT-NONZERO` + `T-TRUTH-RAWPASS` (no integrity subsystem; failures raw-pass with real code).
- exit-0-on-error → `T-EXIT-NONZERO`.
- silent truncation → `T-TRUNC-MARK-PS`, `T-TRUNC-MARK-GL`.

### 7.5 Hook-swap smoke (shell script outline, `slim/test/hook-swap-smoke.sh`)
Does **not** touch the real hook (file partition forbids it). It copies `~/.claude/hooks/rtk-guard.sh` to a scratch dir, `sed`-swaps the binary name `rtk`→`slim`, puts the built `slim` on a scratch PATH, and pipes the guard's own JSON payload shape through it:
```
echo '{"tool_input":{"command":"ls -la"}}'      | ./guard-slim.sh   # expect updatedInput.command == "slim ls -la", permissionDecision allow
echo '{"tool_input":{"command":"ls | wc -l"}}'  | ./guard-slim.sh   # expect exit 0, NO rewrite (passthrough)
echo '{"tool_input":{"command":"git log -5"}}'  | ./guard-slim.sh   # expect "slim git log -5"
echo '{"tool_input":{"command":"cat f.txt"}}'   | ./guard-slim.sh   # expect NO rewrite
echo '{"tool_input":{"command":"git status --porcelain"}}' | ./guard-slim.sh  # expect NO rewrite (blocked)
```
Pass = the allowlisted six rewrite and everything else passes through unchanged, exactly as with rtk.

### 7.6 Latency gate (`slim/test/latency.sh`)
Warm 100-run measurement on this machine: `slim rewrite "ls -la"` p95 **< 10 ms**; report median + p95. Also report wrapper overhead: `slim wc -l <file>` vs raw `wc` (should sit in rtk's measured range, ~+3 ms). Gate is `rewrite` p95 < 10 ms.

---

## 8. Definition of done (gates, all four must hold)
1. `zig build test` green: all §7.1 goldens byte-equal, §7.2 parser units pass, §7.4 invariants pass. (§7.3 differential pass or SKIP if rtk absent.)
2. Every rejected shape in the §3.7 table exits 1 with no stdout; every accepted shape emits the exact rewrite.
3. `rewrite` p95 latency < 10 ms (measured, §7.6).
4. Binary has no telemetry, persistence, config, or network path (code inspection).

---

## 9. Cutover relationship to rtk (context, not this builder's job)
- During build/test, **rtk 0.34.3 stays installed** as the differential oracle (`~/.local/bin/rtk`, verified this session).
- Operator's hard requirement is that after cutover **no rtk remains on the machine**. Cutover = (a) swap the binary name in `rtk-guard.sh` + `rtk-rewrite.ts` `rtk`→`slim`, (b) remove `~/.local/bin/rtk`. **Both are outside this builder's file partition** (the builder writes only `primitives/tools/slim/` + `briefs/rtk-clone/fixtures/`) and are a separate operator-run step after the four gates pass.

---

## 10. Effort, LOC, and cut-list

- **Impl LOC:** ~750 (Zig, per §6). **Tests:** 350–500. Total in the design study's band.
- **Effort:** 8–11 h — core impl + unit/golden 6–8 h; differential + invariants + UTF-8/exit + latency 2–3 h. Inside the study's 8–12 h envelope.
- **Cut-list (scope deliberately dropped to stay barebones + truthful):**
  1. **ls noise-directory removal** — rtk hides node_modules/.git-type dirs without `-a`; dropped (hiding real entries violates the truth law). *Saves ~15 LOC + a hardcoded list.*
  2. **Generic shell parsing / pipeline & compound rewriting** — rtk rewrites the first stage of a pipe and segments of `&&`/`;`. `slim rewrite` refuses these outright (§3.7 step 2). The hook already discards them; refusing is safe and cuts the largest complexity source. *This is the single biggest LOC saving vs cloning rtk.*
  3. **Everything in the design study's OUT list** — 60-verb registry, gain ledger, telemetry, config/TOML, trust/integrity hashes, deny/ask rules, cross-platform discovery, npx/test wrappers. None built.
  4. **`df`/`ps` column parsing** — kept as rtk's dumb width+row filter (no aggregation). Faithful and tiny.
- **Nothing proven was cut:** all six measured verbs are implemented; the savings from the design study (11.8%–98%) are preserved and pinned by goldens.
- If the build crosses 12 h or needs a general shell parser, **stop** — that means the closed-grammar boundary failed, and the correct move is to rebaseline rtk, not to grow slim (per the design study's one-day cut line).
