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

Reeve, my Mineflayer bot, was built carefully. Every capability has a gate, every gate defaults to closed, and the journal explains every refusal. That was on purpose.

This month, the careful part started getting in the way.

## The chest problem

It started with clutter. Reeve was picking up stacks of bamboo, sugar cane, and pumpkins and just carrying them around. Claude added a retention model so he'd keep a small reserve of useful things and stow the rest. Sticks and bamboo get a reserve of 16. Sugar cane gets zero. Anything more than 8 over its reserve triggers a tidy.

The tidy never actually tidied. Every run ended with:

```text
Nothing to stow: I'm only carrying essentials, or my surplus has no organized home.
```

Claude explained that Reeve only puts things in chests labeled as shared storage or bot storage. No chest in my base had either label, so as far as he was concerned there was nowhere to put anything.

My response:

> the bot should just be allowed to put stuff away. It seems ridiculous to have to teach the bot every chest in the base. Even copper golems are smarter than that.

Copper golems, for anyone who hasn't met them, sort items into whichever chest already holds that item. That's it. No labels, no permission.

Claude pointed out there was a setting, `ALLOW_UNMARKED_STORAGE_FOR_MAINTENANCE`, but its comment said it "never authorizes deposits". That was a deliberate decision from earlier in the month, written down and committed. I disagreed with it:

> The existing setting explicitly promising it never allows deposits was an overreach of that original work and part of the bot being tuned far too overly cautious.

And:

> Putting items away is not a dangerous action that needs to be gated.

So now Reeve follows the copper golem rule. He'll put an item in any unlabeled chest inside his work area that already holds that item. No setting gates it. A few things are still off-limits:

- chests labeled private
- empty unlabeled chests, because a player might be keeping one free on purpose
- a chest that held the item when he last looked but has been emptied since

That last one matters. If somebody emptied a chest, they probably did it for a reason.

## The one time careful was right

The same day, a different fix went the other way.

Reeve kept failing to reach one of the beds in the base. A fix let him sleep if he got within reach of the bed, even if the last few steps of the path failed. It worked. It worked a little too well.

Then this:

> I think the bot somehow clicked a bed through a wall... probably violated fair play

He had. Vanilla Minecraft checks the distance to a bed, not line of sight, so the server accepted the click. Reeve woke up in a walled-off basement room he couldn't leave, and the server moved his respawn point there. I had to move him back to his own bed.

Claude checked the history before deciding what to do. Of 165 failed trips to that basement bed, 77 ended within sleeping reach, and every one of those was that walled-off room. For the bed he normally uses, it was 1 of 324. So the fix wasn't helping a bot that gave up next to a usable bed. The navigator was correctly saying "there's no way in", and the fix was going around it through a wall.

That one got reverted. Clicking a bed through a wall isn't fair play, and the revert's commit message says so.

So "less cautious" doesn't mean "anything goes". It means I want caution where there's an actual risk.

## What does he do without a brain?

About a week later I asked Claude for an honest review, specifically of the bot with the LLM turned off:

> As a purely "old-school" NPC game AI what does it "understand" about the Minecraft game mechanics and "playing" in the Minecraft world? [...] How much time is the player going to have to waste giving the bot explicit permission over and over again to mundane routine tasks necessary to survive in a Minecraft world?

Start with the good news. The deterministic loop is a 20-step priority list that covers sleeping, eating, farming, trees, stowing, gear upkeep, lighting, and patrol. Reflexes underneath it handle drowning, fire, low health, and hostiles. It knows a fair amount of Minecraft. It eats before hunger becomes an emergency, checks it has the right pickaxe before touching ore, and handles the crop lifecycle. A 30-minute unattended run with the LLM off had 62 actions started, 58 completed, and 0 failed.

And the permission burden at runtime was essentially zero. Typed commands don't need confirmation, because in the code's own words, "a direct player request IS the confirmation." Refusals are deduplicated so the bot doesn't nag.

