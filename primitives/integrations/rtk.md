# Integration Profile: RTK

<!-- 5W+F Profile — RTK (Rewrite Tool Kit)
     Schema version: 1
     Last updated: 2026-03-09
-->

---

## WHO

| Field | Value |
|-------|-------|
| Maintainer | rtk-ai (org) |
| Repo | https://github.com/rtk-ai/rtk |
| License | unknown — verify before any redistribution |
| Update channel | `brew upgrade rtk-ai/tap/rtk` |
| Support / issues | https://github.com/rtk-ai/rtk/issues |

---

## WHAT

**One-line purpose:**
Intercepts Claude Code's `Bash` tool calls and rewrites them to use `rtk`-prefixed equivalents that return compressed/token-efficient output, reducing context window consumption on noisy commands like `git log`, `git diff`, etc.

**What it does in detail:**

- Registers as a `PreToolUse` hook on the `Bash` tool in Claude Code
- On every bash invocation, reads the pending command from stdin as JSON (`tool_input.command`)
- Calls `rtk rewrite "$CMD"` — a Rust binary (`src/discover/registry.rs`) that determines whether a rewrite applies
- If a rewrite exists, returns a modified hook JSON payload that substitutes `git status` → `rtk git status`, etc.
- If no rewrite applies or the command is excluded, exits 0 with no output (passthrough)
- Ships its own SQLite-backed telemetry at `~/.local/share/rtk/history.db`

**What it touches in the stack:**

- Harnesses affected: Claude Code (primary); not yet integrated into OpenCode, Augment, Goose, Continue, Gemini CLI, Cagent, Droid/Factory
- Hook events used: `PreToolUse` (matcher: `Bash`)
- Files read/written: `~/.claude/hooks/rtk-rewrite.sh` (hook script), `~/.config/rtk/config.toml` (config), `~/.local/share/rtk/history.db` (telemetry SQLite)
- Ports / sockets: none
- Other tools it depends on: `jq` (required), `bash`, `rtk` binary itself
- Harness config modified: `~/.claude/settings.json` (hook registration in `PreToolUse`)

---

## WHERE

All files and paths installed or modified.

| Path | Type | Purpose | Owned by tool? |
|------|------|---------|----------------|
| `/opt/homebrew/bin/rtk` | binary | Main executable (Rust) | yes — managed by brew |
| `/opt/homebrew/Cellar/rtk/[version]/` | cellar dir | Homebrew-managed install | yes |
| `~/.claude/hooks/rtk-rewrite.sh` | hook script | PreToolUse hook — rewrites commands | PATCHED — overwritten on upgrade |
| `~/.config/rtk/config.toml` | config | Tool configuration (exclusions, telemetry flag) | yes — survives upgrade |
| `~/.claude/settings.json` | harness config | Hook registration entry | manual — survives upgrade |
| `~/.local/share/rtk/history.db` | data | RTK's own SQLite telemetry | yes — survives upgrade |

**Homebrew tap:** `rtk-ai/tap`
**Homebrew prefix:** `/opt/homebrew/bin/rtk`

### CRITICAL: Wrong package warning

`brew install rtk` installs `rotki` (a cryptocurrency portfolio tracker) — completely wrong package.
The correct command is always: `brew install rtk-ai/tap/rtk`

---

## WHEN

| Field | Value |
|-------|-------|
| Install date | 2026-03-09 |
| Version at install | 0.27.2 |
| Last verified working | 2026-03-09 |
| Current version | 0.27.2 |
| Update cadence | on-demand / track releases |
| How to check current version | `rtk --version` |

---

## WHY

**Why RTK was chosen:**
Claude Code's `git log`, `git diff`, and similar commands produce verbose output that consumes disproportionate context window. RTK intercepts these at the hook layer and substitutes token-efficient variants. At multi-harness scale with 8 simultaneous harnesses and frequent git operations, context overhead compounds. RTK addresses this at the source rather than relying on post-hoc summarization.

