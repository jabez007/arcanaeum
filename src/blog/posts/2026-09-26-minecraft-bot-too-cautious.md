---
title: "My Minecraft Bot Was Too Careful to Be Useful"
date: 2026-09-26
author: jabez007
tags:
  - minecraft
  - mineflayer
  - ai-agents
  - game-ai
  - software-architecture
excerpt: |
  My bot wouldn't put things away unless every chest had a label, and out of the box it couldn't even open
  the front door of its own base. Months of "fail closed" had built a steward that asked permission to exist.
  This month I started turning things on, and found one place where caution was the right call.
featured: false
draft: true
---

# My Minecraft Bot Was Too Careful to Be Useful

_Or: Even copper golems are smarter than that_

Reeve, my Mineflayer bot, was built carefully. Every capability has a gate, every gate defaults to closed, and the journal explains every refusal. A bot that plays on a server with other people's builds on it should be careful. I still think that.

But careful adds up. Each gate made sense on the day it went in. Put enough of them together and you get a bot that's very safe and doesn't do much.

## 1,728 sugar cane and nowhere to put it

It started with clutter. Reeve was walking around with stacks of bamboo and sugar cane in his pack. Bamboo makes sticks for replacement tools, so a little is worth keeping. Sugar cane isn't. So he got a retention rule. Keep 16 bamboo, keep no sugar cane, and when you're carrying more than that, go put the rest away.

The tidy ran every couple of minutes, and every run ended the same way:

```text
Nothing to stow: I'm only carrying essentials, or my surplus has no organized home.
```

There were four chests of bamboo in the base, already full of bamboo. There was a chest of sugar cane, so full it held 1,728 of them. Reeve could see all of them. He'd surveyed them. He just wasn't allowed to use them.

Reeve only deposits into chests a player has labeled as shared storage or bot storage. No chest in my base had either label, because I'd never labeled any. To fix it, I was supposed to walk up to each chest, look at it, and type `this is shared storage` in chat. Each half of a double chest, separately.

My reaction, more or less word for word:

> It seems ridiculous to have to teach the bot every chest in the base. Even copper golems are smarter than that.

Copper golems, for anyone who hasn't met them, sort items into whichever chest already holds that item. No labels and no permission. Players already understand that rule because the game taught it to them.

There was even a setting for unlabeled chests, `ALLOW_UNMARKED_STORAGE_FOR_MAINTENANCE`, and I had it switched on. But it only let Reeve *take* gear out of unlabeled chests. Its comment said it "never authorizes deposits", and a test enforced that. That was a deliberate decision from earlier in the month, written down and committed. The worry was the bot stuffing things into someone's personal chest.

Looking at it again, that promise went too far. Putting items away isn't a dangerous action. Putting a stick in a chest of sticks is about the safest thing a bot can do in a shared base.

So now Reeve follows the copper golem rule, with no setting in front of it. He'll put an item in any chest he's surveyed inside his work area that already holds that item. A few things are still off-limits:

- chests labeled private
- empty unlabeled chests, because a player might be keeping one free on purpose
- a chest that held the item when he last looked but has been emptied since

He rechecks each chest when he opens it. If somebody emptied a chest, they probably did it for a reason.

## The one time careful was right

The same week, a different fix went the other way.

Reeve kept failing to reach one of the beds in the base, a bed in the basement. Most of his failed trips there ended within a few blocks of it. So a fix let him sleep if he got within reach of the bed, even when the last few steps of the path failed. It worked. It worked a little too well.

Then Reeve clicked a bed through a wall. He'd slept in a walled-off basement room he couldn't walk out of, and the server had moved his respawn point there. That's also why his next two runs stayed in the basement and never once used a door. I had to move him back to his own bed myself.

Vanilla Minecraft checks the distance to a bed, not whether there's a wall in the way, so the server accepted the click. That doesn't make it fair play.

Before deciding whether to patch the fix or throw it away, I wanted to know what it had actually been fixing. So I counted every failed bed trip since August that ended within sleeping distance:

| Bed | Failed trips | Ended within sleeping reach |
| :--- | ---: | ---: |
| Home bed | 324 | 1 |
| Basement bed | 165 | 77 |

All 77 of the basement cases were that walled-off room. The navigator had been correctly reporting that there was no way in, and the fix had gone around it through a wall. For the bed Reeve actually uses, the fix would have helped once in over a month.

A line-of-sight check would stop the through-wall case, but it's hard to get right around glass, slabs and fences, and its whole upside was one trip a month. And a bot that can't walk up to its bed usually means something is wrong, like a blocked door. The old behavior reported that instead of hiding it.

So the fix got reverted outright, and the commit message says why. Clicking a bed through a wall isn't fair play.

So "less careful" doesn't mean "anything goes". It means I want the caution sitting where the risk actually is.

## What does he do without a brain?

About a week later I wanted an honest look at Reeve with the LLM turned off. As a plain old-school game AI, what does he actually understand about Minecraft? And how much time would a player waste giving him permission for routine things?