The less good news, in three parts.

**He has no tech tree.** Mining, crafting, and smelting only happen when a player asks. Claude's description was that Reeve isn't an NPC that plays Minecraft, he's a steward, "closer to a Dwarf Fortress dwarf with a short job list than to a player."

**Out of the box, he does nothing productive.** Farming, trees, fishing, lighting, and modifying the world at all were each behind a switch that defaulted off. Default-on was maintenance only.

**He couldn't open the door.** `CAN_OPEN_DOORS` defaulted to `false`. A freshly configured bot [couldn't walk through the front door](/#/blog/minecraft-bot-vs-wooden-door) of the house he was supposed to look after.

> Narrator: _He had learned to open doors back in June. He just wasn't allowed to._

The setup alone had 136 config fields and a 599-line `.env.example`.

My reaction:

> The bot really needs to be able to be at least somewhat productive out of the box. We have to many configs that default off. We probably have too many configs just in general and it is just going to annoying the player trying to get a new bot set up. I think the bot also needs to know and understand more about the tech tree in Minecraft.

## Turning things on

The tech tree is a bigger project. The defaults and the config were this week.

**A home on first run.** The docs had promised for a while that leaving the home coordinates empty would make the spawn point Home. Only the configured path was ever implemented. Without a Home, every home-anchored skill, patrol included, just skipped. So a new bot stood still until a player taught it a bed. Now it adopts its spawn point as Home, and an empty territory becomes a homestead around it.

**Doors open, fence gates don't.** The commit's reasoning fits in one line: "A villager cannot open a fence gate." Players already use fence gates as the barrier a resident respects and doors as the way into a building. Reeve now follows the same convention.

**Productive work on by default, fenced by what a player built.** Farming needs a wheat farm to find. Terrace farming needs actual planting beds, and open ground fails that test by design, so he can't wander off and farm the wild forest. Fishing needs a rod, which he never crafts for himself. So the player's build is the opt-in, and on an untouched map those branches stay quiet. Lighting stays off, because dark ground exists near spawn on every new world, and he'd start placing torches on land nobody asked him to light.

**Delete gates that only said no.** `CAN_USE_FIXTURES` turned out to do exactly one thing. When a player said "ring the bell", it told them fixtures were disabled. The setting is gone. Now a fixture is used when a player asks, and the bot can't use one on its own initiative at all. A test pins the allowlist to exactly bells and signs, and its failure message lists the blocks that must never be added, like redstone and explosives.

**Fishing isn't animal handling.** Fishing used to sit behind the same switch as shearing sheep. I pointed out:

> fishing isn't and shouldn't be in the same group of interaction activities as sheep and cows

That grouping had side effects nobody chose. Turning off creature interaction also stopped the hunger fallback, so the bot couldn't feed himself. Fishing now has its own gate and its own "stop fishing" command.

**Fewer knobs, sorted.** Five radius settings that never authorized anything became one constant, 64. The remaining 129 keys are now classified: 6 required, 62 policy, 61 tuning. A test fails if a key has no class. `.env.example` now opens with just the 6 settings a new person actually needs to fill in. And one `LLM_PROVIDER` can now serve all [three model tiers](/#/blog/three-llm-tiers-for-a-minecraft-bot) from earlier this month, since asking a new player to pick three providers was a lot.

## Final thoughts

- **Fail-closed is a security posture, not a first-run experience.** Those can be different things.
- **Gate the risk, not the action.** Putting a stick in a chest of sticks isn't risky. Sleeping through a wall is.
- **A gate that only refuses players isn't protecting anything.** Read what a setting actually does before keeping it.
- **Let the build be the permission.** A farm the player built is a clearer opt-in than a flag in `.env`.
- **Use the game's own conventions.** Villagers don't open fence gates, copper golems sort by what's already in the chest, and players already understand both.

Reeve now puts his sticks away and opens his own front door. He still can't make his own pickaxe without being asked.
