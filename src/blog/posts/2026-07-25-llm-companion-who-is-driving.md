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
draft: true
---

# Who's Driving? Giving an LLM a Minecraft Body Without the Steering Wheel

_Or: My LLM companion had a brain, and nothing ever called it_

Last month [Reeve couldn't get through a door](/#/blog/minecraft-bot-vs-wooden-door). A few weeks of fixes later he can handle doors, slab staircases, the farm, storage, and the furnace. He can keep himself fed and busy with no model involved at all. The deterministic behavior loop handles patrol, upkeep, scheduled farm work, and getting out of trouble.

That was always the plan. A language model is too slow and too expensive to run a Minecraft body tick by tick. The body should run itself, and the model should be the part that talks, judges, and occasionally decides what to do next.

A couple of weeks ago I got ready for the first proper live run. Codex went through my `.env` with me, and I made a few deliberate choices:

- `CAN_MODIFY_WORLD=true`, so scheduled farm work could actually harvest and replant.
- Doors allowed, fence gates not yet.
- Patrol follows the bot instead of staying pinned to the home anchor.
- The player allowlist left empty for now.

Then I asked the question I should have asked earlier: *how does the LLM interact with the bot while the behavior loop is running?*

## The answer: it doesn't

Nothing on the patrol path calls the model. The "patrol planner" in the code is deterministic navigation logic. Exact commands like `status` or `go home` skip the model and go straight to deterministic skills. Only natural-language conversation from an allowlisted player reaches the LLM.

My allowlist was empty, and Discord was disabled. So the ChatGPT-backed planner was configured, authenticated, and initialized, and nothing could ever reach it. I had built a brain and given it no way to be asked anything.

> Narrator: _He had, in fact, built an extremely well-tested NPC._

## What I actually wanted

What I wanted, in my own words at the time:

> The LLM is going to be another "player" in the world with the bot being its "character".

That comes with constraints I care about:

1. **Players always win.** If I tell Reeve to do something, that beats anything the model decided on its own.
2. **Don't spam the model.** Token usage should be deliberate, not a side effect of the game loop.
3. **The body works without a brain.** With no model configured, or with the provider down, the deterministic loop keeps Reeve alive and useful.

## Four layers, one body

The model I ended up with puts four layers over one body, each with a clear authority level:

| Layer | What it does | Authority |
| :--- | :--- | :--- |
| Survival reflexes | Flee, surface, escape fire, recover | Highest. Interrupts everything |
| Player or operator | Directs the character, overrides intentions | Above the LLM |
| Autonomous LLM | Picks an occasional goal from a short list | Above idle behavior |
| Deterministic loop | Patrol, upkeep, farm schedule, fallback | Baseline |

The rule underneath all four layers is that **the LLM never emits code or calls Mineflayer directly.** It returns a structured choice from a catalog of registered Skills. The runtime validates that choice at execution time against source allowlists, capability gates, territory rules, and resource limits. The model can ask for something. It never does anything itself.

## Who asked for this?

The piece that makes "players always win" enforceable instead of a line in a prompt is that every action carries an *execution source*:

- `planner` means the model is acting on behalf of a player's request in a conversation.
- `agent` means the model decided this by itself, with nobody asking.
- `behavior` means the deterministic loop.

Those sources get separate runtime priorities. Any authorized player activity cancels an in-flight `agent` provider call *and* the action it produced. When the player goes quiet again, the next autonomous turn has to look at the current scene and decide fresh. It doesn't resume whatever it was thinking five minutes ago.

That last part matters more than it sounds. Stale intent is how you get a bot that heads off to harvest a field you just told it to stay away from.

## A budget for thinking

The proactive coordinator only calls a real model when *all* of these are true:

- `ENABLE_LLM_AUTONOMY=true`
- The behavior loop is enabled and the bot is ready
- Nothing else owns the body: no player work, no safety reflex, no earlier autonomous action
- A minimum interval has passed, and so has a quiet period since the last player activity
- The rolling hourly budget has room
- Any provider-failure backoff has expired
- Something actually changed: the scene, or which Skills are available right now

That last condition saves the most tokens. If Reeve is standing in the same room with the same options as last time, asking the model again buys nothing. A skipped opportunity costs zero model calls.

When the provider fails, the coordinator records it, backs off, and lets the deterministic loop carry on. The stub provider can never supply autonomous intent, so a misconfiguration fails quietly instead of producing a bot that acts on canned decisions.

## A deliberately small menu

What the model can choose on its own is a lot narrower than what it can do for a player. An autonomous turn may pick **at most one** Skill, and that Skill has to:

- explicitly allow the `agent` source,
- be a reversible chore,
- need no special capability, and
- pass a live availability check both before the model sees it and again before it runs.

That covers things like reporting, surveying, patrolling, travel, bounded collecting, and putting things away. It can't chat in the world, write rules, start multi-step plans, or touch anything gated behind a capability flag. When a player asks for something bigger, it goes through the conversational planner path with that player's authority. The autonomous path never gets to do it on its own.

The prompt is small too. It gets a compact, fair-play view of the scene: what Reeve can see or remember, a few recent outcomes, and the names of the eligible Skills. No raw Mineflayer state, and no private storage manifests.

## Two other pieces that landed this month

**The brain runs on my ChatGPT subscription.** Like my [OpenClaw box](/#/blog/taming-openclaw-proxmox-lxc), Reeve can use OpenAI models through Codex OAuth instead of a metered API key. `npm run codex-login` saves a token cache under `.auth/`, mode `0600`. I extended it to list the models the account can use and let me pick one plus a reasoning effort, which gets written to `.env`. A typo like `LLM_REASONING_EFFORT=fast` now fails at boot instead of quietly doing something.

**Discord as a second mouth.** I don't want to be logged into Minecraft to talk to Reeve. A thin Discord adapter maps Discord user IDs (never display names) to the same commander identities the in-game chat uses. Messages go through the same command router as in-game chat, at chat-level privilege. Unmapped users get ignored, and every Discord-sourced command is journaled with its own channel tag.

## Final thoughts

The interesting design work on an LLM agent isn't the prompt. It's deciding what the model is *allowed to want*, and who wins when it disagrees with a human.

For Reeve, the answer is layered. Reflexes keep him alive, players are in charge, and the model gets a small, budgeted, reversible menu. The deterministic loop does all the boring work, which is most of it.

The first slice is in. The model can now occasionally decide on its own to go survey the area or put things away. Whether those choices are any *good* is the next question, and that one only gets answered by letting him loose in the world and reading the journal afterward.
