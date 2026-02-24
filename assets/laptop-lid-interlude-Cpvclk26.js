const e="2025-06-17-laptop-lid-interlude",o="laptop-lid-interlude",t={title:"Laptop Lid Interlude",date:"2025-06-17",author:"jabez007",tags:["proxmox","homelab","laptop-server","linux-power-management","logind"],excerpt:`So you've got Proxmox humming along on your repurposed laptop — WiFi configured, VMs ready to spin up, and everything looking great.
Then you close the lid to tuck it away in its new home as a headless server, and... _poof_ 💤
`,featured:!1,draft:!1},n=3,s=`<h1>Addendum: Keep Your Proxmox Laptop Awake (Because Sleeping Servers Are Useless Servers)</h1>
<p>So you’ve got Proxmox humming along on your repurposed laptop — WiFi configured, VMs ready to spin up, and everything looking great.
Then you close the lid to tuck it away in its new home as a headless server, and… <em>poof</em> 💤</p>
<p>Your shiny new hypervisor just took a nap.</p>
<h2>😴 The Laptop Dilemma</h2>
<p>Here’s the thing about laptops: they’re <em>designed</em> to be portable.
That means they come with all sorts of power-saving behaviors baked in — like going to sleep the moment you close the lid.
It’s great when you’re actually using it as a laptop, but terrible when you’re trying to run a 24/7 server.</p>
<p>By default, your Linux-based Proxmox system will:</p>
<ul>
<li>Suspend or sleep when the lid closes</li>
<li>Potentially disable WiFi, USB, and other subsystems during suspend</li>
<li>Leave you wondering why you can’t SSH in from your main machine</li>
</ul>
<p>Not exactly server behavior, right?</p>
<h2>🛠️ The Simple Fix</h2>
<p>Fortunately, this is one of those problems that sounds scarier than it actually is.
We just need to tell the system to ignore the lid completely using systemd’s power management configuration.</p>
<h3>Step 1: Edit the Configuration</h3>
<p>Open up the logind configuration file:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> nano /etc/systemd/logind.conf
</code></pre>
<h3>Step 2: Configure Lid Behavior</h3>
<p>Find these lines in the file (they might be commented out with <code>#</code>):</p>
<pre><code class="hljs language-bash">HandleLidSwitch=ignore
HandleLidSwitchDocked=ignore
HandleLidSwitchExternalPower=ignore
</code></pre>
<p>If they’re commented out, remove the <code>#</code> symbol.
If they don’t exist, add them to the <code>[Login]</code> section.
Setting all three to <code>ignore</code> ensures your laptop stays awake whether it’s plugged in, running on battery, or docked.</p>
<h3>Step 3: Apply the Changes</h3>
<p>Restart the systemd-logind service to pick up the new configuration:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl restart systemd-logind
</code></pre>
<p>That’s it! Your laptop will now completely ignore lid events and keep running like the dedicated server it’s become.</p>
<h2>🎯 Testing Your Success</h2>
<p>Want to make sure it worked? Here are a few ways to verify:</p>
<p><strong>The SSH Test</strong>: Close the lid, then try SSH-ing into your Proxmox host from another machine:</p>
<pre><code class="hljs language-bash">ssh root@your-proxmox-ip
</code></pre>
<p><strong>The Web Interface Test</strong>: With the lid closed, open a browser on another device and navigate to your Proxmox web interface at <code>https://your-proxmox-ip:8006</code></p>
<p><strong>The Log Monitor</strong>: Before closing the lid, run this command to watch system logs in real-time:</p>
<pre><code class="hljs language-bash">journalctl -f
</code></pre>
<p>Then close the lid — you should see normal system activity continue without any suspend/resume messages.</p>
<h2>🚀 What This Means for Your Setup</h2>
<p>Now that your laptop stays awake with the lid closed, you have the flexibility to:</p>
<ul>
<li><strong>Tuck it away neatly</strong> — slide it behind your router, under a desk, or wherever makes sense for your setup</li>
<li><strong>Access it remotely</strong> — SSH in for command-line management or use the web interface for VM administration</li>
<li><strong>Run it truly headless</strong> — no need to keep it open or connected to a monitor</li>
</ul>
<p>Your old laptop has officially completed its transformation from portable computer to dedicated virtualization server.
The best part?
It’ll stay that way, quietly humming along whether the lid is open or closed.</p>
<h2>💡 Pro Tip</h2>
<p>If you ever need to temporarily re-enable lid-based suspend (maybe you want to use it as a laptop again), just change those <code>ignore</code> values back to <code>suspend</code> and restart the logind service. Your Proxmox configuration will remain intact, ready for when you want to switch back to server mode.</p>
`,a={id:e,slug:o,frontmatter:t,readingTime:n,content:s};export{s as content,a as default,t as frontmatter,e as id,n as readingTime,o as slug};
