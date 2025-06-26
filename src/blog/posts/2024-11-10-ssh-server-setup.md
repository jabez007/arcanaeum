---
title: SSH Server Setup
date: 2024-11-10
author: jabez007
tags:
  - homelab
  - ssh
  - ufw
  - linux
  - server-setup
  - security
  - home-network
  - firewall
  - ssh-hardening
  - tutorial
  - beginner-friendly
excerpt: |
  Like many of you in the homelab community, I have a soft spot for old hardware.
  That laptop collecting dust might seem obsolete for daily use,
  but it's actually perfect for a home lab — especially when repurposed as an SSH-accessible Linux server.
featured: true
draft: true
---

# Breathing New Life into an Old Laptop: An SSH Server for Your Home Lab

🖥️ _That dusty ThinkPad in your closet? It's about to become your new favorite server._

Like many of you in the homelab community, I have a soft spot for old hardware.
That laptop collecting dust might seem obsolete for daily use,
but it's actually perfect for a home lab — especially when repurposed as an SSH-accessible Linux server.

Today I'll walk you through transforming forgotten hardware into a reliable, secure SSH server.
We'll cover everything from basic setup to hardening, plus I've included a script to automate the whole process.
Whether you're just starting your homelab journey or adding another node to your existing setup, this guide has you covered.

**What you'll need:**

- An old laptop (pretty much anything from the last 10 years will work)
  - I've even done this on a Gateway from 2010 with _only_ 4 GB of RAM
- A fresh Linux installation (Ubuntu, Debian, or similar)
- 20 minutes of your time

---

## 🚀 Step 1: Install OpenSSH Server

First things first — we need SSH access to the machine.
Most Linux distros ship with the SSH _client_ pre-installed, but not always the _server_ component.
Think of it this way: the client lets you connect to other machines, but the server lets other machines connect to you.

On Debian-based distros (Ubuntu, Linux Mint, Pop!\_OS, etc.):

```bash
sudo apt update
sudo apt install openssh-server
```

Let's verify it's running:

```bash
sudo systemctl status ssh
```

If you see "active (running)" in green, congratulations!
Your laptop is now listening for SSH connections on port 22.
But don't celebrate just yet — we're about to make it much more secure.

---

## 🔒 Step 2: Harden Your SSH Configuration

Here's where most tutorials stop, but we're just getting started.
Default SSH configurations are functional but not secure.
We're going to fix that.

**Why change the default port?**
While security through obscurity isn't a complete solution, it dramatically reduces automated attack noise.
Bots constantly scan port 22, so moving to a custom port gives you cleaner logs and fewer intrusion attempts.

Edit the SSH server configuration:

```bash
sudo nano /etc/ssh/sshd_config
```

Update or add these lines:

```toml
Port 2222                    # Custom port (use any port 1024-65535)
PermitRootLogin no           # Root access = unnecessary risk
MaxAuthTries 3               # Limit brute-force attempts
PasswordAuthentication yes   # We'll keep this for now (see note below)
LoginGraceTime 30s           # Don't let connections hang forever
ClientAliveInterval 300      # Keep connections alive
ClientAliveCountMax 2        # But not indefinitely
```

> **Pro tip:** Planning to access this server from outside your network?
> Set `PasswordAuthentication no` and use SSH keys instead.
> It's more secure and honestly more convenient once you're used to it.

After saving your changes:

```bash
sudo systemctl restart ssh
```

Test from another machine on your network:

```bash
ssh yourusername@192.168.1.100 -p 2222
```

Replace the IP with your server's actual IP address.
If you can connect, you're golden!

---

## 🛡️ Step 3: Install UFW (Because Firewalls Matter)

Even if this server lives safely inside your network, defense in depth is a good habit.
UFW (Uncomplicated Firewall) lives up to its name — it's iptables made simple.

```bash
sudo apt install ufw
```

---

## 🔧 Step 4: Configure Your Firewall Like a Pro

Before enabling UFW, we'll set sensible defaults.
The last thing you want is to lock yourself out of your own server!

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

This configuration means:

- **Deny incoming**: Block all inbound connections by default
- **Allow outgoing**: Let your server make outbound connections (for updates, etc.)

Now allow SSH on your custom port:

```bash
sudo ufw allow 2222/tcp
```

Enable the firewall:

```bash
sudo ufw enable
```

Check your handiwork:

```bash
sudo ufw status verbose
```

