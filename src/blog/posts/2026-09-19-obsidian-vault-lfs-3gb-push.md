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
  rewriting history and deleting the repo.
featured: false
draft: true
---

# My Notes Vault Pushed 3 GB to Git LFS

_Or: A vector index that kept 349 copies of itself_

My Obsidian vault lives in a Git repo. Next to it runs `obsidian-vault-mcp`, the MCP server [I was wiring into OpenCode back in July](/#/blog/opencode-no-such-column-name). Among other things, it keeps a LanceDB vector index of the vault so my agents can search notes by meaning instead of by exact words.

I wanted that index in the repo along with the notes. I told Codex:

> we do need to also commit the MCP index files. Those should be covered under git lfs

The index went into LFS, and I pushed with lazygit. My reaction, cleaned up for the blog, was roughly "that push was almost 3 GB, what happened?"

## 349 versions of one table

The notes themselves are small. The index shouldn't have been big either. Codex went looking and found:

- 349 versions of the table
- 94,678 files
- about 1.8 GB on disk

One commit alone had added about 1.38 GB of new LFS content.

The cause was in my own MCP server. After every note write or move, it ran `table.optimize()` on the LanceDB table. In LanceDB, optimizing writes a new version of the table. The old versions stay on disk until something cleans them up. So every note an agent wrote or moved left another version of the index behind, and Git LFS faithfully tracked every one of them.

> Narrator: _The index was very well optimized. There were 349 copies of the optimization._

An issue went up on the MCP server's repo, and the work moved to the vault.

## Shrinking the index was the easy part

Codex worked on an isolated copy of the index first. LanceDB can clean up its own history. `cleanupOlderThan` drops old versions, and `deleteUnverified` removes files no version refers to anymore. On the copy:

| | Before | After |
| :--- | ---: | ---: |
| Files | 94,678 | 1,564 |
| Size | 1.86 GB | 27.0 MB |

That's 98.5% smaller. Before trusting it, Codex checked all 6,075 rows by content digest and ran searches against the cleaned copy. Then it committed the result as a new commit. No amend, no force push.

## The GitHub dashboard made it more confusing

Then I looked at the LFS usage on GitHub's billing page. It showed 2.5 GB for last month and 0.8 GB for this month, which matched nothing I knew about the repo.

That number is storage *accrued over the month*, not what's stored right now. It's closer to "how much, for how long" than to "how much". My summary at the time:

> oh, that is an extremely confusing way to calculate that metric

The bigger problem was that **shrinking the index doesn't reclaim anything on GitHub.** Every old LFS object is still referenced by the commits that added it. Even rewriting the history doesn't free the storage, because GitHub keeps LFS objects for a repo until the repo itself is deleted. And pushing the old history anywhere would upload all of those objects again.

So I could live with it, or rewrite history and recreate the repo.

## Fix the cause first

I wanted the history gone, but not before the bug that made it was fixed:

> I probaby need to address the MCP issue before we attempt to remove anything from LFS though

Otherwise the cleaned-up repo would start filling right back up.

The fix landed upstream in the vault template I build my vaults from, plus MCP server 2.1.0:

- The live LanceDB directory is ignored by Git now. The MCP can do whatever it likes in there.
- A pre-commit hook exports a validated, compact snapshot of the index, and only that snapshot gets committed. It's capped at 100 MiB.
- Hooks on merge, checkout and rewrite install the snapshot back into place, so a fresh clone still gets a working index without a full rebuild.

Codex reviewed the hooks and found three bugs:

1. With `core.autocrlf` on, line-ending conversion changed the snapshot's hash, so validation failed on a perfectly good file.
2. An unstaged change could skip the snapshot registration.
3. `git commit -a` got rejected.

Those became upstream issues and fixes. One more line-ending bypass, involving `.gitattributes`, got fixed afterward too.

## Then rewrite history

With the hooks in place, it was time to deal with the history. Before:

- 11,358 LFS objects
- about 4.18 GB

Codex rewrote the history to remove the index paths from all 260 commits that had touched them, and kept the history of the notes. After:

- 496 LFS objects
- about 23.6 MB

Before touching anything, it made a backup bundle of the old repo and verified it.

One more wrinkle. My vault is also bind-mounted into an Obsidian Docker container. Swapping the directory out from under a running container is a bad idea, so the container had to stop first:

```bash
sudo docker compose stop obsidian
```

## Then delete the repo

This is the part GitHub doesn't let you skip. I deleted the GitHub repo myself. Codex recreated it as private, pushed the cleaned history, put the repo settings back, restored the one closed issue, and verified a fresh clone. The new repo holds 617 LFS objects and 44 MB, compact snapshot included.

While it was in cleanup mode, it also cleared out about 11.5 GB of temporary files from the work. That included 2.83 GB of Obsidian core dumps.

## Final thoughts

- **Look at what you're putting in LFS.** "It's a binary, put it in LFS" is how I committed 349 versions of a database without noticing.
- **Commit an export, not a live database.** Databases keep history, temp files, and versions for their own reasons. A snapshot is what you actually want in Git.
- **History rewrites don't free LFS storage on GitHub.** Deleting and recreating the repo does. Plan for that before you start.
- **Fix the leak before you mop the floor.** Otherwise you get to do the cleanup twice.
- **Make a backup bundle first.** Then verify it. Then rewrite.

The repo's LFS storage is back to 44 MB. The index now commits one copy of itself, which turns out to be the correct number of copies.
