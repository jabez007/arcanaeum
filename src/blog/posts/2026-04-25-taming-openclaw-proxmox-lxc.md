---
title: "Taming OpenClaw in a Proxmox LXC: When `systemctl --user` Betrays You"
date: 2026-04-25
author: jabez007
tags:
  - proxmox
  - openclaw
  - lxc
  - systemd
  - troubleshooting
  - homelab
  - linux
excerpt: |
  When "modern developer tooling" meets "minimal Linux environments," things get messy. 
  Learn how to fix OpenClaw's systemd service issues inside a Proxmox LXC container by moving from user-level to system-level daemons.
featured: false
draft: false
---

# Taming OpenClaw in a Proxmox LXC: When `systemctl --user` Betrays You

_Or: Why "Personal-by-Default" is a dangerous assumption in a headless world_

There’s a particular kind of frustration that only shows up when "modern developer tooling" meets "minimal Linux environments." It’s the feeling of a script assuming you’re sitting at a desk with a desktop environment, when in reality, you’re staring at a headless console inside a 512MB LXC container on a repurposed laptop.

This is the story of how I tried to join the cast, installed OpenClaw, and immediately got into a fight with systemd.

## The Setup: A Clean Slate

I started exactly where my earlier post on Ubuntu LXCs left off. I had a fresh Ubuntu 24.04 container humming along, taking up almost no resources.

Out of pure muscle memory (and a desire for good hygiene), I didn't stay as `root`. I created a non-root user named `molty`, gave them sudo powers, and went to work:

- Installed OpenClaw via the standard onboarding.
- Hooked it up to OpenAI models (via Codex OAuth).
- Set Telegram as the messaging provider.

Everything was smooth. Too smooth. I should have known the "Narrator" was about to clear their throat.

## The Problem: The "User Scope" Wall

During the final stages of the installation, the OpenClaw installer tried to be helpful. It attempted to register itself as a background service so it would survive a reboot. It reached for a modern Linux convenience:

```bash
systemctl --user enable --now openclaw-gateway
```

And immediately, the terminal threw a tantrum:

```text
Failed to connect to user scope bus via local transport:
$DBUS_SESSION_BUS_ADDRESS and $XDG_RUNTIME_DIR not defined
```

Narrator: _It would not, in fact, enable --now._

## Why This Happens: The Desktop Delusion

This is a classic "Desktop Linux vs. Server/Container Linux" mismatch.

The command `systemctl --user` depends on a **user session**. In a typical desktop environment (or even a full VM where you've logged in via a physical TTY), the system sets up a "user bus" for you. This involves:

1. A PAM login session.
2. A running user-level D-Bus instance.
3. Environment variables like `XDG_RUNTIME_DIR` (usually `/run/user/1000`).

**In an LXC container? None of that exists.**

LXC containers are lean. When you `lxc-console` or `ssh` in, you aren't always getting a full "seat" at the table. There is no user-level systemd instance running because the system assumes that if you aren't logged in at a GUI, you don't need a personal playground of services.

> **The "Personal-by-Default" Trap**:
> Many modern CLI tools assume you are running them on a laptop. They think: _"This should run when YOU log in."_
> But in a container, we want: _"This should run whether anyone is here or not."_

## The Fix: Don't Fight the Container

Instead of trying to hack a user session into a headless LXC (which is a rabbit hole involving `loginctl enable-linger` and a lot of prayer), the correct path is to **elevate the service to the system level.**

The installer generated a service file that looked something like this:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always

[Install]
WantedBy=default.target
```

This is subtly wrong for our environment. We need a service that knows it's part of the _system_ boot, but still respects our `molty` user.

### The Corrected Service File

Here is the "Arcanaeum-certified" version of the service. Note the explicit paths and user definitions:

```ini
[Unit]
Description=OpenClaw Gateway (profile: main, v2026.4.23)
After=network-online.target
Wants=network-online.target

[Service]
# The Magic Sauce: Run as our user, not root
User=molty
WorkingDirectory=/home/molty
Environment=HOME=/home/molty

# The "Full Path" Rule: systemd does not know your $PATH
ExecStart=/home/molty/.npm-global/bin/openclaw gateway --port 18789

Restart=always
RestartSec=5
SuccessExitStatus=0 143
KillMode=control-group

[Install]
# We want this at system boot, not user login
WantedBy=multi-user.target
```

### Key Changes Explained:

- **`User=molty`**: Even in a container, running as root is sloppy. This keeps the daemon's permissions boxed in.
- **`WantedBy=multi-user.target`**: This tells systemd: "Start this as soon as the network is up, regardless of who is logged in."
- **`Environment=HOME`**: Node.js tools often go looking for config files in `~/.config`. Systemd starts with a very sparse environment, so we have to point it back to our home directory manually.

## The Subtle Gotcha: The NPM Global Path

You'll notice my `ExecStart` points to `/home/molty/.npm-global/bin/openclaw`.

In my setup, I followed another "best practice" of not using `sudo npm install -g`. This means my global packages live in my home directory.

**Pro Tip:** If you ever find yourself wondering why `which openclaw` works in your shell but the service fails with "File not found," it’s because **systemd is not your shell.** It doesn't read your `.bashrc`, it doesn't know about `nvm`, and it doesn't care about your custom `$PATH`. Always use absolute paths.

## Deployment

To make it real, drop that config into the system-wide directory:

```bash
sudo nano /etc/systemd/system/openclaw-gateway.service
```

Then, perform the standard systemd ritual:

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-gateway
sudo systemctl start openclaw-gateway
```

Check the pulse:

```bash
systemctl status openclaw-gateway
journalctl -u openclaw-gateway -f
```

## Lessons Learned

1.  **Containers are not Desktops**: If a tool relies on `systemctl --user`, expect it to break in an LXC.
2.  **Prefer System Services for Daemons**: Even for "personal" apps, if it's on a server, it should be a system-level service running as a restricted user.
3.  **Be Explicit**: Systemd is the ultimate "literalist." No aliases, no shell magic, just raw paths and environment variables.
4.  **Align Mental Models**: The mismatch wasn't a bug in OpenClaw; it was an assumption that didn't account for the lean, headless nature of Proxmox virtualization.

## Final Thoughts

Running OpenClaw as a system-level daemon inside an LXC feels _exactly right_. It starts instantly, uses negligible RAM, and stays out of the way. It’s a perfect example of how a little bit of architectural friction—like a failing `systemctl` command—can actually lead you toward a more resilient and "correct" setup for a homelab.

Now that the gateway is stable, it's time to see what this thing can actually do.
