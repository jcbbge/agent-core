#!/bin/bash
#
# security-audit.sh - Comprehensive security audit
#
# Usage: sudo /usr/local/sbin/security-audit.sh
# Schedule: 0 0 * * 0 (Sundays at midnight via cron)

set -euo pipefail

# Configuration
LOG_FILE="/var/log/security-audit.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Start audit log
{
    echo "=================================================="
    echo "Security Audit Report"
    echo "Hostname: $(hostname)"
    echo "Date: $TIMESTAMP"
    echo "=================================================="
    echo ""

    # System information
    echo "=== System Information ==="
    echo "OS: $(lsb_release -d | cut -f2)"
    echo "Kernel: $(uname -r)"
    echo "Uptime: $(uptime -p 2>/dev/null || uptime | awk '{print $3,$4}')"
    echo ""

    # Check for available updates
    echo "=== Available Updates ==="
    UPDATE_COUNT=$(apt list --upgradable 2>/dev/null | grep -v "^Listing" | wc -l)
    echo "Packages available for update: $UPDATE_COUNT"
    if [ "$UPDATE_COUNT" -gt 0 ]; then
        echo "Updates available:"
        apt list --upgradable 2>/dev/null | grep -v "^Listing" | head -20
    fi
    echo ""

    # SSH configuration check
    echo "=== SSH Configuration ==="
    echo "Port: $(grep -E "^Port" /etc/ssh/sshd_config || echo "22 (default)")"
    echo "PermitRootLogin: $(grep -E "^PermitRootLogin" /etc/ssh/sshd_config || echo "Not set")"
    echo "PasswordAuthentication: $(grep -E "^PasswordAuthentication" /etc/ssh/sshd_config || echo "Not set")"
    echo "PubkeyAuthentication: $(grep -E "^PubkeyAuthentication" /etc/ssh/sshd_config || echo "Not set")"
    echo ""

    # Firewall status
    echo "=== Firewall Status (UFW) ==="
    ufw status verbose 2>/dev/null || echo "UFW not installed or not configured"
    echo ""

    # Listening services
    echo "=== Open Ports and Listening Services ==="
    ss -tulpn | grep LISTEN || netstat -tulpn | grep LISTEN || echo "Could not determine listening ports"
    echo ""

    # User accounts
    echo "=== User Accounts ==="
    echo "Users with shell access:"
    grep -v '/nologin\|/false' /etc/passwd | cut -d: -f1,7
    echo ""
    echo "Users in sudo group:"
    getent group sudo
    echo ""

    # Failed login attempts (last 24 hours)
    echo "=== Failed Login Attempts (Last 50) ==="
    grep "Failed password" /var/log/auth.log | tail -50 || echo "No failed login attempts found"
    echo ""

    # Successful logins (last 20)
    echo "=== Recent Successful Logins ==="
    last -20 | head -20
    echo ""

    # Fail2ban status
    echo "=== Fail2ban Status ==="
    if command -v fail2ban-client &> /dev/null; then
        fail2ban-client status
        echo ""
        echo "SSH jail status:"
        fail2ban-client status sshd 2>/dev/null || echo "SSH jail not configured"
    else
        echo "Fail2ban not installed"
    fi
    echo ""

    # Check for world-writable files in critical directories
    echo "=== World-Writable Files (Critical Directories) ==="
    CRITICAL_DIRS="/etc /usr/bin /usr/sbin /bin /sbin"
    WORLD_WRITABLE=$(find $CRITICAL_DIRS -type f -perm -002 2>/dev/null | head -10)
    if [ -n "$WORLD_WRITABLE" ]; then
        echo "Warning: World-writable files found:"
        echo "$WORLD_WRITABLE"
    else
        echo "No world-writable files found in critical directories"
    fi
    echo ""

    # Check for files with SUID bit
    echo "=== SUID/SGID Files ==="
    echo "Recent changes to SUID/SGID files (last 30 days):"
    find / -type f \( -perm -4000 -o -perm -2000 \) -mtime -30 2>/dev/null | head -20 || echo "No recent changes"
    echo ""

    # Disk usage
    echo "=== Disk Usage ==="
    df -h | grep -vE "tmpfs|devtmpfs|Filesystem"
    echo ""

    # Memory usage
    echo "=== Memory Usage ==="
    free -h
    echo ""

    # Running processes (top 10 by CPU)
    echo "=== Top Processes (CPU) ==="
    ps aux --sort=-%cpu | head -11
    echo ""

    # Cron jobs for root
    echo "=== Scheduled Tasks (root crontab) ==="
    crontab -l 2>/dev/null || echo "No crontab for root"
    echo ""

    # Check system logs for errors (last hour)
    echo "=== Recent System Errors ==="
    journalctl -p err --since "1 hour ago" --no-pager | tail -20 || echo "No recent errors"
    echo ""

    # Security package status
    echo "=== Security Tools Status ==="
    echo "ClamAV: $(dpkg -l | grep clamav | head -1 | awk '{print $2, $3}' || echo "Not installed")"
    echo "rkhunter: $(dpkg -l | grep rkhunter | head -1 | awk '{print $2, $3}' || echo "Not installed")"
    echo "fail2ban: $(dpkg -l | grep fail2ban | head -1 | awk '{print $2, $3}' || echo "Not installed")"
    echo "ufw: $(dpkg -l | grep "^ii  ufw" | awk '{print $2, $3}' || echo "Not installed")"
    echo ""

    # End of audit
    echo "=================================================="
    echo "Audit Completed: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================================="
    echo ""

} > "$LOG_FILE" 2>&1

