const s="2024-11-24-wifi-recovery-script",n="wifi-recovery-script",e={title:"Wifi Recovery Script",date:"2024-11-24",author:"jabez007",tags:["homelab","bash","NetworkManager","linux","wifi","automation","troubleshooting","self-healing","ssh","scripting"],excerpt:`Ever had that moment when you SSH into your homelab server only to get... nothing? Dead silence.
Your trusty old laptop-turned-server has ghosted you again.
If you're running a homelab on repurposed hardware (guilty as charged), you've probably been there.
`,featured:!1,draft:!1},a=5,t=`<h1>How I Built a Self-Healing WiFi Script for My Flaky Homelab Server</h1>
<p>Ever had that moment when you SSH into your homelab server only to get… nothing?
Dead silence.
Your trusty old laptop-turned-server has ghosted you again.</p>
<p>If you’re running a homelab on repurposed hardware (guilty as charged), you’ve probably been there.
My old ThinkPad running Bodhi Linux had one job: stay connected to WiFi so I could SSH in whenever I needed.
But every time my router rebooted overnight for firmware updates, this stubborn machine would just… give up.
NetworkManager would throw in the towel instead of reconnecting when the network came back up.</p>
<p>Time for some automated revenge.</p>
<hr>
<h2>🔍 The Real Problem</h2>
<p>Here’s what I discovered was happening:</p>
<ol>
<li>Router reboots overnight (thanks, auto-updates)</li>
<li>WiFi network goes down temporarily</li>
<li>When network comes back up, NetworkManager just sits there</li>
<li>My laptop keeps the <code>wlp2s0</code> interface up but with no IP address</li>
<li>I discover this hours later when SSH fails</li>
</ol>
<p>The kicker?
A simple <code>sudo systemctl restart NetworkManager</code> always fixed it instantly.
So why couldn’t the system do this itself?</p>
<blockquote>
<p><strong>Plot twist</strong>:
It can.
We just have to teach it how.</p>
</blockquote>
<hr>
<h2>🛠️ The Solution: A Self-Healing Script</h2>
<p>The strategy is dead simple: check if the WiFi interface has an IP address every few minutes.
No IP?
Kick NetworkManager in the pants.</p>
<p>Here’s the script that saved my sanity.
Save this to <code>/usr/local/bin/check_wifi.sh</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/bash</span>

<span class="hljs-comment"># Configuration - adjust these for your setup</span>
WIFI_INTERFACE=<span class="hljs-string">&quot;wlp2s0&quot;</span>  <span class="hljs-comment"># Find yours with: ip link show</span>
LOG_FILE=<span class="hljs-string">&quot;/var/log/wifi_recovery.log&quot;</span>

<span class="hljs-comment"># Function to log with timestamps (because debugging is easier with context)</span>
<span class="hljs-function"><span class="hljs-title">log_message</span></span>() {
    <span class="hljs-built_in">local</span> message=<span class="hljs-string">&quot;<span class="hljs-variable">$1</span>&quot;</span>
    <span class="hljs-built_in">printf</span> <span class="hljs-string">&quot;%s: %s\\\\n&quot;</span> <span class="hljs-string">&quot;<span class="hljs-subst">$(date &#x27;+%Y-%m-%d %H:%M:%S&#x27;)</span>&quot;</span> <span class="hljs-string">&quot;<span class="hljs-variable">$message</span>&quot;</span> &gt;&gt; <span class="hljs-string">&quot;<span class="hljs-variable">$LOG_FILE</span>&quot;</span>
}

<span class="hljs-comment"># The main event: check WiFi status and fix if broken</span>
<span class="hljs-function"><span class="hljs-title">check_wifi_and_restart</span></span>() {
    <span class="hljs-comment"># Extract IP address from the interface (grep magic)</span>
    <span class="hljs-built_in">local</span> ip; ip=$(ip addr show <span class="hljs-string">&quot;<span class="hljs-variable">$WIFI_INTERFACE</span>&quot;</span> | grep -Po <span class="hljs-string">&#x27;inet \\\\K[\\\\d.]+&#x27;</span>)

    <span class="hljs-keyword">if</span> [[ -z <span class="hljs-string">&quot;<span class="hljs-variable">$ip</span>&quot;</span> ]]; <span class="hljs-keyword">then</span>
        log_message <span class="hljs-string">&quot;🚨 No IP address on <span class="hljs-variable">$WIFI_INTERFACE</span>. Attempting rescue...&quot;</span>

        <span class="hljs-comment"># Restart NetworkManager and log the result</span>
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">sudo</span> /usr/bin/systemctl restart NetworkManager; <span class="hljs-keyword">then</span>
            log_message <span class="hljs-string">&quot;✅ NetworkManager restarted successfully&quot;</span>
            <span class="hljs-built_in">sleep</span> 10  <span class="hljs-comment"># Give it a moment to reconnect</span>

            <span class="hljs-comment"># Check if we got an IP back</span>
            <span class="hljs-built_in">local</span> new_ip; new_ip=$(ip addr show <span class="hljs-string">&quot;<span class="hljs-variable">$WIFI_INTERFACE</span>&quot;</span> | grep -Po <span class="hljs-string">&#x27;inet \\\\K[\\\\d.]+&#x27;</span>)
            <span class="hljs-keyword">if</span> [[ -n <span class="hljs-string">&quot;<span class="hljs-variable">$new_ip</span>&quot;</span> ]]; <span class="hljs-keyword">then</span>
                log_message <span class="hljs-string">&quot;🎉 WiFi recovered! New IP: <span class="hljs-variable">$new_ip</span>&quot;</span>
            <span class="hljs-keyword">else</span>
                log_message <span class="hljs-string">&quot;⚠️  NetworkManager restarted but no IP assigned yet&quot;</span>
            <span class="hljs-keyword">fi</span>
        <span class="hljs-keyword">else</span>
            log_message <span class="hljs-string">&quot;❌ Failed to restart NetworkManager&quot;</span>
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">else</span>
        log_message <span class="hljs-string">&quot;✓ WiFi healthy with IP: <span class="hljs-variable">$ip</span>&quot;</span>
    <span class="hljs-keyword">fi</span>
}

<span class="hljs-comment"># Execute the check</span>
check_wifi_and_restart
</code></pre>
<p>Make it executable:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> +x /usr/local/bin/check_wifi.sh
</code></pre>
<blockquote>
<p><strong>Pro tip</strong>:
Test it manually first by temporarily disconnecting your WiFi to make sure it works before automating it.</p>
</blockquote>
<hr>
<h2>🔐 The Sudo Setup (Do This Right)</h2>
<p>We need the script to restart NetworkManager without asking for a password.
Here’s how to do it <strong>securely</strong>:</p>
<ol>
<li>
<p>Edit the sudoers file (never edit <code>/etc/sudoers</code> directly):</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> visudo
</code></pre>
</li>
<li>
<p>Add this line, replacing <code>jabez</code> with your actual username:</p>
<pre><code>jabez ALL = NOPASSWD: /usr/bin/systemctl restart NetworkManager
</code></pre>
</li>
<li>
<p>Save and test:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> /usr/bin/systemctl restart NetworkManager
</code></pre>
</li>
</ol>
<blockquote>
<p><strong>Security note</strong>:
This only grants password-free access to restart NetworkManager specifically, not blanket sudo access.</p>
</blockquote>
<hr>
<h2>⏰ Automation: Set It and Forget It</h2>
<p>Now for the magic - make it run automatically every 5 minutes:</p>
<pre><code class="hljs language-bash">crontab -e
</code></pre>
<p>Add this line:</p>
<pre><code>*/5 * * * * /usr/local/bin/check_wifi.sh
</code></pre>
<blockquote>
<p><strong>Why 5 minutes?</strong>
It’s frequent enough to catch issues quickly but not so aggressive that it spams your logs.
Adjust to taste.</p>
</blockquote>
<p>Make sure cron is actually running:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl <span class="hljs-built_in">enable</span> cron
<span class="hljs-built_in">sudo</span> systemctl start cron
</code></pre>
<hr>
<h2>📊 Monitoring Your WiFi Health</h2>
<p>Watch your script in action:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Live log monitoring</span>
<span class="hljs-built_in">tail</span> -f /var/log/wifi_recovery.log

<span class="hljs-comment"># Check recent activity</span>
<span class="hljs-built_in">tail</span> -20 /var/log/wifi_recovery.log
</code></pre>
<p>A healthy log looks like:</p>
<pre><code>2024-06-27 14:30:01: ✓ WiFi healthy with IP: 192.168.1.100
2024-06-27 14:35:01: ✓ WiFi healthy with IP: 192.168.1.100
2024-06-27 14:40:01: 🚨 No IP address on wlp2s0. Attempting rescue...
2024-06-27 14:40:02: ✅ NetworkManager restarted successfully
2024-06-27 14:40:12: 🎉 WiFi recovered! New IP: 192.168.1.100
</code></pre>
<hr>
<h2>🛡️ Troubleshooting &amp; Edge Cases</h2>
<p><strong>Script not running?</strong> Check if cron is active:</p>
<pre><code class="hljs language-bash">systemctl status cron
</code></pre>
<p><strong>Permission issues with log file?</strong> Change the log path in the script to your home directory:</p>
<pre><code class="hljs language-bash">LOG_FILE=<span class="hljs-string">&quot;<span class="hljs-variable">$HOME</span>/wifi_recovery.log&quot;</span>
</code></pre>
<p><strong>Need to find your WiFi interface name?</strong></p>
<pre><code class="hljs language-bash">ip <span class="hljs-built_in">link</span> show | grep -E <span class="hljs-string">&quot;wl|en&quot;</span>
</code></pre>
<p><strong>Want more aggressive monitoring?</strong> Change the cron to run every minute:</p>
<pre><code class="hljs language-bash">* * * * * /usr/local/bin/check_wifi.sh
</code></pre>
<hr>
<h2>🎯 The Results</h2>
<p>Since implementing this script three months ago:</p>
<ul>
<li><strong>Zero</strong> manual WiFi interventions needed</li>
<li>My homelab server has maintained 99.9% SSH availability</li>
<li>Router reboots no longer mean lost connections</li>
<li>I can actually trust this machine for automated tasks</li>
</ul>
<p>The best part?
The script has triggered exactly 23 times according to my logs - meaning it prevented 23 instances where I would have discovered a dead connection hours later.</p>
<hr>
<h2>🚀 Beyond WiFi: The Bigger Picture</h2>
<p>This approach works for any flaky service that just needs a periodic kick.
I’ve adapted similar scripts for:</p>
<ul>
<li>Monitoring Docker containers that occasionally crash</li>
<li>Restarting SSH daemon when it gets hung up</li>
<li>Checking VPN connections on remote systems</li>
</ul>
<p>The pattern is always the same: <strong>monitor → detect → fix → log</strong>.</p>
<hr>
<h2>💡 Final Thoughts</h2>
<p>Sometimes the simplest solutions are the most elegant.
A 30-line Bash script solved what weeks of tweaking NetworkManager configs couldn’t fix.</p>
<p>Your homelab doesn’t have to be enterprise-grade hardware to be reliable.
Sometimes it just needs a little automation love.</p>
<p>Now my old ThinkPad happily chugs along, automatically healing itself whenever my router decides to take a midnight reboot.
And I can focus on more interesting problems than “why is SSH not working again?”</p>
<p><strong>Happy homelabbing, and may your wifi always reconnect itself.</strong></p>
`,o={id:s,slug:n,frontmatter:e,readingTime:a,content:t};export{t as content,o as default,e as frontmatter,s as id,a as readingTime,n as slug};
