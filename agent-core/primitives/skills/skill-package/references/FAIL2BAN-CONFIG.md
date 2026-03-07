# Fail2ban Configuration Reference

Complete guide to Fail2ban intrusion prevention for Ubuntu VPS servers.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Installation and Setup](#installation-and-setup)
- [Configuration Files](#configuration-files)
- [Common Jails](#common-jails)
- [Custom Filters](#custom-filters)
- [Management Commands](#management-commands)
- [Integration Patterns](#integration-patterns)
- [Troubleshooting](#troubleshooting)

## Core Concepts

Fail2ban monitors log files for failed authentication attempts and bans IPs that exceed thresholds.

### Key Parameters

```ini
[DEFAULT]
# How long to ban (seconds)
bantime = 86400         # 24 hours = 86400 seconds

# Window to count failures (seconds)
findtime = 600          # 10 minutes = 600 seconds

# Number of failures before ban
maxretry = 3            # 3 attempts

# Action to take (ban via iptables/ufw)
banaction = ufw         # or iptables-multiport

# Where to send notifications
destemail = admin@example.com
sender = fail2ban@example.com
```

### How It Works

1. Monitors log files (e.g., `/var/log/auth.log`)
2. Matches patterns using filters
3. Counts failures within `findtime` window
4. Bans IP if failures exceed `maxretry`
5. IP stays banned for `bantime`
6. Automatically unbans after time expires

## Installation and Setup

### Basic Installation

```bash
# Install Fail2ban
sudo apt update
sudo apt install -y fail2ban

# Enable and start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo systemctl status fail2ban
```

### Initial Configuration

```bash
# Create local config (never edit jail.conf directly)
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit local config
sudo vim /etc/fail2ban/jail.local

# Restart after changes
sudo systemctl restart fail2ban
```

## Configuration Files

### Configuration Hierarchy

```
/etc/fail2ban/
├── action.d/          # Actions (ban methods)
├── filter.d/          # Filters (log patterns)
├── jail.d/            # Individual jail configs
├── jail.conf          # Default config (DO NOT EDIT)
├── jail.local         # Your custom config
└── fail2ban.conf      # Main config
```

### jail.local Structure

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
# Global settings apply to all jails unless overridden

# Ban settings
bantime = 86400
findtime = 600
maxretry = 3

# Action settings
banaction = ufw
destemail = your-email@example.com
sender = fail2ban@yourdomain.com
action = %(action_mwl)s

# Whitelist (never ban these IPs)
ignoreip = 127.0.0.1/8 ::1 192.168.1.0/24

[sshd]
enabled = true
port = 1337
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
filter = nginx-noscript
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6
```

## Common Jails

### SSH Protection (Most Important)

```ini
[sshd]
enabled = true
port = 1337              # Your custom SSH port
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400          # 24 hours
findtime = 600           # 10 minutes

# Override global settings for SSH
action = %(action_mwl)s  # Mail with log
```

### Nginx Web Server

**HTTP Basic Auth:**
```ini
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
```

**Script Kiddies (scanning for scripts):**
```ini
[nginx-noscript]
enabled = true
filter = nginx-noscript
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 86400
```

**Bad Bots:**
```ini
[nginx-badbots]
enabled = true
filter = nginx-badbots
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400
```

**WordPress Protection:**
```ini
[nginx-wp-login]
enabled = true
filter = nginx-wp-login
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3
findtime = 300
bantime = 3600
```

### Apache Web Server

```ini
[apache-auth]
enabled = true
port = http,https
filter = apache-auth
logpath = /var/log/apache*/*error.log
maxretry = 3

[apache-badbots]
enabled = true
port = http,https
filter = apache-badbots
logpath = /var/log/apache*/*access.log
maxretry = 2
bantime = 86400

[apache-noscript]
enabled = true
port = http,https
filter = apache-noscript
logpath = /var/log/apache*/*error.log
maxretry = 6
```

### Database Servers

**MySQL:**
```ini
[mysqld-auth]
enabled = true
filter = mysqld-auth
port = 3306
logpath = /var/log/mysql/error.log
maxretry = 3
```

**PostgreSQL:**
```ini
[postgresql]
enabled = true
filter = postgresql
port = 5432
logpath = /var/log/postgresql/postgresql-*-main.log
maxretry = 3
```

### Mail Servers

```ini
[postfix]
enabled = true
port = smtp,465,submission
filter = postfix
logpath = /var/log/mail.log

[dovecot]
enabled = true
port = pop3,pop3s,imap,imaps
filter = dovecot
logpath = /var/log/mail.log
```

## Custom Filters

### Creating Custom Filter

Create `/etc/fail2ban/filter.d/custom-app.conf`:

```ini
[Definition]
# Pattern to match failed logins
failregex = ^.*Login failed for user <HOST>.*$
            ^.*Invalid password for .* from <HOST>.*$

# Pattern to ignore (optional)
ignoreregex =

# Test patterns (optional)
[Examples]
# Example log lines that should match
examplepattern = Login failed for user 192.0.2.100
```

### Test Your Filter

```bash
# Test filter against log file
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/custom-app.conf

# Test with specific pattern
sudo fail2ban-regex /var/log/auth.log "^.*Failed.*<HOST>.*$"
```

### Custom Jail for Custom App

Create `/etc/fail2ban/jail.d/custom-app.local`:

```ini
[custom-app]
enabled = true
port = 3000
filter = custom-app
logpath = /var/log/custom-app/app.log
maxretry = 5
findtime = 300
bantime = 3600
```

## Advanced Configuration

### Ban Time Progression

Increase ban time for repeat offenders:

```ini
[sshd]
enabled = true
port = 1337
filter = sshd
logpath = /var/log/auth.log

# First ban: 1 hour
bantime = 3600

# Increase ban time with each repeat offense
bantime.increment = true
bantime.factor = 2
bantime.multipliers = 1 2 4 8 16 32 64

# Maximum ban time: 1 week
bantime.maxtime = 604800
```

### IP Whitelisting

```ini
[DEFAULT]
# Never ban these IPs
ignoreip = 127.0.0.1/8 ::1
           192.168.1.0/24
           203.0.113.50
           198.51.100.0/24

# Or use external file
# ignoreip = %(ignoreip_file)s
```

Create `/etc/fail2ban/ignoreip.txt`:
```
127.0.0.1/8
192.168.1.0/24
203.0.113.50
```

### Email Notifications

```ini
[DEFAULT]
# Email settings
destemail = admin@example.com
sender = fail2ban@example.com
mta = sendmail

# Action with email
action = %(action_mwl)s

# Available actions:
# %(action_)s          - ban only
# %(action_mw)s        - ban + email
# %(action_mwl)s       - ban + email with logs
```

### Persistent Bans

Create persistent bans database:

```ini
[DEFAULT]
# Store bans in database
dbfile = /var/lib/fail2ban/fail2ban.sqlite3
dbpurgeage = 86400
```

## Management Commands

### Service Management

```bash
# Start/Stop/Restart
sudo systemctl start fail2ban
sudo systemctl stop fail2ban
sudo systemctl restart fail2ban
sudo systemctl reload fail2ban

# Enable/Disable autostart
sudo systemctl enable fail2ban
sudo systemctl disable fail2ban

# Check service status
sudo systemctl status fail2ban
```

### Client Commands

```bash
# Check Fail2ban status
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd

# Ban an IP manually
sudo fail2ban-client set sshd banip 203.0.113.100

# Unban an IP
sudo fail2ban-client set sshd unbanip 203.0.113.100

# Get banned IPs
sudo fail2ban-client get sshd banned

# Reload configuration
sudo fail2ban-client reload

# Start/Stop jail
sudo fail2ban-client start sshd
sudo fail2ban-client stop sshd
```

### Testing and Verification

```bash
# Verify configuration syntax
sudo fail2ban-client -x

# Test configuration
sudo fail2ban-client -t

# Show current configuration
sudo fail2ban-client get sshd logpath
sudo fail2ban-client get sshd maxretry
sudo fail2ban-client get sshd findtime
sudo fail2ban-client get sshd bantime
```

## Integration Patterns

### UFW Integration

Fail2ban works seamlessly with UFW:

```ini
[DEFAULT]
# Use UFW for bans
banaction = ufw

# Or iptables
# banaction = iptables-multiport
```

No additional configuration needed - they complement each other.

### Multiple Servers

**Centralized ban list:**

Create `/usr/local/bin/sync-bans.sh`:

```bash
#!/bin/bash
# Sync banned IPs across servers

SERVERS="server1 server2 server3"
LOCAL_BANS=$(fail2ban-client status sshd | grep "Banned IP" | awk '{print $4}')

for server in $SERVERS; do
    for ip in $LOCAL_BANS; do
        ssh "$server" "sudo fail2ban-client set sshd banip $ip"
    done
done
```

### Slack/Discord Notifications

Create custom action `/etc/fail2ban/action.d/slack.conf`:

```ini
[Definition]
actionstart = 
actionstop = 
actioncheck = 
actionban = curl -X POST -H 'Content-type: application/json' --data '{"text":"[Fail2ban] Banned IP: <ip> on $(hostname)"}' YOUR_WEBHOOK_URL
actionunban =
```

Use in jail:
```ini
[sshd]
action = %(action_)s
         slack[name=sshd]
```

## Monitoring and Logging

### Check Fail2ban Logs

```bash
# Main Fail2ban log
sudo tail -f /var/log/fail2ban.log

# Filter for specific jail
sudo grep "sshd" /var/log/fail2ban.log | tail -20

# See recent bans
sudo grep "Ban" /var/log/fail2ban.log | tail -20

# See unbans
sudo grep "Unban" /var/log/fail2ban.log | tail -20
```

### Log Analysis Script

Create `/usr/local/bin/fail2ban-report.sh`:

```bash
#!/bin/bash
echo "=== Fail2ban Status Report ==="
echo ""

echo "Active Jails:"
fail2ban-client status | grep "Jail list" | sed 's/.*://g'
echo ""

for jail in $(fail2ban-client status | grep "Jail list" | sed 's/.*://g' | tr ',' ' '); do
    echo "=== $jail ==="
    fail2ban-client status $jail
    echo ""
done

echo "=== Recent Bans (Last 24 Hours) ==="
grep "Ban" /var/log/fail2ban.log | grep "$(date -d '24 hours ago' '+%Y-%m-%d')" | tail -20
```

### Statistics Script

```bash
#!/bin/bash
echo "=== Fail2ban Statistics ==="

echo "Total Bans Today:"
grep "$(date '+%Y-%m-%d')" /var/log/fail2ban.log | grep -c "Ban"

echo ""
echo "Top Banned IPs (All Time):"
grep "Ban" /var/log/fail2ban.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10

echo ""
echo "Bans by Jail:"
grep "Ban" /var/log/fail2ban.log | awk '{print $7}' | sort | uniq -c | sort -rn
```

## Troubleshooting

### Fail2ban Not Starting

```bash
# Check syntax
sudo fail2ban-client -t

# Check service status
sudo systemctl status fail2ban

# View detailed errors
sudo journalctl -u fail2ban -n 50 --no-pager

# Check configuration
sudo fail2ban-client -x
```

### Rules Not Working

```bash
# Verify jail is enabled
sudo fail2ban-client status

# Check jail configuration
sudo fail2ban-client get sshd logpath
sudo fail2ban-client get sshd maxretry

# Test filter
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf

# Check log file permissions
ls -la /var/log/auth.log

# Restart jail
sudo fail2ban-client reload sshd
```

### IP Not Being Banned

```bash
# Check if reaching threshold
sudo grep "Found" /var/log/fail2ban.log | grep "sshd"

# Verify filter matches log format
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf --print-all-matched

# Check if IP is whitelisted
sudo fail2ban-client get sshd ignoreip

# Manually test ban
sudo fail2ban-client set sshd banip TEST_IP
sudo fail2ban-client status sshd
```

### False Positives

```bash
# Add IP to whitelist
sudo fail2ban-client set sshd addignoreip 192.168.1.100

# Or edit jail.local
ignoreip = 127.0.0.1/8 192.168.1.0/24

# Unban incorrectly banned IP
sudo fail2ban-client set sshd unbanip 192.168.1.100
```

### Email Notifications Not Working

```bash
# Check mail configuration
echo "Test" | mail -s "Test" your-email@example.com

# Install mailutils if missing
sudo apt install -y mailutils

# Check action in jail
sudo fail2ban-client get sshd action

# Test email action
sudo fail2ban-client set sshd actionstart
```

## Best Practices

### Security Checklist

```
Fail2ban Configuration Checklist:
- [ ] SSH jail enabled and configured
- [ ] Custom SSH port specified
- [ ] Reasonable ban times (24h for SSH)
- [ ] Email notifications configured
- [ ] Whitelist your IPs
- [ ] Test filters before deployment
- [ ] Monitor logs regularly
- [ ] Backup configuration
```

### Recommended Settings

**Production SSH:**
```ini
[sshd]
enabled = true
port = 1337
maxretry = 3
bantime = 86400
findtime = 600
```

**Development SSH (more lenient):**
```ini
[sshd]
enabled = true
port = 1337
maxretry = 5
bantime = 3600
findtime = 600
```

### Common Mistakes to Avoid

1. **Don't whitelist 0.0.0.0/0** - defeats purpose
2. **Don't set bantime too low** - attackers will wait
3. **Don't forget to test filters** - use fail2ban-regex
4. **Don't edit jail.conf** - use jail.local
5. **Don't forget log rotation** - or disk fills up

## Quick Reference

```bash
# Status
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Ban/Unban
sudo fail2ban-client set sshd banip 203.0.113.100
sudo fail2ban-client set sshd unbanip 203.0.113.100

# Get banned IPs
sudo fail2ban-client get sshd banned

# Reload
sudo fail2ban-client reload

# Test filter
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf

# View logs
sudo tail -f /var/log/fail2ban.log
sudo grep "Ban" /var/log/fail2ban.log
```

This reference provides comprehensive Fail2ban configuration for Ubuntu VPS intrusion prevention.
