---
title: "Seed Sifting: Stop Guessing Your Cubiomes Thresholds"
date: 2026-06-27
author: jabez007
tags:
  - minecraft
  - cubiomes
  - worldgen
  - python
  - automation
excerpt: |
  I wanted a Minecraft seed with an island home base, warm water at spawn, and a Pale Garden somewhere across the sea.
  Cubiomes Viewer can search for that, but only if you feed it the right climate numbers. My first numbers were guesses.
  The second set came from "research" and was worse. The third set came from the source code.
featured: false
draft: true
---

# Seed Sifting: Stop Guessing Your Cubiomes Thresholds

_Or: How I picked a Pale Garden threshold three times and the middle answer was the worst_

Every time I start a new survival world I spend way too long rolling seeds. This time I wanted to do it properly.

The world I'm after is specific. I want a home island in a broad, navigable sea, with warm water near spawn and enough flat ground to build on. Across the water there should be strong climate contrasts worth sailing to: swamps, savanna, badlands, a mushroom island, and ideally a Pale Garden. Not a lone rock in an empty ocean. A home base plus expeditions.

[Cubiomes Viewer](https://github.com/Cubitect/cubiomes-viewer) can search for most of that. You stack up conditions and it grinds through seeds until something passes all of them. The catch is that many of the useful conditions aren't "find biome X". They're climate parameter boxes, things like "somewhere in this area, temperature is above N and humidity is below M". Minecraft decides biomes from a handful of these noise values, so a climate box is a cheap way to say "this kind of place probably exists here" before paying for an exact biome check.

Cheap filters are only useful if the numbers mean something. Mine didn't, at first.

## A session file under version control

I keep this in a small repo called `seed-sifter`. It isn't an app. It holds one saved Cubiomes Viewer session, notes on worldgen, and a Python script that regenerates the session.

The session format stores each condition as a binary `#Cond` record, so the script uses `ctypes` to decode and rewrite those records directly. That means every threshold lives in readable Python, and I can diff a tuning change like any other code change:

```bash
python3 searches/scripts/update_starter_session.py
```

Then I load `searches/viewer-search.session` in the viewer and let it run.

## "Warm sea" kept finding cold sea

After a few test searches, too many results had plain `ocean` or `deep_ocean` at spawn instead of lukewarm or warm ocean.

The `Warm sea` condition checked for warm, oceanic climate within 256 blocks of spawn. That's a big box. A warm patch on the far edge could satisfy it while the water you actually spawn next to was neutral. So I tightened it by feel:

| Setting | Before | After |
| :--- | :--- | :--- |
| Window around spawn | `-256..256` | `-192..192` |
| Temperature floor | `>= 1000` | `>= 1500` |
| Continentalness cap | `<= -1800` | `<= -1800` |

That helped some. It also made clear that a climate box is an existence check. "This kind of climate exists somewhere in this square" isn't the same as "spawn is in a warm ocean". For a hard guarantee you need an actual biome sample. The climate gate just improves the odds cheaply.

Hold on to that `1500`. It comes back.

## The Pale Garden, three times

Next I wanted a condition that raised the odds of a Pale Garden. The history of that threshold is the reason this post exists.

### Attempt one: vibes

The first version came from reasoning about the other conditions already in my stack. `Coastal` used continentalness `<= -1100`, and another condition treated `>= -500` as loosely inland. So "clearly inland" became `continentalness >= 1800`. `Open terrain` kept weirdness between `-2000` and `2000`, so "unusual terrain" became `weirdness >= 2500`.

That's internally consistent and completely made up. When I asked where those values came from, the honest answer was "a deliberate heuristic, not a sourced formula". Fair enough. I asked for one.

### Attempt two: research, which was worse

So I went looking for real numbers online. The best lead was Minecraft's own `VanillaBiomeParameters` in the Yarn mappings, which defines named weirdness band cutoffs:

```text
MAX_HIGH_WEIRDNESS        = 0.5666667
MAX_PEAK_WEIRDNESS        = 0.7666667
MAX_SECOND_HIGH_WEIRDNESS = 0.9333333
```

If Cubiomes scales noise to `[-10000, 10000]`, those map to about `5667`, `7667`, and `9333`. The recommendation became "your 2500 is probably too low, try 5667".

That sounded rigorous. It had real constants and a link. It also rested on an assumption about the scale that nobody had checked, and it would have more than doubled my weirdness threshold.

### Attempt three: read the source

The next step was checking the Cubiomes and Cubiomes Viewer source on GitHub for the scale they actually use. That settled it.

The viewer doesn't invent its own range. It asks Cubiomes for integer limits through `getBiomeParaExtremes()` and `getBiomeParaLimits()`. In Cubiomes, the sampled climate values really are multiplied by 10000:

```c
int64_t id = (int64_t) (10000.0 * sampleClimatePara(bn, np, x, z));
```

But the valid ranges aren't a uniform `±10000`. For the commit the viewer was built against, `getBiomeParaExtremes()` returns:

| Parameter | Range |
| :--- | :--- |
| temperature | `-4501 .. 5500` |
| humidity | `-3500 .. 6999` |
| continentalness | `-10500 .. 300` |
| erosion | `-7799 .. 5500` |
| depth | `1000 .. 10500` |
| weirdness | `-9333 .. 9333` |

The real find was that Cubiomes already has a parameter row for Pale Garden on 1.21.4 and later:

| Parameter | Pale Garden |
| :--- | :--- |
| temperature | `-1500 .. 2000` |
| humidity | `>= 3000` |
| continentalness | `>= 300` |
| erosion | `-7799 .. 500` |
| weirdness | `>= 2666` |

So the scorecard for weirdness reads: guess `2500`, research `5667`, actual `2666`. My lazy guess was almost right by accident, and the researched number would have filtered out a big chunk of valid Pale Garden terrain. On continentalness the guess was way off, `1800` where `300` is enough. I'd been demanding deep inland when Pale Gardens only need to be off the coast.

> Narrator: _The footnoted answer was the wrong one. The footnotes were very nice, though._

## Using the real table everywhere else

Once you have the per-biome rows from Cubiomes' `finders.c`, every other climate box in the stack can be checked against them instead of against intuition. That turned up more than I expected.

**Hot and wet.** I wanted swamp, mangrove swamp, sparse jungle, or bamboo jungle, leaning toward swamp. The Cubiomes rows show what makes swamps different. They need very high erosion, `>= 5500`, and continentalness `>= -1100`, while the jungle variants care mostly about temperature and humidity. One box can't capture "these four and nothing else", but it can lean the right way:

```text
1000 <= temperature <= 5500
humidity >= 1000
continentalness >= -1100
erosion >= 5500
```

**Hot and dry.** The old box was `temperature >= 1000` and humidity between `-2500` and `-500`, which let in plenty of plain desert-adjacent terrain. Savanna wants `temperature >= 2000` and `humidity <= -1000`. Savanna plateau and the badlands share low erosion, `<= 500`, while desert has much looser bounds. Adding the erosion cap is what pushes the box toward savanna and badlands and away from desert:

```text
temperature >= 2000
humidity <= -1000
erosion <= 500
```

**Pale Garden, again.** I'd also added a Cherry Grove condition, and the first Pale Garden box, only continentalness and weirdness, matched Cherry Grove terrain just as well. Both are inland and weird. The difference is the climate. Cherry Grove is cold and dry, and Pale Garden is cool and wet. Using the full Pale Garden row, temperature, humidity and erosion included, pulled them apart.

**A condition that stopped pulling its weight.** `Relief diversity` asked for "some rugged inland terrain somewhere". Cherry Grove and Pale Garden both already require inland, low-erosion terrain, plus a lot more. It wasn't completely redundant, but it was close enough that I dropped it.

**The warm sea, again.** Here's where that `1500` came back. Cubiomes' ocean rows put plain `ocean` and `deep_ocean` at temperatures up to `2000`. Lukewarm starts at `2001`. So my hand-tuned `>= 1500` still let neutral ocean through, which is exactly the problem I'd been trying to fix. The ocean biomes also stop at continentalness `-1900`, not `-1800`. The source-backed version is:

```text
temperature >= 2001
continentalness <= -1900
```

My tweak by feel had moved in the right direction and stopped short of the line that actually mattered.

## A biome Cubiomes doesn't know yet

Then came a newer biome, the dappled forest, that Cubiomes doesn't have a row for yet. All I had was the description: cold regions, very little humidity, high weirdness, borders plains, sunflower plains and cherry groves but never other woodland, and shows up near cold oceans as well as in the mountains.

After all that, I was back to estimating. The difference is that this time the estimate was built from the neighboring rows. Humidity `<= -1000` keeps it away from every other forest, since regular forest starts at `-1000` and birch and dark forest are wetter still. Weirdness `>= 2666` lines it up with the Cherry Grove. Temperature tops out at `2000`, and there's no erosion limit, since it can generate on any terrain. It's in the reference table marked as an estimate, so I won't forget which row I made up.

## The order of the stack matters

The last thing I learned is that Cubiomes Viewer runs a search in two passes. A fast pass works on just the lower 48 bits of the seed, which is enough for some checks. A full 64-bit pass evaluates whatever survives. Root-level conditions are evaluated in order, and the first one that fails stops the rest.

My big regional climate checks were all positioned relative to the `Spawn` condition. Spawn can only be computed in the full pass, and in the viewer's search code, anything that hangs off spawn waits for it. So I was paying for spawn resolution before even asking whether the region had a swamp.

Now the regional climates are root-level, covering the center of the world from `-2048` to `2048`, and they come before `Spawn anchor`. So do the central sea coverage check and the mushroom island. Only the checks that really are about spawn, coastal, warm sea and open terrain, still hang off it. I haven't benchmarked the before and after, but the tree now rejects seeds on the cheaper questions first.

## Decode what you wrote

At one point I asked for the hot/wet temperature floor to drop from `1500` to `1000`. The README got updated. The generator script didn't. The only reason I know is that the regenerated session got decoded back to check, and the binary still said `1500..5500`.

If your config lives in a binary format, read it back after every change. A doc that agrees with you proves nothing.

## Final thoughts

- **Confident numbers aren't the same as sourced numbers.** My guess was confident. The research was confident and footnoted. Only the source code was correct.
- **Check the scale before you convert.** `0.5666667` only becomes `5667` if the multiplier really is 10000 everywhere.
- **Tuning by feel moves you in the right direction and stops short.** `1500` was warmer than `1000` and still wasn't lukewarm.
- **When you have to estimate, build it from the nearest real data and label it.**
- **Put cheap, independent checks first.** Don't make every condition wait on the most expensive one.

If you're tuning Cubiomes conditions, skip the forum posts and the scale assumptions. The biome parameter tables are in `finders.c`. Read them, put the numbers in a script, and make the script prove what it wrote.

Now I just need the search to finish, so I can find out the island I want doesn't exist.
