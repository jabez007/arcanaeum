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
  and z.ai. The free router sent my planning prompt to a content-safety model, the free tier ran out after
  50 requests, and z.ai said I had no balance when I did. The bot now picks a model based on who's talking.
featured: false
draft: true
---

# Who Gets the Good Model? Splitting My Minecraft Bot Across Three LLM Tiers

_Or: The free router sent my planning prompt to a content-safety model_

When I [gave Reeve a brain](/#/blog/llm-companion-who-is-driving), it ran on my ChatGPT subscription through Codex OAuth. That was convenient. It also meant every chat message, every player command, and every autonomous "what should I do next?" came out of the same subscription I use for actual coding.

So this week I asked Claude:

> it has probably been using some of my OpenAI Codex subscription... I do have tokens now for OpenRouter and z.ai... Could we implement those for the bot so it stops chewing away at my Codex sub?

## One adapter, two providers

Both OpenRouter and z.ai speak the OpenAI chat completions format, so Claude wrote one OpenAI-compatible planner and two thin wrappers on top of it, one per provider. For OpenRouter I picked `openrouter/free`, the router that sends each request to whichever free model is available.

Free sounded great. The router turned out to be a little *too* flexible.

## The free router has opinions

Claude logged which model actually served each request. One of my planning prompts, the one that asks "here's the scene and the available Skills, pick one and answer in JSON", went to `nvidia/nemotron-3.5-content-safety:free`. It replied:

```text
User Safety: safe
```

Which is true, but it isn't a plan.

> Narrator: _Reeve's request was, in fairness, very safe._

Another request landed on a model that returned an empty reply. Out of 8 test requests, 6 came back usable.

Two changes fixed most of that:

- **Ask for the features you need.** OpenRouter's router filters models by what the request requires. Turning on `response_format` JSON mode in the request meant the router only picked models that support it, which ruled out the safety classifier.
- **Retry the useless replies, and only those.** A bounded retry runs when the HTTP call succeeds but the reply is empty or not a valid plan. Real errors still fail straight away. That got the test run to 10 of 10.

Adding a `reasoning: {effort}` field also steered the router toward reasoning models. It ended up on two MiniMax models and answered faster, about 2.7 seconds against 4.6.

## Free means 50

Then everything started failing with a 429:

```text
Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day
```

The response headers said `X-RateLimit-Limit: 50`. OpenRouter's free models are limited to 50 requests a day for accounts that have never bought credits. Claude had used about 75 requests on smoke tests that day, so it was already well past the limit.

For a bot, 50 a day is nothing. At one autonomous turn every 90 seconds, Reeve would want roughly 960 a day, before anybody talks to him.

The documented fix is cheap. Once an account has bought at least $10 of credit, ever, the free-model limit goes up to 1,000 requests a day at 20 a minute. It's a one-time purchase, not a subscription. I bought the $10, and the account's `is_free_tier` flag flipped to `false`.

## Three tiers, not one

While we were in there, I asked about splitting it up:

> So the LLM_PROVIDER could be more accurately renamed to LLM_CHAT_PROVIDER?... a thrid level... OpenRouter's free router so the bot could chat with anyone... ZAI's GML-5.3-flash for quick but powerful autonomy... GLM-5.3 for allow-listed player instructions.

Different jobs deserve different models:

| Tier | Who it's for | Model |
| :--- | :--- | :--- |
| Chat | Anyone on the server making small talk | OpenRouter free router |
| Command | Allowlisted players giving instructions | z.ai `glm-5.3` |
| Autonomy | Reeve deciding what to do on his own | z.ai `glm-5.3-flash` |

The question was how the bot decides which tier a message belongs to. Claude's first answer was that it couldn't split chat from instructions up front, because telling them apart is the planner's whole job. That's true if you route on *intent*. But my grouping wasn't really about intent. It was about **who is speaking**, and the bot already knows that before it calls any model.

The runtime already had a `speakOnly` flag. It's set for players who aren't on the allowlist, and for the bot's own unprompted remarks, like commentary when it dies. A speak-only turn has every action stripped out before it returns, so it can't move the bot no matter what the model says. Claude pointed out that this was the same line I had drawn, and corrected its own earlier note. So the routing is:

- speak-only: chat tier, and the reply can only talk
- an allowlisted player giving an instruction: command tier
- the bot deciding on its own: autonomy tier

No classifier, no guessing, and a random player can't talk their way onto the expensive model.

The config ended up as one provider per tier, an optional model per tier, and a fallback:

```bash
LLM_CHAT_PROVIDER=openrouter
LLM_COMMAND_PROVIDER=zai
LLM_COMMAND_MODEL=glm-5.3
LLM_AUTONOMY_PROVIDER=zai
LLM_AUTONOMY_MODEL=glm-5.3-flash
LLM_FALLBACK_PROVIDER=stub
```

Codex OAuth can still serve a tier, but if it's set on two tiers with two different models, the bot refuses to boot. One cached login, one model.

## "Insufficient balance"

The next day, z.ai started returning 429s too, this time with code 1113:

```text
Insufficient balance or no resource package
```

Claude took that at face value and told me the account was out of credit. I didn't believe it:

> I have one of my Hermes Agent profiles using my ZAI subscription... responding right now. So you've probably implemented something incorrectly

The real cause was the endpoint. z.ai serves its coding-plan subscription from a different base URL, `/api/coding/paas/v4`, not the standard `/api/paas/v4`. The standard endpoint bills pay-as-you-go balance, and as far as it was concerned I didn't have any. The adapter even had a comment saying the base URL could be overridden. Nothing in the config actually passed one through. Now `ZAI_BASE_URL` does.

## The fallback that hid it

The worst part wasn't the wrong URL. It was that the bot kept working, sort of. A failed turn fell through to the stub provider, which answered with a canned line about nothing urgent being nearby and keeping an eye on the base, and sent Reeve back on patrol.

From inside the game, that looks like a companion with nothing to do. It was really a companion with no brain attached. That needs to be loud, so the next item on the list is a warning the first time a tier falls back to the stub, and a status that says "degraded" instead of "idle".

## One reasoning effort doesn't fit three tiers

With the endpoint fixed, the autonomy tier was still struggling. I asked:

> we probably need distinct reasoning efforts for each of thhe three LLM tiers

At high effort, `glm-5.3-flash` spent its whole output budget thinking on 2 of 3 turns and returned no content at all. The one turn that worked took 27,978 ms against a 30-second timeout. The empty turns ended the same way the z.ai outage did, with the stub's canned line.

Turning the effort down didn't help either, because z.ai ignores the `reasoning: {effort}` field that OpenRouter uses. Claude measured how much reasoning text came back each way:

| Request | Reasoning returned |
| :--- | :--- |
| Default | 270 characters |
| `reasoning: {effort: "low"}` | 250 characters, so ignored |
| `thinking: {type: "disabled"}` | 26 characters |

z.ai honors its own switch, not OpenRouter's. So each provider now has a reasoning dialect that says how to translate an effort level into that provider's request format, and each tier has its own setting:

```bash
LLM_CHAT_REASONING_EFFORT=
LLM_COMMAND_REASONING_EFFORT=
LLM_AUTONOMY_REASONING_EFFORT=
```

I ended up with high for commands and medium for autonomy.

## Final thoughts

- **"Free" has a daily number.** Read the rate limit docs before you point a bot at a free tier. Then budget for your own smoke tests too.
- **A router picks for you, so tell it what you need.** If you need JSON, ask for JSON, or you might get a safety classifier.
- **When the error says you're broke and another app on the same account works, believe the other app.** The bug is usually the endpoint, not the balance.
- **Route on who, not what.** The speaker's permissions are a fact. Their intent is a guess.
- **A fallback should never look like normal.** A quiet stub can hide an outage for hours.

Reeve now has three brains, one for each kind of conversation. I'm sure that will be very simple for a new player to configure.
