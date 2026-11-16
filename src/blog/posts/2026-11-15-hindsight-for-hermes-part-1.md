---
title: "Hindsight for Hermes, Part 1: My Agent Wrote Its Own Memory Installer"
date: 2026-11-15
author: jabez007
tags:
  - hindsight
  - hermes-agent
  - postgresql
  - bash-scripting
  - linux
  - homelab
  - ai-agents
  - troubleshooting
excerpt: |
  My Hermes Agent session databases are past a gigabyte, in an LXC with a small disk. So Hermes and I picked a
  memory server to run on another machine, and Hermes wrote the installer. Codex fitted it to the real laptop,
  and then one of Codex's own fixes broke the next step.
featured: false
draft: true
---

# Hindsight for Hermes, Part 1: My Agent Wrote Its Own Memory Installer

_Or: `restart` doesn't always mean start_

Hermes Agent lives in an LXC on my Proxmox host. That container used to run OpenClaw. After [enough fights with it](#/blog/taming-openclaw-proxmox-lxc), I shut OpenClaw down and gave the container to Hermes instead.

I have at least seven Hermes profiles now, and four or five of them are in regular use. Their session databases are over a gigabyte, and the LXC has a small disk that I've been trying to keep under control. I wanted to move some of that memory to another machine.

My local coding agents already use mempalace for memory, and I'm happy with it there. So I asked Hermes what it thought about Hindsight versus mempalace for itself. We landed on Hindsight for a simple reason. Hermes supports it out of the box, and I didn't want to spend time tinkering to make mempalace work with Hermes. Hindsight could run on a different machine, so its storage wouldn't come out of the LXC's disk.

So Hermes helped pick its own memory server. Then it wrote the installer.

This is part 1, which gets Hindsight installed and running. Part 2 will be Hermes connecting to it and remembering something.

## Three machines and one `molty`

There are three machines in this story:

- **The Proxmox host.** It runs the Hermes LXC.
- **My dev laptop.** It runs an Ubuntu flavor, and it's where `molty` already has an account for [shared project work](#/blog/shared-project-directory-two-linux-users).
- **The Hindsight laptop.** It's a second laptop running MX Linux, which is Debian 12 with SysV init. Hindsight and PostgreSQL live here.

I gave `molty` an account on the Hindsight laptop too, set up the same way as on the dev laptop: a regular user, deliberately outside sudoers. Hermes logs in as `molty` with an SSH key.

## A generic installer, then a specific one

Hermes logged into the Hindsight laptop and wrote an installer and a setup guide for me to run with sudo. For a generic Debian box, it was mostly right.

This isn't a generic box, though. So I had Codex, running on the Hindsight laptop itself, review the scripts and rework them for the machine they'd actually run on. The header comment of the final installer sums up what I wanted left out:

```bash
# No Docker, systemd, transcript imports, Codex credential reuse, or model calls.
```

There's no systemd because this laptop uses SysV init, and Supervisor keeps Hindsight running. No transcripts get imported, because I only want agents saving notes on purpose. Hindsight gets its own ChatGPT sign-in for `gpt-6-luna` and never touches Codex's credentials. Setup never calls the model. Embeddings and reranking run locally with ONNX.

The final installer is pinned to this laptop. It compares `/etc/machine-id` with the value it was written for and refuses to run anywhere else. It checks the downloads against pinned SHA-256 checksums. Hindsight runs as its own `hindsight` account and listens only on `127.0.0.1:8888`. PostgreSQL has no TCP listener at all, and Hindsight reaches it over the Unix socket.

Neither agent could run the privileged parts. Hermes logs in as a non-sudoer, and Codex's attempts stopped at `sudo: a password is required`, which is how I wanted it. Codex wrote and tested the fixes, and I ran the installer, the migration, the login and the startup in my own terminal.

Most of what went wrong came from the gap between a generic Linux box and this one.

## The working directory followed me into the service account

The installer has a small helper, `as_hindsight`, that runs commands as the `hindsight` user with `runuser`. The first run died with a permission error from uv. It was trying to read a `uv.toml` in `/home/jabez`.

I'd launched the installer from my home directory, which is private. `runuser` switched the user, but it didn't change the working directory, so uv went looking for its config in a directory the `hindsight` account can't read. Passing absolute paths to the requirements files didn't help, because config discovery happens first. On a box where you run installers from `/tmp` or a readable home, this never shows up.

That's the same trap from my [shared directory post](#/blog/shared-project-directory-two-linux-users), where `sudo -u molty` choked on `/home/jabez/source/repos`. Four months later, it was a different tool and a different account, with the same lesson.

The fix moves into the service home first. The function body is a subshell, `( ... )` instead of `{ ... }`, so the `cd` never changes the installer's own working directory:

```bash
as_hindsight() (
    # runuser preserves cwd; private administrator homes break uv config discovery.
    # A subshell keeps the installer's own cwd unchanged, including relative paths.
    cd -- "$HOME_DIR" || return
    exec runuser -u hindsight -- env -i HOME="$HOME_DIR" USER=hindsight LOGNAME=hindsight \
        PATH=/usr/bin:/bin LANG=C.UTF-8 TMPDIR="$HOME_DIR/tmp" \
        HF_HOME=/var/cache/hindsight/huggingface UV_CACHE_DIR=/var/cache/hindsight/uv \
        HF_HUB_DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 TOKENIZERS_PARALLELISM=false \
        OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=4 "$@"
)
```

If the service home is missing, `cd` fails and the function returns before `runuser` ever runs. `env -i` starts the command with an empty environment, so the service account only gets the variables listed there and nothing from my shell. Codex reproduced the original failure with the pinned uv binary before fixing it.

## Getting the database off the NVMe

The Hindsight laptop has a 256 GB NVMe and a 2 TB hard disk mounted at `/home`. The first install put PostgreSQL in its default spot, `/var/lib/postgresql/15/main`, on the NVMe.

Codex's first recommendation was to keep the live database on the NVMe for speed and put only the backups on the hard disk. That's a reasonable default, but it isn't how I use these disks. The NVMe is for application code, which gets written rarely and read often. The hard disk is for data that gets written often, even if it's slower. A memory server's database gets written every time an agent saves something, so it belongs on the hard disk with its backups:

| What | Disk |
| :--- | :--- |
| Hindsight app, Python runtime, config, caches, logs | NVMe |
| Live PostgreSQL data, backups, and exports under `/home/hindsight-data` | 2 TB HDD |

The trade-off is that backups on the same disk as the database don't survive that disk dying. An off-machine copy is still on the to-do list.

The installer grew a `migrate-storage` command for the move. Before touching anything, it compares the UUID of the filesystem mounted at `/home` with the 2 TB disk's UUID. If that disk ever failed to mount, `/home` would be an empty directory on the NVMe, and anything written under `/home/hindsight-data` would land on the wrong disk without complaint. The script that launches the Hindsight API runs the same check and refuses to start.

The migration refuses unfamiliar paths, and clusters with external WAL or tablespaces, since those need their own plan. It stops Hindsight and PostgreSQL and copies the cluster into a scratch directory, so an interrupted copy can resume on the next run. Then it checks the copy by running the same rsync again as a dry run and requiring empty output:

```bash
copy_checked() {
    # Copy without deleting either the source or files already at the destination.
    rsync -aHAX --numeric-ids --checksum -- "$1/" "$2/"
    local changes
    changes=$(rsync -aHAX --numeric-ids --checksum --dry-run --itemize-changes -- "$1/" "$2/")
    [[ -z $changes ]] || fail 'Copy verification failed; source retained and database configuration unchanged.'
    sync -f "$2"
}
```

With `--checksum`, rsync compares file contents instead of sizes and timestamps. If the second pass would change anything, the copy isn't identical, and the script stops with PostgreSQL's configuration untouched. Only after the check passes does it rename the scratch copy into place, point `data_directory` at the new path, and check that the running database reports that path.

Codex tested it against disposable PostgreSQL 15 clusters with 100 synthetic rows, covering repeat runs, interrupted copies, a missing disk, and conflicting targets. The real migration was one command:

```bash
sudo bash /home/jabez/hindsight-setup.sh migrate-storage
```

It didn't work the first time, or the second.

## A lock nobody was holding

The first attempt failed right away:

```text
ERROR: Another Hindsight management operation is active.
```

Nothing else was running. No other management command was in the process list, and the lock record in the kernel pointed at a process that had already exited.

As best I can tell, this one came from Hermes' original version. It took its lock the common way, by opening the lock file on descriptor 9 in the script's own shell and calling `flock` on it. The general shape:

```bash
exec 9>"$LOCK_FILE"
flock -n 9 || die "Another Hindsight management operation is active."
```

A `flock` lock belongs to the open file, not to the process that took it. Every child process the script started inherited descriptor 9, including the daemons it launched. When the script exited, those daemons kept running with a copy of the descriptor, and the lock stayed held. That's also why the kernel's record named a process that no longer existed. It records who took the lock, not who still has the file open.

The fix hands the lock to a separate `flock` process with `--close`. `flock` can run a command but not a shell function, so it starts a fresh Bash that sources the script and calls `run_locked`:

```bash
flock --nonblock --conflict-exit-code 75 --close "$lock_file" \
    /bin/bash -c 'source "$1"; run_locked "$2"' hindsight-management \
    "$(readlink -f "${BASH_SOURCE[0]}")" "$command"
```

The `flock` process holds the lock until the command finishes. `--close` closes the lock file's descriptor before the command starts, so the command and any daemons it launches never get a copy. Sourcing the script doesn't rerun it, because the script only calls `main` behind an `if [[ ${BASH_SOURCE[0]} == "$0" ]]` check at the bottom. And `--conflict-exit-code 75` gives "someone else has the lock" its own exit code, so the script can tell that apart from a command that failed.

One thing the fix doesn't do is delete the lock file. That's the tempting shortcut, and it's wrong. If one process has the old file locked and another creates a new file at the same path, they're now locking different files, and both think they're alone.

For the one-time recovery, Codex had me restart the installation's own services so they'd drop their inherited copies of the lock, and then retry with the fixed script.

## `restart` only stopped it

The retry failed with a different error:

```text
ERROR: Supervisor must be running before migration.
```

This one was Codex's. Its recovery steps included `service supervisor restart`, on the reasonable assumption that a restart means stop, then start. It's the generic answer, and this laptop isn't generic. When Codex went back and read this laptop's `/etc/init.d/supervisor`, the `restart` branch only stops the daemon. The Supervisor log showed it shutting down, and its control socket was gone. Nothing ever started it back up.

> Narrator: _The reviewer needed a reviewer._

The recovery instructions now end with an explicit `service supervisor start`. The installer and the migration also share an `ensure_supervisor` helper that doesn't trust the init script at all:

```bash
supervisor_ready() {
    local pid
    pid=$(supervisorctl pid 2>/dev/null) || return 1
    [[ $pid =~ ^[1-9][0-9]*$ ]]
}
ensure_supervisor() {
    supervisor_ready && return
    [[ -f $SUPERVISOR_CONF ]] || fail 'Hindsight Supervisor configuration is missing; refusing to start the daemon.'
    local file attempt
    for file in "$(dirname "$SUPERVISOR_CONF")"/*.conf; do
        [[ $file == "$SUPERVISOR_CONF" ]] || fail 'Supervisor is stopped and has unrelated programs; start it deliberately before retrying.'
    done
    # This host's SysV "restart" action only stops the daemon. Use start and
    # wait for its Unix control socket rather than relying on the init exit code.
    service supervisor start
    for ((attempt = 1; attempt <= 10; attempt++)); do
        supervisor_ready && return
        sleep 1
    done
    fail 'Supervisor did not become ready. Inspect /var/log/supervisor/supervisord.log.'
}
```

It asks `supervisorctl pid` over the control socket and only accepts a positive number. If Hindsight's config is the only one in `conf.d`, the helper starts Supervisor and waits up to ten seconds for it. If Supervisor manages other programs too, the helper refuses, because starting Supervisor would start those programs as well.

The third attempt worked. PostgreSQL's running command and its configuration both point at `/home/hindsight-data/postgresql/15/main` on the hard disk. The original NVMe copy is still at `/var/lib/postgresql/15/main` as a fallback. It stopped getting writes at the cutover, so going back to it would mean reconciling everything written since.

## Two keys, and banks aren't walls

Hindsight's API only listens on loopback, so Hermes will reach it through an SSH tunnel as `molty`. Both machines are on my home network, so the tunnel goes straight over the LAN. My [Tailscale setup](#/blog/tailscale-openclaw-proxmox-lxc) is only for reaching specific machines when I'm away from home, and this doesn't need it.

The setup ends up with two separate credentials:

- **The SSH key** gets Hermes onto the Hindsight laptop as `molty`.
- **The Hindsight bearer key** gets it into the API and the MCP endpoint. Without it, a request to list banks comes back `401`.

The installer generates the bearer key with Python's `secrets.token_hex(32)` and writes it to `/etc/hindsight/hindsight.env`, which only root and the `hindsight` group can read. The key needs to get from there to `molty` without passing through my terminal history. Codex wrote a small handoff script that writes only that key to `/home/molty/.hindsight-api-key`, owned by `molty` with mode `0600`. It never puts the key in a command argument or prints it, and it refuses to overwrite a different key or follow a symlink at the destination. It passed tests with synthetic keys. I haven't run it for real yet.

Hindsight organizes memories into banks, and separate bank names can keep agents' memories apart. That's organization, not security. This install uses Hindsight's built-in `ApiKeyTenantExtension` with a single key, and that key can reach every bank.

## Deciding what gets remembered

Hermes' native Hindsight provider retains conversation turns automatically by default. I don't want every conversation going into long-term memory. I want agents to save notes on purpose.

So the prepared configuration skips the native provider and connects through MCP instead. It points at a `shared` bank and exposes only three tools, `retain`, `recall`, and `reflect`. Hermes keeps its existing memory provider. If I ever switch to the native provider, the guide says to set `auto_retain: false`.

On the server side, `HINDSIGHT_API_STORE_DOCUMENT_TEXT=false` stops Hindsight from keeping the source text of what gets retained, and LLM tracing is off. Those settings don't make it safe to dump transcripts or credentials into it, though. Anything retained still goes to Hindsight and to the model.

## Where part 1 ends

The current state:

- PostgreSQL runs from the hard disk.
- Hindsight runs as its own account on loopback under Supervisor, logged into its own ChatGPT session.
- An unauthenticated request gets a `401`.
- `molty` can SSH in with its key.

Still to do:

- Hand the API key to `molty` and fetch it into the Hermes profile's `.env`.
- Start the tunnel from the Hermes LXC and add the MCP server to Hermes' config.
- Retain a made-up, harmless note, recall it, reflect on it, and look at what Hindsight actually stored.
- Take a real backup and restore it into a throwaway database.
- Get backups off this machine, maybe with [the rclone pipeline](#/blog/headless-gdrive-sync-lxc) I already use for my home directory.

The guide also includes an optional systemd user service to keep the tunnel up. It runs on the Hermes side, in the same LXC where `systemctl --user` [gave me trouble with OpenClaw](#/blog/taming-openclaw-proxmox-lxc). We'll see how that goes.

## Final thoughts

- **A generic script is a good first draft.** Hermes' installer was mostly right for a generic Debian box. Most of the failures came from this particular laptop, and that's what the review on the real machine was for.
- **Put data where its write pattern belongs.** The NVMe holds code that's written rarely and read often. The hard disk holds the database that's written all the time.
- **Switching users doesn't switch directories.** `runuser` and `sudo -u` both keep your working directory. If the new account can't read it, `cd` somewhere it can first.
- **An inherited descriptor can hold a lock after its owner exits.** `flock --close` keeps daemons from taking the lock with them. Deleting the lock file isn't a fix.
- **Read the init script before trusting `restart`.** On this laptop, Supervisor's `restart` only stops it. That goes for the reviewer too.
- **Banks aren't permissions.** With one shared key, every agent can reach every bank.

Whether any of this actually takes weight off those gigabyte session databases is a question for part 2. So far, all Hindsight has remembered is a `401`.
