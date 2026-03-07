# Monitoring and Maintenance Reference

Comprehensive guide to monitoring and maintaining Ubuntu VPS servers for self-hosting.

## Local Monitoring

### Quick Commands

```bash
# System status
uptime && df -h / && free -h

# Resource monitoring
htop

# Check logs
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/syslog
```

## External Monitoring Services

### Recommended Services

- **UptimeRobot**: Free HTTP/HTTPS/port monitoring
- **Hetrix Tools**: Uptime and blacklist monitoring
- **HealthChecks.io**: Cron job monitoring

This reference provides monitoring and maintenance guidance for Ubuntu VPS servers.
