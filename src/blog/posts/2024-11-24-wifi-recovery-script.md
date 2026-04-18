---
title: Wifi Recovery Script
date: 2024-11-24
author: jabez007
tags:
  - homelab
  - bash
  - NetworkManager
  - linux
  - wifi
  - automation
  - troubleshooting
  - self-healing
  - ssh
  - scripting
excerpt: |
  There's nothing more annoying than trying to SSH into a homelab server only to find it's dropped off the network. Here is a simple script to handle those annoying WiFi disconnects automatically.
featured: false
draft: false
---

# A Simple WiFi Recovery Script for Flaky Homelab Servers

There is nothing more annoying than trying to SSH into a homelab server only to find it's dropped off the network. If you're using an old laptop as a server (like I am), you've probably run into this.

My old ThinkPad running Bodhi Linux usually works great, but it has one annoying habit: whenever my router reboots overnight for firmware updates, the laptop loses its connection and stays disconnected. NetworkManager just gives up instead of trying again once the WiFi is back.

I got tired of manually restarting things, so I wrote a quick script to handle it.

---

## Identifying the Problem

I eventually figured out that it was a simple failure mode: the router reboots overnight, the WiFi drops, and NetworkManager stays idle once it sees the interface is up but lacks an IP. It’s frustrating because a manual `sudo systemctl restart NetworkManager` always fixes it immediately.

## The WiFi Recovery Script

The idea is to check for an IP address on the WiFi interface every few minutes. If it's missing, restart NetworkManager.

Here's the script I use. Save it as `/usr/local/bin/check_wifi.sh`:

```bash
#!/bin/bash

# Configuration - adjust these for your setup
WIFI_INTERFACE="wlp2s0"  # Find yours with: ip link show
LOG_FILE="/var/log/wifi_recovery.log"

# Function to log with timestamps (because debugging is easier with context)
log_message() {
    local message="$1"
    printf "%s: %s\\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$message" >> "$LOG_FILE"
}

# The main event: check WiFi status and fix if broken
check_wifi_and_restart() {
    # Extract IP address from the interface (grep magic)
    local ip; ip=$(ip addr show "$WIFI_INTERFACE" | grep -Po 'inet \\K[\\d.]+')

    if [[ -z "$ip" ]]; then
        log_message "🚨 No IP address on $WIFI_INTERFACE. Attempting rescue..."

        # Restart NetworkManager and log the result
        if sudo /usr/bin/systemctl restart NetworkManager; then
            log_message "✅ NetworkManager restarted successfully"
            sleep 10  # Give it a moment to reconnect

            # Check if we got an IP back
            local new_ip; new_ip=$(ip addr show "$WIFI_INTERFACE" | grep -Po 'inet \\K[\\d.]+')
            if [[ -n "$new_ip" ]]; then
                log_message "🎉 WiFi recovered! New IP: $new_ip"
            else
                log_message "⚠️  NetworkManager restarted but no IP assigned yet"
            fi
        else
            log_message "❌ Failed to restart NetworkManager"
        fi
    else
        log_message "✓ WiFi healthy with IP: $ip"
    fi
}

# Execute the check
check_wifi_and_restart
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/check_wifi.sh
```

It's a good idea to test the script manually first by temporarily disconnecting your WiFi to ensure it handles the recovery as expected.

---

## Setting Up Passwordless Sudo

Since the script needs to restart a system service, it needs to run as root or have sudo privileges. A secure way to do this is to only allow the user account to run that specific command without a password.

1. Edit the sudoers file with `sudo visudo`. Don't edit the file directly in `/etc/sudoers`.
2. Add this line at the end, replacing `jabez` with your username:

   ```
   jabez ALL = NOPASSWD: /usr/bin/systemctl restart NetworkManager
   ```

Now you can test it with `sudo /usr/bin/systemctl restart NetworkManager` and it should run without prompting for your password.

## Automating the Check

To make it actually "self-healing," you can set it to run via cron every few minutes. Open your crontab with `crontab -e` and add this line:

```
*/5 * * * * /usr/local/bin/check_wifi.sh
```

Running it every five minutes is frequent enough to catch most disconnects quickly without cluttering up the system logs too much. Make sure cron is enabled and running:

```bash
sudo systemctl enable --now cron
```

---

## Monitoring the Script

You can check the script's logs with `tail -f /var/log/wifi_recovery.log`. A successful recovery will look like this:

```
2024-11-24 14:40:01: 🚨 No IP address on wlp2s0. Attempting rescue...
2024-11-24 14:40:02: ✅ NetworkManager restarted successfully
2024-11-24 14:40:12: 🎉 WiFi recovered! New IP: 192.168.1.100
```

## Troubleshooting and Adapting

If the script doesn't seem to be running, verify that cron is active and the script is marked executable. If you have trouble writing to `/var/log`, you can change the `LOG_FILE` path in the script to something in your home directory.

This same pattern—**monitor, detect, and restart**—works for other unreliable services too. I've used it for restarting Docker containers or VPN tunnels that occasionally hang. It’s often faster than tracking down a weird, deep-seated config bug in NetworkManager.

Sometimes a simple 30-line script is better than weeks of debugging. Now, instead of wondering why SSH is failing, I can trust my server will fix its own connection issues within a few minutes. If you're running a homelab on old hardware, it's a small bit of automation that makes a big difference.
