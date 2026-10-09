---
title:
date: 2026-09-06
author: jabez007
tags:
excerpt: |
featured: false
draft: true
---

# Docker Inside a Proxmox LXC: The Storage Gotcha Hiding in Plain Sight

I had what seemed like a fairly simple goal:

> Run Docker inside an LXC container on my Proxmox server without letting Docker eventually eat the container's root filesystem.

This wasn't going to become a giant Docker host. I wasn't building Kubernetes-in-LXC-in-Proxmox-in-a-box because apparently I still have some limits.

The actual use case was much smaller.

I have a Hermes Agent instance running inside an LXC container, and I wanted to give one particularly experimental agent profile its own Docker-backed terminal sandbox. The containers would mostly be disposable. A little Python, Node, Git, package installation, random experiments—the sort of workload where isolation is useful and persistence is mostly a liability.

Docker inside the LXC was straightforward enough.

Storage turned out to be slightly more interesting.

And by "slightly more interesting," I mean:

> I carefully gave Docker its own disk so it couldn't fill `/`, only to discover that modern Docker was quietly storing the largest part somewhere else.

Excellent.

## The Starting Point

The stack looks roughly like this:

```text
Proxmox
└── LXC: OpenClaw / Hermes Agent
    ├── Hermes Agent
    ├── profiles
    ├── Kanban state
    ├── SQLite databases
    └── Docker
        └── disposable agent sandboxes
```

The LXC itself is an unprivileged container, and Docker runs inside it.

I specifically didn't want Docker sharing the LXC's root filesystem without limits.

A Docker host has several perfectly normal ways to slowly consume disk:

- images;
- old image layers;
- build caches;
- stopped containers;
- volumes;
- logs;
- temporary experimental garbage that was absolutely going to be cleaned up "later."

On a dedicated Docker VM, that's annoying.

On the same filesystem holding Hermes state, configuration, logs, and SQLite databases, filling `/` would be considerably less amusing.

So I gave Docker its own storage.

## Giving `/var/lib/docker` Its Own Proxmox Volume

Proxmox was already using LVM-thin storage, so I didn't see much reason to introduce ZFS just for this.

Some Docker-in-LXC guides recommend ZFS because datasets and quotas can help constrain Docker growth. That's a perfectly legitimate architecture for a larger Docker host.

For this use case, though, I didn't need another storage stack.

I needed a fence.

So I added a dedicated 12 GB Proxmox mount point to the LXC at:

```text
/var/lib/docker
```

The idea was simple:

```text
Docker behaves itself
    → great

Docker loses its mind
    → /var/lib/docker fills

/ remains alive
    → also great
```

After mounting it, the first sanity check looked exactly as expected:

```bash
$ df -h /var/lib/docker
Filesystem                        Size  Used Avail Use% Mounted on
/dev/mapper/pve-vm--100--disk--0   12G  208K   12G   1% /var/lib/docker
```

Perfect.

Docker now had its own little 12 GB sandbox inside the larger LXC sandbox.

What could possibly go wrong?

## Installing Docker

Docker installed normally.

Afterward:

```bash
$ sudo docker info | grep -E 'Docker Root Dir|Storage Driver'
 Storage Driver: overlayfs
 Docker Root Dir: /var/lib/docker
```

Exactly what I wanted.

Docker said its root directory was:

```text
/var/lib/docker
```

And `/var/lib/docker` was backed by the dedicated Proxmox volume.

I ran a tiny container and checked usage:

```bash
$ sudo docker system df
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          1         0         36.94kB   11.06kB (29%)
Containers      0         0         0B        0B
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
```

Still boring.

Boring infrastructure is good infrastructure.

## Fixing Docker's Other Famous Disk-Eating Habit

Before putting anything real on it, I also dealt with Docker's default JSON logs.

I wanted to keep the normal `json-file` logging driver, but I did not want "one container got chatty overnight" to become a filesystem incident.

So `/etc/docker/daemon.json` became:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

That keeps JSON logging while rotating at roughly 10 MB per file and retaining three files per container.

Validate before restarting:

```bash
sudo dockerd --validate --config-file=/etc/docker/daemon.json
```

Docker responded:

```text
configuration OK
```

Then:

```bash
sudo systemctl restart docker
```

And:

```bash
$ sudo docker info | grep 'Logging Driver'
 Logging Driver: json-file
```

Excellent.

At this point I had:

- Docker running inside the LXC;
- a dedicated 12 GB filesystem for `/var/lib/docker`;
- rotating logs;
- ephemeral containers planned for the actual workload.

This felt done.

It was not done.

## Then `/var/lib/containerd` Entered the Chat

For one final sanity check, I ran:

```bash
sudo du -sh /var/lib/docker /var/lib/containerd 2>/dev/null
```

The initial result wasn't alarming:

```text
220K    /var/lib/docker
328K    /var/lib/containerd
```

Both were essentially empty.

But the existence of that second directory raised an important question:

> Why is containerd storing anything under `/var/lib/containerd` if I just went through all this trouble to isolate Docker storage under `/var/lib/docker`?

Welcome to modern Docker.

On newer Docker installations using the containerd image store, Docker's own daemon data may live under:

```text
/var/lib/docker
```

while container image content and snapshots can live under:

```text
/var/lib/containerd
```

Which was still on the LXC root filesystem.

So my beautiful storage boundary actually looked like this:

```text
LXC /
├── Hermes
├── SQLite databases
├── system state
├── /var/lib/containerd    ← surprise!
│   └── potentially large image layers
│
└── mounted 12 GB volume
    └── /var/lib/docker
```

In other words:

> I had successfully prevented part of Docker from filling `/`.

