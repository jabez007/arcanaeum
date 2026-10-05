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
  The install script I use to set up new dev machines and Docker images had a `die` on every component,
  and it still couldn't fail. It also couldn't run from `curl | bash`, the one-liner at the top of the README.
  Here's what three days of cleaning it up taught me about Bash.
featured: false
draft: true
---

# My Install Script Never Failed, and That Was the Bug

_Or: `f || die` turns off `set -e` for everything inside `f`_

A script that never fails sounds like a good script. Mine had strict mode turned on, a `die` after every step, and a CI pipeline that passed. It had never once reported an error. It turns out that's because it couldn't.

## The script

I have a repo called `docker-kitchen`. Part of it is an install script that sets up a new development machine the way I like it: Fish, tmux, Starship, Go, Node, Python, Neovim, LazyGit, Docker. The same script builds my AstroNvim Docker image. A while back I started splitting it into components, so `install.sh base shell go` installs just those pieces.

Then I didn't touch it for a while. This week I came back to finish the componentized version and give it a proper review. The first thing I learned was that the branch I thought I was still working on had already been merged. The rest took three days.

## `|| die` disables the thing you wanted

The script runs with Bash strict mode, `set -Eeuo pipefail`. With `-e`, any command that fails should stop the script. On top of that, each component was called like this:

```bash
${COMPONENTS[$component]} || die "Failed to install $component"
```

That looks extra safe. It's the opposite.

Bash has a rule about where `set -e` applies. A command whose exit status is being *checked* doesn't trigger it, which makes sense. You don't want `if grep -q foo file` to kill your script when `grep` finds nothing. The surprise is that this applies to everything inside a function too. Call a function on the left of `||` or `&&`, or in an `if`, and `set -e` is off for the entire body of that function, all the way down.

So a failed `curl`, `tar` or `apt` inside a component just kept going. Only the function's last command decided whether it "failed".

Four lines show it:

```bash
set -e
die() { echo "died"; exit 1; }
f() { false; echo kept going; }
f || die
```

That prints `kept going`. The `false` doesn't stop anything, and `die` never runs, because `echo` succeeded.

> Narrator: _The script had error handling on every component. None of it could fire._

The fix was to stop helping. Components get called plainly now, and an `ERR` trap reports where things broke. With `set -E`, functions inherit the trap, so a failure now names the file and line:

```text
Command failed (exit 1) at .install/lib/environment.sh:59 while installing: base
```

Making failures fatal could have turned up a pile of hidden errors. The first CI run passed all 70 jobs across eight distros. Apparently it had just been lucky.

## The README one-liner didn't work

The top of my README says to run the script with `curl ... | bash`. That failed immediately:

```text
BASH_SOURCE[0]: unbound variable
```

When a script is piped into Bash, there's no source file, so `BASH_SOURCE[0]` is unset, and `set -u` makes that fatal. Fixing the error wasn't enough, either. The usual "am I being run, or sourced?" guard is `[[ "${BASH_SOURCE[0]}" == "$0" ]]`, and that's false when piped. So even with the error fixed, `main` never ran. The script would download, parse, and exit cleanly having done nothing.

Now the script notices when it's piped, downloads its modules into a temp directory, and cleans up afterward.

## Other things that never worked

Once I started looking, the list got long. A few favorites:

- **The install could drop you into tmux.** My `config.fish` auto-attaches to tmux, and that block wasn't checking whether the shell was interactive. Later in the install, the script runs `fish -c` to set up plugins, which loads `config.fish`. On a real terminal, that started tmux in the middle of the install.
- **`sudo` can't run shell functions.** `run_as_user command_exists node` was meant to check for Node as my user. `command_exists` is a Bash function, and `sudo` only runs programs, so the check always failed and Node got reinstalled on every run.
- **Git clones ran as root.** Under `sudo`, the AstroNvim config and tmux plugin clones left root-owned directories in my home.
- **Docker broke on Fedora 41 and later.** `dnf config-manager --add-repo` is dnf4 syntax. dnf5 wants `addrepo --from-repofile=`.
- **Re-runs hung on a prompt.** `gpg --dearmor -o` asks "Overwrite?" when the key file already exists, and there's no terminal to answer it. It needs `--yes`.

And the reason none of this showed up in CI is that CI wasn't running. GitHub had disabled two of the repo's workflows for inactivity, including the one that tests the install script. GitHub does that to scheduled workflows on quiet repos, and it doesn't make much noise about it.

## What does `--upgrade` actually upgrade?

The script has an `--upgrade` flag, and I wasn't sure what it actually did, so I checked. About half the tools respected it, and those re-downloaded the latest release every time, even when it was already installed. Everything installed under my home directory ignored it completely. The script also rewrote my Starship config from the preset on every run, so any hand edits got thrown away.