Start with the good news. The deterministic loop is a 20-step priority list. It runs from sleeping and eating, through farming, trees, picking up drops, stowing, and gear upkeep, down to lighting and patrol. Reflexes on their own timers handle drowning, fire and lava, low health, and hostiles. Death recovery gives up after 270 seconds, on purpose, because dropped items despawn at five minutes.

He knows more Minecraft than I'd have guessed. He eats at hunger 14 so that hunger never forces an emergency, and only treats 8 as the emergency. He checks he's holding a pickaxe that can actually mine an ore before he swings at it.

In a 30-minute unattended run with the LLM off, he started 62 actions and completed 58, with 4 cancelled and 0 failed. His second pass over the farm harvested 38 wheat and replanted 64. That's a useful half hour.

And the permission burden at runtime was essentially zero. The deterministic loop has no per-action prompt at all. Typed commands don't need confirmation either, because in the code's own words, "a direct player request IS the confirmation." When he can't do something, he records why and doesn't retry, or complain again, until something about the situation changes. He doesn't nag.

The less good news came in three parts.

**He has no tech tree.** Mining, crafting and smelting only happen when a player asks. He'll notice his pickaxe is worn out and craft a replacement from what he's carrying, but he'll never go mine iron for it. The review's line was that Reeve isn't an NPC that plays Minecraft, he's a steward, "closer to a Dwarf Fortress dwarf with a short job list than to a player." I can't argue with that.

**Out of the box, he does nothing productive.** Farming, trees, fishing, lighting, fighting, and changing the world at all were each behind a switch that defaulted off. Default-on was maintenance only.

**He couldn't open the door.** `CAN_OPEN_DOORS` defaulted to `false`. A freshly configured bot [couldn't walk through the front door](/#/blog/minecraft-bot-vs-wooden-door) of the house he was supposed to look after.

> Narrator: _He had learned to open doors back in June. He just wasn't allowed to._

On top of that, setting him up meant 136 config fields and a 599-line `.env.example`. That's a lot to hand someone who just wants a helper.

## Turning things on

The tech tree is a bigger project. The defaults and the config were this week.

**A home on first run.** Since the anchor settings went in, `.env.example` had promised that leaving the home coordinates empty would make the spawn point Home. Only the configured path was ever written. Without a Home, every home-anchored skill, patrol included, just skipped, and the log said autonomy would stay paused "until home is taught". So a new bot stood still until a player pointed him at a bed. Now he adopts his spawn point as Home, and an empty territory becomes a homestead around it. He waits a few seconds after login to read his spawn, because the server teleports him once more right after he joins.

**Doors open, fence gates don't.** The commit's reasoning fits in one line: "A villager cannot open a fence gate." Players already use fence gates as the barrier a resident respects and doors as the way into a building. Reeve follows the same convention now.

**Productive work on by default, fenced by what a player built.** Farming needs a wheat farm to find. Terrace farming needs real planting beds, and open ground fails that test by design, so he can't wander off and start farming the wild forest. Fishing needs a rod, which he never crafts for himself. The player's build is the opt-in, and on an untouched map those branches stay quiet. Lighting stays off, because every new world has dark ground near spawn, and he'd start placing torches on land nobody asked him to light.

**Delete the gates that only said no.** `CAN_USE_FIXTURES` turned out to do exactly one thing. When a player said "ring the bell", it told them fixtures were disabled. Requests from a player were already allowed further down, so the switch only ever refused people. It's gone. A fixture gets used when a player asks, and Reeve can't use one on his own initiative at all.

The real protection was always the allowlist, which has exactly two entries, bells and signs. Repeaters stay off it because one click silently breaks a redstone build. Levers can set off TNT. Cake loses a slice. A test now pins the allowlist, and its failure message lists the blocks that must never be added.

**Fishing isn't animal handling.** Fishing used to sit behind the same switch as shearing sheep and milking cows. In Minecraft those aren't the same kind of thing at all. That grouping also had a side effect nobody chose. Turning off creature interaction stopped his hunger fallback too, so he couldn't feed himself. Fishing has its own gate now, and its own "stop fishing" command.

**Fewer knobs.** Five radius settings that never authorized anything became one constant, 64. Every remaining key is now classified as required, policy, or tuning, and a test fails if a new one shows up without a class. Only 6 are required, and `.env.example` opens with just those. And one `LLM_PROVIDER` can serve all [three model tiers](/#/blog/three-llm-tiers-for-a-minecraft-bot) from earlier this month again, since asking a new player to pick three providers was a lot.

## Final thoughts

- **Fail-closed is a security posture, not a first-run experience.** You can have the first without inflicting it on the second.
- **Gate the risk, not the action.** Putting a stick in a chest of sticks isn't risky. Sleeping through a wall is.
- **A gate that only refuses players isn't protecting anything.** Read what a setting actually does before keeping it.
- **Let the build be the permission.** A farm the player built is a clearer opt-in than a flag in `.env`.
- **Use the game's own conventions.** Villagers don't open fence gates, copper golems sort by what's already in the chest, and players already understand both.

Reeve now puts his sticks away and opens his own front door. He still can't make his own pickaxe without being asked.
