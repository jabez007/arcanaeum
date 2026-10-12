---
title: "OpenCode and the Case of `no such column: name`"
date: 2026-07-05
author: jabez007
tags:
  - opencode
  - mcp
  - sqlite
  - obsidian
  - linux
  - troubleshooting
  - ai-agents
excerpt: |
  I was adding OpenCode support to my Obsidian MCP server when OpenCode itself stopped starting.
  Every command died with "no such column: name". The fix was one `mv`. Finding it meant splitting
  "my config is broken" from "my tool's state is broken", plus one red herring that looked very convincing.
featured: false
draft: true
---

# OpenCode and the Case of `no such column: name`

_Or: When the bug isn't in your project, it's in your home directory_

I spent the Fourth of July weekend on plumbing. Specifically, my Obsidian MCP server.

Some background. I keep my notes in an Obsidian vault, and I run a small MCP server that lets my coding agents search it, read notes, and append to daily journals. It started life as a Gemini CLI extension called `gemini-obsidian`. This weekend it became `obsidian-vault-mcp`. It now supports Claude Code, Codex, OpenCode, and Gemini CLI from one tool registry instead of three copy-pasted ones.

Claude Code and Codex went fine. Then I tried OpenCode, and OpenCode couldn't start at all.

## The symptom

Every OpenCode command I tried failed the same way:

```text
$ opencode debug config
Error: Unexpected error

no such column: name
```

`opencode mcp list` gave the same error, and so did `opencode debug info`. Even `--pure`, which is supposed to skip external plugins, died the same way.

The obvious suspect was the `opencode.json` I'd just added to the repo. It was the newest thing in the picture, and the error showed up right after I added it. Trimmed down, it looks like this:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "obsidian-vault-mcp": {
      "type": "local",
      "command": ["node", "dist/index.js"],
      "enabled": true
    }
  }
}
```

The `command` array looked suspicious at first, because other hosts split the executable and its arguments. But OpenCode's published schema says an array is exactly right for a local MCP server. Type-check, lint, and tests on the server all passed. Nothing in the repo was obviously wrong.

And "no such column" isn't a config error anyway. It's a SQL error. A JSON file can be wrong in a lot of ways, but it can't be missing a column.

## The first layer was my own sandbox

I was running these checks through Codex, which works inside a sandbox. That added a failure of its own before OpenCode got anywhere near a database. Inside the sandbox, OpenCode couldn't even open its global log file at `~/.local/share/opencode/log/opencode.log`, because that's outside the project directory, and it died on that instead.

So the very first error had nothing to do with OpenCode or my project. It was the sandbox doing its job. Running the same commands outside it got past the log file and straight to `no such column: name`, which at least meant everyone was looking at the same bug.

When an agent runs your commands in a sandbox, the first error you see may be about the sandbox. Make sure you're debugging the same failure you get in your own terminal.

## Where's the SQL?

OpenCode keeps its state in a SQLite database:

```text
~/.local/share/opencode/opencode.db
```

It runs a query against that database during startup, before it loads any project config. That's why `debug info` failed too. My project never got a chance to be wrong.

I opened the database read-only to see what was in it:

```bash
sqlite3 'file:/home/jabez/.local/share/opencode/opencode.db?mode=ro&immutable=1' \
  'pragma integrity_check;'
```

`ok`. So it wasn't corrupt. It just held three old sessions from months earlier, back when I'd first tried OpenCode, and its schema was old.

Finding the exact bad query was harder than it sounds. The obvious candidate, a `name` column on the `project` table, was there. The installed `opencode` is a compiled binary, so there wasn't any SQL text to grep for. What the old database did have was a small custom migration tracker stuck at version 2, sitting next to a set of Drizzle migration rows, and a `control_account` table missing several identity and display columns. Something new was reading something old.

The next thought was a version mismatch, an old binary reading a newer database or the reverse. But the installed version was 1.17.13, which was the npm `latest` at the time. So it wasn't simply outdated.

## Isolate the state, not the project

The trick that cracked this was running OpenCode with a throwaway home directory. OpenCode follows the XDG variables, so you can point all of its state at `/tmp`:

```bash
env HOME=/tmp/opencode-isolated \
    XDG_CONFIG_HOME=/tmp/opencode-isolated/.config \
    XDG_DATA_HOME=/tmp/opencode-isolated/.local/share \
    XDG_STATE_HOME=/tmp/opencode-isolated/.local/state \
    XDG_CACHE_HOME=/tmp/opencode-isolated/.cache \
    opencode debug config
