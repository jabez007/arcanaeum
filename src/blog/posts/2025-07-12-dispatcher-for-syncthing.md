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

Sound familiar?
Many people run SyncThing exclusively on their home network—it's faster, more secure, and doesn't require complex firewall configurations.
But that means SyncThing is useless (and resource-wasting) when you're traveling.

Let's fix this by making SyncThing smart about when it runs—automatically starting only when you're connected to your trusted home network(s), even if you don't log in immediately after boot.

## Why Be Selective About When SyncThing Runs?

Running SyncThing 24/7 might seem convenient, but there are compelling reasons to be more strategic, especially if you're running a local-only setup:

- **Local network dependency**: If your SyncThing devices only communicate locally (no internet relay), running it outside your home network is pointless
- **Resource waste**: SyncThing will continuously try to connect to unreachable devices, draining battery and CPU
- **Security**: Keep your sync traffic off untrusted public networks
- **Data usage**: Avoid connection attempts over mobile data
- **Clean separation**: Travel laptop stays lean, home network stays synchronized

The solution?
A NetworkManager dispatcher script combined with a login handler that automatically starts and stops SyncThing based on your trusted network connections—even handling scenarios where your laptop connects to WiFi before you log in.

## What We're Building

By the end of this guide, you'll have:

- SyncThing running as a user service (more secure than system-wide)
- Automatic start/stop based on your home Wi-Fi SSID
- Desktop notifications so you know when SyncThing is active
- A solution that works whether you log in immediately or come back to your laptop later
- Smart handling of boot scenarios where network connects before user login

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

## Step 3: Create the Smart Detection Script

Now for the main event.
We'll create a NetworkManager dispatcher script that supports multiple trusted networks with both SSID and MAC address verification, plus intelligent handling of login scenarios:

```bash
sudo nano /etc/NetworkManager/dispatcher.d/99-syncthing
```

Here's the enhanced script with login-aware network detection:

```bash
#!/bin/bash
# File: /etc/NetworkManager/dispatcher.d/99-syncthing
INTERFACE="$1"
STATUS="$2"
USER_NAME="yourusername"  # Change this to your username
USER_UID=$(id -u "$USER_NAME")
DBUS_SESSION="unix:path=/run/user/$USER_UID/bus"

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
    if [ -S "/run/user/$USER_UID/bus" ]; then
        if sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
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

    sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
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
        sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
            systemctl --user start syncthing

        # Try to send notification (may fail if no display session)
        sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" DISPLAY=:0 \
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
        sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" \
            systemctl --user stop syncthing

        # Try to send notification (may fail if no display session)
        sudo -u "$USER_NAME" DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION" DISPLAY=:0 \
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

## Step 6: Test Your Complete Setup

Time to see the magic in action with both immediate and delayed login scenarios:

### Test 1: Immediate Login

1. **Start with SyncThing stopped**: `systemctl --user stop syncthing`
2. **Connect to a trusted network while logged in**: SyncThing should start immediately with a notification

### Test 2: Boot and Login Immediately

1. **Reboot your laptop**
2. **Let it connect to a trusted network and log in right away**: SyncThing should start via the dispatcher script

### Test 3: Boot and Login Later (New Scenario)

1. **Reboot your laptop and let it connect to a trusted network**
2. **Don't log in immediately - wait a few minutes**
3. **Then log into your desktop session**: The login handler should detect the pending flag and start SyncThing

### Test 4: Network Changes

1. **Connect to an untrusted network**: SyncThing should stop immediately (and remove any pending flags)
2. **Switch back to trusted network**: SyncThing should start (if logged in) or create a pending flag (if not logged in)

Check the service status anytime with:

```bash
systemctl --user status syncthing
```

## How the Login Handling Works

The system uses a two-pronged approach:

1. **Immediate handling**: When you're logged in and connect to a network, the dispatcher script acts immediately
2. **Deferred handling**: When the network connects but you're not logged in yet, the dispatcher script creates a flag file
3. **Login catchup**: When you log in, the login handler checks for pending flags and starts SyncThing if needed

This ensures SyncThing starts correctly in these scenarios:

- ✅ Boot laptop, immediately log in, connect to WiFi
- ✅ Boot laptop, connect to WiFi, then log in later
- ✅ Already logged in, switch between networks
- ✅ Disconnect and reconnect to networks

## Troubleshooting & Debugging

### Not working as expected?

Add comprehensive logging to your dispatcher script by adding this line after the `DBUS_SESSION=` line:

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

Add more comprehensive logging to track the login handling flow:

```bash
# Add to both scripts
LOG_FILE="/tmp/syncthing-handler.log"
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}
```

## The Result: Perfect for Local SyncThing Setups

This enhanced setup is ideal for the common scenario where SyncThing runs purely on your local network.
Your travel laptop now:

- **Stays quiet when traveling**: No pointless connection attempts to unreachable home devices
- **Preserves battery**: No background sync activity when it can't accomplish anything
- **Handles any login timing**: Works whether you log in immediately or come back later
- **Maintains security**: MAC address verification prevents connection to spoofed networks
- **Handles multiple locations**: Works seamlessly across home, office, and other trusted networks
- **Provides clear feedback**: Desktop notifications keep you informed of SyncThing's status

When you return home, SyncThing springs to life automatically, syncing all your travel files with your home setup—regardless of whether you're already logged in or just booting up.
It's the perfect balance of automation, intelligence, and reliability.

## Security Notes

This setup enhances security in several ways:

- **Local network isolation**: Perfect for SyncThing setups that don't use internet relays
- **MAC address verification**: Prevents connection to networks with spoofed SSIDs
- **User service isolation**: SyncThing runs as your user, not as root
- **Selective activation**: Reduces attack surface by only running when needed
- **Smart flag handling**: Prevents SyncThing from starting on networks you've disconnected from

**Important**: While MAC addresses are harder to spoof than SSIDs, they're not impossible to fake.
For maximum security, combine this with other measures like:

- Strong Wi-Fi passwords (WPA3 if available)
- VPN usage on untrusted networks
- Regular SyncThing device ID rotation

## Wrapping Up

This enhanced smart SyncThing setup solves the real-world problem of login timing that many automated solutions miss.
No more watching your travel laptop waste battery trying to connect to unreachable home devices.
No more wondering why SyncThing didn't start when you expected it to.
No more worrying about connecting to spoofed networks.

Your SyncThing network becomes truly intelligent—active when it can be productive, dormant when it can't, and smart enough to handle the complexities of real-world laptop usage patterns.
Whether you're at home, the office, visiting family, or just booting up your laptop at different times, it knows exactly when to sync and when to stay quiet.

The best part? Once it's set up, you'll forget it's there.
Your files just magically appear when you're on trusted networks—whether you logged in immediately or came back to your laptop later—and your laptop stays lean and efficient everywhere else.

_Perfect sync when you need it, peace of mind when you don't._ 🔁
