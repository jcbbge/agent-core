#!/bin/bash
#
# security-scan.sh - Automated security scanning with ClamAV and rkhunter
# 
# Usage: sudo /usr/local/sbin/security-scan.sh
# Schedule: 0 3 * * 0 (Sundays at 3 AM via cron)

set -euo pipefail

# Configuration
LOG_FILE="/var/log/security-scan.log"
EMAIL="${SECURITY_EMAIL:-root@localhost}"
SCAN_DIRECTORIES="/home /var/www /tmp /var/tmp"

# Start logging
{
    echo "============================================"
    echo "Security Scan Started: $(date)"
    echo "============================================"
    echo ""

    # ClamAV scan
    echo "=== ClamAV Malware Scan ==="
    echo "Scanning directories: $SCAN_DIRECTORIES"
    echo ""
    
    for dir in $SCAN_DIRECTORIES; do
        if [ -d "$dir" ]; then
            echo "Scanning $dir..."
            clamscan -r --infected --no-summary "$dir" 2>&1 || true
        fi
    done
    
    echo ""
    echo "ClamAV scan completed"
    echo ""

    # Rootkit Hunter scan
    echo "=== Rootkit Hunter Check ==="
    rkhunter --check --skip-keypress --report-warnings-only 2>&1 || true
    echo ""
    echo "Rootkit Hunter check completed"
    echo ""

    # Summary
    echo "============================================"
    echo "Security Scan Completed: $(date)"
    echo "============================================"
    echo ""

} >> "$LOG_FILE" 2>&1

# Check for infections and send alert if found
if grep -qi "infected files: [1-9]" "$LOG_FILE" || \
   grep -qi "warning:" "$LOG_FILE" | tail -20 | grep -qi "warning:"; then
    
    # Extract recent findings
    FINDINGS=$(tail -100 "$LOG_FILE" | grep -i "infected\|warning" || echo "See full log")
    
    # Send email notification
    echo "Security Alert - $(hostname)

Timestamp: $(date)

Recent findings:
$FINDINGS

Full log available at: $LOG_FILE
" | mail -s "Security Alert: $(hostname)" "$EMAIL" 2>/dev/null || \
    echo "Warning: Could not send email notification. Install mailutils if needed."
fi

# Rotate log if it gets too large (> 10MB)
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "Log rotated at $(date)" > "$LOG_FILE"
fi

exit 0
