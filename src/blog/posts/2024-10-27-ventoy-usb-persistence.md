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
  Stop asking a 15-year-old laptop to run Windows 10.
  With a cheap USB drive and a few specific Linux distros, 
  you can turn e-waste back into a functional, fast machine.
featured: true
draft: false
---

# Multi-Boot Linux USBs with Persistence (using Ventoy)

Most hardware from the early 2010s isn't actually "obsolete"—it's just burdened by modern software bloat. A laptop with 2GB of RAM will struggle to even boot a fresh Windows 10 installation, let alone run a browser. 

You don't need more RAM; you just need to stop asking a decade-old CPU to do the heavy lifting of a modern OS. [**Ventoy**](https://www.ventoy.net/) lets you carry a whole toolkit of lighter systems on a single USB drive. Instead of flashing one ISO at a time, you just drop the files onto the drive and boot them.

The real power comes with **persistence**. This lets the live environment save your changes—installed packages, browser tabs, Wi-Fi passwords—to a file on the USB so they're still there when you reboot.

## The Goal
We’re going to set up a 128GB drive split into two sections:
1. **Boot Partition (64GB):** For ISOs and persistent storage files.
2. **Storage Partition (64GB):** A standard exFAT partition for moving files between Windows and Linux machines.

### Recommended Distros for Old Hardware
If you're looking for where to start, here’s what I’ve found works best on older hardware:

- **MX Linux:** My go-to. It’s reliable, mid-weight, and has the best hardware detection for those weird old Wi-Fi chips.
- **Bodhi Linux:** This is for the truly ancient stuff. It uses the Moksha desktop and is ridiculously light on resources.
- **LXLE:** Essentially Ubuntu LTS but stripped down for aging PCs. It’s familiar and stable.
- **Puppy Linux:** The wild card. It loads entirely into RAM, which means it’s lightning-fast even on a slow USB 2.0 drive.
- **Kali Linux:** Not just for hacking. It’s actually a solid toolkit for network diagnostics when you’re troubleshooting a broken setup.

---

## 1. Installing Ventoy

**Warning:** This process formats the drive. Back up your data.

1.  **Download and Extract:**
    Check the [latest releases](https://github.com/ventoy/Ventoy/releases) for the current version.
    ```bash
    VENTOY_VER=1.0.99
    wget "https://github.com/ventoy/Ventoy/releases/download/v${VENTOY_VER}/ventoy-${VENTOY_VER}-linux.tar.gz"
    tar -xzf "ventoy-${VENTOY_VER}-linux.tar.gz"
    cd "ventoy-${VENTOY_VER}"
    ```

2.  **Find your drive:**
    Run `lsblk` to identify your USB device (e.g., `/dev/sdb`). Verify the size to ensure you aren't targeting your internal hard drive.

3.  **Flash Ventoy:**
    ```bash
    sudo ./Ventoy2Disk.sh -i /dev/sdX
    ```
    *(Replace `sdX` with your USB identifier)*

---

## 2. Partitioning for Utility

Ventoy usually eats the entire drive. If you want to keep half for regular files (like a normal USB stick), you'll need to do a little manual resizing.

1.  Open `gparted` and select the USB drive.
2.  Unmount the Ventoy partition if it's auto-mounted.
3.  Shrink the main Ventoy partition (Partition 1) to 64GB.
4.  In the remaining unallocated space, create a new **exFAT** partition. Label it "Storage."
5.  Apply changes.

You now have a bootable toolkit that doubles as a normal flash drive.

---

## 3. Configuring Persistence

Ventoy boots ISOs as read-only by default. To save changes, we create a "backend" file—basically a virtual hard drive that sits on your USB.

### For MX Linux (and other Debian/Ubuntu-based distros)
Navigate to your Ventoy partition and create the persistence file:

```bash
# Create a 4GB empty file
truncate -s 4G mx-persistence.dat

# Format it as ext4 with a specific label
mkfs.ext4 -L MX-Persist mx-persistence.dat
```

### Linking the ISO to the Persistence File
Ventoy needs a JSON configuration file to know which ISO should use which persistence file. Create a folder named `ventoy` on the root of the USB, and inside it, a file named `ventoy.json`:

```json
{
  "persistence": [
    {
      "image": "/MX-23_x64.iso",
      "backend": "/mx-persistence.dat"
    },
    {
      "image": "/bodhi-7.0.0-64-apppack.iso",
      "backend": "/bodhi-persistence.dat"
    }
  ]
}
```

*Note: The paths are relative to the root of the USB drive. If your ISOs are in a subfolder, reflect that in the JSON.*

---

## 4. Technical Nuances by Distro

Persistence works a bit differently depending on what you're booting:

*   **MX Linux:** Uses the `MX-Persist` label. When booting, you may need to select "Persistence" from the MX boot menu (after the Ventoy menu).
*   **Ubuntu/Bodhi/LXLE:** These typically look for a file labeled `casper-rw`. If you use the `.dat` file method, ensure the label matches what the distro expects.
*   **Kali Linux:** Requires an extra step. Once booted into Kali with persistence enabled, you must mount the persistence partition and create a `persistence.conf` file:
    ```bash
    mkdir -p /mnt/my_usb
    mount /dev/sdXN /mnt/my_usb  # Where N is your persistence partition/file
    echo "/ union" > /mnt/my_usb/persistence.conf
    umount /mnt/my_usb
    ```
*   **Puppy Linux:** Does not use Ventoy's persistence files. It will prompt you to create a `savefile` on the USB drive itself when you first shut down.

---

## Why I Carry This

I keep one of these in my bag because it’s the ultimate "break glass in case of emergency" tool. If a bootloader dies or I need to pull files off a crashed drive, I’m not stuck. Plus, it’s just satisfying to see a laptop from 2012 outperforming a modern budget machine simply because it's running Bodhi instead of Windows. 

Just remember two things: use **exFAT** for the storage half so you don't run into permission nightmares on Windows, and **always** unmount before pulling the plug. If that persistence file gets corrupted, you're starting from scratch. 

Also, save a backup of your `ventoy.json` on the storage partition—you'll thank yourself later when you accidentally format the wrong partition while experimenting.
