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
  Don't throw away that old laptop just yet. It might not be your daily driver anymore,
  but it's a perfect candidate for a secure, SSH-accessible Linux box for your homelab.
featured: true
draft: false
---

# Repurposing an Old Laptop as an SSH Server

🖥️ _That dusty ThinkPad in your closet? It's about to become your new favorite server._

I have a hard time throwing away old hardware. That laptop gathering dust might not be your daily driver anymore, but it's perfect for a homelab—especially if you just need an SSH-accessible Linux box to poke around in.

In this guide, I'll show you how to set up and harden an SSH server on old hardware. I've also included a script at the end if you just want to get it done.

**What you'll need:**

- An old laptop (anything from the last decade should work)
  - For context, I've run this on an old Gateway with 4 GB of RAM
- A fresh Linux installation (Ubuntu, Debian, or similar)
- About 20 minutes

---

## 🚀 Step 1: Install OpenSSH Server

First, you need the SSH server software. Most Linux distros come with the client (to connect *from*), but you often have to install the server (to connect *to*) yourself.

On Debian-based distros:

```bash
sudo apt update
sudo apt install openssh-server
```

Check the service status:

```bash
sudo systemctl status ssh
```

If the status shows "active (running)," you're ready to go. Your laptop is now listening for connections on port 22, which we'll want to change soon for better security.

---

## 🔒 Step 2: Harden Your SSH Configuration

Default SSH settings are okay, but they're not great for security. Changing a few lines in the config file makes your server a lot harder to poke at.

**Why change the default port?**
Security through obscurity isn't a silver bullet, but it stops a lot of the background noise from bots. Most bots just scan port 22; moving to something like 2222 keeps your logs a lot cleaner.

Edit the config file:

```bash
sudo nano /etc/ssh/sshd_config
```

Change these lines:

```toml
Port 2222                    # Custom port (use any port 1024-65535)
PermitRootLogin no           # Don't let root login directly
MaxAuthTries 3               # Limit brute-force attempts
PasswordAuthentication yes   # Keeping this simple for now
LoginGraceTime 30s           # Kill dead connections fast
ClientAliveInterval 300      # Heartbeat to keep you connected
ClientAliveCountMax 2        # Kill it if the heartbeat fails twice
```

> **A note on passwords:** If you're planning to access this from outside your local network, switch `PasswordAuthentication` to `no` and use SSH keys. It's much safer.

Restart SSH to apply:

```bash
sudo systemctl restart ssh
```

Test it from another machine:

```bash
ssh yourusername@192.168.1.100 -p 2222
```

Replace the IP with your server's actual address. If it asks for your password, you're set.

---

## 🛡️ Step 3: Install UFW

A firewall is a basic layer of defense. Even inside your network, it's worth setting up. UFW (Uncomplicated Firewall) is just a simpler wrapper for `iptables`.

```bash
sudo apt install ufw
```

---

## 🔧 Step 4: Configure the Firewall

Before turning it on, make sure you don't lock yourself out. We'll set some sensible defaults first.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

This blocks everything coming in but lets the server reach out for updates.

Now, tell the firewall to allow SSH on your custom port:

```bash
sudo ufw allow 2222/tcp
```

Enable it:

```bash
sudo ufw enable
```

Check the status:

```bash
sudo ufw status verbose
```

You should see:

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

The server is now blocked to everything except your SSH port.

---

## 📈 Extra Tweaks

### Set a Static IP or DHCP Reservation

Nothing's more frustrating than trying to connect to a server that just changed its IP. You should either set a static IP on the server itself or (my preference) set up a DHCP reservation in your router's settings. This saves you from hunting for the IP every time you reboot.

### Set a Hostname

By default, the machine might have a generic name. You can change it to something recognizable:

```bash
sudo hostnamectl set-hostname lab-server-01
```

To make it permanent, update `/etc/hosts`:

```bash
echo "127.0.1.1 lab-server-01" | sudo tee -a /etc/hosts
```

Refresh your shell:

```bash
exec bash
```

### Use SSH Keys

If you're tired of typing passwords, SSH keys are faster and more secure. Generate a key pair on your local machine, copy the public key to your server, and then you can disable password auth entirely in `sshd_config`.

---

## 🎯 What's Next?

Once the SSH server is running, you've got a solid base for other projects. This old laptop is now ready to host:

- A dedicated testing environment for code.
- A basic file server or Nextcloud instance.
- A monitoring node using Prometheus.
- A jump box if you want to access your network from outside.

The best part of using an old laptop is that you can experiment without worrying about breaking your main computer. If you mess up the configuration, you can just wipe it and start over.

---

## 🤖 Automate with a Script

If you're setting up a few of these or just want to save time, here's a script I use to handle the setup and hardening in one go.

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

### Usage

You can run it with the defaults:

```bash
chmod +x setup-ssh-server.sh
./setup-ssh-server.sh
```

Or pass in your own port and name:

```bash
./setup-ssh-server.sh --port 2244 --hostname webnode-01
```

It handles the config, firewall rules, and reloads everything automatically.

---

## 🎉 Done

You've now got a secure server that's ready for whatever you want to host next. More importantly, you've handled the basic hardening and firewall configuration that makes managing servers safer.

Instead of sitting in a closet, that old laptop is actually doing something useful. Whether you're using it to learn system administration or as a lightweight file server, it's a great piece of gear to have in your network.

Good luck with the build.

---

> _Pro tip: Keep a record of the IP address and the SSH port you chose. You'll thank yourself at 2 AM when you're trying to fix a connection issue._
