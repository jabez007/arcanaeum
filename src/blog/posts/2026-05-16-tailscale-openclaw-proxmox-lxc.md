---
title: Tailscale, OpenClaw, and the Missing Tunnel Device
date: 2026-05-16
author: jabez007
tags:
  - tailscale
  - openclaw
  - proxmox
  - lxc
  - homelab
  - vpn
  - networking
  - troubleshooting
  - linux
excerpt: |
  I wanted private remote access to my OpenClaw box without exposing the gateway to the internet. Tailscale looked like the obvious answer. Then my Proxmox LXC reminded me that containers and networking devices have opinions.
featured: false
draft: false
---

# Tailscale, OpenClaw, and the Missing Tunnel Device

There is a very particular kind of optimism that appears right before a homelab networking task goes sideways.

It starts with a reasonable goal.

> I want to access this service remotely, securely, and without exposing random ports to the internet like some sort of dashboard-shaped sacrifice to Shodan.

That was the goal here.

I had an OpenClaw instance running inside a Proxmox LXC. OpenClaw was already set up as my personal AI-agent gateway, and I wanted a better way to reach it privately from my other machines. No public endpoint. No router port forwarding. No Cloudflare Tunnel. No “it is probably fine because there is a token on it” nonsense.

Enter Tailscale.

Tailscale is one of those tools that feels almost suspiciously convenient: install it on a few devices, authenticate them into the same private tailnet, and suddenly those devices can talk to each other over a WireGuard-backed private network without the usual VPN ceremony.

For my OpenClaw setup, that sounded perfect.

The intended shape was simple:

```text
Laptop / desktop / phone
        |
        | Tailscale tailnet
        v
OpenClaw LXC on Proxmox
        |
        v
OpenClaw gateway bound privately
```

No public internet exposure. No inbound router rules. No eldritch port-forwarding ritual.

Naturally, the first attempt exploded.

## The Tailscale setup

I started from the Tailscale dashboard using the **Add Linux server** flow.

For the auth key, I made a few deliberate choices:

* I used tags for the server.
* I left **Ephemeral** off.
* I left **Use as Exit Node** off.
* I left **Reusable** off.

That combination made sense for this machine.

This OpenClaw LXC is not a throwaway CI runner or temporary test container, so it should not be ephemeral. I also did not want it acting as an exit node. The goal was to reach OpenClaw privately, not route all my laptop traffic through this box like a bargain-bin commercial VPN.

I also did not need a reusable auth key. One server, one key, one join operation. Reusable auth keys are convenient, but if one leaks, congratulations, you may have invented an enrollment portal for future regrets.

The tags were useful because this machine is better thought of as infrastructure than as “my personal laptop.” In Tailscale terms, tags make it easier to write ACLs around machine roles later.

So far, so good.

Then I installed Tailscale in the OpenClaw LXC and checked the service.

```bash
sudo systemctl status tailscaled
```

And systemd responded with the traditional Linux equivalent of a shrug and a corpse.

```text
× tailscaled.service - Tailscale node agent
     Loaded: loaded (/usr/lib/systemd/system/tailscaled.service; enabled; preset: enabled)
     Active: failed (Result: exit-code)
...
     Main PID: ... (code=exited, status=1/FAILURE)
...
systemd[1]: tailscaled.service: Start request repeated too quickly.
systemd[1]: tailscaled.service: Failed with result 'exit-code'.
systemd[1]: Failed to start tailscaled.service - Tailscale node agent
```

That output is useful in the same way a smoke alarm is useful. It tells you there is a problem. It does not tell you which appliance has achieved sentience and chosen violence.

So the next step was to ask the daemon what actually happened.

```bash
sudo journalctl -u tailscaled -n 100 --no-pager
```

The relevant part was this:

```text
tailscaled: Linux kernel version: 6.8.12-20-pve
tailscaled: is CONFIG_TUN enabled in your kernel? `modprobe tun` failed with: modprobe: FATAL: Module tun not found in directory /lib/modules/6.8.12-20-pve
tailscaled: tun module not loaded nor found on disk
tailscaled: wgengine.NewUserspaceEngine(tun "tailscale0") error: tstun.New("tailscale0"): CreateTUN("tailscale0") failed; /dev/net/tun does not exist
tailscaled: getLocalBackend error: createEngine: tstun.New("tailscale0"): CreateTUN("tailscale0") failed; /dev/net/tun does not exist
```

And then the container gave the final clue:

```bash
ls -l /dev/net/tun
```

```text
ls: cannot access '/dev/net/tun': No such file or directory
```

There it was.

Tailscale was installed correctly. The service was being started correctly. The problem was that the LXC did not have access to the TUN device.

## The actual problem: `/dev/net/tun`

Tailscale needs a TUN device to create its network interface. On a normal Linux machine, this is usually boring and invisible. On a Proxmox LXC, especially an unprivileged container, that device may not be available inside the container unless you explicitly allow it.

That is what was happening here.

Inside the container, `tailscaled` tried to create the `tailscale0` interface. It looked for `/dev/net/tun`. The device was missing. Then it tried to be helpful and mentioned `modprobe tun`, but that was a bit of a red herring inside the container.

The LXC is using the Proxmox host kernel. The container does not have its own kernel modules in the normal VM sense. So “module not found in `/lib/modules/...`” inside the container is not necessarily the real fix path.

The real fix was to expose the host TUN device into the container.

## Fixing the Proxmox LXC config

