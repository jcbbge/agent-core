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

## Usage Examples

### Setting Up New VPS

```
You: "I need to set up a new VPS for hosting my SolidStart application. 
I'm using macOS and the VPS is Ubuntu 24.04 from Vultr."

Claude: [Guides through complete 10-phase workflow with checklist]
```

### SSH Configuration

```
You: "How do I configure SSH on my Mac to easily connect to multiple VPS servers?"

Claude: [Provides ~/.ssh/config examples from SSH-CONFIG-EXAMPLES.md]
```

### Firewall Rules

```
You: "I need to allow PostgreSQL access but only from my application server."

Claude: [Shows specific UFW commands and patterns from UFW-REFERENCE.md]
```

### Security Monitoring

```
You: "Set up monitoring to alert me if resources are running high."

Claude: [Configures resource monitoring script with email alerts]
```

## Automated Scripts

The skill includes three production-ready scripts:

### security-scan.sh
- Runs ClamAV malware scanning
- Executes rootkit hunter checks
- Sends email alerts for infections
- Scheduled weekly via cron

**Installation:**
```bash
sudo cp scripts/security-scan.sh /usr/local/sbin/
sudo chmod +x /usr/local/sbin/security-scan.sh
sudo crontab -e
# Add: 0 3 * * 0 /usr/local/sbin/security-scan.sh
```

### check-resources.sh
- Monitors CPU, memory, disk usage
- Sends alerts when thresholds exceeded
- Logs top processes during alerts
- Scheduled every 5 minutes

**Installation:**
```bash
sudo cp scripts/check-resources.sh /usr/local/sbin/
sudo chmod +x /usr/local/sbin/check-resources.sh
sudo crontab -e
# Add: */5 * * * * /usr/local/sbin/check-resources.sh
```

### security-audit.sh
- Comprehensive security audit
- Checks SSH config, firewall, updates
- Reviews user accounts and permissions
- Analyzes failed login attempts
- Scheduled weekly

**Installation:**
```bash
sudo cp scripts/security-audit.sh /usr/local/sbin/
sudo chmod +x /usr/local/sbin/security-audit.sh
sudo crontab -e
# Add: 0 0 * * 0 /usr/local/sbin/security-audit.sh
```

## Reference Documentation

### SSH Configuration Examples
Complete guide to SSH configs, including:
- macOS client configuration with Keychain
- Ubuntu server hardening
- Multi-server management
- Jump host patterns
- Port forwarding examples
- Troubleshooting guide

**Access:** Ask Claude to "show SSH configuration examples" or reference [references/SSH-CONFIG-EXAMPLES.md]

### UFW Firewall Reference
Comprehensive firewall guide covering:
- Basic and advanced rules
- Common server configurations
- Application profiles
- Rate limiting
- Logging and monitoring
- Integration with Fail2ban

**Access:** Ask Claude about "firewall rules" or reference [references/UFW-REFERENCE.md]

### Fail2ban Configuration
Complete intrusion prevention guide:
- Installation and setup
- Common jail configurations
- Custom filter creation
- Email notifications
- Management commands
- Integration patterns

**Access:** Ask Claude about "Fail2ban" or reference [references/FAIL2BAN-CONFIG.md]

### Monitoring and Maintenance
Comprehensive monitoring guide:
- Local system monitoring
- External monitoring services (UptimeRobot, Hetrix)
- Log management and analysis
- Backup strategies
- Maintenance workflows
- Performance monitoring

**Access:** Ask Claude about "monitoring" or reference [references/MONITORING-SETUP.md]

## Prerequisites

- **Client**: macOS (for optimized workflows)
- **Server**: Fresh Ubuntu 24.04 LTS VPS
- **Access**: SSH access with root credentials (initial setup)
- **Knowledge**: Basic command line familiarity
- **Time**: ~30 minutes for complete setup

## What You'll Learn

Following this skill teaches you:
1. Industry-standard VPS security practices
2. Efficient SSH workflows from macOS
3. Firewall configuration and management
4. Intrusion prevention systems
5. Automated monitoring and maintenance
6. Practical self-hosting without orchestration
7. Troubleshooting common VPS issues