You should see something like:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW IN    Anywhere
2222/tcp (v6)              ALLOW IN    Anywhere (v6)
```

Perfect! Your server is now locked down tight, with only SSH access allowed.

---

## 📈 Level Up Your Setup (Bonus Tips)

### Set a Static IP or DHCP Reservation

Nothing's more frustrating than a server that changes IP addresses.
Either configure a static IP on the server itself,
or (better yet) set up a DHCP reservation on your router.
Your future self will thank you.

### Give Your Server a Proper Hostname

Generic hostnames are boring.
Let's fix that:

```bash
sudo hostnamectl set-hostname lab-server-01
```

Make it permanent by adding it to `/etc/hosts`:

```bash
echo "127.0.1.1 lab-server-01" | sudo tee -a /etc/hosts
```

Refresh your shell:

```bash
exec bash
```

### Consider SSH Key Authentication

If you're comfortable with it, SSH keys are both more secure and more convenient than passwords.
Generate a key pair, copy the public key to your server, then disable password authentication in `sshd_config`.
Your connections will be faster and more secure.

---

## 🎯 The Big Picture

What you've just built isn't just an SSH server — it's the foundation of your home lab infrastructure.
This little machine can now serve as:

- A development environment for testing code
- A file server using tools like Nextcloud or Samba
- A monitoring station running Prometheus or Grafana
- A jump box for accessing other network resources
- A learning platform for system administration

The beauty of repurposing old hardware is that you can experiment fearlessly.
Break something?
No problem — you're not risking your main workstation.

---

## 🤖 Automate Everything (Because We're Lazy in the Best Way)

If you're setting up multiple servers or just want to save time, here's a script that automates the entire process.
It handles SSH configuration, firewall setup, and basic hardening with customizable options.

### `setup-ssh-server.sh`

```bash
#!/bin/bash

set -e

# Color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SSH_PORT=2222
HOSTNAME="lab-server"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      SSH_PORT="$2"
      shift 2
      ;;
    --hostname)
      HOSTNAME="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--port PORT] [--hostname HOSTNAME]"
      echo ""
      echo "Options:"
      echo "  --port     Set custom SSH port (default: 2222)"
      echo "  --hostname Set server hostname (default: lab-server)"
      echo "  -h, --help Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🛠  SSH Server Setup Script${NC}"
echo -e "${YELLOW}📡 Using SSH port: $SSH_PORT${NC}"
echo -e "${YELLOW}🖥  Setting hostname to: $HOSTNAME${NC}"
echo ""

# Install required packages
echo -e "${BLUE}📦 Installing required packages...${NC}"
sudo apt update -qq
sudo apt install -y openssh-server ufw

# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# SSH configuration hardening
echo -e "${BLUE}🔒 Hardening SSH configuration...${NC}"
sudo sed -i "s/^#\?Port .*/Port $SSH_PORT/" /etc/ssh/sshd_config
sudo sed -i "s/^#\?PermitRootLogin .*/PermitRootLogin no/" /etc/ssh/sshd_config
sudo sed -i "s/^#\?MaxAuthTries .*/MaxAuthTries 3/" /etc/ssh/sshd_config

# Add additional hardening options if they don't exist
grep -qxF 'LoginGraceTime 30s' /etc/ssh/sshd_config || echo 'LoginGraceTime 30s' | sudo tee -a /etc/ssh/sshd_config > /dev/null
grep -qxF 'ClientAliveInterval 300' /etc/ssh/sshd_config || echo 'ClientAliveInterval 300' | sudo tee -a /etc/ssh/sshd_config > /dev/null
grep -qxF 'ClientAliveCountMax 2' /etc/ssh/sshd_config || echo 'ClientAliveCountMax 2' | sudo tee -a /etc/ssh/sshd_config > /dev/null

# Restart SSH service
echo -e "${BLUE}🔄 Restarting SSH service...${NC}"
sudo systemctl restart ssh

# Configure UFW firewall
echo -e "${BLUE}🛡️  Configuring firewall...${NC}"
sudo ufw --force default deny incoming
sudo ufw --force default allow outgoing
sudo ufw --force allow "${SSH_PORT}/tcp"
sudo ufw --force enable

# Set hostname
echo -e "${BLUE}🏷️  Setting hostname...${NC}"
sudo hostnamectl set-hostname "$HOSTNAME"
grep -q "127.0.1.1.*$HOSTNAME" /etc/hosts || echo "127.0.1.1 $HOSTNAME" | sudo tee -a /etc/hosts > /dev/null

# Display completion message
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}📡 SSH is now running on port $SSH_PORT${NC}"
echo -e "${GREEN}💻 Hostname set to $HOSTNAME${NC}"
echo -e "${GREEN}🛡️  Firewall is active and configured${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test SSH connection: ssh $(whoami)@$(hostname -I | awk '{print $1}') -p $SSH_PORT"
echo "2. Consider setting up SSH key authentication"
echo "3. Set a static IP or DHCP reservation for this server"
```

### Usage Examples

Run with default settings:

```bash
chmod +x setup-ssh-server.sh
./setup-ssh-server.sh
```

Customize the port and hostname:

```bash
./setup-ssh-server.sh --port 2244 --hostname webnode-01
```

The script includes colored output, error handling, and helpful next steps. Perfect for consistent deployments across multiple machines.

---

## 🎉 Wrapping Up

You've just transformed an old laptop into a secure, accessible server that's ready for whatever your home lab throws at it.
More importantly, you've learned the fundamentals of SSH hardening and firewall configuration — skills that transfer directly to managing production servers.

What started as forgotten hardware is now a valuable piece of infrastructure.
Whether you use it for development, file sharing, monitoring, or just SSH practice, you've given that old laptop a new purpose.

Got questions or improvements to suggest?
Drop them in the comments — the home lab community thrives on shared knowledge and creative solutions.
Happy homelabbing!

---

> _Pro tip: Document your server's IP address, SSH port, and any special configurations in a simple text file or password manager.
> Your future self (especially at 2 AM when something breaks) will be grateful._
