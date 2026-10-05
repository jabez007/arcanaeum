---
title: "My Install Script Never Failed, and That Was the Bug"
date: 2026-09-30
author: jabez007
tags:
  - bash-scripting
  - linux
  - docker
  - ci
  - security
  - troubleshooting
excerpt: |
  I came back to the install script I use to set up new dev machines and Docker images, and asked Claude for
  a thorough review. The script had a `die` on every component, and it still couldn't fail. It also couldn't
  run from `curl | bash`, the one-liner at the top of the README. Here's what three days of fixing it taught me
  about Bash.
featured: false
draft: true
---

# My Install Script Never Failed, and That Was the Bug

_Or: `f || die` turns off `set -e` for everything inside `f`_

I have a repo called `docker-kitchen`. Part of it is an install script that sets up a new development machine the way I like it: Fish, tmux, Starship, Go, Node, Python, Neovim, LazyGit, Docker. The same script builds my AstroNvim Docker image. A while back I started splitting it into components.

Then I didn't touch it for a while. This week I came back and asked Claude:

> it's been a while since I've worked on this project. This branch specifically is trying to componentize the install script used to setup my new development machines and the various Docker images. Can you help me complete a thorough review and clean things up?

The first finding was that the branch was already merged. The rest took three days.

## `|| die` disables the thing you wanted

The script runs with Bash strict mode, `set -Eeuo pipefail`, so any failing command should stop it. Each component was called like this:

```bash
${COMPONENTS[$component]} || die "Failed to install $component"
```

That looks extra safe. It's the opposite. When a function is called on the left side of `||` or `&&`, or in an `if` condition, Bash turns off `set -e` for everything inside that function. A failed `curl`, `tar`, or `apt` inside a component just kept going. Only the function's last command decided whether it "failed".

Claude confirmed it with a one-liner:

```bash
set -e
die() { echo "died"; exit 1; }
f() { false; echo kept going; }
f || die
```

That prints `kept going`. The `false` doesn't stop anything.

> Narrator: _The script had error handling on every component. None of it could fire._

The fix was to call components plainly and let an `ERR` trap report where things broke. With `set -E`, the trap is inherited by functions, so a failure now says exactly where it came from:

```text
Command failed (exit 1) at .install/lib/environment.sh:59 while installing: base
```

Making failures fatal could have turned up a pile of hidden errors. The first CI run passed all 70 jobs across eight distros. Apparently it had just been lucky.

## The README one-liner didn't work

The top of my README says to run the script with `curl ... | bash`. That failed immediately:

```text
BASH_SOURCE[0]: unbound variable
```

When a script is piped into Bash, there's no source file, so `BASH_SOURCE[0]` is unset, and `set -u` makes that fatal. Fixing the error wasn't enough, either. The usual "am I being run, or sourced?" guard is `[[ "${BASH_SOURCE[0]}" == "$0" ]]`, and that's false when piped. So even with the error fixed, `main` never ran.

Now the script notices when it's piped, downloads its modules into a temp directory, and cleans it up afterward.

## Other things that never worked

The review found a long list. A few favorites:

- **The install could drop you into tmux.** My `config.fish` auto-attaches to tmux, and that block wasn't checking whether the shell was interactive. Later in the install, the script runs `fish -c` to set up plugins, which loads `config.fish`. On a real terminal, that starts tmux in the middle of the install.
- **`sudo` can't run shell functions.** `run_as_user command_exists node` was meant to check for Node as my user. `command_exists` is a Bash function, and `sudo` only runs programs, so the check always failed and Node got reinstalled on every run.
- **Git clones ran as root.** Under `sudo`, the AstroNvim config and tmux plugin clones left root-owned directories in my home.
- **Docker broke on Fedora 41 and later.** `dnf config-manager --add-repo` is dnf4 syntax. dnf5 wants `addrepo --from-repofile=`.
- **Re-runs hung on a prompt.** `gpg --dearmor -o` asks "Overwrite?" when the key file exists, and there's no terminal to answer it. It needs `--yes`.

Also, GitHub had disabled two of the repo's workflows for inactivity, including the one that tests the install script. So nothing had been running those tests.

## What does `--upgrade` actually upgrade?

