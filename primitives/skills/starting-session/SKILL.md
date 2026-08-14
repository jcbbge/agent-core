---
name: starting-session
description: Orient at the start of any session. Call before touching anything.
  Reads git state and surfaces risk zones. Handoff and Tower carry-over are
  hook-injected — do not re-extract them here.
argument-hint: <optional — project name or context>
allowed-tools: Bash Read
metadata:
  author: jrg
  version: "4.2"
  tags: session, orientation, git, workflow
  changelog: "4.2 — renamed session-start → starting-session (operator, gerund form). 4.1 — self-sufficient fallback: extract handoff/flight when the harness injects nothing (parity audit 2026-08-12). 4.0 — thin reconcile: drop handoff/WORK.md duplication; hooks inject carry-over"
---

# Session Start

**Call this before touching any file, writing any code, or making any tool call.**

## Already injected (do not duplicate)

SessionStart hook + Circadian already surface:

- Tower carry-over (unrelayed messages, open questions)
- Last `TODO:` handoff from `git log`
- Flight snapshot pointer when recent
- Memory substrate (constitution, NOW, session evidence)

If those lines are in context, **do not re-run handoff extraction or reprint them.**

**If they are NOT in context** (injection is harness-dependent — as of 2026-08-12
claude-code injects all four; pi injects Tower carry-over + memory only; cursor
injects none), extract the two that matter yourself, minimally:

```bash
git log --format='%h %s%n%b' -5 | grep -m1 '^TODO: '   # the handoff
ls -t ~/.tower/flight/*.md 2>/dev/null | head -1        # flight snapshot (<24h = read it)
```

Commit convention and work tracking live in `~/agent-core/primitives/AGENTS.md` — read on demand, not here.

---

## Standing directives (always active)

**Breathe-mode:** No fluff, no preamble. Output the orientation block. **Stop and wait only when the pool is empty** — no named thread, no work named in NOW/flight/handoff/TODO, no high-intent skip-ritual prompt. When work is already named, session start **is** authorization: present a ruled proposal or act; do not stall for scheduling permission.

**Skip-ritual:** If the user arrives with a specific, high-intent prompt — or NOW/flight/handoff/TODO already names the work — skip the steps below and use context already in scope. **Collect = named artifact exists** on disk; status is pull (herdr/board/field), not narration.

**Forbidden scheduling deferrals:** Never say "say the word", "which first", or ask "What are we expanding into?" when threads, NOW, flight, handoff, or the operator's first message already name the work.

**Environment surfacing:** On first tool call, check local binary paths and custom scripts (`~/bin`, `~/dotfiles`, `~/.local/bin`, project `scripts/`).

**Pre-execution guard:** Before any shell command, file write, or DB operation:

- Verify the target path exists and is what you expect
- If a command failed once, do not run it again unchanged — change strategy or ask
- Never declare a task complete without evidence the output actually exists

---

## Step 1 — Detect context

```bash
git rev-parse --show-toplevel 2>/dev/null && echo "PROJECT" || echo "META"
git branch --show-current 2>/dev/null
pwd
git status --short
```

- `PROJECT` → continue to Step 2
- `META` (not in a git repo) → skip to **Meta Mode**

---

## Step 2 — Ephemeral provision (only if the project ships a provisioner)

Run only when the project provides a session-provisioning script (e.g. `scripts/<provision>.sh`). Skip otherwise. Ending-session tears down what this spins up.

---

## Step 3 — Risk map (conditional)

**Only if:** first session in this codebase, OR last commit was >7 days ago.

```bash
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -10
git log -i -E --grep="fix|bug|broken|revert" --name-only --format='' | sort | uniq -c | sort -nr | head -10
```

Files in both lists = **risk zones**. Name them explicitly.

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<repo-name> / <branch>  ·  <date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNCOMMITTED  <git status --short, or: clean>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK ZONES   · <file> (churn + bugs)
             (omit section if step 3 skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then:

- **Work already named** (operator gave a high-intent task; handoff/TODO; NOW/flight names a thread; active threads exist): **do not** ask "What are we expanding into?" Session start is authorization — proceed or present one ruled proposal. Forbidden: "say the word", "which first", scheduling deferrals.
- **Pool empty** (no named work): end with `What are we expanding into?` — a real question; **stop and wait**.

---

## Meta Mode (not in a git repo)

For agent-core work, global config, research.

```bash
cd ~/agent-core && git log --oneline -5 2>/dev/null
git status --short
```

Output the block above (RECENT · UNCOMMITTED). Same gate as project mode: ask
`What are we expanding into?` and stop **only when the pool is empty**; when
NOW/flight/handoff or the operator's prompt already names work, session start
is authorization — do not defer with scheduling questions.
