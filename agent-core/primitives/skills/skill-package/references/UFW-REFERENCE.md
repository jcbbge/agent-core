# UFW Firewall Reference Guide

Complete guide to UFW (Uncomplicated Firewall) configuration for Ubuntu VPS servers.

## Table of Contents
- [Basic UFW Concepts](#basic-ufw-concepts)
- [Essential Commands](#essential-commands)
- [Common Configurations](#common-configurations)
- [Advanced Rules](#advanced-rules)
- [Application Profiles](#application-profiles)
- [Troubleshooting](#troubleshooting)

## Basic UFW Concepts

UFW is a frontend for iptables designed for simplicity. It provides:
- Easy-to-understand syntax
- IPv4 and IPv6 support
- Application integration
- Logging capabilities

### Default Policies

```bash
# Deny all incoming connections
sudo ufw default deny incoming

# Allow all outgoing connections
sudo ufw default allow outgoing

# Deny forwarding (router behavior)
sudo ufw default deny routed
```

## Essential Commands

### Status and Management

```bash
# Check UFW status
sudo ufw status

# Detailed status
sudo ufw status verbose

# Numbered rules (useful for deletion)
sudo ufw status numbered

# Enable UFW
sudo ufw enable

# Disable UFW
sudo ufw disable

# Reset UFW (removes all rules)
sudo ufw reset

# Reload UFW (apply changes)
sudo ufw reload
```

### Basic Rules

```bash
# Allow port
sudo ufw allow 80

# Allow port with protocol
sudo ufw allow 80/tcp
sudo ufw allow 53/udp

# Allow port range
sudo ufw allow 6000:6007/tcp

# Allow from specific IP
sudo ufw allow from 192.168.1.100

# Allow from subnet
sudo ufw allow from 192.168.1.0/24

# Allow specific IP to specific port
sudo ufw allow from 192.168.1.100 to any port 22
```

### Deny Rules

```bash
# Deny port
sudo ufw deny 23

# Deny from specific IP
sudo ufw deny from 203.0.113.100

# Deny specific IP to specific port
sudo ufw deny from 203.0.113.100 to any port 22
```

### Delete Rules

```bash
# Delete by rule number
sudo ufw status numbered
sudo ufw delete 3

# Delete by rule specification
sudo ufw delete allow 80/tcp

# Delete specific rule
sudo ufw delete allow from 192.168.1.100
```

## Common Configurations

### Web Server (Nginx/Apache)

```bash
# HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Or use application profile
sudo ufw allow 'Nginx Full'

# HTTPS only
sudo ufw allow 'Nginx HTTPS'
```

### SSH with Custom Port

```bash
# Allow custom SSH port
sudo ufw allow 1337/tcp

# Rate limit SSH (prevent brute force)
sudo ufw limit 1337/tcp

# Delete old SSH rule if moving port
sudo ufw delete allow 22/tcp
```

### Database Servers

```bash
# PostgreSQL (restrict to specific IP)
sudo ufw allow from 192.168.1.50 to any port 5432

# MySQL (local only)
sudo ufw allow from 127.0.0.1 to any port 3306

# MongoDB (specific subnet)
sudo ufw allow from 10.0.0.0/8 to any port 27017
```

### Mail Server

```bash
# SMTP
sudo ufw allow 25/tcp

# SMTP Submission
sudo ufw allow 587/tcp

# IMAP
sudo ufw allow 143/tcp
sudo ufw allow 993/tcp  # IMAPS

# POP3
sudo ufw allow 110/tcp
sudo ufw allow 995/tcp  # POP3S
```

### Development Servers

```bash
# Node.js apps (better to proxy through nginx)
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp

# Django development
sudo ufw allow 8000/tcp

# Rails
sudo ufw allow 3000/tcp
```

## Advanced Rules

### Port Ranges

```bash
# Allow port range
sudo ufw allow 6000:6007/tcp

# Allow from specific IP to port range
sudo ufw allow from 192.168.1.100 to any port 6000:6007 proto tcp
```

### Interface-Specific Rules

```bash
# Allow on specific interface
sudo ufw allow in on eth0 to any port 80

# Allow from interface to interface
sudo ufw allow in on eth1 out on eth0
```

### Complex Rules

```bash
# Allow HTTP from specific subnet
sudo ufw allow from 192.168.1.0/24 to any port 80 proto tcp

# Allow HTTPS from multiple IPs
sudo ufw allow from 203.0.113.10 to any port 443
sudo ufw allow from 203.0.113.20 to any port 443

# Block specific service from specific IP
sudo ufw deny from 203.0.113.100 to any port 25
```

### Rate Limiting

```bash
# Rate limit SSH (default: 6 connections in 30 seconds)
sudo ufw limit 1337/tcp

# Rate limit HTTP (not recommended - use nginx)
sudo ufw limit 80/tcp
```

### Logging

```bash
# Enable logging
sudo ufw logging on

# Set log level (low, medium, high, full)
sudo ufw logging medium

# Disable logging
sudo ufw logging off

# View UFW logs
sudo tail -f /var/log/ufw.log
```

## Application Profiles

### View Available Profiles

```bash
# List all application profiles
sudo ufw app list

# Show profile information
sudo ufw app info 'Nginx Full'
```

### Common Application Profiles

```bash
# Nginx
sudo ufw allow 'Nginx Full'      # HTTP + HTTPS
sudo ufw allow 'Nginx HTTP'      # HTTP only
sudo ufw allow 'Nginx HTTPS'     # HTTPS only

# Apache
sudo ufw allow 'Apache Full'
sudo ufw allow 'Apache Secure'

# OpenSSH
sudo ufw allow 'OpenSSH'
```

### Custom Application Profiles

Create `/etc/ufw/applications.d/myapp`:

```ini
[MyApp]
title=My Application
description=Custom web application
ports=3000/tcp

[MyApp SSL]
title=My Application with SSL
description=Custom web application (HTTPS)
ports=3000/tcp|443/tcp
```

Then:
```bash
# Reload profiles
sudo ufw app update MyApp

# Allow application
sudo ufw allow 'MyApp'
```

## Complete Server Configurations

### Basic Web Server

```bash
#!/bin/bash
# Basic web server firewall setup

# Reset and set defaults
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (custom port)
sudo ufw limit 1337/tcp

# Allow web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable
sudo ufw --force enable
```

### Web + Database Server

```bash
#!/bin/bash
# Web server with database

sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH
sudo ufw limit 1337/tcp

# Web
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Database (restricted to app server)
sudo ufw allow from 192.168.1.50 to any port 5432

sudo ufw --force enable
```

### Development Server

```bash
#!/bin/bash
# Development server (more permissive)

sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH
sudo ufw limit 1337/tcp

# Web and dev servers
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp

# Database (local network only)
sudo ufw allow from 192.168.1.0/24 to any port 5432
sudo ufw allow from 192.168.1.0/24 to any port 3306

sudo ufw --force enable
```

## Security Best Practices

### Initial Setup Checklist

```
Firewall Setup Checklist:
- [ ] Set default deny incoming
- [ ] Set default allow outgoing
- [ ] Allow SSH with rate limiting
- [ ] Allow only required ports
- [ ] Restrict database ports to specific IPs
- [ ] Enable logging
- [ ] Test rules before enabling
- [ ] Document all custom rules
```

### Port Security Patterns

**Good patterns:**
```bash
# Specific port with protocol
sudo ufw allow 80/tcp

# Rate-limited SSH
sudo ufw limit 1337/tcp

# Restricted database access
sudo ufw allow from 192.168.1.0/24 to any port 5432
```

**Avoid these:**
```bash
# Too permissive
sudo ufw allow 22  # No protocol specified

# Exposing sensitive services
sudo ufw allow 3306  # MySQL to world

# No rate limiting on SSH
sudo ufw allow 22/tcp  # Should use 'limit'
```

### Monitoring and Maintenance

```bash
# Regular security checks
sudo ufw status numbered

# Review logs weekly
sudo grep "UFW" /var/log/syslog | tail -50

# Check for blocks
sudo grep "BLOCK" /var/log/ufw.log | tail -20

# Audit open ports
sudo ss -tulpn
```

## Troubleshooting

### Cannot Connect After Enabling UFW

```bash
# Disable UFW temporarily
sudo ufw disable

# Check rules
sudo ufw status numbered

# Verify SSH rule exists
sudo ufw status | grep 1337

# Re-add SSH rule
sudo ufw allow 1337/tcp

# Enable UFW
sudo ufw enable
```

### Rules Not Working

```bash
# Reload UFW
sudo ufw reload

# Check rule order (first match wins)
sudo ufw status numbered

# Check iptables directly
sudo iptables -L -n -v

# Reset if needed
sudo ufw --force reset
# Then reconfigure
```

### Locked Out of SSH

**Prevention:**
```bash
# ALWAYS test rules before closing connection
# Keep current session open
# Test in new terminal

# Method 1: Provider console access
# Use your VPS provider's web console

# Method 2: Rescue mode
# Boot into rescue mode via provider panel
# Mount filesystem
# Edit /etc/ufw/user.rules
# Or disable: ufw disable
```

### Port Still Blocked

```bash
# Check if service is listening
sudo ss -tulpn | grep :80

# Check UFW rule
sudo ufw status | grep 80

# Check application is bound correctly
sudo netstat -tlnp | grep :80

# Check iptables directly
sudo iptables -L -n | grep 80
```

### Logging Issues

```bash
# Check log location
ls -la /var/log/ufw.log

# Enable logging if disabled
sudo ufw logging on

# Increase log level
sudo ufw logging high

# View logs
sudo tail -f /var/log/ufw.log
```

## Testing Firewall Rules

### External Port Testing

```bash
# From another machine or use online tools
nmap -p 80,443,1337 your-server-ip

# Or use netcat
nc -zv your-server-ip 80
nc -zv your-server-ip 1337

# From local Mac
telnet your-server-ip 80
```

### Internal Testing

```bash
# Check listening ports
sudo ss -tulpn

# Test local connection
telnet localhost 80

# Check if firewall is filtering
sudo iptables -L -v -n
```

## Integration with Other Tools

### UFW + Fail2ban

UFW and Fail2ban work together:
- UFW: Manages static firewall rules
- Fail2ban: Manages dynamic blocks based on log analysis

No conflicts - they complement each other.

### UFW + Docker

Docker can bypass UFW rules. To fix:

Edit `/etc/ufw/after.rules`:

```bash
# Add at the end
*filter
:DOCKER-USER - [0:0]
:ufw-user-input - [0:0]

-A DOCKER-USER -j ufw-user-input
-A DOCKER-USER -j RETURN

COMMIT
```

Then reload:
```bash
sudo ufw reload
sudo systemctl restart docker
```

### UFW + Cloud Firewalls

If using cloud firewall (AWS Security Groups, DO Firewall):
- Configure cloud firewall as primary defense
- Use UFW as secondary defense
- Test both layers

## Quick Reference Commands

```bash
# Status
sudo ufw status verbose

# Enable/Disable
sudo ufw enable
sudo ufw disable

# Allow/Deny
sudo ufw allow 80/tcp
sudo ufw deny 23/tcp

# Limit (rate limit)
sudo ufw limit 22/tcp

# From specific IP
sudo ufw allow from 192.168.1.100

# To specific port from IP
sudo ufw allow from 192.168.1.100 to any port 22

# Delete rule
sudo ufw delete allow 80/tcp

# Reset all rules
sudo ufw reset

# Reload
sudo ufw reload

# Logging
sudo ufw logging on/off/low/medium/high/full
```

This reference provides comprehensive UFW configurations for Ubuntu VPS servers, from basic setups to advanced security patterns.
