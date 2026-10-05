---
title: "The Server Wasn't Down. My Laptop Was Just Somewhere Else."
date: 2026-09-05
author: jabez007
tags:
  - minecraft
  - mineflayer
  - networking
  - vpn
  - nodejs
  - troubleshooting
  - linux
excerpt: |
  My Minecraft bot kept timing out against a server I could play on just fine. I figured it couldn't be a
  firewall, because the bot and I were on the same home network. We weren't. Along the way I learned why a
  refused connection and a silent one mean very different things, and why a five-second timeout can lie.
featured: false
draft: true
---

# The Server Wasn't Down. My Laptop Was Just Somewhere Else.

_Or: Silence is not the same thing as "connection refused"_

When a Minecraft client keeps timing out, the obvious conclusion is that the server is down. Sometimes it is. But a server that's down and a server you can't reach look different on the wire, and this week I spent most of a day treating one as the other.

## Ninety-two good minutes

Reeve, my Mineflayer bot, runs on my laptop and plays on a server I don't run. I'd spent the week on behavior fixes, and I wanted a long session to measure them against.

The baseline run went well. Reeve was connected for 92 minutes, running his behavior loop. Then, mid-session, the connection died:

```text
12:17:36  connection_lost   client timed out after 30000 milliseconds
12:20:06  connection_lost   ETIMEDOUT
12:22:36  connection_lost   ETIMEDOUT
12:25:06  connection_lost   ETIMEDOUT   ... and so on
```

He sat in his reconnect loop for another half hour, timing out every couple of minutes. As far as anyone could tell, the server had gone down.

Except it hadn't. I could log in and play.

## Building a case against the server

The evidence that the server was the problem looked pretty good at first.

From the laptop, the server's address answered ping with no packet loss. So the machine was up and routable. But a TCP connection to the Minecraft port went nowhere, three probes out of three.

Then came the control tests. The same laptop could reach big public Minecraft servers like Hypixel and CubeCraft on their game ports without any trouble. A port-test service on the exact same port number answered too. So the laptop could make outbound connections, on Minecraft ports, to other servers. The only thing it couldn't reach was this one server.

That reads like an open-and-shut case. The path works, the port works, the server doesn't.

There were a couple of smaller clues too. SSH to the server's address was also failing, which made it look like the whole box was firewalled. That one turned out to be my own side. The coding agent I had running these checks lives in a sandbox that blocks outbound SSH entirely, so SSH to *anything*, GitHub included, failed from there. That data point said nothing about the server.

The other clue I should have paid more attention to. Ping times to the server had gone from 61 ms earlier in the day to 110 ms. Same address, almost twice the latency. Something about the path had changed.

## My theory

My game client connected fine. The bot didn't. And I had what I thought was a solid reason to rule out the usual suspect.

Reeve and my client were both in my house, behind my router. As far as the server could tell, we had the same IP address. If a firewall was blocking him, it would be blocking me too.

Which left me stuck. The server kept going down for the bot while I played on it just fine. It had even dropped him in the middle of a session, which was weirder still. And without any access to the server, I didn't see how to dig further.

> Narrator: _They did not have the same IP address._

## Where is my laptop, actually?

The useful question turned out to be a simple one. What address does the internet see when this laptop connects?

The answer changed on every request. A dozen requests got a dozen different addresses, spread across two different datacenter address ranges from two different providers, one registered in Canada and one in the UAE. Not one of them was my home connection.

It wasn't just `curl`, either. Node, the actual bot runtime, came out on the same rotating addresses. So did UDP.

And nothing on the laptop itself was doing it. There was no tunnel or WireGuard interface, no policy routing, no proxy in the environment. Even binding `curl` directly to the Wi-Fi card came out on a proxy address. The packets left the laptop addressed normally and got rewritten somewhere upstream.

So my client was coming from my house, and Reeve was coming from a different country every time he reconnected.

## Reading the errors properly

This is the part I want to remember, because the errors had been telling the truth the whole time. Opening a TCP connection has roughly three outcomes:

| What you get back | What it means |
| :--- | :--- |
| A completed handshake | Something is listening, and you can reach it |
| A reset, so `ECONNREFUSED` | You reached the machine, and nothing is listening on that port |
| Nothing, so `ETIMEDOUT` | Your packets are being dropped somewhere along the way |

A stopped Minecraft server on a running machine answers straight away with a reset. That's the machine saying nobody's home. Silence is different. Silence means something between you and the server is throwing your packets away, and it tells you nothing about whether the server is running.

Once I went back through all of Reeve's journals with that in mind, the pattern was hard to miss:

```text
41 × ETIMEDOUT      29 × write EPIPE      2 × write ECONNRESET
 0 × kick with a reason
```

A server that kicks you sends a reason. There wasn't one anywhere. A dead server refuses. There were no refusals. Every failure was silence or a broken connection.

The `EPIPE` errors fit the rotation too. If your public address changes partway through a session, the connection the server is holding no longer leads back to you. The next write hits a dead pipe. That 92-minute session wasn't the server crashing. It was most likely the exit address changing underneath a live connection.