Now `--upgrade` compares the installed version to the latest release and only reinstalls when they differ. Tools with their own updater use it. And `starship.toml` only gets written if it doesn't exist yet.

The new CI job for this starts with an old Go 1.22.0 already installed. It runs the script normally and checks that Go was left alone, then runs it with `--upgrade` and checks that Go was replaced. It went from 1.22.0 to 1.27.1.

That job had a bug of its own before it ever ran, and it's the same lesson again. `set -e` also ignores a pipeline negated with `!`. The "old Go is gone" check was written as a negated pipeline, so it could never fail. It's an explicit `if` now.

## The setup.conf that runs as root

CodeRabbit reviewed the PR and flagged something I hadn't thought about. The script reads `setup.conf` from the current directory, and it reads it with `source`, so the file runs as shell code. Now that piped runs actually worked, `curl ... | sudo bash` would run whatever `setup.conf` happened to be in your current directory, as root.

The risk is small. Someone who can write files into your working directory already has other options. But it was new. Before this week, piped runs didn't work at all, so there was no way to hit it. So a piped run now only reads a config you name explicitly with `--config`. The test was a `setup.conf` that prints `PWNED`. Piped without `--config`, nothing printed.

## Rate limits and checksums

One CI job failed with a 403 from `api.github.com` while looking up a release download. GitHub allows 60 unauthenticated API requests an hour per IP, and CI runners share IPs. The fix skips the API entirely. The latest tag comes from the `releases/latest` redirect, and the asset list comes from the same page the GitHub release page loads in a browser.

Then I picked up the one open issue labeled security. Nothing checked the downloads. Now the script checks every release download against a SHA-256 before installing it. That was less uniform than I expected:

- **Go's `.sha256` URL returns a web page**, not a hash. The checksum has to come from `go.dev/dl/?mode=json`.
- **Starship and Deno no longer pipe an install script into a shell.** Both download the release archive, check its published checksum, and unpack it.
- **Neovim and Bottom don't publish checksum files.** GitHub shows a SHA-256 digest for every release asset, so the script uses that. It only proves the download wasn't corrupted or swapped on the way. It says nothing about whether the file uploaded to the release is trustworthy, and the README says so.
- **pyenv's installer has no tags**, so it can't be pinned. The script clones pyenv at its latest release tag instead.

Making the downloads safer broke Arch. Deno installed fine, but `command -v deno` couldn't find it in a login shell. When `~/.bash_profile` exists, a login Bash skips `~/.profile`, and Arch ships a `.bash_profile`. The old Deno installer had been writing its PATH line to it, which is why this never came up before.

## The line that ate my .bashrc

One more from the issue list. My `.bashrc` ends with a block that replaces Bash with Fish. Anything below that block never runs in an interactive Bash, because Bash is gone by then. The `shell` component ran before `go`, `node` and `python`, so their PATH lines all landed below it.

The fix keeps the Fish launcher last. It has begin and end markers now, and a final step after every run moves it to the bottom of `.bashrc`. Rewriting it turned up two more problems:

- It used `ps` to see whether Fish had started this Bash, and the Debian and Ubuntu base images don't include `ps`. Now it reads `/proc/$PPID/comm` first.
- `bash -i -c "some command"` started Fish and never ran the command. Now it checks `$BASH_EXECUTION_STRING` and stays out of the way.

The fix had its own bug the first time around. Moving a marked block left the end marker behind. The test output showed the stray line, and nobody noticed. Both the local test and CI count the markers now.

## Where does a new tool go?

The last thing I added was Atuin, for shell history search. It went through three designs before it was committed. First it was an `--atuin` flag. Then it was its own component, on the grounds that every other flag changes *how* something installs, not *what*. Then I asked why it wasn't just part of `shell`, since Starship is.

That settled it. `shell` already bundles Fish, tmux auto-attach and Starship, and none of those can be skipped either. If Starship doesn't need an opt-out, Atuin doesn't. It lives in `shell` now, right next to Starship.

## Final thoughts

- **`|| die` turns off `set -e` inside the function.** So does calling it in an `if`. If you want a function to stop on errors, call it plainly and use an `ERR` trap to report where.
- **`!` turns off `set -e` too.** A negated check in a test script can never fail.
- **Test the README.** The command at the top of mine didn't work.
- **`sudo` runs programs, not functions.** Wrap a function in `bash -c` if it needs to cross `sudo`.
- **A checksum from the same place as the file only proves it arrived intact.** That's still worth having. Just don't claim more than that.
- **Disabled CI is no CI.** Check that your workflows are actually turned on.

Before all this, my install script had never once failed. Now it can fail, and when it does, it tells me the file and line.
