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

This reference covers comprehensive SSH configuration patterns optimized for macOS developers managing Ubuntu VPS servers.
