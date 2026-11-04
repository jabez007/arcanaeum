const e="2026-06-14-minecraft-bot-vs-wooden-door",o="minecraft-bot-vs-wooden-door",t={title:"My Minecraft Bot vs. One Wooden Door",date:"2026-06-14",author:"jabez007",tags:["minecraft","mineflayer","pathfinding","llm","ai-agents","troubleshooting","typescript"],excerpt:`I'm building an LLM-powered companion that lives in my Minecraft world. Before it can hold a conversation,
it has to get from the house to the wheat farm. That meant a weekend spent losing to a single oak door.
`,featured:!1,draft:!1},a=9,s=`<h1>My Minecraft Bot vs. One Wooden Door</h1>
<p><em>Or: Why the LLM part of an LLM companion is the easy part</em></p>
<p>My summer project has a name now. Reeve is a <a href="https://github.com/PrismarineJS/mineflayer">Mineflayer</a> bot that lives in my survival world. The long-term goal is a companion that a large language model drives, something you can talk to, hand a chore to, and mostly forget about. The project’s README puts the goal as a question:</p>
<blockquote>
<p>Can a player include Reeve in an ordinary Minecraft session without taking on a second job managing him?</p>
</blockquote>
<p>The trap with a project like this is starting with the model. You wire up an API key, the bot says something clever in chat, and it feels like magic. Then you ask it to go harvest wheat and it stands in the hallway until it times out.</p>
<p>So before any LLM gets near the steering wheel, Reeve needs a body that works. He has to eat and sleep, work the farm, put things away, and walk around my base without help.</p>
<p>This week, “walk around my base” came down to one oak door.</p>
<h2>“No path” in two seconds</h2>
<p>My wheat farm sits right outside the house, and a door opens straight onto the field. When Reeve was told to go to the farm, both <code>go_to_location</code> and the harvest skill came back with “no path”.</p>
<p>Not a timeout, and not “stuck”. They gave up in about two seconds. Reeve was right there by the door, and the farm was right there on the other side of it.</p>
<p>He just needed to open the door, walk through, and close it behind him. Any five-year-old can do that.</p>
<h2>Pathfinder thinks doors are walls</h2>
<p>Mineflayer leans on <a href="https://github.com/PrismarineJS/mineflayer-pathfinder">mineflayer-pathfinder</a> for movement. Version 2.4.5 can’t route through a closed wooden door, and it fails for two separate reasons.</p>
<p><strong>Reason one.</strong> Pathfinder builds its set of “openable” blocks by filtering block names for the string <code>gate</code>:</p>
<pre><code class="hljs language-js"><span class="hljs-comment">// mineflayer-pathfinder 2.4.5, lib/movements.js</span>
registry.<span class="hljs-property">blocksArray</span>.<span class="hljs-title function_">forEach</span>(<span class="hljs-function"><span class="hljs-params">block</span> =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">interactableBlocks</span>.<span class="hljs-title function_">has</span>(block.<span class="hljs-property">name</span>) &amp;&amp;
      block.<span class="hljs-property">name</span>.<span class="hljs-title function_">toLowerCase</span>().<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;gate&#x27;</span>) &amp;&amp;
      !block.<span class="hljs-property">name</span>.<span class="hljs-title function_">toLowerCase</span>().<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;iron&#x27;</span>)) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">openable</span>.<span class="hljs-title function_">add</span>(block.<span class="hljs-property">id</span>)
  }
})
</code></pre>
<p>Fence gates make the list. <code>oak_door</code> doesn’t contain the word “gate”, so it never makes the list, and the lower half of every door gets treated as a solid wall the bot isn’t allowed to dig through.</p>
<p><strong>Reason two.</strong> Even after you fix the lower half, the forward-move check runs the head-level block through a “safe or breakable” test. That test knows nothing about doors. A closed door’s upper half has a full block bounding box, so it reads as an unbreakable wall, and the move gets rejected before pathfinder ever looks at whether it could be opened.</p>
<p>Two bugs with the same symptom. Any route through a closed door returns “no path”, and the code that knows how to open doors never runs.</p>
<h2>Fix one, and the overcorrection</h2>
<p>The repair wraps pathfinder’s <code>getBlock</code> so door halves come back marked <code>safe</code>:</p>
<pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> markDoorHalfPassable&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">type</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">safe</span>?: <span class="hljs-built_in">boolean</span> } | <span class="hljs-literal">null</span>&gt;(
  <span class="hljs-attr">block</span>: T,
  <span class="hljs-attr">doorIds</span>: <span class="hljs-title class_">ReadonlySet</span>&lt;<span class="hljs-built_in">number</span>&gt;
): T {
  <span class="hljs-keyword">if</span> (block &amp;&amp; doorIds.<span class="hljs-title function_">has</span>(block.<span class="hljs-property">type</span>)) {
    block.<span class="hljs-property">safe</span> = <span class="hljs-literal">true</span>;
  }
  <span class="hljs-keyword">return</span> block;
}

<span class="hljs-keyword">const</span> doorIds = <span class="hljs-title function_">handOpenableDoorIds</span>(bot.<span class="hljs-property">registry</span>.<span class="hljs-property">blocksArray</span>, config);
<span class="hljs-keyword">const</span> baseGetBlock = movements.<span class="hljs-property">getBlock</span>.<span class="hljs-title function_">bind</span>(movements);
movements.<span class="hljs-property">getBlock</span> = <span class="hljs-function">(<span class="hljs-params">pos, dx, dy, dz</span>) =&gt;</span>
  <span class="hljs-title function_">markDoorHalfPassable</span>(<span class="hljs-title function_">baseGetBlock</span>(pos, dx, dy, dz), doorIds);
</code></pre>
<p>Iron doors stay out of <code>doorIds</code>, since they need redstone and the bot can’t open them by hand.</p>
<p>With that in, going to the farm went from an instant “no path” to actually trying the door route. Progress.</p>
<p>The first version also marked the door halves as non-physical. That seemed thorough. Instead the bot walked up to the door, opened it, and froze solid on the threshold. Pathfinder now believed the doorway was empty air, so as far as it was concerned the bot was already standing where it needed to be. Zero movement until the timeout.</p>
<p>Marking the door <code>safe</code> and leaving it physical was the right amount of lying. Pathfinder plans a route up to the door, the door stays an obstacle, and something has to open it.</p>
<h2>The door that kept closing itself</h2>
<p>Reeve already had a habit of closing doors. A background cleanup ran every 500 ms and shut any open door within 3.5 blocks once it had been open for 600 ms. That’s a reasonable rule for a bot that shouldn’t leave the house open to zombies.</p>
<p>It’s a terrible rule for a bot walking through a door. Pathfinder would open the door. About 600 ms later, the cleanup slammed it shut. Pathfinder opened it again. The cleanup shut it again. Reeve stood in the doorway, flapping the door like he was trying to air out the room.</p>
<blockquote>
<p>Narrator: <em>The zombies were, in fairness, kept out.</em></p>
</blockquote>
<p>It also explained how this whole thing started. At some point the cleanup had shut the farm door behind him, and before the pathfinding fix, he had no way to open it again. Reeve had locked himself out of his own farm.</p>
<p>The cleanup now waits until Reeve is idle. It doesn’t touch a door while he’s on his way somewhere. Skills that open a door close it themselves when they’re done, and the background tick only mops up doors left open after everything else has finished.</p>
<h2>Who opens the door?</h2>
<p>Even with all that, pathfinder’s own door handling through this particular door wasn’t reliable. It would open the door, then decide to look for some other route instead of stepping through. Going to the farm timed out after 60 seconds with the bot pinned at the threshold.</p>
<p>So the door crossing became its own explicit step. Pathfinder runs in short, time-boxed legs. If the bot stalls next to a closed door whose far side leads toward the goal, it takes over. Open the door, get across, hand control back to pathfinder. With that, going to the farm finished in 34 seconds instead of timing out, and the harvest reached 67 crops where it had reached zero.</p>
<p>That version had bugs of its own.</p>
<ul>
<li><strong>The bot standing on the door.</strong> The crossing direction came from the vector between the bot and the door. When Reeve parked right on the threshold, which is exactly where he ended up coming back from the field, that vector was zero and the door got skipped. He just stood there. The fix was to use the direction toward the <em>goal</em>, not toward the door. From the doorway, walking to a barrel of wheat in the base went from “no path” to about 7 seconds.</li>
<li><strong>The pogo stick.</strong> To get through, the crossing held forward and jump for four seconds, to clear the one-block lip a doorway often sits on. On flat ground, that made the bot bounce in place between y=63 and y=64 without going anywhere.</li>
<li><strong>Two hands on one door.</strong> Pathfinder still had doors in its openable set, so its own “use block” step could toggle a door the crossing had just opened. Sometimes they raced and shut the door mid-crossing.</li>
</ul>
<p>The version that stuck moved door handling into a <code>Navigator</code> service and made it the only thing that opens doors. Pathfinder gets <code>canOpenDoors = false</code> but keeps the <code>safe</code> patch, so it can still <em>plan</em> through a door and walk the bot up to it. Once the door is open, a short pathfinder hop to the tile just past it crosses the doorway. An open door is passable, so pathfinder centers the bot and climbs the lip cleanly, no pogo required.</p>
<p>The test was a round trip between a field tile and a barrel in the base, forcing a crossing each way. Three runs and six crossings all came back clean, opening and closing in both directions.</p>
<h2>Close the door behind you, but only yours</h2>
<p>Reeve now closes a door once he’s actually through it. He only does this for doors he opened. If I left a door open on purpose, it stays open.</p>
<p>That came out of a night test. Reeve went to bed, got stuck partway there, and left a door hanging open behind him. The sleep skill was calling raw <code>pathfinder.goto</code>, which had all the old door problems. Because it stalled before reaching the bed, it never got to the “close what you opened” step. Routing sleep through the same door-aware navigation fixed both problems.</p>
<h2>The goal you can’t stand on</h2>
<p>There was one more navigation problem that weekend. “Go to the farm” targeted its center block, which was water surrounded by crops. Reeve could reach the field, but couldn’t stand close enough to that point to satisfy <code>GoalNear</code>. The goal now snaps to a nearby tile he can actually stand on.</p>
<p>The harvest skill had a related problem. It could pace a fence line for its full 90-second timeout, skipping unreachable crops while the stuck detector counted movement as progress. Now three path failures in a row end the harvest with an honest “the farm may be fenced off from me”. That took 7.5 seconds instead of 90.</p>
<h2>Side quest: the bread incident</h2>
<p>While all this was going on, Reeve found a way to waste food. He deposited surplus bread into a barrel over a hopper that emptied into a composter. Every loaf he “stored” became compost.</p>
<p>The storage check guessed from nearby blocks, and the barrel briefly holding bread made it look like the right place for more bread. Now it follows the hopper chain. If it ends in a composter, Reeve doesn’t deposit there.</p>
<h2>Final thoughts</h2>
<ul>
<li><strong>Read the library before you blame your code.</strong> Pathfinder decides what’s openable by looking for the word “gate”.</li>
<li><strong>Lie to the pathfinder as little as you can.</strong> “Safe” was enough. “Not there at all” froze the bot in place.</li>
<li><strong>Two systems touching the same door will fight.</strong> Pick one owner.</li>
<li><strong>Moving isn’t the same as making progress.</strong> A bot pacing a fence line looks busy to a stuck detector.</li>
</ul>
<p>None of this involved a language model. Each problem was the bot’s body failing at something a player does without thinking. Walk through a door, close it, stand next to a field, put bread somewhere safe.</p>
<p>A model can decide that Reeve should go harvest wheat. It can’t get him through the door. If the body can’t do the basics on its own, the LLM ends up as a very expensive way to watch a bot stand in a hallway.</p>
<p>Next up is the slab staircase down to my smelting area. He doesn’t believe it’s a staircase yet.</p>
`,n={id:e,slug:o,frontmatter:t,readingTime:a,content:s};export{s as content,n as default,t as frontmatter,e as id,a as readingTime,o as slug};
