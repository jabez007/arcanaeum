---
title: "My Minecraft Bot vs. One Wooden Door"
date: 2026-06-14
author: jabez007
tags:
  - minecraft
  - mineflayer
  - pathfinding
  - llm
  - ai-agents
  - troubleshooting
  - typescript
excerpt: |
  I'm building an LLM-powered companion that lives in my Minecraft world. Before it can hold a conversation,
  it has to get from the house to the wheat farm. That meant a weekend spent losing to a single oak door.
featured: false
draft: true
---

# My Minecraft Bot vs. One Wooden Door

_Or: Why the LLM part of an LLM companion is the easy part_

My summer project has a name now. Reeve is a [Mineflayer](https://github.com/PrismarineJS/mineflayer) bot that lives in my survival world. The long-term goal is a companion that a large language model drives: something you can talk to, hand a chore to, and mostly forget about. The question I keep writing at the top of my design docs is:

> Can a player include Reeve in an ordinary Minecraft session without taking on a second job managing him?

The trap with a project like this is starting with the model. You wire up an API key, the bot says something clever in chat, and it feels like magic. Then you ask it to go harvest wheat and it stands in the hallway for ten minutes.

So before any LLM gets near the steering wheel, Reeve needs a body that works. He has to eat and sleep, work the farm, put things away, and walk around my base without help.

This week, "walk around my base" came down to one oak door.

## The symptom: "no path" in two seconds

My wheat farm sits right outside the house. There is a door that opens straight onto the field. I asked the bot to go to the farm, and both `go_to_location` and the harvest skill came back with "no path".

Not a timeout, not "stuck". They gave up in about two seconds. So I logged in to look. Reeve was standing right in front of the door. The crafting table and the barrels on the other side were practically a straight line away.

He just needed to open the door, walk through, and close it behind him. Any five-year-old can do that.

## Root cause: pathfinder thinks doors are walls

Mineflayer leans on [mineflayer-pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder) for movement. Version 2.4.5 can't route through a closed wooden door, and it fails for two separate reasons.

**Reason one.** Pathfinder builds its set of "openable" blocks by filtering block names for the string `gate`:

```js
// mineflayer-pathfinder 2.4.5, lib/movements.js
registry.blocksArray.forEach(block => {
  if (this.interactableBlocks.has(block.name) &&
      block.name.toLowerCase().includes('gate') &&
      !block.name.toLowerCase().includes('iron')) {
    this.openable.add(block.id)
  }
})
```

Fence gates make the list. `oak_door` doesn't contain the word "gate", so it never makes the list, and the lower half of every door gets treated as a solid wall the bot isn't allowed to dig through.

**Reason two.** Even after you fix the lower half, the forward-move check runs the head-level block through a "safe or breakable" test. That test knows nothing about doors. A closed door's upper half has a full block bounding box, so it reads as an unbreakable wall, and the move gets rejected before pathfinder ever looks at whether it could be opened.

Two bugs, same symptom: any route through a closed door returns "no path", and the code that knows how to open doors never runs.

## Fix one, and the overcorrection

The repair wraps pathfinder's `getBlock` so door halves come back marked `safe`:

```ts
export function markDoorHalfPassable<T extends { type: number; safe?: boolean } | null>(
  block: T,
  doorIds: ReadonlySet<number>
): T {
  if (block && doorIds.has(block.type)) {
    block.safe = true;
  }
  return block;
}

const doorIds = handOpenableDoorIds(bot.registry.blocksArray, config);
const baseGetBlock = movements.getBlock.bind(movements);
movements.getBlock = (pos, dx, dy, dz) =>
  markDoorHalfPassable(baseGetBlock(pos, dx, dy, dz), doorIds);
```

Iron doors stay out of `doorIds`, since they need redstone and the bot can't open them by hand.

My first version also marked the door halves as non-physical. That felt thorough. Instead the bot walked up to the door, opened it, and froze solid on the threshold. Pathfinder now believed the doorway was empty air, so as far as it was concerned the bot had already arrived. Zero displacement until timeout.

Marking the door `safe` and leaving it physical was the right amount of lying. Pathfinder plans a route up to the door, the door stays an obstacle, and something has to open it.

## Fix two: who opens the door?

That "something" turned into its own small saga.

At first I let pathfinder open doors itself. It worked often enough to be misleading. Native traversal through my particular door kept exploring alternate routes instead of committing. So I wrote an explicit door crossing in a `Navigator` service: walk to the door, open it, step through, close it.

That version had bugs of its own.

- **The bot standing on the door.** The crossing direction came from the vector between the bot and the door. When Reeve parked right on the threshold, which is exactly where he ended up coming back from the field, that vector was zero and the door got skipped. He just stood there. The fix was to use the direction toward the *goal*, not toward the door.
- **The pogo stick.** To get through, I held forward and jump for four seconds. On flat ground that made the bot bounce in place between y=63 and y=64 without going anywhere.
- **Two hands on one door.** Pathfinder still had doors in its openable set, so its own "use block" step could toggle a door the Navigator had just opened. Occasionally they raced and shut the door mid-crossing.

The version that stuck makes the Navigator the only thing that opens doors. Pathfinder gets `canOpenDoors = false` but keeps the `safe` patch, so it can still *plan* through a door and walk the bot up to it. Once the door is open, a short pathfinder hop to the tile just past it crosses the doorway. An open door is passable, so pathfinder centers the bot and climbs the lip cleanly.

I tested it with a round trip between a field tile and a barrel in the base, forcing a crossing each way. Three runs and six crossings all came back clean, opening and closing in both directions.

## Close the door behind you (but only yours)

Reeve now closes a door once he's actually through. He only does this for doors he opened. If I left a door open on purpose, it stays open.

That fix came out of a nighttime test. When I logged in, Reeve had tried to go to bed, made it partway up the slab staircase, and left the farm door hanging open behind him. The sleep skill was calling raw `pathfinder.goto`, which stalled on the stairs and never reached the "close what you opened" step. Routing sleep through the same door-aware traversal fixed both problems.

## The goal you can't stand on

One more quirk from the same weekend. "Go to the farm" targeted the farm's center block, which is water with crops around it. There was no standable tile within range 1 of that point, so `GoalNear` could never be satisfied, and the bot circled the edge of the field until it timed out.

`GoalNear` now snaps to the nearest standable tile, within two blocks horizontally and one vertically, when the target itself isn't standable. If the target already has floor next to it, like a barrel, a bed, or a player, the goal is left alone.

## Side quest: the bread incident

While I was fighting the door, Reeve found a way to waste food.

He was depositing surplus bread into a barrel near the farm. That barrel sits on top of a hopper, and the hopper empties into a composter. Every loaf he "stored" got pulled down and composted.

The old heuristic flagged a container as a composter feeder only if a composter was within four blocks or a hopper within two. Mine was a straight vertical chain, barrel to hopper to composter, and it didn't trip either check. The resolver also allowed a flagged container if it "already stored the item". A feeder barrel holds the item briefly before the hopper takes it, so Reeve kept topping it up.

The fix stopped guessing from distance. It follows the hopper chain under a container, respecting each hopper's facing, and checks whether it ends in a composter. If it does, the bot never deposits there.

## Final thoughts

None of this involved a language model. Each problem was the bot's body failing at something a player does without thinking: walk through a door, close it, stand next to a field, put bread somewhere safe.

That's the lesson I'm taking into the rest of the summer. A model can decide that Reeve should go harvest wheat. It can't make him get through the door. If the body can't do the basic stuff on its own, the LLM ends up as a very expensive way to watch a bot stand in a hallway.

Next up is the slab staircase down to my smelting area. He doesn't believe it's a staircase yet.
