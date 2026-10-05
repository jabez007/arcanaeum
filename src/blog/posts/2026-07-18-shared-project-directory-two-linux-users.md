---
title: "One Project, Two Linux Users: setgid, Default ACLs, and `/srv`"
date: 2026-07-18
author: jabez007
tags:
  - linux
  - permissions
  - acl
  - git
  - homelab
  - ubuntu
  - troubleshooting
excerpt: |
  I needed two accounts on my laptop, jabez and molty, to share full read/write access to the same project checkout.
  The answer was a shared group, a setgid directory, and default ACLs under /srv. Along the way I learned what the
  `s` and `+` in `drwxrws---+` mean, and why `sudo -u` still cares about the directory you're standing in.
featured: false
draft: true
---

# One Project, Two Linux Users: setgid, Default ACLs, and `/srv`

_Or: What the `s` and the `+` in `drwxrws---+` actually mean_

My laptop has two user accounts now: `jabez`, which is me, and `molty`. I wanted both of them to have full read, write, and execute access to my Minecraft bot project, `chunk-tether`. I wanted a single working tree, not two clones. Both accounts should be able to run the same checkout.

The project lived at `/home/jabez/source/repos/chunk-tether`. The simple question was whether to leave it there and loosen permissions, or move it somewhere both users could reach.

## Why you can't just `chmod` your way out of your home directory

The project directory itself was already `775`. Group-writable, world-readable. That doesn't matter when the parents block you:

```bash
namei -l /home/jabez/source/repos/chunk-tether
```

`/home/jabez` is `750`. `molty` isn't in my group, so it can't even traverse into my home directory, and the permissions on anything below it are irrelevant.

I could have opened up my home directory. I didn't want to. Moving the project out to a neutral, shared location was cleaner.

## The plan: a group, a directory, and inheritance

The first suggestion was a group named `chunk-tether`. I plan to share other projects the same way later, so I went with something generic:

```bash
sudo groupadd -f project-devs
sudo usermod -aG project-devs jabez
sudo usermod -aG project-devs molty

sudo mkdir -p /srv/projects
sudo chown root:project-devs /srv/projects
sudo chmod 2770 /srv/projects
sudo setfacl -m d:u::rwx,d:g::rwx,d:m::rwx,d:o::--- /srv/projects
```

There are two separate inheritance mechanisms in there.

**The setgid bit**, the `2` in `2770`. On a directory, it means new files and subdirectories inherit the directory's *group* instead of the creating user's primary group. Without it, a file `molty` creates would belong to group `molty`, and `jabez` might not be able to touch it.

**The default ACL**, the `d:` entries. Setgid fixes the group, but not the permissions. If one user has a restrictive `umask`, their new files might come out `644`, which isn't group-writable. A default ACL on a directory sets the permissions new entries start with, so the group keeps `rwx` no matter whose `umask` created the file.

You need both. Setgid gives the group ownership of new files, and the default ACL makes sure that group can write to them.

## Reading `drwxrws---+`

After my first attempt, `ls` showed this, and I had no idea what two of the characters meant:

```text
d rwx rw s --- +
│ │   │    │   └─ an extended ACL exists (see getfacl)
│ │   │    └───── others: no access
│ │   └────────── group: rwx, and the setgid bit is set
│ └────────────── owner: rwx
└──────────────── directory
```

A lowercase `s` in the group execute slot means setgid plus execute. A capital `S` would mean setgid *without* execute, which on a directory is almost never what you want.

The `+` means "there's more than the classic permission bits here". `getfacl` shows the rest:

```text
$ getfacl -p /srv/projects
# file: /srv/projects
# owner: root
# group: project-devs
# flags: -s-
user::rwx
group::rwx
other::---
default:user::rwx
default:group::rwx
default:mask::rwx
default:other::---
```

## My detour through `/srv` itself

I'll admit I applied all of this to `/srv` on purpose the first time, not `/srv/projects`. I figured `/srv` was just an empty directory nobody used.

It isn't nobody's. `/srv` is part of the [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/ch03s17.html), meant for site-specific data the machine serves: web roots, Git repos, FTP. Ubuntu leaves it empty, but a future service could reasonably expect to traverse it, and with `other::---` nothing outside `project-devs` could.

So I put `/srv` back to normal and scoped everything to `/srv/projects`:

```bash
sudo setfacl -k /srv          # remove the default ACL
sudo setfacl -b /srv          # remove all extended ACL entries
sudo chown root:root /srv
sudo chmod 0755 /srv
```

That left one thing behind. `ls` showed `/srv` as `drwxr-sr-x`. The setgid bit survived the `chmod 0755`. On a directory, GNU `chmod` keeps setgid when you give it a normal octal mode. You have to clear it explicitly, either with a symbolic mode or with an extra leading zero:

