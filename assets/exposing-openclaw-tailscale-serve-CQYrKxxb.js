const s="2026-05-17-exposing-openclaw-tailscale-serve",a="exposing-openclaw-tailscale-serve",e={title:"Tailscale Serve and the Pursuit of Private Access",date:"2026-05-17",author:"jabez007",tags:["tailscale","openclaw","networking","homelab","serve","vpn","linux","troubleshooting"],excerpt:`Getting Tailscale running in an LXC was the hard part. But once the tunnel is stable, you're left with a choice: do you expose your gateway to the public internet, or do you keep it strictly for the family? I chose Tailscale Serve.
`,featured:!1,draft:!1},n=4,t=`<h1>Tailscale Serve and the Pursuit of Private Access</h1>
<p>Once you survive the initial struggle of getting Tailscale to actually talk to the <code>/dev/net/tun</code> device in a Proxmox LXC, you’re greeted with a beautiful, quiet landscape. Your machine is on the tailnet. It has an IP. It has a hostname.</p>
<p>But just because the machine is visible doesn’t mean the <em>service</em> is.</p>
<p>I wanted my OpenClaw Control UI to be reachable from my phone and laptop, but I had no intention of letting the general public—or the automated scanners that roam the internet like digital locusts—anywhere near it.</p>
<p>This is the story of how I configured <strong>Tailscale Serve</strong> to bridge that final gap, and the small collection of permissions errors I collected along the way.</p>
<h2>Serve vs. Funnel: Choose Your Fighter</h2>
<p>Tailscale gives you two primary ways to expose a local service: <strong>Serve</strong> and <strong>Funnel</strong>.</p>
<ul>
<li><strong>Serve</strong> is for internal use. It terminates HTTPS and proxies traffic, but only for devices already authenticated to your tailnet.</li>
<li><strong>Funnel</strong> is for the public internet. It’s what you use when you want to host a blog or a demo that the whole world can see.</li>
</ul>
<p>For an admin surface like OpenClaw, choosing Funnel is like leaving your front door wide open because you like the breeze. I chose Serve. I wanted the breeze, but I also wanted a locked gate.</p>
<h2>Step 1: Binding to the Void (Localhost)</h2>
<p>The first rule of secure proxying is to make sure the application itself isn’t listening to the world.</p>
<p>In my <code>~/.openclaw/openclaw.json</code>, I tightened the screws. I told the Gateway to bind specifically to <code>loopback</code>. If the traffic doesn’t come from inside the house, OpenClaw shouldn’t even hear the knock.</p>
<pre><code class="hljs language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;gateway&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    <span class="hljs-attr">&quot;mode&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;local&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;bind&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;loopback&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;port&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-number">18789</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;auth&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;mode&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;token&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">&quot;allowTailscale&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">true</span></span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;tailscale&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;mode&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;serve&quot;</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;controlUi&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;allowedOrigins&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
        <span class="hljs-string">&quot;http://127.0.0.1:18789&quot;</span><span class="hljs-punctuation">,</span>
        <span class="hljs-string">&quot;https://my-openclaw-box.tail-xyz.ts.net&quot;</span>
      <span class="hljs-punctuation">]</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span>
</code></pre>
<p>The <code>allowTailscale: true</code> flag is a nice touch—it tells OpenClaw to trust the identity headers Tailscale injects. And <code>allowedOrigins</code> is the browser’s way of making sure the UI doesn’t have a mid-life crisis when it realizes it’s being accessed via a domain name instead of <code>127.0.0.1</code>.</p>
<h2>Step 2: The “Permission Denied” Ritual</h2>
<p>I restarted OpenClaw, expected magic, and was rewarded with a very familiar kind of failure.</p>
<p>OpenClaw tried to invoke the Tailscale CLI to set up the proxy, and Tailscale responded with:</p>
<pre><code class="hljs language-text">Access denied: serve config denied
Use &#x27;sudo tailscale serve ...&#x27;
To not require root, use &#x27;sudo tailscale set --operator=$USER&#x27; once.
</code></pre>
<p>In the Linux world, <code>sudo</code> is the “I am the captain now” button. But having an application constantly asking for root just to manage a proxy felt messy. The fix was to grant my user the right to manage Tailscale settings directly:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> tailscale <span class="hljs-built_in">set</span> --operator=<span class="hljs-variable">$USER</span>
</code></pre>
<p>Once that was done, the friction disappeared.</p>
<h2>Step 3: Engaging the Proxy</h2>
<p>With permissions sorted, I could tell Tailscale to start the engine.</p>
<pre><code class="hljs language-bash">tailscale serve --<span class="hljs-built_in">bg</span> --<span class="hljs-built_in">yes</span> 18789
</code></pre>
<p>This command is doing a lot of heavy lifting behind the scenes. It’s requesting a Let’s Encrypt certificate, setting up an HTTPS listener on port 443, and pointing all that encrypted goodness at the OpenClaw Gateway sitting quietly on port 18789.</p>
<p>I verified it with the status command:</p>
<pre><code class="hljs language-bash">tailscale serve status
</code></pre>
<p>The output was exactly what I wanted to see:</p>
<pre><code class="hljs language-text">https://my-openclaw-box.tail-xyz.ts.net
|-- / proxy http://127.0.0.1:18789
</code></pre>
<h2>The “Loopback” Confusion</h2>
<p>One minor detail that might trip you up: if you run <code>openclaw gateway status</code>, it will still tell you it’s bound to <code>127.0.0.1</code>.</p>
<p>Do not panic.</p>
<p>This is correct. OpenClaw <em>is</em> still bound to loopback. It’s hiding behind Tailscale like a VIP in a booth. The fact that you can reach it via the tailnet URL is thanks to Tailscale acting as the world’s most secure bouncer.</p>
<h2>Result: Zero-Exposure Remote Access</h2>
<p>I tested this from my phone while sitting on a cellular connection (with the Tailscale app active, of course). It worked perfectly.</p>
<ul>
<li><strong>Encrypted?</strong> Yes, via Tailscale’s automatic HTTPS.</li>
<li><strong>Private?</strong> Yes, only my devices can see it.</li>
<li><strong>Simple?</strong> Once the permissions were handled, it became invisible.</li>
</ul>
<p>It’s a pattern I’m starting to use for almost everything in my lab. Keep the apps local, keep the ports closed, and let the tailnet handle the transport. It’s safer, cleaner, and involves significantly fewer sacrifices to the gods of port-forwarding.</p>
`,o={id:s,slug:a,frontmatter:e,readingTime:n,content:t};export{t as content,o as default,e as frontmatter,s as id,n as readingTime,a as slug};
