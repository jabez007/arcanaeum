---
title: Laptop Lid Interlude
date: 2025-06-17
author: jabez007
tags:
  - proxmox
  - homelab
  - laptop-server
  - linux-power-management
  - logind
excerpt: |
  So you've got Proxmox humming along on your repurposed laptop — WiFi configured, VMs ready to spin up, and everything looking great.
  Then you close the lid to tuck it away in its new home as a headless server, and... _poof_ 💤
featured: false
draft: false
---

# Addendum: Keep Your Proxmox Laptop Awake (Because Sleeping Servers Are Useless Servers)

So you've got Proxmox humming along on your repurposed laptop — WiFi configured, VMs ready to spin up, and everything looking great.
Then you close the lid to tuck it away in its new home as a headless server, and... _poof_ 💤

Your shiny new hypervisor just took a nap.

## 😴 The Laptop Dilemma

Here's the thing about laptops: they're _designed_ to be portable.
That means they come with all sorts of power-saving behaviors baked in — like going to sleep the moment you close the lid.
It's great when you're actually using it as a laptop, but terrible when you're trying to run a 24/7 server.

By default, your Linux-based Proxmox system will:

- Suspend or sleep when the lid closes
- Potentially disable WiFi, USB, and other subsystems during suspend
- Leave you wondering why you can't SSH in from your main machine

Not exactly server behavior, right?

## 🛠️ The Simple Fix

Fortunately, this is one of those problems that sounds scarier than it actually is.
We just need to tell the system to ignore the lid completely using systemd's power management configuration.

### Step 1: Edit the Configuration

Open up the logind configuration file:

```bash
sudo nano /etc/systemd/logind.conf
```

### Step 2: Configure Lid Behavior

Find these lines in the file (they might be commented out with `#`):

```bash
HandleLidSwitch=ignore
HandleLidSwitchDocked=ignore
HandleLidSwitchExternalPower=ignore
```

If they're commented out, remove the `#` symbol.
If they don't exist, add them to the `[Login]` section.
Setting all three to `ignore` ensures your laptop stays awake whether it's plugged in, running on battery, or docked.

### Step 3: Apply the Changes

Restart the systemd-logind service to pick up the new configuration:

```bash
sudo systemctl restart systemd-logind
```

That's it! Your laptop will now completely ignore lid events and keep running like the dedicated server it's become.

## 🎯 Testing Your Success

Want to make sure it worked? Here are a few ways to verify:

**The SSH Test**: Close the lid, then try SSH-ing into your Proxmox host from another machine:

```bash
ssh root@your-proxmox-ip
```

**The Web Interface Test**: With the lid closed, open a browser on another device and navigate to your Proxmox web interface at `https://your-proxmox-ip:8006`

**The Log Monitor**: Before closing the lid, run this command to watch system logs in real-time:

```bash
journalctl -f
```

Then close the lid — you should see normal system activity continue without any suspend/resume messages.

## 🚀 What This Means for Your Setup

Now that your laptop stays awake with the lid closed, you have the flexibility to:

- **Tuck it away neatly** — slide it behind your router, under a desk, or wherever makes sense for your setup
- **Access it remotely** — SSH in for command-line management or use the web interface for VM administration
- **Run it truly headless** — no need to keep it open or connected to a monitor

Your old laptop has officially completed its transformation from portable computer to dedicated virtualization server.
The best part?
It'll stay that way, quietly humming along whether the lid is open or closed.

## 💡 Pro Tip

If you ever need to temporarily re-enable lid-based suspend (maybe you want to use it as a laptop again), just change those `ignore` values back to `suspend` and restart the logind service. Your Proxmox configuration will remain intact, ready for when you want to switch back to server mode.
