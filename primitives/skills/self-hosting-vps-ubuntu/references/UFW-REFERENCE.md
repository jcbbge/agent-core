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
