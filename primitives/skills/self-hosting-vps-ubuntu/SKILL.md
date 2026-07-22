---
name: self-hosting-vps-ubuntu
description: Set up and secure Ubuntu 24.04 LTS VPS for self-hosting web applications and developer tools. Use when provisioning new VPS servers, hardening Ubuntu security, configuring SSH from macOS, setting up firewalls, or establishing self-hosting infrastructure. Covers SSH workflows, UFW firewall, Fail2ban, malware protection, automated updates, and monitoring for solo developers.
license: MIT
compatibility: Designed for macOS clients managing Ubuntu 24.04 LTS VPS servers. Requires SSH access and sudo privileges on target server.
metadata:
  author: JR
  version: "1.0"
  tags: vps, ubuntu, security, self-hosting, ssh, devops
---

# Self-Hosting VPS Ubuntu Setup

Complete workflow for setting up and securing Ubuntu 24.04 LTS VPS servers for self-hosting web applications and developer tools. Optimized for solo indie developers working from macOS.

## When to use this skill

- Setting up a new VPS from providers like DigitalOcean, Vultr, Hostinger
- Hardening Ubuntu 24.04 LTS server security
- Configuring SSH workflows from macOS to Ubuntu
- Establishing firewall rules and intrusion prevention
- Setting up automated security monitoring
- Deploying web applications without containers/Kubernetes

## Core principles

1. **Security first**: Non-standard ports, key-only auth, multiple defense layers
2. **macOS optimization**: Leverages macOS Keychain, shell integration, native tools
3. **No complexity creep**: Direct server setup without orchestration overhead
4. **Battle-tested configs**: Production-hardened settings based on real-world usage
5. **Automated maintenance**: Scripts for ongoing security and monitoring

## Quick start: New VPS setup

For a fresh Ubuntu 24.04 LTS VPS, follow this workflow in order:

**Copy this checklist and track progress:**

```
VPS Setup Progress:
- [ ] Phase 1: macOS SSH key setup
- [ ] Phase 2: Initial server connection
- [ ] Phase 3: Create non-root user
- [ ] Phase 4: SSH hardening (key auth, non-standard port)
- [ ] Phase 5: Firewall configuration (UFW)
- [ ] Phase 6: Intrusion prevention (Fail2ban)
- [ ] Phase 7: Malware protection (ClamAV, rkhunter)
- [ ] Phase 8: Automated updates
- [ ] Phase 9: Monitoring setup
- [ ] Phase 10: Verification and testing
```

## Phase 1: macOS SSH key setup

### Generate SSH keys (if needed)

```bash
# Generate modern ed25519 key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_vps

# Add to macOS Keychain for automatic passphrase management
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_vps

# Copy public key to clipboard
pbcopy < ~/.ssh/id_ed25519_vps.pub
```

### Configure SSH for macOS Keychain integration

Add to `~/.ssh/config` on your Mac:

```bash
Host *
  AddKeysToAgent yes
  UseKeychain yes
  ServerAliveInterval 60
  ServerAliveCountMax 3
  Compression yes
```

## Phase 2: Initial server connection

```bash
# First connection (you'll receive root credentials via email)
ssh root@your-server-ip

# Update system immediately
apt update && apt upgrade -y

# Install essential packages
apt install -y ufw fail2ban unattended-upgrades curl wget htop vim
```

## Phase 3: Create non-root user

```bash
# Create your user (replace 'yourusername')
adduser yourusername

# Add to sudo group
usermod -aG sudo yourusername

# Test sudo access
su - yourusername
sudo whoami  # Should output: root
```

**Critical**: Use a strong password from your password manager (1Password, Bitwarden, etc.)

## Phase 4: SSH hardening

### Copy SSH key to new user

From your **Mac**, copy your public key:

```bash
# Copy key to the new non-root user
ssh-copy-id -i ~/.ssh/id_ed25519_vps.pub yourusername@your-server-ip
```

### Configure SSH security

On the **server** as your new user:

```bash
# Edit SSH config
sudo vim /etc/ssh/sshd_config
```

**Critical SSH security settings:**

```bash
Port 1337                       # Choose your custom port (1024-65535)
PermitRootLogin no             # Disable root login
PasswordAuthentication no      # Key-only authentication
PubkeyAuthentication yes       # Enable key auth
MaxAuthTries 3                 # Limit attempts
ClientAliveInterval 600        # Keep connections alive
```

### Test and restart SSH

```bash
# Verify configuration syntax
sudo sshd -t

# Restart SSH service (Ubuntu 24.04 uses socket activation)
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
```

**CRITICAL**: Test in a new terminal BEFORE closing current session:

