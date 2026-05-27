const s="2026-04-12-fixing-local-hostname-resolution",e="fixing-local-hostname-resolution",n={title:"DNS Hijacking for Local Hostname Resolution",date:"2026-04-12",author:"jabez007",tags:["dns","networking","expressvpn","asus-router","dnsmasq","bash-scripting","troubleshooting","homelab"],excerpt:`If you're running a VPN on your router, local hostnames often stop working. 
ExpressVPN's firmware isolates DNS traffic so strictly that local resolution 
is sacrificed for privacy. Here is how I used a persistence script to 
force local resolution without leaking my external DNS traffic.
`,featured:!0,draft:!1},a=6,t=`<h1>Fixing Local Hostname Resolution on VPN-Enabled Asus Routers</h1>
<p>If you’re running a VPN on your router—specifically an Asus router with ExpressVPN firmware—you’ve probably realized that local hostnames stop working the moment a device joins a tunnel. You can ping the IP, but <code>ssh server.local</code> returns a cold <code>NXDOMAIN</code>.</p>
<p>The router hasn’t forgotten the names; it’s just being too “secure” for its own good. ExpressVPN’s firmware isolates DNS traffic so strictly that local resolution is sacrificed to prevent leaks. It’s a trade-off that makes sense for privacy but breaks everything in a homelab.</p>
<p>Here is how I forced the router to prioritize local resolution without leaking my external DNS traffic.</p>
<h2>The Culprit: Too Many <code>dnsmasq</code> Instances</h2>
<p>Under normal conditions, a router’s <code>dnsmasq</code> instance acts as both a DHCP server and a local DNS resolver. It records the hostnames of devices it hands IPs to and resolves them when asked.</p>
<p>On ExpressVPN firmware, this is replaced by <strong>Policy-Based Routing (PBR)</strong>. Instead of one global <code>dnsmasq</code> process, the router spawns multiple instances:</p>
<ul>
<li><strong>The Primary Instance</strong>: This is the only one that knows your local device names, but it only responds to requests from the router itself.</li>
<li><strong>The Tunnel Instances</strong>: Each VPN tunnel gets its own <code>dnsmasq</code> process. These handle traffic for any device assigned to that tunnel.</li>
</ul>
<p>The “smoking gun” is that these tunnel instances are launched with the <code>-n</code> (no-hosts) flag. This explicitly tells <code>dnsmasq</code> to ignore local hostnames. The moment you put a device behind a VPN tunnel, it’s effectively told: “If you want to resolve a name, go ask the internet.” Since the internet doesn’t know what <code>proxmox-01</code> is, you get an <code>NXDOMAIN</code>.</p>
<h2>Forcing a DNS Chain of Command</h2>
<p>Since modifying the VPN binary’s launch flags is difficult, the next best thing is to rewrite the configuration files on the fly. We need the tunnel instances to check with the router’s primary IP before heading out to the public internet.</p>
<h3>1. The Injector Script</h3>
<p>This script iterates through the temporary resolver files for every tunnel and prepends the router’s local IP as the primary nameserver. Save this to <code>/jffs/scripts/dns_chain.sh</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/sh</span>
<span class="hljs-comment"># /jffs/scripts/dns_chain.sh</span>
<span class="hljs-comment"># Prepend the router&#x27;s IP as the primary resolver for all VPN tunnels</span>

TARGETS=<span class="hljs-string">&quot;/tmp/resolv.dnsmasq /tmp/resolv.*.conf&quot;</span>
LOCAL_IP=<span class="hljs-string">&quot;192.168.1.1&quot;</span> <span class="hljs-comment"># Change this if your router is on a different IP</span>

CHANGED=0
<span class="hljs-keyword">for</span> f <span class="hljs-keyword">in</span> <span class="hljs-variable">$TARGETS</span>; <span class="hljs-keyword">do</span>
    <span class="hljs-keyword">if</span> [ -f <span class="hljs-string">&quot;<span class="hljs-variable">$f</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
        <span class="hljs-comment"># Check if local IP is already the primary nameserver</span>
        <span class="hljs-keyword">if</span> ! <span class="hljs-built_in">head</span> -n 1 <span class="hljs-string">&quot;<span class="hljs-variable">$f</span>&quot;</span> | grep -qE <span class="hljs-string">&quot;^nameserver[[:space:]]+$LOCAL_IP$&quot;</span>; <span class="hljs-keyword">then</span>
            sed -i <span class="hljs-string">&quot;/^nameserver[[:space:]]\\{1,\\}$LOCAL_IP$/d&quot;</span> <span class="hljs-string">&quot;<span class="hljs-variable">$f</span>&quot;</span> <span class="hljs-comment"># Remove existing entries</span>
            sed -i <span class="hljs-string">&quot;1i nameserver <span class="hljs-variable">$LOCAL_IP</span>&quot;</span> <span class="hljs-string">&quot;<span class="hljs-variable">$f</span>&quot;</span> <span class="hljs-comment"># Add to the top of the list</span>
            CHANGED=1
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">fi</span>
<span class="hljs-keyword">done</span>

<span class="hljs-comment"># Restart dnsmasq to reload configs if modified</span>
<span class="hljs-keyword">if</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">$CHANGED</span>&quot;</span> -eq 1 ]; <span class="hljs-keyword">then</span>
    killall -HUP dnsmasq
<span class="hljs-keyword">fi</span>
</code></pre>
<h3>2. The Persistence Daemon</h3>
<p>The firmware frequently overwrites these resolver files whenever a VPN tunnel restarts or reconnects. We need a background process that acts as a watchdog, reapplying the fix periodically. Save this to <code>/jffs/scripts/dns_daemon.sh</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/sh</span>
<span class="hljs-comment"># /jffs/scripts/dns_daemon.sh</span>
PID_FILE=<span class="hljs-string">&quot;/tmp/dns_fix.pid&quot;</span>

<span class="hljs-comment"># Exit if an instance is already running</span>
<span class="hljs-keyword">if</span> [ -f <span class="hljs-string">&quot;<span class="hljs-variable">$PID_FILE</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
    PID=$(<span class="hljs-built_in">cat</span> <span class="hljs-string">&quot;<span class="hljs-variable">$PID_FILE</span>&quot;</span>)
    <span class="hljs-comment"># Verify PID is numeric and the process is alive</span>
    <span class="hljs-keyword">if</span> <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-variable">$PID</span>&quot;</span> | grep -qE <span class="hljs-string">&quot;^[0-9]+$&quot;</span> &amp;&amp; <span class="hljs-built_in">kill</span> -0 <span class="hljs-string">&quot;<span class="hljs-variable">$PID</span>&quot;</span> 2&gt;/dev/null; <span class="hljs-keyword">then</span>
        <span class="hljs-keyword">if</span> grep -q <span class="hljs-string">&quot;dns_daemon.sh&quot;</span> <span class="hljs-string">&quot;/proc/<span class="hljs-variable">$PID</span>/cmdline&quot;</span> 2&gt;/dev/null; <span class="hljs-keyword">then</span>
            <span class="hljs-built_in">exit</span> 0
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">fi</span>
    <span class="hljs-comment"># Stale PID file, non-numeric, or wrong process</span>
    <span class="hljs-built_in">rm</span> -f <span class="hljs-string">&quot;<span class="hljs-variable">$PID_FILE</span>&quot;</span>
<span class="hljs-keyword">fi</span>

<span class="hljs-built_in">echo</span> $$ &gt; <span class="hljs-string">&quot;<span class="hljs-variable">$PID_FILE</span>&quot;</span>
logger <span class="hljs-string">&quot;DNS Fix: Monitoring script started.&quot;</span>

<span class="hljs-keyword">while</span> [ -x <span class="hljs-string">&quot;/jffs/scripts/dns_chain.sh&quot;</span> ]; <span class="hljs-keyword">do</span>
    /jffs/scripts/dns_chain.sh
    <span class="hljs-built_in">sleep</span> 120 <span class="hljs-comment"># Run every 2 minutes</span>
<span class="hljs-keyword">done</span>
</code></pre>
<p>Make them executable:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">chmod</span> +x /jffs/scripts/*.sh
</code></pre>
<h2>Persistence and NVRAM</h2>
<p>To make this change survive a reboot, we need to add the script to the router’s startup sequence using <code>nvram</code>.</p>
<blockquote>
<p>[!WARNING]
Using <code>nvram set rc_startup</code> will overwrite any existing startup commands. Always run <code>nvram get rc_startup</code> first to see if you already have a script defined. If so, you must combine the existing value with our new command before running <code>nvram set rc_startup</code> and <code>nvram commit</code>.</p>
</blockquote>
<p>Check your current startup configuration:</p>
<pre><code class="hljs language-bash">nvram get rc_startup
</code></pre>
<p>If the value is empty, you can set it directly. If it’s not, append the new command (separated by a semicolon) to the existing string:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Example of appending to an existing rc_startup</span>
nvram <span class="hljs-built_in">set</span> rc_startup=<span class="hljs-string">&quot;&lt;existing_commands&gt;; sleep 20; [ -x /jffs/scripts/dns_daemon.sh ] &amp;&amp; /jffs/scripts/dns_daemon.sh &amp;&quot;</span>
nvram commit
</code></pre>
<h2>How the DNS Request Now Flows</h2>
<p>This setup creates a fallback mechanism that prioritizes local names without sacrificing privacy:</p>
<ol>
<li><strong>Request</strong>: A device in a VPN tunnel asks for <code>nas-01.local</code>.</li>
<li><strong>The Intercept</strong>: The tunnel’s <code>dnsmasq</code> instance sees the router’s IP (<code>192.168.1.1</code>) at the top of its nameserver list and queries it.</li>
<li><strong>Local Resolution</strong>: The router’s primary instance (which has access to the DHCP lease table) resolves the request.</li>
<li><strong>Privacy</strong>: If you query <code>google.com</code>, the primary instance can’t resolve it. The tunnel instance then moves to the next nameserver in the list—the secure, external VPN DNS.</li>
</ol>
<h2>Final Results</h2>
<p>Since I started running this script, local hostnames have been working perfectly across every device in the network. There’s no more typing IPs for SSH, and I don’t have to worry about the firmware overwriting my changes because the watchdog script catches it within a couple of minutes.</p>
<p>It’s one of those “set and forget” fixes that makes the whole homelab experience significantly less annoying. Now, if only I could figure out why I have three different versions of <code>docker-compose</code> on my main server…</p>
<p>A few parting notes if you try this:</p>
<ul>
<li><strong>Check your logs</strong>: If you suspect the daemon isn’t running, <code>grep &quot;DNS Fix&quot; /tmp/var/log/messages</code> will show you if it started correctly.</li>
<li><strong>Static DHCP</strong>: Even with this fix, you should still set a DHCP reservation for your critical servers in the router’s Web UI. It saves you from having to troubleshoot “ghost” resolution issues if a device’s IP changes.</li>
<li><strong>Boot Time</strong>: Remember that it takes 20 seconds for the script to kick in after a reboot. If you test local resolution the moment the router is up, it will probably fail. Just wait a minute.</li>
</ul>
<p>Hopefully, this saves someone else the headache of manually typing IP addresses for their entire homelab.</p>
`,o={id:s,slug:e,frontmatter:n,readingTime:a,content:t};export{t as content,o as default,n as frontmatter,s as id,a as readingTime,e as slug};
