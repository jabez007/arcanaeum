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
  I asked Codex to run my Minecraft companion bot for twenty minutes at a time, give it chores, read the
  journal afterward, fix something, and run it again. It found real bot bugs. It also found that my test
  graders were lying to me about as often as the bot was.
featured: false
draft: true
---

# Letting Codex Playtest My Minecraft Bot

_Or: Who grades the grader?_

Reeve, my Mineflayer companion, has a lot of unit tests. Over two thousand of them. They're great at telling me that a function returns what I expect. They aren't good at telling me whether a bot left alone in my world for twenty minutes actually does anything useful.

I don't have other players on the server right now to help test. So this week I tried something different. I asked Codex:

> would you be able to exercise and test and validate this bot? I'm thinking a sort of loop where you run the bot for 10 - 20 minutes, use something like the operator console to ask the bot to do or work on something a Minecraft player might ask for, wait for bot to respond and/or complete the task, then shutdown the bot and review the logs/journal to evaluate the session. From there, make adjustments to code [...] and then re-run to assess if there is an improvement or a regression.

There was already a harness in the project from earlier attempts at this. It can launch the bot against the live server, run a scripted scenario, keep a structured journal, and shut everything down cleanly. It just hadn't been used like this, as a loop with somebody actually reading the results.

## Loop one: a failure, and a fake success

The first run was a twenty-minute patrol soak: four `survey_surroundings` passes, five minutes apart, with status checks at the start and end.

Three surveys completed. One failed:

```text
Survey Task observation pose was unreachable.
```

That's the good kind of failure. The bot tried to walk somewhere, couldn't, and said so instead of reporting a success. The harness marked the run red because an expected completion never arrived. Everything did what it was supposed to.

Then Codex ran the session reporter over the journal. The reporter flags suspicious outcomes, including "completed, but with zero effect", which is a classic way for a bot to fake progress. It flagged one. It was the status report.

The reporter's zero-effect check matched any `0/N` pattern in the output text. The very first status snapshot of the run included the spatial map counters, which at startup were `1/0/0`. The grader read that as "zero out of something got done" and invented a false-success warning for a read-only status command.

Codex's first regression test used the counters from the *end* of the run, `1/27/6`, and it stayed green. It took a second try with the exact live-shaped `1/0/0` string to get a red test. Then the fix narrowed the check to real effect phrasing like `0/2 repaired`.

The comparison run, with no bot code changed, went 4/4. So the unreachable pose looked like a one-off, and the only bug fixed in loop one was in the tool that grades the bot.

> Narrator: _This would become a theme._

## Loop two: what does "patrol" mean?

The patrol soak never touched the language model. I wanted a test where someone asks Reeve for something in plain English. With no real players around, Codex used a scenario that sends a synthetic whisper through the real model provider and requires the planner to pick `survey_surroundings`.

Before connecting to the server, it ran the planner's offline evaluation against the real model. That caught a problem first. The model scored 35 of 41, and on the exact case the live scenario depends on, a one-off "patrol" request, it chose `patrol_area` instead. In its own words, the request "maps directly to the patrol skill."

Fair enough. Both Skills were offered to the planner, and both descriptions were technically accurate. Neither one told the model how to resolve the word "patrol". `patrol_area` exists to *resume ongoing autonomous patrol*, which is a much bigger thing than "go have a look around".

The fix was two Skill descriptions. A one-off or short patrol request means `survey_surroundings`. `patrol_area` is only for an explicit request to resume autonomy. A catalog test locks in that wording. After that, the case passed against the real model.

The live scenario then passed in 10.1 seconds. The model picked the right Skill and the survey completed and stored real observations. And Reeve didn't move at all, because the survey target it picked was where it was already standing.

Green, and it proved less than it looked like. Codex said so in the summary without me asking, which I appreciated.

## Loop three: decorative stairs

My base has several half-slab spiral staircases. I wanted Reeve to prove he could use one, but I didn't have coordinates handy. So I asked Codex whether it could find them.

