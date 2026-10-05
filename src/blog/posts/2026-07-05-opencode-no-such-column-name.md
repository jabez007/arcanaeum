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

I pointed Codex at it, and we started with the obvious suspect: the `opencode.json` I'd just added to the repo. Trimmed down, it looks like this:

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

And "no such column" isn't a config error anyway. It's a SQL error.

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

With a fresh state directory, `debug config` loaded my repo's `opencode.json` fine. Same binary, same project, different database. That rules out the project.

Comparing the two databases made it obvious. The fresh one, created by the same OpenCode version (1.17.13, which was the npm `latest` at the time), had tables my old one lacked entirely: `workspace`, `event`, `session_message`, `session_input`, `data_migration`. Several tables that existed in both were missing newer columns. The old migration table even had rows with blank IDs.

So the current OpenCode version opened my old database, didn't migrate it all the way, and then queried a column that wasn't there.

## The red herring

Before fixing the database, I hit something that looked like a second, scarier bug.

In the isolated environment, `opencode mcp list` got further but reported:

```text
●  ✗ obsidian-vault-mcp failed
│      MCP error -32000: Connection closed
│      node dist/index.js
```

But talking to the server directly worked. Pipe JSON-RPC into it over stdio and it answers `initialize` and `tools/list` normally:

```bash
{ printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
  sleep 2
  printf '%s\n' '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
  sleep 2
} | node dist/index.js
```

To see what OpenCode was actually sending, I put a tiny logging proxy between it and the server. OpenCode launches the proxy, and the proxy launches the real server and writes down every byte going each way:

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

Point an `opencode.json` at `["node", "/tmp/opencode-mcp-proxy.cjs"]`, run `mcp list`, and read the log:

```text
start cwd=/tmp/opencode-proxy-project
CLIENT_END
CHILD_EXIT code=0 signal=null
```

OpenCode started the server and closed its stdin without sending a single message. The server saw EOF and exited cleanly, and OpenCode reported "Connection closed". I got the same result with a TTY attached.

That looked like a real OpenCode bug, and I was ready to go file it.

Then I fixed the actual problem, and in my real profile `opencode mcp list` showed the server as connected. Whatever made it close stdin in the scratch environment didn't happen in a normal one. I still don't know exactly why, and I've decided that's fine. Throwaway environments are great for ruling things out, but they aren't your real environment, and sometimes they show you a problem that only exists in the throwaway.

I'm keeping the proxy, though. Next time an MCP host says "Connection closed", it'll tell me who hung up first.

## The fix

Move the stale database aside and let OpenCode create a new one:

```bash
mv ~/.local/share/opencode/opencode.db \
   ~/.local/share/opencode/opencode.db.bak-$(date +%Y%m%d-%H%M%S)
opencode debug config
```

That was it. `debug config` and `debug info` worked again, and `mcp list` showed `obsidian-vault-mcp` connected.

The cost is that OpenCode no longer shows those three old sessions. They're still in the backup if I ever care, and I won't.

## Final thoughts

The project was fine the whole time. I spent the first stretch of this staring at a twelve-line JSON file because it was the thing I'd just changed, and the error happened to show up right after I changed it.

A few things I'm taking away:

- **"no such column" means a schema mismatch.** If a tool you just upgraded throws a SQL error before it does anything else, look at its state database before you look at your code.
- **Isolate state with XDG variables.** Pointing `HOME` and the `XDG_*` variables at `/tmp` is the fastest way to answer "is it my project or my machine?"
- **Back up instead of deleting.** `mv` to a timestamped name costs nothing and keeps the old sessions if you ever want them.
- **A logging stdio proxy is worth keeping around.** It turns "Connection closed" into a transcript.

With the database fixed, my notes are reachable from all four agents. Which means all four can now confidently cite the wrong note at me.
