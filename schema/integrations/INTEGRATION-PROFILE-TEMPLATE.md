# Integration Profile: [TOOL NAME]

<!-- 5W+F Schema — one file per external tool/integration installed into the agent stack.
     Copy this template. Fill every section. Leave no field blank: use "unknown" or "N/A" with a note.
     Profiles live at: primitives/integrations/[tool-name].md
-->

---

## WHO

| Field | Value |
|-------|-------|
| Maintainer | <!-- person or org name --> |
| Repo | <!-- full URL --> |
| License | <!-- MIT, Apache-2.0, proprietary, etc. --> |
| Update channel | <!-- brew tap, cargo install, npm, git pull, etc. --> |
| Support / issues | <!-- GitHub issues URL, Discord, etc. --> |

---

## WHAT

**One-line purpose:**
<!-- What does this tool do, in a single sentence? -->

**What it does in detail:**
<!-- 3-5 bullet points describing its behavior, not its marketing copy. -->

**What it touches in the stack:**
<!-- Which harnesses, MCP servers, hooks, files, ports, or databases does it interact with? -->
- Harnesses affected:
- Hook events used:
- Files read/written:
- Ports / sockets:
- Other tools it depends on (e.g., jq, rtk, brew):

---

## WHERE

All files and paths created or modified during installation.

| Path | Type | Purpose | Owned by tool? |
|------|------|---------|----------------|
| <!-- e.g. /usr/local/bin/toolname --> | binary | Main executable | yes |
| <!-- e.g. ~/.config/toolname/config.toml --> | config | Tool configuration | yes — survives upgrade |
| <!-- e.g. ~/.claude/hooks/toolname.sh --> | hook script | Injected into harness | PATCHED — re-apply after upgrade |
| <!-- e.g. ~/.claude/settings.json --> | harness config | Hook registration | manual entry |
| <!-- e.g. ~/.local/share/toolname/db.sqlite --> | data | Tool's own telemetry/history | yes |

**Homebrew prefix (if applicable):** `/opt/homebrew/bin/[toolname]`

---

## WHEN

| Field | Value |
|-------|-------|
| Install date | <!-- YYYY-MM-DD --> |
| Version at install | <!-- x.y.z --> |
| Last verified working | <!-- YYYY-MM-DD --> |
| Current version | <!-- fill at next update --> |
| Update cadence | <!-- monthly / on-demand / track releases --> |
| How to check current version | <!-- toolname --version --> |

---

## WHY

**Why this tool was chosen:**
<!-- What problem it solves in this stack specifically. Not generic benefits. -->

**Alternatives considered:**
<!-- What else was evaluated and why it was not chosen. -->

**Decision notes:**
<!-- Any constraints, tradeoffs, or context that influenced the choice. -->

**Customizations made for this stack:**
<!-- Every deviation from default installation behavior. Include the reason for each. -->

1. **[Customization name]** — [what was done] — [why it was necessary for this stack]

---

## FUTURE-PROOFING (+F)

### Update Procedure

```bash
# Step 1: capture current state
[tool] --version

# Step 2: upgrade
[upgrade command]  # e.g. brew upgrade [tap]/[tool]

# Step 3: re-apply patches
# List every file that must be manually patched after upgrade:
# - [path]: [what to re-apply]

# Step 4: verify
[run regression assertions below]
```

### Breaking Change Detection

Signs that a maintainer update has broken something in this stack:

- [ ] [Specific symptom to watch for — e.g., hook no longer produces output]
- [ ] [Another symptom]
- [ ] Regression assertions fail (see below)

How to verify after upgrade:

```bash
rtk verify  # or equivalent integrity check
```

### Regression Assertions

Lightweight bash commands. Each must pass after every upgrade. Expected output noted inline.

```bash
# Assert 1: [what this tests]
[command] # expected: [exact output or exit code]

# Assert 2: [what this tests]
[command] # expected: [exact output or exit code]
```

### Local Patches That Survive Upgrades

Files that were manually modified and will be **overwritten by upgrade**:

| File | Lines modified | What to re-apply | Why |
|------|---------------|------------------|-----|
| <!-- path --> | <!-- L38-45 --> | <!-- description --> | <!-- reason --> |

**Re-patch script (optional):**

```bash
# patch-[toolname].sh — run after every upgrade
# [script content or reference to file]
```

### Telemetry / Observability Integration

**Default telemetry:** [what the tool collects and where it stores it]

**Stack integration status:**
- [ ] Default telemetry disabled
- [ ] Mirrored to SurrealDB (NS: [namespace], DB: [database])
- [ ] SurrealDB schema defined at: [path]
- [ ] Integration script: [path]

**SurrealDB event schema (if implemented):**

```surql
-- [tool_name]_event record shape
DEFINE TABLE [tool_name]_event SCHEMAFULL;
-- fields...
```

---

## OPEN QUESTIONS

<!-- Remove this section once resolved. -->

- [ ] [Question requiring Josh's decision]

---

## CHANGE LOG

| Date | Version | Change | Who |
|------|---------|--------|-----|
| <!-- YYYY-MM-DD --> | <!-- x.y.z --> | Initial install | Josh |
