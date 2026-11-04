const e="2026-08-29-letting-codex-playtest-my-minecraft-bot",t="letting-codex-playtest-my-minecraft-bot",a={title:"Letting Codex Playtest My Minecraft Bot",date:"2026-08-29",author:"jabez007",tags:["minecraft","mineflayer","llm","ai-agents","testing","troubleshooting"],excerpt:`I had Codex run my Minecraft companion bot for twenty minutes at a time, give it chores, read the
journal afterward, fix something, and run it again. It found real bot bugs. It also found that my test
graders were lying to me about as often as the bot was.
`,featured:!1,draft:!1},n=10,o=`<h1>Letting Codex Playtest My Minecraft Bot</h1>
<p><em>Or: Who grades the grader?</em></p>
<p>Reeve, my Mineflayer companion, has a lot of unit tests. Over two thousand of them. They’re great at telling me that a function returns what I expect. They aren’t good at telling me whether a bot left alone in my world for twenty minutes actually does anything useful.</p>
<p>The honest way to find out is to play with him. I don’t have other players on the server right now to help with that. So this week I handed the job to Codex.</p>
<p>I gave Codex a loop to follow. Launch the bot for ten to twenty minutes. Ask him for something a player might ask for, through the operator console. Wait for him to finish or fail. Shut him down, read the journal, and decide what went wrong. Fix it, run it again, and compare.</p>
<p>Most of the pieces already existed. An older harness in the project could launch the bot against the live server, run a scripted scenario, keep a structured journal, and shut everything down cleanly. It had just never been used as a loop, with somebody actually reading the results each time. By the end of the week, I wanted more than a green report. I wanted Reeve to finish a useful errand.</p>
<h2>The first bug was in the grader</h2>
<p>Codex’s first run left Reeve patrolling for twenty minutes, with four survey passes, five minutes apart, and status checks at the start and end. Three surveys completed. One failed:</p>
<pre><code class="hljs language-text">Survey Task observation pose was unreachable.
</code></pre>
<p>That’s the good kind of failure. The bot tried to walk somewhere, couldn’t, and said so instead of reporting a success. The harness marked the run red because an expected completion never arrived. Everything did what it was supposed to.</p>
<p>Then the session reporter went over the journal. It flags suspicious outcomes, including “completed, but with zero effect”, which is a classic way for a bot to fake progress. It flagged one. It was the status report.</p>
<p>The zero-effect check matched any <code>0/N</code> pattern in the output. The first status snapshot of the run included the spatial map counters, which at startup read <code>1/0/0</code>. The grader saw that as “zero out of something got done” and raised a false-success warning on a read-only status command.</p>
<p>The first regression test for it used the counters from the end of the run, <code>1/27/6</code>, and stayed green. It took the exact startup string to get a red test. The fix narrowed the check to real effect phrasing like <code>0/2 repaired</code>.</p>
<p>The comparison run, with no bot code changed, completed all four surveys across twenty minutes. So the unreachable pose looked like a one-off, and the only bug fixed in the first loop was in the tool that grades the bot.</p>
<blockquote>
<p>Narrator: <em>This would become a theme.</em></p>
</blockquote>
<h2>Green that proved less than it looked</h2>
<p>The patrol run never touched the language model. I wanted a test where someone asks Reeve for something in plain English. With no real players around, the harness can send a synthetic whisper through the real model provider and require the planner to pick <code>survey_surroundings</code>.</p>
<p>Before connecting to the server, the planner’s offline evaluation ran against the real model. It scored 35 of 41. On the exact case the live scenario depended on, a one-off “patrol” request, the model chose <code>patrol_area</code> instead.</p>
<p>Fair enough. Both skill descriptions were technically accurate, and neither told the model how to resolve the word “patrol”. <code>patrol_area</code> exists to resume ongoing autonomous patrol, which is a much bigger thing than “go have a look around”. Two rewritten descriptions and a catalog test that locks in the wording fixed it.</p>
<p>Then the live scenario passed in 10.1 seconds. The model picked the right skill, and the survey completed and stored real observations. Reeve didn’t move at all, because the survey target was where he was already standing.</p>
<p>Green, and it proved the conversation works. It said nothing about whether he can walk.</p>
<h2>The bug I didn’t fix</h2>
<p>A later full run of the planner suite came back 40 of 41. One case had returned a malformed <code>suggestedSkill</code>, and the evaluator had recorded only that it was malformed, not what shape it was.</p>
<p>The tempting move was to tweak the prompt. Instead the evaluator got a diagnostic that reports the JSON type of a rejected value without ever logging the value itself. Then the same case ran five more times, unchanged. It passed 5 of 5, and the next full suite went 41 of 41.</p>
<p>So there was nothing reproducible to fix. Changing the prompt would have been a guess, and the next run would have “proved” the guess worked. The parser still fails closed, and if it happens again the journal will say what came back.</p>
<h2>Nothing to walk up</h2>
<p>Next I wanted to know whether Reeve could use the routes he’d mapped. He records stairs, slabs, and doorways as <code>Connector</code> objects, and links them in a graph. Earlier runs had found possible crossings, but none had proved he could actually walk across one.</p>
<p>The new scenario was strict. Find a connector, walk across it, require the walk to confirm the matching edge, restart the bot, and check the confirmation survived.</p>
<p>The first live run never came back with a verdict. The bot found no usable crossing in the spawn area and correctly stayed put, but the scenario only knew how to wait for a successful crossing. So it sat there until the run’s time limit expired. Now “no usable geometry” is a graded failure, and the next two runs failed in 14 and 12 seconds for the right reason. There was nothing there to walk up.</p>
<h2>Decorative stairs</h2>
<p>My base has several half-slab spiral staircases, but I didn’t have coordinates for any of them. So the bot went home and asked for a scan of every stair and slab within 24 blocks.</p>
<p>It found 228 stair blocks and 284 slabs. Every one of the 228 stairs got rejected. That sounded like a bug until the rejection reasons came back. They were mostly top-half stairs, which in my base are trim, not steps.</p>
<p>That raised the question I actually cared about. Can the map tell decorative stairs and slabs from a real staircase? It does it in two stages:</p>
<ol>
<li><strong>Geometry.</strong> A stair only counts if it’s bottom-half, straight, not waterlogged, with a clear space to move through and standable landings above and below. A slab only counts if it’s a bottom slab with standable landings on both levels. Anything that qualifies becomes a connector, but its edges start as <code>candidate</code>.</li>
<li><strong>Proof.</strong> An edge only becomes <code>confirmed</code> after the bot successfully walks across it in one continuous trip. The map keeps a record of that trip.</li>
</ol>
<p>It can’t read the builder’s mind. It just refuses to believe a staircase is a staircase until somebody has walked up it.</p>
<p>The first targeted run from a slab landing failed, and it shouldn’t have. The bot crossed a spruce slab, three edges were confirmed, and all three survived a restart. The harness assertion still said no. The skill’s audit wrote a field called <code>traversalJourneyOutcome</code>. The assertion read <code>traversalOutcome</code>. The test fixture for the assertion had copied the wrong name, so the test and the bug agreed with each other perfectly.</p>
<p>That was the second grader bug.</p>
<h2>How far can he actually see?</h2>
<p>As Codex worked through the staircase tests, it changed the scan to report its own limits instead of quietly applying them. That turned up a surprise.</p>
<p>The debug skill accepted a 24-block radius. The production observer clamps that to 8. It also caps a scan at 512 cells and 128 results. A radius-8 sphere has 2,109 candidate cells, so the 512-cell cap cuts it off partway through the distance-5 shell. On the home scan, another 327 cells were dropped for line of sight.</p>
<p>So “radius 8” was the setting, and <strong>radius 4</strong> is the only distance that was ever fully scanned. The scan receipt now reports the requested, clamped, and fully scanned radius as three separate numbers, so nobody, including me, overstates what the bot has seen.</p>
<h2>Up four steps, restart, and back down</h2>
<p>With that known, the bot rescanned at radius 4 after every step instead of trusting one big scan. From a lower landing he found a chain of bottom oak slabs going up four levels.</p>
<p>The final staircase scenario climbs four slab steps, recording each successful crossing. Then it restarts the bot and descends the same four levels using only routes whose crossing records survived the restart. No falling back to untested geometry.</p>
<p>It passed in 33 seconds. All 14 confirmed edges in the run database had a successful trip behind them.</p>
<h2>Stuck on the edges</h2>
<p>Later in the week I said what had been bugging me. It felt like we were stuck tweaking fixes around the edges instead of pushing the bot forward. The loop is very good at finding the next small thing that’s wrong, and there’s always a next small thing.</p>
<p>So I gave Codex a concrete errand to test. Reeve had to make one iron pickaxe and put it in a chest, keeping track of the job across restarts. Crafting it wasn’t enough. The run only passed when the pickaxe was in the chest.</p>
<p>First the bot had to find the materials. I knew there was a double chest of iron somewhere in the basement and one of bamboo nearby. A read-only search opened the basement chests without taking anything and found 1,984 iron ingots and 1,046 bamboo. The iron chest was full to all 54 slots, so the bamboo chest became the deposit target.</p>
<p>Then it took four attempts.</p>
<p><strong>Attempt one</strong> never got to the mission. The preparation step tried to withdraw iron from a chest the fresh run hadn’t mapped yet, and it used a skill that requires an already-known container. Swapping in the search skill fixed it.</p>
<p><strong>Attempt two</strong> failed at the craft in 19 milliseconds with “I could not reach a crafting table”. Nineteen milliseconds is too fast for a pathfinding problem. A code comment promised a live nearest-table fallback, but the function only checked the bot’s memory, and a fresh run hadn’t seen the table yet. It now looks for tables in the loaded world and tries the next one if the nearest isn’t reachable.</p>
<p><strong>Attempt three</strong> made the pickaxe and then failed twice. After the restart, the deposit chest wasn’t in the map anymore. And the craft audit said three ingots were used but zero sticks. The server had consumed the sticks. Mineflayer still showed them in the inventory when the audit ran, and they only vanished after the restart. Ghost sticks.</p>
<p><strong>Attempt four</strong> passed. Reeve kept track of the job through both restarts, crafted exactly one iron pickaxe, and deposited it in the bamboo chest.</p>
<p>Codex did most of the running, the reading, and the fixing. My job was mostly saying “commit and push” and asking what a green run actually proved.</p>
<p>That question kept changing the next test. A survey at Reeve’s feet proved he could answer, but not walk. A staircase crossed before a restart proved less than one he could still use afterward. Making the pickaxe proved less than putting it away. The loop got useful when I gave it an errand with an ending I could check.</p>
<p>Reeve can now make a pickaxe and put it away. It only took four tries and a chest with 1,984 iron ingots in it.</p>
`,s={id:e,slug:t,frontmatter:a,readingTime:n,content:o};export{o as content,s as default,a as frontmatter,e as id,n as readingTime,t as slug};
