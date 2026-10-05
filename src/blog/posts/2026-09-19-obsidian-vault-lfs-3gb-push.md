---
title: "My Notes Vault Pushed 3 GB to Git LFS"
date: 2026-09-19
author: jabez007
tags:
  - obsidian
  - git
  - git-lfs
  - mcp
  - homelab
  - troubleshooting
excerpt: |
  I committed my Obsidian vault's search index to Git LFS, and the next push was almost 3 GB. The index
  kept every old version of itself. Shrinking it was easy. Getting GitHub to forget the old versions meant
  fixing the leak, rewriting history, and deleting the repo.
featured: false
draft: true
---

# My Notes Vault Pushed 3 GB to Git LFS

_Or: A vector index that kept 349 copies of itself_

Git LFS makes large files feel free. You put the big binary in LFS, Git stores a tiny pointer, and the repo stays fast. What LFS doesn't do is make the big file any smaller. It still gets uploaded, and GitHub still stores it, every version of it, for as long as the repo exists.

I learned that this month from a push that was almost 3 GB, out of a repo that's mostly Markdown.

## A vault with a search index

My Obsidian vault lives in a Git repo on GitHub. Next to it runs `obsidian-vault-mcp`, the MCP server [I was wiring into OpenCode back in July](/#/blog/opencode-no-such-column-name). Among other things, it keeps a LanceDB vector index of the vault, so my agents can search my notes by meaning instead of by exact words.

Building that index means running every note through an embedding model, which takes a while. So I wanted the index in the repo alongside the notes. A fresh clone on another machine would have a working search right away instead of rebuilding from scratch. LanceDB stores its data as a pile of binary files, so those went into LFS.

I committed the index, pushed with lazygit, and watched the progress counter climb toward 3 GB.

## 349 versions of one table

The notes themselves are small. The index had been about 23 MB of LFS content the last time it was committed. Now it looked like this:

| | Before | After |
| :--- | ---: | ---: |
| Stored table versions | 5 | 349 |
| Index directories | 3 | 140 |
| Unique LFS content | 22.7 MB | 1.40 GB |

That one commit added about 1.38 GB of new LFS content, spread over 94,000 files.

The cause was in my own MCP server. After every note write or move, it called `table.optimize()` on the LanceDB table. Optimizing compacts the data by writing new files, and LanceDB keeps the previous versions around. Its default cleanup only removes versions older than seven days. I'd just done a big batch of note edits through the MCP, so every one of those edits left a fresh version of the table behind, and Git LFS faithfully tracked every one of them.

> Narrator: _The index was very well optimized. There were 349 copies of the optimization._

I still don't know where the rest of the 3 GB came from. The commit accounts for 1.38 GB. lazygit has a command log panel, but it doesn't save it to disk unless you start it with `--debug`, and I'd already closed it. That's an unsatisfying answer, but I'd rather leave it open than make one up.

## Shrinking the index was the easy part

LanceDB can clean up its own history. `cleanupOlderThan` drops old versions, and `deleteUnverified` removes files that no version refers to anymore. I didn't want to try that on the live index first, so the cleanup ran against a copy, with a byte-for-byte verified backup of the original set aside:

| | Before | After |
| :--- | ---: | ---: |
| Files | 94,678 | 1,564 |
| Size | 1.86 GB | 27.0 MB |

That's 98.5% smaller. Before trusting it, every indexed row and its embedding got compared against the original, all 6,075 of them, and full-text and vector searches had to return the same results. They did.

Swapping the cleaned copy in had one hiccup. The atomic rename failed because the copy was in `/tmp` and the repo was on a different filesystem, and you can't atomically rename across filesystems. The fix was just to copy the small cleaned version next to the repo first and swap from there.

Then came the question of how to commit it. One option was to amend the bloated commit and force push, as if it had never happened. It wouldn't have helped. The objects were already on GitHub, and rewriting the last commit wouldn't remove them. A plain new commit at least kept an honest record. So it went in as a new commit, about 20 MB of new LFS content, and a normal push.

## The dashboard made it more confusing

Then I looked at the Git LFS usage on GitHub's billing page. It said I'd used 2.5 GB of my 10 GB last month, and 0.8 GB this month. I hadn't deleted anything. How had usage gone down?

It hadn't. That number is storage *accrued over the month*, measured hourly. Think of it as gigabytes times the fraction of the month you've stored them. Keep 3 GB stored for the first 8 days of a 30-day month and you've accrued 3 × 8 ÷ 30 = 0.8. By the end of the month, the same unchanged files will have accrued the full 3. The counter resets every month, and the files stay put.

That's an extremely confusing way to label a number that says "GB used". It reads like a disk gauge, and it's really a running total.

The bigger problem was what *wasn't* going down. Every old LFS object was still referenced by the commits that added it. Shrinking the current index did nothing for those. GitHub's docs give two ways to reclaim LFS storage. You can ask Support to purge objects after you've removed them from history, or you can delete and recreate the repository.

And deleting the repo alone wouldn't fix it either. Pushing the same history to a fresh repo would upload every LFS object those commits point to, all over again. The history had to change first.

## Fix the leak before you mop the floor

My first instinct was to go straight to rewriting history. Then I thought about what would happen next. The MCP server would keep optimizing after every edit, the index would keep growing, and I'd be right back here in a month with a brand new repo.

It didn't even take a month. A few days after the cleanup, the live index had already grown from 27 MB back up to about 316 MB.

So I fixed the leak first, upstream, in the vault template I build my vaults from and in the MCP server itself. The new design, released as MCP 2.1.0, stops treating the live database as something Git should see at all:

- The MCP server no longer runs heavy maintenance after every single note edit.
- The live LanceDB directory is ignored by Git. The MCP can do whatever it likes in there.
- A pre-commit hook exports a validated, compact snapshot of the index, and only that snapshot gets committed. It's capped at 100 MiB, so another runaway index blocks the commit instead of the push.
- Hooks on merge, checkout and rewrite install the snapshot back into place, so a fresh clone still gets a working index without re-embedding every note.

In a test vault of 125 notes, three single-note edits each added about 10 to 12 KB of new snapshot content. That's the number I wanted to see. A one-line edit shouldn't upload the whole index again.

A review of the hooks turned up three bugs before I adopted them:

1. With `core.autocrlf` on, Git's line-ending conversion changed the snapshot's hash, so validation rejected a perfectly good file on checkout.
2. An unstaged change to the vault registration could let changed notes get committed without an updated snapshot.
3. `git commit -a` got rejected outright.

Those became issues on the template repo, and fixes. Re-reviewing the fixes found one more way around the line-ending check. A commit that only changed `.gitattributes`, say to force CRLF on every note, skipped validation entirely. That got fixed too, and the three fix commits were squashed and tagged as v2.1.0.

## Upgrading every agent, not just one

The MCP server isn't only for this repo. Claude Code, Codex, Gemini and OpenCode all use it to search my notes from whatever project they're in. So the upgrade had to reach all four, while the Git hooks only belonged in the vault's repo.

That turned out to be fiddlier than the hooks. Claude Code's plugin marketplace was still pointing at an old local checkout of the MCP, so "update" kept reinstalling 2.0.0. Gemini's updater wanted an interactive confirmation. And partway through, the Claude Code registration had been scoped to just the vault project, which defeats the point of an MCP whose whole job is to be reachable from everywhere. The check that settled it was running each of the four launchers from `/tmp`, outside any project, and making sure they all reported 2.1.0 and found the vault.

## Then rewrite history

With the leak fixed, it was time to deal with the past. The full audit of LFS content referenced anywhere in history came to:

- 11,358 LFS objects
- about 4.18 GB

The rewrite removed the three paths the index had lived in over time from all 260 commits that touched them, and kept everything else. Commits that ended up empty stayed in, so the history of the notes kept its shape. Then the current compact snapshot went back in at the tip.

The comparison afterward checked every retained file version, commit message, author, timestamp and parent against the original. Everything matched except the index. After:

- 496 LFS objects
- about 23.6 MB

Before any of that, every one of those 4.18 GB of historical LFS objects got downloaded and hash-verified into a backup, along with a bundle of the old repo. A test push to a local remote, then a clone from it, confirmed that a fresh clone could download the snapshot and install it without regenerating embeddings.

One more wrinkle. My vault is also bind-mounted into an Obsidian Docker container. The cleanup was going to swap the cleaned repo into the old one's directory, and a running container would have kept its mounts pointing at the old directory. So the container had to stop first:

```bash
sudo docker compose stop obsidian
```

## Then delete the repo

This is the part GitHub doesn't let you skip. The `gh` token on that machine didn't have the `delete_repo` scope, and I left it that way. I deleted the old GitHub repo myself.

After that, the repo was recreated as private, and the cleaned history went up. That was 617 LFS objects and 44 MB, compact snapshot and some new journal entries included. The repo settings went back on, along with the one closed issue and its comment. A fresh clone from GitHub passed Git and LFS checks and installed the snapshot without rebuilding anything.

The local cleanup was its own small adventure. Between temp clones, verification copies, and 2.83 GB of Obsidian crash dumps sitting in the vault directory, about 11.5 GB of disk came back.

## Final thoughts

- **Look at what you're putting in LFS.** "It's a binary, put it in LFS" is how I committed 349 versions of a database without noticing.
- **Commit an export, not a live database.** Databases keep history, temp files and versions for their own reasons. A snapshot is what you actually want in Git.
- **History rewrites don't free LFS storage on GitHub by themselves.** You need Support to purge, or a new repo. Plan for that before you start.
- **Fix the leak before you mop the floor.** Mine refilled to 316 MB in a few days.
- **Put a size limit in the commit hook.** A blocked commit is a lot cheaper than a 3 GB push.
- **"GB used" might not mean what you think.** GitHub's LFS storage number is accrued over the month.
- **Back up first, then verify the backup, then rewrite.**

The repo's LFS storage is back to 44 MB. The index now commits one copy of itself, which turns out to be the correct number of copies.
