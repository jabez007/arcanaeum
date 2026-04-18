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
  If you're running a VPN on your router, local hostnames often stop working. 
  ExpressVPN's firmware isolates DNS traffic so strictly that local resolution 
  is sacrificed for privacy. Here is how I used a persistence script to 
  force local resolution without leaking my external DNS traffic.
featured: true
draft: false
---

# Fixing Local Hostname Resolution on VPN-Enabled Asus Routers

If you're running a VPN on your router—specifically an Asus router with ExpressVPN firmware—you've probably realized that local hostnames stop working the moment a device joins a tunnel. You can ping the IP, but `ssh server.local` returns a cold `NXDOMAIN`.

The router hasn't forgotten the names; it's just being too "secure" for its own good. ExpressVPN’s firmware isolates DNS traffic so strictly that local resolution is sacrificed to prevent leaks. It's a trade-off that makes sense for privacy but breaks everything in a homelab.

Here is how I forced the router to prioritize local resolution without leaking my external DNS traffic.

## The Culprit: Too Many `dnsmasq` Instances

Under normal conditions, a router's `dnsmasq` instance acts as both a DHCP server and a local DNS resolver. It records the hostnames of devices it hands IPs to and resolves them when asked.

On ExpressVPN firmware, this is replaced by **Policy-Based Routing (PBR)**. Instead of one global `dnsmasq` process, the router spawns multiple instances:

- **The Primary Instance**: This is the only one that knows your local device names, but it only responds to requests from the router itself.
- **The Tunnel Instances**: Each VPN tunnel gets its own `dnsmasq` process. These handle traffic for any device assigned to that tunnel.

The "smoking gun" is that these tunnel instances are launched with the `-n` (no-hosts) flag. This explicitly tells `dnsmasq` to ignore local hostnames. The moment you put a device behind a VPN tunnel, it's effectively told: "If you want to resolve a name, go ask the internet." Since the internet doesn't know what `proxmox-01` is, you get an `NXDOMAIN`.

## Forcing a DNS Chain of Command

Since modifying the VPN binary's launch flags is difficult, the next best thing is to rewrite the configuration files on the fly. We need the tunnel instances to check with the router's primary IP before heading out to the public internet.

### 1. The Injector Script
This script iterates through the temporary resolver files for every tunnel and prepends the router's local IP as the primary nameserver. Save this to `/jffs/scripts/dns_chain.sh`:

```bash
#!/bin/sh
# /jffs/scripts/dns_chain.sh
# Prepend the router's IP as the primary resolver for all VPN tunnels

TARGETS="/tmp/resolv.dnsmasq /tmp/resolv.*.conf"
LOCAL_IP="192.168.1.1" # Change this if your router is on a different IP

for f in $TARGETS; do
    if [ -f "$f" ]; then
        # Check if local IP is already the primary nameserver
        if ! head -n 1 "$f" | grep -qE "^nameserver[[:space:]]+$LOCAL_IP$"; then
            sed -i "/^nameserver[[:space:]]\{1,\}$LOCAL_IP$/d" "$f" # Remove existing entries
            sed -i "1i nameserver $LOCAL_IP" "$f" # Add to the top of the list
        fi
    fi
done

# Restart dnsmasq to reload configs
killall -HUP dnsmasq
```

### 2. The Persistence Daemon
The firmware frequently overwrites these resolver files whenever a VPN tunnel restarts or reconnects. We need a background process that acts as a watchdog, reapplying the fix periodically. Save this to `/jffs/scripts/dns_daemon.sh`:

```bash
#!/bin/sh
# /jffs/scripts/dns_daemon.sh
PID_FILE="/tmp/dns_fix.pid"

# Exit if an instance is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    # Verify PID is numeric and the process is alive
    if echo "$PID" | grep -qE "^[0-9]+$" && kill -0 "$PID" 2>/dev/null; then
        if grep -q "dns_daemon.sh" "/proc/$PID/cmdline" 2>/dev/null; then
            exit 0
        fi
    fi
    # Stale PID file, non-numeric, or wrong process
    rm -f "$PID_FILE"
fi

echo $$ > "$PID_FILE"
logger "DNS Fix: Monitoring script started."

while [ -x "/jffs/scripts/dns_chain.sh" ]; do
    /jffs/scripts/dns_chain.sh
    sleep 120 # Run every 2 minutes
done
```

Make them executable:
```bash
chmod +x /jffs/scripts/*.sh
```

## Persistence and NVRAM

To make this change survive a reboot, we need to add the script to the router’s startup sequence. We’ll use `nvram` to set a startup command that triggers the daemon after a 20-second delay—this gives the JFFS partition and the network stack enough time to fully initialize.

```bash
nvram set rc_startup="sleep 20; [ -x /jffs/scripts/dns_daemon.sh ] && /jffs/scripts/dns_daemon.sh &"
nvram commit
```

## How the DNS Request Now Flows

This setup creates a fallback mechanism that prioritizes local names without sacrificing privacy:

1.  **Request**: A device in a VPN tunnel asks for `nas-01.local`.
2.  **The Intercept**: The tunnel's `dnsmasq` instance sees the router's IP (`192.168.1.1`) at the top of its nameserver list and queries it.
3.  **Local Resolution**: The router’s primary instance (which has access to the DHCP lease table) resolves the request.
4.  **Privacy**: If you query `google.com`, the primary instance can't resolve it. The tunnel instance then moves to the next nameserver in the list—the secure, external VPN DNS.

## Final Results

Since I started running this script, local hostnames have been working perfectly across every device in the network. There's no more typing IPs for SSH, and I don't have to worry about the firmware overwriting my changes because the watchdog script catches it within a couple of minutes.

It's one of those "set and forget" fixes that makes the whole homelab experience significantly less annoying. Now, if only I could figure out why I have three different versions of `docker-compose` on my main server...

A few parting notes if you try this:

- **Check your logs**: If you suspect the daemon isn't running, `grep "DNS Fix" /tmp/var/log/messages` will show you if it started correctly.
- **Static DHCP**: Even with this fix, you should still set a DHCP reservation for your critical servers in the router’s Web UI. It saves you from having to troubleshoot "ghost" resolution issues if a device's IP changes.
- **Boot Time**: Remember that it takes 20 seconds for the script to kick in after a reboot. If you test local resolution the moment the router is up, it will probably fail. Just wait a minute.

Hopefully, this saves someone else the headache of manually typing IP addresses for their entire homelab.