There were also 15 failed Mojang logins scattered across the journals. Those have nothing to do with the server I play on. Most likely Mojang's session servers didn't like the proxy addresses either. Same cause, different victim.

## Why the control tests lied

So why could the laptop reach Hypixel but not my server?

Because the control test answered a narrower question than I asked it. It proved the rotating proxy could reach *big public servers*, which see players from every kind of network all day. It didn't prove anything about the path to this particular server. Either the server's host drops traffic from datacenter ranges, or the VPN's exits can't get there. I can't tell which from my side, and it didn't matter. Both have the same fix.

Ports 80 and 443 caused one more brief false alarm. They looked open on the server's address, which suggested the server was accepting connections after all. But nothing ever came back over them. No HTTP response, no TLS certificate. The proxy was completing the handshake on those ports itself, which is what web proxies do. A completed handshake proves *something* answered. It doesn't prove the server did.

## Teaching the bot to say it

Before I'd fixed anything, I had two small pieces added to Reeve. I'd spent a day convinced the server kept dying because every failure showed up as the same generic connection error. The distinction above was sitting right there in the error codes. The bot just never said it out loud.

**A connection diagnosis.** `connectionDiagnosis.ts` turns the raw error into a plain sentence in the log:

- `ECONNREFUSED` means the machine answered and refused, so the server process itself is almost certainly down.
- `ETIMEDOUT` means the server is unreachable *from this network*. The message says the server may be perfectly healthy, and to try a different network before concluding otherwise.
- `EPIPE` or `ECONNRESET` means the connection broke mid-session, which is what a VPN or proxy with a rotating exit looks like.

The patterns came from the real error strings in Reeve's journals, and the journal keeps the raw error right next to the diagnosis. The diagnosis is an interpretation. The original stays in the record.

**A preflight knock.** Some errors are ambiguous. "Client timed out after 30000 milliseconds" looks the same whether the server stopped answering or the path started dropping packets. So `serverProbe.ts` opens a bare TCP connection, no Minecraft handshake, with a five-second timeout. A Mineflayer login over a dead path takes around two minutes to give up. The knock answers in five seconds.

It runs alongside the launch, never in front of it. A diagnostic that can delay the bot starting would be worse than the confusion it's fixing.

Against real endpoints, it did what it should. Hypixel accepted in 201 ms. A local port with nothing behind it refused. My server got:

```text
[Preflight] ... never answered the handshake. The packets are being dropped in the path, which says nothing about whether the server is running.
```

You can do the same knock from a shell:

```bash
nc -vz -w 5 your.server.example 25565
```

"Connection refused" is an answer. Hanging until the timeout is not.

## The actual fix

The laptop was on a VPN, and the VPN was the thing handing out a new country on every connection. I took the laptop off it.

After that it had one stable residential address. The Minecraft port completed its handshake. And a port with nothing listening came back refused, with a proper reset, which is exactly what a healthy path looks like.

Reeve connected and spawned, and the behavior loop started up.

## Then the preflight lied

On that very first good launch, the shiny new preflight reported:

```text
[Preflight] ... never answered the handshake.
```

Reeve connected 4.7 seconds later.

Run on its own, the probe reached the server five times out of five, in 124 to 453 ms. It only failed when it ran inside the bot's launch. And the launch log had the clue:

```text
[Behavior] World ready (ready, 5907ms after attach)
```

Startup is busy. Authentication, chunk parsing, and the rest of the bot spinning up kept Node's event loop tied up for close to six seconds. The probe's five-second timer expired somewhere in the middle of that.

Here's the catch. When Node's event loop gets a chance to run again, it handles expired timers *before* it polls for network events. So the connection had actually completed at the OS level, but the timeout callback ran first, declared the path dead, and the real connect event got thrown away as a late arrival. The probe wasn't measuring "did the network answer". It was measuring "did the event loop get around to noticing".

The fix uses that same phase order. When the timer fires, it doesn't give a verdict right away. It defers it one turn, which gives a connect that already finished the chance to land first. In sketch form:

```ts
const timer = setTimeout(() => {
  // A connect that completed while the loop was busy is handled in the
  // poll phase, which runs before this immediate does.
  setImmediate(() => settle("network_filtered"));
}, timeoutMs);
```

Only a completed connection can win that race. A late error still loses to the timeout, the same as before.

## Final thoughts

- **"Same house" doesn't mean "same IP".** Check the public address of the machine that's failing, not the one that works. Check it twice, in case it moves.
- **Refused and timed out are different answers.** A reset means you reached the machine. Silence means you didn't, so it can't tell you anything about the server.
- **A control test only proves what it tests.** Reaching Hypixel proves you can reach Hypixel.
- **Know which evidence is about your own side.** The failing SSH check was a fact about my sandbox, not the server.
- **Put the diagnosis in the log.** If the bot had said "unreachable from this network" on day one, I'd have skipped most of that day.
- **A timeout in Node measures the event loop too.** If the loop is busy, a five-second deadline can expire on something that answered in 200 ms.

The server was up the whole time. Reeve was just connecting from two other countries, taking turns.
