---
title: Ventoy USB with Persistence
date: 2024-10-27
author: jabez007
tags:
  - ventoy
  - linux
  - bootable-usb
  - lightweight-linux
  - persistence
  - tutorial
  - multi-boot
excerpt: |
  That 15-year-old laptop gathering dust in your closet?
  The one that wheezes trying to boot Windows 10?
  Don't trash it just yet.
featured: true
draft: false
---

# Reviving Old Hardware with Ventoy: Multi-Distro USB with Persistence

That 15-year-old laptop gathering dust in your closet?
The one that wheezes trying to boot Windows 10?
Don't trash it just yet.
With a single 128GB USB drive and some Linux wizardry, you can transform that forgotten machine into a surprisingly capable workstation—or turn it into your new favorite hacking rig.

Modern operating systems have gotten bloated.
Meanwhile, perfectly functional hardware from the early 2000s sits unused because it can't handle today's resource-hungry requirements.
But here's the thing: **lightweight Linux distributions don't care about your ancient CPU or measly 2GB of RAM.**
They'll run circles around what you thought was possible.

The secret weapon? [**Ventoy**](https://www.ventoy.net/)—a tool that lets you boot multiple Linux distributions from a single USB drive, complete with persistence so your changes actually stick around.

In this guide, I'll show you how to create the ultimate revival USB featuring:

- **MX Linux** (the Swiss Army knife of distros)
- **Bodhi Linux** (elegant and lightning-fast)
- **LXLE** (Ubuntu's lightweight cousin)
- **Puppy Linux** (runs on hardware from the stone age)
- **Kali Linux** (because sometimes you need to look intimidating)

> **Plot twist:**
> I'm only using half my USB drive for this setup.
> The other 64GB remains a perfectly normal USB drive for file storage.

---

## 🧙 What Makes Ventoy Magical?

Traditional bootable USB creation is a pain.
Flash an ISO, test it, wipe it, flash another ISO, repeat ad nauseam.
Ventoy changes the game completely.

**Here's how it works:** You literally just copy ISO files to your USB drive like regular files.
No flashing, no special tools, no ceremony.
Ventoy creates a boot menu that lets you pick any ISO and boot it directly.

But the real magic happens with **persistence**—the ability to save your changes, installed programs, and personal files across reboots.
Install software, customize your desktop, save documents, and they'll all be there next time you boot up.

Think of it as carrying multiple complete operating systems in your pocket, each remembering exactly how you left it.

---

## 🔧 What You'll Need

- **128GB USB drive** (or larger—trust me, you'll want the space)
- A Linux system to do the setup (WSL on Windows works too)
- [Ventoy](https://www.ventoy.net/en/download.html)
- ISO files for your chosen distros
- About 30 minutes and a willingness to partition things

---

## 🛠️ Step 1: Install Ventoy (The Foundation)

> **⚠️ Fair warning:**
> This nukes everything on your USB drive.
> Back up first if needed.

1. **Grab Ventoy and extract it:**

   ```bash
   wget https://github.com/ventoy/Ventoy/releases/download/v1.0.XX/ventoy-x.x.xx-linux.tar.gz
   tar -xzf ventoy-x.x.xx-linux.tar.gz
   cd ventoy-x.x.xx
   ```

2. **Identify your USB drive:**

   ```bash
   lsblk
   ```

   Look for your USB device (something like `/dev/sdb` or `/dev/sdc`).
   **Make sure you get the right one**—this is the "format the wrong drive and cry" moment.

3. **Install Ventoy:**
   ```bash
   sudo ./Ventoy2Disk.sh -i /dev/sdX
   ```
   Replace `sdX` with your actual USB device.

After installation, you'll have a USB that can boot multiple ISOs.
But we're not done yet—we want that dual-partition setup.

---

## 📦 Step 2: Create the Perfect Dual-Partition Layout

Here's where we get clever.
Instead of dedicating the entire 128GB to Ventoy, let's split it 50/50:

1. **Resize the Ventoy partition to 64GB** using `gparted`:

   - Launch `gparted` and select your USB drive
   - Right-click the main Ventoy partition and choose "Resize/Move"
   - Shrink it to 64GB, leaving 64GB unallocated
   - Create a new partition in the unallocated space (I recommend exFAT for cross-platform compatibility)
   - Label it something memorable like "Storage"

2. **Your final layout:**
   ```
   /dev/sdX1 - Ventoy (64GB) - Your bootable partition
   /dev/sdX2 - Storage (64GB) - Regular USB storage
   ```

Now you have the best of both worlds: a powerful multi-boot system AND a normal USB drive for everyday file transfers.

---

## 📁 Step 3: Add ISOs and Configure Persistence

Time to populate your USB with operating systems. Copy your ISO files to the Ventoy partition (usually auto-mounted at `/media/$USER/Ventoy`).

But here's where it gets interesting—**persistence files** let each distro remember its changes.

### Creating Persistence for MX Linux

MX Linux is fantastic for older hardware, so let's give it 4GB of persistence:

```bash
cd /media/$USER/Ventoy
truncate -s 4G mx-persistence.dat
mkfs.ext4 -L MX-Persist mx-persistence.dat
```

### Tell Ventoy How to Use It

Create a `ventoy` folder and add a `ventoy.json` configuration file:

```json
{
  "persistence": [
    {
      "image": "/MX-23_x64.iso",
      "backend": "/mx-persistence.dat"
    }
  ]
}
```

### Adding More Distros

Let's add Bodhi Linux with 2GB persistence:

```bash
truncate -s 2G bodhi-persistence.dat
mkfs.ext4 -L BodhiPersist bodhi-persistence.dat
```

Update your `ventoy.json`:

```json
{
  "persistence": [
    {
      "image": "/MX-23_x64.iso",
      "backend": "/mx-persistence.dat"
    },
    {
      "image": "/bodhi-6.0.0.iso",
      "backend": "/bodhi-persistence.dat"
    }
  ]
}
```

> **Pro tip:**
> File names don't have to match the ISO names—just make sure the paths in your JSON are correct.

---

## 🐧 Distro-Specific Notes (The Gotchas)

Each Linux distribution has its own personality when it comes to persistence:

- **MX Linux**: Works perfectly with the `.dat` file approach above. It's like the golden retriever of Linux distros—friendly and reliable.

- **Bodhi Linux**: Ubuntu-based, so it follows the same persistence pattern as MX Linux. Incredibly lightweight and beautiful.

- **LXLE**: Another Ubuntu derivative. Use the same setup as Bodhi Linux. Great for machines with limited resources.

- **Puppy Linux**: This little guy is special. It has its own persistence system—just boot it and it'll offer to create a save file automatically. Perfect for machines with ridiculously low specs.

- **Kali Linux**: For persistence, create a file named `persistence` (not `persistence.dat`) and add a `persistence.conf` file inside it. Check the [official Kali documentation](https://www.kali.org/docs/usb/kali-linux-live-usb-persistence/) for details.

---

## 🚀 The Moment of Truth: Booting Up

Plug your creation into that ancient laptop, mash F12 (or whatever gets you to the boot menu), select USB, and watch the magic happen.
You should see a clean Ventoy menu listing all your ISOs.

Pick one, boot it up, and start customizing.
Install software, change wallpapers, create documents.
When you reboot, everything will be exactly as you left it—**if you set up persistence correctly.**

The first time you see a 2008 netbook running a modern Linux desktop smoothly, you'll understand why this approach is so satisfying.

---

## 🎯 Real-World Results

I've used this exact setup to:

- Transform a 2008 netbook into a surprisingly capable Bodhi Linux workstation for writing and light development
- Convert spare laptops into portable penetration testing rigs with Kali Linux
- Create emergency rescue systems that can diagnose and fix problems on any computer
- Give new life to friends' "broken" computers that just needed a lightweight OS

The flexibility is incredible. One USB drive becomes a complete toolkit for hardware revival.

---

## 🔧 Pro Tips for Success

- **Always safely eject** your USB after making changes to persistence files
- **Keep a backup** of your `ventoy.json` file—you'll thank me later
- **Consider adding utility ISOs** like GParted Live or SystemRescue for emergencies
- **Label your persistence files clearly**—future you will appreciate the organization
- **Test each distro** after setting up persistence to make sure everything works

---

## 🏆 The Final Verdict

With a 128GB USB drive, some lightweight Linux distros, and Ventoy's magic, you can resurrect practically any piece of hardware from the last 15 years. That "obsolete" laptop becomes a portable Linux workstation. That old desktop becomes a home server. That forgotten netbook becomes your new favorite writing machine.

The best part?
You're not just breathing life into old hardware—you're learning about Linux, exploring different desktop environments, and developing skills that transfer to modern systems.

Plus, there's something deeply satisfying about making a 15-year-old computer run better than it did when it was new.

---

_Now stop reading and go rescue that laptop from your closet. It's been waiting long enough._