It sent the bot home and ran a 24-block scan for every stair and slab. The scan found 228 stair blocks and 284 slabs. Every one of the 228 stairs got rejected. That sounded like a bug until Codex pulled the rejection reasons. They were mostly top-half stairs, which in my base are trim, not steps.

That raised the question I actually cared about. Can the spatial map tell decorative stairs and slabs from a real staircase? It can, in two stages:

1. **Geometry.** A stair only counts if it's bottom-half, straight, not waterlogged, with a clear space to move through and standable landings above and below. A slab only counts if it's a bottom slab with standable landings on both levels. Top slabs and double slabs aren't steps. Anything that qualifies becomes a `Connector`, but its edges in the topology graph start as `candidate`.
2. **Proof.** An edge only becomes `confirmed` after a reached, continuous Journey physically crosses it. The map records which Journey confirmed it.

It can't read the builder's mind. It just refuses to believe a staircase is a staircase until somebody has walked up it.

The first targeted traversal run also failed, and it shouldn't have. The bot crossed a spruce slab, three edges were confirmed, and all three survived a restart. The harness assertion still said no. The Skill's audit wrote a field called `traversalJourneyOutcome`. The assertion read `traversalOutcome`. And the test fixture for the assertion had copied the wrong name, so the test and the bug agreed with each other perfectly.

That made two grader bugs out of three loops.

## How far can he actually see?

Codex then had the scan report its own limits instead of quietly applying them. That turned up a surprise.

The debug Skill accepted a 24-block radius. The production observer clamps that to 8. It also caps a scan at 512 cells and 128 results. A radius-8 sphere has 2,109 candidate cells, so the 512-cell cap cuts it off partway through the distance-5 shell. On the home scan, another 327 cells were excluded for line of sight.

So "radius 8" was the setting. **Radius 4** is the only distance that was ever fully scanned. The scan receipt now reports the requested radius, the clamped radius, and the fully scanned radius as three separate numbers, so nobody, including me, overstates what the bot has seen.

## Up four flights, restart, and back down

With that in mind, Codex had the bot rescan at radius 4 after every step instead of trusting one big scan. From a lower landing it found a chain of bottom oak slabs going up four levels.

The final staircase scenario:

- climbs four `slab_step` Connectors, confirming each edge with its own traversal Journey,
- restarts the bot,
- descends the same four levels using **only** edges that were already confirmed and persisted, with no falling back to candidate geometry.

It passed in 33 seconds. All 14 confirmed edges in the run database had a reached Journey behind them. The full test suite was up to 2,188 by then.

## The part where I said "enough"

Near the end of the week I told Codex:

> It feels like we've been sort of stuck tweaking fixes around the edges for a bit now instead of significantly pushing the envelope on the progress of the bot.

That was fair. The loop is very good at finding the next small thing that's wrong, and there's always a next small thing. So the next loops turned toward an actual errand: go get iron from a chest in the basement, craft a pickaxe, and put it away, as a job that survives restarts.

It got as far as the crafting step and failed in 19 milliseconds with "I could not reach a crafting table". Nineteen milliseconds is too fast for a pathfinding problem. A code comment promised a live nearest-table fallback. The function only checked the bot's memory, and a fresh run hadn't mapped the table yet. So that's next.

## Final thoughts

A few things I'll keep from this week:

- **An honest red beats a fake green.** The failure I liked most this week was the one where the bot said "I couldn't get there."
- **Graders have bugs too.** Two of the bugs found this week were in the test harness, not in the bot. When a test and its fixture share a typo, they'll agree forever.
- **Make limits visible.** "Radius 8" was a setting. The scan receipt showing "fully scanned: 4" is what changed how the next scenario was built.
- **Green isn't the same as proven.** A 10-second pass where the bot never moves proves the conversation works, not that the bot can walk.
- **Watch for the loop eating the project.** Fixing the edges feels like progress, and some of it is. At some point you have to give the bot a real errand.

Codex did most of the running, the reading, and the fixing. My job was mostly saying "commit and push" and occasionally asking what a green run actually proved.

Reeve still can't find the crafting table. He can, however, prove beyond reasonable doubt that he has walked up a staircase.
