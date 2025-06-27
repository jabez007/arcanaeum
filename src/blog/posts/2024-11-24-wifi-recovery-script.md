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
  Ever had that moment when you SSH into your homelab server only to get... nothing? Dead silence.
  Your trusty old laptop-turned-server has ghosted you again.
  If you're running a homelab on repurposed hardware (guilty as charged), you've probably been there.
featured: false
draft: false
---

# How I Built a Self-Healing WiFi Script for My Flaky Homelab Server

Ever had that moment when you SSH into your homelab server only to get... nothing?
Dead silence.
Your trusty old laptop-turned-server has ghosted you again.

If you're running a homelab on repurposed hardware (guilty as charged), you've probably been there.
My old ThinkPad running Bodhi Linux had one job: stay connected to WiFi so I could SSH in whenever I needed.
But every time my router rebooted overnight for firmware updates, this stubborn machine would just... give up.
NetworkManager would throw in the towel instead of reconnecting when the network came back up.

Time for some automated revenge.

---

## 🔍 The Real Problem

Here's what I discovered was happening:

1. Router reboots overnight (thanks, auto-updates)
2. WiFi network goes down temporarily
3. When network comes back up, NetworkManager just sits there
4. My laptop keeps the `wlp2s0` interface up but with no IP address
5. I discover this hours later when SSH fails

The kicker?
A simple `sudo systemctl restart NetworkManager` always fixed it instantly.
So why couldn't the system do this itself?

> **Plot twist**:
> It can.
> We just have to teach it how.

---

## 🛠️ The Solution: A Self-Healing Script

The strategy is dead simple: check if the WiFi interface has an IP address every few minutes.
No IP?
Kick NetworkManager in the pants.

Here's the script that saved my sanity.
Save this to `/usr/local/bin/check_wifi.sh`:

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

> **Pro tip**:
> Test it manually first by temporarily disconnecting your WiFi to make sure it works before automating it.

---

## 🔐 The Sudo Setup (Do This Right)

We need the script to restart NetworkManager without asking for a password.
Here's how to do it **securely**:

1. Edit the sudoers file (never edit `/etc/sudoers` directly):

   ```bash
   sudo visudo
   ```

2. Add this line, replacing `jabez` with your actual username:

   ```
   jabez ALL = NOPASSWD: /usr/bin/systemctl restart NetworkManager
   ```

3. Save and test:
   ```bash
   sudo /usr/bin/systemctl restart NetworkManager
   ```

> **Security note**:
> This only grants password-free access to restart NetworkManager specifically, not blanket sudo access.

---

## ⏰ Automation: Set It and Forget It

Now for the magic - make it run automatically every 5 minutes:

```bash
crontab -e
```

Add this line:

```
*/5 * * * * /usr/local/bin/check_wifi.sh
```

> **Why 5 minutes?**
> It's frequent enough to catch issues quickly but not so aggressive that it spams your logs.
> Adjust to taste.

Make sure cron is actually running:

```bash
sudo systemctl enable cron
sudo systemctl start cron
```

---

## 📊 Monitoring Your WiFi Health

Watch your script in action:

```bash
# Live log monitoring
tail -f /var/log/wifi_recovery.log

# Check recent activity
tail -20 /var/log/wifi_recovery.log
```

A healthy log looks like:

```
2024-06-27 14:30:01: ✓ WiFi healthy with IP: 192.168.1.100
2024-06-27 14:35:01: ✓ WiFi healthy with IP: 192.168.1.100
2024-06-27 14:40:01: 🚨 No IP address on wlp2s0. Attempting rescue...
2024-06-27 14:40:02: ✅ NetworkManager restarted successfully
2024-06-27 14:40:12: 🎉 WiFi recovered! New IP: 192.168.1.100
```

---

## 🛡️ Troubleshooting & Edge Cases

**Script not running?** Check if cron is active:

```bash
systemctl status cron
```

**Permission issues with log file?** Change the log path in the script to your home directory:

```bash
LOG_FILE="$HOME/wifi_recovery.log"
```

**Need to find your WiFi interface name?**

```bash
ip link show | grep -E "wl|en"
```

**Want more aggressive monitoring?** Change the cron to run every minute:

```bash
* * * * * /usr/local/bin/check_wifi.sh
```

---

## 🎯 The Results

Since implementing this script three months ago:

- **Zero** manual WiFi interventions needed
- My homelab server has maintained 99.9% SSH availability
- Router reboots no longer mean lost connections
- I can actually trust this machine for automated tasks

The best part?
The script has triggered exactly 23 times according to my logs - meaning it prevented 23 instances where I would have discovered a dead connection hours later.

---

## 🚀 Beyond WiFi: The Bigger Picture

This approach works for any flaky service that just needs a periodic kick.
I've adapted similar scripts for:

- Monitoring Docker containers that occasionally crash
- Restarting SSH daemon when it gets hung up
- Checking VPN connections on remote systems

The pattern is always the same: **monitor → detect → fix → log**.

---

## 💡 Final Thoughts

Sometimes the simplest solutions are the most elegant.
A 30-line Bash script solved what weeks of tweaking NetworkManager configs couldn't fix.

Your homelab doesn't have to be enterprise-grade hardware to be reliable.
Sometimes it just needs a little automation love.

Now my old ThinkPad happily chugs along, automatically healing itself whenever my router decides to take a midnight reboot.
And I can focus on more interesting problems than "why is SSH not working again?"

**Happy homelabbing, and may your wifi always reconnect itself.**