**Alternatives considered:**

- Manual prompt instructions to be concise with git output — unreliable, doesn't survive context resets
- Post-processing hooks on `PostToolUse` to truncate output — treats the symptom, not the cause; still burns context reading the full output
- Custom bash aliases — doesn't integrate with the hook system; agents use direct command strings

**Decision notes:**
RTK was installed with deliberate isolation from its own init process (`--hook-only`, `--no-patch`, manual settings.json entry) to maintain full control over what it touches in the stack. The default `rtk init` flow would have modified `CLAUDE.md` (unwanted) and created `RTK.md` (unwanted). The manual approach was more work but leaves no surprises.

**Customizations made for this stack:**

1. **`--hook-only` flag at init** — skipped global `CLAUDE.md` modification and `RTK.md` creation — these files are managed by agent-core, not individual tools

2. **`--no-patch` flag + manual settings.json entry** — used `--no-patch` to get the hook command, then manually inserted it into `~/.claude/settings.json` under `PreToolUse` — gives full visibility into what was added and keeps settings.json under agent-core's ownership

3. **`RTK_TELEMETRY_DISABLED=1` env var in hook invocation** — set in `settings.json` hook command (`RTK_TELEMETRY_DISABLED=1 bash /Users/jcbbge/.claude/hooks/rtk-rewrite.sh`) — prevents RTK from writing to its own SQLite db; future intent is SurrealDB integration instead

4. **`[telemetry] disabled = true` in config.toml** — belt-and-suspenders telemetry disable alongside the env var

5. **Exclusion patch in `rtk-rewrite.sh` (lines 38–45)** — added a `FIRST_TOKEN` check before the `rtk rewrite` call to exit early for: `curl` (raw HTTP responses for API/health checks), `playwright` (test output needs full context), `rg` (code intelligence queries for kotadb and agent searches need exact line context), `grep` (same reason as rg). These commands produce output whose precision matters more than brevity for this stack's use cases.

   Note: exclusions were also added to `~/.config/rtk/config.toml` but confirmed to have no effect — config-based exclusions do not work. The only working exclusion mechanism is the patch in the hook script itself.

---

## FUTURE-PROOFING (+F)

### Update Procedure

```bash
# Step 1: capture current state
rtk --version

# Step 2: run regression assertions (baseline — must all pass before upgrading)
# see Regression Assertions section below

# Step 3: upgrade
brew upgrade rtk-ai/tap/rtk

# Step 4: CRITICAL — re-apply hook patch
# brew upgrade will overwrite ~/.claude/hooks/rtk-rewrite.sh from the upstream template,
# ERASING the exclusion logic at lines 38-45.
# Re-apply the patch manually or run: bash ~/Documents/_agents/primitives/tools/rtk-patch.sh
# (see Local Patches section below)

# Step 5: verify — run all regression assertions again
# All must pass. If any fail, do not proceed until fixed.
```

### Breaking Change Detection

Signs that a maintainer update has broken something in this stack:

