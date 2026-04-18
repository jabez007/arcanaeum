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

If you use SyncThing without global discovery or relays, you've probably seen it: the "spinning" icon on your laptop tray when you're away from home. It's trying to find your home server on a hotel Wi-Fi network that it'll never reach, chewing through your battery and CPU for no reason.

Running SyncThing exclusively on a local network is a great move for security and speed. It keeps your data off the public internet and simplifies your firewall setup. But it makes the app a resource drain when you're traveling.

We can solve this by making SyncThing "location-aware." We'll set up a script that automatically starts it when you're on a trusted network and shuts it down the moment you leave, even handling those edge cases where your laptop connects to Wi-Fi before you've even logged in.

## The Problem with Local-Only Syncing

Running SyncThing 24/7 is fine for a server, but for a laptop, it's often overkill—especially if you've disabled global discovery and relays for better privacy.

When you're at a coffee shop or a hotel:
- **It's a battery hog:** SyncThing keeps polling for devices it can't see.
- **It's noisy:** It keeps trying to probe the network, which is unnecessary on public Wi-Fi.
- **It's useless:** If your "source" devices are all back home on a private LAN, SyncThing has nothing to do.

The solution is a NetworkManager dispatcher script. This is a small script that runs whenever your network status changes. Combined with a simple login handler, we can ensure SyncThing only fires up when it actually has a chance of working.

## The Goal

