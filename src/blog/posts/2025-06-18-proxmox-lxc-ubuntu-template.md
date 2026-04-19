---
title: Deploying Your First LXC – Ubuntu on Proxmox
date: 2025-06-18
author: jabez007
tags:
  - proxmox
  - homelab
  - lxc
  - ubuntu
  - tutorial
  - virtualization
excerpt: |
  Now that Proxmox is installed and (mostly) behaving, it's time to actually build something.
  We're skipping the heavy VMs and diving straight into **LXC containers**—the lightweight, high-performance secret weapon of the homelab world.
  Learn how to grab an Ubuntu template and spin up your first container in minutes.
featured: true
draft: false
---

# From Bare Metal to Running Code: Deploying Your First Ubuntu LXC

## Introduction

So, you've survived the Proxmox installation. Maybe you even wrestled with Wi-Fi drivers or the laptop lid settings (if you're following my previous sagas).
You're staring at that clean, empty Proxmox dashboard, and it's doing that thing where it feels like a giant blank canvas that you're about to ruin.

In the enterprise world, people love their Virtual Machines (VMs). They're great, they're isolated, and they're also **absolute resource hogs**.
If you're running on a repurposed laptop with limited RAM, you need to be a bit more tactical.

Enter **LXC (Linux Containers)**.

Unlike a VM, which emulates an entire hardware stack, a container shares the host's kernel.
It’s lightning-fast, uses almost no overhead, and starts up before you can even finish a sip of coffee.
Today, we're going to grab an Ubuntu template and spin up our first container so this laptop actually starts earning its keep.

---

## Step 1: Priming the Pump – The Template Database

Before we can create a container, we need a "template"—basically a pre-baked image of an OS.
Proxmox keeps a list of these, but it doesn't always have the latest versions indexed right out of the box.

First, let's make sure Proxmox knows what's available.
Open your Proxmox node's **Shell** and run this:

```bash
pveam update
```

This tells the Proxmox Entity Appliance Manager to refresh its list. It's the "apt update" of the container world.

---

## Step 2: Grabbing the Template

Now, let's go shopping.
1. In the side panel, click on your **local** storage (under your node name).
2. Select **CT Templates**.
3. Click the **Templates** button at the top.

You'll see a massive list of Turnkey Linux apps, Alpine, Arch, Fedora, and more.
Search for `ubuntu-24.04` (or whatever the latest LTS is for you).

**Pro Tip:** If you're really tight on disk space, **Alpine Linux** templates are usually around 5MB.
Ubuntu is closer to 120MB, but it's much friendlier if you're just starting out and don't want to Google every single command.

Select Ubuntu and hit **Download**.
Once the task shows "OK," you're ready to build.

---

## Step 3: The "Create CT" Dance

Look at the top right of your Proxmox dashboard. See that **Create CT** button?
Click it. This is where we actually build the thing.

### 1. General Settings

This is where you give your container a name and a password.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Create: Linux Container                                          [ X ]   │
├───────────┬──────────┬────────┬───────┬────────┬─────────┬───────┬───────┤
│ > General │ Template │ Disks  │ CPU   │ Memory │ Network │ DNS   │ Confirm│
├───────────┴──────────┴────────┴───────┴────────┴─────────┴───────┴───────┤
│                                                                          │
│ Node:      pve                                                           │
│ CT ID:     100                                                           │
│ Hostname:  ubuntu-lab-01                                                 │
│                                                                          │
│ [X] Unprivileged container                                               │
│                                                                          │
│ Password:  [ ************ ]                                              │
│ Confirm:   [ ************ ]                                              │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [ ] Advanced                 [ < Back ] [ Next > ] [ Finish ] [ Cancel ] │
└──────────────────────────────────────────────────────────────────────────┘
```

**The "Unprivileged" Trap:** Keep **Unprivileged container** checked.
Privileged containers are easier to work with if you're doing complex hardware passthrough, but they're a massive security hole.
In a homelab, it's better to start secure and only open things up if you absolutely have to.

### 2. Template Selection

Pick the Ubuntu image you just downloaded from the `local` storage.

### 3. Disks

If you check the [official Ubuntu requirements](https://help.ubuntu.com/community/Installation/SystemRequirements), they recommend **25GB** for a full desktop install, or at least **8.6GB** for a minimal install. 

Since we're running a headless LXC container, **8GB or 10GB** is the perfect starting point. It's enough to hold the OS and a few apps without wasting space.
Remember: You can always grow a disk later in Proxmox, but shrinking one is a nightmare you don't want to live through.

### 4. CPU & Memory

Ubuntu Desktop officially asks for a **2 GHz dual-core processor** and **2048 MiB (2 GB) of RAM** for virtualized installs. But because we're skipping the overhead of a full virtual machine:

- **CPU:** **1 Core** is usually plenty for most homelab utility scripts and light servers.
- **Memory:** **512MB RAM / 512MB Swap** is the "Goldilocks" zone for a headless Ubuntu container. 
It's enough to run comfortably without starving your laptop of its precious RAM. 

This is the beauty of LXC—you're running an "official" OS with a fraction of the hardware requirements.

### 5. Networking – The Bridge to Reality

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Create: Linux Container                                          [ X ]   │
├─────────┬──────────┬────────┬───────┬────────┬───────────┬───────┬───────┤
│ General │ Template │ Disks  │ CPU   │ Memory │ > Network │ DNS   │ Confirm│
├─────────┴──────────┴────────┴───────┴────────┴───────────┴───────┴───────┤
│                                                                          │
│ Bridge:    vmbr0                                                         │
│ VLAN Tag:  [         ]                                                   │
│                                                                          │
│ IPv4:      (X) DHCP   ( ) Static                                         │
│ IPv6:      ( ) DHCP   ( ) Static   (X) SLAAC                             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [ ] Advanced                 [ < Back ] [ Next > ] [ Finish ] [ Cancel ] │
└──────────────────────────────────────────────────────────────────────────┘
```

**The "vmbr0" bridge** is your virtual switch. It connects your container to your home network.
Set IPv4 to **DHCP** for now—we can mess with static IPs later once we know the container actually works.

---

## Step 4: The Moment of Truth

Hit **Finish** and watch the task log at the bottom.
Proxmox will carve out the disk space, extract the Ubuntu template, and wire up the networking.

Once it says "TASK OK," right-click your new container (ID 100) and hit **Start**.
Click **Console**, and you should see a login prompt.

**Default Login:**
- **User:** `root`
- **Password:** Whatever you set in Step 1.

### First Order of Business

Once you're in, do the usual ritual:

```bash
apt update && apt upgrade -y
```

If it connects and starts downloading updates, **congratulations**.
You are now running a virtualized Linux environment that's taking up less than 50MB of RAM.

---

## Final Thoughts: Don't Be a Hero

You've just built your first container. Now, before you go and install 50 different things and break it:
1. **Take a Snapshot:** Go to the container's "Snapshots" tab and create one named "Fresh Install." If you mess up a config file later, you can teleport back to this exact moment in seconds.
2. **Back it up:** Set up a simple backup job. A container you can't restore is just a tragedy waiting to happen.

Next time, we'll talk about **Bind Mounts**—how to let your containers talk to your host's storage without making a total mess of things.

Until then, happy labbing!
