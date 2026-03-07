# Monitoring and Maintenance Reference

Comprehensive guide to monitoring and maintaining Ubuntu VPS servers for self-hosting.

## Table of Contents
- [Local Monitoring](#local-monitoring)
- [External Monitoring](#external-monitoring)
- [Log Management](#log-management)
- [Backup Strategies](#backup-strategies)
- [Maintenance Workflows](#maintenance-workflows)
- [Performance Monitoring](#performance-monitoring)
- [Security Monitoring](#security-monitoring)

## Local Monitoring

### System Resource Monitoring

**Quick resource check:**
```bash
# One-liner for system status
uptime && df -h / && free -h

# More detailed
htop

# Network usage
nethogs

# Disk I/O
iotop
```

**Resource monitoring script** (`check-resources.sh` from scripts/ directory):
- Checks CPU, memory, disk usage
- Sends alerts when thresholds exceeded
- Logs trends over time
- Scheduled via cron every 5 minutes

### Log Locations

```bash
# System logs
/var/log/syslog          # General system log
/var/log/auth.log        # Authentication attempts
/var/log/kern.log        # Kernel messages
/var/log/dmesg           # Boot messages

# Security logs
/var/log/fail2ban.log    # Fail2ban activity
/var/log/ufw.log         # Firewall blocks
/var/log/security-scan.log   # Malware scans
/var/log/security-audit.log  # Security audits

# Application logs
/var/log/nginx/          # Nginx web server
/var/log/apache2/        # Apache web server
/var/log/postgresql/     # PostgreSQL
/var/log/mysql/          # MySQL/MariaDB

# Resource monitoring
/var/log/resource-monitor.log  # Resource tracking
```

### Watching Logs in Real-Time

```bash
# Follow system log
sudo tail -f /var/log/syslog

# Follow authentication log
sudo tail -f /var/log/auth.log

# Follow multiple logs
sudo tail -f /var/log/syslog /var/log/auth.log

# Filter logs
sudo tail -f /var/log/auth.log | grep "Failed"

# Last 100 lines
sudo tail -100 /var/log/auth.log

# Search logs
sudo grep "error" /var/log/syslog | tail -50
```

### Process Monitoring

```bash
# Top processes by CPU
ps aux --sort=-%cpu | head -10

# Top processes by memory
ps aux --sort=-%mem | head -10

# All processes tree
pstree -p

# Process details
sudo systemctl status SERVICE_NAME

# Kill hanging process
sudo kill -9 PID
```

## External Monitoring

### UptimeRobot (Free Tier)

**Setup:**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:
   - HTTP(S) Monitor - Check website availability
   - Port Monitor - Check specific services
   - Keyword Monitor - Check for specific content
3. Configure alerts (email, Slack, SMS)

**Recommended monitors:**
```
Monitor 1: HTTP(S) - https://yourdomain.com
Interval: 5 minutes
Alert contacts: Your email

Monitor 2: Port Monitor - SSH
Server: your-server-ip
Port: 1337
Interval: 5 minutes

Monitor 3: Port Monitor - HTTPS
Server: your-server-ip
Port: 443
Interval: 5 minutes
```

### Hetrix Tools (Free Tier)

**Features:**
- Uptime monitoring
- Blacklist monitoring
- Port monitoring
- Server monitoring agent

**Setup:**
```bash
# Install Hetrix agent
wget https://hetrixtools.com/install/hetrixtools_install.sh
sudo bash hetrixtools_install.sh YOUR_AGENT_ID

# Verify installation
sudo systemctl status hetrixtools
```

### HealthChecks.io (Free Tier)

**Cron job monitoring:**

```bash
# Create health check at healthchecks.io
# Get your ping URL

# Add to cron jobs
0 2 * * * /usr/local/bin/backup.sh && curl -fsS --retry 3 https://hc-ping.com/YOUR-UUID
```

**Example monitoring:**
```bash
# Daily backup check
0 2 * * * /usr/local/bin/backup.sh && curl https://hc-ping.com/backup-uuid

# Security scan check
0 3 * * 0 /usr/local/sbin/security-scan.sh && curl https://hc-ping.com/scan-uuid

# Update check
0 4 * * * apt update && curl https://hc-ping.com/update-uuid
```

### VPS Provider Monitoring

Most VPS providers offer built-in monitoring:

**DigitalOcean:**
- Built-in graphs (CPU, memory, disk, network)
- Alerting via email
- Monitoring API

**Vultr:**
- Bandwidth graphs
- CPU/RAM usage
- Snapshot backups

**Hostinger:**
- cPanel/hPanel monitoring
- Resource usage alerts
- Automatic backups

**Configure alerts in provider dashboard:**
- CPU usage > 90%
- Memory usage > 90%
- Disk usage > 85%
- Bandwidth nearing limit

## Log Management

### Log Rotation

Ubuntu uses logrotate by default. Configuration:

```bash
# Main config
/etc/logrotate.conf

# Application configs
/etc/logrotate.d/
```

**Custom log rotation** (`/etc/logrotate.d/custom-app`):

```bash
/var/log/custom-app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload custom-app > /dev/null 2>&1
    endscript
}
```

**Test log rotation:**
```bash
# Dry run
sudo logrotate -d /etc/logrotate.d/custom-app

# Force rotation
sudo logrotate -f /etc/logrotate.d/custom-app
```

### Log Analysis

**Failed login attempts:**
```bash
# Count failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | wc -l

# Top attacking IPs
sudo grep "Failed password" /var/log/auth.log | \
    awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10

# Failed attempts by user
sudo grep "Failed password" /var/log/auth.log | \
    awk '{print $(NF-5)}' | sort | uniq -c | sort -rn
```

**System errors:**
```bash
# Critical errors today
sudo grep "$(date '+%Y-%m-%d')" /var/log/syslog | grep -i "error"

# Count errors by type
sudo grep -i "error" /var/log/syslog | \
    awk '{print $5}' | sort | uniq -c | sort -rn | head -10
```

**Web server analysis:**
```bash
# Top requesting IPs (nginx)
awk '{print $1}' /var/log/nginx/access.log | \
    sort | uniq -c | sort -rn | head -20

# Most requested URLs
awk '{print $7}' /var/log/nginx/access.log | \
    sort | uniq -c | sort -rn | head -20

# 404 errors
grep " 404 " /var/log/nginx/access.log | \
    awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Response time stats
awk '{print $10}' /var/log/nginx/access.log | \
    sort -n | tail -100 | head -10
```

## Backup Strategies

### Automated Backup Script

Create `/usr/local/bin/backup-vps.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
HOSTNAME=$(hostname)

# Directories to backup
DIRS_TO_BACKUP=(
    "/etc"
    "/home"
    "/var/www"
    "/opt"
)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup directories
for dir in "${DIRS_TO_BACKUP[@]}"; do
    if [ -d "$dir" ]; then
        dir_name=$(basename "$dir")
        echo "Backing up $dir..."
        tar -czf "$BACKUP_DIR/${HOSTNAME}_${dir_name}_${DATE}.tar.gz" \
            "$dir" 2>/dev/null || echo "Warning: Some files in $dir could not be backed up"
    fi
done

# Backup database (if PostgreSQL)
if command -v pg_dump &> /dev/null; then
    echo "Backing up PostgreSQL databases..."
    sudo -u postgres pg_dumpall > "$BACKUP_DIR/${HOSTNAME}_postgresql_${DATE}.sql"
    gzip "$BACKUP_DIR/${HOSTNAME}_postgresql_${DATE}.sql"
fi

# Backup database (if MySQL)
if command -v mysqldump &> /dev/null; then
    echo "Backing up MySQL databases..."
    mysqldump --all-databases > "$BACKUP_DIR/${HOSTNAME}_mysql_${DATE}.sql"
    gzip "$BACKUP_DIR/${HOSTNAME}_mysql_${DATE}.sql"
fi

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"

# Send notification
curl -fsS https://hc-ping.com/YOUR-BACKUP-UUID || echo "Health check failed"
```

**Schedule backups:**
```bash
sudo chmod +x /usr/local/bin/backup-vps.sh

# Daily backups at 2 AM
sudo crontab -e
0 2 * * * /usr/local/bin/backup-vps.sh >> /var/log/backup.log 2>&1
```

### Remote Backup (Rsync to Mac)

```bash
# From your Mac, pull backups
rsync -avz --progress \
    --delete \
    myvps:/backups/ \
    ~/VPS-Backups/$(date +%Y-%m)/

# Or automated script on Mac
#!/bin/bash
mkdir -p ~/VPS-Backups/$(date +%Y-%m)
rsync -avz --progress myvps:/backups/ ~/VPS-Backups/$(date +%Y-%m)/
```

### VPS Provider Snapshots

**DigitalOcean:**
```bash
# Weekly snapshots via API or dashboard
# Enable automatic weekly snapshots in settings
```

**Vultr:**
```bash
# Scheduled snapshots via dashboard
# Keep 2-4 rolling snapshots
```

**Best practice:**
- Automated local backups (daily)
- Pull to local machine (weekly)
- VPS provider snapshots (weekly)
- Test restoration quarterly

## Maintenance Workflows

### Weekly Maintenance Checklist

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "=== Weekly Maintenance $(date) ===" | tee -a /var/log/maintenance.log

# Update package lists
echo "Checking for updates..."
apt update

# List available updates
UPDATE_COUNT=$(apt list --upgradable 2>/dev/null | grep -v "Listing" | wc -l)
echo "Available updates: $UPDATE_COUNT"

# Disk usage check
echo "Disk usage:"
df -h | grep -vE "tmpfs|devtmpfs"

# Memory usage
echo "Memory usage:"
free -h

# Check failed logins
echo "Failed login attempts (last 7 days):"
grep "Failed password" /var/log/auth.log | wc -l

# Check Fail2ban status
echo "Fail2ban banned IPs:"
fail2ban-client status sshd | grep "Banned"

# Check service status
echo "Critical services:"
systemctl status nginx --no-pager -l || echo "Nginx not installed"
systemctl status postgresql --no-pager -l || echo "PostgreSQL not installed"

# Large files/directories
echo "Largest directories:"
du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10

echo "=== Maintenance Complete ===" | tee -a /var/log/maintenance.log
```

### Monthly Tasks

```
Monthly Maintenance Checklist:
- [ ] Review security audit logs
- [ ] Test backup restoration
- [ ] Check SSL certificate expiration
- [ ] Review and rotate SSH keys (if needed)
- [ ] Clean up old log files
- [ ] Review user accounts
- [ ] Check for abandoned services
- [ ] Update documentation
- [ ] Review monitoring alerts
- [ ] Test disaster recovery plan
```

### Update Management

```bash
# Check for updates
sudo apt update
sudo apt list --upgradable

# Security updates only
sudo apt upgrade -y --security-only

# Full upgrade
sudo apt upgrade -y
sudo apt full-upgrade -y

# Clean up
sudo apt autoremove -y
sudo apt autoclean

# Check if reboot needed
[ -f /var/run/reboot-required ] && echo "Reboot required"
```

## Performance Monitoring

### System Performance

```bash
# System load (1, 5, 15 minute averages)
uptime

# CPU information
lscpu
cat /proc/cpuinfo | grep "model name" | head -1

# Memory usage
free -h
vmstat 1 5

# Disk I/O
iostat -x 1 5

# Network stats
ifconfig
ss -s
```

### Application Performance

**Nginx:**
```bash
# Connection stats
ss -s

# Active connections
netstat -an | grep :80 | wc -l

# Nginx status (if configured)
curl http://localhost/nginx_status
```

**Database:**
```bash
# PostgreSQL connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# MySQL connections
mysql -e "SHOW STATUS LIKE 'Threads_connected';"

# Slow queries (PostgreSQL)
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Performance Benchmarking

```bash
# Disk performance
sudo hdparm -tT /dev/sda

# Network throughput (to another server)
iperf3 -c remote-server

# Web server performance
ab -n 1000 -c 10 http://localhost/
```

## Security Monitoring

### Automated Security Audit

Use `security-audit.sh` from scripts/ directory for comprehensive weekly audits:
- System updates status
- SSH configuration check
- Firewall status
- Open ports
- User accounts
- Failed logins
- Fail2ban status
- File permissions
- Running processes

### Real-Time Threat Monitoring

```bash
# Watch authentication attempts
sudo tail -f /var/log/auth.log | grep --line-buffered "Failed"

# Watch Fail2ban bans
sudo tail -f /var/log/fail2ban.log | grep --line-buffered "Ban"

# Watch firewall blocks
sudo tail -f /var/log/ufw.log | grep --line-buffered "BLOCK"
```

### Security Metrics

```bash
# Failed login attempts (last 24h)
sudo grep "$(date '+%Y-%m-%d')" /var/log/auth.log | \
    grep "Failed password" | wc -l

# Currently banned IPs
sudo fail2ban-client status sshd | grep "Total banned" | awk '{print $4}'

# Open connections
sudo ss -tunap | grep ESTABLISHED | wc -l

# Listening services
sudo ss -tulpn | grep LISTEN
```

## Alerting Strategies

### Email Alerts

Configure in scripts:
- Set `ALERT_EMAIL` environment variable
- Or edit scripts to include your email

### Slack/Discord Webhooks

```bash
# In monitoring scripts, add:
send_alert() {
    MESSAGE="$1"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        YOUR_WEBHOOK_URL
}

# Usage:
send_alert "High CPU usage detected on $(hostname)"
```

### SMS Alerts (via Twilio)

```bash
# Install twilio CLI
pip3 install twilio

# Send SMS
python3 << EOF
from twilio.rest import Client
client = Client("ACCOUNT_SID", "AUTH_TOKEN")
message = client.messages.create(
    body="Alert from $(hostname): High memory usage",
    from_="+1234567890",
    to="+0987654321"
)
EOF
```

## Monitoring Dashboard (Local)

### Install Netdata (Optional)

```bash
# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access via SSH tunnel
ssh -L 19999:localhost:19999 myvps

# Open browser: http://localhost:19999
```

### Simple Status Page

Create `/var/www/html/status.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Server Status</title>
    <meta http-equiv="refresh" content="60">
</head>
<body>
    <h1>Server Status</h1>
    <pre id="status"></pre>
    <script>
        fetch('/status.json')
            .then(r => r.json())
            .then(d => document.getElementById('status').textContent = JSON.stringify(d, null, 2));
    </script>
</body>
</html>
```

Generate status JSON via cron:
```bash
*/1 * * * * /usr/local/bin/generate-status.sh > /var/www/html/status.json
```

## Quick Reference

```bash
# System health
uptime && df -h / && free -h

# Recent errors
sudo grep "error" /var/log/syslog | tail -20

# Failed logins
sudo grep "Failed" /var/log/auth.log | tail -20

# Banned IPs
sudo fail2ban-client status sshd

# Disk usage
du -h --max-depth=1 / | sort -hr | head -10

# Top processes
ps aux --sort=-%cpu | head -10

# Network connections
ss -tunap | grep ESTABLISHED

# Service status
systemctl status SERVICE_NAME
```

This comprehensive monitoring guide ensures your Ubuntu VPS stays healthy, secure, and performant for self-hosting applications.
