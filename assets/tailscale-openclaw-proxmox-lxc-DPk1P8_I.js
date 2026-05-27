const e="2026-05-16-tailscale-openclaw-proxmox-lxc",a="tailscale-openclaw-proxmox-lxc",n={title:"Tailscale, OpenClaw, and the Missing Tunnel Device",date:"2026-05-16",author:"jabez007",tags:["tailscale","openclaw","proxmox","lxc","homelab","vpn","networking","troubleshooting","linux"],excerpt:`I wanted private remote access to my OpenClaw box without exposing the gateway to the internet. Tailscale looked like the obvious answer. Then my Proxmox LXC reminded me that containers and networking devices have opinions.
`,featured:!1,draft:!1},t=9,s=`<h1>Tailscale, OpenClaw, and the Missing Tunnel Device</h1>
<p>There is a very particular kind of optimism that appears right before a homelab networking task goes sideways.</p>
<p>It starts with a reasonable goal.</p>
<blockquote>
<p>I want to access this service remotely, securely, and without exposing random ports to the internet like some sort of dashboard-shaped sacrifice to Shodan.</p>
</blockquote>
<p>That was the goal here.</p>
<p>I had an OpenClaw instance running inside a Proxmox LXC. OpenClaw was already set up as my personal AI-agent gateway, and I wanted a better way to reach it privately from my other machines. No public endpoint. No router port forwarding. No Cloudflare Tunnel. No “it is probably fine because there is a token on it” nonsense.</p>
<p>Enter Tailscale.</p>
<p>Tailscale is one of those tools that feels almost suspiciously convenient: install it on a few devices, authenticate them into the same private tailnet, and suddenly those devices can talk to each other over a WireGuard-backed private network without the usual VPN ceremony.</p>
<p>For my OpenClaw setup, that sounded perfect.</p>
<p>The intended shape was simple:</p>
<pre><code class="hljs language-text">Laptop / desktop / phone
        |
        | Tailscale tailnet
        v
OpenClaw LXC on Proxmox
        |
        v
OpenClaw gateway bound privately
</code></pre>
<p>No public internet exposure. No inbound router rules. No eldritch port-forwarding ritual.</p>
<p>Naturally, the first attempt exploded.</p>
<h2>The Tailscale setup</h2>
<p>I started from the Tailscale dashboard using the <strong>Add Linux server</strong> flow.</p>
<p>For the auth key, I made a few deliberate choices:</p>
<ul>
<li>I used tags for the server.</li>
<li>I left <strong>Ephemeral</strong> off.</li>
<li>I left <strong>Use as Exit Node</strong> off.</li>
<li>I left <strong>Reusable</strong> off.</li>
</ul>
<p>That combination made sense for this machine.</p>
<p>This OpenClaw LXC is not a throwaway CI runner or temporary test container, so it should not be ephemeral. I also did not want it acting as an exit node. The goal was to reach OpenClaw privately, not route all my laptop traffic through this box like a bargain-bin commercial VPN.</p>
<p>I also did not need a reusable auth key. One server, one key, one join operation. Reusable auth keys are convenient, but if one leaks, congratulations, you may have invented an enrollment portal for future regrets.</p>
<p>The tags were useful because this machine is better thought of as infrastructure than as “my personal laptop.” In Tailscale terms, tags make it easier to write ACLs around machine roles later.</p>
<p>So far, so good.</p>
<p>Then I installed Tailscale in the OpenClaw LXC and checked the service.</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl status tailscaled
</code></pre>
<p>And systemd responded with the traditional Linux equivalent of a shrug and a corpse.</p>
<pre><code class="hljs language-text">× tailscaled.service - Tailscale node agent
     Loaded: loaded (/usr/lib/systemd/system/tailscaled.service; enabled; preset: enabled)
     Active: failed (Result: exit-code)
...
     Main PID: ... (code=exited, status=1/FAILURE)
...
systemd[1]: tailscaled.service: Start request repeated too quickly.
systemd[1]: tailscaled.service: Failed with result &#x27;exit-code&#x27;.
systemd[1]: Failed to start tailscaled.service - Tailscale node agent
</code></pre>
<p>That output is useful in the same way a smoke alarm is useful. It tells you there is a problem. It does not tell you which appliance has achieved sentience and chosen violence.</p>
<p>So the next step was to ask the daemon what actually happened.</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> journalctl -u tailscaled -n 100 --no-pager
</code></pre>
<p>The relevant part was this:</p>
<pre><code class="hljs language-text">tailscaled: Linux kernel version: 6.8.12-20-pve
tailscaled: is CONFIG_TUN enabled in your kernel? \`modprobe tun\` failed with: modprobe: FATAL: Module tun not found in directory /lib/modules/6.8.12-20-pve
tailscaled: tun module not loaded nor found on disk
tailscaled: wgengine.NewUserspaceEngine(tun &quot;tailscale0&quot;) error: tstun.New(&quot;tailscale0&quot;): CreateTUN(&quot;tailscale0&quot;) failed; /dev/net/tun does not exist
tailscaled: getLocalBackend error: createEngine: tstun.New(&quot;tailscale0&quot;): CreateTUN(&quot;tailscale0&quot;) failed; /dev/net/tun does not exist
</code></pre>
<p>And then the container gave the final clue:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">ls</span> -l /dev/net/tun
</code></pre>
<pre><code class="hljs language-text">ls: cannot access &#x27;/dev/net/tun&#x27;: No such file or directory
</code></pre>
<p>There it was.</p>
<p>Tailscale was installed correctly. The service was being started correctly. The problem was that the LXC did not have access to the TUN device.</p>
<h2>The actual problem: <code>/dev/net/tun</code></h2>
<p>Tailscale needs a TUN device to create its network interface. On a normal Linux machine, this is usually boring and invisible. On a Proxmox LXC, especially an unprivileged container, that device may not be available inside the container unless you explicitly allow it.</p>
<p>That is what was happening here.</p>
<p>Inside the container, <code>tailscaled</code> tried to create the <code>tailscale0</code> interface. It looked for <code>/dev/net/tun</code>. The device was missing. Then it tried to be helpful and mentioned <code>modprobe tun</code>, but that was a bit of a red herring inside the container.</p>
<p>The LXC is using the Proxmox host kernel. The container does not have its own kernel modules in the normal VM sense. So “module not found in <code>/lib/modules/...</code>” inside the container is not necessarily the real fix path.</p>
<p>The real fix was to expose the host TUN device into the container.</p>
<h2>Fixing the Proxmox LXC config</h2>
<p>This part has to be done on the <strong>Proxmox host</strong>, not inside the OpenClaw container.</p>
<p>First, find the container ID:</p>
<pre><code class="hljs language-bash">pct list
</code></pre>
<p>Then stop the container:</p>
<pre><code class="hljs language-bash">pct stop &lt;CTID&gt;
</code></pre>
<p>Next, edit the LXC config:</p>
<pre><code class="hljs language-bash">nano /etc/pve/lxc/&lt;CTID&gt;.conf
</code></pre>
<p>I added these lines:</p>
<pre><code class="hljs language-text">lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
</code></pre>
<p>Then I started the container again:</p>
<pre><code class="hljs language-bash">pct start &lt;CTID&gt;
</code></pre>
<p>Those two lines are the magic here.</p>
<pre><code class="hljs language-text">lxc.cgroup2.devices.allow: c 10:200 rwm
</code></pre>
<p>This allows the container to access the character device with major/minor numbers <code>10:200</code>, which corresponds to <code>/dev/net/tun</code>.</p>
<pre><code class="hljs language-text">lxc.mount.entry: /dev/net dev/net none bind,create=dir
</code></pre>
<p>This bind-mounts <code>/dev/net</code> from the host into the container, creating the target directory if needed.</p>
<p>After that, inside the container:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">ls</span> -l /dev/net/tun
</code></pre>
<p>should show something like:</p>
<pre><code class="hljs language-text">crw-rw-rw- 1 root root 10, 200 ... /dev/net/tun
</code></pre>
<p>At that point, Tailscale could finally create its tunnel interface.</p>
<h2>Restarting Tailscale</h2>
<p>Back inside the OpenClaw LXC, I reset the failed systemd state and started the service again:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl reset-failed tailscaled
<span class="hljs-built_in">sudo</span> systemctl start tailscaled
<span class="hljs-built_in">sudo</span> systemctl status tailscaled
</code></pre>
<p>This time, progress:</p>
<pre><code class="hljs language-text">● tailscaled.service - Tailscale node agent
     Loaded: loaded (/usr/lib/systemd/system/tailscaled.service; enabled; preset: enabled)
     Active: active (running)
     Status: &quot;Needs login: &quot;
</code></pre>
<p>At first glance, <code>Needs login</code> can look like another error.</p>
<p>It is not.</p>
<p>It means the daemon is now running successfully, but the machine has not joined the tailnet yet.</p>
<p>The logs also included this:</p>
<pre><code class="hljs language-text">health(warnable=wantrunning-false): error: Tailscale is stopped.
</code></pre>
<p>Again, not the same problem as before. This is Tailscale saying the daemon exists, but the client state has not been brought up yet.</p>
<p>The fix was simply:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> tailscale up
</code></pre>
<p>That produced the normal browser-based login flow. After authenticating, the OpenClaw box appeared in the Tailscale dashboard.</p>
<p>Victory.</p>
<p>Or, at least, the kind of victory where the service works and only a modest amount of sanity has been consumed.</p>
<h2>Verifying the setup</h2>
<p>Once Tailscale was authenticated, I checked the node from inside the LXC:</p>
<pre><code class="hljs language-bash">tailscale status
</code></pre>
<p>and:</p>
<pre><code class="hljs language-bash">tailscale ip -4
</code></pre>
<p>The second command should return a <code>100.x.y.z</code> Tailscale IP.</p>
<p>From another machine on the same tailnet, useful checks are:</p>
<pre><code class="hljs language-bash">tailscale ping &lt;openclaw-hostname&gt;
</code></pre>
<p>and, if SSH access is enabled:</p>
<pre><code class="hljs language-bash">ssh molty@&lt;openclaw-hostname&gt;
</code></pre>
<p>Depending on MagicDNS and the machine name, the hostname may be the short machine name or the full Tailscale DNS name shown in the dashboard.</p>
<h2>The OpenClaw goal</h2>
<p>Getting Tailscale running was only the network plumbing part. The actual goal was to make OpenClaw available privately.</p>
<p>For that, the setup I want is:</p>
<pre><code class="hljs language-text">OpenClaw gateway binds to loopback
Tailscale provides private access through the tailnet
No public port forwarding
No public Funnel unless explicitly needed
</code></pre>
<p>The rough OpenClaw configuration shape is:</p>
<pre><code class="hljs language-js">{
  <span class="hljs-attr">gateway</span>: {
    <span class="hljs-attr">bind</span>: <span class="hljs-string">&quot;loopback&quot;</span>,
    <span class="hljs-attr">tailscale</span>: { <span class="hljs-attr">mode</span>: <span class="hljs-string">&quot;serve&quot;</span> }
  }
}
</code></pre>
<p>Or from the CLI:</p>
<pre><code class="hljs language-bash">openclaw gateway --tailscale serve
</code></pre>
<p>The important distinction is <strong>Serve</strong> versus <strong>Funnel</strong>.</p>
<p>Tailscale Serve exposes a local service to devices inside the tailnet. That is what I want here.</p>
<p>Tailscale Funnel exposes a local service to the public internet through a Tailscale-provided URL. That may be useful for some workflows, but it is explicitly not my default goal for OpenClaw. I did not go through this entire exercise just to reinvent “public dashboard with extra steps.”</p>
<p>For this setup, the target state is:</p>
<pre><code class="hljs language-text">OpenClaw Gateway: private
Tailscale: private network layer
Router port forwards: none
Public Funnel: off
SSH: available only through Tailscale, if enabled
</code></pre>
<h2>Troubleshooting summary</h2>
<p>The initial symptom:</p>
<pre><code class="hljs language-text">tailscaled.service failed with exit-code
Start request repeated too quickly
</code></pre>
<p>The useful diagnostic command:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> journalctl -u tailscaled -n 100 --no-pager
</code></pre>
<p>The real error:</p>
<pre><code class="hljs language-text">CreateTUN(&quot;tailscale0&quot;) failed; /dev/net/tun does not exist
</code></pre>
<p>The confirmation:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">ls</span> -l /dev/net/tun
</code></pre>
<p>Bad result:</p>
<pre><code class="hljs language-text">No such file or directory
</code></pre>
<p>The Proxmox LXC fix, added to <code>/etc/pve/lxc/&lt;CTID&gt;.conf</code> on the Proxmox host:</p>
<pre><code class="hljs language-text">lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
</code></pre>
<p>Then restart the container:</p>
<pre><code class="hljs language-bash">pct stop &lt;CTID&gt;
pct start &lt;CTID&gt;
</code></pre>
<p>Restart Tailscale inside the container:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl reset-failed tailscaled
<span class="hljs-built_in">sudo</span> systemctl start tailscaled
<span class="hljs-built_in">sudo</span> systemctl status tailscaled
</code></pre>
<p>If the status says this:</p>
<pre><code class="hljs language-text">Status: &quot;Needs login: &quot;
</code></pre>
<p>then the daemon is working. Finish the join process:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> tailscale up
</code></pre>
<p>Then verify:</p>
<pre><code class="hljs language-bash">tailscale status
tailscale ip -4
</code></pre>
<h2>Final thoughts</h2>
<p>This was not really an OpenClaw problem. OpenClaw was just the reason I was installing Tailscale in the first place.</p>
<p>The actual issue was the classic container tradeoff: LXCs are lightweight because they share the host kernel, but that also means some things that feel automatic on a VM or bare-metal Linux box need to be explicitly passed through.</p>
<p>In this case, Tailscale needed <code>/dev/net/tun</code>, and the container did not have it.</p>
<p>Once the TUN device was exposed to the LXC, <code>tailscaled</code> started normally. Then <code>sudo tailscale up</code> joined the machine to the tailnet, and the OpenClaw box appeared in the Tailscale dashboard.</p>
<p>So the final lesson is simple:</p>
<blockquote>
<p>If Tailscale fails inside a Proxmox LXC, check <code>/dev/net/tun</code> before you start blaming DNS, auth keys, OAuth, systemd, OpenClaw, or the alignment of the networking planets.</p>
</blockquote>
<p>Because sometimes the VPN is not broken.</p>
<p>Sometimes the tunnel is just missing.</p>
`,l={id:e,slug:a,frontmatter:n,readingTime:t,content:s};export{s as content,l as default,n as frontmatter,e as id,t as readingTime,a as slug};
