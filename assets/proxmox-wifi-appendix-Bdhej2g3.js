const e="2025-06-15-proxmox-wifi-appendix",t="proxmox-wifi-appendix",n={title:"Appendix: Boot-Time Wi-Fi and DHCP with systemd",date:"2025-06-15",author:"jabez007",tags:["proxmox","wifi","systemd","dhcp","networking","linux"],excerpt:`Even after resolving the DNS and routing issues, I noticed that my Wi-Fi interface wasn’t getting a DHCP lease automatically on reboot. 
This is a common issue on server systems where wpa_supplicant and dhclient aren't properly sequenced at boot.
`,featured:!1,draft:!1},o=3,a=`<h1>Appendix: Boot-Time Wi-Fi and DHCP with systemd</h1>
<p>Even after resolving the DNS and routing issues, I noticed a lingering frustration: <strong>my Wi-Fi interface wasn’t getting a DHCP lease automatically on reboot.</strong></p>
<p>I found myself running <code>dhclient wlo1</code> manually every time I logged in. It worked, but it was a manual step in a world that should be automated.</p>
<h2>🤔 The Root of the Race Condition</h2>
<p>On server systems like Proxmox, the legacy <code>/etc/network/interfaces</code> setup can’t always guarantee the sequence we need:</p>
<ol>
<li><code>wpa_supplicant</code> must run before DHCP.</li>
<li>The Wi-Fi hardware must actually <em>finish</em> connecting to the AP before <code>dhclient</code> asks for an IP.</li>
</ol>
<p>When these things happen out of order, you get a “successful” boot with no internet.</p>
<h2>⚠️ Step 0: The “ifupdown” Cleanse</h2>
<p>If you followed the manual steps in the <strong>ProxMox Wi-Fi Saga</strong> post, you likely have entries like <code>auto wlo1</code> and <code>iface wlo1 inet dhcp</code> in your <code>/etc/network/interfaces</code> file. To move to this more reliable systemd method, you must first migrate away from the traditional <code>ifupdown</code> tool.</p>
<p>First, we have to stop the fighting. If <code>wlo1</code> is marked <code>auto</code> in <code>/etc/network/interfaces</code>, the system will try to configure it during early boot using <code>ifupdown</code>.</p>
<p>If you are moving to the systemd approach below, <strong>remove or comment out the <code>auto wlo1</code> and <code>iface wlo1</code> lines</strong> for your Wi-Fi interface.</p>
<blockquote>
<p><strong>Why?</strong> Because you can’t have two different subsystems (ifupdown and systemd) trying to hold the steering wheel at the same time. It leads to race conditions, conflicting state management, and logs that look like a crime scene.</p>
</blockquote>
<h2>🛠️ Step 1: The WPA Supplicant Template</h2>
<p>Instead of hardcoding the interface, we’ll use a <strong>systemd template</strong>. This is cleaner and more modular.</p>
<p>Create the template file:</p>
<pre><code class="hljs language-bash">nano /etc/systemd/system/wpa_supplicant@.service
</code></pre>
<p>Paste this configuration (the <code>%i</code> will automatically become our interface name):</p>
<pre><code class="hljs language-bash">[Unit]
Description=WPA supplicant <span class="hljs-keyword">for</span> %i
After=network-pre.target
Wants=network-pre.target

[Service]
ExecStart=/sbin/wpa_supplicant -i %i -c /etc/wpa_supplicant/wpa_supplicant.conf
Restart=always

[Install]
WantedBy=multi-user.target
</code></pre>
<h2>🛠️ Step 2: The DHCP Client Template</h2>
<p>Next, we create a matching template for the DHCP client that <strong>explicitly waits</strong> for the Wi-Fi authentication to succeed.</p>
<pre><code class="hljs language-bash">nano /etc/systemd/system/dhclient@.service
</code></pre>
<pre><code class="hljs language-bash">[Unit]
Description=DHCP Client <span class="hljs-keyword">for</span> %i
Requires=wpa_supplicant@%i.service
After=wpa_supplicant@%i.service

[Service]
ExecStart=/sbin/dhclient %i
Type=forking

[Install]
WantedBy=multi-user.target
</code></pre>
<h2>🚀 Step 3: Enabling the Services</h2>
<p>Now we tell systemd to manage <code>wlo1</code> specifically using our new templates:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Reload systemd to see the new files</span>
systemctl daemon-reload

<span class="hljs-comment"># Enable and start the services for wlo1</span>
systemctl <span class="hljs-built_in">enable</span> wpa_supplicant@wlo1
systemctl <span class="hljs-built_in">enable</span> dhclient@wlo1

systemctl start wpa_supplicant@wlo1
systemctl start dhclient@wlo1
</code></pre>
<h2>🏁 The Victory Lap</h2>
<p>After applying this, reboot your host and check the status:</p>
<pre><code class="hljs language-bash">systemctl status dhclient@wlo1
</code></pre>
<p>If everything is working, you’ll see that <code>dhclient</code> waited patiently for <code>wpa_supplicant</code> to authenticate before grabbing its lease. No more manual commands, no more race conditions—just a server that comes back online exactly the way it should.</p>
<p>Now, your host is truly stable enough to start handling Part 2: <strong>The Bridge That Wasn’t</strong>.</p>
`,s={id:e,slug:t,frontmatter:n,readingTime:o,content:a};export{a as content,s as default,n as frontmatter,e as id,o as readingTime,t as slug};
