# Fail2ban Configuration Reference

Complete guide to Fail2ban intrusion prevention for Ubuntu VPS servers.

## Management Commands

```bash
# Check Fail2ban status
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd

# Ban/Unban IP
sudo fail2ban-client set sshd banip 203.0.113.100
sudo fail2ban-client set sshd unbanip 203.0.113.100

# Reload configuration
sudo fail2ban-client reload
```

This reference provides comprehensive Fail2ban configuration for Ubuntu VPS intrusion prevention.
