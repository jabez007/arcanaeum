---
title: ProxMox Laptop Install
date: 2025-06-15
author: jabez007
tags:
  - proxmox
  - homelab
  - virtualization
  - tutorial
  - selfhosted
excerpt: |
  This post chronicles my **complete installation journey**, including the BIOS rabbit holes I fell into, the partitioning decisions that actually matter, and the **networking mistake that nearly drove me to throw the laptop out the window** (spoiler: I figured it out, and you won't make the same error).
featured: true
draft: false
---

# Installing Proxmox VE 8.4 on a Laptop: My Homelab Journey

## Introduction

Picture this: you're scrolling through r/homelab at 2 AM (as one does), and you see yet another post about someone's $3,000 server rack setup.
Meanwhile, you're looking at an old laptop collecting dust in your closet, wondering if it could become something more useful than a very expensive paperweight.

Well, I'm here to tell you it absolutely can.

A few weeks ago, I decided to expand my homelab—but with a twist.
Instead of dropping serious cash on rack-mounted gear, I grabbed an **HP laptop with an AMD Ryzen 5 3500U, 32GB of RAM, and a 512GB SSD** that was destined for the electronics recycling bin.
Total cost? $150 on Facebook Marketplace.
Sometimes the best homelab gear isn't the shiniest—it's the most practical.

Proxmox VE (Virtual Environment) became my weapon of choice.
It's free, open-source, and packed with enterprise-grade features that would make a VMware admin weep with envy—live migration, ZFS support, LXC containers, and clustering capabilities that rival solutions costing thousands.

But here's the catch: installing enterprise virtualization software on consumer hardware designed for browsing cat videos?
That's where things get spicy.

This post chronicles my **complete installation journey**, including the BIOS rabbit holes I fell into, the partitioning decisions that actually matter, and the **networking mistake that nearly drove me to throw the laptop out the window** (spoiler: I figured it out, and you won't make the same error).

---

## Step 1: Downloading Proxmox and Creating a Bootable USB

### Choosing Your Weapon: The Right ISO

First stop: [proxmox.com](https://www.proxmox.com/) to grab **Proxmox VE 8.4**.
Now, I know what you're thinking—"Why not the bleeding-edge latest version?"
Because in the homelab world, **stable beats shiny** every single time.
Version 8.4 is battle-tested, well-documented, and won't surprise you with mysterious bugs at 3 AM when you're trying to restore a critical VM.

**Pro Tip That Saved My Sanity:** Always verify the ISO checksum.
Yes, it takes 30 seconds.
No, it's not paranoia when that corrupted download costs you 2 hours of troubleshooting:

```bash
sha256sum proxmox-ve_8.4-1.iso
```

Compare this against the checksum on Proxmox's download page.
Trust me on this one.

### USB Creation: Why Ventoy Changed My Life

Forget constantly reformatting USB drives.
**Ventoy** is like having a Swiss Army knife for ISOs—drop multiple installation images on one drive and pick your poison at boot time.

Here's my setup process:

1. Downloaded Ventoy from [ventoy.net](https://www.ventoy.net/)
2. Installed it on my USB drive (**warning:** this nukes everything on the drive)
3. Simply copied the Proxmox ISO file directly onto the USB—no burning, no special tools, just drag and drop

**Alternative Weapons:**

- **BalenaEtcher**: Simple and foolproof (perfect for newcomers)
- **Rufus**: Windows-only but lightning fast
- **dd command**: For the Linux purists who enjoy living dangerously

---

## Step 2: BIOS Surgery – Where Dreams Go to Die

### Breaking Into the BIOS

Every laptop manufacturer seems to pick their BIOS key by throwing darts at a keyboard.
On this HP, I had to **spam the ESC key** like I was trying to escape a burning building, then hit **F10** when the boot menu appeared.

**Universal BIOS Key Cheat Sheet:**

- **HP**: ESC then F10
- **Dell**: F2 or F12
- **Lenovo**: F1 or Enter then F1
- **ASUS**: F2 or Delete
- **When in doubt**: Mash all the function keys and pray

### The Settings That Actually Matter

This is where most installations fail before they even begin.
Miss these settings, and you'll be troubleshooting phantom problems for hours:

#### 1. **Enable Virtualization Extensions**

- **AMD**: Look for "SVM Mode" under _System Configuration > CPU/Memory Options_
- **Intel**: Hunt for "VT-x" or "Intel Virtualization Technology"
- **Why it matters**: Without this, Proxmox installs but runs like molasses. Your VMs will be so slow you'll question your life choices.

#### 2. **Disable Secure Boot (The Silent Killer)**

Found under _Security > Secure Boot Configuration_.
Microsoft's security feature becomes your virtualization roadblock—Proxmox's kernel modules aren't Microsoft-signed, so Secure Boot treats them like malware.

#### 3. **Boot Mode Reality Check**

Make sure you're in **UEFI mode**, not Legacy.
Some older laptops default to Legacy, which can cause mysterious boot failures later.

#### 4. **USB Boot Priority**

Set your USB device as the first boot option, or you'll be staring at Windows wondering why your installer didn't load.

> **The Hidden Gotcha:**
> Some laptops have **Fast Boot** enabled, which skips USB device detection.
> Disable it if your USB doesn't appear in the boot menu.

---

## Step 3: The Installation Dance – Partitioning Like You Mean It

### Booting Into Battle

USB inserted, laptop restarted, and Ventoy's menu appeared like a choose-your-own-adventure book.
I selected the Proxmox ISO and chose the **Graphical Installer** because life's too short for text-mode installations when you don't have to.

### Disk Partitioning: Where Strategy Meets Reality

Proxmox's automatic partitioning is fine for testing, but this is a homelab—we optimize everything.
Here's my battle-tested strategy for a **512GB SSD**:

| Partition      | Size  | Purpose              | Why This Size?                               |
| -------------- | ----- | -------------------- | -------------------------------------------- |
| **`hdsize`**   | 476GB | Total usable space   | 512GB SSD ≠ 512GB usable (thanks, marketing) |
| **`swapsize`** | 12GB  | System swap          | RAM/3 rule (32GB RAM ÷ 3 ≈ 12GB)             |
| **`maxroot`**  | 75GB  | Proxmox OS partition | OS + logs + future updates                   |
| **`maxvz`**    | 389GB | VM/Container storage | Maximum space for the fun stuff              |

**Why Not Follow "Common Wisdom"?**

- **Swap = RAM**: With 32GB RAM, I don't need 32GB swap. Modern systems rarely swap anyway.
- **Minimal root**: I've seen guides suggesting 20GB for root. That's fine until you need kernel updates, logs pile up, or you install additional packages.
- **Maximize VM storage**: This is where your actual workloads live—don't shortchange it.

> **Advanced Consideration:**
> If you want VM snapshots (and you do), consider **LVM-thin** over **ext4** for the VM storage.
> It's more complex but enables instant snapshots.

---

## Step 4: Basic Configuration (The Boring But Critical Stuff)

### Geography and Keyboards Matter

- **Timezone**: Pick correctly or your log timestamps will haunt you forever
- **Keyboard Layout**: Double-check this. There's nothing quite like trying to type a password with the wrong keyboard mapping.

### Credentials That Actually Work

- **Root Password**: Make it strong, but memorable. You'll type this more than your own name.
- **Email**: Use a real one. Proxmox sends useful alerts about disk failures, memory issues, and update notifications.

> **Security Note:**
> In production, you'd disable root SSH access later and create a dedicated admin user.
> For a homelab? Root access is fine, but don't expose it to the internet.

---

## Step 5: Networking – My $150 Lesson in Humility

### The Wi-Fi Reality Check

Here's where consumer hardware meets enterprise software expectations: **Proxmox's installer doesn't do Wi-Fi.** Period.
It assumes you have enterprise networking with Ethernet everywhere.

For this install, I had to enter **dummy network settings** and fix Wi-Fi post-installation.

### The Mistake That Cost Me 3 Hours

I configured the dummy IP as `192.168.123.100/24`—the same subnet as my home Wi-Fi network.
Seemed logical at the time.

**Plot twist:** When I later configured actual Wi-Fi, the IP conflict created a networking nightmare that involved:

- Ping timeouts
- Mysterious connection drops
- Me questioning my career choices
- A lot of colorful language

### The Simple Fix (Learn From My Pain)

Use a **completely different subnet** for dummy settings:

- **Good**: `192.168.231.100/24` (unlikely to conflict)
- **Bad**: `192.168.1.100/24` (conflicts with most home routers)
- **Terrible**: Same subnet as your actual network (my mistake)

> **Pro Workaround:**
> If you have a **USB-to-Ethernet adapter** lying around, use it during installation.
> It'll make your life infinitely easier.

---

## What's Next: The Fun Stuff Awaits

With Proxmox successfully installed, the real homelab adventure begins:

1. **Wi-Fi Configuration**: Making enterprise software play nice with consumer networking
2. **Storage Optimization**: ZFS pools, LVM-thin, and snapshot strategies
3. **First Virtual Machines**: Home Assistant, Pi-hole, and maybe a Kubernetes cluster
4. **Advanced Features**: Clustering, backup strategies, and monitoring

---

## Final Thoughts: Why This Matters

This old laptop is now running **5 virtual machines simultaneously** with room to spare.
It hosts my Home Assistant, Pi-hole, development environments, and a Minecraft server for my kids.
Total additional cost beyond the laptop? $0.

**The Real Lessons:**

- **Virtualization must be enabled** in BIOS (non-negotiable)
- **Secure Boot will ruin your day** (disable it)
- **Network planning prevents headaches** (use different subnets)
- **Consumer hardware can absolutely run enterprise software** (with some creativity)

This setup proves you don't need enterprise budgets for enterprise capabilities.
Sometimes the best homelab is built from what others consider obsolete.

---

### Coming Up Next

Part 2 will cover the post-installation configuration that transforms this Proxmox install from "it boots" to "it actually works beautifully."
We'll tackle Wi-Fi setup, storage configuration, and deploying your first VMs without breaking anything important.