# Check for critical issues and send notification
CRITICAL_ISSUES=0
CRITICAL_MESSAGE=""

# Check if root login is enabled
if grep -q "^PermitRootLogin yes" /etc/ssh/sshd_config 2>/dev/null; then
    CRITICAL_ISSUES=1
    CRITICAL_MESSAGE="${CRITICAL_MESSAGE}- Root login via SSH is ENABLED (security risk)
"
fi

# Check if password authentication is enabled
if grep -q "^PasswordAuthentication yes" /etc/ssh/sshd_config 2>/dev/null; then
    CRITICAL_ISSUES=1
    CRITICAL_MESSAGE="${CRITICAL_MESSAGE}- Password authentication is ENABLED (security risk)
"
fi

# Check if firewall is disabled
if ! ufw status 2>/dev/null | grep -q "Status: active"; then
    CRITICAL_ISSUES=1
    CRITICAL_MESSAGE="${CRITICAL_MESSAGE}- UFW firewall is NOT active
"
fi

# Check if there are many available updates
UPDATE_COUNT=$(apt list --upgradable 2>/dev/null | grep -v "^Listing" | wc -l)
if [ "$UPDATE_COUNT" -gt 20 ]; then
    CRITICAL_ISSUES=1
    CRITICAL_MESSAGE="${CRITICAL_MESSAGE}- ${UPDATE_COUNT} package updates available (recommend updating)
"
fi

# Send notification if critical issues found
if [ "$CRITICAL_ISSUES" -eq 1 ]; then
    SUBJECT="Security Audit Alert: $(hostname)"
    BODY="Security Audit Alert - $(hostname)
Time: $TIMESTAMP

Critical Issues Found:
${CRITICAL_MESSAGE}

Please review the full audit log at: $LOG_FILE
"
    
    echo "$BODY" | mail -s "$SUBJECT" "${ALERT_EMAIL:-root@localhost}" 2>/dev/null || \
        echo "$TIMESTAMP - Warning: Could not send email notification" >> "$LOG_FILE"
fi

# Keep only last 5 audit logs
AUDIT_DIR=$(dirname "$LOG_FILE")
AUDIT_BASE=$(basename "$LOG_FILE" .log)
cd "$AUDIT_DIR"
ls -t "${AUDIT_BASE}"* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

exit 0