We're going to set up a system that:
- Runs SyncThing as a **user service** (the right way to do it on Linux).
- Starts/stops automatically based on **trusted SSIDs or MAC addresses**.
- Sends a **desktop notification** so you know when it's active.
- Handles **boot-time connections** (when the Wi-Fi connects before you've even typed your password).

## Prerequisites

This guide assumes you're running:

- A Debian-based Linux distribution (Ubuntu, Mint, etc.)
- NetworkManager for Wi-Fi management
- SyncThing already installed

## Step 1: Configure SyncThing Service Behavior

First, let's move SyncThing from a system service to a user service and configure it properly.

If you're currently running SyncThing as a system service, stop it:

```bash
sudo systemctl disable --now syncthing@yourusername
```

Now we have two options for the user service:

### Option A: Manual Start Only (Recommended)

If you want SyncThing to ONLY run when on trusted networks:

```bash
# Make sure the service is not enabled for auto-start
systemctl --user disable syncthing
# Make sure it's stopped now
systemctl --user stop syncthing
```

This way, SyncThing will never auto-start on boot and will only be started by our dispatcher script when you connect to trusted networks.

### Option B: Auto-start but Stop on Untrusted Networks

If you want SyncThing to start on boot but stop when on untrusted networks:

```bash
systemctl --user enable --now syncthing
```

**Important**: If you choose Option A, SyncThing will only start when you connect to a trusted network.
If you choose Option B, it will start on boot but our script will stop it when you connect to untrusted networks.

For most travel laptop scenarios, **Option A is recommended** because it saves battery and resources when you're not on trusted networks.

## Step 2: Identify Your Trusted Networks

We'll support two methods of identifying trusted networks: SSID-based (simple) and MAC address-based (more secure).

### Method 1: By SSID (Simple)

Find your current network's SSID:

```bash
nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d: -f2
```

### Method 2: By Router MAC Address (More Secure)

SSIDs can be spoofed, but MAC addresses are harder to fake. Get your router's MAC address:

```bash
# Get the gateway MAC address
ip route show default | awk '{print $3}' | head -1 | xargs ip neigh show | awk '{print $5}' | head -1
```

Or check your current connection details:

```bash
nmcli -f GENERAL.CONNECTION,IP4.GATEWAY dev show | grep -A1 "GENERAL.CONNECTION" | grep -E "(CONNECTION|GATEWAY)"
```

**Pro tip**: Document multiple trusted networks (home, office, etc.) with their SSIDs and MAC addresses.
We'll handle multiple networks in our script.

## Step 3: Create the Detection Script

We'll use a NetworkManager dispatcher script to handle the heavy lifting. This script supports multiple networks and uses both SSID and MAC address verification to make sure it's not being fooled by a spoofed network name.

Create the script:

```bash
sudo nano /etc/NetworkManager/dispatcher.d/99-syncthing
```

Paste in this logic:

```bash
#!/bin/bash
# File: /etc/NetworkManager/dispatcher.d/99-syncthing
INTERFACE="$1"
STATUS="$2"
USER_NAME="yourusername"  # Change this to your username
USER_UID=$(id -u "$USER_NAME")
export XDG_RUNTIME_DIR="/run/user/$USER_UID"
DBUS_SESSION="unix:path=$XDG_RUNTIME_DIR/bus"

# Define trusted networks (add your networks here)
declare -A TRUSTED_NETWORKS=(
    ["HomeNetwork"]="aa:bb:cc:dd:ee:ff"      # Home router MAC
    ["OfficeWiFi"]="11:22:33:44:55:66"       # Office router MAC
    ["ParentsHouse"]=""                      # SSID-only (leave MAC empty)
)

# Function to get current network info
get_network_info() {
    CURRENT_SSID=$(nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d: -f2)

    # Get gateway MAC address
    GATEWAY_IP=$(ip route show default | awk '{print $3}' | head -1)
    if [ -n "$GATEWAY_IP" ]; then
        ping -c1 -W1 "$GATEWAY_IP" >/dev/null 2>&1 || true   # prime ARP cache
        GATEWAY_MAC=$(ip neigh show "$GATEWAY_IP" | awk '$5 ~ /^[0-9a-f:]{17}$/ {print $5}' | head -1)
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

# Function to check if user session is available
is_user_session_available() {
    # Check if user session bus exists and is responsive
    if [ -S "$XDG_RUNTIME_DIR/bus" ]; then
        if runuser -u "$USER_NAME" -- \
            env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
            systemctl --user list-units >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to check if SyncThing is running (as the specified user)
is_syncthing_running() {
    if ! is_user_session_available; then
        return 1  # Can't check if session isn't available
    fi

    runuser -u "$USER_NAME" -- \
        env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
        systemctl --user is-active --quiet syncthing
}

# Function to start SyncThing
start_syncthing() {
    # Check if user session is available
    if ! is_user_session_available; then
        echo "User session not available, cannot start SyncThing"
        return 1
    fi

    # Check if SyncThing is already running
    if ! is_syncthing_running; then
        runuser -u "$USER_NAME" -- \
            env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
            systemctl --user start syncthing

        # Try to send notification (may fail if no display session)
        runuser -u "$USER_NAME" -- \
            env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" DISPLAY=:0 \
            notify-send "SyncThing" "Started on trusted network: $CURRENT_SSID" --icon=dialog-information 2>/dev/null || true
    fi
}

# Function to stop SyncThing
stop_syncthing() {
    # Check if user session is available
    if ! is_user_session_available; then
        echo "User session not available, cannot stop SyncThing"
        return 1
    fi

    # Check if SyncThing is actually running before stopping
    if is_syncthing_running; then
        runuser -u "$USER_NAME" -- \
            env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
            systemctl --user stop syncthing

        # Try to send notification (may fail if no display session)
        runuser -u "$USER_NAME" -- \
            env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" DISPLAY=:0 \
            notify-send "SyncThing" "Stopped (untrusted network: $CURRENT_SSID)" --icon=dialog-warning 2>/dev/null || true
    fi
}

# Function to create a flag file indicating we should start SyncThing when user logs in
create_pending_start_flag() {
    mkdir -p "/tmp/syncthing-flags"
    echo "$CURRENT_SSID" > "/tmp/syncthing-flags/pending-start-$USER_NAME"
    echo "Created flag to start SyncThing on trusted network when user logs in"
}

# Function to remove the pending start flag
remove_pending_start_flag() {
    rm -f "/tmp/syncthing-flags/pending-start-$USER_NAME"
}

# Main logic - only run if called directly (not sourced)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ "$STATUS" = "up" ]; then
        if is_trusted_network; then
            if is_user_session_available; then
                start_syncthing
                remove_pending_start_flag
            else
                echo "Trusted network detected but user session not available"
                create_pending_start_flag
            fi
        else
            # Stop SyncThing if connecting to untrusted network and remove any pending flags
            if is_user_session_available; then
                stop_syncthing
            fi
            remove_pending_start_flag
        fi
    elif [ "$STATUS" = "down" ]; then
        # Always stop on disconnect and remove pending flags
        if is_user_session_available; then
            stop_syncthing
        fi
        remove_pending_start_flag
    fi
fi
```

**Important**: Update the `TRUSTED_NETWORKS` array with your actual network names and MAC addresses.
Leave the MAC address empty (`""`) if you want SSID-only verification for that network.

Make the script executable:

```bash
sudo chmod +x /etc/NetworkManager/dispatcher.d/99-syncthing
```

## Step 4: Create the Login Handler

The dispatcher script handles immediate connections, but what if your laptop boots up, connects to WiFi, and then you don't log in for a few minutes? We need a login handler to catch these scenarios.

Create the login handler script:

```bash
sudo nano /usr/local/bin/syncthing-login-handler.sh
```

Add this content:

```bash
#!/bin/bash
# File: /usr/local/bin/syncthing-login-handler.sh
# This script runs when the user logs in to handle delayed SyncThing startup

USER_NAME="yourusername"  # Change this to your username
FLAG_FILE="/tmp/syncthing-flags/pending-start-$USER_NAME"

# Give the user session a moment to fully initialize
sleep 3

# Source the functions from the dispatcher script
source /etc/NetworkManager/dispatcher.d/99-syncthing

echo "Login handler: Checking for SyncThing startup conditions..."

# Method 1: Check if there's a pending start flag (from when network came up but user wasn't logged in)
if [ -f "$FLAG_FILE" ]; then
    FLAGGED_NETWORK=$(cat "$FLAG_FILE")
    echo "Found pending start flag for network: $FLAGGED_NETWORK"

    # Verify we're still on a trusted network (network might have changed)
    if is_trusted_network && ! is_syncthing_running; then
        echo "Starting SyncThing due to pending flag..."
        start_syncthing
    fi

    # Remove the flag either way
    rm -f "$FLAG_FILE"
fi

# Method 2: Also check current network status regardless of flag
if is_trusted_network && ! is_syncthing_running; then
    echo "User logged in on trusted network, starting SyncThing..."
    start_syncthing
fi

echo "Login handler: Complete"
```

**Important**: Update `yourusername` to your actual username in this script too.

Make it executable:

```bash
sudo chmod +x /usr/local/bin/syncthing-login-handler.sh
```

## Step 5: Set Up Automatic Login Handling

Create an autostart entry that runs the login handler when you log into your desktop:

```bash
mkdir -p ~/.config/autostart
```

Create the autostart file:

```bash
nano ~/.config/autostart/syncthing-login-check.desktop
```

Add this content:

```ini
[Desktop Entry]
Type=Application
Name=SyncThing Network Check
Exec=/usr/local/bin/syncthing-login-handler.sh
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
X-GNOME-Autostart-Delay=10
```

This will run the login handler 10 seconds after you log in, giving your desktop session time to fully initialize.

## Step 6: Testing the Setup

You can test this by toggling your Wi-Fi or switching between networks.

### Test 1: Immediate Login
1. Stop SyncThing manually: `systemctl --user stop syncthing`
2. Connect to your home Wi-Fi. SyncThing should start immediately and send a notification.

### Test 2: The "Boot and Wait" scenario
1. Reboot.
2. Let the laptop connect to Wi-Fi at the login screen.
3. Wait a minute, then log in.
4. The login handler should see the "pending" flag created by the dispatcher and start SyncThing.

## How it Works

The system handles two different states:

1. **Immediate Handling:** If you're already logged in, the dispatcher script starts/stops the service as soon as the network changes.
2. **Deferred Handling:** If the network connects before you log in, the dispatcher can't talk to your user session yet. It leaves a "pending" flag in `/tmp`. When you eventually log in, the login handler sees that flag and finishes the job.

This covers every common scenario: switching networks while working, booting up at a cafe, or coming home and opening your laptop.

## Troubleshooting & Debugging

### Not working as expected?

Add detailed logging to your dispatcher script by adding this line after the `DBUS_SESSION=` line:

```bash
LOG_FILE="/tmp/syncthing-dispatch.log"
echo "$(date) - $STATUS on $INTERFACE" >> "$LOG_FILE"
```

Check the logs:

```bash
tail -f /tmp/syncthing-dispatch.log
```

### Common issues:

- **Login handler not running**: Check that the desktop file is in `~/.config/autostart/` and has the correct permissions
- **SyncThing starts but login handler doesn't see it**: The login handler waits 3 seconds after login - this might need adjustment for slower systems
- **Pending flags not cleared**: Check the `/tmp/syncthing-flags/` directory for leftover flag files
- **SyncThing keeps running on untrusted networks**: Check that the script is executable and the `TRUSTED_NETWORKS` array is configured correctly
- **Multiple desktop environments**: Some desktop environments might not honor the autostart delay - try increasing `X-GNOME-Autostart-Delay`

### Debugging the login handler

Test the login handler manually:

```bash
/usr/local/bin/syncthing-login-handler.sh
```

This will show you exactly what it's detecting and doing.

## Advanced Customizations

### Alternative to Autostart: Systemd User Service

Instead of using autostart, you can create a systemd user service for the login handler:

```bash
# Create ~/.config/systemd/user/syncthing-login-handler.service
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/syncthing-login-handler.service << 'EOF'
[Unit]
Description=SyncThing Login Handler
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/syncthing-login-handler.sh
RemainAfterExit=true

[Install]
WantedBy=default.target
EOF

# Enable it
systemctl --user enable syncthing-login-handler.service
```

### Adding more trusted networks

Simply add them to the `TRUSTED_NETWORKS` array in both the dispatcher script and login handler:

```bash
declare -A TRUSTED_NETWORKS=(
    ["HomeNetwork"]="aa:bb:cc:dd:ee:ff"
    ["OfficeWiFi"]="11:22:33:44:55:66"
    ["ParentsHouse"]=""                    # SSID-only
    ["VacationRental"]="99:88:77:66:55:44" # Another MAC-verified network
)
```

### Enhanced logging for debugging

Add more detailed logging to track the login handling flow:

```bash
# Add to both scripts
LOG_FILE="/tmp/syncthing-handler.log"
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}
```

## Why This Matters for Local Setups

This setup effectively makes SyncThing "quiet" when it's not useful. Your travel laptop stops fruitlessly searching for your home server while you're at a hotel, which saves battery and stops cluttering your logs with connection errors.

The best part is that it's set-and-forget. Whether you log in immediately or come back to your laptop an hour after booting, the sync will start exactly when it should. When you get back home, your files just start appearing without you having to touch a single setting.

## A Note on Security

Using MAC address verification adds a nice layer of protection against SSID spoofing, but remember that MAC addresses can be faked too. This setup is a great way to reduce your attack surface (by not running the service on public Wi-Fi), but it shouldn't be your *only* security measure. Always use strong Wi-Fi passwords and keep your SyncThing device IDs private.

## Wrapping Up

Managing SyncThing manually is a pain, and letting it run 24/7 on a laptop is wasteful. By offloading the "thinking" to a dispatcher script, you get the best of both worlds: a secure, local-only sync setup that only consumes resources when it's actually capable of syncing.

It’s a simple fix that solves a common annoyance for Linux road warriors. Once it’s running, you can stop worrying about your battery or your bandwidth and just let the scripts handle the logistics.
