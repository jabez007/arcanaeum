const e="2026-07-25-llm-companion-who-is-driving",t="llm-companion-who-is-driving",o={title:"Who's Driving? Giving an LLM a Minecraft Body Without the Steering Wheel",date:"2026-07-25",author:"jabez007",tags:["minecraft","mineflayer","llm","ai-agents","software-architecture","typescript"],excerpt:`Right before the first real live run of my Minecraft companion bot, I asked a simple question:
what does the LLM actually do while the bot is patrolling? The answer was "nothing". Here is how
I gave the model some initiative without letting it spam tokens or overrule a player.
`,featured:!1,draft:!1},a=9,n=`<h1>Who’s Driving? Giving an LLM a Minecraft Body Without the Steering Wheel</h1>
<p><em>Or: My LLM companion had a brain, and nothing ever called it</em></p>
<p>Last month <a href="/#/blog/minecraft-bot-vs-wooden-door">Reeve couldn’t get through a door</a>. A few weeks of fixes later he can handle doors, slab staircases, the farm, storage, and the furnace. He keeps himself fed and busy with no model involved at all. A deterministic behavior loop handles patrol, upkeep, scheduled farm work, and getting out of trouble.</p>
<p>That was always the plan. A language model is too slow and too expensive to run a Minecraft body tick by tick. The body should run itself, and the model should be the part that talks, judges, and now and then decides what to do next.</p>
<p>A couple of weeks ago, while getting ready for the first proper live run, I asked a question I should have asked earlier. How does the LLM interact with the bot while the behavior loop is running?</p>
<h2>The answer: it doesn’t</h2>
<p>Nothing on the patrol path calls the model. The “patrol planner” in the code is deterministic navigation logic. Exact commands like <code>status</code> or <code>go home</code> skip the model and go straight to deterministic skills. Only natural-language conversation from an allowlisted player reaches the LLM.</p>
<p>My allowlist was empty, and Discord was disabled. So the ChatGPT-backed planner was configured, authenticated, and initialized, and nothing could ever reach it. I had built a brain and given it no way to be asked anything.</p>
<blockquote>
<p>Narrator: <em>He had, in fact, built an extremely well-tested NPC.</em></p>
</blockquote>
<p>Even with an allowlisted player, the model only ever reacts. A conversational turn returns one chat line plus at most one skill or a short plan, and consequential work waits for the player to confirm. That’s a decent chat interface bolted onto an NPC. It isn’t a companion.</p>
<h2>What I actually wanted</h2>
<p>What I wanted, in my own words at the time:</p>
<blockquote>
<p>The LLM is going to be another “player” in the world with the bot being its “character”.</p>
</blockquote>
<p>That comes with constraints I care about:</p>
<ol>
<li><strong>Player commands beat autonomous chores.</strong> If I tell Reeve to do something, that beats anything the model decided on its own. Survival reflexes still interrupt both of us.</li>
<li><strong>Don’t spam the model.</strong> Token usage should be deliberate, not a side effect of the game loop.</li>
<li><strong>The body works without a brain.</strong> With no model configured, or with the provider down, the deterministic loop keeps Reeve alive and useful.</li>
</ol>
<h2>Four layers, one body</h2>
<p>The design I ended up with puts four layers over one body, each with a clear authority level:</p>
<table>
<thead>
<tr>
<th style="text-align:left">Layer</th>
<th style="text-align:left">What it does</th>
<th style="text-align:left">Authority</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left">Survival reflexes</td>
<td style="text-align:left">Flee, surface, escape fire, recover</td>
<td style="text-align:left">Highest. Interrupts everything</td>
</tr>
<tr>
<td style="text-align:left">Player or operator</td>
<td style="text-align:left">Directs the character, overrides intentions</td>
<td style="text-align:left">Above the LLM</td>
</tr>
<tr>
<td style="text-align:left">Autonomous LLM</td>
<td style="text-align:left">Picks an occasional goal from a short list</td>
<td style="text-align:left">Above idle behavior</td>
</tr>
<tr>
<td style="text-align:left">Deterministic loop</td>
<td style="text-align:left">Patrol, upkeep, farm schedule, fallback</td>
<td style="text-align:left">Baseline</td>
</tr>
</tbody>
</table>
<p>The rule underneath all four layers is that <strong>the LLM never emits code or calls Mineflayer directly.</strong> It chooses a chore from a list of registered skills. Before running it, the runtime checks who asked, whether that source can use the skill, and whether its required capabilities are enabled. It also checks where the bot may work and what resources it may spend. The model can ask for something. The runtime decides whether Reeve is allowed to do it.</p>
<p>Here’s the flow on one page:</p>
<pre><code class="hljs language-text">Player message ──&gt; conversation planner ─┐
                                         │
Scheduled opportunity ─&gt; autonomy mode ──┼─&gt; SkillExecutor ─&gt; ActionRunner
                                         │                       │
Behavior loop ─&gt; deterministic action ───┘                       ▼
                                                         Navigation/world APIs
                                                                 │
                                                                 ▼
                                                           Mineflayer bot
Safety reflexes ──────────────────────────────&gt; ActionRunner at highest authority
</code></pre>
<h2>Who asked for this?</h2>
<p>The catch was that the <code>ActionRunner</code> only knew three priorities: <code>passive</code>, <code>high</code>, and <code>critical</code>. It had no idea whether an action came from a player or from a model that decided something on its own. A player command at the same priority as an LLM chore wasn’t guaranteed to win. “Player commands beat autonomous chores” would have been a line in a prompt, which is to say a suggestion.</p>
<p>So every action now carries an <em>execution source</em>:</p>
<ul>
<li><code>planner</code> means the model is acting on behalf of a player’s request in a conversation.</li>
<li><code>agent</code> means the model decided this by itself, with nobody asking.</li>
<li><code>behavior</code> means the deterministic loop.</li>
<li><code>safety</code> means a survival reflex.</li>
</ul>
<p>The ordering is <code>safety &gt; player &gt; agent &gt; behavior</code>, and it lives in code. A player’s work can interrupt an agent chore even when that chore’s task priority is higher. Neither a player nor the agent can interrupt a critical survival reflex. Both of those are tests now.</p>
<p>Any authorized player activity aborts an in-flight <code>agent</code> provider call <em>and</em> cancels the action it produced, then starts a quiet period. When the player goes quiet again, the next autonomous turn has to look at the current scene and decide fresh. It doesn’t resume whatever it was thinking five minutes ago.</p>
<p>That last part matters more than it sounds. Stale intent is how you get a bot that heads off to harvest a field you just told it to stay away from.</p>
<h2>One model, two jobs</h2>
<p>The naming confused me for a while, because “planner” means two things in this codebase.</p>
<p>There’s the <code>Planner</code> interface, which is just the model provider. Both player conversations and autonomous turns call the same <code>planTurn()</code> method with a purpose of either <code>&quot;conversation&quot;</code> or <code>&quot;autonomy&quot;</code>. At startup the same provider instance goes to both the command router and the autonomy coordinator.</p>
<p>So the autonomous agent isn’t a second LLM. It’s a scheduled, lower-authority use of the same one. That matters for practical reasons too. Reeve uses Codex OAuth, and two provider instances would mean two copies of the token refresh state fighting over one login.</p>
<h2>A budget for thinking</h2>
<p>The proactive coordinator only calls a real model when <em>all</em> of these are true:</p>
<ul>
<li><code>ENABLE_LLM_AUTONOMY=true</code></li>
<li>The behavior loop is enabled and the bot is ready</li>
<li>Nothing else owns the body: no player work, no safety reflex, no earlier autonomous action</li>
<li>A minimum interval has passed, and so has a quiet period since the last player activity</li>
<li>The rolling hourly budget has room</li>
<li>Any provider-failure backoff has expired</li>
<li>Something actually changed: the scene, or which skills are available right now</li>
</ul>
<p>That last condition saves the most tokens. If Reeve is standing in the same room with the same options as last time, asking the model again buys nothing. A skipped opportunity costs zero model calls.</p>
<p>The code defaults allow a call every three minutes and twelve per hour. My live config is stingier, with one opportunity every five minutes, six calls an hour, a fifteen-minute failure backoff, and a two-minute quiet period after any player activity. Six calls an hour is nothing. That’s the point.</p>
<p>A model call takes a while, and the world keeps going. Review caught a race where a slow response could dispatch a chore into a situation that had changed. Now the coordinator re-checks hazards and body ownership after inference, before it dispatches anything.</p>
<p>When the provider fails, the coordinator backs off and lets the deterministic loop carry on. The stub provider can never supply autonomous intent, so a misconfiguration fails quietly instead of producing a bot that acts on canned decisions.</p>
<h2>A deliberately small menu</h2>
<p>What the model can choose on its own is a lot narrower than what it can do for a player. An autonomous turn may pick <strong>at most one</strong> skill, and that skill has to:</p>
<ul>
<li>explicitly allow the <code>agent</code> source,</li>
<li>be a reversible chore,</li>
<li>need no special capability, and</li>
<li>pass a live availability check both before the model sees it and again before it runs.</li>
</ul>
<p>For now that’s exactly five skills: <code>collect_drops</code>, <code>go_home</code>, <code>go_to_location</code>, <code>inspect_sector</code>, and <code>patrol_area</code>. A test pins the production catalog to those five, so a new skill can’t quietly become agent-callable because someone forgot a flag.</p>
<p>Anything bigger has to come from a player, through the conversational planner, with that player’s authority.</p>
<p>At first, every autonomous turn used the full conversational prompt, including skills it couldn’t choose. I gave autonomy a smaller prompt containing only its five allowed chores and asking for a three-field response, <code>{ skill, input?, reason }</code>. It comes in at about 18% of the conversational system prompt by character count, and a regression test fails if it ever passes a third. Autonomous turns on Codex always run at low reasoning effort. Conversation keeps whatever effort I configured.</p>
<h2>Same character, both modes</h2>
<p>Then there’s <code>SOUL.md</code>. It’s the persona file, and it defines Reeve’s identity, a short and warm way of talking, and values like safety, honesty, and stewardship. I wanted to know where it actually shows up.</p>
<p>The answer is both prompts. The conversational prompt includes it in full, with an explicit note that the persona only shapes the tone of the chat line. The autonomy prompt includes it too, where it can tilt Reeve’s choice among chores he’s already allowed to do. Stewardship might make “go home” look better than “patrol” at dusk. It can’t add a skill, override a safety check, widen a boundary, invent a location, or overrule a player.</p>
<p>A missing or empty <code>SOUL.md</code> is a startup error, not a silent bot with no personality.</p>
<p>So yes, it’s one character. In player mode Reeve converses and acts with the player’s authority. In autonomous mode he privately picks one safe chore and says nothing. Same identity, same world view, same memory of recent outcomes. What changes is who asked and how much he’s allowed to do about it.</p>
<p>The deterministic loop is the exception. Patrol, doors, survival reflexes, and farm work never read <code>SOUL.md</code>. From inside the game it all looks like Reeve, but that part is autopilot.</p>
<h2>Letting him choose</h2>
<p>I started this work with a model that was configured, authenticated, and unreachable. Wiring it in meant deciding when it gets a turn, what it may ask for, and how quickly it has to get out of a player’s way. None of those decisions could live only in the prompt.</p>
<p>Reeve can now decide on his own, at most six times an hour, to inspect a sector or head home. Whether those choices are any <em>good</em> only gets answered by letting him loose in the world and reading the journal afterward.</p>
`,i={id:e,slug:t,frontmatter:o,readingTime:a,content:n};export{n as content,i as default,o as frontmatter,e as id,a as readingTime,t as slug};
