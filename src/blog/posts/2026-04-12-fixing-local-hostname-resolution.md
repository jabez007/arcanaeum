---
title: DNS Hijacking for Local Hostname Resolution
date: 2026-04-12
author: jabez007
tags:
  - dns
  - networking
  - expressvpn
  - asus-router
  - dnsmasq
  - bash-scripting
  - troubleshooting
  - homelab
excerpt: |
  Ever tried to SSH into a local machine by name only to be met with a cold NXDOMAIN? 
  If you're running a VPN-enabled router, your "secure" setup might actually be 
  hiding your own devices from you. Here is how I used a recursive DNS hijack 
  to restore local discovery without breaking the tunnel.
featured: true
draft: false
---

# The DNS Ghost in the Machine: Fixing Local Hostname Resolution on VPN Routers

Ever tried to SSH into your favorite dev machine by name, only to be met with a cold, hard `NXDOMAIN`? 

You know the machine is there. You can ping its IP address. But for some reason, your router—the very brain of your network—has developed a case of amnesia regarding your local hostnames. 

If you’re running specialized firmware like **ExpressVPN** on an Asus router, you’ve likely run into this. It’s a "hardened" setup designed to keep you safe, but sometimes that security comes at the cost of your sanity. 

Let's dive into how I performed a "Recursive DNS Hijack" to force my router to remember its neighbors without breaking the VPN.

## 🔍 The Investigation: Why "Standard" DNS Fails

Usually, a router’s DNS service (**dnsmasq**) is a friendly librarian. It hands out IP addresses via DHCP and writes down everyone’s name so it can introduce them later. 

But on a VPN-enabled router, things get complicated. After SSH-ing into my router and running a quick `ps | grep dnsmasq`, I found the "smoking gun." The router wasn't running just one DNS service—it was running **ten**.

### The Split-Brain Problem
ExpressVPN firmware uses **Policy-Based Routing (PBR)**. It creates isolated "tunnels" for different device groups. 
- **The Master Instance**: Knows all your local names but only talks to the router itself.
- **The Tunnel Instances**: These handle your devices' traffic. They are launched with the `-n` (no-hosts) flag.

Because of that `-n` flag, the moment you put a device behind the VPN, the router effectively tells it: *"I'm not allowed to look at local names. If you want to find 'lab-laptop', go ask the internet."* Naturally, the internet has no idea who your laptop is.

## 🛠️ The Solution: A Layered DNS Hijack

We can’t easily change how the VPN binary spawns those processes, so we have to "trick" them. The goal is to create a **Chain of Trust**: we tell the tunnel instances to ask the Master instance for help before giving up.

### Layer 1: The Payload Script
First, we need a script that finds every tunnel's configuration and injects our local router as the primary nameserver. Save this to `/jffs/scripts/dns_chain.sh`:

```bash
#!/bin/sh
# /jffs/scripts/dns_chain.sh
# Prepend the local Master IP as the primary resolver for all tunnels

TARGETS="/tmp/resolv.dnsmasq /tmp/resolv.*.conf"
LOCAL_IP="192.168.1.1" # Use your router's actual local IP

for f in $TARGETS; do
    if [ -f "$f" ]; then
        # Only inject if local IP isn't already the first nameserver
        if ! head -n 1 "$f" | grep -q "$LOCAL_IP"; then
            sed -i "/nameserver $LOCAL_IP/d" "$f" # Clean existing to avoid duplicates
            sed -i "1i nameserver $LOCAL_IP" "$f" # Prepend to line 1
        fi
    fi
done

# Reload dnsmasq to pick up the changes
killall -HUP dnsmasq
```

### Layer 2: The "Safety" Daemon
Since the firmware loves to overwrite these files whenever a tunnel reconnects, we need a watchdog. This script ensures only one instance runs and checks the files every two minutes. Save this to `/jffs/scripts/dns_daemon.sh`:

```bash
#!/bin/sh
# /jffs/scripts/dns_daemon.sh
PID_FILE="/tmp/dns_fix.pid"

# Prevent duplicate processes
if [ -f "$PID_FILE" ] && [ -d "/proc/$(cat $PID_FILE)" ]; then
    exit 0
fi

echo $$ > "$PID_FILE"
logger "DNS Fix Daemon: Monitoring started."

while [ -x "/jffs/scripts/dns_chain.sh" ]; do
    /jffs/scripts/dns_chain.sh
    sleep 120
done
```

Make them both executable:
```bash
chmod +x /jffs/scripts/*.sh
```

## ⏰ Step 3: Automation (The Ignition Switch)

To make this survive a reboot, we use **NVRAM**. This tells the router to start our daemon 20 seconds after it boots—giving the system enough time to initialize the JFFS partition and the network stack.

```bash
nvram set rc_startup="sleep 20; [ -x /jffs/scripts/dns_daemon.sh ] && /jffs/scripts/dns_daemon.sh &"
nvram commit
```

## 📊 Why This is "Pro-Grade" Logic

This isn't just a "hack"—it's a recursive architecture. 

1. **The Request**: Your laptop asks for `lab-server-01`.
2. **The Hijack**: The tunnel DNS sees your router's IP (`192.168.1.1`) at the top of its list and asks it first.
3. **The Resolve**: The Master process sees the request, looks at its DHCP table, and says, *"Oh, that's at 192.168.1.50."*
4. **The Security**: If you ask for `google.com`, the Master process fails, and the tunnel instance moves to the next nameserver in the list (the secure VPN DNS).

**You get local resolution speed without sacrificing a drop of VPN privacy.**

## 🎯 The Results

Since implementing this "layered" approach:
- **Zero** manual IP-typing for SSH.
- **Local hostnames** work across every device in the house, regardless of which VPN tunnel they are in.
- **System-wide persistence**: The watchdog catches any file overwrites within 120 seconds.

The best part? It's entirely hands-off. My network is now smart enough to resolve local names on its own, and I can go back to more interesting problems—like why I have three different `docker-compose` versions installed on the same machine.

**Happy networking, and may your `nslookup` always return an IP.**

### 💡 Pro Tips for the Road
- **Check your logs**: Run `grep "DNS_FIX" /tmp/var/log/messages` to verify the daemon is starting.
- **Static IPs**: Even with this fix, always set a DHCP reservation for your servers in the router’s Web UI. 
- **Wait for it**: After a reboot, give the script the full 20 seconds to kick in before testing resolution.

