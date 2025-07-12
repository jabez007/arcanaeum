---
title: Dispatcher for SyncThing
date: 2025-07-12
author: jabez007
tags:
  - syncthing
  - linux
  - NetworkManager
  - debian
  - wifi-security
  - bash-scripting
  - network-dispatcher
excerpt: |
  Stop wasting battery on pointless sync attempts.
  Learn how to automatically start SyncThing only on trusted networks using NetworkManager scripts with MAC address verification and multi-network support—perfect for local-only setups and travel laptops.
featured: false
draft: false
---

# Smart SyncThing: Auto-Start Only on Trusted Networks

Picture this: You're on a business trip with your laptop, connected to hotel Wi-Fi, when SyncThing tries to sync with your home devices.
Since your SyncThing setup only works on your local network (no internet relay), it just sits there spinning, wasting battery and bandwidth trying to connect to devices that aren't reachable.

Sound familiar? Many people run SyncThing exclusively on their home network—it's faster, more secure, and doesn't require complex firewall configurations.
But that means SyncThing is useless (and resource-wasting) when you're traveling.

Let's fix this by making SyncThing smart about when it runs—automatically starting only when you're connected to your trusted home network(s).

## Why Be Selective About When SyncThing Runs?

Running SyncThing 24/7 might seem convenient, but there are compelling reasons to be more strategic, especially if you're running a local-only setup:

- **Local network dependency**: If your SyncThing devices only communicate locally (no internet relay), running it outside your home network is pointless
- **Resource waste**: SyncThing will continuously try to connect to unreachable devices, draining battery and CPU
- **Security**: Keep your sync traffic off untrusted public networks
- **Data usage**: Avoid connection attempts over mobile data
- **Clean separation**: Travel laptop stays lean, home network stays synchronized

The solution? A NetworkManager dispatcher script that automatically starts and stops SyncThing based on your trusted network connections.

## What We're Building

By the end of this guide, you'll have:

- SyncThing running as a user service (more secure than system-wide)
- Automatic start/stop based on your home Wi-Fi SSID
- Desktop notifications so you know when SyncThing is active
- A solution that works seamlessly in the background

## Prerequisites

This guide assumes you're running:

- A Debian-based Linux distribution (Ubuntu, Mint, etc.)
- NetworkManager for Wi-Fi management
- SyncThing already installed

## Step 1: Switch to User-Scoped SyncThing

First, let's move SyncThing from a system service to a user service.
This is more secure and gives us better control.

If you're currently running SyncThing as a system service, stop it:

```bash
sudo systemctl disable --now syncthing@yourusername
```

Now enable the user service:

```bash
systemctl --user enable --now syncthing
```

**Pro tip**: If you need SyncThing to start without logging in (unusual for this use case), enable lingering:

```bash
sudo loginctl enable-linger yourusername
```

## Step 2: Identify Your Trusted Networks

We'll support two methods of identifying trusted networks: SSID-based (simple) and MAC address-based (more secure).

### Method 1: By SSID (Simple)

Find your current network's SSID:

```bash
nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d: -f2
```

### Method 2: By Router MAC Address (More Secure)

SSIDs can be spoofed, but MAC addresses are harder to fake.
Get your router's MAC address:

```bash
# Get the gateway MAC address
ip route show default | awk '{print $3}' | head -1 | xargs arp -n | awk '{print $3}'
```

Or check your current connection details:

```bash
nmcli -f GENERAL.CONNECTION,IP4.GATEWAY dev show | grep -A1 "GENERAL.CONNECTION" | grep -E "(CONNECTION|GATEWAY)"
```

**Pro tip**: Document multiple trusted networks (home, office, etc.) with their SSIDs and MAC addresses.
We'll handle multiple networks in our script.

## Step 3: Create the Smart Detection Script

Now for the main event.
We'll create a NetworkManager dispatcher script that supports multiple trusted networks with both SSID and MAC address verification:

```bash
sudo nano /etc/NetworkManager/dispatcher.d/99-syncthing
```

Here's the enhanced script with multiple network support:

