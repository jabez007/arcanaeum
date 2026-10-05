---
title: "Letting Codex Playtest My Minecraft Bot"
date: 2026-08-29
author: jabez007
tags:
  - minecraft
  - mineflayer
  - llm
  - ai-agents
  - testing
  - troubleshooting
excerpt: |
  I had Codex run my Minecraft companion bot for twenty minutes at a time, give it chores, read the
  journal afterward, fix something, and run it again. It found real bot bugs. It also found that my test
  graders were lying to me about as often as the bot was.
featured: false
draft: true
---

# Letting Codex Playtest My Minecraft Bot

_Or: Who grades the grader?_

Reeve, my Mineflayer companion, has a lot of unit tests. Over two thousand of them. They're great at telling me that a function returns what I expect. They aren't good at telling me whether a bot left alone in my world for twenty minutes actually does anything useful.

The honest way to find out is to play with him. I don't have other players on the server right now to help with that. So this week I handed the job to Codex.

The idea was a loop. Launch the bot for ten to twenty minutes. Ask him for something a player might ask for, through the operator console. Wait for him to finish or fail. Shut him down, read the journal, and decide what went wrong. Fix it, run it again, and compare.

Most of the pieces already existed. An older harness in the project could launch the bot against the live server, run a scripted scenario, keep a structured journal, and shut everything down cleanly. It had just never been used as a loop, with somebody actually reading the results each time.

## The first bug was in the grader

The first run was a twenty-minute patrol soak with four survey passes, five minutes apart, and status checks at the start and end. Three surveys completed. One failed:

```text
Survey Task observation pose was unreachable.
```

That's the good kind of failure. The bot tried to walk somewhere, couldn't, and said so instead of reporting a success. The harness marked the run red because an expected completion never arrived. Everything did what it was supposed to.

Then the session reporter went over the journal. It flags suspicious outcomes, including "completed, but with zero effect", which is a classic way for a bot to fake progress. It flagged one. It was the status report.

The zero-effect check matched any `0/N` pattern in the output. The first status snapshot of the run included the spatial map counters, which at startup read `1/0/0`. The grader saw that as "zero out of something got done" and raised a false-success warning on a read-only status command.

The first regression test for it used the counters from the end of the run, `1/27/6`, and stayed green. It took the exact startup string to get a red test. The fix narrowed the check to real effect phrasing like `0/2 repaired`.

The comparison run, with no bot code changed, went 4/4 across twenty minutes and 147 journal records. So the unreachable pose looked like a one-off, and the only bug fixed in the first loop was in the tool that grades the bot.

> Narrator: _This would become a theme._

## Green that proved less than it looked

The patrol soak never touched the language model. I wanted a test where someone asks Reeve for something in plain English. With no real players around, the harness can send a synthetic whisper through the real model provider and require the planner to pick `survey_surroundings`.

Before connecting to the server, the planner's offline evaluation ran against the real model. It scored 35 of 41. On the exact case the live scenario depended on, a one-off "patrol" request, the model chose `patrol_area` instead.

Fair enough. Both skill descriptions were technically accurate, and neither told the model how to resolve the word "patrol". `patrol_area` exists to resume ongoing autonomous patrol, which is a much bigger thing than "go have a look around". Two rewritten descriptions and a catalog test that locks in the wording fixed it.

Then the live scenario passed in 10.1 seconds. The model picked the right skill, and the survey completed and stored real observations. Reeve didn't move at all, because the survey target was where he was already standing.

Green, and it proved the conversation works. It said nothing about whether he can walk.

## The bug I didn't fix

A later full run of the planner suite came back 40 of 41. One case had returned a malformed `suggestedSkill`, and the evaluator had recorded only that it was malformed, not what shape it was.

The tempting move was to tweak the prompt. Instead the evaluator got a diagnostic that reports the JSON type of a rejected value without ever logging the value itself. Then the same case ran five more times, unchanged. It passed 5 of 5, and the next full suite went 41 of 41.

So there was nothing reproducible to fix. Changing the prompt would have been a guess, and the next run would have "proved" the guess worked. The parser still fails closed, and if it happens again the journal will say what came back.

## Nothing to walk up

Next on the list was the spatial map's topology. Reeve records stairs, slabs, and doorways as `Connector` objects, and links them with edges in a graph. Earlier runs had discovered candidate connectors, but nothing had ever proved one could be walked.

The new scenario was strict. Find a connector, walk across it, require the walk to confirm the matching edge, restart the bot, and check the confirmation survived.

The first live run never came back with a verdict. The bot found zero usable connectors in the spawn area and correctly started no movement, but the scenario only knew how to wait for a successful crossing. So it sat there until the harness time box ran out. Now "no usable geometry" is a graded failure, and the next two runs failed in 14 and 12 seconds for the right reason. Each recorded 132 occupancy observations and zero connectors. There was nothing there to walk up.

## Decorative stairs

My base has several half-slab spiral staircases, but I didn't have coordinates for any of them. So the bot went home and scanned 24 blocks around him for every stair and slab.

