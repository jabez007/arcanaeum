const e="2026-06-27-sifting-minecraft-seeds-cubiomes",t="sifting-minecraft-seeds-cubiomes",n={title:"Seed Sifting: Stop Guessing Your Cubiomes Thresholds",date:"2026-06-27",author:"jabez007",tags:["minecraft","cubiomes","worldgen","python","automation"],excerpt:`I wanted a Minecraft seed with an island home base, warm water at spawn, and a Pale Garden somewhere across the sea.
Cubiomes Viewer can search for that, but only if you feed it the right climate numbers. My first numbers were guesses.
The second set came from "research" and was worse. The third set came from the source code.
`,featured:!1,draft:!1},a=10,o=`<h1>Seed Sifting: Stop Guessing Your Cubiomes Thresholds</h1>
<p><em>Or: How I picked a Pale Garden threshold three times and the middle answer was the worst</em></p>
<p>Every time I start a new survival world I spend way too long rolling seeds. This time I wanted to do it properly.</p>
<p>The world I’m after is specific. I want a home island in a broad, navigable sea, with warm water near spawn and enough flat ground to build on. Across the water there should be strong climate contrasts worth sailing to: swamps, savanna, badlands, a mushroom island, and ideally a Pale Garden. Not a lone rock in an empty ocean. A home base plus expeditions.</p>
<p><a href="https://github.com/Cubitect/cubiomes-viewer">Cubiomes Viewer</a> can search for most of that. You stack up conditions and it grinds through seeds until something passes all of them. The catch is that many of the useful conditions aren’t “find biome X”. They’re climate parameter boxes, things like “somewhere in this area, temperature is above N and humidity is below M”. Minecraft decides biomes from a handful of these noise values, so a climate box is a cheap way to say “this kind of place probably exists here” before paying for an exact biome check.</p>
<p>Cheap filters are only useful if the numbers mean something. Mine didn’t, at first.</p>
<h2>A session file under version control</h2>
<p>I keep this in a small repo called <code>seed-sifter</code>. It isn’t an app. It holds one saved Cubiomes Viewer session, notes on worldgen, and a Python script that regenerates the session.</p>
<p>The session format stores each condition as a binary <code>#Cond</code> record, so the script uses <code>ctypes</code> to decode and rewrite those records directly. That means every threshold lives in readable Python, and I can diff a tuning change like any other code change:</p>
<pre><code class="hljs language-bash">python3 searches/scripts/update_starter_session.py
</code></pre>
<p>Then I load <code>searches/viewer-search.session</code> in the viewer and let it run.</p>
<h2>“Warm sea” kept finding cold sea</h2>
<p>After a few test searches, too many results had plain <code>ocean</code> or <code>deep_ocean</code> at spawn instead of lukewarm or warm ocean.</p>
<p>The <code>Warm sea</code> condition checked for warm, oceanic climate within 256 blocks of spawn. That’s a big box. A warm patch on the far edge could satisfy it while the water you actually spawn next to was neutral. So I tightened it by feel:</p>
<table>
<thead>
<tr>
<th style="text-align:left">Setting</th>
<th style="text-align:left">Before</th>
<th style="text-align:left">After</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left">Window around spawn</td>
<td style="text-align:left"><code>-256..256</code></td>
<td style="text-align:left"><code>-192..192</code></td>
</tr>
<tr>
<td style="text-align:left">Temperature floor</td>
<td style="text-align:left"><code>&gt;= 1000</code></td>
<td style="text-align:left"><code>&gt;= 1500</code></td>
</tr>
<tr>
<td style="text-align:left">Continentalness cap</td>
<td style="text-align:left"><code>&lt;= -1800</code></td>
<td style="text-align:left"><code>&lt;= -1800</code></td>
</tr>
</tbody>
</table>
<p>That helped some. It also made clear that a climate box is an existence check. “This kind of climate exists somewhere in this square” isn’t the same as “spawn is in a warm ocean”. For a hard guarantee you need an actual biome sample. The climate gate just improves the odds cheaply.</p>
<p>Hold on to that <code>1500</code>. It comes back.</p>
<h2>The Pale Garden, three times</h2>
<p>Next I wanted a condition that raised the odds of a Pale Garden. The history of that threshold is the reason this post exists.</p>
<h3>Attempt one: vibes</h3>
<p>The first version came from reasoning about the other conditions already in my stack. <code>Coastal</code> used continentalness <code>&lt;= -1100</code>, and another condition treated <code>&gt;= -500</code> as loosely inland. So “clearly inland” became <code>continentalness &gt;= 1800</code>. <code>Open terrain</code> kept weirdness between <code>-2000</code> and <code>2000</code>, so “unusual terrain” became <code>weirdness &gt;= 2500</code>.</p>
<p>That’s internally consistent and completely made up. I couldn’t tie either value to a biome table. They were deliberate heuristics, and I wanted numbers I could check.</p>
<h3>Attempt two: research, which was worse</h3>
<p>So I went looking for real numbers online. The best lead was Minecraft’s own <code>VanillaBiomeParameters</code> in the Yarn mappings, which defines named weirdness band cutoffs:</p>
<pre><code class="hljs language-text">MAX_HIGH_WEIRDNESS        = 0.5666667
MAX_PEAK_WEIRDNESS        = 0.7666667
MAX_SECOND_HIGH_WEIRDNESS = 0.9333333
</code></pre>
<p>Assuming Cubiomes multiplies noise values by 10000, those map to about <code>5667</code>, <code>7667</code>, and <code>9333</code>. The next candidate for my weirdness floor was <code>5667</code>.</p>
<p>That sounded rigorous. It had real constants and a link. But I hadn’t checked the conversion or whether a named weirdness band actually described Pale Garden terrain. The new number would have more than doubled my threshold.</p>
<h3>Attempt three: read the source</h3>
<p>With Claude Code helping me read the Cubiomes and Cubiomes Viewer source on GitHub, I checked the scale and biome limits they actually use.</p>
<p>The viewer doesn’t invent its own range. It asks Cubiomes for integer limits through <code>getBiomeParaExtremes()</code> and <code>getBiomeParaLimits()</code>. In Cubiomes, the sampled climate values really are multiplied by 10000:</p>
<pre><code class="hljs language-c"><span class="hljs-type">int64_t</span> id = (<span class="hljs-type">int64_t</span>) (<span class="hljs-number">10000.0</span> * sampleClimatePara(bn, np, x, z));
</code></pre>
<p>The multiplier was right. That still didn’t tell me which threshold to use for a Pale Garden.</p>
<p>The parameter ranges aren’t a uniform <code>±10000</code>, either. In the Cubiomes version I checked for this search, <code>getBiomeParaExtremes()</code> returned:</p>
<table>
<thead>
<tr>
<th style="text-align:left">Parameter</th>
<th style="text-align:left">Range</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left">temperature</td>
<td style="text-align:left"><code>-4501 .. 5500</code></td>
</tr>
<tr>
<td style="text-align:left">humidity</td>
<td style="text-align:left"><code>-3500 .. 6999</code></td>
</tr>
<tr>
<td style="text-align:left">continentalness</td>
<td style="text-align:left"><code>-10500 .. 300</code></td>
</tr>
<tr>
<td style="text-align:left">erosion</td>
<td style="text-align:left"><code>-7799 .. 5500</code></td>
</tr>
<tr>
<td style="text-align:left">depth</td>
<td style="text-align:left"><code>1000 .. 10500</code></td>
</tr>
<tr>
<td style="text-align:left">weirdness</td>
<td style="text-align:left"><code>-9333 .. 9333</code></td>
</tr>
</tbody>
</table>
<p>The real find was that Cubiomes’ <a href="https://github.com/Cubitect/cubiomes/blob/master/finders.c"><code>finders.c</code></a> already has a parameter row for Pale Garden on 1.21.4 and later. These are the values I used for this search:</p>
<table>
<thead>
<tr>
<th style="text-align:left">Parameter</th>
<th style="text-align:left">Pale Garden</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left">temperature</td>
<td style="text-align:left"><code>-1500 .. 2000</code></td>
</tr>
<tr>
<td style="text-align:left">humidity</td>
<td style="text-align:left"><code>&gt;= 3000</code></td>
</tr>
<tr>
<td style="text-align:left">continentalness</td>
<td style="text-align:left"><code>&gt;= 300</code></td>
</tr>
<tr>
<td style="text-align:left">erosion</td>
<td style="text-align:left"><code>-7799 .. 500</code></td>
</tr>
<tr>
<td style="text-align:left">weirdness</td>
<td style="text-align:left"><code>&gt;= 2666</code></td>
</tr>
</tbody>
</table>
<p>So the scorecard for weirdness reads: guess <code>2500</code>, research <code>5667</code>, actual <code>2666</code>. My lazy guess was almost right by accident. The researched number converted a real constant correctly, but picked the wrong cutoff for the biome I wanted. It would have filtered out a big chunk of valid Pale Garden terrain. On continentalness the guess was way off, <code>1800</code> where <code>300</code> is enough. I’d been demanding deep inland when Pale Gardens only need to be off the coast.</p>
<blockquote>
<p>Narrator: <em>The footnoted answer was the wrong one. The footnotes were very nice, though.</em></p>
</blockquote>
<h2>Using the real table everywhere else</h2>
<p>Once you have the per-biome rows from Cubiomes’ <code>finders.c</code>, every other climate box in the stack can be checked against them instead of against intuition. That turned up more than I expected.</p>
<p><strong>Hot and wet.</strong> I wanted swamp, mangrove swamp, sparse jungle, or bamboo jungle, leaning toward swamp. The Cubiomes rows show what makes swamps different. They need very high erosion, <code>&gt;= 5500</code>, and continentalness <code>&gt;= -1100</code>, while the jungle variants care mostly about temperature and humidity. One box can’t capture “these four and nothing else”, but it can lean the right way:</p>
<pre><code class="hljs language-text">1000 &lt;= temperature &lt;= 5500
humidity &gt;= 1000
continentalness &gt;= -1100
erosion &gt;= 5500
</code></pre>
<p><strong>Hot and dry.</strong> The old box was <code>temperature &gt;= 1000</code> and humidity between <code>-2500</code> and <code>-500</code>, which let in plenty of plain desert-adjacent terrain. Savanna wants <code>temperature &gt;= 2000</code> and <code>humidity &lt;= -1000</code>. Savanna plateau and the badlands share low erosion, <code>&lt;= 500</code>, while desert has much looser bounds. Adding the erosion cap is what pushes the box toward savanna and badlands and away from desert:</p>
<pre><code class="hljs language-text">temperature &gt;= 2000
humidity &lt;= -1000
erosion &lt;= 500
</code></pre>
<p><strong>Pale Garden, again.</strong> I’d also added a Cherry Grove condition, and the first Pale Garden box, only continentalness and weirdness, matched Cherry Grove terrain just as well. Both are inland and weird. The difference is the climate. Cherry Grove is cold and dry, and Pale Garden is cool and wet. Using the full Pale Garden row, temperature, humidity and erosion included, pulled them apart.</p>
<p><strong>A condition that stopped pulling its weight.</strong> <code>Relief diversity</code> asked for “some rugged inland terrain somewhere”. Cherry Grove and Pale Garden both already require inland, low-erosion terrain, plus a lot more. It wasn’t completely redundant, but it was close enough that I dropped it.</p>
<p><strong>The warm sea, again.</strong> Here’s where that <code>1500</code> came back. Cubiomes’ ocean rows put plain <code>ocean</code> and <code>deep_ocean</code> at temperatures up to <code>2000</code>. Lukewarm starts at <code>2001</code>. So my hand-tuned <code>&gt;= 1500</code> still let neutral ocean through, which is exactly the problem I’d been trying to fix. The ocean biomes also stop at continentalness <code>-1900</code>, not <code>-1800</code>. The source-backed version is:</p>
<pre><code class="hljs language-text">temperature &gt;= 2001
continentalness &lt;= -1900
</code></pre>
<p>My tweak by feel had moved in the right direction and stopped short of the line that actually mattered.</p>
<h2>A biome Cubiomes doesn’t know yet</h2>
<p>Then came a newer biome, the dappled forest, that Cubiomes doesn’t have a row for yet. All I had was the description: cold regions, very little humidity, high weirdness, borders plains, sunflower plains and cherry groves but never other woodland, and shows up near cold oceans as well as in the mountains.</p>
<p>After all that, I was back to estimating. The difference is that this time the estimate was built from the neighboring rows. Humidity <code>&lt;= -1000</code> keeps it out of nearly every other forest. Regular forest starts at exactly <code>-1000</code>, so the two only share that one boundary value, and birch and dark forest are wetter still. Weirdness <code>&gt;= 2666</code> lines it up with the Cherry Grove. Temperature tops out at <code>2000</code>, and there’s no erosion limit, since it can generate on any terrain. It’s in the reference table marked as an estimate, so I won’t forget which row I made up.</p>
<h2>The order of the stack matters</h2>
<p>The last thing I learned is that Cubiomes Viewer runs a search in two passes. A fast pass works on just the lower 48 bits of the seed, which is enough for some checks. A full 64-bit pass evaluates whatever survives. Root-level conditions are evaluated in order, and the first one that fails stops the rest.</p>
<p>My big regional climate checks were all positioned relative to the <code>Spawn</code> condition. Spawn can only be computed in the full pass, and in the viewer’s search code, anything that hangs off spawn waits for it. So I was paying for spawn resolution before even asking whether the region had a swamp.</p>
<p>Now the regional climates are root-level, covering the center of the world from <code>-2048</code> to <code>2048</code>, and they come before <code>Spawn anchor</code>. So do the central sea coverage check and the mushroom island. Only the checks that really are about spawn, coastal, warm sea and open terrain, still hang off it. I haven’t benchmarked the before and after, but the tree now rejects seeds on the cheaper questions first.</p>
<h2>Decode what you wrote</h2>
<p>At one point I asked for the hot/wet temperature floor to drop from <code>1500</code> to <code>1000</code>. The README got updated. The generator script didn’t. The only reason I know is that the regenerated session got decoded back to check, and the binary still said <code>1500..5500</code>.</p>
<p>If your config lives in a binary format, read it back after every change. A doc that agrees with you proves nothing.</p>
<h2>Final thoughts</h2>
<ul>
<li><strong>Confident numbers aren’t the same as sourced numbers.</strong> My guess was confident. The research was confident and footnoted. Only the source code was correct.</li>
<li><strong>A correct conversion can still give you the wrong threshold.</strong> <code>5667</code> came from a real constant, but Pale Garden’s row starts at <code>2666</code>.</li>
<li><strong>When you have to estimate, build it from the nearest real data and label it.</strong></li>
<li><strong>Put cheap, independent checks first.</strong> Don’t make every condition wait on the most expensive one.</li>
</ul>
<p>If you’re tuning Cubiomes conditions, start with the biome parameter tables in <code>finders.c</code> for the version your viewer uses. Read them, put the numbers in a script, and make the script prove what it wrote.</p>
<p>Now I just need the search to finish, so I can find out the island I want doesn’t exist.</p>
`,s={id:e,slug:t,frontmatter:n,readingTime:a,content:o};export{o as content,s as default,n as frontmatter,e as id,a as readingTime,t as slug};