- [ ] Hook script is overwritten and exclusions no longer apply (curl/rg/grep get rewritten — wrong)
- [ ] `rtk rewrite` command signature changes (hook produces malformed JSON or no output for git commands)
- [ ] Hook JSON output format changes (`hookSpecificOutput.updatedInput.command` path moves)
- [ ] RTK binary moves or is renamed (hook's `command -v rtk` check fails silently, all rewrites stop)
- [ ] Integrity check blocks ALL bash execution — RTK intercepts every bash call; if it locks up, the entire harness is blocked
- [ ] Regression assertions fail

**Post-upgrade risk — Hook script overwrite:**
`brew upgrade rtk-ai/tap/rtk` will reinstall `~/.claude/hooks/rtk-rewrite.sh` from the upstream template, overwriting the exclusion patch at lines 38–45. RTK itself does NOT have a hash-based integrity check that blocks execution — this was a false alarm. The hook runs cleanly with the patch applied. The only risk is losing the patch on upgrade, not a runtime failure.

### Regression Assertions

Run these after every upgrade. All must pass.

```bash
# Assert 1: curl is excluded (exit with no output)
echo '{"tool_input":{"command":"curl http://localhost"}}' \
  | bash ~/.claude/hooks/rtk-rewrite.sh
# expected: no output (empty), exit 0

# Assert 2: rg is excluded (exit with no output)
echo '{"tool_input":{"command":"rg foo src/"}}' \
  | bash ~/.claude/hooks/rtk-rewrite.sh
# expected: no output (empty), exit 0

# Assert 3: grep is excluded (exit with no output)
echo '{"tool_input":{"command":"grep -r pattern ."}}' \
  | bash ~/.claude/hooks/rtk-rewrite.sh
# expected: no output (empty), exit 0

# Assert 4: git status IS rewritten
echo '{"tool_input":{"command":"git status"}}' \
  | bash ~/.claude/hooks/rtk-rewrite.sh \
  | jq -r '.hookSpecificOutput.updatedInput.command'
# expected: rtk git status

# Assert 5: git diff with args IS rewritten
echo '{"tool_input":{"command":"git diff HEAD~1"}}' \
  | bash ~/.claude/hooks/rtk-rewrite.sh \
  | jq -r '.hookSpecificOutput.updatedInput.command'
# expected: rtk git diff HEAD~1

# Assert 6: empty command passes through silently
echo '{"tool_input":{}}' \
  | bash ~/.claude/hooks/rtk-rewrite.sh
# expected: no output, exit 0
```

**One-liner to run all assertions:**

```bash
bash ~/Documents/_agents/primitives/tools/rtk-verify.sh
```

(Script to be created — see Open Questions.)

### Local Patches That Survive Upgrades

| File | Lines | What to re-apply | Why |
|------|-------|------------------|-----|
| `~/.claude/hooks/rtk-rewrite.sh` | 38–45 | Exclusion block (FIRST_TOKEN check for curl, playwright, rg, grep) | Upstream template does not include exclusions; exclusions via config.toml are confirmed non-functional |

**The patch to re-apply after every upgrade:**

```bash
# Insert after line 37 (after the "if [ -z "$CMD" ]; then exit 0; fi" block)
# and before the "# Delegate all rewrite logic" comment:

# Exclusions — commands that need full raw output (no RTK compression).
# curl: raw HTTP responses for API/health checks
# playwright: test output needs full context
# rg/grep: code intelligence queries need exact line context (kotadb, agent searches)
FIRST_TOKEN=$(echo "$CMD" | awk '{print $1}')
if [[ "$FIRST_TOKEN" == "curl" || "$FIRST_TOKEN" == "playwright" || "$FIRST_TOKEN" == "rg" || "$FIRST_TOKEN" == "grep" ]]; then
  exit 0
fi
```

### Telemetry / Observability Integration

**Default telemetry:** RTK records every rewrite to `~/.local/share/rtk/history.db` (SQLite). Schema unknown — needs inspection with `sqlite3 ~/.local/share/rtk/history.db .schema`.

**Stack integration status:**
- [x] Default telemetry disabled (`RTK_TELEMETRY_DISABLED=1` in hook invocation + `config.toml`)
- [ ] Mirrored to SurrealDB (NS: anima, DB: memory — or new namespace, TBD)
- [ ] SurrealDB schema defined
- [ ] Integration script written

**Future SurrealDB integration intent:**
Capture each RTK rewrite event as a structured record in SurrealDB. This gives observability into which commands are being rewritten most frequently, allowing tuning of exclusions and understanding of context savings over time. Would integrate with the existing `omni` observability library.

Proposed event shape (draft, not implemented):

```surql
DEFINE TABLE rtk_event SCHEMAFULL;
DEFINE FIELD ts          ON TABLE rtk_event TYPE datetime;
DEFINE FIELD original    ON TABLE rtk_event TYPE string;
DEFINE FIELD rewritten   ON TABLE rtk_event TYPE string;
DEFINE FIELD harness     ON TABLE rtk_event TYPE string;
DEFINE FIELD session_id  ON TABLE rtk_event TYPE string;
```

---

## OPEN QUESTIONS

- [ ] **Exclusion mechanism** — Config-based exclusions (`~/.config/rtk/config.toml [hooks] exclude_commands`) confirmed non-functional. Worth filing an upstream issue to get an official non-patch solution so exclusions survive upgrades without a manual hook patch.
- [ ] **Where should profiles live?** — Current proposal: `primitives/tools/[name].md` in agent-core, deployed to `~/.claude/tools/`. Is "tools" a new primitive type in the taxonomy, or does it belong under an existing primitive?
- [ ] **SurrealDB telemetry** — Replace RTK's SQLite entirely, or mirror to SurrealDB while keeping SQLite as backup? Which SurrealDB namespace/database should tool telemetry live in?
- [ ] **Should `rtk-verify.sh` be a script?** — The regression assertions above could be packaged as `primitives/tools/rtk-verify.sh` (or a generic `primitives/tools/verify-all.sh` that runs every tool's assertions). Worth doing once the profile system is established.
- [ ] **Multi-harness rollout** — RTK is only hooked into Claude Code. Should it be deployed to OpenCode, Augment, Goose, Continue, Gemini CLI? Each has a different hook system; the PreToolUse hook format is Claude Code-specific.
- [ ] **`rtk-patch.sh`** — Should a re-patch script be created and stored at `primitives/tools/rtk-patch.sh` to automate post-upgrade patch re-application?

---

## ADDITIONAL ALPHA FROM INSTALLATION

Things learned during RTK installation that are not obvious from the docs:

1. **`brew install rtk` installs the wrong package.** The package `rtk` in the default Homebrew registry is `rotki`, a cryptocurrency portfolio app. The correct package requires the tap: `brew install rtk-ai/tap/rtk`. This will silently succeed with the wrong tool if you don't notice.

2. **Config-based exclusions don't work.** The `[hooks] exclude_commands` field in `~/.config/rtk/config.toml` has no effect on the hook behavior. The only working exclusion mechanism is patching the hook script directly. This is either a bug or the feature isn't implemented yet.

3. **RTK has a hash-based integrity check on its own hook script.** When the script is modified, RTK refuses to execute and prints an error on every bash call. This is a significant friction point for any stack that needs to customize the hook. The current state is that RTK is installed but non-functional due to this check.

4. **The hook is a thin delegating shell script; all rewrite logic is in Rust.** The comment at line 8 of the hook script confirms: "To add or change rewrite rules, edit the Rust registry — not this file." This means exclusion logic belongs in the binary, not the hook, which is why config-based exclusions would be the right design if they worked.

5. **RTK requires `>= 0.23.0` for the `rewrite` subcommand.** The hook contains a version guard (lines 20-29). If you install an older version, it fails silently (exits 0 without rewriting). This is a good failure mode but means you won't know RTK isn't working without explicit verification.

6. **The `PreToolUse` hook fires on every bash call, including internal agent bash calls.** This is why the exclusion logic is critical — without it, commands like `rg` inside kotadb searches get rewritten, corrupting code intelligence results.

7. **`RTK_TELEMETRY_DISABLED=1` must be set in the settings.json hook invocation, not just config.toml.** The env var in the hook invocation is the reliable mechanism; the config flag may not be read by the hook subprocess in all cases. Belt-and-suspenders is correct here.

---

## CHANGE LOG

| Date | Version | Change | Who |
|------|---------|--------|-----|
| 2026-03-09 | unknown | Initial install via `brew install rtk-ai/tap/rtk`; manual hook setup; exclusion patch applied; telemetry disabled | Josh |
| 2026-03-09 | — | Profile created; integrity check issue identified | agent instance |
