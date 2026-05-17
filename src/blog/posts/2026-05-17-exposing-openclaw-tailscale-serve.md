---
title: Tailscale Serve and the Pursuit of Private Access
date: 2026-05-17
author: jabez007
tags:
  - tailscale
  - openclaw
  - networking
  - homelab
  - serve
  - vpn
  - linux
  - troubleshooting
excerpt: |
  Getting Tailscale running in an LXC was the hard part. But once the tunnel is stable, you're left with a choice: do you expose your gateway to the public internet, or do you keep it strictly for the family? I chose Tailscale Serve.
featured: false
draft: false
---

# Tailscale Serve and the Pursuit of Private Access

Once you survive the initial struggle of getting Tailscale to actually talk to the `/dev/net/tun` device in a Proxmox LXC, you’re greeted with a beautiful, quiet landscape. Your machine is on the tailnet. It has an IP. It has a hostname.

But just because the machine is visible doesn’t mean the *service* is.

I wanted my OpenClaw Control UI to be reachable from my phone and laptop, but I had no intention of letting the general public—or the automated scanners that roam the internet like digital locusts—anywhere near it.

This is the story of how I configured **Tailscale Serve** to bridge that final gap, and the small collection of permissions errors I collected along the way.

## Serve vs. Funnel: Choose Your Fighter

Tailscale gives you two primary ways to expose a local service: **Serve** and **Funnel**.

- **Serve** is for internal use. It terminates HTTPS and proxies traffic, but only for devices already authenticated to your tailnet.
- **Funnel** is for the public internet. It’s what you use when you want to host a blog or a demo that the whole world can see.

For an admin surface like OpenClaw, choosing Funnel is like leaving your front door wide open because you like the breeze. I chose Serve. I wanted the breeze, but I also wanted a locked gate.

## Step 1: Binding to the Void (Localhost)

The first rule of secure proxying is to make sure the application itself isn't listening to the world.

In my `~/.openclaw/openclaw.json`, I tightened the screws. I told the Gateway to bind specifically to `loopback`. If the traffic doesn't come from inside the house, OpenClaw shouldn't even hear the knock.

```json
{
  "gateway": {
    "mode": "local",
    "bind": "loopback",
    "port": 18789,
    "auth": {
      "mode": "token",
      "allowTailscale": true
    },
    "tailscale": {
      "mode": "serve"
    },
    "controlUi": {
      "allowedOrigins": [
        "http://127.0.0.1:18789",
        "https://my-openclaw-box.tail-xyz.ts.net"
      ]
    }
  }
}
```

The `allowTailscale: true` flag is a nice touch—it tells OpenClaw to trust the identity headers Tailscale injects. And `allowedOrigins` is the browser's way of making sure the UI doesn't have a mid-life crisis when it realizes it's being accessed via a domain name instead of `127.0.0.1`.

## Step 2: The "Permission Denied" Ritual

I restarted OpenClaw, expected magic, and was rewarded with a very familiar kind of failure.

OpenClaw tried to invoke the Tailscale CLI to set up the proxy, and Tailscale responded with:

```text
Access denied: serve config denied
Use 'sudo tailscale serve ...'
To not require root, use 'sudo tailscale set --operator=$USER' once.
```

In the Linux world, `sudo` is the "I am the captain now" button. But having an application constantly asking for root just to manage a proxy felt messy. The fix was to grant my user the right to manage Tailscale settings directly:

```bash
sudo tailscale set --operator=$USER
```

Once that was done, the friction disappeared.

## Step 3: Engaging the Proxy

With permissions sorted, I could tell Tailscale to start the engine.

```bash
tailscale serve --bg --yes 18789
```

This command is doing a lot of heavy lifting behind the scenes. It’s requesting a Let's Encrypt certificate, setting up an HTTPS listener on port 443, and pointing all that encrypted goodness at the OpenClaw Gateway sitting quietly on port 18789.

I verified it with the status command:

```bash
tailscale serve status
```

The output was exactly what I wanted to see:
```text
https://my-openclaw-box.tail-xyz.ts.net
|-- / proxy http://127.0.0.1:18789
```

## The "Loopback" Confusion

One minor detail that might trip you up: if you run `openclaw gateway status`, it will still tell you it's bound to `127.0.0.1`.

Do not panic.

This is correct. OpenClaw *is* still bound to loopback. It’s hiding behind Tailscale like a VIP in a booth. The fact that you can reach it via the tailnet URL is thanks to Tailscale acting as the world's most secure bouncer.

## Result: Zero-Exposure Remote Access

I tested this from my phone while sitting on a cellular connection (with the Tailscale app active, of course). It worked perfectly.

- **Encrypted?** Yes, via Tailscale's automatic HTTPS.
- **Private?** Yes, only my devices can see it.
- **Simple?** Once the permissions were handled, it became invisible.

It’s a pattern I’m starting to use for almost everything in my lab. Keep the apps local, keep the ports closed, and let the tailnet handle the transport. It’s safer, cleaner, and involves significantly fewer sacrifices to the gods of port-forwarding.
