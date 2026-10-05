---
title: "The Server Wasn't Down. My Laptop Was Just Somewhere Else."
date: 2026-09-05
author: jabez007
tags:
  - minecraft
  - mineflayer
  - networking
  - vpn
  - troubleshooting
  - linux
excerpt: |
  My Minecraft bot kept timing out against a server that was up the whole time. I figured it couldn't
  be a firewall, because the bot and I were on the same home network. We weren't. A refused connection
  and a silent one mean very different things, and now the bot knows the difference too.
featured: false
draft: true
---

# The Server Wasn't Down. My Laptop Was Just Somewhere Else.

_Or: Silence is not the same thing as "connection refused"_

Reeve, my Mineflayer companion bot, runs on my laptop and connects to a Minecraft server I play on. This week he mostly didn't. The journal was a wall of connection failures:

- 41 `ETIMEDOUT`
- 29 `write EPIPE`
- 15 failed Mojang authentications
- 0 kicks with an actual reason attached

The server wasn't kicking him. Nothing on the other end was saying anything at all.

## "Are you sure the server is down?"

Claude's first read was that the server was down. I had heard that one before. Earlier in the week it had decided the server was down, and the real problem was its own sandbox blocking network access. So I pushed back:

> are you sure the server is down? earlier you thought it was down but it was actually the sandbox blocking you

I also had a theory of my own:

> We're both coming from my home network so our IP addresses would be the same which I think rules out a firewall

My game client could connect. The bot couldn't. Same house, same router, same public IP. So it couldn't be anything that filters by address. Right?

> Narrator: _They were not, in fact, coming from the same IP._

## The laptop was not where I thought it was

Claude checked the laptop's public address. Then it checked again, and got a different one. It changed from one connection to the next, rotating across two datacenter address ranges owned by two different providers in two different countries. Not one of them was my home connection.

So the bot wasn't on my home network at all, as far as the internet was concerned. My client was. That killed my firewall theory pretty thoroughly.

## A refused connection is an answer

The part I want to remember is how Claude read the symptoms. When you open a TCP connection, there are roughly three outcomes:

| What you get back | What it means |
| :--- | :--- |
| A completed handshake | Something is listening and you can reach it |
| A reset (`RST`), so `ECONNREFUSED` | You reached the machine, and nothing is listening on that port |
| Nothing at all, so `ETIMEDOUT` | Your packets are being dropped somewhere along the way |

A stopped Minecraft server on a running machine answers with a reset straight away. That's the server saying "nobody home". Silence is different. Silence means something between you and the server is throwing your packets away, and it tells you nothing about whether the server is running.

From the laptop, ping to the server worked. A TCP connection to the Minecraft port got silence. No reset, no handshake. That's a drop in the path, not a dead server.

The `EPIPE` errors fit too. If your exit address changes partway through a session, the connection the server knows about no longer leads back to you. Writes to it fail, and the client sees a broken pipe.

## The red herrings

There were a couple of convincing wrong turns along the way.

**Ports 80 and 443 looked open.** For a moment that suggested the path was fine and only the Minecraft port was blocked. But nothing ever came back over them. No HTTP response, no TLS certificate. Something in the path was accepting the handshake on those ports for itself. A completed handshake only proves *something* answered, not that the server did.

**The router.** Claude didn't find a tunnel or WireGuard interface on the laptop, so it guessed the VPN policy might be set on the router instead. That was a reasonable guess from what it could see. It wasn't where I ended up.

I don't have any access to the server side, so there were no server logs to check either. Everything had to be worked out from the laptop.

## Teaching the bot to tell the difference

Before we found the cause, Claude added two small pieces to the bot, so the next person reading the journal doesn't have to repeat the "is the server down?" argument. The errors had been saying "not down" all along. Now the bot says it in words.

**A connection diagnosis.** `connectionDiagnosis.ts` turns the raw error code into a plain sentence in the log:

- `ECONNREFUSED`: the machine answered and refused, so the server process is down.
- `ETIMEDOUT`: the server is unreachable *from this network*. The message actually says to try a different network before concluding anything else.
- `EPIPE` or `ECONNRESET`: the connection broke mid-session, which is what a rotating VPN or proxy looks like.

**A preflight knock.** `serverProbe.ts` opens a bare TCP connection to the server before Mineflayer even starts, with a five-second timeout. A Mineflayer login that hits a dead path can take around two minutes to time out. The knock gives a verdict in five seconds. When it gets silence, it prints:

```text
[Preflight] ... never answered the handshake. The packets are being dropped in the path, which says nothing about whether the server is running.
```

I wish that sentence had been in the log on day one.

If you want the same check from a shell, `nc` will do it:

```bash
nc -vz -w 5 your.server.example 25565
```

"Connection refused" is an answer. A hang until the timeout is not.

Claude also suggested a test I'll steal for next time. Tether the laptop to a phone hotspot. If it works on the hotspot and fails at home, the problem is your network, not the server.

## The actual fix

The laptop was on a VPN. Once I took it off, I told Claude:

> The laptop should be off the VPN now

After that, the laptop's public address was one stable residential address. The Minecraft port completed a handshake. And for comparison, a port nobody listens on came back refused with a proper reset, which is what a healthy path looks like.

## Final thoughts

- **"Same house" doesn't mean "same IP".** Check the public address of the machine that's failing, not the one that works. And check it twice, in case it changes.
- **Refused and timed out are different answers.** A reset means you reached the machine. Silence means you didn't, and you can't conclude anything about the server from it.
- **A completed handshake doesn't prove much either.** Something in the middle can answer for the server.
- **Put the diagnosis in the log.** A bot that says "this looks like your network" in plain words ends the "is the server down?" argument before it starts.

The server was up the whole time. Reeve was just connecting from two other countries, taking turns.