## Security Approach

This skill implements defense in depth:

**Layer 1: Network**
- Non-standard SSH port
- UFW firewall with rate limiting
- Minimal exposed services

**Layer 2: Authentication**
- Key-only SSH authentication
- No password authentication
- No root login
- Fail2ban intrusion prevention

**Layer 3: System**
- Non-root operational user
- Automated security updates
- Regular security audits
- Malware scanning

**Layer 4: Monitoring**
- Resource monitoring
- Security audit automation
- Failed login tracking
- External uptime monitoring

## Common Workflows

### Initial Setup (New VPS)
```
User: "Set up new VPS"
→ Claude guides through 10-phase workflow
→ User has secure, monitored server
```

### Adding Services
```
User: "How do I add PostgreSQL securely?"
→ Claude shows installation + firewall rules
→ Restricts access to specific IPs
```

### File Deployment
```
User: "Deploy my app to VPS"
→ Claude shows rsync workflows
→ Configures nginx reverse proxy
```

### Troubleshooting
```
User: "Can't connect to SSH after changes"
→ Claude provides diagnostics
→ Shows recovery via provider console
```

## Known Limitations

- **macOS focused**: Workflows optimized for Mac (works from other OSes with modifications)
- **Ubuntu 24.04 LTS specific**: Commands tested on Ubuntu 24.04 (mostly work on other Debian-based distros)
- **No containers**: Deliberately excludes Docker/Kubernetes setup
- **Email alerts require configuration**: Scripts need mail server or external service

## Best Practices

1. **Always test in a new terminal** before closing current SSH session
2. **Keep SSH config backups** of working configurations
3. **Document custom ports** and services in a password manager
4. **Test backups regularly** - restoration is what matters
5. **Use VPS provider snapshots** as an additional backup layer
6. **Monitor security logs** at least weekly
7. **Keep a maintenance schedule** - don't set and forget

## Troubleshooting

### Skill Not Loading
```bash
# Verify skill location
ls -la ~/.claude/skills/self-hosting-vps-ubuntu/

# Check SKILL.md exists
cat ~/.claude/skills/self-hosting-vps-ubuntu/SKILL.md | head -20

# Restart Claude Code if needed
```

### Scripts Not Executing
```bash
# Check permissions
ls -la /usr/local/sbin/security-*.sh

# Make executable
sudo chmod +x /usr/local/sbin/*.sh

# Test manually
sudo /usr/local/sbin/security-audit.sh
```

### Reference Files Not Loading
```bash
# Verify references directory
ls -la ~/.claude/skills/self-hosting-vps-ubuntu/references/

# Ask Claude specifically
"Show me the SSH configuration examples from the reference files"
```

## Version History

**v1.0** (2025-01-01)
- Initial release
- Complete 10-phase VPS setup workflow
- 3 production-ready automation scripts
- 4 comprehensive reference guides
- macOS-optimized SSH workflows
- Ubuntu 24.04 LTS hardening
- Fail2ban + UFW security layers

## Contributing

This skill follows the [agentskills.io](https://github.com/agentskills/agentskills) open standard.

To improve this skill:
1. Use it in real workflows
2. Note what works and what doesn't
3. Document edge cases
4. Test with different providers
5. Share improvements

## License

MIT License - Use freely, modify as needed, share improvements.

## Support

This is a skill for AI agents, not a standalone application. For help:

1. **Ask Claude**: Describe your issue naturally
2. **Check references**: Detailed guides in references/ directory
3. **Review scripts**: All automation is readable and documented
4. **Test configurations**: Always verify in non-production first

## Acknowledgments

Based on battle-tested production configurations and industry best practices for Ubuntu VPS security and management. Incorporates insights from:
- Ubuntu Server documentation
- OWASP security guidelines
- DigitalOcean community tutorials
- Real-world self-hosting experience
- macOS developer workflows

---

**Ready to secure your VPS?** Install the skill and start a conversation with Claude about your VPS setup needs!