```bash
sudo chmod g-s /srv      # or: sudo chmod 00755 /srv
```

The other lesson from the detour: **default ACLs aren't retroactive.** `/srv/projects` had been created before I set the default ACL on `/srv`, so it never got one. Anything that already exists keeps its permissions. Set the ACL on the directory you mean to share.

Final layout:

```text
drwxr-xr-x   root root          /srv
drwxrws---+  root project-devs  /srv/projects
```

## Test it like you don't trust it

Before moving any real code in, I ran an end-to-end check with both users:

```bash
sudo -u jabez mkdir /srv/projects/permission-test
sudo -u jabez touch /srv/projects/permission-test/from-jabez
sudo -u molty touch /srv/projects/permission-test/from-molty
sudo -u molty sh -c 'echo molty-wrote-here >> /srv/projects/permission-test/from-jabez'

stat -c '%A %U:%G %n' /srv/projects/permission-test{,/*}
sudo rm -rf /srv/projects/permission-test
```

Everything should belong to group `project-devs`. The directory should show `s`, both files should be group-writable, and `molty` should be able to append to the file `jabez` created.

## Moving the project (no sudo required)

I had Codex helping with this, and its first attempt at the move put `sudo` in front of everything. I asked why. If my shell has `project-devs` membership and I own every file in the checkout, the permissions we'd just set up allow the move without root.

That's the point of setting this up properly. You shouldn't need `sudo` for day-to-day work in a shared directory.

There's one catch: **new group membership only applies to new login sessions.** `usermod -aG` updates `/etc/group`, but any shell that was already running keeps its old group list. Check with `id`. If `project-devs` isn't listed, log out and back in, or start a subshell with `newgrp project-devs`. A long-lived `tmux` server has the same problem: its panes inherit whatever groups the server had when it started.

Once `id` showed the group:

```bash
mv /home/jabez/source/repos/chunk-tether /srv/projects/
chgrp -R project-devs /srv/projects/chunk-tether
chmod -R g+rwX /srv/projects/chunk-tether
find /srv/projects/chunk-tether -type d -exec chmod g+s {} +
find /srv/projects/chunk-tether -type d \
  -exec setfacl -m d:u::rwx,d:g::rwx,d:m::rwx,d:o::--- {} +

git -C /srv/projects/chunk-tether config core.sharedRepository group
```

The capital `X` in `g+rwX` is worth knowing. It adds execute only to directories, plus files that are already executable for someone, so you don't mark every source file executable.

`core.sharedRepository group` tells Git to keep its own object files group-writable. Otherwise one user's `git commit` can create objects the other user can't update.

## Git's `safe.directory`, and the `sudo -u` trap

Git refuses to operate in a repository owned by a different user unless you've marked it safe. Since the files belong to `jabez`, `molty` has to opt in:

```bash
sudo -u molty -H git config --global --add safe.directory /srv/projects/chunk-tether
```

`-H` sets `$HOME` to molty's home, so the setting lands in molty's `~/.gitconfig` and not mine. I ran it and got:

```text
fatal: failed to stat '/home/jabez/source/repos': Permission denied
```

`sudo -u` changes the user and, with `-H`, the home directory. It does **not** change the working directory. I was standing in `/home/jabez/source/repos`, which `molty` can't traverse, and Git's first move is to stat the current directory.

Run it from somewhere both users can reach:

```bash
(
  cd /
  sudo -u molty -H git config --global --add safe.directory /srv/projects/chunk-tether
  sudo -u molty -H git -C /srv/projects/chunk-tether status
)
```

The parentheses run it in a subshell, so your own shell stays where it was.

## The caveat I accepted on purpose

Sharing one working tree means sharing everything in it: the Git index, uncommitted changes, `node_modules`, build output, lock files. If both users edit at the same time, they'll trip over each other.

For most setups, two separate clones are safer. In my case the shared runtime checkout is the whole point, so I took the trade knowingly. If you copy this setup, decide that deliberately.

## Final thoughts

The commands themselves are short. Understanding them took longer:

- **Traversal beats permissions.** A `775` directory under a `750` parent is still unreachable.
- **Setgid gives new files the group. A default ACL gives them group-write.** You need both.
- **Default ACLs aren't retroactive.** Apply them to the directory you actually want to share.
- **New groups need a new session.** `id` tells you what your current shell can do.
- **`sudo -u` keeps your working directory.** If the target user can't stand where you're standing, `cd /` first.

Now both accounts can work in the same project. I'm sure that won't cause any problems at all.