```

Each of those variables moves one kind of state. `XDG_CONFIG_HOME` is where global config lives, `XDG_DATA_HOME` is where `opencode.db` lives, and the state and cache directories hold logs and downloads. Setting `HOME` too catches anything that ignores XDG and goes straight for `~`. My real profile never gets touched, and when I'm done I delete the directory.

With a fresh state directory, `debug config` loaded my repo's `opencode.json` fine. Same binary, same project, different database. That rules out the project.

One small gotcha in the isolated run. Running `debug config` and `mcp list` at the same time against the brand new database hit a SQLite lock, since both tried to set it up at once. Running them one at a time fixed it. Not a real bug, but an easy way to chase the wrong thing.

Comparing the two databases made it obvious. The fresh one, created by the same OpenCode version, had tables my old one lacked entirely: `workspace`, `event`, `session_message`, `session_input`, `data_migration`. Several tables that existed in both were missing newer columns. The old migration table even had rows with blank IDs.

That pointed to an old database the current version hadn't fully migrated. I never traced the exact failing query, but the two schemas gave me a reason to try fresh state in my real profile.

## The red herring

Before fixing the database, I hit something that looked like a second, scarier bug.

In the isolated environment, `opencode mcp list` got further but reported:

```text
●  ✗ obsidian-vault-mcp failed
│      MCP error -32000: Connection closed
│      node dist/index.js
```

The server answered `initialize` and `tools/list` normally when I sent JSON-RPC directly over stdio. So I put a small logging proxy between OpenCode and the server to see who hung up first. The full proxy is in the appendix; the useful part of the transcript was:

```text
CLIENT_END
CHILD_EXIT code=0 signal=null
```

OpenCode started the server and closed its stdin without sending a single message. The server saw EOF and exited cleanly. That looked like a second bug.

After I replaced the stale database, the server connected normally in my real profile. I still don't know why the scratch run closed stdin. The throwaway environment helped rule out my project, but its extra failure sent me down another rabbit hole.

I'm keeping the proxy, though. Next time an MCP host says "Connection closed", it'll tell me who hung up first.

## The fix

Move the stale database aside and let OpenCode create a new one:

```bash
mv ~/.local/share/opencode/opencode.db \
   ~/.local/share/opencode/opencode.db.bak-$(date +%Y%m%d-%H%M%S)
opencode debug config
```

That was it. `debug config` and `debug info` worked again, and `mcp list` showed `obsidian-vault-mcp` connected.

The cost is that OpenCode no longer shows those three old sessions. They're still in the backup if I ever want them.

## Final thoughts

The project was fine the whole time. The JSON file got suspected first because it was the thing I'd just changed, and the error happened to show up right after I changed it. That's a reasonable place to start and a bad place to stay.

A few things I'm taking away:

- **Check the state database when startup throws a SQL error.** Mine was missing columns the current version expected. A fresh profile helped separate that from a project config problem.
- **Isolate state with XDG variables.** Pointing `HOME` and the `XDG_*` variables at `/tmp` is the fastest way to answer "is it my project or my machine?"
- **Back up instead of deleting.** `mv` to a timestamped name costs nothing and keeps the old sessions if you ever want them.
- **A logging stdio proxy is worth keeping around.** It turns "Connection closed" into a transcript.
- **Know which errors come from the sandbox.** The first failure was about where the agent was allowed to write, not about OpenCode.

With the database fixed, my notes are reachable from all four agents. Which means all four can now confidently cite the wrong note at me.

## Appendix: the logging proxy

Save this as `/tmp/opencode-mcp-proxy.cjs` and replace `/path/to/obsidian-vault-mcp/dist/index.js` with your server's entry point:

```js
#!/usr/bin/env node
// /tmp/opencode-mcp-proxy.cjs
const fs = require("node:fs");
const { spawn } = require("node:child_process");

const log = (line) => fs.appendFileSync("/tmp/opencode-mcp-proxy.log", line + "\n");
const child = spawn("node", ["/path/to/obsidian-vault-mcp/dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
});

process.stdin.on("data", (c) => { log(`CLIENT ${JSON.stringify(c.toString())}`); child.stdin.write(c); });
process.stdin.on("end", () => { log("CLIENT_END"); child.stdin.end(); });
child.stdout.on("data", (c) => { log(`SERVER ${JSON.stringify(c.toString())}`); process.stdout.write(c); });
child.stderr.on("data", (c) => { log(`SERVER_ERR ${JSON.stringify(c.toString())}`); process.stderr.write(c); });
child.on("exit", (code) => { log(`CHILD_EXIT code=${code}`); process.exit(code ?? 1); });
```

Temporarily set the server's `command` in `opencode.json` to `["node", "/tmp/opencode-mcp-proxy.cjs"]`, run `opencode mcp list`, and read `/tmp/opencode-mcp-proxy.log`. Restore the original command afterward.
