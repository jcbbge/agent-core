# Self-Hosting VPS Ubuntu Setup Skill

Complete workflow for setting up and securing Ubuntu 24.04 LTS VPS servers for self-hosting web applications and developer tools. Optimized for solo indie developers working from macOS.

## What This Skill Does

This skill guides you through:
- **Initial VPS hardening**: Non-root user creation, SSH key authentication, non-standard ports
- **Security configuration**: UFW firewall, Fail2ban intrusion prevention, malware scanning
- **Automated maintenance**: Security updates, monitoring scripts, audit automation
- **macOS workflows**: SSH config, file transfers, port forwarding optimized for Mac
- **Production readiness**: Battle-tested configurations for self-hosting without orchestration complexity

## When to Use This Skill

Trigger this skill when you need to:
- Set up a new VPS from DigitalOcean, Vultr, Hostinger, or similar providers
- Harden Ubuntu 24.04 LTS server security
- Configure SSH workflows from macOS to Ubuntu servers
- Establish firewall rules and intrusion prevention
- Set up automated security monitoring and maintenance
- Deploy web applications without containers or Kubernetes

## Installation

### For Claude Code (Unified Access)

This is the **primary installation method** that works across all Claude Code interfaces:

```bash
# Copy skill to unified Claude Code location
cp -r self-hosting-vps-ubuntu ~/.claude/skills/
```

This single installation provides automatic access across:
- Claude Code CLI
- Zed editor extension
- VSCode extension
- Ghostty terminal
- OpenCode

**Verify installation:**
```bash
ls -la ~/.claude/skills/self-hosting-vps-ubuntu/
```

### For Claude Desktop (Web/Mobile)

Claude Desktop uses a new zip-based skill deployment feature:

1. **Create zip file:**
   ```bash
   cd ~/.claude/skills/
   zip -r self-hosting-vps-ubuntu.zip self-hosting-vps-ubuntu/
   ```

2. **Upload to Claude.ai:**
   - Go to Settings → Features
   - Upload the `self-hosting-vps-ubuntu.zip` file

### For Other Agents (Cursor, VS Code, etc.)

This skill follows the [agentskills.io](https://github.com/agentskills/agentskills) open standard, making it portable across platforms:

**Cursor:** Follow Cursor's skill installation instructions
**VS Code (GitHub Copilot):** Follow VS Code skill installation instructions
**Other agents:** Consult your agent's documentation for skill directory location

## Skill Contents

```
self-hosting-vps-ubuntu/
├── SKILL.md                    # Main skill instructions
├── scripts/
│   ├── security-scan.sh        # Automated malware scanning
│   ├── check-resources.sh      # Resource monitoring and alerts
│   └── security-audit.sh       # Weekly security audits
├── references/
│   ├── SSH-CONFIG-EXAMPLES.md      # Complete SSH configurations
│   ├── UFW-REFERENCE.md            # Firewall rules and patterns
│   ├── FAIL2BAN-CONFIG.md          # Intrusion prevention configs
│   └── MONITORING-SETUP.md         # External monitoring and maintenance
└── README.md                   # This file
```

## Quick Start

### 1. Fresh VPS Setup (Complete Workflow)

Start a conversation with Claude and mention your VPS setup needs:

```
"I just got a new Ubuntu 24.04 VPS from DigitalOcean. 
Help me set it up securely for hosting web applications."
```

Claude will guide you through the complete 10-phase setup workflow.

### 2. Specific Tasks

**SSH hardening:**
```
"Help me move SSH to a non-standard port and configure key-only authentication."
```

**Firewall setup:**
```
"Configure UFW firewall for a web server with PostgreSQL."
```

**Monitoring setup:**
```
"Set up automated security monitoring and resource alerts."
```

**File transfers:**
```
"Show me how to sync my local project to the VPS using rsync."
```

## Key Features

### 1. Progressive Disclosure Architecture

The skill uses layered information:
- **SKILL.md** (~500 lines): Main workflow and common patterns
- **references/** (~3000+ lines): Detailed configurations loaded on-demand
- **scripts/** (executable): Production-ready automation

This keeps Claude's context efficient while providing deep technical knowledge when needed.

### 2. macOS-First Approach

Optimized for Mac developers:
- Keychain integration for SSH keys
- macOS-specific shell functions (zsh)
- Copy to clipboard helpers (`pbcopy`)
- VS Code Remote-SSH integration
- Native terminal emulator recommendations

### 3. Battle-Tested Security

Based on real production experience:
- Non-standard SSH ports (not security through obscurity)
- Key-only authentication (no passwords)
- Multi-layer defense (UFW + Fail2ban + monitoring)
- Automated security updates with safety controls
- Comprehensive audit scripts

### 4. No Orchestration Complexity

Deliberately avoids:
- Docker/containers (unless you specifically need them)
- Kubernetes (overkill for solo developers)
- Complex CI/CD pipelines
- Service mesh abstractions

Focus: **Simple, secure, maintainable servers for self-hosting.**

## License

MIT License - Use freely, modify as needed, share improvements.

---

**Ready to secure your VPS?** Install the skill and start a conversation with Claude about your VPS setup needs!
