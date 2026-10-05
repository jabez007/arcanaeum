---
title: "Who Gets the Good Model? Splitting My Minecraft Bot Across Three LLM Tiers"
date: 2026-09-12
author: jabez007
tags:
  - minecraft
  - mineflayer
  - llm
  - ai-agents
  - openrouter
  - troubleshooting
excerpt: |
  My Minecraft bot was quietly spending my Codex subscription, so I moved it to OpenRouter's free router
  and z.ai. The free router sent a planning prompt to a content-safety model, the free tier ran out after
  50 requests, and z.ai said I had no balance when I did. The bot now picks a model based on who's talking.
featured: false
draft: true
---

# Who Gets the Good Model? Splitting My Minecraft Bot Across Three LLM Tiers

_Or: The free router sent my planning prompt to a content-safety model_

When I [gave Reeve a brain](/#/blog/llm-companion-who-is-driving), it ran on my ChatGPT subscription through Codex OAuth. That was the easy option, since I was already logged in. It also meant every chat reply, every player command, and every autonomous "what should I do next?" came out of the same subscription I use for actual coding. Reeve asks himself that question every 90 seconds.

I had credit on OpenRouter and a z.ai coding plan I was already paying for. Moving Reeve onto those sounded like an afternoon of work. It took most of a week.

## One adapter, two providers

Both OpenRouter and z.ai speak the OpenAI chat completions format, so the bot got one OpenAI-compatible planner and two thin wrappers on top of it.

For OpenRouter I used `openrouter/free`, the router that sends each request to whichever free model is available. Free model IDs come and go all the time, but the router's ID stays put, which made it a sane default. z.ai has no default at all. You have to name a GLM model or the bot refuses to boot.

Every turn also logs which model actually answered. With a router picking for you, "the LLM said something weird" isn't useful. "`minimax-m2.7` said something weird" is.

## The free router has opinions

The very first test run showed why that log line mattered. Reeve's planning prompt says, roughly, "here's the scene and the list of skills, pick one and answer in JSON." One of those requests went to `nvidia/nemotron-3.5-content-safety:free`, which replied:

```text
User Safety: safe
```

Which is true. It isn't a plan.

> Narrator: _Reeve's request was, in fairness, very safe._

Another request landed on a model that sent back an empty reply. Out of 8 test requests, 6 were usable.

OpenRouter's router docs say it filters for models that support the features your request asks for. So the fix was to ask. With `response_format` set to JSON mode, the router only picks models that can produce JSON, and a safety classifier can't. JSON mode is on for OpenRouter and stays off by default in the shared adapter, because not every provider handles it the same way.

The second fix was a bounded retry for replies that come back fine over HTTP but are empty or aren't a valid plan. Real errors still fail straight away. The test run went to 10 of 10.

## Asking for reasoning changes who answers

Reeve already had an `LLM_REASONING_EFFORT` setting, and OpenRouter accepts a `reasoning: {effort}` field. I wondered whether sending it would steer the router toward reasoning models.

It did. Without it, ten requests drew six different models. With `effort: "high"`, the same test only ever drew two, both MiniMax. They were faster too, about 2.7 seconds a turn against 4.6.

That looked like a free upgrade. It wasn't, but I didn't find that out until the next problem.

## Free means 50

Soon after switching Reeve over, every turn was failing:

```text
Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day
```

The response header said `X-RateLimit-Limit: 50`. That's 50 requests a day. My coding agent had spent about 75 requests on smoke tests that afternoon, so the day's quota was gone before Reeve made his first real call.

While I was reading back the logs, a second problem turned up underneath the first. I'd been counting turns that logged a model name as successes. But the bot logs the model *before* it parses the reply, on purpose, so even a broken reply names its model. So the log line showed up for failures too. Once I counted properly, the real number of successful turns on OpenRouter so far was zero.

Two of those failures said `no message content`, from `minimax-m3`, one of the two reasoning models. Autonomy turns cap the output at 1,024 tokens, which is plenty for a small JSON answer. But on OpenRouter, `max_tokens` covers the reasoning *and* the answer, and their docs say high effort spends around 80% of the budget on reasoning. The model was thinking for ~820 tokens and then had nothing left to answer with.

The fix scales the budget with the effort level, 5× for high, 2× for medium, 1.25× for low, so the answer gets the space it was sized for on top of the thinking. After that, `minimax-m3` started returning real turns, and `no message content` didn't show up again.

## Doing the math on 50

I still had 50 requests a day. My first idea was to back the planner off from every 90 seconds to every 5 minutes. The math says that doesn't help much.

| Spacing | Attempts a day | Hits 50 after |
| :--- | ---: | :--- |
| 90 seconds | 960 | about 75 minutes |
| 5 minutes | 288 | about 4 hours |
| 30 minutes | 48 | fits |

There was also a ceiling I'd forgotten about. `LLM_AUTONOMY_MAX_CALLS_PER_HOUR` defaults to 12, which is 288 a day no matter what the spacing says. And nothing reserved any of the quota for players. Reeve could spend the whole day's budget talking to himself, and when I finally said hello, he'd answer with a canned line. For a companion that's exactly backwards.

The rest of that afternoon, 3 turns in 10 got through.

The 50 is documented, at least. OpenRouter's limits page gives 50 free-model requests a day to accounts that have never bought credits, and 1,000 a day, at 20 a minute, to accounts that have bought $10 or more at some point. It's a one-time purchase, and the credits don't even have to be spent. Two days later I bought the $10, and the account's `is_free_tier` flag flipped to `false`.

## Who gets the good model?

With the quota sorted, the question I actually cared about was which model should do which job. I'm paying for z.ai's GLM models, and they're better than whatever the free router draws. Where should they go?

Conversation is what you hear, so a dumb reply is the thing a player notices. Autonomy runs with nobody watching, so a bad plan there plays out in the world before anyone can correct it. My instinct was that the paid model belonged on autonomy.

The free router had already shown it could do conversation. The lines it wrote during testing sounded like Reeve, "keeping an eye on the place while it's quiet," "just scouting the plains around the bailiwick," even when the model behind each line was different. We had no such evidence for autonomy.

Then I noticed that "conversation" was hiding two very different things. A random player saying hi and an allowlisted player telling Reeve to go chop a tree both count as conversation, and those shouldn't get the same model.

You can't tell an instruction from small talk until a model has read it. But you can route on *who's talking*, and the bot knows that before it calls anything.

Reeve already had a `speakOnly` flag, set for players who aren't on the allowlist and for his own unprompted remarks, like the snarky commentary when he dies. A speak-only turn has every action stripped out before it returns, so it can't move him no matter what the model says. So the routing became:

- speak-only turns go to the chat tier, and the reply can only talk
- an allowlisted player goes to the command tier
- Reeve deciding things on his own goes to the autonomy tier

No classifier and no guessing. A random player can't talk their way onto the paid model.

That left which GLM model goes where, and here risk and difficulty pull in different directions. Autonomy is the riskier turn, but it's the easier task. Its prompt has 11 rules, and the answer is one skill or nothing. A command turn has 33 rules and five optional kinds of output, and it has to turn whatever a player typed into the right skill with the right arguments. The confirmation gate catches a *dangerous* plan, but not a *misunderstood* one, and misunderstanding is what a weaker model does with a hard instruction.

So the full model went on commands, and the flash model went on autonomy:

| Tier | Who it's for | Model |
| :--- | :--- | :--- |
| Chat | Anyone on the server making small talk | OpenRouter free router |
| Command | Allowlisted players | z.ai `glm-5.3` |
| Autonomy | Reeve, on his own | z.ai `glm-5.3-flash` |

```bash
LLM_CHAT_PROVIDER=openrouter
LLM_COMMAND_PROVIDER=zai
LLM_COMMAND_MODEL=glm-5.3
LLM_AUTONOMY_PROVIDER=zai
LLM_AUTONOMY_MODEL=glm-5.3-flash
LLM_FALLBACK_PROVIDER=stub
```

There's one cost to routing on who instead of what. When I say "nice sunset" to Reeve, that goes to the expensive tier too, because nobody knows it isn't an instruction until the model answers. I can live with that.

## "Insufficient balance"

The day after the split went in, z.ai started returning 429s with code 1113:

```text
Insufficient balance or no resource package
```

That read like my account was out of credit. I knew it wasn't, because one of my Hermes Agent profiles was answering on the same z.ai subscription at that very moment. Same account, different API key, working fine.

The problem was the endpoint. z.ai serves the coding plan from its own base URL, `/api/coding/paas/v4`, not the standard `/api/paas/v4`. The standard endpoint bills pay-as-you-go balance, and as far as it was concerned I didn't have any. The adapter even had a comment saying the base URL could be overridden. Nothing in the config passed one through. Now `ZAI_BASE_URL` does.

## The fallback that hid it

The worst part wasn't the wrong URL. It was that the bot kept working, sort of. A failed turn fell through to the stub provider, which answered with a canned line about nothing urgent being nearby, and sent Reeve back on patrol.

From inside the game, that looks like a companion with nothing to do. It was really a companion with no brain attached. That needs to be loud, so next on the list is a warning when a tier falls back to the stub, and a status that says "degraded" instead of "idle".

## One reasoning effort doesn't fit three tiers

With the endpoint fixed, autonomy was still struggling. At high effort, `glm-5.3-flash` spent its whole output budget thinking on 2 of 3 turns and returned nothing. The one turn that worked took 27,978 ms against a 30-second timeout. It was the same `max_tokens` lesson as before, on a different provider.

Turning the effort down didn't help, because z.ai ignores the `reasoning: {effort}` field that OpenRouter uses. Measuring how much reasoning text came back each way made that obvious:

| Request | Reasoning returned |
| :--- | ---: |
| Default | 270 characters |
| `reasoning: {effort: "low"}` | 250 characters |
| `thinking: {type: "disabled"}` | 26 characters |

z.ai honors its own switch and quietly ignores OpenRouter's. So each provider now has a reasoning dialect that translates an effort level into that provider's request format, and each tier gets its own setting:

```bash
LLM_CHAT_REASONING_EFFORT=
LLM_COMMAND_REASONING_EFFORT=high
LLM_AUTONOMY_REASONING_EFFORT=medium
```

## Final thoughts

- **"Free" has a daily number.** Read the rate limit docs before pointing a bot at a free tier. Then count your own smoke tests against it.
- **A router picks for you, so tell it what you need.** If you need JSON, ask for JSON, or you might get a safety classifier.
- **Reasoning tokens come out of the answer's budget.** If you turn reasoning up, turn `max_tokens` up with it.
- **Route on who, not what.** The speaker's permissions are a fact. Their intent is a guess.
- **Risk and difficulty are different questions.** The riskiest turn isn't always the one that needs the smartest model.
- **When the error says you're broke and another app on the same account works, believe the other app.** The bug is usually the endpoint, not the balance.

Reeve now has three brains, one for each kind of conversation. I'm sure that will be very simple for a new player to configure.