Since I was in there, I asked whether the script handles upgrading the tools it installs. About half of them did, and those re-downloaded the latest release every time, even when it was already installed. Everything installed under my home directory ignored `--upgrade` completely. It also rewrote my Starship config from the preset on every run, so hand edits got lost.

Now `--upgrade` compares the installed version to the latest release and only reinstalls when they differ. Tools with their own updater use it. And `starship.toml` is only written if it doesn't exist.

The new CI job starts with an old Go 1.22.0 installed, runs the script normally and checks that Go was left alone, then runs it with `--upgrade` and checks that Go was replaced. It went from 1.22.0 to 1.27.1.

That job had a bug of its own first. Claude caught it before pushing. `set -e` also ignores a pipeline negated with `!`. So the "old Go is gone" check, written as a negated pipeline, could never fail. It became an explicit `if`.

## The setup.conf that runs as root

CodeRabbit reviewed the PR and flagged something worth thinking about. A piped run read `setup.conf` from the current directory, and it reads it with `source`, so the file is run as shell code. Now that piped runs worked, `curl ... | sudo bash` would run whatever `setup.conf` happened to be in your current directory, as root.

Claude's take was that the risk is small, since someone who can write files into your working directory already has other options. But it was new, since piped runs hadn't worked before this. So a piped run now only reads a config you name explicitly with `--config`. Claude tested it with a `setup.conf` that prints `PWNED`. Piped without `--config`, it printed nothing.

## Rate limits and checksums

One CI job failed with a 403 from `api.github.com` while looking up a release download. GitHub allows 60 unauthenticated API requests an hour per IP, and CI runners share IPs. The fix skips the API entirely. The latest tag comes from the `releases/latest` redirect, and the asset list comes from the same page the GitHub release page loads in the browser.

Then came the one open issue labeled security. Nothing checked the downloads. Now the script checks every release download against a SHA-256 before installing it. Some notes from that:

- **Go's `.sha256` URL returns a web page**, not a hash. The checksum has to come from `go.dev/dl/?mode=json`.
- **Starship and Deno no longer pipe an install script into a shell.** Both now download the release archive, check its published checksum, and unpack it.
- **Neovim and Bottom don't publish checksum files.** GitHub shows a SHA-256 digest for every release asset, so the script uses that. It only proves the download wasn't corrupted or altered on the way, not that the file uploaded to the release is trustworthy. The README says so.
- **pyenv's installer has no tags**, so it can't be pinned. The script clones pyenv at its latest release tag instead.

Making the downloads safer broke Arch. Deno installed fine but `command -v deno` couldn't find it in a login shell. When `~/.bash_profile` exists, a login Bash skips `~/.profile`, and Arch ships a `.bash_profile`. The old Deno installer had been writing to it, which is why this never showed up before.

## The line that ate my .bashrc

One more from the issue list. My `.bashrc` ends with a block that replaces Bash with Fish. Anything below that block never runs in an interactive Bash, because Bash is gone by then. The `shell` component ran before `go`, `node`, and `python`, so their PATH lines all landed below it.

The fix keeps the Fish launcher last. It now has begin and end markers, and a final step after every run moves it to the bottom of `.bashrc`. While rewriting it, Claude found two more problems:

- It used `ps` to see whether Fish had started this Bash, and the Debian and Ubuntu base images don't include `ps`. Now it reads `/proc/$PPID/comm` first.
- `bash -i -c "some command"` started Fish and never ran the command. Now it checks `$BASH_EXECUTION_STRING` and stays out of the way.

Claude also found a bug in its own fix during testing. Moving a marked block left the end marker behind. The test had shown the stray line the first time, and it missed it. Both the local test and CI count the markers now.

## Final thoughts

- **`|| die` turns off `set -e` inside the function.** So does calling it in an `if`. If you want a function to stop on errors, call it plainly and use an `ERR` trap to report where.
- **`!` turns off `set -e` too.** A negated check in a test script can never fail.
- **Test the README.** The command at the top of mine didn't work.
- **`sudo` runs programs, not functions.** Wrap a function in `bash -c` if it needs to cross `sudo`.
- **A checksum from the same place as the file only proves it arrived intact.** That's still worth having. Just don't claim more than that.
- **Disabled CI is no CI.** GitHub turns off scheduled workflows on quiet repos, and it's easy to miss.

Before all this, my install script had never once failed. Now it can fail, and when it does, it tells me the file and line.
