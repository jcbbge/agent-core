#!/bin/bash
#
# check-resources.sh - Monitor system resources and send alerts
#
# Usage: /usr/local/sbin/check-resources.sh
# Schedule: */5 * * * * (every 5 minutes via cron)

set -euo pipefail

# Configuration
THRESHOLD_CPU=90
THRESHOLD_MEMORY=90
THRESHOLD_DISK=85
EMAIL="${ALERT_EMAIL:-root@localhost}"
LOG_FILE="/var/log/resource-monitor.log"

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check CPU load (1-minute average as percentage of cores)
CPU_CORES=$(nproc)
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_PERCENT=$(echo "$CPU_LOAD $CPU_CORES" | awk '{printf "%.0f", ($1/$2)*100}')

# Check memory usage
MEMORY_PERCENT=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')

# Check disk usage (root partition)
DISK_PERCENT=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

# Check swap usage
SWAP_TOTAL=$(free | grep Swap | awk '{print $2}')
if [ "$SWAP_TOTAL" -gt 0 ]; then
    SWAP_PERCENT=$(free | grep Swap | awk '{printf "%.0f", $3/$2 * 100}')
else
    SWAP_PERCENT=0
fi

# Log current status
echo "$TIMESTAMP - CPU: ${CPU_PERCENT}% | Memory: ${MEMORY_PERCENT}% | Disk: ${DISK_PERCENT}% | Swap: ${SWAP_PERCENT}%" >> "$LOG_FILE"

# Check thresholds and send alerts
ALERT_TRIGGERED=0
ALERT_MESSAGE=""

if [ "$CPU_PERCENT" -gt "$THRESHOLD_CPU" ]; then
    ALERT_TRIGGERED=1
    ALERT_MESSAGE="${ALERT_MESSAGE}CPU Load: ${CPU_PERCENT}% (threshold: ${THRESHOLD_CPU}%)
"
    # Get top CPU processes
    TOP_PROCESSES=$(ps aux --sort=-%cpu | head -6 | tail -5)
    ALERT_MESSAGE="${ALERT_MESSAGE}Top CPU processes:
${TOP_PROCESSES}

"
fi

if [ "$MEMORY_PERCENT" -gt "$THRESHOLD_MEMORY" ]; then
    ALERT_TRIGGERED=1
    ALERT_MESSAGE="${ALERT_MESSAGE}Memory Usage: ${MEMORY_PERCENT}% (threshold: ${THRESHOLD_MEMORY}%)
"
    # Get top memory processes
    TOP_MEMORY=$(ps aux --sort=-%mem | head -6 | tail -5)
    ALERT_MESSAGE="${ALERT_MESSAGE}Top memory processes:
${TOP_MEMORY}

"
fi

if [ "$DISK_PERCENT" -gt "$THRESHOLD_DISK" ]; then
    ALERT_TRIGGERED=1
    ALERT_MESSAGE="${ALERT_MESSAGE}Disk Usage: ${DISK_PERCENT}% (threshold: ${THRESHOLD_DISK}%)
"
    # Get largest directories
    LARGE_DIRS=$(du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10 || echo "Could not analyze directories")
    ALERT_MESSAGE="${ALERT_MESSAGE}Largest directories:
${LARGE_DIRS}

"
fi

# Send alert if any threshold exceeded
if [ "$ALERT_TRIGGERED" -eq 1 ]; then
    echo "$TIMESTAMP - ALERT: Resource threshold exceeded" >> "$LOG_FILE"
    
    # Compose email
    SUBJECT="Resource Alert: $(hostname)"
    BODY="Resource Alert on $(hostname)
Time: $TIMESTAMP

Current Status:
- CPU Load: ${CPU_PERCENT}% (${CPU_CORES} cores)
- Memory: ${MEMORY_PERCENT}%
- Disk (/): ${DISK_PERCENT}%
- Swap: ${SWAP_PERCENT}%

Details:
${ALERT_MESSAGE}

Server: $(hostname)
Uptime: $(uptime -p 2>/dev/null || uptime | awk '{print $3,$4}')
"
    
    # Send email notification
    echo "$BODY" | mail -s "$SUBJECT" "$EMAIL" 2>/dev/null || \
        echo "$TIMESTAMP - Warning: Could not send email. Install mailutils if needed." >> "$LOG_FILE"
fi

# Rotate log if it gets too large (> 5MB)
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt 5242880 ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "$TIMESTAMP - Log rotated" > "$LOG_FILE"
fi

exit 0