```bash
#!/bin/bash
INTERFACE="$1"
STATUS="$2"
USER_NAME="yourusername"  # Change this to your username
USER_UID=$(id -u "$USER_NAME")
DBUS_SESSION="unix:path=/run/user/$USER_UID/bus"

# Define trusted networks (add your networks here)
declare -A TRUSTED_NETWORKS=(
    ["HomeNetwork"]="aa:bb:cc:dd:ee:ff"      # Home router MAC
    ["OfficeWiFi"]="11:22:33:44:55:66"       # Office router MAC
    ["ParentsHouse"]=""                       # SSID-only (leave MAC empty)
)

# Function to get current network info
get_network_info() {
    CURRENT_SSID=$(nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d: -f2)

    # Get gateway MAC address
    GATEWAY_IP=$(ip route show default | awk '{print $3}' | head -1)
    if [ -n "$GATEWAY_IP" ]; then
        GATEWAY_MAC=$(arp -n "$GATEWAY_IP" 2>/dev/null | awk '{print $3}' | head -1)
    else
        GATEWAY_MAC=""
    fi
}

# Function to check if current network is trusted
is_trusted_network() {
    get_network_info

    # Check each trusted network
    for ssid in "${!TRUSTED_NETWORKS[@]}"; do
        expected_mac="${TRUSTED_NETWORKS[$ssid]}"

        if [ "$CURRENT_SSID" = "$ssid" ]; then
            # If MAC is specified, verify it matches
            if [ -n "$expected_mac" ]; then
                if [ "$GATEWAY_MAC" = "$expected_mac" ]; then
                    echo "Trusted network: $ssid (MAC verified: $expected_mac)"
                    return 0
                else
                    echo "SSID matches but MAC doesn't: expected $expected_mac, got $GATEWAY_MAC"
                    continue
                fi
            else
                # SSID-only check (no MAC verification)
                echo "Trusted network: $ssid (SSID-only)"
                return 0
            fi
        fi
    done

    echo "Untrusted network: $CURRENT_SSID"
    return 1
}

# Function to start SyncThing
start_syncthing() {
    sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
        systemctl --user start syncthing
    sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" DISPLAY=:0 \
        notify-send "SyncThing" "Started on trusted network: $CURRENT_SSID" --icon=dialog-information
}

# Function to stop SyncThing
stop_syncthing() {
    sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
        systemctl --user stop syncthing
    sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" DISPLAY=:0 \
        notify-send "SyncThing" "Stopped (left trusted network)" --icon=dialog-warning
}

# Main logic
if [ "$STATUS" = "up" ]; then
    if is_trusted_network; then
        start_syncthing
    fi
elif [ "$STATUS" = "down" ]; then
    # Always stop on disconnect (we'll restart if the new network is trusted)
    stop_syncthing
fi
```

**Important**: Update the `TRUSTED_NETWORKS` array with your actual network names and MAC addresses.
Leave the MAC address empty (`""`) if you want SSID-only verification for that network.

Make the script executable:

```bash
sudo chmod +x /etc/NetworkManager/dispatcher.d/99-syncthing
```

## Step 4: Test Your Setup

Time to see the magic in action:

1. **Disconnect from Wi-Fi**: You should see a notification that SyncThing has stopped
2. **Connect to a trusted network**: SyncThing should start with a notification showing the network name
3. **Connect to an untrusted network**: SyncThing should remain stopped
4. **Test MAC address verification**: Try connecting to a network with the same SSID but different router (if available)

Check the service status anytime with:

```bash
systemctl --user status syncthing
```

**Debugging tip**: Test network detection manually by running parts of the script:

```bash
# Test network detection
CURRENT_SSID=$(nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d: -f2)
GATEWAY_IP=$(ip route show default | awk '{print $3}' | head -1)
GATEWAY_MAC=$(arp -n "$GATEWAY_IP" 2>/dev/null | awk '{print $3}' | head -1)
echo "SSID: $CURRENT_SSID"
echo "Gateway MAC: $GATEWAY_MAC"
```

## Troubleshooting & Debugging

### Not working as expected?

Add comprehensive logging to your script by adding this line after the `DBUS_SESSION=` line:

```bash
LOG_FILE="/tmp/syncthing-dispatch.log"
echo "$(date) - $STATUS on $INTERFACE" >> "$LOG_FILE"
```

