---
title: "From rsync to rclone: Building a Safe, Headless Google Drive Backup Pipeline in an LXC"
date: 2026-05-02
author: jabez007
tags:
  - proxmox
  - lxc
  - backups
  - rclone
  - gdrive
  - automation
  - homelab
excerpt: |
  Syncing a home directory to Google Drive sounds simple until you remember Google Drive isn't a filesystem. Learn how to build a safe, automated, headless backup pipeline using rclone inside a Proxmox LXC container.
featured: false
draft: false
---

# From rsync to rclone: Building a Safe, Headless Google Drive Backup Pipeline in an LXC

There’s a very particular kind of problem that looks simple right up until you try to solve it: _"I just want to sync my home directory to Google Drive."_

If you’ve spent any time in the Linux world, your brain immediately reaches for `rsync`. It’s muscle memory at this point. And that instinct is _almost_ correct—just not in the way you think.

## The Initial Assumption (and Why It’s Wrong)

My first thought was exactly that: this is a sync problem, so I’ll use `rsync`.

The problem is that **Google Drive is not a filesystem**. It’s an API. There’s nothing for `rsync` to talk to directly unless you first mount it as a filesystem layer via something like `google-drive-ocamlfuse`. You _can_ do that, but it adds complexity, overhead, and brittleness for no real benefit.

What you actually want is a tool that speaks cloud APIs natively.

## Enter rclone

That tool is **rclone**.

Think of it as `rsync`, but designed from the ground up to understand cloud storage providers. It supports Google Drive out of the box, works perfectly in a headless environment, and has familiar semantics (`copy`, `sync`, `check`).

## Constraint: Headless LXC Container

I wasn’t running this on a full Ubuntu desktop environment. This was happening inside an LXC container in Proxmox. Which immediately raises an annoying question: _How do you authenticate with Google without a web browser?_

Turns out, this is a solved problem.

## Authentication Without a GUI

When you run `rclone config` and tell it you're setting up Google Drive in a headless environment, it gives you a URL. 

The flow is surprisingly painless:
1. Open that URL on your local machine's browser.
2. Log into your Google account.
3. Paste the returned token back into the container's terminal.

No desktop required. No weird port forwarding hacks. Just copy and paste.

## The OAuth Rabbit Hole

Of course, this is Google, so they decided you should suffer a little bit.

Creating the necessary API credentials in the **Google Cloud Console** involves navigating an OAuth consent screen, defining scopes (that you don’t actually need to define), dismissing “unverified app” warnings, setting up test users, and dealing with token expiration.

**Key takeaways to save you an hour:**
- You **don’t need to manually define scopes**; rclone requests what it needs.
- You **must add yourself as a test user** in the OAuth consent screen.
- You should **publish the app** to "Production" (this removes the annoying 7-day token expiration for testing mode).
- You will see a giant warning saying _“This app isn’t verified.”_ That’s fine. You wrote it for yourself. Proceed anyway.

## First Sync: Choosing the Right Command

At this point, you have options. The main two are:
- `rclone sync` → Mirrors the source to the destination (and deletes files on the destination if they were deleted locally).
- `rclone copy` → Additive only. It copies new and changed files, but never deletes anything on the destination.

I went with:

```bash
rclone copy ~/ gdrive:home
```

Why? Because accidental deletion is worse than duplication. Storage is cheap; losing your bash history or config files because of a typo is infuriating.

## The Hidden Problem: Bidirectional Sync

It’s tempting to want the Holy Grail: _"Keep local and Google Drive in sync both ways."_

That’s where things get dangerous. Yes, `rclone bisync` exists, but it introduces conflict resolution complexity, the risk of silent overwrites, and state tracking files that can get corrupted. 

Instead, I chose a simpler, more resilient model.

## The Final Architecture

I settled on a **one-way automated backup + manual controlled pull**.

### Automated (cron):
Pushes changes up to Google Drive automatically.
```bash
rclone copy /home/molty gdrive:home
```