This part has to be done on the **Proxmox host**, not inside the OpenClaw container.

First, find the container ID:

```bash
pct list
```

Then stop the container:

```bash
pct stop <CTID>
```

Next, edit the LXC config:

```bash
nano /etc/pve/lxc/<CTID>.conf
```

I added these lines:

```text
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

Then I started the container again:

```bash
pct start <CTID>
```

Those two lines are the magic here.

```text
lxc.cgroup2.devices.allow: c 10:200 rwm
```

This allows the container to access the character device with major/minor numbers `10:200`, which corresponds to `/dev/net/tun`.

```text
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

This bind-mounts `/dev/net` from the host into the container, creating the target directory if needed.

After that, inside the container:

```bash
ls -l /dev/net/tun
```

should show something like:

```text
crw-rw-rw- 1 root root 10, 200 ... /dev/net/tun
```

At that point, Tailscale could finally create its tunnel interface.

## Restarting Tailscale

Back inside the OpenClaw LXC, I reset the failed systemd state and started the service again:

```bash
sudo systemctl reset-failed tailscaled
sudo systemctl start tailscaled
sudo systemctl status tailscaled
```

This time, progress:

```text
● tailscaled.service - Tailscale node agent
     Loaded: loaded (/usr/lib/systemd/system/tailscaled.service; enabled; preset: enabled)
     Active: active (running)
     Status: "Needs login: "
```

At first glance, `Needs login` can look like another error.

It is not.

It means the daemon is now running successfully, but the machine has not joined the tailnet yet.

The logs also included this:

```text
health(warnable=wantrunning-false): error: Tailscale is stopped.
```

Again, not the same problem as before. This is Tailscale saying the daemon exists, but the client state has not been brought up yet.

The fix was simply:

```bash
sudo tailscale up
```

That produced the normal browser-based login flow. After authenticating, the OpenClaw box appeared in the Tailscale dashboard.

Victory.

Or, at least, the kind of victory where the service works and only a modest amount of sanity has been consumed.

## Verifying the setup

Once Tailscale was authenticated, I checked the node from inside the LXC:

```bash
tailscale status
```

and:

```bash
tailscale ip -4
```

The second command should return a `100.x.y.z` Tailscale IP.

From another machine on the same tailnet, useful checks are:

```bash
tailscale ping <openclaw-hostname>
```

and, if SSH access is enabled:

```bash
ssh molty@<openclaw-hostname>
```

Depending on MagicDNS and the machine name, the hostname may be the short machine name or the full Tailscale DNS name shown in the dashboard.

## The OpenClaw goal

Getting Tailscale running was only the network plumbing part. The actual goal was to make OpenClaw available privately.

For that, the setup I want is:

```text
OpenClaw gateway binds to loopback
Tailscale provides private access through the tailnet
No public port forwarding
No public Funnel unless explicitly needed
```

The rough OpenClaw configuration shape is:

```js
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" }
  }
}
```

Or from the CLI:

```bash
openclaw gateway --tailscale serve
```

The important distinction is **Serve** versus **Funnel**.

Tailscale Serve exposes a local service to devices inside the tailnet. That is what I want here.

Tailscale Funnel exposes a local service to the public internet through a Tailscale-provided URL. That may be useful for some workflows, but it is explicitly not my default goal for OpenClaw. I did not go through this entire exercise just to reinvent “public dashboard with extra steps.”

For this setup, the target state is:

```text
OpenClaw Gateway: private
Tailscale: private network layer
Router port forwards: none
Public Funnel: off
SSH: available only through Tailscale, if enabled
```

## Troubleshooting summary

The initial symptom:

```text
tailscaled.service failed with exit-code
Start request repeated too quickly
```

The useful diagnostic command:

```bash
sudo journalctl -u tailscaled -n 100 --no-pager
```

The real error:

```text
CreateTUN("tailscale0") failed; /dev/net/tun does not exist
```

The confirmation:

```bash
ls -l /dev/net/tun
```

Bad result:

```text
No such file or directory
```

The Proxmox LXC fix, added to `/etc/pve/lxc/<CTID>.conf` on the Proxmox host:

```text
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

Then restart the container:

```bash
pct stop <CTID>
pct start <CTID>
```

Restart Tailscale inside the container:

```bash
sudo systemctl reset-failed tailscaled
sudo systemctl start tailscaled
sudo systemctl status tailscaled
```

If the status says this:

```text
Status: "Needs login: "
```

then the daemon is working. Finish the join process:

```bash
sudo tailscale up
```

Then verify:

```bash
tailscale status
tailscale ip -4
```

## Final thoughts

This was not really an OpenClaw problem. OpenClaw was just the reason I was installing Tailscale in the first place.

The actual issue was the classic container tradeoff: LXCs are lightweight because they share the host kernel, but that also means some things that feel automatic on a VM or bare-metal Linux box need to be explicitly passed through.

In this case, Tailscale needed `/dev/net/tun`, and the container did not have it.

Once the TUN device was exposed to the LXC, `tailscaled` started normally. Then `sudo tailscale up` joined the machine to the tailnet, and the OpenClaw box appeared in the Tailscale dashboard.

So the final lesson is simple:

> If Tailscale fails inside a Proxmox LXC, check `/dev/net/tun` before you start blaming DNS, auth keys, OAuth, systemd, OpenClaw, or the alignment of the networking planets.

Because sometimes the VPN is not broken.

Sometimes the tunnel is just missing.
