const n="2025-06-21-proxmox-wifi-saga-part-2",e="proxmox-wifi-saga-part-2",o={title:"ProxMox Wi-Fi Saga, Part 2 — The Bridge That Wasn’t",date:"2025-06-21",author:"jabez007",tags:["proxmox","wifi-setup","networking","troubleshooting","homelab","linux","nat","iptables","bridging"],excerpt:`So your Proxmox host finally has Wi-Fi. Victory, right?
You spin up your first VM… and it has no internet.
Welcome to the part where Wi-Fi reminds you it’s not Ethernet.
`,featured:!1,draft:!1},t=7,r=`<h1>Proxmox Wi-Fi Saga, Part 2 — The Bridge That Wasn’t</h1>
<p><em>Or: Why your VMs are offline even though your host is living its best life</em></p>
<p>So you followed along with Part 1.</p>
<ul>
<li>Wi-Fi works ✅</li>
<li>DNS works ✅</li>
<li><code>apt update</code> works ✅</li>
</ul>
<blockquote>
<p><strong>Wait—is your host actually stable?</strong>
If you’re finding that you have to manually run <code>dhclient</code> every time you reboot your Proxmox host, your VMs won’t have a prayer.
Make sure your host networking is rock-solid first.
See the <strong>ProxMox Wifi Appendix</strong> if you’re battling boot-time connection issues.</p>
</blockquote>
<p>You spin up a VM, ready to conquer the world…</p>
<pre><code class="hljs language-bash">ping -c 3 8.8.8.8
<span class="hljs-comment"># → Network unreachable</span>
</code></pre>
<p>…yeah. About that.</p>
<hr>
<h2>Chapter 5: The Illusion of a Working Network</h2>
<p>At first glance, everything looks fine.</p>
<p>Your Proxmox host:</p>
<ul>
<li>Has an IP address</li>
<li>Can reach the internet</li>
<li>Resolves DNS</li>
</ul>
<p>Your VM:</p>
<ul>
<li>Gets an IP (if you configured one)</li>
<li>Can see the gateway</li>
</ul>
<p>But:</p>
<pre><code class="hljs language-bash">ping 8.8.8.8
<span class="hljs-comment"># → dead silence</span>
</code></pre>
<p>No routing. No internet. No joy.</p>
<hr>
<h2>Chapter 6: The Fatal Assumption</h2>
<p>Here’s the configuration that <em>seems</em> correct:</p>
<pre><code>auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports wlo1
    bridge-stp off
    bridge-fd 0
</code></pre>
<p>If you’ve used Proxmox with Ethernet before, this feels totally normal.</p>
<p>Because normally, this works:</p>
<pre><code>VM → vmbr0 → eth0 → LAN → Internet
</code></pre>
<p>So naturally, we try:</p>
<pre><code>VM → vmbr0 → wlo1 → Wi-Fi → Internet
</code></pre>
<p>And that’s where everything breaks.</p>
<hr>
<h2>Chapter 7: Wi-Fi Is Not Ethernet (No Matter How Much We Wish It Was)</h2>
<p>Here’s the uncomfortable truth:</p>
<blockquote>
<p><strong>You can’t reliably bridge a Wi-Fi interface.</strong></p>
</blockquote>
<p>Not in the way Proxmox expects.</p>
<p>Why?</p>
<p>Because most Wi-Fi networks:</p>
<ul>
<li>Only allow <strong>one MAC address per client</strong></li>
<li>Drop frames from unknown MACs</li>
<li>Do not support true layer-2 bridging</li>
</ul>
<p>Your Proxmox host is allowed on the network.</p>
<p>Your VMs?</p>
<p>They might as well not exist.</p>
<hr>
<h2>Chapter 8: What’s Actually Happening (and why it fails)</h2>
<p>Sometimes networking clicks faster when you can <em>see</em> it.</p>
<h3>❌ The Broken Setup (Wi-Fi Bridging Attempt)</h3>
<pre><code class="hljs language-text">        ┌───────────────┐
        │     VM        │
        │ 192.168.123.10│
        │ MAC: AA:BB... │
        └───────┬───────┘
                │
            ┌───▼────┐
            │ vmbr0  │  (bridge)
            └───┬────┘
                │
            ┌───▼────┐
            │ wlo1   │  (Wi-Fi)
            │ MAC:11:22... │
            └───┬────┘
                │
        ┌───────▼────────┐
        │ Wi-Fi Router/AP│
        └────────────────┘
</code></pre>
<h3>What the router sees:</h3>
<pre><code class="hljs language-text">Incoming frame:
  Source MAC: AA:BB:CC:DD:EE:FF  (VM)

Router thinking:
  &quot;I only authenticated 11:22:33:44:55:66… who the hell is this?&quot;

→ Packet dropped
</code></pre>
<hr>
<h2>Chapter 9: The Fix — Stop Bridging, Start Routing</h2>
<p>Instead of trying to force Wi-Fi to behave like Ethernet…</p>
<p>We pivot. We turn the Proxmox host into a <strong>router</strong>.</p>
<h3>Step 1: Fix the Bridge</h3>
<p>The bridge can no longer “own” the Wi-Fi interface. We need to decouple them so the host can handle routing.</p>
<p>In your <code>/etc/network/interfaces</code>, change <code>bridge-ports wlo1</code> to <code>none</code>:</p>
<pre><code class="hljs language-bash">auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports none  <span class="hljs-comment"># &lt;--- Change this from wlo1</span>
    bridge-stp off
    bridge-fd 0
</code></pre>
<p>Now <code>vmbr0</code> is just an <strong>internal network</strong> for your VMs. It no longer tries to talk directly to the Wi-Fi hardware.</p>
<h3>Step 2: Enable IP Forwarding</h3>
<p>Routing requires the kernel to actually allow packets to move between interfaces.</p>
<p>You <em>could</em> do this manually (<code>echo 1 &gt; /proc/sys/net/ipv4/ip_forward</code>), but as you’ll see in the next step, it’s much better to let the network interface handle this automatically when it starts up.</p>
<h3>Step 3: Add NAT (The Important Bit)</h3>
<p>Here’s where the magic happens. We add the routing and NAT rules directly to the <code>vmbr0</code> configuration in <code>/etc/network/interfaces</code>.</p>
<pre><code class="hljs language-bash">auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports none
    bridge-stp off
    bridge-fd 0

    <span class="hljs-comment"># Enable IP Forwarding</span>
    post-up   <span class="hljs-built_in">echo</span> 1 &gt; /proc/sys/net/ipv4/ip_forward

    <span class="hljs-comment"># Enable NAT for VM subnet → Wi-Fi</span>
    post-up   iptables -t nat -A POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE

    <span class="hljs-comment"># Allow forwarding from VMs → Wi-Fi</span>
    post-up   iptables -A FORWARD -i vmbr0 -o wlo1 -j ACCEPT
    post-down iptables -D FORWARD -i vmbr0 -o wlo1 -j ACCEPT

    <span class="hljs-comment"># Allow return traffic back to VMs</span>
    post-up   iptables -A FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    post-down iptables -D FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
</code></pre>
<hr>
<h2>Chapter 10: What NAT Actually Does</h2>
<p>Instead of exposing your VM directly to Wi-Fi, we turn the Proxmox host into a gateway.</p>
<h3>✅ The Working Setup (NAT / Routed)</h3>
<pre><code class="hljs language-text">        ┌───────────────┐
        │     VM        │
        │ 192.168.123.10│
        └───────┬───────┘
                │
            ┌───▼────┐
            │ vmbr0  │  (internal network)
            │192.168.123.100
            └───┬────┘
                │
        ┌───────▼────────┐
        │ Proxmox Host   │
        │ (NAT happens)  │
        └───────┬────────┘
                │
            ┌───▼────┐
            │ wlo1   │ (Wi-Fi)
            └───┬────┘
                │
        ┌───────▼────────┐
        │ Wi-Fi Router/AP│
        └────────────────┘
</code></pre>
<h3>What the router sees now:</h3>
<pre><code class="hljs language-text">Source IP: your-laptop-ip
Source MAC: your-laptop-mac

Router thinking:
  &quot;Ah yes, my good and trusted laptop. Proceed.&quot;
</code></pre>
<hr>
<h2>Chapter 11: VM Configuration</h2>
<p>Without DHCP (for now), your VM needs:</p>
<pre><code>IP Address: 192.168.123.10
Gateway:    192.168.123.100
DNS:        8.8.8.8
</code></pre>
<p>Then:</p>
<pre><code class="hljs language-bash">ping -c 3 8.8.8.8
ping -c 3 google.com
</code></pre>
<p>If both work: 🎉 You’re done.</p>
<hr>
<h2>Final <code>/etc/network/interfaces</code> Configuration</h2>
<p>Here’s the full working config using NAT and <code>post-up</code> / <code>post-down</code>.</p>
<pre><code class="hljs language-bash">auto lo
iface lo inet loopback

auto wlo1
iface wlo1 inet dhcp
    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf

auto vmbr0
iface vmbr0 inet static
    address 192.168.123.100/24
    bridge-ports none
    bridge-stp off
    bridge-fd 0

    <span class="hljs-comment"># Enable IP Forwarding</span>
    post-up   <span class="hljs-built_in">echo</span> 1 &gt; /proc/sys/net/ipv4/ip_forward

    <span class="hljs-comment"># Enable NAT for VM subnet → Wi-Fi</span>
    post-up   iptables -t nat -A POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s 192.168.123.0/24 -o wlo1 -j MASQUERADE

    <span class="hljs-comment"># Allow forwarding from VMs → Wi-Fi</span>
    post-up   iptables -A FORWARD -i vmbr0 -o wlo1 -j ACCEPT
    post-down iptables -D FORWARD -i vmbr0 -o wlo1 -j ACCEPT

    <span class="hljs-comment"># Allow return traffic back to VMs</span>
    post-up   iptables -A FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    post-down iptables -D FORWARD -i wlo1 -o vmbr0 -m state --state RELATED,ESTABLISHED -j ACCEPT
</code></pre>
<hr>
<h2>The “Automated” Gotcha: IP Forwarding</h2>
<p>You might see other guides recommending manual <code>echo</code> commands or editing <code>/etc/sysctl.conf</code>. Those work, but they are easy to forget after a reboot or a reconfiguration.</p>
<p>By adding <code>post-up echo 1 &gt; /proc/sys/net/ipv4/ip_forward</code> directly to the interface config, we ensure the routing engine only turns on when our bridge is active. It’s cleaner, safer, and self-healing.</p>
<p>If things still aren’t working, run this to verify:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">cat</span> /proc/sys/net/ipv4/ip_forward
</code></pre>
<p>If it returns <code>0</code>, the interface didn’t trigger correctly or another process overrode it.</p>
<hr>
<h2>Optional Sanity Check</h2>
<p>On the host:</p>
<pre><code class="hljs language-bash">iptables -t nat -L -n -v
</code></pre>
<p>You should see your <code>MASQUERADE</code> rule with packet counters increasing when VMs generate traffic.</p>
<hr>
<h2>Mental Model to Keep</h2>
<p>If you remember nothing else from this post, remember this:</p>
<pre><code class="hljs language-text">Wi-Fi = one identity
VMs   = many identities

→ Conflict

NAT = disguise all VMs as the host

→ Problem solved
</code></pre>
<hr>
<h2>The Trade-Offs</h2>
<p>Nothing is free in networking.</p>
<p>With NAT:</p>
<h3>✅ Pros</h3>
<ul>
<li>Works reliably on Wi-Fi</li>
<li>No driver hacks</li>
<li>No weird bridge behavior</li>
<li>Predictable</li>
</ul>
<h3>❌ Cons</h3>
<ul>
<li>VMs are <strong>not directly visible on your LAN</strong></li>
<li>Incoming connections require port forwarding</li>
<li>Slightly more setup</li>
</ul>
<hr>
<h2>The Big Lesson</h2>
<p>This whole issue boils down to one incorrect assumption:</p>
<blockquote>
<p>“If it works with Ethernet, it should work with Wi-Fi.”</p>
</blockquote>
<p>It doesn’t. And Proxmox doesn’t warn you—it just lets you fall into the trap.</p>
<hr>
<h2>The Victory Lap (Again)</h2>
<p>With NAT in place:</p>
<ul>
<li>VMs have internet ✅</li>
<li>Host networking remains clean ✅</li>
<li>No more silent packet drops ✅</li>
</ul>
<p>Your Proxmox laptop is now:</p>
<blockquote>
<p>a fully functional, slightly janky, but totally awesome mobile hypervisor.</p>
</blockquote>
<hr>
<h2>What’s Next?</h2>
<p>In the next post, I’ll probably:</p>
<ul>
<li>Add DHCP with <code>dnsmasq</code></li>
<li>Clean up VM provisioning</li>
<li>Maybe make this setup actually pleasant to use</li>
</ul>
<p>But for now? You’ve solved the hardest part.</p>
<hr>
<p><em>And all it took was learning that Wi-Fi has trust issues.</em></p>
`,s={id:n,slug:e,frontmatter:o,readingTime:t,content:r};export{r as content,s as default,o as frontmatter,n as id,t as readingTime,e as slug};