### Manual (on demand):
Pulls changes down only when I explicitly ask for them.
```bash
rclone copy gdrive:home /home/molty --update
```

This architecture gives you safe backups, controlled restores, and zero surprise deletions.

## Excluding the Junk (Critical Step)

A home directory is full of garbage you do _not_ want to back up. 

My final exclude list (`~/.config/rclone/excludes.txt`) looked like this:

```text
**/.cache/**
.npm/_cacache/**
.npm/_npx/**
.npm-global/**
**/node_modules/**
.local/share/Trash/**
*.log
```

Used via:

```bash
rclone copy ~/ gdrive:home --exclude-from ~/.config/rclone/excludes.txt
```

Without this, you’ll end up uploading hundreds of thousands of files and gigabytes of easily rebuildable dependencies. Ask me how I know.

## Verification: Don’t Trust, Verify

After the first massive sync finished, I needed to know it actually worked.

```bash
rclone check ~/ gdrive:home --exclude-from ~/.config/rclone/excludes.txt
```

**Important detail:** Your `check` command _must_ use the exact same exclude rules. Otherwise, rclone will report massive mismatches because it sees all your local `node_modules` that aren't on the remote.

## Automation in an LXC Container

Yes, `cron` works perfectly fine in an LXC container. Just make sure:
- The `cron` service is actually running (`systemctl status cron`).
- You use the **user crontab** (`crontab -e`), not the root one.
- You reference the full, absolute paths to everything.

Here's the crontab entry:

```bash
0 * * * * flock -n /tmp/rclone.lock /usr/bin/rclone copy /home/molty gdrive:home --exclude-from /home/molty/.config/rclone/excludes.txt --log-file /home/molty/rclone.log --log-level INFO
```

### Why `flock`?
It prevents overlapping runs. If a sync takes 65 minutes (maybe you downloaded a huge file), the next hourly cron job will silently fail instead of starting a second concurrent upload that thrashes your disk and network.

## Pulling Changes Safely (Human-in-the-Loop)

This was the key design decision. Instead of automating everything and hoping for the best, I built a controlled “pull” process for when I need to restore something.

**Step 1: Preview**
```bash
rclone copy gdrive:home /home/molty --update --dry-run
```

**Step 2: Review the output** to ensure it's not going to overwrite anything important.

**Step 3: Execute (only if safe)**
```bash
rclone copy gdrive:home /home/molty --update
```

This completely avoids overwriting newer local files, unexpected merge conflicts, and those terrible "well, that was a mistake" moments.

## Integrating with OpenClaw

Rather than letting an AI agent blindly run sync commands, I defined a skill in OpenClaw with strict rules for this pipeline:
- Always run `--dry-run` first.
- Summarize the proposed changes.
- Require my explicit confirmation.
- Never use `rclone sync` (only `copy`).
- Always respect the exclude rules.

This turns the operation into a controlled workflow, not a blind command execution.

## Lessons Learned

1. **`rsync` isn’t obsolete—it’s just not for cloud APIs.** You still need the right tool for the job.
2. **Bidirectional sync is a trap.** Unless you have a massive engineering team building conflict resolution algorithms, simple one-way syncs fail far less often.
3. **Exclusions matter more than anything else.** They determine the scale, performance, and ultimate sanity of your backup.
4. **Always preview destructive or state-changing operations.** `--dry-run` is not an optional feature; it’s a critical safety system.
5. **Automation without guardrails is just delayed failure.** Especially when AI agents are involved.

## Final Thoughts

What started as _"I just want to sync my home directory"_ ended up as a headless OAuth flow, a cloud-native backup strategy, a safe automation pipeline, and a human-in-the-loop restore mechanism.

Which, in hindsight, is exactly the level of robustness you want for something as important as your home directory. 

What's next? Maybe versioned backups for point-in-time recovery, or encryption before upload. But honestly, even without those, this setup is already reliable, predictable, and safe—which is more than most homelab backup systems can claim.
