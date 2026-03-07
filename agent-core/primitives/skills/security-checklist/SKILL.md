---
name: security-checklist
description: See command definition below.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Security Checklist"
category: quick
difficulty: intermediate
---

# Security Checklist (Quick Use)

**When:** New server setup, security audits  
**Trigger:** "VPS security" | "server hardening" | "secure server"

## 10-Minute Emergency Hardening

```bash
# Update everything
sudo apt update && sudo apt upgrade -y

# Create non-root user
adduser deployer && usermod -aG sudo deployer

# Basic firewall
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable

# Fail2ban with defaults
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Disable root password login
sudo passwd -l root
```

## Full Checklist

For every new VPS:
- [ ] Update all packages
- [ ] Enable automatic security updates
- [ ] Create non-root user with sudo
- [ ] Set up SSH key authentication
- [ ] Disable password authentication
- [ ] Disable root login
- [ ] Configure firewall (UFW)
- [ ] Install Fail2ban
- [ ] Disable unnecessary services
- [ ] Set up off-server backups

## Key Insight

> "Most attackers are lazy. Make your server slightly harder than the next one, and they'll move on."

## The 7 Mistakes to Avoid

1. Not updating the system
2. Logging in as root
3. Using password authentication
4. No firewall
5. No brute-force protection
6. Running unnecessary services
7. No backups

**Full version:** `skills/security_checklist.md`