Then add logging to the network detection function:

```bash
# Add this to the is_trusted_network function
echo "$(date) - Checking network: SSID=$CURRENT_SSID, Gateway_MAC=$GATEWAY_MAC" >> "$LOG_FILE"
```

Check the logs:

```bash
tail -f /tmp/syncthing-dispatch.log
```

### Common issues:

- **SSID mismatch**: Network names are case-sensitive and must match exactly
- **MAC address lookup fails**: The `arp` command might not have the gateway cached. Try `ping -c1 $(ip route show default | awk '{print $3}' | head -1)` first
- **Permissions**: Make sure the script is executable and the user exists
- **D-Bus issues**: The script handles D-Bus session addressing, but older systems might need adjustments
- **Multiple gateways**: If you have multiple default routes, the script takes the first one

## Advanced Customizations

### Adding more trusted networks

Simply add them to the `TRUSTED_NETWORKS` array:

```bash
declare -A TRUSTED_NETWORKS=(
    ["HomeNetwork"]="aa:bb:cc:dd:ee:ff"
    ["OfficeWiFi"]="11:22:33:44:55:66"
    ["ParentsHouse"]=""                    # SSID-only
    ["VacationRental"]="99:88:77:66:55:44" # Another MAC-verified network
)
```

### Mixed security levels

You can mix SSID-only and MAC-verified networks based on your security needs:

- **High-security networks**: Use MAC verification for networks where spoofing is a concern
- **Low-risk networks**: Use SSID-only for networks where convenience matters more than security

### AC power requirement

Only start SyncThing when on AC power by adding this check in the `start_syncthing` function:

```bash
if [ "$(cat /sys/class/power_supply/AC*/online 2>/dev/null)" = "1" ]; then
    # Original start commands here
else
    notify-send "SyncThing" "Not starting: on battery power" --icon=dialog-information
fi
```

### Time-based restrictions

Add time-based controls (e.g., only sync during business hours):

```bash
HOUR=$(date +%H)
if [ "$HOUR" -ge 8 ] && [ "$HOUR" -le 18 ]; then
    # Start SyncThing
fi
```

### Fallback SSID detection

If MAC detection fails, you can add a fallback to SSID-only:

```bash
# In the is_trusted_network function, add this after MAC check fails:
echo "MAC verification failed, falling back to SSID-only for $ssid"
return 0  # Allow SSID-only as fallback
```

## The Result: Perfect for Local SyncThing Setups

This setup is ideal for the common scenario where SyncThing runs purely on your local network.
Your travel laptop now:

- **Stays quiet when traveling**: No pointless connection attempts to unreachable home devices
- **Preserves battery**: No background sync activity when it can't accomplish anything
- **Maintains security**: MAC address verification prevents connection to spoofed networks
- **Handles multiple locations**: Works seamlessly across home, office, and other trusted networks

When you return home, SyncThing springs to life automatically, syncing all your travel files with your home setup.
It's the perfect balance of automation and intelligence.

## Security Notes

This setup enhances security in several ways:

- **Local network isolation**: Perfect for SyncThing setups that don't use internet relays
- **MAC address verification**: Prevents connection to networks with spoofed SSIDs
- **User service isolation**: SyncThing runs as your user, not as root
- **Selective activation**: Reduces attack surface by only running when needed

**Important**: While MAC addresses are harder to spoof than SSIDs, they're not impossible to fake.
For maximum security, combine this with other measures like:

- Strong Wi-Fi passwords (WPA3 if available)
- VPN usage on untrusted networks
- Regular SyncThing device ID rotation

## Wrapping Up

This smart SyncThing setup solves a real problem for people running local-only sync networks.
No more watching your travel laptop waste battery trying to connect to unreachable home devices.
No more worrying about connecting to spoofed networks.

Your SyncThing network becomes truly intelligent—active when it can be productive, dormant when it can't.
Whether you're at home, the office, or visiting family, it knows exactly when to sync and when to stay quiet.

The best part? Once it's set up, you'll forget it's there.
Your files just magically appear when you're on trusted networks, and your laptop stays lean and efficient everywhere else.

_Perfect sync when you need it, peace of mind when you don't._ 🔁