```bash
# From your Mac - test new connection
ssh -p 1337 yourusername@your-server-ip
```

### Update macOS SSH config

Add to `~/.ssh/config` on your Mac:

```bash
Host myvps
    HostName your-server-ip
    User yourusername
    Port 1337
    IdentityFile ~/.ssh/id_ed25519_vps
    LocalForward 3000 localhost:3000  # Optional: forward app ports
```

Now connect simply with: `ssh myvps`

## Phase 5: Firewall configuration (UFW)

```bash
# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH on custom port
sudo ufw allow 1337/tcp

# Allow web traffic
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Rate limit SSH to prevent brute force
sudo ufw limit 1337/tcp

# Enable firewall
sudo ufw --force enable

# Verify configuration
sudo ufw status verbose
```

### Opening additional ports

For specific applications:

```bash
# PostgreSQL (if direct access needed)
sudo ufw allow 5432/tcp

# Node.js app (example - better to proxy through nginx)
sudo ufw allow 3000/tcp

# Always verify after changes
sudo ufw status numbered
```

**Pro tip**: Use nginx/caddy as reverse proxy instead of exposing app ports directly.

## Phase 6: Intrusion prevention (Fail2ban)

```bash
# Install Fail2ban
sudo apt install -y fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

**Essential Fail2ban configuration:**

```ini
[DEFAULT]
bantime = 86400          # 24 hours
findtime = 600          # 10 minutes
maxretry = 3            # 3 failed attempts
destemail = your-email@example.com

[sshd]
enabled = true
port = 1337             # Your custom SSH port
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
```

```bash
# Restart Fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

## Phase 7: Malware protection

### Install security scanners

```bash
# Install ClamAV and Rootkit Hunter
sudo apt install -y clamav clamav-daemon rkhunter

# Update virus definitions
sudo freshclam

# Update rkhunter database
sudo rkhunter --update
sudo rkhunter --propupd
```

### Setup automated scanning

Use the security scan script from `scripts/security-scan.sh`:

```bash
# Copy script to system
sudo cp scripts/security-scan.sh /usr/local/sbin/
sudo chmod +x /usr/local/sbin/security-scan.sh

# Schedule weekly scans (Sundays at 3 AM)
sudo crontab -e
# Add: 0 3 * * 0 /usr/local/sbin/security-scan.sh
```

## Phase 8: Automated security updates

```bash
# Configure unattended upgrades
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Edit `/etc/apt/apt.conf.d/50unattended-upgrades`:

```bash
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
};

Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

Configure update schedule in `/etc/apt/apt.conf.d/10periodic`:

```bash
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
```

## Phase 9: Monitoring setup

### Basic resource monitoring

Use the resource check script from `scripts/check-resources.sh`:

```bash
# Copy script to system
sudo cp scripts/check-resources.sh /usr/local/sbin/
sudo chmod +x /usr/local/sbin/check-resources.sh

# Schedule checks every 5 minutes
sudo crontab -e
# Add: */5 * * * * /usr/local/sbin/check-resources.sh
```

### Security audit script

```bash
# Copy audit script to system
sudo cp scripts/security-audit.sh /usr/local/sbin/
sudo chmod +x /usr/local/sbin/security-audit.sh

# Schedule weekly audits (Sundays at midnight)
sudo crontab -e
# Add: 0 0 * * 0 /usr/local/sbin/security-audit.sh
```

## Phase 10: Verification and testing

Run comprehensive security check:

```bash
# Verify SSH hardening
grep -E "^(Port|PermitRootLogin|PasswordAuthentication)" /etc/ssh/sshd_config

# Check firewall status
sudo ufw status verbose

# Check Fail2ban status
sudo fail2ban-client status sshd

# View recent failed logins
sudo tail -20 /var/log/auth.log | grep "Failed password"

# Run security audit
sudo /usr/local/sbin/security-audit.sh
cat /var/log/security-audit.log
```

## macOS file transfer workflows

### Quick file operations

```bash
# Upload single file
scp ./local-file.zip myvps:~/path/

# Upload directory
scp -r ./local-dir myvps:~/path/

# Download file
scp myvps:~/remote-file.txt ./

# Sync with rsync (more efficient for large transfers)
rsync -avz --progress ./local-dir/ myvps:~/remote-dir/
```

### Advanced rsync patterns

```bash
# Sync excluding patterns
rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.env' \
    ./project/ myvps:~/apps/project/

# Dry run before actual sync
rsync -avz --dry-run ./local/ myvps:~/remote/

# Mirror (sync with delete)
rsync -avz --delete ./local/ myvps:~/remote/
```

## Port forwarding and tunneling

### Access remote services locally