It found 228 stair blocks and 284 slabs. Every one of the 228 stairs got rejected. That sounded like a bug until the rejection reasons came back. They were mostly top-half stairs, which in my base are trim, not steps.

That raised the question I actually cared about. Can the map tell decorative stairs and slabs from a real staircase? It does it in two stages:

1. **Geometry.** A stair only counts if it's bottom-half, straight, not waterlogged, with a clear space to move through and standable landings above and below. A slab only counts if it's a bottom slab with standable landings on both levels. Anything that qualifies becomes a connector, but its edges start as `candidate`.
2. **Proof.** An edge only becomes `confirmed` after a reached, continuous Journey physically crosses it. The map records which Journey confirmed it.

It can't read the builder's mind. It just refuses to believe a staircase is a staircase until somebody has walked up it.

The first targeted run from a slab landing failed, and it shouldn't have. The bot crossed a spruce slab, three edges were confirmed, and all three survived a restart. The harness assertion still said no. The skill's audit wrote a field called `traversalJourneyOutcome`. The assertion read `traversalOutcome`. The test fixture for the assertion had copied the wrong name, so the test and the bug agreed with each other perfectly.

That was the second grader bug.

## How far can he actually see?

The scan got changed to report its own limits instead of quietly applying them, and that turned up a surprise.

The debug skill accepted a 24-block radius. The production observer clamps that to 8. It also caps a scan at 512 cells and 128 results. A radius-8 sphere has 2,109 candidate cells, so the 512-cell cap cuts it off partway through the distance-5 shell. On the home scan, another 327 cells were dropped for line of sight.

So "radius 8" was the setting, and **radius 4** is the only distance that was ever fully scanned. The scan receipt now reports the requested, clamped, and fully scanned radius as three separate numbers, so nobody, including me, overstates what the bot has seen.

## Up four flights, restart, and back down

With that known, the bot rescanned at radius 4 after every step instead of trusting one big scan. From a lower landing he found a chain of bottom oak slabs going up four levels.

The final staircase scenario climbs four slab steps, confirming each edge with its own traversal Journey. Then it restarts the bot and descends the same four levels using only edges that were already confirmed and persisted. No falling back to candidate geometry.

It passed in 33 seconds. All 14 confirmed edges in the run database had a reached Journey behind them. The full test suite went from 2,168 to 2,188 along the way.

## Stuck on the edges

Later in the week I said what had been bugging me. It felt like we were stuck tweaking fixes around the edges instead of pushing the bot forward. The loop is very good at finding the next small thing that's wrong, and there's always a next small thing.

So the unit of progress changed from "prove one mechanism" to "finish one useful errand". The errand was to make one iron pickaxe and put it in a chest, as a durable job that survives restarts. It has three operations: check inventory, craft, deposit. It only counts as done when the deposit is verified, not when the craft succeeds.

First the bot had to find the materials. I knew there was a double chest of iron somewhere in the basement and one of bamboo nearby. A read-only search opened the basement chests without taking anything and found 1,984 iron ingots and 1,046 bamboo. The iron chest was full to all 54 slots, so the bamboo chest became the deposit target.

Then it took four attempts.

**Attempt one** never got to the mission. The preparation step tried to withdraw iron from a chest the fresh run hadn't mapped yet, and it used a skill that requires an already-known container. Swapping in the search skill fixed it.

**Attempt two** failed at the craft in 19 milliseconds with "I could not reach a crafting table". Nineteen milliseconds is too fast for a pathfinding problem. A code comment promised a live nearest-table fallback, but the function only checked the bot's memory, and a fresh run hadn't seen the table yet. It now looks for tables in the loaded world and tries the next one if the nearest isn't reachable.

**Attempt three** made the pickaxe and then failed twice. After the restart, the deposit chest wasn't in the map anymore. And the craft audit said three ingots were used but zero sticks. The server had consumed the sticks. Mineflayer still showed them in the inventory when the audit ran, and they only vanished after the restart. Ghost sticks.

**Attempt four** passed. One job survived both restarts, crafted exactly one iron pickaxe, and deposited it in the bamboo chest with zero unmet waits.

## Final thoughts

- **An honest red beats a fake green.** The failure I liked most this week was the bot saying "I couldn't get there."
- **Graders have bugs too.** Two of this week's bugs lived in the test harness. When a test and its fixture share a typo, they'll agree forever.
- **Don't fix what you can't reproduce.** Add the diagnostic, rerun, and let the evidence decide.
- **Make limits visible.** "Radius 8" was a setting. "Fully scanned: 4" is what changed how the next scenario was built.
- **Give the loop a real errand.** Mechanism tests find small bugs. An errand finds the ones between the mechanisms.

Codex did most of the running, the reading, and the fixing. My job was mostly saying "commit and push" and asking what a green run actually proved.

Reeve can now make a pickaxe and put it away. It only took four tries and a chest with 1,984 iron ingots in it.