The part most likely to become large had apparently declined my invitation.

## Why This Matters

This particular workload will mostly use disposable containers, so persistent Docker volumes aren't a major concern.

Images are.

A development sandbox with Python, Node, Git, compilers, package managers, and whatever else gets pulled in can easily be gigabytes.

If those image layers accumulate under `/var/lib/containerd`, then my 12 GB Docker volume isn't actually providing the failure boundary I intended.

The failure mode becomes:

```text
Pull some large images
        ↓
containerd consumes /
        ↓
root filesystem fills
        ↓
Hermes cannot write state
SQLite cannot write
services become unhappy
Jimmy becomes unhappy
```

This was precisely the scenario the separate Docker disk was supposed to prevent.

## The Actual Storage Boundary I Want

Instead, I want both Docker and containerd storage constrained by that same 12 GB filesystem:

```text
Proxmox LVM-thin
└── 12 GB mount
    └── /var/lib/docker
        ├── Docker daemon data
        └── containerd-data
            ├── image content
            └── snapshots
```

Now the failure mode is:

```text
Docker/containerd gets greedy
        ↓
12 GB Docker filesystem fills
        ↓
Docker breaks
        ↓
LXC root filesystem survives
        ↓
Hermes survives
```

Still inconvenient.

Much less exciting.

That's exactly what I want.

## Moving containerd Onto the Docker Volume

containerd has its own storage root configuration.

Rather than give it another Proxmox disk, I can simply place its data underneath the filesystem I already allocated for Docker.

For example:

```text
/var/lib/docker/containerd-data
```

First, inspect the current containerd configuration:

```bash
sudo containerd config dump | grep -E '^root|^state'
```

The important value is normally the root:

```text
root = "/var/lib/containerd"
```

Before changing anything, stop Docker and containerd:

```bash
sudo systemctl stop docker docker.socket
sudo systemctl stop containerd
```

Create the new location:

```bash
sudo mkdir -p /var/lib/docker/containerd-data
```

Then copy the existing state:

```bash
sudo rsync -aHAX --numeric-ids \
  /var/lib/containerd/ \
  /var/lib/docker/containerd-data/
```

The containerd configuration can then be adjusted so its root points to:

```toml
root = "/var/lib/docker/containerd-data"
```

The important part here is not to casually overwrite an existing `/etc/containerd/config.toml`.

If there's already a configuration file, modify the relevant top-level `root` setting and leave the rest alone.

Then bring everything back:

```bash
sudo systemctl start containerd
sudo systemctl start docker
```

And verify what containerd thinks its root is:

```bash
sudo containerd config dump | grep -E '^root|^state'
```

Then test Docker normally:

```bash
sudo docker run --rm hello-world
```

Finally:

```bash
sudo du -sh \
  /var/lib/docker \
  /var/lib/docker/containerd-data \
  /var/lib/containerd 2>/dev/null

df -h /var/lib/docker
df -h /
```

The goal is to verify that new image/snapshot activity happens on the dedicated volume rather than quietly consuming `/`.

Only after verifying that would I clean up the old containerd data.

Because deleting the old copy first would transform a storage cleanup exercise into a learning opportunity about disaster recovery.

I already had enough learning opportunities for one afternoon.

## Why Not Just Use ZFS?

ZFS would certainly work.

And if I were building a host with:

- several Docker LXCs;
- persistent databases;
- large application volumes;
- lots of snapshots;
- per-workload quotas;
- heavy build workloads;

then ZFS datasets would be very attractive.

But that's not what this machine is doing.

My goal is much narrower:

> Give an AI agent a disposable Docker execution environment without letting its experiments consume the filesystem used by Hermes itself.

For that, an LVM-thin-backed 12 GB mount is already an effective quota.

There's no particular magic in ZFS that makes Docker stop growing.

The useful property is simply:

```text
Docker storage
cannot exceed
a deliberately bounded filesystem
```

LVM-thin plus a fixed-size filesystem gives me that without changing the Proxmox host's storage architecture.

## The Final Shape

The end result looks like this:

```text
Proxmox
└── unprivileged LXC
    │
    ├── /
    │   ├── OS
    │   ├── Hermes Agent
    │   ├── profiles
    │   ├── Kanban state
    │   └── SQLite databases
    │
    └── 12 GB dedicated mount
        └── /var/lib/docker
            ├── Docker daemon data
            ├── rotating container logs
            └── containerd-data
                ├── image layers
                └── snapshots
```

And above that:

```text
Hermes Agent
└── Razzik
    └── Docker terminal backend
        └── disposable container
            ├── Python
            ├── Node
            ├── Git
            ├── network egress
            ├── temporary filesystem
            └── hopefully no opportunity to set anything important on fire
```

## Lessons Learned

The biggest lesson here wasn't really about Docker or Proxmox.

It was about verifying where the bytes actually go.

Seeing:

```text
Docker Root Dir: /var/lib/docker
```

does **not necessarily mean all Docker-related storage lives there**.

With Docker using containerd for its image store, there can be another significant storage root under:

```text
/var/lib/containerd
```

So if you're putting Docker on a separate disk specifically to protect `/`, don't stop after checking `Docker Root Dir`.

Check both:

```bash
sudo du -sh /var/lib/docker /var/lib/containerd
```

Then confirm where containerd stores its data.

The other lesson is that you don't necessarily need a sophisticated storage architecture to contain a small Docker workload.

For this use case:

```text
separate fixed-size filesystem
+ containerd on that filesystem
+ log rotation
+ disposable containers
+ occasional docker system df
```

is enough.

And as with most homelab projects, the final configuration wasn't particularly complicated.

It just required discovering the one directory nobody mentioned until after everything looked finished.