```bash
# Forward remote database to local machine
ssh -L 3306:localhost:3306 myvps

# Forward remote web app during development
ssh -L 8080:localhost:3000 myvps

# Multiple forwards
ssh -L 8080:localhost:80 -L 8443:localhost:443 myvps
```

### Expose local services to remote

```bash
# Share local dev server with remote team
ssh -R 8080:localhost:3000 myvps

# Create SOCKS proxy for browsing remote network
ssh -D 1080 myvps
```

## Maintenance workflows

### Regular security checks

```bash
# Check for updates
apt list --upgradable 2>/dev/null | grep -v "WARNING" | wc -l

# Review failed login attempts
sudo tail -50 /var/log/auth.log | grep "Failed password"

# Check Fail2ban bans
sudo fail2ban-client status sshd

# Review security scan logs
sudo tail -50 /var/log/security-scan.log
```

### System resource monitoring

```bash
# Quick system status
ssh myvps "uptime && df -h && free -h"

# Detailed monitoring
ssh myvps "htop"

# Disk usage
ssh myvps "df -h | grep -vE '^Filesystem|tmpfs|cdrom'"
```

## Common workflows

### Mass server command execution

For managing multiple VPS servers:

```bash
# Execute command on all servers
for server in vps1 vps2 vps3; do
    echo "Executing on $server:"
    ssh $server "uptime && df -h / && free -m"
    echo "---"
done
```

### Backup remote directory

```bash
# Full backup with rsync
rsync -avz --progress myvps:~/app-data/ ~/backups/vps-backups/

# Incremental backup
rsync -avz --delete --link-dest=~/backups/previous/ \
    myvps:~/app-data/ ~/backups/latest/
```

## Troubleshooting

### Can't connect after SSH hardening

1. If locked out, use VPS provider's console access
2. Check SSH config syntax: `sudo sshd -t`
3. Verify port in UFW: `sudo ufw status | grep 1337`
4. Check SSH service: `sudo systemctl status ssh.socket`

### Fail2ban blocking legitimate IPs

```bash
# Unban an IP
sudo fail2ban-client set sshd unbanip YOUR_IP

# Check ban list
sudo fail2ban-client status sshd

# Temporarily disable jail
sudo fail2ban-client stop sshd
```

### High resource usage alerts

```bash
# Check top processes
htop

# Check disk usage
du -h --max-depth=1 / | sort -hr

# Check network connections
netstat -tupln

# Check logs for errors
journalctl -xe
```

## Advanced topics

### SSH agent forwarding (use with caution)

Only enable for trusted servers:

```bash
# In ~/.ssh/config on Mac
Host trusted-vps
    HostName trusted-server-ip
    User yourusername
    Port 1337
    ForwardAgent yes
```

**Security note**: Never use `ForwardAgent yes` globally. Use `ProxyJump` instead for jump hosts.

### VS Code remote development

```bash
# Install Remote-SSH extension in VS Code
code --install-extension ms-vscode-remote.remote-ssh

# Connect from command line
code --remote ssh-remote+myvps /path/to/project
```

## Additional resources

For detailed configuration examples and troubleshooting:
- [references/SSH-CONFIG-EXAMPLES.md](references/SSH-CONFIG-EXAMPLES.md) - Complete SSH configurations
- [references/UFW-REFERENCE.md](references/UFW-REFERENCE.md) - Firewall rules and examples
- [references/FAIL2BAN-CONFIG.md](references/FAIL2BAN-CONFIG.md) - Intrusion prevention patterns
- [references/MONITORING-SETUP.md](references/MONITORING-SETUP.md) - External monitoring options

## Security checklist

Use this to verify your server is properly secured:

```
Security Verification:
- [ ] System fully updated
- [ ] Non-root user created with sudo
- [ ] SSH key authentication working
- [ ] Password authentication disabled
- [ ] Root login disabled
- [ ] SSH on non-standard port
- [ ] UFW firewall enabled with proper rules
- [ ] Fail2ban installed and configured
- [ ] ClamAV and rkhunter installed
- [ ] Automated security updates enabled
- [ ] Monitoring scripts scheduled
- [ ] Security audit script running weekly
- [ ] Can connect from Mac with SSH config alias
- [ ] Cannot connect as root
- [ ] Cannot connect with password
```

## Next steps

After security hardening:
1. Install web server (nginx/caddy)
2. Configure SSL certificates (Let's Encrypt)
3. Deploy your applications
4. Setup external monitoring (UptimeRobot, etc.)
5. Configure backups (automated rsync, provider snapshots)
6. Document your custom configurations

This skill provides the foundation for self-hosting - a secure, monitored Ubuntu VPS ready for web applications and developer tools without orchestration complexity.
