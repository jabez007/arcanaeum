---
title: "Appendix: Boot-Time Wi-Fi and DHCP with systemd"
date: 2025-06-15
author: jabez007
tags:
  - proxmox
  - wifi
  - systemd
  - dhcp
  - networking
  - linux
excerpt: |
  Even after resolving the DNS and routing issues, I noticed that my Wi-Fi interface wasn’t getting a DHCP lease automatically on reboot. 
  This is a common issue on server systems where wpa_supplicant and dhclient aren't properly sequenced at boot.
featured: false
draft: false
---

# Appendix: Boot-Time Wi-Fi and DHCP with systemd

Even after resolving the DNS and routing issues, I noticed a lingering frustration: **my Wi-Fi interface wasn’t getting a DHCP lease automatically on reboot.**

I found myself running `dhclient wlo1` manually every time I logged in. It worked, but it was a manual step in a world that should be automated.

## 🤔 The Root of the Race Condition

On server systems like Proxmox, the legacy `/etc/network/interfaces` setup can’t always guarantee the sequence we need:

1. `wpa_supplicant` must run before DHCP.
2. The Wi-Fi hardware must actually _finish_ connecting to the AP before `dhclient` asks for an IP.

When these things happen out of order, you get a "successful" boot with no internet.

## ⚠️ Step 0: The "ifupdown" Cleanse

If you followed the manual steps in the **ProxMox Wi-Fi Saga** post, you likely have entries like `auto wlo1` and `iface wlo1 inet dhcp` in your `/etc/network/interfaces` file. To move to this more reliable systemd method, you must first migrate away from the traditional `ifupdown` tool.

First, we have to stop the fighting. If `wlo1` is marked `auto` in `/etc/network/interfaces`, the system will try to configure it during early boot using `ifupdown`.

If you are moving to the systemd approach below, **remove or comment out the `auto wlo1` and `iface wlo1` lines** for your Wi-Fi interface.

> **Why?** Because you can't have two different subsystems (ifupdown and systemd) trying to hold the steering wheel at the same time. It leads to race conditions, conflicting state management, and logs that look like a crime scene.

## 🛠️ Step 1: The WPA Supplicant Template

Instead of hardcoding the interface, we'll use a **systemd template**. This is cleaner and more modular.

Create the template file:

```bash
nano /etc/systemd/system/wpa_supplicant@.service
```

Paste this configuration (the `%i` will automatically become our interface name):

```bash
[Unit]
Description=WPA supplicant for %i
After=network-pre.target
Wants=network-pre.target

[Service]
ExecStart=/sbin/wpa_supplicant -i %i -c /etc/wpa_supplicant/wpa_supplicant.conf
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🛠️ Step 2: The DHCP Client Template

Next, we create a matching template for the DHCP client that **explicitly waits** for the Wi-Fi authentication to succeed.

```bash
nano /etc/systemd/system/dhclient@.service
```

```bash
[Unit]
Description=DHCP Client for %i
Requires=wpa_supplicant@%i.service
After=wpa_supplicant@%i.service

[Service]
ExecStart=/sbin/dhclient %i
Type=forking

[Install]
WantedBy=multi-user.target
```

## 🚀 Step 3: Enabling the Services

Now we tell systemd to manage `wlo1` specifically using our new templates:

```bash
# Reload systemd to see the new files
systemctl daemon-reload

# Enable and start the services for wlo1
systemctl enable wpa_supplicant@wlo1
systemctl enable dhclient@wlo1

systemctl start wpa_supplicant@wlo1
systemctl start dhclient@wlo1
```

## 🏁 The Victory Lap

After applying this, reboot your host and check the status:

```bash
systemctl status dhclient@wlo1
```

If everything is working, you'll see that `dhclient` waited patiently for `wpa_supplicant` to authenticate before grabbing its lease. No more manual commands, no more race conditions—just a server that comes back online exactly the way it should.

Now, your host is truly stable enough to start handling Part 2: **The Bridge That Wasn’t**.
