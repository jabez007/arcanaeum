---

title: ProxMox Wi-Fi Saga, Part 2 — The Bridge That Wasn’t
date: 2025-06-21
author: jabez007
tags:
  - proxmox
  - wifi-setup
  - networking
  - troubleshooting
  - homelab
  - linux
  - nat
  - iptables
  - bridging
excerpt: |
  So your Proxmox host finally has Wi-Fi. Victory, right?
  You spin up your first VM… and it has no internet.
  Welcome to the part where Wi-Fi reminds you it’s not Ethernet.
featured: false
draft: false

---

# Proxmox Wi-Fi Saga, Part 2 — The Bridge That Wasn’t

*Or: Why your VMs are offline even though your host is living its best life*

So you followed along with Part 1.

* Wi-Fi works ✅
* DNS works ✅
* `apt update` works ✅

You spin up a VM, ready to conquer the world…

```bash
ping -c 3 8.8.8.8
# → Network unreachable
```

…yeah. About that.

---

## Chapter 5: The Illusion of a Working Network

At first glance, everything looks fine.

Your Proxmox host:

* Has an IP address
* Can reach the internet
* Resolves DNS

Your VM:

* Gets an IP (if you configured one)
* Can see the gateway

But:

```bash
ping 8.8.8.8
# → dead silence
```

No routing. No internet. No joy.

---

## Chapter 6: The Fatal Assumption

Here’s the configuration that *seems* correct:

```
auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports wlo1
    bridge-stp off
    bridge-fd 0
```

If you’ve used Proxmox with Ethernet before, this feels totally normal.

Because normally, this works:

```
VM → vmbr0 → eth0 → LAN → Internet
```

So naturally, we try:

```
VM → vmbr0 → wlo1 → Wi-Fi → Internet
```

And that’s where everything breaks.

---

## Chapter 7: Wi-Fi Is Not Ethernet (No Matter How Much We Wish It Was)

Here’s the uncomfortable truth:

> **You can’t reliably bridge a Wi-Fi interface.**

Not in the way Proxmox expects.

Why?

Because most Wi-Fi networks:

* Only allow **one MAC address per client**
* Drop frames from unknown MACs
* Do not support true layer-2 bridging

Your Proxmox host is allowed on the network.

Your VMs?

They might as well not exist.

---

## Chapter 8: What’s Actually Happening (and why it fails)

Sometimes networking clicks faster when you can *see* it.

### ❌ The Broken Setup (Wi-Fi Bridging Attempt)

```text
        ┌───────────────┐
        │     VM        │
        │ 192.168.123.10│
        │ MAC: AA:BB... │
        └───────┬───────┘
                │
            ┌───▼────┐
            │ vmbr0  │  (bridge)
            └───┬────┘
                │
            ┌───▼────┐
            │ wlo1   │  (Wi-Fi)
            │ MAC:11:22... │
            └───┬────┘
                │
        ┌───────▼────────┐
        │ Wi-Fi Router/AP│
        └────────────────┘
```

### What the router sees:

```text
Incoming frame:
  Source MAC: AA:BB:CC:DD:EE:FF  (VM)

Router thinking:
  "I only authenticated 11:22:33:44:55:66… who the hell is this?"

→ Packet dropped
```

---

## Chapter 9: The Fix — Stop Bridging, Start Routing

Instead of trying to force Wi-Fi to behave like Ethernet…

We pivot. We turn the Proxmox host into a **router**.

### Step 1: Fix the Bridge

The bridge can no longer "own" the Wi-Fi interface. We need to decouple them so the host can handle routing.

In your `/etc/network/interfaces`, change `bridge-ports wlo1` to `none`:

```bash
auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports none  # <--- Change this from wlo1
    bridge-stp off
    bridge-fd 0
```

Now `vmbr0` is just an **internal network** for your VMs. It no longer tries to talk directly to the Wi-Fi hardware.

### Step 2: Enable IP Forwarding

Routing requires the kernel to actually allow packets to move between interfaces. 

You *could* do this manually (`echo 1 > /proc/sys/net/ipv4/ip_forward`), but as you'll see in the next step, it's much better to let the network interface handle this automatically when it starts up.

### Step 3: Add NAT (The Important Bit)

Here’s where the magic happens. We add the routing and NAT rules directly to the `vmbr0` configuration in `/etc/network/interfaces`.

