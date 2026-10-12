---
title: "Who's Driving? Giving an LLM a Minecraft Body Without the Steering Wheel"
date: 2026-07-25
author: jabez007
tags:
  - minecraft
  - mineflayer
  - llm
  - ai-agents
  - software-architecture
  - typescript
excerpt: |
  Right before the first real live run of my Minecraft companion bot, I asked a simple question:
  what does the LLM actually do while the bot is patrolling? The answer was "nothing". Here is how
  I gave the model some initiative without letting it spam tokens or overrule a player.
featured: false
draft: false
---

# Who's Driving? Giving an LLM a Minecraft Body Without the Steering Wheel

_Or: My LLM companion had a brain, and nothing ever called it_

Last month [Reeve couldn't get through a door](/#/blog/minecraft-bot-vs-wooden-door). A few weeks of fixes later he can handle doors, slab staircases, the farm, storage, and the furnace. He keeps himself fed and busy with no model involved at all. A deterministic behavior loop handles patrol, upkeep, scheduled farm work, and getting out of trouble.

That was always the plan. A language model is too slow and too expensive to run a Minecraft body tick by tick. The body should run itself, and the model should be the part that talks, judges, and now and then decides what to do next.

A couple of weeks ago, while getting ready for the first proper live run, I asked a question I should have asked earlier. How does the LLM interact with the bot while the behavior loop is running?

## The answer: it doesn't

Nothing on the patrol path calls the model. The "patrol planner" in the code is deterministic navigation logic. Exact commands like `status` or `go home` skip the model and go straight to deterministic skills. Only natural-language conversation from an allowlisted player reaches the LLM.

My allowlist was empty, and Discord was disabled. So the ChatGPT-backed planner was configured, authenticated, and initialized, and nothing could ever reach it. I had built a brain and given it no way to be asked anything.

> Narrator: _He had, in fact, built an extremely well-tested NPC._

Even with an allowlisted player, the model only ever reacts. A conversational turn returns one chat line plus at most one skill or a short plan, and consequential work waits for the player to confirm. That's a decent chat interface bolted onto an NPC. It isn't a companion.

## What I actually wanted

What I wanted, in my own words at the time:

> The LLM is going to be another "player" in the world with the bot being its "character".

That comes with constraints I care about:

1. **Player commands beat autonomous chores.** If I tell Reeve to do something, that beats anything the model decided on its own. Survival reflexes still interrupt both of us.
2. **Don't spam the model.** Token usage should be deliberate, not a side effect of the game loop.
3. **The body works without a brain.** With no model configured, or with the provider down, the deterministic loop keeps Reeve alive and useful.

## Four layers, one body

The design I ended up with puts four layers over one body, each with a clear authority level:

| Layer | What it does | Authority |
| :--- | :--- | :--- |
| Survival reflexes | Flee, surface, escape fire, recover | Highest. Interrupts everything |
| Player or operator | Directs the character, overrides intentions | Above the LLM |
| Autonomous LLM | Picks an occasional goal from a short list | Above idle behavior |
| Deterministic loop | Patrol, upkeep, farm schedule, fallback | Baseline |

The rule underneath all four layers is that **the LLM never emits code or calls Mineflayer directly.** It chooses a chore from a list of registered skills. Before running it, the runtime checks who asked, whether that source can use the skill, and whether its required capabilities are enabled. It also checks where the bot may work and what resources it may spend. The model can ask for something. The runtime decides whether Reeve is allowed to do it.

Here's the flow on one page:

```text
Player message ──> conversation planner ─┐
                                         │
Scheduled opportunity ─> autonomy mode ──┼─> SkillExecutor ─> ActionRunner
                                         │                       │
Behavior loop ─> deterministic action ───┘                       ▼
                                                         Navigation/world APIs
                                                                 │
                                                                 ▼
                                                           Mineflayer bot
Safety reflexes ──────────────────────────────> ActionRunner at highest authority
```

## Who asked for this?

The catch was that the `ActionRunner` only knew three priorities: `passive`, `high`, and `critical`. It had no idea whether an action came from a player or from a model that decided something on its own. A player command at the same priority as an LLM chore wasn't guaranteed to win. "Player commands beat autonomous chores" would have been a line in a prompt, which is to say a suggestion.

So every action now carries an *execution source*:

- `planner` means the model is acting on behalf of a player's request in a conversation.
- `agent` means the model decided this by itself, with nobody asking.
- `behavior` means the deterministic loop.
- `safety` means a survival reflex.

The ordering is `safety > player > agent > behavior`, and it lives in code. A player's work can interrupt an agent chore even when that chore's task priority is higher. Neither a player nor the agent can interrupt a critical survival reflex. Both of those are tests now.

Any authorized player activity aborts an in-flight `agent` provider call *and* cancels the action it produced, then starts a quiet period. When the player goes quiet again, the next autonomous turn has to look at the current scene and decide fresh. It doesn't resume whatever it was thinking five minutes ago.

That last part matters more than it sounds. Stale intent is how you get a bot that heads off to harvest a field you just told it to stay away from.

## One model, two jobs

The naming confused me for a while, because "planner" means two things in this codebase.

There's the `Planner` interface, which is just the model provider. Both player conversations and autonomous turns call the same `planTurn()` method with a purpose of either `"conversation"` or `"autonomy"`. At startup the same provider instance goes to both the command router and the autonomy coordinator.

So the autonomous agent isn't a second LLM. It's a scheduled, lower-authority use of the same one. That matters for practical reasons too. Reeve uses Codex OAuth, and two provider instances would mean two copies of the token refresh state fighting over one login.

## A budget for thinking

The proactive coordinator only calls a real model when *all* of these are true:

- `ENABLE_LLM_AUTONOMY=true`
- The behavior loop is enabled and the bot is ready
- Nothing else owns the body: no player work, no safety reflex, no earlier autonomous action
- A minimum interval has passed, and so has a quiet period since the last player activity
- The rolling hourly budget has room
- Any provider-failure backoff has expired
- Something actually changed: the scene, or which skills are available right now

That last condition saves the most tokens. If Reeve is standing in the same room with the same options as last time, asking the model again buys nothing. A skipped opportunity costs zero model calls.

The code defaults allow a call every three minutes and twelve per hour. My live config is stingier, with one opportunity every five minutes, six calls an hour, a fifteen-minute failure backoff, and a two-minute quiet period after any player activity. Six calls an hour is nothing. That's the point.

A model call takes a while, and the world keeps going. Review caught a race where a slow response could dispatch a chore into a situation that had changed. Now the coordinator re-checks hazards and body ownership after inference, before it dispatches anything.

When the provider fails, the coordinator backs off and lets the deterministic loop carry on. The stub provider can never supply autonomous intent, so a misconfiguration fails quietly instead of producing a bot that acts on canned decisions.

## A deliberately small menu

What the model can choose on its own is a lot narrower than what it can do for a player. An autonomous turn may pick **at most one** skill, and that skill has to:

- explicitly allow the `agent` source,
- be a reversible chore,
- need no special capability, and
- pass a live availability check both before the model sees it and again before it runs.

For now that's exactly five skills: `collect_drops`, `go_home`, `go_to_location`, `inspect_sector`, and `patrol_area`. A test pins the production catalog to those five, so a new skill can't quietly become agent-callable because someone forgot a flag.

Anything bigger has to come from a player, through the conversational planner, with that player's authority.

At first, every autonomous turn used the full conversational prompt, including skills it couldn't choose. I gave autonomy a smaller prompt containing only its five allowed chores and asking for a three-field response, `{ skill, input?, reason }`. It comes in at about 18% of the conversational system prompt by character count, and a regression test fails if it ever passes a third. Autonomous turns on Codex always run at low reasoning effort. Conversation keeps whatever effort I configured.

## Same character, both modes

Then there's `SOUL.md`. It's the persona file, and it defines Reeve's identity, a short and warm way of talking, and values like safety, honesty, and stewardship. I wanted to know where it actually shows up.

The answer is both prompts. The conversational prompt includes it in full, with an explicit note that the persona only shapes the tone of the chat line. The autonomy prompt includes it too, where it can tilt Reeve's choice among chores he's already allowed to do. Stewardship might make "go home" look better than "patrol" at dusk. It can't add a skill, override a safety check, widen a boundary, invent a location, or overrule a player.

A missing or empty `SOUL.md` is a startup error, not a silent bot with no personality.

So yes, it's one character. In player mode Reeve converses and acts with the player's authority. In autonomous mode he privately picks one safe chore and says nothing. Same identity, same world view, same memory of recent outcomes. What changes is who asked and how much he's allowed to do about it.

The deterministic loop is the exception. Patrol, doors, survival reflexes, and farm work never read `SOUL.md`. From inside the game it all looks like Reeve, but that part is autopilot.

## Letting him choose

I started this work with a model that was configured, authenticated, and unreachable. Wiring it in meant deciding when it gets a turn, what it may ask for, and how quickly it has to get out of a player's way. None of those decisions could live only in the prompt.

Reeve can now decide on his own, at most six times an hour, to inspect a sector or head home. Whether those choices are any *good* only gets answered by letting him loose in the world and reading the journal afterward.
