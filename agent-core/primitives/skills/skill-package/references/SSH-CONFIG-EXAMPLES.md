# SSH Configuration Examples and Best Practices

Complete guide to SSH configurations for macOS → Ubuntu VPS workflows.

## Table of Contents
- [macOS Client Configuration](#macos-client-configuration)
- [Ubuntu Server Configuration](#ubuntu-server-configuration)
- [Multi-Server Management](#multi-server-management)
- [Advanced SSH Patterns](#advanced-ssh-patterns)
- [Troubleshooting](#troubleshooting)

## macOS Client Configuration

### Basic ~/.ssh/config Template

```bash
# Global defaults for all hosts
Host *
    AddKeysToAgent yes
    UseKeychain yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes
    ControlMaster auto
    ControlPath ~/.ssh/control-%r@%h:%p
    ControlPersist 10m

# Production VPS
Host prod
    HostName prod.example.com
    User deploy
    Port 1337
    IdentityFile ~/.ssh/id_ed25519_prod
    ForwardAgent no
    LocalForward 3000 localhost:3000

# Development VPS
Host dev
    HostName dev.example.com
    User developer
    Port 1337
    IdentityFile ~/.ssh/id_ed25519_dev
    ForwardAgent yes

# Staging server
Host staging
    HostName staging.example.com
    User deploy
    Port 1337
    IdentityFile ~/.ssh/id_ed25519_staging
    LocalForward 5432 localhost:5432

# Jump host pattern
Host bastion
    HostName bastion.example.com
    User jumpuser
    Port 1337
    IdentityFile ~/.ssh/id_ed25519_bastion

Host internal-*
    User admin
    ProxyJump bastion
    IdentityFile ~/.ssh/id_ed25519_internal

# AWS instances
Host aws-*
    User ubuntu
    IdentityFile ~/.ssh/aws-key.pem
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

### Connection Multiplexing (Speed Up Connections)

```bash
Host *
    ControlMaster auto
    ControlPath ~/.ssh/control-%r@%h:%p
    ControlPersist 10m
```

This reuses existing connections, making subsequent SSH sessions instant.

### macOS Keychain Integration

```bash
# Add key to Keychain permanently
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_vps

# macOS-specific config
Host *
    UseKeychain yes
    AddKeysToAgent yes
```

## Ubuntu Server Configuration

### Secure /etc/ssh/sshd_config Template

```bash
# Network settings
Port 1337
AddressFamily inet
ListenAddress 0.0.0.0

# Authentication
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security hardening
MaxAuthTries 3
MaxSessions 5
LoginGraceTime 30
ClientAliveInterval 600
ClientAliveCountMax 3

# Disable dangerous features
X11Forwarding no
PermitUserEnvironment no
AllowAgentForwarding yes
AllowTcpForwarding yes
GatewayPorts no
PermitTunnel no

# Allow specific users only (optional)
AllowUsers deploy developer admin

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Use secure cryptography
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
```

### Testing SSH Configuration

```bash
# Test configuration syntax
sudo sshd -t

# Test with specific config file
sudo sshd -t -f /etc/ssh/sshd_config

# Check current configuration
sudo sshd -T

# Restart SSH (Ubuntu 24.04)
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
```

## Multi-Server Management

### Managing Multiple VPS Servers

**~/.ssh/config pattern:**

```bash
# Pattern for multiple similar servers
Host vps-*
    User deploy
    Port 1337
    ForwardAgent no
    ServerAliveInterval 60

Host vps-prod
    HostName 192.0.2.10

Host vps-staging
    HostName 192.0.2.11

Host vps-dev
    HostName 192.0.2.12
```

### Mass Command Execution Script

```bash
#!/bin/bash
# run-on-all-servers.sh

SERVERS="vps-prod vps-staging vps-dev"
COMMAND="$1"

if [ -z "$COMMAND" ]; then
    echo "Usage: $0 'command to run'"
    exit 1
fi

for server in $SERVERS; do
    echo "==== $server ===="
    ssh "$server" "$COMMAND"
    echo ""
done
```

Usage:
```bash
./run-on-all-servers.sh "uptime && df -h / && free -m"
./run-on-all-servers.sh "sudo systemctl status nginx"
```

## Advanced SSH Patterns

### Port Forwarding Examples

**Local port forwarding (access remote service locally):**

```bash
# Forward remote database to local machine
ssh -L 3306:localhost:3306 prod

# Forward remote web app
ssh -L 8080:localhost:3000 dev

# Forward to different host via SSH server
ssh -L 8080:internal-server:80 bastion

# Multiple forwards
ssh -L 3306:localhost:3306 -L 5432:localhost:5432 prod
```

**Remote port forwarding (expose local service remotely):**

```bash
# Share local development server
ssh -R 8080:localhost:3000 dev

# Share local database with remote team
ssh -R 5432:localhost:5432 dev

# Keep tunnel open
ssh -R 8080:localhost:3000 -N dev
```

**Dynamic port forwarding (SOCKS proxy):**

```bash
# Create SOCKS proxy
ssh -D 1080 prod

# Use with curl
curl --socks5 127.0.0.1:1080 http://internal-service

# Configure browser to use SOCKS5 proxy at localhost:1080
```

### Jump Host Configuration

**Using ProxyJump (recommended):**

```bash
Host target
    HostName 10.0.1.50
    User deploy
    ProxyJump bastion
    IdentityFile ~/.ssh/id_ed25519_target
```

**Chaining multiple jumps:**

```bash
Host final-destination
    HostName 10.0.2.100
    User admin
    ProxyJump bastion,intermediate
```

### SSH Agent Management

```bash
# Start agent
eval "$(ssh-agent -s)"

# Add key with Keychain support
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_vps

# List loaded keys
ssh-add -l

# Remove specific key
ssh-add -d ~/.ssh/id_ed25519_vps

# Remove all keys
ssh-add -D

# Lock agent
ssh-add -x

# Unlock agent
ssh-add -X
```

### Connection Persistence

```bash
# Keep connection alive in background
ssh -f -N -L 3306:localhost:3306 prod

# Auto-reconnect script
while true; do
    ssh -N -L 3306:localhost:3306 prod
    echo "Connection lost. Reconnecting in 5 seconds..."
    sleep 5
done
```

## Troubleshooting

### Debug SSH Connection Issues

```bash
# Verbose output
ssh -v user@host

# Very verbose
ssh -vv user@host

# Maximum verbosity
ssh -vvv user@host

# Test specific port
ssh -p 1337 -vv user@host

# Test with specific key
ssh -i ~/.ssh/specific_key -vv user@host
```

### Common Issues and Solutions

**"Permission denied (publickey)"**

Check:
```bash
# Key permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Verify key is loaded
ssh-add -l

# Add key if missing
ssh-add ~/.ssh/id_ed25519
```

**"Connection refused"**

Check:
```bash
# Verify SSH service running
ssh user@host -p 1337 -vv

# Check firewall on server
sudo ufw status | grep 1337

# Check SSH service
sudo systemctl status ssh
```

**"Host key verification failed"**

```bash
# Remove old key
ssh-keygen -R hostname

# Or for specific port
ssh-keygen -R [hostname]:1337

# Then reconnect
ssh user@host
```

**"Too many authentication failures"**

```bash
# Specify exact key
ssh -o IdentitiesOnly=yes -i ~/.ssh/specific_key user@host

# Or limit keys in config
Host problematic
    HostName host.example.com
    IdentitiesOnly yes
    IdentityFile ~/.ssh/specific_key
```

### Server-Side Diagnostics

```bash
# Check SSH logs
sudo tail -f /var/log/auth.log

# Check SSH service status
sudo systemctl status ssh

# Test SSH config
sudo sshd -t

# View current SSH configuration
sudo sshd -T

# Check listening ports
sudo ss -tulpn | grep ssh
```

### Connection Performance Issues

```bash
# Test with compression
ssh -C user@host

# Disable compression
ssh -o Compression=no user@host

# Test different cipher
ssh -c aes128-gcm@openssh.com user@host

# Use multiplexing
Host slow-connection
    ControlMaster auto
    ControlPath ~/.ssh/control-%r@%h:%p
    ControlPersist 10m
```

## Security Best Practices

### Key Management

1. **Use ed25519 keys** (modern, secure, fast)
2. **Always use passphrases** on private keys
3. **Rotate keys every 1-2 years**
4. **Use different keys for different environments**
5. **Store keys in macOS Keychain**

### Connection Security

1. **Never use password authentication** in production
2. **Disable root login** completely
3. **Use non-standard ports** (reduces automated attacks)
4. **Implement rate limiting** with UFW
5. **Enable Fail2ban** for intrusion prevention

### Agent Forwarding Risks

**Only enable for trusted servers:**

```bash
# Safe pattern
Host trusted-only
    HostName trusted.example.com
    ForwardAgent yes

# Never do this!
Host *
    ForwardAgent yes  # DANGEROUS!
```

**Use ProxyJump instead:**

```bash
# Safer alternative
Host target
    ProxyJump bastion
    ForwardAgent no
```

## Shell Integration

### Useful Aliases for ~/.zshrc

```bash
# Quick SSH connections
alias ss='ssh -A'
alias sc='scp'
alias sr='rsync -avz --progress'

# Server monitoring
alias slogs='ssh "$1" "tail -f /var/log/auth.log"'
alias sstatus='ssh "$1" "uptime && df -h && free -m"'

# Quick tunnels
alias tunnel-db='ssh -L 5432:localhost:5432 prod'
alias tunnel-app='ssh -L 3000:localhost:3000 dev'
```

### Functions for ~/.zshrc

```bash
# Quick server check
scheck() {
    local server="$1"
    ssh "$server" "uptime && df -h / && free -m && systemctl status"
}

# Mass execute
sexec() {
    local cmd="$1"
    shift
    for server in "$@"; do
        echo "==== $server ===="
        ssh "$server" "$cmd"
    done
}

# Backup remote directory
sbackup() {
    local server="$1"
    local remote="$2"
    local local="$3"
    rsync -avz --progress "${server}:${remote}" "$local"
}
```

## Integration with Tools

### VS Code Remote SSH

```bash
# Install extension
code --install-extension ms-vscode-remote.remote-ssh

# Connect via command line
code --remote ssh-remote+prod /path/to/project

# Or use Command Palette: "Remote-SSH: Connect to Host"
```

### Git over SSH

```bash
# Configure Git to use specific SSH key
git config core.sshCommand 'ssh -i ~/.ssh/id_ed25519_github'

# Test GitHub connection
ssh -T git@github.com

# Add remote with SSH
git remote add origin git@github.com:user/repo.git
```

This reference covers comprehensive SSH configuration patterns optimized for macOS developers managing Ubuntu VPS servers.