```bash
auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports none
    bridge-stp off
    bridge-fd 0

    # Enable IP Forwarding
    post-up   echo 1 > /proc/sys/net/ipv4/ip_forward

    # Enable NAT for VM subnet → Wi-Fi
    post-up   iptables -t nat -A POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE

    # Allow forwarding from VMs → Wi-Fi
    post-up   iptables -A FORWARD -i vmbr0 -o wlo1 -j ACCEPT
    post-down iptables -D FORWARD -i vmbr0 -o wlo1 -j ACCEPT

    # Allow return traffic back to VMs
    post-up   iptables -A FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    post-down iptables -D FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
```

---

## Chapter 10: What NAT Actually Does

Instead of exposing your VM directly to Wi-Fi, we turn the Proxmox host into a gateway.

### ✅ The Working Setup (NAT / Routed)

```text
        ┌───────────────┐
        │     VM        │
        │ 192.168.123.10│
        └───────┬───────┘
                │
            ┌───▼────┐
            │ vmbr0  │  (internal network)
            │192.168.123.100
            └───┬────┘
                │
        ┌───────▼────────┐
        │ Proxmox Host   │
        │ (NAT happens)  │
        └───────┬────────┘
                │
            ┌───▼────┐
            │ wlo1   │ (Wi-Fi)
            └───┬────┘
                │
        ┌───────▼────────┐
        │ Wi-Fi Router/AP│
        └────────────────┘
```

### What the router sees now:

```text
Source IP: your-laptop-ip
Source MAC: your-laptop-mac

Router thinking:
  "Ah yes, my good and trusted laptop. Proceed."
```

---

## Chapter 11: VM Configuration

Without DHCP (for now), your VM needs:

```
IP Address: 192.168.123.10
Gateway:    192.168.123.100
DNS:        8.8.8.8
```

Then:

```bash
ping -c 3 8.8.8.8
ping -c 3 google.com
```

If both work: 🎉 You’re done.

---

## Final `/etc/network/interfaces` Configuration

Here’s the full working config using NAT and `post-up` / `post-down`.

```bash
auto lo
iface lo inet loopback

auto wlo1
iface wlo1 inet dhcp
    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf

auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports none
    bridge-stp off
    bridge-fd 0

    # Enable IP Forwarding
    post-up   echo 1 > /proc/sys/net/ipv4/ip_forward

    # Enable NAT for VM subnet → Wi-Fi
    post-up   iptables -t nat -A POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE

    # Allow forwarding from VMs → Wi-Fi
    post-up   iptables -A FORWARD -i vmbr0 -o wlo1 -j ACCEPT
    post-down iptables -D FORWARD -i vmbr0 -o wlo1 -j ACCEPT

    # Allow return traffic back to VMs
    post-up   iptables -A FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    post-down iptables -D FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
```

---

## The "Automated" Gotcha: IP Forwarding

You might see other guides recommending manual `echo` commands or editing `/etc/sysctl.conf`. Those work, but they are easy to forget after a reboot or a reconfiguration.

By adding `post-up echo 1 > /proc/sys/net/ipv4/ip_forward` directly to the interface config, we ensure the routing engine only turns on when our bridge is active. It's cleaner, safer, and self-healing.

If things still aren't working, run this to verify:

```bash
cat /proc/sys/net/ipv4/ip_forward
```

If it returns `0`, the interface didn't trigger correctly or another process overrode it.

---

## Optional Sanity Check

On the host:

```bash
iptables -t nat -L -n -v
```

You should see your `MASQUERADE` rule with packet counters increasing when VMs generate traffic.

---

## Mental Model to Keep

If you remember nothing else from this post, remember this:

```text
Wi-Fi = one identity
VMs   = many identities

→ Conflict

NAT = disguise all VMs as the host

→ Problem solved
```

---

## The Trade-Offs

Nothing is free in networking.

With NAT:

### ✅ Pros

* Works reliably on Wi-Fi
* No driver hacks
* No weird bridge behavior
* Predictable

### ❌ Cons

* VMs are **not directly visible on your LAN**
* Incoming connections require port forwarding
* Slightly more setup

---

## The Big Lesson

This whole issue boils down to one incorrect assumption:

> “If it works with Ethernet, it should work with Wi-Fi.”

It doesn’t. And Proxmox doesn’t warn you—it just lets you fall into the trap.

---

## The Victory Lap (Again)

With NAT in place:

* VMs have internet ✅
* Host networking remains clean ✅
* No more silent packet drops ✅

Your Proxmox laptop is now:

> a fully functional, slightly janky, but totally awesome mobile hypervisor.

---

## What’s Next?

In the next post, I’ll probably:

* Add DHCP with `dnsmasq`
* Clean up VM provisioning
* Maybe make this setup actually pleasant to use

But for now? You’ve solved the hardest part.

---

*And all it took was learning that Wi-Fi has trust issues.*
